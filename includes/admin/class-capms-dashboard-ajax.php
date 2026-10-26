<?php
/**
 * Captain Media Shield Dashboard Ajax
 *
 * @package    captain-media-shield
 * @subpackage captain-media-shield/includes/admin
 **/

/**
 * Exit if accessed directly.
 * */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capms_Dashboard_Ajax' ) ) {

	/**
	 * Single AJAX entry point for the React admin app. Every request is
	 * nonce + capability checked before the `type` switch runs.
	 *
	 * @since 0.0.1
	 */
	class Capms_Dashboard_Ajax {

		/**
		 * Member Variable
		 *
		 * @var instance
		 */
		private static $instance;

		/**
		 *  Initiator
		 */
		public static function get_instance() {
			if ( ! isset( self::$instance ) ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Define the core functionality of the plugin.
		 *
		 * @since 0.0.1
		 */
		public function __construct() {
			add_action( 'wp_ajax_capms_dashboard_ajax_call', array( $this, 'capms_dashboard_ajax_call' ) );
		}

		/**
		 * Router.
		 *
		 * @since 0.0.1
		 */
		public function capms_dashboard_ajax_call() {
			if ( ! check_ajax_referer( 'capms_nonce', 'nonce', false ) ) {
				wp_send_json( $this->capms_set_response( false, esc_html__( 'Invalid nonce.', 'captain-media-shield' ), esc_html__( 'The security check failed. Please refresh the page and try again.', 'captain-media-shield' ) ) );
			}

			if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
				wp_send_json( $this->capms_set_response( false, esc_html__( 'Invalid Permission.', 'captain-media-shield' ), esc_html__( 'You do not have permission to do this.', 'captain-media-shield' ) ) );
			}

			$type = isset( $_POST['type'] ) ? sanitize_key( wp_unslash( $_POST['type'] ) ) : '';

			switch ( $type ) {
				case 'get_settings':
					$response = $this->get_settings();
					break;
				case 'save_settings':
					$response = $this->save_settings();
					break;
				case 'get_stats':
					$response = $this->get_stats();
					break;
				case 'get_environment':
					$response = $this->get_environment();
					break;
				case 'get_bulk_queue':
					$response = $this->get_bulk_queue();
					break;
				case 'bulk_process_item':
					$response = $this->bulk_process_item();
					break;
				case 'purge_backups':
					$response = $this->purge_backups();
					break;
				case 'run_cleanup':
					$response = $this->run_cleanup();
					break;
				case 'get_nginx_snippet':
					$response = $this->get_nginx_snippet();
					break;
				case 'cleanup_ids':
				case 'cleanup_scan':
				case 'cleanup_delete':
				case 'cleanup_clean_thumbs':
				case 'cleanup_duplicate_groups':
					$response = $this->cleanup_request( $type );
					break;
				default:
					$response = $this->capms_set_response( false, esc_html__( 'Invalid type.', 'captain-media-shield' ), esc_html__( 'Something went wrong.', 'captain-media-shield' ) );
					break;
			}

			wp_send_json( $response );
		}

		/**
		 * Settings + the capability flags the UI needs to lock options.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		private function get_settings() {
			return $this->capms_set_response(
				true,
				'',
				'',
				array(
					'settings' => Capms_Settings::get_all(),
					'defaults' => Capms_Settings::get_defaults(),
					'support'  => $this->get_support_flags(),
				)
			);
		}

		/**
		 * Save a partial settings object (JSON in `settings`).
		 *
		 * @since 0.0.1
		 * @return array
		 */
		private function save_settings() {
			$raw   = isset( $_POST['settings'] ) ? wp_unslash( $_POST['settings'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- nonce verified in router; JSON decoded then sanitized per key in Capms_Settings::sanitize().
			$input = json_decode( (string) $raw, true );

			if ( ! is_array( $input ) ) {
				return $this->capms_set_response( false, esc_html__( 'Invalid settings payload.', 'captain-media-shield' ) );
			}

			$saved = Capms_Settings::update( $input );

			$warning = '';
			if ( 'htaccess' === $saved['delivery_method'] && ! Capms_Environment::is_apache() ) {
				$warning = __( 'Your server does not look like Apache/LiteSpeed - .htaccess rewrites may be ignored. Consider the <picture> tag method.', 'captain-media-shield' );
			} elseif ( 'htaccess' === $saved['delivery_method'] && ( $saved['webp_enabled'] || $saved['avif_enabled'] ) && ! Capms_Delivery::htaccess_active() ) {
				$warning = __( 'Could not write uploads/.htaccess - check file permissions.', 'captain-media-shield' );
			}

			return $this->capms_set_response(
				true,
				__( 'Settings saved.', 'captain-media-shield' ),
				$warning,
				array(
					'settings' => $saved,
					'support'  => $this->get_support_flags(),
				)
			);
		}

		/**
		 * What this server can do (drives disabled states in the UI).
		 *
		 * @since 0.0.1
		 * @return array
		 */
		private function get_support_flags() {
			return array(
				'webp'      => Capms_Environment::webp_supported(),
				'avif'      => Capms_Environment::avif_supported(),
				'ffmpeg'    => (bool) Capms_Environment::get_ffmpeg(),
				'exec'      => Capms_Environment::shell_function_available( 'exec' ),
				'apache'    => Capms_Environment::is_apache(),
				'htaccess'  => Capms_Delivery::htaccess_active(),
				'imagick'   => extension_loaded( 'imagick' ),
				'gd'        => function_exists( 'gd_info' ),
			);
		}

		/**
		 * Analytics.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		private function get_stats() {
			$disk = Capms_Backup::get_disk_usage();
			$last = get_option( 'capms_last_cleanup', array() );

			return $this->capms_set_response(
				true,
				'',
				'',
				array(
					'summary'      => Capms_Stats::get_summary(),
					'recent'       => Capms_Stats::get_recent( 8 ),
					'library'      => $this->count_library(),
					'backup_disk'  => array(
						'files' => $disk['files'],
						'bytes' => $disk['bytes'],
						'human' => size_format( $disk['bytes'], 2 ) ? size_format( $disk['bytes'], 2 ) : '0 B',
					),
					'cleanup_next' => Capms_Cron::next_run(),
					'cleanup_last' => $last,
					'now'          => time(),
				)
			);
		}

		/**
		 * Server health report.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		private function get_environment() {
			$refresh = ! empty( $_POST['refresh'] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified in router.
			if ( $refresh ) {
				delete_transient( 'capms_ffmpeg_path' );
				Capms_Environment::get_ffmpeg( true );
			}
			return $this->capms_set_response( true, '', '', Capms_Environment::get_report() );
		}

		/**
		 * Supported mime types (images + videos).
		 *
		 * @since 0.0.1
		 * @param string $which all|image|video.
		 * @return array
		 */
		private function get_mimes( $which = 'all' ) {
			return Capms_Processor::get_mimes( $which );
		}

		/**
		 * Library totals for the bulk screen.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		private function count_library() {
			global $wpdb;

			$counts = array();
			foreach ( array( 'image', 'video' ) as $type ) {
				$mimes        = $this->get_mimes( $type );
				$placeholders = implode( ',', array_fill( 0, count( $mimes ), '%s' ) );
				$table        = esc_sql( Capms_Stats::table() );

				// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
				$total = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(ID) FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_mime_type IN ($placeholders)", $mimes ) );

				// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
				$done = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(p.ID) FROM {$wpdb->posts} p INNER JOIN {$table} m ON m.attachment_id = p.ID WHERE p.post_type = 'attachment' AND p.post_mime_type IN ($placeholders) AND m.status = 'optimized'", $mimes ) );

				$counts[ $type ] = array(
					'total'     => $total,
					'optimized' => $done,
					'remaining' => max( 0, $total - $done ),
				);
			}

			return $counts;
		}

		/**
		 * IDs waiting for the bulk optimizer.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		private function get_bulk_queue() {
			// phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in router.
			$scope        = isset( $_POST['scope'] ) ? sanitize_key( wp_unslash( $_POST['scope'] ) ) : 'all';
			$retry_failed = ! empty( $_POST['retry_failed'] );
			// phpcs:enable

			return $this->capms_set_response(
				true,
				'',
				'',
				array(
					'ids'     => Capms_Processor::get_queue_ids( $scope, $retry_failed ),
					'library' => $this->count_library(),
				)
			);
		}

		/**
		 * Optimize one attachment from the bulk queue.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		private function bulk_process_item() {
			$id = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified in router.
			if ( ! $id || 'attachment' !== get_post_type( $id ) ) {
				return $this->capms_set_response( false, esc_html__( 'Invalid attachment.', 'captain-media-shield' ) );
			}

			if ( function_exists( 'set_time_limit' ) ) {
				@set_time_limit( 300 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			}
			wp_raise_memory_limit( 'image' );
			wp_clear_scheduled_hook( 'capms_process_video_event', array( $id ) );

			$result = Capms_Processor::get_instance()->process_attachment( $id );
			$title  = get_the_title( $id );

			if ( is_wp_error( $result ) ) {
				Capms_Stats::save(
					$id,
					array(
						'media_type' => 0 === strpos( (string) get_post_mime_type( $id ), 'video/' ) ? 'video' : 'image',
						'status'     => 'failed',
						'message'    => $result->get_error_message(),
					)
				);
				return $this->capms_set_response(
					false,
					$result->get_error_message(),
					'',
					array(
						'id'    => $id,
						'title' => $title,
					)
				);
			}

			return $this->capms_set_response(
				true,
				'',
				'',
				array(
					'id'    => $id,
					'title' => $title,
					'row'   => $result,
				)
			);
		}

		/**
		 * Nginx rules for AVIF / WebP delivery.
		 *
		 * @since 0.1.0
		 * @return array
		 */
		private function get_nginx_snippet() {
			return $this->capms_set_response(
				true,
				'',
				'',
				array(
					'snippet' => Capms_Delivery::get_nginx_snippet(),
					'nginx'   => ! empty( $_SERVER['SERVER_SOFTWARE'] ) && false !== stripos( sanitize_text_field( wp_unslash( $_SERVER['SERVER_SOFTWARE'] ) ), 'nginx' ),
				)
			);
		}

		/**
		 * Read a list of attachment IDs from the request (JSON array).
		 *
		 * @since 0.1.0
		 * @param string $key   POST key.
		 * @param int    $limit Maximum IDs.
		 * @return int[]
		 */
		private function read_ids( $key = 'ids', $limit = 60 ) {
			$raw = isset( $_POST[ $key ] ) ? json_decode( (string) wp_unslash( $_POST[ $key ] ), true ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- nonce verified in router; IDs are cast to int below.
			return array_slice( array_values( array_filter( array_map( 'absint', is_array( $raw ) ? $raw : array() ) ) ), 0, $limit );
		}

		/**
		 * Storage cleanup + report requests (batched by the browser).
		 *
		 * @since 0.1.0
		 * @param string $type Request type.
		 * @return array
		 */
		private function cleanup_request( $type ) {
			if ( function_exists( 'set_time_limit' ) ) {
				@set_time_limit( 120 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			}

			// phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in router.
			$mode   = isset( $_POST['mode'] ) ? sanitize_key( wp_unslash( $_POST['mode'] ) ) : '';
			$strict = ! empty( $_POST['strict'] );
			$keep   = ! isset( $_POST['keep'] ) || ! empty( $_POST['keep'] );
			// phpcs:enable

			switch ( $type ) {
				case 'cleanup_ids':
					$registered = function_exists( 'wp_get_registered_image_subsizes' ) ? array_keys( wp_get_registered_image_subsizes() ) : get_intermediate_image_sizes();
					return $this->capms_set_response(
						true,
						'',
						'',
						array(
							'ids'              => Capms_Cleanup::get_attachment_ids(),
							'estimate_ratio'   => Capms_Cleanup::estimate_ratio(),
							'registered_sizes' => $registered,
						)
					);

				case 'cleanup_scan':
					$ids = $this->read_ids( 'ids', 'hash' === $mode || 'sizes' === $mode ? 100 : 25 );
					switch ( $mode ) {
						case 'unused':
							return $this->capms_set_response( true, '', '', Capms_Cleanup::scan_unused( $ids, $strict ) );
						case 'sizes':
							return $this->capms_set_response( true, '', '', array( 'sizes' => (object) Capms_Cleanup::scan_sizes( $ids ) ) );
						case 'hash':
							return $this->capms_set_response( true, '', '', array( 'hashes' => (object) Capms_Cleanup::hash_files( array_slice( $ids, 0, 15 ) ) ) );
						case 'thumbs':
							return $this->capms_set_response( true, '', '', Capms_Cleanup::scan_thumbnails( $ids ) );
						case 'storage':
							return $this->capms_set_response( true, '', '', array( 'items' => Capms_Cleanup::scan_storage( $ids ) ) );
					}
					return $this->capms_set_response( false, esc_html__( 'Invalid scan.', 'captain-media-shield' ) );

				case 'cleanup_duplicate_groups':
					$raw    = isset( $_POST['groups'] ) ? json_decode( (string) wp_unslash( $_POST['groups'] ), true ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- nonce verified in router; IDs are cast to int.
					$groups = array();
					foreach ( is_array( $raw ) ? array_slice( $raw, 0, 25 ) : array() as $group ) {
						$groups[] = is_array( $group ) ? array_map( 'absint', $group ) : array();
					}
					return $this->capms_set_response( true, '', '', array( 'groups' => Capms_Cleanup::describe_duplicate_groups( $groups ) ) );

				case 'cleanup_delete':
					$result = Capms_Cleanup::delete_unused( $this->read_ids( 'ids', 40 ), $strict, $keep );
					return $this->capms_set_response(
						true,
						/* translators: 1: number of files, 2: size */
						sprintf( __( 'Deleted %1$d file(s), freed %2$s.', 'captain-media-shield' ), count( $result['deleted'] ), size_format( $result['bytes'], 2 ) ? size_format( $result['bytes'], 2 ) : '0 B' ),
						'',
						$result
					);

				case 'cleanup_clean_thumbs':
					$result = Capms_Cleanup::clean_thumbnails( $this->read_ids( 'ids', 25 ) );
					return $this->capms_set_response( true, '', '', $result );
			}

			return $this->capms_set_response( false, esc_html__( 'Invalid type.', 'captain-media-shield' ) );
		}

		/**
		 * "Purge All Backups Now".
		 *
		 * @since 0.0.1
		 * @return array
		 */
		private function purge_backups() {
			$result = Capms_Backup::purge_all();
			return $this->capms_set_response(
				true,
				/* translators: 1: number of files, 2: size */
				sprintf( __( 'Purged %1$d backup file(s), freed %2$s.', 'captain-media-shield' ), $result['files'], size_format( $result['bytes'], 2 ) ? size_format( $result['bytes'], 2 ) : '0 B' ),
				'',
				$result
			);
		}

		/**
		 * Run the retention cleanup immediately.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		private function run_cleanup() {
			if ( Capms_Settings::get_retention_seconds() < 0 ) {
				return $this->capms_set_response( false, __( 'Retention is set to "Never" - nothing to clean up automatically.', 'captain-media-shield' ) );
			}
			do_action( 'capms_backup_cleanup_event' );
			$last = get_option( 'capms_last_cleanup', array() );
			return $this->capms_set_response(
				true,
				/* translators: %d: number of backups removed */
				sprintf( __( 'Cleanup finished - %d expired backup(s) removed.', 'captain-media-shield' ), isset( $last['removed'] ) ? (int) $last['removed'] : 0 ),
				'',
				$last
			);
		}

		/**
		 * Standard response shape (same as the other Captain plugins).
		 *
		 * @since 0.0.1
		 * @param bool   $success     Success.
		 * @param string $message     Message.
		 * @param string $description Extra description.
		 * @param mixed  $data        Payload.
		 * @return array
		 */
		public function capms_set_response( $success = false, $message = '', $description = '', $data = '' ) {
			return array(
				'success'     => $success,
				'message'     => esc_html( $message ),
				'description' => esc_html( $description ),
				'data'        => $data,
			);
		}
	}

	Capms_Dashboard_Ajax::get_instance();
}
