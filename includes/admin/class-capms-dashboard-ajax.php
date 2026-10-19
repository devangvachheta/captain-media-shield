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
			$images = apply_filters( 'capms_supported_image_mimes', Capms_Image_Optimizer::SUPPORTED_MIMES );
			$videos = apply_filters( 'capms_supported_video_mimes', Capms_Video_Optimizer::SUPPORTED_MIMES );
			if ( 'image' === $which ) {
				return $images;
			}
			if ( 'video' === $which ) {
				return $videos;
			}
			return array_merge( $images, $videos );
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
			global $wpdb;

			// phpcs:disable WordPress.Security.NonceVerification.Missing -- verified in router.
			$scope        = isset( $_POST['scope'] ) ? sanitize_key( wp_unslash( $_POST['scope'] ) ) : 'all';
			$retry_failed = ! empty( $_POST['retry_failed'] );
			// phpcs:enable

			$scope        = in_array( $scope, array( 'all', 'image', 'video' ), true ) ? $scope : 'all';
			$mimes        = $this->get_mimes( $scope );
			$placeholders = implode( ',', array_fill( 0, count( $mimes ), '%s' ) );
			$table        = esc_sql( Capms_Stats::table() );
			$statuses     = $retry_failed ? array( 'optimized' ) : array( 'optimized', 'failed', 'skipped' );
			$status_holds = implode( ',', array_fill( 0, count( $statuses ), '%s' ) );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
			$ids = $wpdb->get_col( $wpdb->prepare( "SELECT p.ID FROM {$wpdb->posts} p LEFT JOIN {$table} m ON m.attachment_id = p.ID WHERE p.post_type = 'attachment' AND p.post_mime_type IN ($placeholders) AND ( m.status IS NULL OR m.status NOT IN ($status_holds) ) ORDER BY p.ID DESC", array_merge( $mimes, $statuses ) ) );

			return $this->capms_set_response(
				true,
				'',
				'',
				array(
					'ids'     => array_map( 'intval', (array) $ids ),
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
