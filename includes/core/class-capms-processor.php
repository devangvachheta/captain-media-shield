<?php
/**
 * Orchestrates optimization for uploads, bulk runs and deletes.
 *
 * @since      0.0.1
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

if ( ! class_exists( 'Capms_Processor' ) ) {

	/**
	 * Upload flow
	 *  1. wp_handle_upload        - back up the untouched original, then
	 *                               auto-rotate / downscale it in place.
	 *  2. WordPress builds sizes  - at our quality (wp_editor_set_quality).
	 *  3. wp_generate_attachment_metadata
	 *       images: recompress, strip, WebP/AVIF for every size.
	 *       videos: queued to WP-Cron so the upload request returns fast.
	 *
	 * The bulk optimizer calls process_attachment() for existing media.
	 *
	 * @since 0.0.1
	 */
	class Capms_Processor {

		/**
		 * Member Variable
		 *
		 * @var instance
		 */
		private static $instance;

		/**
		 * Set while restoring so regenerating metadata doesn't re-optimize.
		 *
		 * @var bool
		 */
		public static $skip_processing = false;

		/**
		 * Uploads prepared in this request, keyed by normalized file path.
		 *
		 * @var array
		 */
		private static $pending = array();

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
			add_filter( 'wp_handle_upload', array( $this, 'capms_handle_upload' ), 20, 2 );
			add_filter( 'wp_generate_attachment_metadata', array( $this, 'capms_generate_metadata' ), 20, 3 );
			add_filter( 'wp_editor_set_quality', array( $this, 'capms_editor_quality' ), 20, 2 );
			add_action( 'delete_attachment', array( $this, 'capms_delete_attachment' ), 10, 1 );
			add_action( 'capms_process_video_event', array( $this, 'capms_process_video_event' ), 10, 1 );
			add_filter( 'wp_generate_attachment_metadata', array( $this, 'capms_gif_metadata' ), 30, 3 );
			add_action( 'capms_process_gif_event', array( $this, 'capms_process_gif_event' ), 10, 1 );
		}

		/**
		 * Upload hook: back up and prepare the original.
		 *
		 * @since 0.0.1
		 * @param array  $upload  { file, url, type }.
		 * @param string $context 'upload' | 'sideload'.
		 * @return array
		 */
		public function capms_handle_upload( $upload, $context = 'upload' ) {
			unset( $context );

			if ( ! empty( $upload['error'] ) || empty( $upload['file'] ) || ! Capms_Settings::get( 'optimize_on_upload', true ) ) {
				return $upload;
			}

			$file  = $upload['file'];
			$mime  = isset( $upload['type'] ) ? $upload['type'] : '';

			// Folder / file rules from the Exclude Rules setting.
			if ( Capms_Settings::is_excluded( 0, $file ) ) {
				return $upload;
			}

			$image = Capms_Image_Optimizer::is_supported( $mime );
			$video = Capms_Video_Optimizer::is_supported( $mime );

			if ( ! $image && ! $video ) {
				return $upload;
			}

			$entry = array(
				'original_size' => (int) filesize( $file ),
				'backup'        => '',
				'recompressed'  => false,
			);

			if ( Capms_Settings::get( 'backup_enabled' ) ) {
				$backup          = Capms_Backup::backup_file( $file );
				$entry['backup'] = $backup ? $backup : '';
			}

			if ( $image ) {
				$this->start_editor_guard();
				$entry['recompressed'] = Capms_Image_Optimizer::prepare_original( $file, $mime );
				$this->stop_editor_guard();

				if ( Capms_Settings::get( 'strip_metadata' ) ) {
					Capms_Image_Optimizer::strip_metadata( $file, $mime );
				}
			}

			self::$pending[ wp_normalize_path( $file ) ] = $entry;

			return $upload;
		}

		/**
		 * Metadata hook: optimize sizes / queue videos.
		 *
		 * @since 0.0.1
		 * @param array  $metadata      Attachment metadata.
		 * @param int    $attachment_id Attachment ID.
		 * @param string $context       'create' | 'update'.
		 * @return array
		 */
		public function capms_generate_metadata( $metadata, $attachment_id, $context = 'create' ) {
			if ( self::$skip_processing || 'create' !== $context ) {
				return $metadata;
			}

			$file = get_attached_file( $attachment_id );
			$key  = $file ? wp_normalize_path( $file ) : '';

			// Uploads that were "-scaled" by core: the pending entry is
			// keyed by the original (unscaled) path.
			if ( $key && ! isset( self::$pending[ $key ] ) && ! empty( $metadata['original_image'] ) ) {
				$key = wp_normalize_path( trailingslashit( dirname( $file ) ) . $metadata['original_image'] );
			}

			if ( ! $key || ! isset( self::$pending[ $key ] ) ) {
				return $metadata;
			}

			$entry = self::$pending[ $key ];
			unset( self::$pending[ $key ] );

			$mime = get_post_mime_type( $attachment_id );

			// Excluded by attachment ID: leave the file alone (the upload
			// step already ran, so drop the backup it made).
			if ( Capms_Settings::is_excluded( $attachment_id, $file ) ) {
				if ( ! empty( $entry['backup'] ) ) {
					$abs = Capms_Backup::absolute( $entry['backup'] );
					if ( $abs ) {
						wp_delete_file( $abs );
					}
				}
				Capms_Stats::save(
					$attachment_id,
					array(
						'media_type'     => 0 === strpos( (string) $mime, 'video/' ) ? 'video' : 'image',
						'status'         => 'skipped',
						'original_size'  => (int) $entry['original_size'],
						'optimized_size' => (int) $entry['original_size'],
						'message'        => __( 'Excluded by your exclude rules.', 'captain-media-shield' ),
					)
				);
				return $metadata;
			}

			if ( Capms_Image_Optimizer::is_supported( $mime ) ) {
				$this->process_image( $attachment_id, $metadata, $entry );
				$metadata = $this->refresh_filesizes( $attachment_id, $metadata );
			} elseif ( Capms_Video_Optimizer::is_supported( $mime ) ) {
				$this->queue_video( $attachment_id, $entry );
			}

			return $metadata;
		}

		/**
		 * Apply our quality to every size WordPress generates.
		 *
		 * @since 0.0.1
		 * @param int    $quality Default quality.
		 * @param string $mime    Mime type.
		 * @return int
		 */
		public function capms_editor_quality( $quality, $mime = '' ) {
			if ( in_array( $mime, array( 'image/jpeg', 'image/webp', 'image/avif' ), true ) && Capms_Settings::get( 'optimize_on_upload', true ) ) {
				return absint( Capms_Settings::get( 'image_quality', $quality ) );
			}
			return $quality;
		}

		/**
		 * Optimize any attachment (bulk optimizer / "Optimize now").
		 *
		 * @since 0.0.1
		 * @param int $attachment_id Attachment ID.
		 * @return array|WP_Error Saved row.
		 */
		public function process_attachment( $attachment_id ) {
			$attachment_id = absint( $attachment_id );
			$file          = get_attached_file( $attachment_id );
			$mime          = get_post_mime_type( $attachment_id );

			if ( ! $file || ! is_file( $file ) ) {
				return new WP_Error( 'capms_no_file', __( 'File not found on disk.', 'captain-media-shield' ) );
			}

			$existing = Capms_Stats::get( $attachment_id );
			if ( $existing && 'optimized' === $existing['status'] ) {
				return $existing;
			}

			if ( Capms_Settings::is_excluded( $attachment_id, $file ) ) {
				Capms_Stats::save(
					$attachment_id,
					array(
						'media_type'     => 0 === strpos( (string) $mime, 'video/' ) ? 'video' : 'image',
						'status'         => 'skipped',
						'original_size'  => (int) filesize( $file ),
						'optimized_size' => (int) filesize( $file ),
						'message'        => __( 'Excluded by your exclude rules.', 'captain-media-shield' ),
					)
				);
				return Capms_Stats::get( $attachment_id );
			}

			if ( 'image/gif' === $mime ) {
				return $this->process_gif( $attachment_id, $file );
			}

			$entry = array(
				'original_size' => (int) filesize( $file ),
				'backup'        => '',
				'recompressed'  => false,
			);

			if ( Capms_Settings::get( 'backup_enabled' ) ) {
				$backup          = Capms_Backup::backup_file( $file );
				$entry['backup'] = $backup ? $backup : '';
			}

			if ( Capms_Image_Optimizer::is_supported( $mime ) ) {
				$this->start_editor_guard();
				$entry['recompressed'] = Capms_Image_Optimizer::maybe_resize( $file, $mime );
				$this->stop_editor_guard();

				$metadata = wp_get_attachment_metadata( $attachment_id );

				// A resized original invalidates every existing size -
				// rebuild them from it (without re-entering this pipeline)
				// and delete sizes that no longer fit the smaller original.
				if ( $entry['recompressed'] ) {
					$old_files = self::get_image_files( $file, $metadata );

					require_once ABSPATH . 'wp-admin/includes/image.php';
					self::$skip_processing = true;
					$metadata              = wp_generate_attachment_metadata( $attachment_id, $file );
					self::$skip_processing = false;

					foreach ( array_diff( $old_files, self::get_image_files( $file, $metadata ) ) as $stale ) {
						wp_delete_file( $stale );
					}
				}

				$this->process_image( $attachment_id, is_array( $metadata ) ? $metadata : array(), $entry, true );
				wp_update_attachment_metadata( $attachment_id, $this->refresh_filesizes( $attachment_id, $metadata ) );
			} elseif ( Capms_Video_Optimizer::is_supported( $mime ) ) {
				$this->process_video( $attachment_id, $entry );
			} else {
				return new WP_Error( 'capms_unsupported', __( 'Unsupported file type.', 'captain-media-shield' ) );
			}

			return Capms_Stats::get( $attachment_id );
		}

		/**
		 * Upload hook: queue animated GIFs for conversion.
		 *
		 * @since 0.1.0
		 * @param array  $metadata      Attachment metadata.
		 * @param int    $attachment_id Attachment ID.
		 * @param string $context       'create' | 'update'.
		 * @return array
		 */
		public function capms_gif_metadata( $metadata, $attachment_id, $context = 'create' ) {
			if ( self::$skip_processing || 'create' !== $context || 'image/gif' !== get_post_mime_type( $attachment_id ) ) {
				return $metadata;
			}

			if ( ! Capms_Settings::get( 'optimize_on_upload', true ) || Capms_Settings::is_excluded( $attachment_id ) || ! Capms_Video_Optimizer::gif_available() ) {
				return $metadata;
			}

			wp_schedule_single_event( time() + 5, 'capms_process_gif_event', array( (int) $attachment_id ) );

			return $metadata;
		}

		/**
		 * WP-Cron callback for queued GIFs.
		 *
		 * @since 0.1.0
		 * @param int $attachment_id Attachment ID.
		 * @return void
		 */
		public function capms_process_gif_event( $attachment_id ) {
			$file = get_attached_file( $attachment_id );
			if ( ! $file || ! is_file( $file ) ) {
				return;
			}

			$result = $this->process_gif( $attachment_id, $file );
			if ( is_wp_error( $result ) ) {
				Capms_Stats::save(
					$attachment_id,
					array(
						'media_type' => 'image',
						'status'     => 'failed',
						'message'    => $result->get_error_message(),
					)
				);
			}
		}

		/**
		 * Animated GIF -> MP4 / WebM companion files. The GIF is kept as
		 * the fallback, so nothing is lost and "Restore" has nothing to do.
		 *
		 * @since 0.1.0
		 * @param int    $attachment_id Attachment ID.
		 * @param string $file          GIF path.
		 * @return array|WP_Error Saved row.
		 */
		private function process_gif( $attachment_id, $file ) {
			$size = (int) filesize( $file );
			$base = array(
				'media_type'     => 'image',
				'original_size'  => $size,
				'optimized_size' => $size,
			);

			$skip = '';
			if ( ! Capms_Settings::get( 'gif_to_video' ) ) {
				$skip = __( 'GIF to video is turned off.', 'captain-media-shield' );
			} elseif ( ! Capms_Video_Optimizer::gif_available() ) {
				$skip = __( 'FFmpeg with H.264 is not available on this server - GIF skipped.', 'captain-media-shield' );
			} elseif ( ! Capms_Image_Optimizer::is_animated_gif( $file ) ) {
				$skip = __( 'Not an animated GIF.', 'captain-media-shield' );
			}

			if ( $skip ) {
				Capms_Stats::save( $attachment_id, array_merge( $base, array( 'status' => 'skipped', 'message' => $skip ) ) );
				return Capms_Stats::get( $attachment_id );
			}

			$result = Capms_Video_Optimizer::convert_gif( $file );
			if ( is_wp_error( $result ) ) {
				return $result;
			}

			Capms_Stats::save(
				$attachment_id,
				array_merge(
					$base,
					array(
						'status'    => 'optimized',
						'webm_size' => (int) $result['webm_size'],
						/* translators: 1: MP4 size, 2: original GIF size */
						'message'   => sprintf( __( 'Visitors now get an MP4 (%1$s) instead of the %2$s GIF.', 'captain-media-shield' ), size_format( $result['mp4_size'], 1 ), size_format( $size, 1 ) ),
					)
				)
			);
			update_post_meta( $attachment_id, '_capms_optimized', 1 );

			return Capms_Stats::get( $attachment_id );
		}

		/**
		 * Mime types for a scope (all|image|video). GIFs are only part of
		 * the image list while GIF to video is switched on and usable.
		 *
		 * @since 0.1.0
		 * @param string $which all|image|video.
		 * @return array
		 */
		public static function get_mimes( $which = 'all' ) {
			$images = (array) apply_filters( 'capms_supported_image_mimes', Capms_Image_Optimizer::SUPPORTED_MIMES );
			$videos = (array) apply_filters( 'capms_supported_video_mimes', Capms_Video_Optimizer::SUPPORTED_MIMES );

			if ( Capms_Video_Optimizer::gif_available() && ! in_array( 'image/gif', $images, true ) ) {
				$images[] = 'image/gif';
			}

			if ( 'image' === $which ) {
				return $images;
			}
			if ( 'video' === $which ) {
				return $videos;
			}
			return array_merge( $images, $videos );
		}

		/**
		 * Attachment IDs waiting for the bulk optimizer.
		 *
		 * @since 0.1.0
		 * @param string $scope        all|image|video.
		 * @param bool   $retry_failed Also queue files that failed / were skipped.
		 * @return int[]
		 */
		public static function get_queue_ids( $scope = 'all', $retry_failed = false ) {
			global $wpdb;

			$scope        = in_array( $scope, array( 'all', 'image', 'video' ), true ) ? $scope : 'all';
			$mimes        = self::get_mimes( $scope );
			$placeholders = implode( ',', array_fill( 0, count( $mimes ), '%s' ) );
			$table        = esc_sql( Capms_Stats::table() );
			$statuses     = $retry_failed ? array( 'optimized' ) : array( 'optimized', 'failed', 'skipped' );
			$status_holds = implode( ',', array_fill( 0, count( $statuses ), '%s' ) );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
			$ids = $wpdb->get_col( $wpdb->prepare( "SELECT p.ID FROM {$wpdb->posts} p LEFT JOIN {$table} m ON m.attachment_id = p.ID WHERE p.post_type = 'attachment' AND p.post_mime_type IN ($placeholders) AND ( m.status IS NULL OR m.status NOT IN ($status_holds) ) ORDER BY p.ID DESC", array_merge( $mimes, $statuses ) ) );

			return array_map( 'intval', (array) $ids );
		}

		/**
		 * Image pipeline for every file of an attachment.
		 *
		 * @since 0.0.1
		 * @param int   $attachment_id Attachment ID.
		 * @param array $metadata      Attachment metadata.
		 * @param array $entry         Pending entry (original size, backup...).
		 * @param bool  $recompress_sizes Recompress intermediate sizes too (bulk).
		 * @return void
		 */
		private function process_image( $attachment_id, $metadata, $entry, $recompress_sizes = false ) {
			$settings = Capms_Settings::get_all();
			$file     = get_attached_file( $attachment_id );
			$mime     = get_post_mime_type( $attachment_id );
			$files    = self::get_image_files( $file, $metadata );

			$sizes_before = 0;
			foreach ( $files as $index => $path ) {
				if ( $index > 0 ) {
					$sizes_before += (int) @filesize( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				}
			}

			$this->start_editor_guard();

			$webp_total = 0;
			$avif_total = 0;
			$after      = 0;

			foreach ( $files as $index => $path ) {
				$is_main = 0 === $index;

				// Main file: on upload it was already re-encoded if it was
				// resized - never compress the same pixels twice. Sizes are
				// generated at our quality on upload, so only bulk needs it.
				if ( ( $is_main && ! $entry['recompressed'] ) || ( ! $is_main && $recompress_sizes ) ) {
					Capms_Image_Optimizer::recompress( $path, $mime );
				}

				if ( ! empty( $settings['strip_metadata'] ) ) {
					Capms_Image_Optimizer::strip_metadata( $path, $mime );
				}

				$webp = ! empty( $settings['webp_enabled'] ) ? Capms_Image_Optimizer::convert( $path, 'webp' ) : 0;
				$avif = ! empty( $settings['avif_enabled'] ) ? Capms_Image_Optimizer::convert( $path, 'avif' ) : 0;

				// AVIF is served first, so it must actually be the smaller
				// file - some encoders (e.g. GD at default speed) lose to WebP.
				if ( $avif && $webp && $avif >= $webp ) {
					wp_delete_file( $path . '.avif' );
					$avif = 0;
				}

				$webp_total += $webp;
				$avif_total += $avif;

				clearstatcache();
				$after += (int) @filesize( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			}

			$this->stop_editor_guard();

			// Upload path: sizes didn't exist before, so "before" for them
			// is what they are now - the saving is measured on the original.
			$before = (int) $entry['original_size'] + ( $recompress_sizes ? $sizes_before : max( 0, $after - (int) @filesize( $file ) ) ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

			$this->finish( $attachment_id, 'image', $entry, $before, $after, $webp_total, $avif_total, 0, '' );
		}

		/**
		 * Queue a freshly uploaded video for background processing.
		 *
		 * @since 0.0.1
		 * @param int   $attachment_id Attachment ID.
		 * @param array $entry         Pending entry.
		 * @return void
		 */
		private function queue_video( $attachment_id, $entry ) {
			$settings = Capms_Settings::get_all();
			$wanted   = ! empty( $settings['video_enabled'] ) || ! empty( $settings['webm_enabled'] ) || ! empty( $settings['faststart_enabled'] ) || ! empty( $settings['video_poster'] );

			if ( ! $wanted || ! Capms_Video_Optimizer::available() ) {
				$message = $wanted ? __( 'FFmpeg is not available on this server - video skipped.', 'captain-media-shield' ) : __( 'Video optimization is turned off.', 'captain-media-shield' );
				// Nothing will touch the file - don't keep a pointless backup.
				if ( $entry['backup'] ) {
					$abs = Capms_Backup::absolute( $entry['backup'] );
					if ( $abs ) {
						wp_delete_file( $abs );
					}
				}
				Capms_Stats::save(
					$attachment_id,
					array(
						'media_type'     => 'video',
						'status'         => 'skipped',
						'original_size'  => $entry['original_size'],
						'optimized_size' => $entry['original_size'],
						'message'        => $message,
					)
				);
				return;
			}

			update_post_meta( $attachment_id, '_capms_pending', $entry );
			Capms_Stats::save(
				$attachment_id,
				array(
					'media_type'    => 'video',
					'status'        => 'queued',
					'original_size' => $entry['original_size'],
					'message'       => __( 'Queued for background optimization.', 'captain-media-shield' ),
				)
			);

			wp_schedule_single_event( time() + 5, 'capms_process_video_event', array( (int) $attachment_id ) );
		}

		/**
		 * WP-Cron callback for queued videos.
		 *
		 * @since 0.0.1
		 * @param int $attachment_id Attachment ID.
		 * @return void
		 */
		public function capms_process_video_event( $attachment_id ) {
			$entry = get_post_meta( $attachment_id, '_capms_pending', true );
			delete_post_meta( $attachment_id, '_capms_pending' );

			$file = get_attached_file( $attachment_id );
			if ( ! $file || ! is_file( $file ) ) {
				return;
			}

			if ( ! is_array( $entry ) ) {
				$entry = array(
					'original_size' => (int) filesize( $file ),
					'backup'        => '',
					'recompressed'  => false,
				);
			}

			$this->process_video( $attachment_id, $entry );
		}

		/**
		 * Video pipeline.
		 *
		 * @since 0.0.1
		 * @param int   $attachment_id Attachment ID.
		 * @param array $entry         Pending entry.
		 * @return void
		 */
		private function process_video( $attachment_id, $entry ) {
			$file = get_attached_file( $attachment_id );
			$mime = get_post_mime_type( $attachment_id );

			$result = Capms_Video_Optimizer::optimize( $file, $mime );

			if ( is_wp_error( $result ) ) {
				if ( $entry['backup'] ) {
					$abs = Capms_Backup::absolute( $entry['backup'] );
					if ( $abs ) {
						wp_delete_file( $abs );
					}
				}
				Capms_Stats::save(
					$attachment_id,
					array(
						'media_type'     => 'video',
						'status'         => 'capms_no_ffmpeg' === $result->get_error_code() ? 'skipped' : 'failed',
						'original_size'  => $entry['original_size'],
						'optimized_size' => $entry['original_size'],
						'message'        => $result->get_error_message(),
					)
				);
				return;
			}

			if ( $result['replaced'] ) {
				$meta = wp_get_attachment_metadata( $attachment_id );
				require_once ABSPATH . 'wp-admin/includes/media.php';
				$fresh = wp_read_video_metadata( $file );
				$meta  = is_array( $fresh ) ? array_merge( is_array( $meta ) ? $meta : array(), $fresh ) : $meta;
				if ( is_array( $meta ) ) {
					$meta['filesize'] = (int) $result['size'];
					wp_update_attachment_metadata( $attachment_id, $meta );
				}
			}

			$this->finish( $attachment_id, 'video', $entry, (int) $entry['original_size'], (int) $result['size'], 0, 0, (int) $result['webm_size'], implode( ' ', $result['notes'] ) );
		}

		/**
		 * Persist stats and apply the backup policy.
		 *
		 * @since 0.0.1
		 * @param int    $attachment_id Attachment ID.
		 * @param string $type          image|video.
		 * @param array  $entry         Pending entry.
		 * @param int    $before        Bytes before.
		 * @param int    $after         Bytes after.
		 * @param int    $webp          WebP bytes.
		 * @param int    $avif          AVIF bytes.
		 * @param int    $webm          WebM bytes.
		 * @param string $message       Notes.
		 * @return void
		 */
		private function finish( $attachment_id, $type, $entry, $before, $after, $webp, $avif, $webm, $message ) {
			$backup      = $entry['backup'];
			$backup_abs  = $backup ? Capms_Backup::absolute( $backup ) : false;
			$backup_size = $backup_abs && is_file( $backup_abs ) ? (int) filesize( $backup_abs ) : 0;

			// "Immediate auto-delete originals" or "Immediate (no retention)"
			// - the next-gen copies exist now, so drop the original backup.
			$converted = $webp > 0 || $avif > 0 || $webm > 0 || $after < $before;
			if ( $backup && $converted && ( Capms_Settings::get( 'delete_originals' ) || 0 === Capms_Settings::get_retention_seconds() ) ) {
				if ( $backup_abs ) {
					wp_delete_file( $backup_abs );
				}
				$backup      = '';
				$backup_size = 0;
			}

			$row = array(
				'media_type'     => $type,
				'status'         => 'optimized',
				'original_size'  => $before,
				'optimized_size' => $after,
				'webp_size'      => $webp,
				'avif_size'      => $avif,
				'webm_size'      => $webm,
				'backup_path'    => $backup ? $backup : null,
				'backup_size'    => $backup_size,
				'backup_created' => $backup ? current_time( 'mysql', true ) : null,
				'message'        => $message,
			);

			Capms_Stats::save( $attachment_id, $row );
			update_post_meta( $attachment_id, '_capms_optimized', 1 );

			/**
			 * Fires after an attachment has been optimized.
			 *
			 * @param int   $attachment_id Attachment ID.
			 * @param array $row           Stats row.
			 */
			do_action( 'capms_attachment_optimized', $attachment_id, $row );
		}

		/**
		 * Main file + every intermediate size (absolute paths, main first).
		 *
		 * @since 0.0.1
		 * @param string $file     Main file.
		 * @param array  $metadata Metadata.
		 * @return array
		 */
		public static function get_image_files( $file, $metadata ) {
			$files = array( $file );
			$dir   = trailingslashit( dirname( $file ) );

			if ( ! empty( $metadata['sizes'] ) && is_array( $metadata['sizes'] ) ) {
				foreach ( $metadata['sizes'] as $size ) {
					if ( empty( $size['file'] ) ) {
						continue;
					}
					$path = $dir . $size['file'];
					if ( is_file( $path ) && ! in_array( $path, $files, true ) ) {
						$files[] = $path;
					}
				}
			}

			return $files;
		}

		/**
		 * Remove every WebP/AVIF/WebM file we generated for an attachment.
		 *
		 * @since 0.0.1
		 * @param int    $attachment_id Attachment ID.
		 * @param string $file          Main file.
		 * @param array  $metadata      Metadata.
		 * @return void
		 */
		public static function remove_generated_files( $attachment_id, $file = '', $metadata = null ) {
			$file     = $file ? $file : get_attached_file( $attachment_id );
			$metadata = null === $metadata ? wp_get_attachment_metadata( $attachment_id ) : $metadata;
			if ( ! $file ) {
				return;
			}

			$candidates = array( $file );
			if ( is_array( $metadata ) && ! empty( $metadata['sizes'] ) ) {
				$dir = trailingslashit( dirname( $file ) );
				foreach ( $metadata['sizes'] as $size ) {
					if ( ! empty( $size['file'] ) ) {
						$candidates[] = $dir . $size['file'];
					}
				}
			}

			foreach ( array_unique( $candidates ) as $path ) {
				foreach ( array( 'webp', 'avif', 'webm', 'mp4', 'poster.jpg' ) as $ext ) {
					if ( is_file( $path . '.' . $ext ) ) {
						wp_delete_file( $path . '.' . $ext );
					}
				}
			}
		}

		/**
		 * Clean up after an attachment is deleted from the Media Library.
		 *
		 * @since 0.0.1
		 * @param int $attachment_id Attachment ID.
		 * @return void
		 */
		public function capms_delete_attachment( $attachment_id ) {
			self::remove_generated_files( $attachment_id );
			Capms_Backup::delete_backup( $attachment_id );
			Capms_Stats::delete( $attachment_id );
			wp_clear_scheduled_hook( 'capms_process_video_event', array( (int) $attachment_id ) );
			wp_clear_scheduled_hook( 'capms_process_gif_event', array( (int) $attachment_id ) );
		}

		/**
		 * Keep metadata filesize values accurate after optimization.
		 *
		 * @since 0.0.1
		 * @param int   $attachment_id Attachment ID.
		 * @param array $metadata      Metadata.
		 * @return array
		 */
		private function refresh_filesizes( $attachment_id, $metadata ) {
			if ( ! is_array( $metadata ) ) {
				return $metadata;
			}
			clearstatcache();
			$file = get_attached_file( $attachment_id );
			if ( $file && is_file( $file ) ) {
				$metadata['filesize'] = (int) filesize( $file );
			}
			if ( ! empty( $metadata['sizes'] ) && $file ) {
				$dir = trailingslashit( dirname( $file ) );
				foreach ( $metadata['sizes'] as $name => $size ) {
					if ( ! empty( $size['file'] ) && is_file( $dir . $size['file'] ) ) {
						$metadata['sizes'][ $name ]['filesize'] = (int) filesize( $dir . $size['file'] );
					}
				}
			}
			return $metadata;
		}

		/**
		 * While we write files ourselves, stop core/site filters from
		 * silently remapping the output format (e.g. JPEG -> WebP), which
		 * would rename the file out from under the attachment.
		 *
		 * @since 0.0.1
		 * @return void
		 */
		private function start_editor_guard() {
			add_filter( 'image_editor_output_format', '__return_empty_array', PHP_INT_MAX );
		}

		/**
		 * Undo start_editor_guard().
		 *
		 * @since 0.0.1
		 * @return void
		 */
		private function stop_editor_guard() {
			remove_filter( 'image_editor_output_format', '__return_empty_array', PHP_INT_MAX );
		}
	}

	Capms_Processor::get_instance();
}
