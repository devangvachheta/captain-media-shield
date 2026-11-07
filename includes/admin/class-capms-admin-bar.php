<?php
/**
 * Frontend & Backend WordPress Admin Bar integration.
 * Provides live Page Media Inspector and 1-Click Page Image Optimizer.
 *
 * @since      1.0.2
 * @package    captain-media-shield
 * @subpackage captain-media-shield/includes/admin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capms_Admin_Bar' ) ) {

	/**
	 * Capms_Admin_Bar
	 *
	 * @since 1.0.2
	 */
	class Capms_Admin_Bar {

		/**
		 * Singleton instance.
		 *
		 * @var Capms_Admin_Bar
		 */
		private static $instance;

		/**
		 * Initiator.
		 *
		 * @since 1.0.2
		 * @return Capms_Admin_Bar
		 */
		public static function get_instance() {
			if ( ! isset( self::$instance ) ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Constructor.
		 *
		 * @since 1.0.2
		 */
		public function __construct() {
			add_action( 'admin_bar_menu', array( $this, 'register_admin_bar' ), 90 );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
			add_action( 'wp_ajax_capms_admin_bar_optimize_page', array( $this, 'ajax_optimize_page' ) );
		}

		/**
		 * Check whether the admin bar integration should run.
		 *
		 * @since 1.0.2
		 * @return bool
		 */
		private function should_display() {
			if ( ! is_user_logged_in() || ! is_admin_bar_showing() ) {
				return false;
			}
			if ( ! current_user_can( 'manage_options' ) ) {
				return false;
			}
			return (bool) Capms_Settings::get( 'admin_bar_menu', true );
		}

		/**
		 * Enqueue styles and scripts for the admin bar.
		 *
		 * @since 1.0.2
		 * @return void
		 */
		public function enqueue_scripts() {
			if ( ! $this->should_display() ) {
				return;
			}

			$css_file = CAPMS_PATH . 'assets/css/admin-bar.css';
			$css_ver  = file_exists( $css_file ) ? filemtime( $css_file ) : CAPMS_VERSION;
			wp_enqueue_style( 'capms-admin-bar', CAPMS_URL . 'assets/css/admin-bar.css', array(), $css_ver );

			// Only frontend needs the DOM image inspector script.
			if ( ! is_admin() ) {
				$js_file = CAPMS_PATH . 'assets/js/admin-bar.js';
				$js_ver  = file_exists( $js_file ) ? filemtime( $js_file ) : CAPMS_VERSION;
				wp_enqueue_script( 'capms-admin-bar', CAPMS_URL . 'assets/js/admin-bar.js', array(), $js_ver, true );
				wp_set_script_translations( 'capms-admin-bar', 'captain-media-shield' );
				wp_localize_script(
					'capms-admin-bar',
					'capms_admin_bar_vars',
					array(
						'ajax_url'        => admin_url( 'admin-ajax.php' ),
						'nonce'           => wp_create_nonce( 'capms_admin_bar_nonce' ),
						'uploads_baseurl' => wp_get_upload_dir()['baseurl'],
						'delivery_method' => Capms_Settings::get( 'delivery_method', 'picture' ),
						'inspector_mode'  => Capms_Settings::get( 'admin_bar_inspector_mode', 'list' ),
						'i18n'            => array(
							'webp_active'         => esc_html__( 'WebP Active', 'captain-media-shield' ),
							'partially_optimized' => esc_html__( 'Needs Optimization', 'captain-media-shield' ),
							'scanning'            => esc_html__( 'Scanning page media...', 'captain-media-shield' ),
							'all_optimized_desc'  => esc_html__( 'All images on this page are delivered in Next Generation formats.', 'captain-media-shield' ),
							'needs_optimize_desc' => esc_html__( '%d original image(s) on this page can be optimized.', 'captain-media-shield' ),
							'no_images_desc'      => esc_html__( 'No uploaded media images found on this page.', 'captain-media-shield' ),
							'optimize_btn'        => esc_html__( '⚡ Optimize Page Images (%d)', 'captain-media-shield' ),
							'optimizing_btn'      => esc_html__( '⏳ Optimizing Images...', 'captain-media-shield' ),
							'done_btn'            => esc_html__( '✅ Done! Refreshing...', 'captain-media-shield' ),
							'highlight_on_page'   => esc_html__( 'Highlight on Page', 'captain-media-shield' ),
							'highlights_active'   => esc_html__( 'Highlights Active', 'captain-media-shield' ),
							'view_unoptimized'    => esc_html__( 'View Images (%d)', 'captain-media-shield' ),
							'hide_unoptimized'    => esc_html__( 'Hide List', 'captain-media-shield' ),
							'locate'              => esc_html__( 'Locate', 'captain-media-shield' ),
							'images_up_to_date'   => esc_html__( 'Images already up to date.', 'captain-media-shield' ),
							'opt_failed'          => esc_html__( 'Optimization failed.', 'captain-media-shield' ),
							'request_failed'      => esc_html__( 'Request failed. Check server.', 'captain-media-shield' ),
							'rewrite_active_desc' => esc_html__( 'Next-Gen delivery is active via server rewrite (.htaccess / Nginx). Images are served in WebP/AVIF automatically.', 'captain-media-shield' ),
						),
					)
				);
			}
		}

		/**
		 * Register nodes into WP Admin Bar.
		 *
		 * @since 1.0.2
		 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
		 * @return void
		 */
		public function register_admin_bar( $wp_admin_bar ) {
			if ( ! $this->should_display() ) {
				return;
			}

			$icon_svg = '<svg class="capms-bar-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>';

			// ── 1. Top-Level Parent Node (Centered Icon & Dot - Click Disabled for Hover) ──
			$wp_admin_bar->add_node(
				array(
					'id'    => 'capms-admin-bar',
					'title' => sprintf(
						'<span class="ab-icon">%1$s</span><span class="ab-label">%2$s</span><span class="capms-bar-top-dot capms-bar-dot--idle" id="capms-bar-top-dot" title="%3$s"></span>',
						$icon_svg,
						esc_html__( 'Media Shield', 'captain-media-shield' ),
						esc_attr__( 'Captain Media Shield', 'captain-media-shield' )
					),
					'href'  => admin_url( 'upload.php?page=captain-media-shield' ),
					'meta'  => array(
						'title' => esc_html__( 'Captain Media Shield - Media Optimizer & Storage Saver', 'captain-media-shield' ),
					),
				)
			);

			// ── 2. Live Page Media Inspector (Frontend Only, No Dashboard Links) ───
			if ( ! is_admin() ) {
				$wp_admin_bar->add_node(
					array(
						'id'     => 'capms-bar-inspector',
						'parent' => 'capms-admin-bar',
						'title'  => $this->render_inspector_html(),
						'meta'   => array(
							'class'    => 'capms-bar-inspector-container',
							'tabindex' => -1,
						),
					)
				);
			}
		}

		/**
		 * Render the HTML for the Live Page Inspector inside the dropdown.
		 *
		 * @since 1.0.2
		 * @return string
		 */
		private function render_inspector_html() {
			ob_start();
			?>
			<div class="capms-bar-card" id="capms-bar-card">
				<div class="capms-bar-card-header">
					<div class="capms-bar-card-title-wrap">
						<span class="capms-bar-card-icon">
							<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
						</span>
						<span class="capms-bar-card-title"><?php esc_html_e( 'Page Media Inspector', 'captain-media-shield' ); ?></span>
					</div>
					<span class="capms-bar-card-badge" id="capms-bar-card-badge"><?php esc_html_e( 'Scanning...', 'captain-media-shield' ); ?></span>
				</div>

				<div class="capms-bar-metrics-grid">
					<div class="capms-bar-metric-box">
						<span class="capms-bar-metric-num" id="capms-bar-stat-total">0</span>
						<span class="capms-bar-metric-tag"><?php esc_html_e( 'Total Images', 'captain-media-shield' ); ?></span>
					</div>
					<div class="capms-bar-metric-box capms-bar-metric-box--green">
						<span class="capms-bar-metric-num capms-bar-val--green" id="capms-bar-stat-nextgen">0</span>
						<span class="capms-bar-metric-tag"><?php esc_html_e( 'WebP / AVIF', 'captain-media-shield' ); ?></span>
					</div>
					<div class="capms-bar-metric-box capms-bar-metric-box--amber">
						<span class="capms-bar-metric-num capms-bar-val--amber" id="capms-bar-stat-unoptimized">0</span>
						<span class="capms-bar-metric-tag"><?php esc_html_e( 'Original', 'captain-media-shield' ); ?></span>
					</div>
				</div>

				<div class="capms-bar-desc-box" id="capms-bar-desc-box">
					<span class="capms-bar-desc-icon" id="capms-bar-desc-icon">🔍</span>
					<p class="capms-bar-desc-text" id="capms-bar-desc-text">
						<?php esc_html_e( 'Detecting images on this page...', 'captain-media-shield' ); ?>
					</p>
				</div>

				<div class="capms-bar-tools-row" id="capms-bar-tools-row" style="display:none;">
					<button type="button" class="capms-bar-tool-btn" id="capms-bar-btn-toggle-list" title="<?php esc_attr_e( 'View unoptimized images', 'captain-media-shield' ); ?>">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
						<span id="capms-bar-toggle-list-label"><?php esc_html_e( 'View Images', 'captain-media-shield' ); ?></span>
					</button>
					<button type="button" class="capms-bar-tool-btn" id="capms-bar-btn-highlight" title="<?php esc_attr_e( 'Toggle borders on page', 'captain-media-shield' ); ?>">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg>
						<span id="capms-bar-highlight-label"><?php esc_html_e( 'Highlight on Page', 'captain-media-shield' ); ?></span>
					</button>
				</div>

				<div class="capms-bar-thumb-list-wrap" id="capms-bar-thumb-list-wrap" style="display:none;">
					<div class="capms-bar-thumb-list-head">
						<span><?php esc_html_e( 'Click any image to locate on page:', 'captain-media-shield' ); ?></span>
					</div>
					<div class="capms-bar-thumb-list" id="capms-bar-thumb-list"></div>
				</div>

				<div class="capms-bar-action-wrap" id="capms-bar-action-wrap" style="display:none;">
					<button type="button" class="capms-bar-btn-action" id="capms-bar-btn-action">
						<span class="capms-bar-btn-icon">⚡</span>
						<span class="capms-bar-btn-label"><?php esc_html_e( 'Optimize Images on this Page', 'captain-media-shield' ); ?></span>
					</button>
				</div>

				<div class="capms-bar-card-footer">
					<a href="<?php echo esc_url( admin_url( 'upload.php?page=captain-media-shield#/' ) ); ?>" class="capms-bar-footer-link">
						<span><?php esc_html_e( 'Open Media Shield Dashboard', 'captain-media-shield' ); ?></span>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
					</a>
				</div>
			</div>
			<?php
			return ob_get_clean();
		}

		/**
		 * AJAX handler: Optimize detected images for the current page.
		 *
		 * @since 1.0.2
		 * @return void
		 */
		public function ajax_optimize_page() {
			check_ajax_referer( 'capms_admin_bar_nonce', 'nonce' );

			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( array( 'message' => esc_html__( 'Permission denied.', 'captain-media-shield' ) ) );
			}

			$attachment_ids = isset( $_POST['attachment_ids'] ) ? array_map( 'absint', (array) $_POST['attachment_ids'] ) : array();
			$image_urls     = isset( $_POST['image_urls'] ) ? (array) $_POST['image_urls'] : array();

			// Fallback: translate any image URLs to attachment IDs if they didn't have wp-image-* class.
			if ( ! empty( $image_urls ) ) {
				foreach ( $image_urls as $raw_url ) {
					$url = esc_url_raw( wp_unslash( $raw_url ) );
					if ( $url ) {
						$id = attachment_url_to_postid( $url );
						if ( $id && ! in_array( $id, $attachment_ids, true ) ) {
							$attachment_ids[] = $id;
						}
					}
				}
			}

			$attachment_ids = array_slice( array_filter( array_unique( $attachment_ids ) ), 0, 25 );

			if ( empty( $attachment_ids ) ) {
				wp_send_json_error( array( 'message' => esc_html__( 'No valid media attachments found to optimize.', 'captain-media-shield' ) ) );
			}

			if ( function_exists( 'set_time_limit' ) ) {
				@set_time_limit( 120 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			}

			$processor = Capms_Processor::get_instance();
			$optimized = 0;
			$errors    = array();

			foreach ( $attachment_ids as $id ) {
				$res = $processor->process_attachment( $id, false );
				if ( is_wp_error( $res ) ) {
					$errors[] = sprintf( '#%d: %s', $id, $res->get_error_message() );
				} else {
					$optimized++;
				}
			}

			if ( 0 === $optimized && ! empty( $errors ) ) {
				wp_send_json_error(
					array(
						'message' => implode( ', ', $errors ),
						'errors'  => $errors,
					)
				);
			}

			wp_send_json_success(
				array(
					'optimized' => $optimized,
					'total'     => count( $attachment_ids ),
					'errors'    => $errors,
					'message'   => sprintf(
						/* translators: %d: number of optimized images */
						esc_html__( 'Successfully processed %d image(s)!', 'captain-media-shield' ),
						$optimized
					),
				)
			);
		}
	}
}

Capms_Admin_Bar::get_instance();
