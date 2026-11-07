<?php
/**
 * Admin menu + React app assets.
 *
 * @since      0.0.1
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
	 * @since 0.0.1
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
			add_action( 'admin_menu', array( $this, 'capms_admin_menu' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'capms_admin_enqueue_scripts' ), 10, 1 );
			add_filter( 'plugin_action_links_' . plugin_basename( CAPMS_FILE ), array( $this, 'capms_action_links' ) );
			add_filter( 'load_script_translation_file', array( $this, 'capms_load_script_translation_file' ), 10, 3 );
			add_action( 'in_admin_header', array( $this, 'capms_suppress_admin_notices' ), 1000 );
			add_action( 'admin_head', array( $this, 'capms_suppress_admin_notices' ), 1 );
		}

		/**
		 * Register the menu.
		 *
		 * @since 0.0.1
		 */
		public function capms_admin_menu() {
			$capability = 'manage_options';

			if ( ! current_user_can( $capability ) ) {
				return;
			}

			// Lives under Media (upload.php). The React app has its own sidebar
			// with every screen, so one entry is enough here.
			$hook_suffix = add_submenu_page(
				'upload.php',
				__( 'Captain Media Shield', 'captain-media-shield' ),
				__( 'Captain Media Shield', 'captain-media-shield' ),
				$capability,
				'captain-media-shield',
				array( $this, 'capms_menu_page_template' )
			);

			if ( $hook_suffix ) {
				add_action( 'load-' . $hook_suffix, array( $this, 'capms_suppress_admin_notices' ) );
			}
		}

		/**
		 * Suppress admin notices on the plugin's React admin page.
		 *
		 * @since 1.0.3
		 * @return void
		 */
		public function capms_suppress_admin_notices() {
			$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
			if ( ! $screen || 'media_page_captain-media-shield' !== $screen->id ) {
				return;
			}

			remove_all_actions( 'admin_notices' );
			remove_all_actions( 'all_admin_notices' );
			remove_all_actions( 'user_admin_notices' );
			remove_all_actions( 'network_admin_notices' );

			echo '<style id="capms-suppress-notices">'
				. '.media_page_captain-media-shield #wpbody-content > .notice,'
				. '.media_page_captain-media-shield #wpbody-content > .update-nag,'
				. '.media_page_captain-media-shield #wpbody-content > div.error,'
				. '.media_page_captain-media-shield #wpbody-content > div.updated,'
				. '.media_page_captain-media-shield #wpbody-content > .is-dismissible,'
				. '.media_page_captain-media-shield #wpbody-content > div[class*="notice"],'
				. '.media_page_captain-media-shield #wpbody-content > div[class*="e-notice"],'
				. '.media_page_captain-media-shield .elementor-message,'
				. '.media_page_captain-media-shield .e-notice {'
				. '    display: none !important;'
				. '}'
				. '</style>';
		}

		/**
		 * Settings link on the Plugins screen.
		 *
		 * @since 0.0.1
		 * @param array $links Links.
		 * @return array
		 */
		public function capms_action_links( $links ) {
			array_unshift(
				$links,
				'<a href="' . esc_url( admin_url( 'upload.php?page=captain-media-shield' ) ) . '">' . esc_html__( 'Dashboard', 'captain-media-shield' ) . '</a>'
			);
			return $links;
		}

		/**
		 * React mount point.
		 *
		 * @since 0.0.1
		 */
		public function capms_menu_page_template() {
			echo '<div id="captain-media-shield-app"></div>';
		}

		/**
		 * Enqueue admin assets on the plugin page only.
		 *
		 * @since 0.0.1
		 * @param string $hook Current admin page.
		 * @return void
		 */
		public function capms_admin_enqueue_scripts( $hook ) {
			if ( 'media_page_captain-media-shield' !== $hook ) {
				return;
			}

			$asset_file = CAPMS_PATH . 'build/index.asset.php';
			$asset      = file_exists( $asset_file ) ? include $asset_file : array(
				'dependencies' => array( 'wp-i18n', 'wp-element' ),
				'version'      => CAPMS_VERSION,
			);

			// Backward compatibility: ensure react-jsx-runtime exists on WordPress < 6.6
			if ( ! wp_script_is( 'react-jsx-runtime', 'registered' ) ) {
				wp_register_script( 'react-jsx-runtime', false, array( 'react' ), CAPMS_VERSION, true );
				wp_add_inline_script(
					'react-jsx-runtime',
					'window.ReactJSXRuntime = window.ReactJSXRuntime || (window.React ? { jsx: window.React.createElement, jsxs: window.React.createElement, Fragment: window.React.Fragment } : {});'
				);
			}

			$build_css_path = CAPMS_PATH . 'build/index.css';
			$build_js_path  = CAPMS_PATH . 'build/index.js';
			$build_css_ver  = file_exists( $build_css_path ) ? filemtime( $build_css_path ) : CAPMS_VERSION;
			$build_js_ver   = file_exists( $build_js_path ) ? filemtime( $build_js_path ) : CAPMS_VERSION;

			wp_enqueue_style( 'capms-admin-app', CAPMS_URL . 'build/index.css', array(), $build_css_ver );
			wp_style_add_data( 'capms-admin-app', 'rtl', 'replace' );

			wp_add_inline_style(
				'capms-admin-app',
				'body.media_page_captain-media-shield #wpbody-content > .notice,
				body.media_page_captain-media-shield #wpbody-content > .notice-warning,
				body.media_page_captain-media-shield #wpbody-content > .notice-error,
				body.media_page_captain-media-shield #wpbody-content > .notice-info,
				body.media_page_captain-media-shield #wpbody-content > .notice-success,
				body.media_page_captain-media-shield #wpbody-content > .update-nag,
				body.media_page_captain-media-shield #wpbody-content > div.error,
				body.media_page_captain-media-shield #wpbody-content > div.updated,
				body.media_page_captain-media-shield #wpbody-content > .is-dismissible,
				body.media_page_captain-media-shield #wpbody-content > * > .notice,
				body.media_page_captain-media-shield #wpbody-content > * > .update-nag,
				body.media_page_captain-media-shield #wpbody-content > * > div.error,
				body.media_page_captain-media-shield #wpbody-content > * > div.updated,
				body.media_page_captain-media-shield #wpbody-content > * > .is-dismissible,
				body.media_page_captain-media-shield .notice:not(.capms-notice),
				body.media_page_captain-media-shield .update-nag,
				body.media_page_captain-media-shield div.error:not(.capms-notice),
				body.media_page_captain-media-shield div.updated:not(.capms-notice),
				body.media_page_captain-media-shield #wpbody-content > div[class*="notice"],
				body.media_page_captain-media-shield #wpbody-content > div[class*="e-notice"],
				body.media_page_captain-media-shield .e-notice,
				body.media_page_captain-media-shield .elementor-message {
					display: none !important;
				}'
			);

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

		/**
		 * Fallback loader for script translations with strict exact handle match only.
		 *
		 * @since 1.0.3
		 * @param string|false $file   Path to the translation file or false.
		 * @param string       $handle Script handle.
		 * @param string       $domain Text domain.
		 * @return string|false
		 */
		public function capms_load_script_translation_file( $file, $handle, $domain ) {
			if ( 'captain-media-shield' !== $domain ) {
				return $file;
			}

			if ( $file && file_exists( $file ) ) {
				return $file;
			}

			// Strictly check exact handle file: languages/captain-media-shield-{locale}-{handle}.json
			// No arbitrary glob fallback to prevent loading unrelated handle translations.
			$locale     = determine_locale();
			$lang_dir   = trailingslashit( CAPMS_PATH ) . 'languages/';
			$exact_file = $lang_dir . $domain . '-' . $locale . '-' . $handle . '.json';

			if ( file_exists( $exact_file ) ) {
				return $exact_file;
			}

			return $file;
		}
	}

	Capms_Menu::get_instance();
}
