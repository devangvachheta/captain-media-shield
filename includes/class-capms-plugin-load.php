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
			add_action( 'wp_initialize_site', array( $this, 'capms_new_site' ), 900 );
		}

		/**
		 * Plugin Activation (also runs for every site on a network activation).
		 *
		 * @since 0.0.1
		 * @param bool $network_wide Network activation.
		 * @return void
		 */
		public static function capms_activation( $network_wide = false ) {
			if ( is_multisite() && $network_wide ) {
				foreach ( get_sites( array( 'fields' => 'ids', 'number' => 0 ) ) as $blog_id ) {
					switch_to_blog( $blog_id );
					self::capms_activate_site();
					restore_current_blog();
				}
				return;
			}

			self::capms_activate_site();
		}

		/**
		 * Table, options and cron for the current site.
		 *
		 * @since 0.1.0
		 * @return void
		 */
		private static function capms_activate_site() {
			Capms_Settings::flush_cache();
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
		 * A new site was added to a network where the plugin is network-active:
		 * set it up like the others.
		 *
		 * @since 0.1.0
		 * @param WP_Site $new_site New site.
		 * @return void
		 */
		public function capms_new_site( $new_site ) {
			if ( ! function_exists( 'is_plugin_active_for_network' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}
			if ( ! is_plugin_active_for_network( plugin_basename( CAPMS_FILE ) ) ) {
				return;
			}

			switch_to_blog( (int) $new_site->blog_id );
			self::capms_activate_site();
			restore_current_blog();
		}

		/**
		 * Plugin deactivation - unschedule every cron job we own and pull our
		 * rewrite block out of uploads/.htaccess so no stale WebP/AVIF rewrites
		 * keep running while the plugin is off.
		 *
		 * @since 0.0.1
		 * @param bool $network_wide Network deactivation.
		 * @return void
		 */
		public static function capms_deactivation( $network_wide = false ) {
			if ( is_multisite() && $network_wide ) {
				foreach ( get_sites( array( 'fields' => 'ids', 'number' => 0 ) ) as $blog_id ) {
					switch_to_blog( $blog_id );
					self::capms_deactivate_site();
					restore_current_blog();
				}
				return;
			}

			self::capms_deactivate_site();
		}

		/**
		 * Cron + .htaccess clean-up for the current site.
		 *
		 * @since 0.1.0
		 * @return void
		 */
		private static function capms_deactivate_site() {
			wp_clear_scheduled_hook( 'capms_backup_cleanup_event' );
			wp_unschedule_hook( 'capms_process_video_event' );
			wp_unschedule_hook( 'capms_process_gif_event' );

			Capms_Settings::flush_cache();
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
			require_once CAPMS_PATH . 'includes/core/class-capms-cleanup.php';

			if ( defined( 'WP_CLI' ) && WP_CLI ) {
				require_once CAPMS_PATH . 'includes/cli/class-capms-cli.php';
			}

			if ( is_admin() ) {
				require_once CAPMS_PATH . 'includes/admin/class-capms-menu.php';
				require_once CAPMS_PATH . 'includes/admin/class-capms-dashboard-ajax.php';
				require_once CAPMS_PATH . 'includes/admin/class-capms-media-library.php';
			}
		}
	}

	Capms_Plugin_Load::get_instance();
}
