<?php
/**
 * Optimization log table + analytics queries.
 *
 * @since      0.0.1
 *
 * @package    captain-media-shield
 * @subpackage captain-media-shield/includes/core
 */

/**
 * Exit if accessed directly.
 * */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared -- this class is the only data layer for the plugin's own custom table; the table name is built from $wpdb->prefix and never from user input, and the figures are read live for the dashboard.

if ( ! class_exists( 'Capms_Stats' ) ) {

	/**
	 * One row per attachment in `{prefix}capms_media` - what was done to
	 * it, sizes before/after, and where its backup lives. Analytics,
	 * bulk queue, restore and backup retention all read from here.
	 *
	 * @since 0.0.1
	 */
	class Capms_Stats {

		/**
		 * Full table name.
		 *
		 * @since 0.0.1
		 * @return string
		 */
		public static function table() {
			global $wpdb;
			return $wpdb->prefix . 'capms_media';
		}

		/**
		 * Create / update the table.
		 *
		 * @since 0.0.1
		 * @return void
		 */
		public static function create_table() {
			global $wpdb;

			$table_name      = self::table();
			$charset_collate = $wpdb->get_charset_collate();

			$sql = "CREATE TABLE $table_name (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				attachment_id BIGINT UNSIGNED NOT NULL,
				media_type VARCHAR(10) NOT NULL DEFAULT 'image',
				status VARCHAR(20) NOT NULL DEFAULT 'optimized',
				original_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
				optimized_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
				webp_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
				avif_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
				webm_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
				backup_path TEXT NULL,
				backup_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
				backup_created DATETIME NULL DEFAULT NULL,
				message TEXT NULL,
				processed_at DATETIME NOT NULL,
				PRIMARY KEY (id),
				UNIQUE KEY attachment_id (attachment_id),
				KEY status (status),
				KEY media_type (media_type)
			) $charset_collate;";

			require_once ABSPATH . 'wp-admin/includes/upgrade.php';
			dbDelta( $sql );
		}

		/**
		 * Insert or update the row for an attachment.
		 *
		 * @since 0.0.1
		 * @param int   $attachment_id Attachment ID.
		 * @param array $data          Column => value.
		 * @return void
		 */
		public static function save( $attachment_id, $data ) {
			global $wpdb;

			$allowed = array( 'media_type', 'status', 'original_size', 'optimized_size', 'webp_size', 'avif_size', 'webm_size', 'backup_path', 'backup_size', 'backup_created', 'message' );
			$row     = array_intersect_key( $data, array_flip( $allowed ) );

			$row['attachment_id'] = absint( $attachment_id );
			$row['processed_at']  = current_time( 'mysql', true );

			$existing = self::get( $attachment_id );
			if ( $existing ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->update( self::table(), $row, array( 'attachment_id' => absint( $attachment_id ) ) );
			} else {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->insert( self::table(), $row );
			}

			wp_cache_delete( 'capms_stats_summary', 'capms' );
		}

		/**
		 * Get the row for an attachment.
		 *
		 * @since 0.0.1
		 * @param int $attachment_id Attachment ID.
		 * @return array|null
		 */
		public static function get( $attachment_id ) {
			global $wpdb;
			$table = self::table();
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			return $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE attachment_id = %d", absint( $attachment_id ) ), ARRAY_A );
		}

		/**
		 * Delete the row for an attachment.
		 *
		 * @since 0.0.1
		 * @param int $attachment_id Attachment ID.
		 * @return void
		 */
		public static function delete( $attachment_id ) {
			global $wpdb;
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->delete( self::table(), array( 'attachment_id' => absint( $attachment_id ) ), array( '%d' ) );
			wp_cache_delete( 'capms_stats_summary', 'capms' );
		}

		/**
		 * Clear backup columns for an attachment once its backup is gone.
		 *
		 * @since 0.0.1
		 * @param int $attachment_id Attachment ID.
		 * @return void
		 */
		public static function clear_backup( $attachment_id ) {
			global $wpdb;
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->update(
				self::table(),
				array(
					'backup_path'    => null,
					'backup_size'    => 0,
					'backup_created' => null,
				),
				array( 'attachment_id' => absint( $attachment_id ) )
			);
		}

		/**
		 * Rows whose backup is older than $seconds.
		 *
		 * @since 0.0.1
		 * @param int $seconds Age in seconds.
		 * @param int $limit   Max rows.
		 * @return array
		 */
		public static function get_expired_backups( $seconds, $limit = 200 ) {
			global $wpdb;
			$table  = self::table();
			$cutoff = gmdate( 'Y-m-d H:i:s', time() - absint( $seconds ) );
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			return $wpdb->get_results( $wpdb->prepare( "SELECT attachment_id, backup_path FROM {$table} WHERE backup_path IS NOT NULL AND backup_path <> '' AND backup_created <= %s LIMIT %d", $cutoff, absint( $limit ) ), ARRAY_A );
		}

		/**
		 * Every row that still has a backup.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		public static function get_all_backups() {
			global $wpdb;
			$table = self::table();
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			return $wpdb->get_results( "SELECT attachment_id, backup_path FROM {$table} WHERE backup_path IS NOT NULL AND backup_path <> ''", ARRAY_A );
		}

		/**
		 * Aggregated analytics.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		public static function get_summary() {
			global $wpdb;

			$cached = wp_cache_get( 'capms_stats_summary', 'capms' );
			if ( false !== $cached ) {
				return $cached;
			}

			$table = self::table();
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$rows = $wpdb->get_results(
				"SELECT media_type,
					COUNT(*) AS processed,
					SUM(original_size) AS original_size,
					SUM(optimized_size) AS optimized_size,
					SUM(webp_size) AS webp_size,
					SUM(avif_size) AS avif_size,
					SUM(webm_size) AS webm_size,
					SUM(CASE WHEN webp_size > 0 THEN 1 ELSE 0 END) AS webp_count,
					SUM(CASE WHEN avif_size > 0 THEN 1 ELSE 0 END) AS avif_count,
					SUM(CASE WHEN webm_size > 0 THEN 1 ELSE 0 END) AS webm_count
				FROM {$table} WHERE status = 'optimized' GROUP BY media_type",
				ARRAY_A
			);

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$backup = $wpdb->get_row( "SELECT COUNT(*) AS files, COALESCE(SUM(backup_size),0) AS bytes FROM {$table} WHERE backup_path IS NOT NULL AND backup_path <> ''", ARRAY_A );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$status_counts = $wpdb->get_results( "SELECT status, COUNT(*) AS total FROM {$table} GROUP BY status", OBJECT_K );

			$by_type = array(
				'image' => array(),
				'video' => array(),
			);
			$totals  = array(
				'processed'      => 0,
				'original_size'  => 0,
				'optimized_size' => 0,
				'nextgen_saved'  => 0,
			);

			foreach ( (array) $rows as $row ) {
				$type = 'video' === $row['media_type'] ? 'video' : 'image';
				$data = array_map( 'intval', $row );

				$by_type[ $type ] = $data;

				$totals['processed']      += $data['processed'];
				$totals['original_size']  += $data['original_size'];
				$totals['optimized_size'] += $data['optimized_size'];
			}

			$saved = max( 0, $totals['original_size'] - $totals['optimized_size'] );
			$ratio = $totals['original_size'] > 0 ? round( ( $saved / $totals['original_size'] ) * 100, 1 ) : 0;

			$summary = array(
				'processed'      => $totals['processed'],
				'original_size'  => $totals['original_size'],
				'optimized_size' => $totals['optimized_size'],
				'saved_bytes'    => $saved,
				'saved_human'    => size_format( $saved, 2 ) ? size_format( $saved, 2 ) : '0 B',
				'ratio'          => $ratio,
				'images'         => $by_type['image'],
				'videos'         => $by_type['video'],
				'backup_files'   => isset( $backup['files'] ) ? (int) $backup['files'] : 0,
				'backup_bytes'   => isset( $backup['bytes'] ) ? (int) $backup['bytes'] : 0,
				'backup_human'   => size_format( isset( $backup['bytes'] ) ? (int) $backup['bytes'] : 0, 2 ) ? size_format( (int) $backup['bytes'], 2 ) : '0 B',
				'skipped'        => isset( $status_counts['skipped'] ) ? (int) $status_counts['skipped']->total : 0,
				'failed'         => isset( $status_counts['failed'] ) ? (int) $status_counts['failed']->total : 0,
				'queued'         => isset( $status_counts['queued'] ) ? (int) $status_counts['queued']->total : 0,
			);

			wp_cache_set( 'capms_stats_summary', $summary, 'capms', MINUTE_IN_SECONDS );

			return $summary;
		}

		/**
		 * Most recently processed rows (for the dashboard activity list).
		 *
		 * @since 0.0.1
		 * @param int $limit Rows.
		 * @return array
		 */
		public static function get_recent( $limit = 8 ) {
			global $wpdb;
			$table = self::table();
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$rows = $wpdb->get_results( $wpdb->prepare( "SELECT attachment_id, media_type, status, original_size, optimized_size, webp_size, avif_size, webm_size, message, processed_at FROM {$table} ORDER BY processed_at DESC LIMIT %d", absint( $limit ) ), ARRAY_A );

			foreach ( (array) $rows as &$row ) {
				$row['title']     = get_the_title( (int) $row['attachment_id'] );
				$row['thumb']     = 'image' === $row['media_type'] ? wp_get_attachment_image_url( (int) $row['attachment_id'], 'thumbnail' ) : '';
				$row['edit_link'] = get_edit_post_link( (int) $row['attachment_id'], 'raw' );
			}

			return (array) $rows;
		}
	}
}

// phpcs:enable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared
