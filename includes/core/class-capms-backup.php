<?php
/**
 * Original-file backup, restore and retention cleanup.
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

if ( ! class_exists( 'Capms_Backup' ) ) {

	/**
	 * Backups mirror the uploads structure inside
	 * wp-content/uploads/captain-ms-backups/ - e.g. 2026/10/photo.jpg is kept
	 * as captain-ms-backups/2026/10/photo.jpg - so a restore is just a copy
	 * back. Paths stored in the DB are relative to the backup root, never
	 * absolute, so moving the site doesn't break restores.
	 *
	 * @since 0.0.1
	 */
	class Capms_Backup {

		/**
		 * Absolute backup root (no trailing slash).
		 *
		 * @since 0.0.1
		 * @return string
		 */
		public static function get_root() {
			$uploads = wp_get_upload_dir();
			$base    = untrailingslashit( $uploads['basedir'] );
			$root    = $base . '/' . CAPMS_BACKUP_DIR_NAME;

			// One-time move of backups made before the folder was renamed.
			// DB paths are relative to the backup root, so a plain rename keeps
			// every existing restore working.
			static $migrated = false;
			if ( ! $migrated ) {
				$migrated = true;
				$legacy   = $base . '/' . CAPMS_LEGACY_BACKUP_DIR_NAME;
				if ( is_dir( $legacy ) && ! file_exists( $root ) ) {
					@rename( $legacy, $root ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.rename_rename
				}
			}

			return $root;
		}

		/**
		 * Create the backup root and lock it down from direct web access.
		 *
		 * @since 0.0.1
		 * @return bool
		 */
		public static function ensure_root() {
			$root = self::get_root();
			if ( ! wp_mkdir_p( $root ) ) {
				return false;
			}

			if ( ! file_exists( $root . '/index.php' ) ) {
				file_put_contents( $root . '/index.php', "<?php\n// Silence is golden.\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			}
			if ( ! file_exists( $root . '/.htaccess' ) ) {
				file_put_contents( $root . '/.htaccess', "Options -Indexes\n<IfModule mod_authz_core.c>\n\tRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n\tDeny from all\n</IfModule>\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			}

			return true;
		}

		/**
		 * Path of a file relative to the uploads basedir.
		 *
		 * @since 0.0.1
		 * @param string $file Absolute path.
		 * @return string|false
		 */
		public static function relative_to_uploads( $file ) {
			$uploads = wp_get_upload_dir();
			$base    = wp_normalize_path( trailingslashit( $uploads['basedir'] ) );
			$file    = wp_normalize_path( $file );

			if ( 0 !== strpos( $file, $base ) ) {
				return false;
			}
			return ltrim( substr( $file, strlen( $base ) ), '/' );
		}

		/**
		 * Absolute path of a stored (relative) backup path, validated to
		 * stay inside the backup root.
		 *
		 * @since 0.0.1
		 * @param string $relative Relative backup path.
		 * @return string|false
		 */
		public static function absolute( $relative ) {
			$relative = ltrim( wp_normalize_path( (string) $relative ), '/' );
			if ( '' === $relative || false !== strpos( $relative, '..' ) ) {
				return false;
			}
			return self::get_root() . '/' . $relative;
		}

		/**
		 * Copy a file into the backup folder (no-op if already backed up).
		 *
		 * @since 0.0.1
		 * @param string $file Absolute path of the original.
		 * @return string|false Relative backup path, or false.
		 */
		public static function backup_file( $file ) {
			if ( ! $file || ! is_file( $file ) || ! self::ensure_root() ) {
				return false;
			}

			$relative = self::relative_to_uploads( $file );
			if ( false === $relative ) {
				return false;
			}

			$dest = self::get_root() . '/' . $relative;
			if ( is_file( $dest ) ) {
				return $relative;
			}

			if ( ! wp_mkdir_p( dirname( $dest ) ) || ! @copy( $file, $dest ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				return false;
			}

			return $relative;
		}

		/**
		 * Restore the original of an attachment.
		 *
		 * Copies the backup back over the live file, removes every
		 * generated WebP/AVIF/WebM sibling, regenerates thumbnails from the
		 * untouched original (without re-optimizing it) and marks the row
		 * as restored.
		 *
		 * @since 0.0.1
		 * @param int $attachment_id Attachment ID.
		 * @return true|WP_Error
		 */
		public static function restore( $attachment_id ) {
			$row = Capms_Stats::get( $attachment_id );
			if ( ! $row || empty( $row['backup_path'] ) ) {
				return new WP_Error( 'capms_no_backup', __( 'No backup exists for this file.', 'captain-media-shield' ) );
			}

			$backup = self::absolute( $row['backup_path'] );
			if ( ! $backup || ! is_file( $backup ) ) {
				Capms_Stats::clear_backup( $attachment_id );
				return new WP_Error( 'capms_backup_missing', __( 'The backup file is missing from the server.', 'captain-media-shield' ) );
			}

			$file = get_attached_file( $attachment_id );
			if ( ! $file ) {
				return new WP_Error( 'capms_no_file', __( 'Attachment file path not found.', 'captain-media-shield' ) );
			}

			// The backup keeps its original upload path. If WordPress later
			// renamed the live file (e.g. "-scaled"), restore to the backup's
			// own name and point the attachment back at it.
			$uploads     = wp_get_upload_dir();
			$target      = trailingslashit( $uploads['basedir'] ) . $row['backup_path'];
			$is_image    = 'image' === $row['media_type'];
			$old_meta    = wp_get_attachment_metadata( $attachment_id );

			Capms_Processor::remove_generated_files( $attachment_id, $file, $old_meta );

			if ( ! wp_mkdir_p( dirname( $target ) ) || ! @copy( $backup, $target ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				return new WP_Error( 'capms_copy_failed', __( 'Could not copy the backup back into place. Check folder permissions.', 'captain-media-shield' ) );
			}

			if ( wp_normalize_path( $target ) !== wp_normalize_path( $file ) ) {
				wp_delete_file( $file );
				update_attached_file( $attachment_id, $target );
			}

			if ( $is_image ) {
				// Remove the old intermediate sizes - they are regenerated
				// from the restored original right below.
				if ( ! empty( $old_meta['sizes'] ) && is_array( $old_meta['sizes'] ) ) {
					$dir = trailingslashit( dirname( $file ) );
					foreach ( $old_meta['sizes'] as $size ) {
						if ( ! empty( $size['file'] ) ) {
							wp_delete_file( $dir . $size['file'] );
						}
					}
				}

				require_once ABSPATH . 'wp-admin/includes/image.php';
				Capms_Processor::$skip_processing = true;
				$meta                             = wp_generate_attachment_metadata( $attachment_id, $target );
				Capms_Processor::$skip_processing = false;
				wp_update_attachment_metadata( $attachment_id, $meta );
			} else {
				require_once ABSPATH . 'wp-admin/includes/media.php';
				$fresh = wp_read_video_metadata( $target );
				$meta  = is_array( $fresh ) ? array_merge( is_array( $old_meta ) ? $old_meta : array(), $fresh ) : (array) $old_meta;

				$meta['filesize'] = filesize( $target );
				wp_update_attachment_metadata( $attachment_id, $meta );
			}

			wp_delete_file( $backup );

			Capms_Stats::save(
				$attachment_id,
				array(
					'status'         => 'restored',
					'optimized_size' => (int) $row['original_size'],
					'webp_size'      => 0,
					'avif_size'      => 0,
					'webm_size'      => 0,
					'backup_path'    => null,
					'backup_size'    => 0,
					'backup_created' => null,
					'message'        => __( 'Original restored.', 'captain-media-shield' ),
				)
			);
			delete_post_meta( $attachment_id, '_capms_optimized' );

			return true;
		}

		/**
		 * Delete the backup of one attachment.
		 *
		 * @since 0.0.1
		 * @param int    $attachment_id Attachment ID.
		 * @param string $relative      Stored relative path (optional).
		 * @return void
		 */
		public static function delete_backup( $attachment_id, $relative = '' ) {
			if ( '' === $relative ) {
				$row      = Capms_Stats::get( $attachment_id );
				$relative = $row && ! empty( $row['backup_path'] ) ? $row['backup_path'] : '';
			}

			$abs = $relative ? self::absolute( $relative ) : false;
			if ( $abs && is_file( $abs ) ) {
				wp_delete_file( $abs );
			}

			Capms_Stats::clear_backup( $attachment_id );
		}

		/**
		 * Delete backups older than the configured retention. Called by
		 * WP-Cron every hour.
		 *
		 * @since 0.0.1
		 * @return int Number of backups removed.
		 */
		public static function cleanup_expired() {
			$seconds = Capms_Settings::get_retention_seconds();
			if ( $seconds < 0 ) {
				return 0;
			}

			$removed = 0;
			do {
				$rows = Capms_Stats::get_expired_backups( $seconds, 200 );
				foreach ( $rows as $row ) {
					self::delete_backup( (int) $row['attachment_id'], $row['backup_path'] );
					++$removed;
				}
			} while ( count( $rows ) === 200 );

			if ( $removed ) {
				wp_cache_delete( 'capms_stats_summary', 'capms' );
			}

			return $removed;
		}

		/**
		 * Purge every backup (the "Purge All Backups Now" button).
		 *
		 * Also sweeps orphan files in the backup folder that no DB row
		 * points to (e.g. left over from an interrupted upload).
		 *
		 * @since 0.0.1
		 * @return array { files: int, bytes: int }
		 */
		public static function purge_all() {
			$files = 0;
			$bytes = 0;

			foreach ( Capms_Stats::get_all_backups() as $row ) {
				Capms_Stats::clear_backup( (int) $row['attachment_id'] );
			}

			$root = self::get_root();
			if ( is_dir( $root ) ) {
				$iterator = new RecursiveIteratorIterator(
					new RecursiveDirectoryIterator( $root, FilesystemIterator::SKIP_DOTS ),
					RecursiveIteratorIterator::CHILD_FIRST
				);
				foreach ( $iterator as $item ) {
					$path = $item->getPathname();
					if ( $item->isDir() ) {
						@rmdir( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
						continue;
					}
					$name = $item->getFilename();
					if ( dirname( $path ) === $root && in_array( $name, array( 'index.php', '.htaccess' ), true ) ) {
						continue;
					}
					$bytes += (int) $item->getSize();
					wp_delete_file( $path );
					++$files;
				}
			}

			wp_cache_delete( 'capms_stats_summary', 'capms' );

			return array(
				'files' => $files,
				'bytes' => $bytes,
			);
		}

		/**
		 * Real on-disk size of the backup folder.
		 *
		 * @since 0.0.1
		 * @return array { files: int, bytes: int }
		 */
		public static function get_disk_usage() {
			$files = 0;
			$bytes = 0;
			$root  = self::get_root();

			if ( is_dir( $root ) ) {
				$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $root, FilesystemIterator::SKIP_DOTS ) );
				foreach ( $iterator as $item ) {
					if ( $item->isFile() && ! in_array( $item->getFilename(), array( 'index.php', '.htaccess' ), true ) ) {
						++$files;
						$bytes += (int) $item->getSize();
					}
				}
			}

			return array(
				'files' => $files,
				'bytes' => $bytes,
			);
		}
	}
}
