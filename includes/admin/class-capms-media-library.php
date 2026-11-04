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
			add_filter( 'attachment_fields_to_save', array( $this, 'capms_save_attachment_fields' ), 10, 2 );
			// Status markup also appears in the media modal (post editor etc.).
			add_action( 'admin_enqueue_scripts', array( $this, 'capms_column_style' ) );
			add_action( 'wp_ajax_capms_media_library_action', array( $this, 'capms_ajax_action' ) );
			add_action( 'admin_footer', array( $this, 'capms_render_quick_quality_modal' ) );
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
			echo $this->status_html( $attachment_id, 'column' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside.
		}

		/**
		 * Status summary + action links for one attachment.
		 *
		 * @since 0.0.1
		 * @param int    $attachment_id Attachment ID.
		 * @param string $context       'modal' | 'column'.
		 * @return string
		 */
		private function status_html( $attachment_id, $context = 'modal' ) {
			$mime = get_post_mime_type( $attachment_id );
			$row  = Capms_Stats::get( $attachment_id );

			if ( 'column' === $context ) {
				return $this->status_html_column( $attachment_id, $mime, $row );
			}

			return $this->status_html_modal( $attachment_id, $mime, $row );
		}

		/**
		 * Ultra-compact column markup for Media Library list view (keeps table row height normal).
		 *
		 * @param int         $attachment_id Attachment ID.
		 * @param string      $mime          File MIME type.
		 * @param array|false $row           Capms_Stats row.
		 * @return string
		 */
		private function status_html_column( $attachment_id, $mime, $row ) {
			if ( ! Capms_Image_Optimizer::is_supported( $mime ) && ! Capms_Video_Optimizer::is_supported( $mime ) ) {
				return '<span class="capms-list-muted">' . esc_html__( 'Not supported', 'captain-media-shield' ) . '</span>';
			}

			$is_image   = Capms_Image_Optimizer::is_supported( $mime );
			$custom_q   = $is_image ? get_post_meta( $attachment_id, '_capms_custom_quality', true ) : '';
			$global_q   = absint( Capms_Settings::get( 'image_quality', 80 ) );
			$has_custom = ( '' !== $custom_q && false !== $custom_q && is_numeric( $custom_q ) );
			$active_q   = $has_custom ? absint( $custom_q ) : $global_q;
			$is_custom  = ( $has_custom && $active_q !== $global_q );
			$thumb_url  = $is_image ? wp_get_attachment_image_url( $attachment_id, 'thumbnail' ) : '';
			$post_title = get_the_title( $attachment_id );
			if ( ! $post_title ) {
				$post_title = basename( (string) get_attached_file( $attachment_id ) );
			}

			$html = '<div class="capms-list-cell">';

			if ( $row && 'optimized' === $row['status'] ) {
				$saved           = max( 0, (int) $row['original_size'] - (int) $row['optimized_size'] );
				$pct             = (int) $row['original_size'] > 0 ? round( $saved / (int) $row['original_size'] * 100, 1 ) : 0;
				$saved_formatted = size_format( $saved, 1 ) ? size_format( $saved, 1 ) : '0 B';
				$saved_text      = sprintf( __( 'Saved %s (-%s%%)', 'captain-media-shield' ), $saved_formatted, $pct );

				$html .= '<div class="capms-list-row1">';
				$html .= '<span class="capms-meta-badge capms-badge--success"><span class="capms-badge-dot"></span>' . esc_html__( 'Optimized', 'captain-media-shield' ) . '</span>';
				$html .= '<span class="capms-list-saved-pct">-' . esc_html( $pct ) . '%</span>';
				if ( $is_image ) {
					$q_cls = $is_custom ? 'capms-list-quality-tag capms-list-quality-tag--custom' : 'capms-list-quality-tag capms-list-quality-tag--default';
					$q_tip = $is_custom ? sprintf( __( 'Custom Quality: %d%% (Click to change)', 'captain-media-shield' ), $active_q ) : sprintf( __( 'Default Quality: %d%% (Click to customize)', 'captain-media-shield' ), $global_q );
					$html .= '<button type="button" class="' . esc_attr( $q_cls ) . ' capms-open-quick-quality" data-id="' . absint( $attachment_id ) . '" data-title="' . esc_attr( $post_title ) . '" data-quality="' . esc_attr( $active_q ) . '" data-global="' . esc_attr( $global_q ) . '" data-is-custom="' . ( $is_custom ? '1' : '0' ) . '" data-status="optimized" data-saved="' . esc_attr( $saved_text ) . '" data-thumb="' . esc_url( $thumb_url ? $thumb_url : '' ) . '" title="' . esc_attr( $q_tip ) . '">Q:' . esc_html( $active_q ) . '%</button>';
				}
				$html .= '</div>';

				$original_url = wp_get_attachment_url( $attachment_id );
				$formats      = array(
					'WebP' => array( 'webp_size', 'webp' ),
					'AVIF' => array( 'avif_size', 'avif' ),
					'WebM' => array( 'webm_size', 'webm' ),
				);
				$format_links = array();
				foreach ( $formats as $label => $format ) {
					if ( (int) $row[ $format[0] ] <= 0 ) {
						continue;
					}
					$format_links[] = $original_url
						? '<a href="' . esc_url( $original_url . '.' . $format[1] ) . '" target="_blank" rel="noopener noreferrer" class="capms-list-format" title="' . esc_attr__( 'View converted file', 'captain-media-shield' ) . '">' . esc_html( $label ) . '</a>'
						: esc_html( $label );
				}

				$html .= '<div class="capms-list-row2">';
				$html .= '<span class="capms-list-size-info">' . esc_html( sprintf( __( 'Saved %s', 'captain-media-shield' ), $saved_formatted ) ) . '</span>';
				if ( $format_links ) {
					$html .= ' <span class="capms-sep">·</span> ' . implode( ', ', $format_links );
				}
				$html .= '</div>';

				$reopt_label = $is_custom ? sprintf( __( 'Re-optimize (%d%%)', 'captain-media-shield' ), $active_q ) : __( 'Re-optimize', 'captain-media-shield' );

				$html .= '<div class="capms-list-actions">';
				if ( ! empty( $row['backup_path'] ) ) {
					$html .= '<a href="' . esc_url( $this->action_url( 'restore', $attachment_id ) ) . '" class="capms-action-link capms-action-link--restore" data-capms-action="restore" data-capms-id="' . absint( $attachment_id ) . '" data-context="column" data-confirm-msg="' . esc_attr__( 'Restore the original file? Optimized and WebP/AVIF/WebM versions will be removed.', 'captain-media-shield' ) . '" onclick="return confirm(\'' . esc_js( __( 'Restore the original file? Optimized and WebP/AVIF/WebM versions will be removed.', 'captain-media-shield' ) ) . '\');">' . esc_html__( 'Restore', 'captain-media-shield' ) . '</a>';
					$html .= ' <span class="capms-sep">|</span> ';
				}
				$html .= '<a href="' . esc_url( $this->action_url( 'optimize', $attachment_id ) ) . '" class="capms-action-link" data-capms-action="optimize" data-capms-id="' . absint( $attachment_id ) . '" data-context="column">' . esc_html( $reopt_label ) . '</a>';
				if ( $is_image ) {
					$html .= ' <span class="capms-sep">|</span> ';
					$html .= '<button type="button" class="capms-action-btn-link capms-open-quick-quality" data-id="' . absint( $attachment_id ) . '" data-title="' . esc_attr( $post_title ) . '" data-quality="' . esc_attr( $active_q ) . '" data-global="' . esc_attr( $global_q ) . '" data-is-custom="' . ( $is_custom ? '1' : '0' ) . '" data-status="optimized" data-saved="' . esc_attr( $saved_text ) . '" data-thumb="' . esc_url( $thumb_url ? $thumb_url : '' ) . '" title="' . esc_attr__( 'Adjust quality & re-optimize', 'captain-media-shield' ) . '">' . esc_html__( 'Quality', 'captain-media-shield' ) . '</button>';
				}
				$html .= '</div>';

			} elseif ( $row && 'queued' === $row['status'] ) {
				$html .= '<div class="capms-list-row1">';
				$html .= '<span class="capms-meta-badge capms-badge--warning"><span class="capms-badge-dot capms-pulse"></span>' . esc_html__( 'Queued', 'captain-media-shield' ) . '</span>';
				$html .= '</div>';
			} else {
				$is_failed   = $row && 'failed' === $row['status'];
				$is_skipped  = $row && 'skipped' === $row['status'];
				$is_restored = $row && 'restored' === $row['status'];

				$html .= '<div class="capms-list-row1">';
				if ( $is_failed ) {
					$html .= '<span class="capms-meta-badge capms-badge--danger"><span class="capms-badge-dot"></span>' . esc_html__( 'Failed', 'captain-media-shield' ) . '</span>';
				} elseif ( $is_skipped ) {
					$html .= '<span class="capms-meta-badge capms-badge--warning"><span class="capms-badge-dot"></span>' . esc_html__( 'Skipped', 'captain-media-shield' ) . '</span>';
				} elseif ( $is_restored ) {
					$html .= '<span class="capms-meta-badge capms-badge--neutral"><span class="capms-badge-dot"></span>' . esc_html__( 'Restored', 'captain-media-shield' ) . '</span>';
				} else {
					$html .= '<span class="capms-meta-badge capms-badge--neutral"><span class="capms-badge-dot"></span>' . esc_html__( 'Not Optimized', 'captain-media-shield' ) . '</span>';
				}
				if ( $is_image ) {
					$q_cls = $is_custom ? 'capms-list-quality-tag capms-list-quality-tag--custom' : 'capms-list-quality-tag capms-list-quality-tag--default';
					$q_tip = $is_custom ? sprintf( __( 'Custom Quality: %d%% (Click to change)', 'captain-media-shield' ), $active_q ) : sprintf( __( 'Default Quality: %d%% (Click to customize)', 'captain-media-shield' ), $global_q );
					$html .= '<button type="button" class="' . esc_attr( $q_cls ) . ' capms-open-quick-quality" data-id="' . absint( $attachment_id ) . '" data-title="' . esc_attr( $post_title ) . '" data-quality="' . esc_attr( $active_q ) . '" data-global="' . esc_attr( $global_q ) . '" data-is-custom="' . ( $is_custom ? '1' : '0' ) . '" data-status="not_optimized" data-thumb="' . esc_url( $thumb_url ? $thumb_url : '' ) . '" title="' . esc_attr( $q_tip ) . '">Q:' . esc_html( $active_q ) . '%</button>';
				}
				$html .= '</div>';

				$btn_label = ( $is_failed || $is_skipped ) ? __( 'Retry', 'captain-media-shield' ) : ( $is_custom ? sprintf( __( 'Optimize (%d%%)', 'captain-media-shield' ), $active_q ) : __( 'Optimize Now', 'captain-media-shield' ) );
				$html .= '<div class="capms-list-actions">';
				$html .= '<a href="' . esc_url( $this->action_url( 'optimize', $attachment_id ) ) . '" class="capms-action-link capms-action-link--primary" data-capms-action="optimize" data-capms-id="' . absint( $attachment_id ) . '" data-context="column">' . esc_html( $btn_label ) . '</a>';
				if ( $is_image ) {
					$html .= ' <span class="capms-sep">|</span> ';
					$html .= '<button type="button" class="capms-action-btn-link capms-open-quick-quality" data-id="' . absint( $attachment_id ) . '" data-title="' . esc_attr( $post_title ) . '" data-quality="' . esc_attr( $active_q ) . '" data-global="' . esc_attr( $global_q ) . '" data-is-custom="' . ( $is_custom ? '1' : '0' ) . '" data-status="not_optimized" data-thumb="' . esc_url( $thumb_url ? $thumb_url : '' ) . '" title="' . esc_attr__( 'Set custom quality before optimizing', 'captain-media-shield' ) . '">' . esc_html__( 'Quality', 'captain-media-shield' ) . '</button>';
				}
				$html .= '</div>';
			}

			$html .= '</div>';
			return $html;
		}

		/**
		 * Minimal, lightweight markup for attachment details modal sidebar.
		 *
		 * @param int         $attachment_id Attachment ID.
		 * @param string      $mime          File MIME type.
		 * @param array|false $row           Capms_Stats row.
		 * @return string
		 */
		private function status_html_modal( $attachment_id, $mime, $row ) {
			if ( ! Capms_Image_Optimizer::is_supported( $mime ) && ! Capms_Video_Optimizer::is_supported( $mime ) ) {
				return '<div class="capms-meta-box capms-meta-box--minimal">'
					. '<div class="capms-meta-header">'
					. '<span class="capms-meta-brand">' . $this->icon_shield() . '<span>' . esc_html__( 'Media Shield', 'captain-media-shield' ) . '</span></span>'
					. '<span class="capms-meta-badge capms-badge--neutral"><span class="capms-badge-dot"></span>' . esc_html__( 'Not supported', 'captain-media-shield' ) . '</span>'
					. '</div>'
					. '</div>';
			}

			$is_image   = Capms_Image_Optimizer::is_supported( $mime );
			$custom_q   = $is_image ? get_post_meta( $attachment_id, '_capms_custom_quality', true ) : '';
			$global_q   = absint( Capms_Settings::get( 'image_quality', 80 ) );
			$has_custom = ( '' !== $custom_q && false !== $custom_q && is_numeric( $custom_q ) );
			$active_q   = $has_custom ? absint( $custom_q ) : $global_q;
			$is_custom  = ( $has_custom && $active_q !== $global_q );

			$html = '<div class="capms-meta-box capms-meta-box--minimal">';

			if ( $row && 'optimized' === $row['status'] ) {
				$saved           = max( 0, (int) $row['original_size'] - (int) $row['optimized_size'] );
				$pct             = (int) $row['original_size'] > 0 ? round( $saved / (int) $row['original_size'] * 100, 1 ) : 0;
				$saved_formatted = size_format( $saved, 1 ) ? size_format( $saved, 1 ) : '0 B';
				$orig_formatted  = size_format( (int) $row['original_size'], 1 );
				$opt_formatted   = size_format( (int) $row['optimized_size'], 1 );

				// Compact Header
				$html .= '<div class="capms-meta-header">';
				$html .= '<span class="capms-meta-brand">' . $this->icon_shield() . '<span>' . esc_html__( 'Media Shield', 'captain-media-shield' ) . '</span></span>';
				$html .= '<span class="capms-meta-badge capms-badge--success"><span class="capms-badge-dot"></span>' . esc_html__( 'Optimized', 'captain-media-shield' ) . '</span>';
				$html .= '</div>';

				// Compact Summary Line
				$html .= '<div class="capms-meta-summary">';
				$html .= '<span class="capms-saved-highlight">' . esc_html( sprintf( __( 'Saved %s', 'captain-media-shield' ), $saved_formatted ) ) . '</span>';
				$html .= '<span class="capms-stat-pct">-' . esc_html( $pct ) . '%</span>';
				if ( $orig_formatted && $opt_formatted ) {
					$html .= '<span class="capms-size-flow">' . esc_html( $orig_formatted ) . ' → ' . esc_html( $opt_formatted ) . '</span>';
				}
				$html .= '</div>';

				// Formats inline
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
					$size_str = size_format( (int) $row[ $format[0] ], 1 );
					$badges[] = $original_url
						? '<a href="' . esc_url( $original_url . '.' . $format[1] ) . '" target="_blank" rel="noopener noreferrer" class="capms-format-pill" title="' . esc_attr__( 'View converted file', 'captain-media-shield' ) . '"><span>' . esc_html( $label ) . '</span>' . ( $size_str ? '<small>(' . esc_html( $size_str ) . ')</small>' : '' ) . $this->icon_external() . '</a>'
						: '<span class="capms-format-pill"><span>' . esc_html( $label ) . '</span></span>';
				}
				if ( $badges ) {
					$html .= '<div class="capms-meta-formats-inline">';
					$html .= '<span class="capms-formats-label-sm">' . esc_html__( 'Next Generation:', 'captain-media-shield' ) . '</span> ';
					$html .= implode( ' ', $badges );
					$html .= '</div>';
				}

				// Quality Setting (for images)
				if ( $is_image ) {
					$html .= $this->quality_control_html( $attachment_id, $active_q, $global_q, $is_custom );
				}

				// Minimal Action Buttons
				$reopt_btn_text = $is_custom ? sprintf( __( 'Re-optimize at %d%%', 'captain-media-shield' ), $active_q ) : __( 'Re-optimize', 'captain-media-shield' );

				$html .= '<div class="capms-meta-footer">';
				if ( ! empty( $row['backup_path'] ) ) {
					$html .= '<a href="' . esc_url( $this->action_url( 'restore', $attachment_id ) ) . '" class="capms-btn-action capms-btn--restore" data-capms-action="restore" data-capms-id="' . absint( $attachment_id ) . '" data-context="modal" data-confirm-msg="' . esc_attr__( 'Restore the original file? Optimized and WebP/AVIF/WebM versions will be removed.', 'captain-media-shield' ) . '" onclick="return confirm(\'' . esc_js( __( 'Restore the original file? Optimized and WebP/AVIF/WebM versions will be removed.', 'captain-media-shield' ) ) . '\');">' . $this->icon_restore() . esc_html__( 'Restore Original', 'captain-media-shield' ) . '</a>';
				}
				$html .= '<a href="' . esc_url( $this->action_url( 'optimize', $attachment_id ) ) . '" class="capms-btn-action capms-btn--subtle capms-btn-reoptimize" data-capms-action="optimize" data-capms-id="' . absint( $attachment_id ) . '" data-context="modal">' . $this->icon_zap() . '<span class="capms-btn-label">' . esc_html( $reopt_btn_text ) . '</span></a>';
				$html .= '</div>';

			} elseif ( $row && 'queued' === $row['status'] ) {
				$html .= '<div class="capms-meta-header">';
				$html .= '<span class="capms-meta-brand">' . $this->icon_shield() . '<span>' . esc_html__( 'Media Shield', 'captain-media-shield' ) . '</span></span>';
				$html .= '<span class="capms-meta-badge capms-badge--warning"><span class="capms-badge-dot capms-pulse"></span>' . esc_html__( 'Queued', 'captain-media-shield' ) . '</span>';
				$html .= '</div>';

			} else {
				$is_failed   = $row && 'failed' === $row['status'];
				$is_skipped  = $row && 'skipped' === $row['status'];
				$is_restored = $row && 'restored' === $row['status'];

				$html .= '<div class="capms-meta-header">';
				$html .= '<span class="capms-meta-brand">' . $this->icon_shield() . '<span>' . esc_html__( 'Media Shield', 'captain-media-shield' ) . '</span></span>';

				if ( $is_failed ) {
					$html .= '<span class="capms-meta-badge capms-badge--danger"><span class="capms-badge-dot"></span>' . esc_html__( 'Failed', 'captain-media-shield' ) . '</span>';
				} elseif ( $is_skipped ) {
					$html .= '<span class="capms-meta-badge capms-badge--warning"><span class="capms-badge-dot"></span>' . esc_html__( 'Skipped', 'captain-media-shield' ) . '</span>';
				} elseif ( $is_restored ) {
					$html .= '<span class="capms-meta-badge capms-badge--neutral"><span class="capms-badge-dot"></span>' . esc_html__( 'Restored', 'captain-media-shield' ) . '</span>';
				} else {
					$html .= '<span class="capms-meta-badge capms-badge--neutral"><span class="capms-badge-dot"></span>' . esc_html__( 'Not Optimized', 'captain-media-shield' ) . '</span>';
				}
				$html .= '</div>';

				// Quality Setting (for images)
				if ( $is_image ) {
					$html .= $this->quality_control_html( $attachment_id, $active_q, $global_q, $is_custom );
				}

				$opt_btn_text = ( $is_failed || $is_skipped )
					? __( 'Retry Optimization', 'captain-media-shield' )
					: ( $is_custom ? sprintf( __( 'Optimize Now at %d%%', 'captain-media-shield' ), $active_q ) : __( 'Optimize Now', 'captain-media-shield' ) );

				$html .= '<div class="capms-meta-footer">';
				$html .= '<a href="' . esc_url( $this->action_url( 'optimize', $attachment_id ) ) . '" class="capms-btn-action capms-btn--primary capms-btn-optimize" data-capms-action="optimize" data-capms-id="' . absint( $attachment_id ) . '" data-context="modal">' . $this->icon_zap() . '<span class="capms-btn-label">' . esc_html( $opt_btn_text ) . '</span></a>';
				$html .= '</div>';
			}

			$html .= '</div>';
			return $html;
		}

		/**
		 * HTML for the interactive Quality Setting control in attachment modal.
		 *
		 * @param int  $attachment_id Attachment ID.
		 * @param int  $active_q      Current active quality (1-100).
		 * @param int  $global_q      Global settings default quality.
		 * @param bool $is_custom     True if different from global default.
		 * @return string
		 */
		private function quality_control_html( $attachment_id, $active_q, $global_q, $is_custom ) {
			$html  = '<div class="capms-meta-quality-box" data-capms-id="' . absint( $attachment_id ) . '">';
			$html .= '<div class="capms-quality-header">';
			$html .= '<span class="capms-quality-title">' . $this->icon_slider() . esc_html__( 'Quality Setting', 'captain-media-shield' ) . ':</span>';
			$html .= '<span class="capms-quality-current">';
			$html .= '<strong class="capms-quality-num">' . esc_html( $active_q ) . '%</strong>';
			if ( $is_custom ) {
				$html .= ' <span class="capms-tag-badge capms-tag-badge--custom">' . esc_html__( 'Custom', 'captain-media-shield' ) . '</span>';
			} else {
				$html .= ' <span class="capms-tag-badge capms-tag-badge--global">' . esc_html__( 'Global', 'captain-media-shield' ) . '</span>';
			}
			$html .= '</span>';
			$html .= '</div>';

			// Live Slider
			$html .= '<div class="capms-quality-slider-row">';
			$html .= '<input type="range" class="capms-quality-slider" min="20" max="100" step="1" value="' . esc_attr( $active_q ) . '" data-global="' . esc_attr( $global_q ) . '" data-id="' . absint( $attachment_id ) . '" />';
			$html .= '<input type="hidden" class="capms-selected-quality" name="capms_custom_quality" value="' . esc_attr( $active_q ) . '" />';
			$html .= '</div>';

			// Quick Preset Pills
			$html .= '<div class="capms-quality-presets">';
			$html .= '<button type="button" class="capms-preset-pill' . ( 40 === $active_q ? ' is-active' : '' ) . '" data-q="40" title="' . esc_attr__( 'Aggressive compression (Maximum disk saving)', 'captain-media-shield' ) . '">40%</button>';
			$html .= '<button type="button" class="capms-preset-pill' . ( 50 === $active_q ? ' is-active' : '' ) . '" data-q="50" title="' . esc_attr__( 'High compression', 'captain-media-shield' ) . '">50%</button>';
			$html .= '<button type="button" class="capms-preset-pill' . ( 65 === $active_q ? ' is-active' : '' ) . '" data-q="65" title="' . esc_attr__( 'Balanced quality', 'captain-media-shield' ) . '">65%</button>';
			$html .= '<button type="button" class="capms-preset-pill' . ( 75 === $active_q ? ' is-active' : '' ) . '" data-q="75" title="' . esc_attr__( 'Standard quality', 'captain-media-shield' ) . '">75%</button>';
			$html .= '<button type="button" class="capms-preset-pill capms-preset-pill--default' . ( ! $is_custom ? ' is-active' : '' ) . '" data-q="' . esc_attr( $global_q ) . '" title="' . esc_attr( sprintf( __( 'Reset to global default (%d%%)', 'captain-media-shield' ), $global_q ) ) . '">' . esc_html( sprintf( __( 'Default (%d%%)', 'captain-media-shield' ), $global_q ) ) . '</button>';
			$html .= '</div>';

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
			$mime = get_post_mime_type( $post->ID );
			if ( ! Capms_Image_Optimizer::is_supported( $mime ) && ! Capms_Video_Optimizer::is_supported( $mime ) ) {
				return $actions;
			}
			$row = Capms_Stats::get( $post->ID );
			if ( $row && 'optimized' === $row['status'] && ! empty( $row['backup_path'] ) ) {
				$actions['capms_restore'] = '<a href="' . esc_url( $this->action_url( 'restore', $post->ID ) ) . '">' . esc_html__( 'Restore Original', 'captain-media-shield' ) . '</a>';
			}

			if ( Capms_Image_Optimizer::is_supported( $mime ) ) {
				$custom_q   = get_post_meta( $post->ID, '_capms_custom_quality', true );
				$global_q   = absint( Capms_Settings::get( 'image_quality', 80 ) );
				$has_custom = ( '' !== $custom_q && false !== $custom_q && is_numeric( $custom_q ) );
				$active_q   = $has_custom ? absint( $custom_q ) : $global_q;
				$thumb_url  = wp_get_attachment_image_url( $post->ID, 'thumbnail' );
				$title      = get_the_title( $post->ID );
				if ( ! $title ) {
					$title = basename( (string) get_attached_file( $post->ID ) );
				}
				$saved_text = '';
				if ( $row && 'optimized' === $row['status'] ) {
					$saved      = max( 0, (int) $row['original_size'] - (int) $row['optimized_size'] );
					$pct        = (int) $row['original_size'] > 0 ? round( $saved / (int) $row['original_size'] * 100, 1 ) : 0;
					$saved_text = sprintf( __( 'Saved %s (-%s%%)', 'captain-media-shield' ), size_format( $saved, 1 ), $pct );
				}

				$actions['capms_quality'] = sprintf(
					'<a href="#" class="capms-open-quick-quality" data-id="%d" data-title="%s" data-quality="%d" data-global="%d" data-is-custom="%s" data-status="%s" data-saved="%s" data-thumb="%s" title="%s">%s</a>',
					absint( $post->ID ),
					esc_attr( $title ),
					absint( $active_q ),
					absint( $global_q ),
					$has_custom ? '1' : '0',
					$row ? esc_attr( $row['status'] ) : 'not_optimized',
					esc_attr( $saved_text ),
					esc_url( $thumb_url ? $thumb_url : '' ),
					esc_attr__( 'Quickly adjust image quality setting', 'captain-media-shield' ),
					esc_html__( 'Quality Setting', 'captain-media-shield' )
				);
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
				'html'  => $this->status_html( $post->ID, 'modal' ),
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
				$quality = isset( $_GET['quality'] ) ? sanitize_text_field( wp_unslash( $_GET['quality'] ) ) : ( isset( $_POST['quality'] ) ? sanitize_text_field( wp_unslash( $_POST['quality'] ) ) : null );
				$result  = Capms_Processor::get_instance()->process_attachment( $id, true, $quality );
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

			$back = '';
			if ( ! empty( $_GET['_wp_http'] ) ) {
				$candidate = esc_url_raw( rawurldecode( wp_unslash( $_GET['_wp_http'] ) ) );
				if ( false === strpos( $candidate, 'admin-ajax.php' ) ) {
					$back = $candidate;
				}
			}

			if ( ! $back ) {
				$referer = wp_get_referer();
				if ( $referer && false === strpos( $referer, 'admin-ajax.php' ) ) {
					$back = $referer;
				}
			}

			// If the destination is upload.php without mode=list and without item, keep the attachment modal open:
			if ( $back && false !== strpos( $back, 'upload.php' ) && false === strpos( $back, 'mode=list' ) && false === strpos( $back, 'item=' ) ) {
				$back = add_query_arg( 'item', $id, $back );
			}

			if ( ! $back ) {
				$back = admin_url( 'upload.php?item=' . $id );
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
		 * AJAX handler for Optimize / Restore from media library and attachment details modal.
		 *
		 * @since 0.1.0
		 * @return void
		 */
		public function capms_ajax_action() {
			check_ajax_referer( 'capms_media_action_nonce', 'nonce' );

			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( array( 'message' => esc_html__( 'You do not have permission to do this.', 'captain-media-shield' ) ) );
			}

			$id      = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;
			$do      = isset( $_POST['do'] ) ? sanitize_key( wp_unslash( $_POST['do'] ) ) : '';
			$context = isset( $_POST['context'] ) ? sanitize_key( wp_unslash( $_POST['context'] ) ) : 'modal';

			if ( ! $id || ! in_array( $do, array( 'optimize', 'restore', 'save_quality' ), true ) ) {
				wp_send_json_error( array( 'message' => esc_html__( 'Invalid request.', 'captain-media-shield' ) ) );
			}

			if ( 'restore' === $do ) {
				$result = Capms_Backup::restore( $id );
				$msg    = esc_html__( 'Original file restored.', 'captain-media-shield' );
			} elseif ( 'save_quality' === $do ) {
				$quality = isset( $_POST['quality'] ) ? sanitize_text_field( wp_unslash( $_POST['quality'] ) ) : '';
				if ( 'default' === $quality || '' === $quality ) {
					delete_post_meta( $id, '_capms_custom_quality' );
				} else {
					$q_val = absint( $quality );
					if ( $q_val >= 1 && $q_val <= 100 ) {
						update_post_meta( $id, '_capms_custom_quality', $q_val );
					}
				}
				$result = true;
				$msg    = esc_html__( 'Quality setting saved.', 'captain-media-shield' );
			} else {
				$quality = isset( $_POST['quality'] ) ? sanitize_text_field( wp_unslash( $_POST['quality'] ) ) : ( isset( $_GET['quality'] ) ? sanitize_text_field( wp_unslash( $_GET['quality'] ) ) : null );
				$result  = Capms_Processor::get_instance()->process_attachment( $id, true, $quality );
				$msg     = esc_html__( 'File optimized.', 'captain-media-shield' );
			}

			if ( is_wp_error( $result ) ) {
				wp_send_json_error( array( 'message' => $result->get_error_message() ) );
			}

			wp_send_json_success(
				array(
					'html'    => $this->status_html( $id, $context ),
					'message' => $msg,
				)
			);
		}

		/**
		 * Enqueue Media Library & Attachment Details styles & scripts.
		 *
		 * @since 0.0.1
		 * @return void
		 */
		public function capms_column_style() {
			$css_file = CAPMS_PATH . 'assets/css/media-library.css';
			$css_ver  = file_exists( $css_file ) ? filemtime( $css_file ) : CAPMS_VERSION;
			wp_enqueue_style( 'capms-media-library', CAPMS_URL . 'assets/css/media-library.css', array(), $css_ver );

			$js_file = CAPMS_PATH . 'assets/js/media-library.js';
			$js_ver  = file_exists( $js_file ) ? filemtime( $js_file ) : CAPMS_VERSION;
			wp_enqueue_script( 'capms-media-library', CAPMS_URL . 'assets/js/media-library.js', array( 'jquery' ), $js_ver, true );
			wp_localize_script(
				'capms-media-library',
				'capms_media_vars',
				array(
					'ajax_url' => admin_url( 'admin-ajax.php' ),
					'nonce'    => wp_create_nonce( 'capms_media_action_nonce' ),
				)
			);
		}

		/**
		 * Save custom quality if attachment is saved through standard form.
		 *
		 * @param array $post       Post data array.
		 * @param array $attachment Attachment field inputs.
		 * @return array
		 */
		public function capms_save_attachment_fields( $post, $attachment ) {
			if ( isset( $attachment['capms_custom_quality'] ) ) {
				$val = sanitize_text_field( $attachment['capms_custom_quality'] );
				if ( 'default' === $val || '' === $val ) {
					delete_post_meta( $post['ID'], '_capms_custom_quality' );
				} elseif ( is_numeric( $val ) ) {
					$num = absint( $val );
					if ( $num >= 1 && $num <= 100 ) {
						update_post_meta( $post['ID'], '_capms_custom_quality', $num );
					}
				}
			}
			return $post;
		}

		/**
		 * Render Quick Quality Modal in admin footer on media screens.
		 *
		 * @since 0.1.0
		 * @return void
		 */
		public function capms_render_quick_quality_modal() {
			if ( ! current_user_can( 'manage_options' ) ) {
				return;
			}
			$screen = get_current_screen();
			if ( ! $screen || 'upload' !== $screen->base ) {
				return;
			}

			$global_q = absint( Capms_Settings::get( 'image_quality', 80 ) );
			?>
			<div id="capms-quick-quality-modal" class="capms-modal-backdrop" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="capms-modal-heading">
				<div class="capms-modal-card">
					<div class="capms-modal-header">
						<div class="capms-modal-header-left">
							<span class="capms-modal-icon"><?php echo $this->icon_shield(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></span>
							<div>
								<h3 id="capms-modal-heading" class="capms-modal-heading"><?php esc_html_e( 'Image Quality Setting', 'captain-media-shield' ); ?></h3>
								<p class="capms-modal-subheading"><?php esc_html_e( 'Quickly tune compression quality for this image', 'captain-media-shield' ); ?></p>
							</div>
						</div>
						<button type="button" class="capms-modal-close" aria-label="<?php esc_attr_e( 'Close', 'captain-media-shield' ); ?>">&times;</button>
					</div>

					<div class="capms-modal-preview">
						<div class="capms-modal-thumb-wrap">
							<img id="capms-modal-thumb" src="" alt="" class="capms-modal-thumb" />
						</div>
						<div class="capms-modal-file-info">
							<div class="capms-modal-filename" id="capms-modal-filename"></div>
							<div class="capms-modal-meta-line">
								<span id="capms-modal-status-badge" class="capms-meta-badge capms-badge--neutral"></span>
								<span id="capms-modal-saved-text" class="capms-modal-saved-text"></span>
							</div>
						</div>
					</div>

					<div class="capms-modal-body">
						<div class="capms-modal-slider-box">
							<div class="capms-modal-slider-header">
								<span class="capms-modal-slider-label"><?php esc_html_e( 'Compression Quality Level:', 'captain-media-shield' ); ?></span>
								<span class="capms-modal-quality-badge">
									<span id="capms-modal-q-val" class="capms-modal-q-num">80%</span>
									<span id="capms-modal-q-tag" class="capms-tag-badge capms-tag-badge--global"><?php esc_html_e( 'Global', 'captain-media-shield' ); ?></span>
								</span>
							</div>

							<div class="capms-slider-track-wrap">
								<span class="capms-slider-extreme"><?php esc_html_e( 'Max Saving (20%)', 'captain-media-shield' ); ?></span>
								<input type="range" id="capms-modal-slider" class="capms-quality-slider capms-modal-range" min="20" max="100" step="1" value="<?php echo esc_attr( $global_q ); ?>" data-global="<?php echo esc_attr( $global_q ); ?>" />
								<span class="capms-slider-extreme"><?php esc_html_e( 'Max Quality (100%)', 'captain-media-shield' ); ?></span>
							</div>

							<div class="capms-modal-presets-label"><?php esc_html_e( 'Quick Presets:', 'captain-media-shield' ); ?></div>
							<div class="capms-quality-presets capms-modal-presets">
								<button type="button" class="capms-preset-pill" data-q="40" title="<?php esc_attr_e( 'Aggressive compression (Maximum disk saving)', 'captain-media-shield' ); ?>">40% Web Max</button>
								<button type="button" class="capms-preset-pill" data-q="50" title="<?php esc_attr_e( 'High compression', 'captain-media-shield' ); ?>">50% High Saving</button>
								<button type="button" class="capms-preset-pill" data-q="65" title="<?php esc_attr_e( 'Balanced quality & speed', 'captain-media-shield' ); ?>">65% Balanced</button>
								<button type="button" class="capms-preset-pill" data-q="75" title="<?php esc_attr_e( 'Standard quality', 'captain-media-shield' ); ?>">75% Standard</button>
								<button type="button" class="capms-preset-pill capms-preset-pill--default" data-q="<?php echo esc_attr( $global_q ); ?>" id="capms-modal-preset-default"><?php echo esc_html( sprintf( __( 'Default (%d%%)', 'captain-media-shield' ), $global_q ) ); ?></button>
							</div>
						</div>

						<div class="capms-modal-tip">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
							<span><?php esc_html_e( 'Lower quality (e.g. 40-50%) maximizes disk savings for heavy images, while 75-85% preserves fine photo details. Original file is safely backed up.', 'captain-media-shield' ); ?></span>
						</div>
					</div>

					<div class="capms-modal-footer">
						<button type="button" class="button capms-modal-btn-cancel"><?php esc_html_e( 'Cancel', 'captain-media-shield' ); ?></button>
						<div class="capms-modal-footer-right">
							<button type="button" class="button capms-modal-btn-save-only" id="capms-modal-save-only" title="<?php esc_attr_e( 'Save setting without re-compressing immediately', 'captain-media-shield' ); ?>"><?php esc_html_e( 'Save Quality Only', 'captain-media-shield' ); ?></button>
							<button type="button" class="button button-primary capms-modal-btn-optimize" id="capms-modal-apply-optimize">
								<span class="capms-btn-icon">⚡</span>
								<span class="capms-btn-label"><?php esc_html_e( 'Save & Optimize Now', 'captain-media-shield' ); ?></span>
							</button>
						</div>
					</div>
				</div>
			</div>
			<?php
		}

		/**
		 * Slider icon SVG.
		 *
		 * @return string
		 */
		private function icon_slider() {
			return '<svg class="capms-icon capms-icon--slider" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>';
		}

		/**
		 * Shield icon SVG.
		 *
		 * @return string
		 */
		private function icon_shield() {
			return '<svg class="capms-icon capms-icon--shield" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
		}

		/**
		 * Zap/Lightning icon SVG.
		 *
		 * @return string
		 */
		private function icon_zap() {
			return '<svg class="capms-icon capms-icon--zap" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
		}

		/**
		 * Restore/Undo icon SVG.
		 *
		 * @return string
		 */
		private function icon_restore() {
			return '<svg class="capms-icon capms-icon--restore" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.35"/></svg>';
		}

		/**
		 * External link icon SVG.
		 *
		 * @return string
		 */
		private function icon_external() {
			return '<svg class="capms-icon capms-icon--ext" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
		}
	}

	Capms_Media_Library::get_instance();
}
