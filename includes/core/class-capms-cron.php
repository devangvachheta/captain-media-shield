<?php
/**
 * WP-Cron jobs: scheduled backup retention cleanup.
 *
 * @since      1.0.0
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

if ( ! class_exists( 'Capms_Cron' ) ) {

	/**
	 * The cleanup job runs hourly regardless of the chosen retention - the
	 * shortest non-immediate option is one hour, and the job itself is a
	 * single indexed query when there is nothing to delete.
	 *
	 * @since 1.0.0
	 */
	class Capms_Cron {

		/**
		 * Member Variable
		 *
		 * @var instance
		 */
		private static $instance;

		/**
		 * Initiator
		 *
		 * @since 1.0.0
		 */
		public static function get_instance() {
			if ( ! isset( self::$instance ) ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Hooks.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
			add_action( 'capms_backup_cleanup_event', array( $this, 'capms_run_cleanup' ) );
			add_action( 'capms_settings_updated', array( $this, 'capms_settings_changed' ), 10, 2 );
		}

		/**
		 * Cron callback.
		 *
		 * @since 1.0.0
		 * @return void
		 */
		public function capms_run_cleanup() {
			$removed = Capms_Backup::cleanup_expired();
			update_option(
				'capms_last_cleanup',
				array(
					'time'    => time(),
					'removed' => (int) $removed,
				),
				false
			);
		}

		/**
		 * Make sure the event exists, and when the retention gets shorter
		 * apply it right away instead of waiting up to an hour.
		 *
		 * @since 1.0.0
		 * @param array $new Settings after save.
		 * @param array $old Settings before save.
		 * @return void
		 */
		public function capms_settings_changed( $new, $old ) {
			if ( ! wp_next_scheduled( 'capms_backup_cleanup_event' ) ) {
				wp_schedule_event( time() + HOUR_IN_SECONDS, 'hourly', 'capms_backup_cleanup_event' );
			}

			if ( $new['backup_retention'] !== $old['backup_retention'] && 'never' !== $new['backup_retention'] ) {
				$this->capms_run_cleanup();
			}

			// The FFmpeg path may have changed - re-detect on next use.
			if ( $new['ffmpeg_path'] !== $old['ffmpeg_path'] ) {
				delete_transient( 'capms_ffmpeg_path' );
			}
		}

		/**
		 * Next scheduled run (unix time) or 0.
		 *
		 * @since 1.0.0
		 * @return int
		 */
		public static function next_run() {
			$next = wp_next_scheduled( 'capms_backup_cleanup_event' );
			return $next ? (int) $next : 0;
		}
	}

	Capms_Cron::get_instance();
}
