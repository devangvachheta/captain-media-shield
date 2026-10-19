<?php
/**
 * The file that defines the load plugin.
 *
 * @since   0.0.1
 *
 * @package captain-media-shield
 * @subpackage captain-media-shield/includes
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capms_Plugin_Load' ) ) {

	/**
	 * Captain Media Shield Main Class
	 *
	 * @since 0.0.1
	 */
	class Capms_Plugin_Load {

		/**
		 * Member Variable
		 *
		 * @var instance
		 */
		private static $instance;

		/**
		 * Initiator
		 *
		 * @since 0.0.1
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
			register_activation_hook( CAPMS_FILE, array( __CLASS__, 'capms_activation' ) );
			register_deactivation_hook( CAPMS_FILE, array( __CLASS__, 'capms_deactivation' ) );

			// Settings + table helpers are needed by the activation hook too,
			// which runs before plugins_loaded on the activation request.
			require_once CAPMS_PATH . 'includes/core/class-capms-settings.php';
			require_once CAPMS_PATH . 'includes/core/class-capms-stats.php';

			add_action( 'plugins_loaded', array( $this, 'capms_init_plugin' ) );
		}

		/**
		 * Plugin Activation.
		 *
		 * @since 0.0.1
		 * @return void
		 */
		public static function capms_activation() {
			Capms_Stats::create_table();
			update_option( 'capms_db_version', CAPMS_VERSION );

			if ( false === get_option( Capms_Settings::OPTION_KEY, false ) ) {
				add_option( Capms_Settings::OPTION_KEY, Capms_Settings::get_defaults() );
			}

			if ( ! wp_next_scheduled( 'capms_backup_cleanup_event' ) ) {
				wp_schedule_event( time() + HOUR_IN_SECONDS, 'hourly', 'capms_backup_cleanup_event' );
			}
		}

		/**
		 * Plugin deactivation - unschedule every cron job we own and pull
		 * our rewrite block out of uploads/.htaccess so no stale WebP/AVIF
		 * rewrites keep running while the plugin is off.
		 *
		 * @since 0.0.1
		 * @return void
		 */
		public static function capms_deactivation() {
			wp_clear_scheduled_hook( 'capms_backup_cleanup_event' );
			wp_clear_scheduled_hook( 'capms_process_video_event' );

			require_once CAPMS_PATH . 'includes/core/class-capms-delivery.php';
			Capms_Delivery::remove_htaccess_rules();
		}

		/**
		 * Files load plugin loaded.
		 *
		 * @since 0.0.1
		 * @return void
		 */
		public function capms_init_plugin() {
			load_plugin_textdomain( 'captain-media-shield', false, dirname( plugin_basename( CAPMS_FILE ) ) . '/languages' );

			$this->capms_load_dependencies();
			$this->capms_maybe_upgrade();
		}

		/**
		 * Re-runs dbDelta whenever the stored version doesn't match the
		 * running one, so plugin updates on already-active sites get any
		 * new table columns (the activation hook only fires once).
		 *
		 * @since 0.0.1
		 * @return void
		 */
		private function capms_maybe_upgrade() {
			if ( CAPMS_VERSION === get_option( 'capms_db_version', '' ) ) {
				return;
			}
			Capms_Stats::create_table();
			update_option( 'capms_db_version', CAPMS_VERSION );

			if ( ! wp_next_scheduled( 'capms_backup_cleanup_event' ) ) {
				wp_schedule_event( time() + HOUR_IN_SECONDS, 'hourly', 'capms_backup_cleanup_event' );
			}
		}

		/**
		 * Load the required dependencies for this plugin.
		 *
		 * @since 0.0.1
		 */
		public function capms_load_dependencies() {
			require_once CAPMS_PATH . 'includes/core/class-capms-environment.php';
			require_once CAPMS_PATH . 'includes/core/class-capms-backup.php';
			require_once CAPMS_PATH . 'includes/core/class-capms-image-optimizer.php';
			require_once CAPMS_PATH . 'includes/core/class-capms-video-optimizer.php';
			require_once CAPMS_PATH . 'includes/core/class-capms-processor.php';
			require_once CAPMS_PATH . 'includes/core/class-capms-delivery.php';
			require_once CAPMS_PATH . 'includes/core/class-capms-cron.php';

			if ( is_admin() ) {
				require_once CAPMS_PATH . 'includes/admin/class-capms-menu.php';
				require_once CAPMS_PATH . 'includes/admin/class-capms-dashboard-ajax.php';
				require_once CAPMS_PATH . 'includes/admin/class-capms-media-library.php';
			}
		}
	}

	Capms_Plugin_Load::get_instance();
}
