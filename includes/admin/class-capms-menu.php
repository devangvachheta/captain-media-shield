<?php
/**
 * Admin menu + React app assets.
 *
 * @since      1.0.0
 *
 * @package    captain-media-shield
 * @subpackage captain-media-shield/includes/admin
 */

/**
 * Exit if accessed directly.
 * */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capms_Menu' ) ) {

	/**
	 * Capms_Menu
	 *
	 * @since 1.0.0
	 */
	class Capms_Menu {

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
		 * Define the core functionality of the plugin.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
			add_action( 'admin_menu', array( $this, 'capms_admin_menu' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'capms_admin_enqueue_scripts' ), 10, 1 );
			add_action( 'admin_head', array( $this, 'capms_admin_menu_style' ) );
			add_filter( 'plugin_action_links_' . plugin_basename( CAPMS_FILE ), array( $this, 'capms_action_links' ) );
		}

		/**
		 * Register the menu.
		 *
		 * @since 1.0.0
		 */
		public function capms_admin_menu() {
			$capability = 'manage_options';

			if ( ! current_user_can( $capability ) ) {
				return;
			}

			$setting_name = __( 'Captain Media Shield', 'captain-media-shield' );
			$menu_label   = __( 'Media Shield', 'captain-media-shield' );
			$setting_logo = CAPMS_URL . 'assets/svg/logo/captwiki-logo-sw-t.svg';

			add_menu_page( $setting_name, $menu_label, $capability, 'captain-media-shield', array( $this, 'capms_menu_page_template' ), $setting_logo, 70 );

			add_submenu_page( 'captain-media-shield', __( 'Dashboard', 'captain-media-shield' ), __( 'Dashboard', 'captain-media-shield' ), $capability, 'captain-media-shield', array( $this, 'capms_menu_page_template' ) );

			$routes = array(
				'images' => __( 'Image Optimization', 'captain-media-shield' ),
				'videos' => __( 'Video Optimization', 'captain-media-shield' ),
				'backup' => __( 'Backup & Retention', 'captain-media-shield' ),
				'bulk'   => __( 'Bulk Optimizer', 'captain-media-shield' ),
				'health' => __( 'Server Health', 'captain-media-shield' ),
			);

			foreach ( $routes as $route => $label ) {
				add_submenu_page( 'captain-media-shield', $label, $label, $capability, 'admin.php?page=captain-media-shield#/' . $route );
			}
		}

		/**
		 * Brand colour for our menu item highlight, whatever admin colour
		 * scheme the user picked.
		 *
		 * @since 1.0.0
		 */
		public function capms_admin_menu_style() {
			?>
			<style>
				#adminmenu #toplevel_page_captain-media-shield.wp-has-current-submenu > a.wp-has-submenu,
				#adminmenu #toplevel_page_captain-media-shield.wp-has-current-submenu.opensub > a.wp-has-submenu,
				#adminmenu #toplevel_page_captain-media-shield:hover > a.menu-top,
				#adminmenu #toplevel_page_captain-media-shield.current > a.menu-top {
					background: #2271b1 !important;
					color: #fff !important;
				}
				#adminmenu #toplevel_page_captain-media-shield div.wp-menu-image img {
					width: 20px;
					height: 20px;
					padding-top: 7px;
				}
			</style>
			<?php
		}

		/**
		 * Settings link on the Plugins screen.
		 *
		 * @since 1.0.0
		 * @param array $links Links.
		 * @return array
		 */
		public function capms_action_links( $links ) {
			array_unshift(
				$links,
				'<a href="' . esc_url( admin_url( 'admin.php?page=captain-media-shield' ) ) . '">' . esc_html__( 'Dashboard', 'captain-media-shield' ) . '</a>',
				'<a href="' . esc_url( admin_url( 'admin.php?page=captain-media-shield#/bulk' ) ) . '">' . esc_html__( 'Bulk Optimize', 'captain-media-shield' ) . '</a>'
			);
			return $links;
		}

		/**
		 * React mount point.
		 *
		 * @since 1.0.0
		 */
		public function capms_menu_page_template() {
			echo '<div id="captain-media-shield-app"></div>';
		}

		/**
		 * Enqueue admin assets on the plugin page only.
		 *
		 * @since 1.0.0
		 * @param string $hook Current admin page.
		 * @return void
		 */
		public function capms_admin_enqueue_scripts( $hook ) {
			if ( 'toplevel_page_captain-media-shield' !== $hook ) {
				return;
			}

			$asset_file = CAPMS_PATH . 'build/index.asset.php';
			$asset      = file_exists( $asset_file ) ? include $asset_file : array(
				'dependencies' => array( 'wp-i18n', 'wp-element' ),
				'version'      => CAPMS_VERSION,
			);

			$build_css_path = CAPMS_PATH . 'build/index.css';
			$build_js_path  = CAPMS_PATH . 'build/index.js';
			$build_css_ver  = file_exists( $build_css_path ) ? filemtime( $build_css_path ) : CAPMS_VERSION;
			$build_js_ver   = file_exists( $build_js_path ) ? filemtime( $build_js_path ) : CAPMS_VERSION;

			wp_enqueue_style( 'capms-admin-app', CAPMS_URL . 'build/index.css', array(), $build_css_ver );
			wp_style_add_data( 'capms-admin-app', 'rtl', 'replace' );

			wp_enqueue_script( 'capms-admin-app', CAPMS_URL . 'build/index.js', $asset['dependencies'], $build_js_ver, true );
			wp_set_script_translations( 'capms-admin-app', 'captain-media-shield', CAPMS_PATH . 'languages' );

			wp_localize_script(
				'capms-admin-app',
				'capms_data',
				array(
					'ajax_url'      => admin_url( 'admin-ajax.php' ),
					'capms_nonce'   => wp_create_nonce( 'capms_nonce' ),
					'home_url'      => esc_url( home_url( '/' ) ),
					'media_url'     => esc_url( admin_url( 'upload.php?mode=list' ) ),
					'capms_version' => CAPMS_VERSION,
					'plugin_url'    => CAPMS_URL,
					'wp_version'    => get_bloginfo( 'version' ),
					'backup_dir'    => 'wp-content/uploads/' . CAPMS_BACKUP_DIR_NAME . '/',
				)
			);
		}
	}

	Capms_Menu::get_instance();
}
