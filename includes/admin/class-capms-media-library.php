<?php
/**
 * Media Library integration - status column, Optimize / Restore actions.
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

if ( ! class_exists( 'Capms_Media_Library' ) ) {

	/**
	 * Capms_Media_Library
	 *
	 * @since 0.0.1
	 */
	class Capms_Media_Library {

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
		 * Hooks.
		 *
		 * @since 0.0.1
		 */
		public function __construct() {
			add_filter( 'manage_media_columns', array( $this, 'capms_add_column' ) );
			add_action( 'manage_media_custom_column', array( $this, 'capms_render_column' ), 10, 2 );
			add_filter( 'media_row_actions', array( $this, 'capms_row_actions' ), 10, 2 );
			add_filter( 'attachment_fields_to_edit', array( $this, 'capms_attachment_field' ), 10, 2 );
			add_action( 'admin_post_capms_media_action', array( $this, 'capms_handle_action' ) );
			add_action( 'admin_notices', array( $this, 'capms_action_notice' ) );
			// Status markup also appears in the media modal (post editor etc.).
			add_action( 'admin_enqueue_scripts', array( $this, 'capms_column_style' ) );
		}

		/**
		 * Add the "Media Shield" column.
		 *
		 * @since 0.0.1
		 * @param array $columns Columns.
		 * @return array
		 */
		public function capms_add_column( $columns ) {
			if ( current_user_can( 'manage_options' ) ) {
				$columns['capms_status'] = esc_html__( 'Media Shield', 'captain-media-shield' );
			}
			return $columns;
		}

		/**
		 * Column content.
		 *
		 * @since 0.0.1
		 * @param string $column        Column key.
		 * @param int    $attachment_id Attachment ID.
		 * @return void
		 */
		public function capms_render_column( $column, $attachment_id ) {
			if ( 'capms_status' !== $column ) {
				return;
			}
			echo $this->status_html( $attachment_id ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside.
		}

		/**
		 * Status summary + action links for one attachment.
		 *
		 * @since 0.0.1
		 * @param int $attachment_id Attachment ID.
		 * @return string
		 */
		private function status_html( $attachment_id ) {
			$mime = get_post_mime_type( $attachment_id );
			if ( ! Capms_Image_Optimizer::is_supported( $mime ) && ! Capms_Video_Optimizer::is_supported( $mime ) ) {
				return '<span class="capms-ml-muted">' . esc_html__( 'Not supported', 'captain-media-shield' ) . '</span>';
			}

			$row  = Capms_Stats::get( $attachment_id );
			$html = '<div class="capms-ml-status">';

			if ( $row && 'optimized' === $row['status'] ) {
				$saved = max( 0, (int) $row['original_size'] - (int) $row['optimized_size'] );
				$pct   = (int) $row['original_size'] > 0 ? round( $saved / (int) $row['original_size'] * 100, 1 ) : 0;

				$html .= '<strong class="capms-ml-ok">' . esc_html__( 'Optimized', 'captain-media-shield' ) . '</strong>';
				/* translators: 1: saved size, 2: percent */
				$html .= '<span>' . esc_html( sprintf( __( 'Saved %1$s (%2$s%%)', 'captain-media-shield' ), size_format( $saved, 1 ) ? size_format( $saved, 1 ) : '0 B', $pct ) ) . '</span>';

				// Direct links to the converted copies. They sit next to the original
				// with the format added to the end of its URL (photo.jpg.webp).
				$original_url = wp_get_attachment_url( $attachment_id );
				$formats      = array(
					'WebP' => array( 'webp_size', 'webp' ),
					'AVIF' => array( 'avif_size', 'avif' ),
					'WebM' => array( 'webm_size', 'webm' ),
				);
				$badges       = array();
				foreach ( $formats as $label => $format ) {
					if ( (int) $row[ $format[0] ] <= 0 ) {
						continue;
					}
					$badges[] = $original_url
						? '<a href="' . esc_url( $original_url . '.' . $format[1] ) . '" target="_blank" rel="noopener noreferrer">' . esc_html( $label ) . '</a>'
						: esc_html( $label );
				}
				if ( $badges ) {
					$html .= '<span class="capms-ml-badges">' . implode( ' · ', $badges ) . '</span>'; // Each badge is escaped above.
				}
				if ( ! empty( $row['backup_path'] ) ) {
					$html .= '<a href="' . esc_url( $this->action_url( 'restore', $attachment_id ) ) . '" onclick="return confirm(\'' . esc_js( __( 'Restore the original file? Optimized and WebP/AVIF/WebM versions will be removed.', 'captain-media-shield' ) ) . '\');">' . esc_html__( 'Restore Original', 'captain-media-shield' ) . '</a>';
				} else {
					$html .= '<span class="capms-ml-muted">' . esc_html__( 'No backup kept', 'captain-media-shield' ) . '</span>';
				}
			} elseif ( $row && 'queued' === $row['status'] ) {
				$html .= '<strong>' . esc_html__( 'Queued', 'captain-media-shield' ) . '</strong>';
				$html .= '<span class="capms-ml-muted">' . esc_html__( 'Processing in background…', 'captain-media-shield' ) . '</span>';
			} else {
				if ( $row && in_array( $row['status'], array( 'skipped', 'failed' ), true ) ) {
					$html .= '<strong class="capms-ml-warn">' . esc_html( 'failed' === $row['status'] ? __( 'Failed', 'captain-media-shield' ) : __( 'Skipped', 'captain-media-shield' ) ) . '</strong>';
					if ( ! empty( $row['message'] ) ) {
						$html .= '<span class="capms-ml-muted">' . esc_html( $row['message'] ) . '</span>';
					}
				} elseif ( $row && 'restored' === $row['status'] ) {
					$html .= '<span class="capms-ml-muted">' . esc_html__( 'Original restored', 'captain-media-shield' ) . '</span>';
				} else {
					$html .= '<span class="capms-ml-muted">' . esc_html__( 'Not optimized', 'captain-media-shield' ) . '</span>';
				}
				$html .= '<a href="' . esc_url( $this->action_url( 'optimize', $attachment_id ) ) . '">' . esc_html__( 'Optimize Now', 'captain-media-shield' ) . '</a>';
			}

			$html .= '</div>';
			return $html;
		}

		/**
		 * Row actions in list mode.
		 *
		 * @since 0.0.1
		 * @param array   $actions Actions.
		 * @param WP_Post $post    Attachment.
		 * @return array
		 */
		public function capms_row_actions( $actions, $post ) {
			if ( ! current_user_can( 'manage_options' ) ) {
				return $actions;
			}
			$row = Capms_Stats::get( $post->ID );
			if ( $row && 'optimized' === $row['status'] && ! empty( $row['backup_path'] ) ) {
				$actions['capms_restore'] = '<a href="' . esc_url( $this->action_url( 'restore', $post->ID ) ) . '">' . esc_html__( 'Restore Original', 'captain-media-shield' ) . '</a>';
			}
			return $actions;
		}

		/**
		 * Field shown in the attachment details modal / edit screen.
		 *
		 * @since 0.0.1
		 * @param array   $fields Fields.
		 * @param WP_Post $post   Attachment.
		 * @return array
		 */
		public function capms_attachment_field( $fields, $post ) {
			if ( ! current_user_can( 'manage_options' ) ) {
				return $fields;
			}
			$mime = get_post_mime_type( $post->ID );
			if ( ! Capms_Image_Optimizer::is_supported( $mime ) && ! Capms_Video_Optimizer::is_supported( $mime ) ) {
				return $fields;
			}

			$fields['capms_status'] = array(
				'label' => esc_html__( 'Media Shield', 'captain-media-shield' ),
				'input' => 'html',
				'html'  => $this->status_html( $post->ID ),
			);
			return $fields;
		}

		/**
		 * Nonce'd admin-post URL for an action.
		 *
		 * @since 0.0.1
		 * @param string $action        optimize|restore.
		 * @param int    $attachment_id Attachment ID.
		 * @return string
		 */
		private function action_url( $action, $attachment_id ) {
			return wp_nonce_url(
				add_query_arg(
					array(
						'action'   => 'capms_media_action',
						'do'       => $action,
						'id'       => absint( $attachment_id ),
						'_wp_http' => rawurlencode( isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '' ),
					),
					admin_url( 'admin-post.php' )
				),
				'capms_media_' . $action . '_' . absint( $attachment_id )
			);
		}

		/**
		 * Handle Optimize / Restore clicks.
		 *
		 * @since 0.0.1
		 * @return void
		 */
		public function capms_handle_action() {
			// phpcs:disable WordPress.Security.NonceVerification.Recommended -- check_admin_referer() below needs these two values to build its action name.
			$id = isset( $_GET['id'] ) ? absint( $_GET['id'] ) : 0;
			$do = isset( $_GET['do'] ) ? sanitize_key( wp_unslash( $_GET['do'] ) ) : '';
			// phpcs:enable WordPress.Security.NonceVerification.Recommended

			if ( ! $id || ! in_array( $do, array( 'optimize', 'restore' ), true ) ) {
				wp_die( esc_html__( 'Invalid request.', 'captain-media-shield' ) );
			}
			check_admin_referer( 'capms_media_' . $do . '_' . $id );
			if ( ! current_user_can( 'manage_options' ) ) {
				wp_die( esc_html__( 'You do not have permission to do this.', 'captain-media-shield' ) );
			}

			if ( 'restore' === $do ) {
				$result = Capms_Backup::restore( $id );
			} else {
				$result = Capms_Processor::get_instance()->process_attachment( $id );
			}

			$status = is_wp_error( $result ) ? 'error' : 'success';
			set_transient(
				'capms_ml_notice_' . get_current_user_id(),
				array(
					'status'  => $status,
					'message' => is_wp_error( $result ) ? $result->get_error_message() : ( 'restore' === $do ? __( 'Original file restored.', 'captain-media-shield' ) : __( 'File optimized.', 'captain-media-shield' ) ),
				),
				MINUTE_IN_SECONDS
			);

			$back = isset( $_GET['_wp_http'] ) ? esc_url_raw( rawurldecode( wp_unslash( $_GET['_wp_http'] ) ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			// Links rendered inside the media modal were built during an
			// admin-ajax request - never send the user back there.
			if ( ! $back || false !== strpos( $back, 'admin-ajax.php' ) ) {
				$back = admin_url( 'upload.php' );
			}
			wp_safe_redirect( $back );
			exit;
		}

		/**
		 * One-shot notice after an action.
		 *
		 * @since 0.0.1
		 * @return void
		 */
		public function capms_action_notice() {
			$key    = 'capms_ml_notice_' . get_current_user_id();
			$notice = get_transient( $key );
			if ( ! $notice ) {
				return;
			}
			delete_transient( $key );
			printf(
				'<div class="notice notice-%1$s is-dismissible"><p><strong>%2$s</strong> %3$s</p></div>',
				'error' === $notice['status'] ? 'error' : 'success',
				esc_html__( 'Captain Media Shield:', 'captain-media-shield' ),
				esc_html( $notice['message'] )
			);
		}

		/**
		 * Small styles for the column, added through the styles API.
		 *
		 * @since 0.0.1
		 * @return void
		 */
		public function capms_column_style() {
			$css = '.column-capms_status{width:170px}'
				. '.capms-ml-status{display:flex;flex-direction:column;gap:2px;font-size:12px;line-height:1.5}'
				. '.capms-ml-ok{color:#166534}'
				. '.capms-ml-warn{color:#92400e}'
				. '.capms-ml-muted{color:#6b7280}'
				. '.capms-ml-badges{color:#2271b1;font-weight:600}';

			wp_register_style( 'capms-media-library', false, array(), CAPMS_VERSION );
			wp_enqueue_style( 'capms-media-library' );
			wp_add_inline_style( 'capms-media-library', $css );
		}
	}

	Capms_Media_Library::get_instance();
}
