<?php
/**
 * Video optimization through a local FFmpeg binary.
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

if ( ! class_exists( 'Capms_Video_Optimizer' ) ) {

	/**
	 * MP4/M4V/MOV files are re-encoded in place to H.264/AAC (resolution
	 * cap, audio bitrate, metadata strip) with the moov atom moved to the
	 * front ("fast start") so playback begins before the whole file has
	 * downloaded. A VP9/Opus WebM copy can be written next to the source
	 * (video.mp4 -> video.mp4.webm). Every step degrades gracefully: no
	 * FFmpeg, no exec(), or a missing encoder just skips that step.
	 *
	 * @since 1.0.0
	 */
	class Capms_Video_Optimizer {

		/**
		 * Mime types re-encoded in place (container stays MP4-family).
		 *
		 * @var array
		 */
		const INPLACE_MIMES = array( 'video/mp4', 'video/x-m4v', 'video/quicktime' );

		/**
		 * Mime types we accept as a source at all.
		 *
		 * @var array
		 */
		const SUPPORTED_MIMES = array( 'video/mp4', 'video/x-m4v', 'video/quicktime', 'video/webm', 'video/ogg', 'video/x-msvideo', 'video/x-ms-wmv', 'video/mpeg' );

		/**
		 * Is this a video we handle?
		 *
		 * @since 1.0.0
		 * @param string $mime Mime type.
		 * @return bool
		 */
		public static function is_supported( $mime ) {
			/**
			 * Filter the video mime types Captain Media Shield handles.
			 *
			 * @param array $mimes Mime types.
			 */
			return in_array( $mime, apply_filters( 'capms_supported_video_mimes', self::SUPPORTED_MIMES ), true );
		}

		/**
		 * Is the video pipeline usable on this server?
		 *
		 * @since 1.0.0
		 * @return bool
		 */
		public static function available() {
			return (bool) Capms_Environment::get_ffmpeg();
		}

		/**
		 * Optimize one video file.
		 *
		 * @since 1.0.0
		 * @param string $file Absolute path.
		 * @param string $mime Mime type.
		 * @return array|WP_Error { replaced: bool, size: int, webm_size: int, notes: string[] }
		 */
		public static function optimize( $file, $mime ) {
			$ffmpeg = Capms_Environment::get_ffmpeg();
			if ( ! $ffmpeg ) {
				return new WP_Error( 'capms_no_ffmpeg', __( 'FFmpeg is not available on this server - video skipped.', 'captain-media-shield' ) );
			}
			if ( ! is_file( $file ) ) {
				return new WP_Error( 'capms_no_file', __( 'Video file not found.', 'captain-media-shield' ) );
			}

			if ( function_exists( 'set_time_limit' ) ) {
				@set_time_limit( 0 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			}

			$settings = Capms_Settings::get_all();
			$result   = array(
				'replaced'  => false,
				'size'      => (int) filesize( $file ),
				'webm_size' => 0,
				'notes'     => array(),
			);

			// 1) In-place compression / fast start for MP4-family files.
			if ( in_array( $mime, self::INPLACE_MIMES, true ) && ( ! empty( $settings['video_enabled'] ) || ! empty( $settings['faststart_enabled'] ) ) ) {
				$inplace = self::encode_inplace( $ffmpeg, $file, $settings );
				if ( is_wp_error( $inplace ) ) {
					$result['notes'][] = $inplace->get_error_message();
				} elseif ( $inplace ) {
					clearstatcache();
					$result['replaced'] = true;
					$result['size']     = (int) filesize( $file );
				}
			}

			// 2) WebM companion.
			if ( ! empty( $settings['webm_enabled'] ) && 'video/webm' !== $mime ) {
				$webm = self::encode_webm( $ffmpeg, $file, $settings );
				if ( is_wp_error( $webm ) ) {
					$result['notes'][] = $webm->get_error_message();
				} else {
					$result['webm_size'] = (int) $webm;
				}
			}

			return $result;
		}

		/**
		 * Scale filter for the configured max resolution (never upscales,
		 * keeps aspect ratio, even dimensions for yuv420p).
		 *
		 * @since 1.0.0
		 * @param array $settings Settings.
		 * @return string Empty when keeping the original resolution.
		 */
		private static function scale_filter( $settings ) {
			$max = 'original' === $settings['video_resolution'] ? 0 : absint( $settings['video_resolution'] );
			if ( ! $max ) {
				return '';
			}
			// Cap the shorter side, so portrait videos are handled too.
			return sprintf( "scale='if(gt(iw,ih),-2,min(%1\$d,iw))':'if(gt(iw,ih),min(%1\$d,ih),-2)'", $max );
		}

		/**
		 * Re-encode an MP4-family file in place.
		 *
		 * When compression is off but fast start is on, the streams are
		 * copied untouched and only the moov atom is moved (lossless).
		 *
		 * @since 1.0.0
		 * @param string $ffmpeg   Binary.
		 * @param string $file     Path.
		 * @param array  $settings Settings.
		 * @return bool|WP_Error True when the file was replaced.
		 */
		private static function encode_inplace( $ffmpeg, $file, $settings ) {
			$tmp  = trailingslashit( dirname( $file ) ) . 'capms-tmp-' . wp_generate_password( 8, false ) . '.mp4';
			$args = array( '-y', '-hide_banner', '-loglevel', 'error', '-i', $file );

			if ( ! empty( $settings['video_strip_meta'] ) ) {
				array_push( $args, '-map_metadata', '-1', '-map_chapters', '-1' );
			}

			$compress = ! empty( $settings['video_enabled'] ) && Capms_Environment::ffmpeg_has_encoder( 'libx264' );

			if ( $compress ) {
				/**
				 * Filter the H.264 CRF value (lower = better quality, bigger file).
				 *
				 * @param int $crf Default 26.
				 */
				$crf   = (int) apply_filters( 'capms_video_crf', 26 );
				$scale = self::scale_filter( $settings );

				array_push( $args, '-c:v', 'libx264', '-preset', 'medium', '-crf', (string) $crf, '-pix_fmt', 'yuv420p' );
				if ( $scale ) {
					array_push( $args, '-vf', $scale );
				}

				if ( 'original' === $settings['audio_bitrate'] ) {
					array_push( $args, '-c:a', 'aac', '-b:a', '192k' );
				} else {
					array_push( $args, '-c:a', 'aac', '-b:a', absint( $settings['audio_bitrate'] ) . 'k', '-ac', '2' );
				}
			} else {
				array_push( $args, '-c', 'copy' );
			}

			if ( ! empty( $settings['faststart_enabled'] ) ) {
				array_push( $args, '-movflags', '+faststart' );
			}

			$args[] = $tmp;

			$run = self::run( $ffmpeg, $args );
			if ( is_wp_error( $run ) ) {
				wp_delete_file( $tmp );
				return $run;
			}

			clearstatcache();
			if ( ! is_file( $tmp ) || filesize( $tmp ) <= 0 ) {
				wp_delete_file( $tmp );
				return new WP_Error( 'capms_ffmpeg_empty', __( 'FFmpeg produced no output.', 'captain-media-shield' ) );
			}

			// Compressed output is only kept when smaller. A stream-copy
			// fast start pass is always kept (same size, better playback).
			if ( $compress && filesize( $tmp ) >= filesize( $file ) ) {
				wp_delete_file( $tmp );

				// Still worth applying fast start losslessly.
				if ( ! empty( $settings['faststart_enabled'] ) ) {
					$settings['video_enabled'] = false;
					return self::encode_inplace( $ffmpeg, $file, $settings );
				}
				return false;
			}

			return Capms_Image_Optimizer::replace_file( $tmp, $file );
		}

		/**
		 * Write a VP9/Opus WebM copy next to the source.
		 *
		 * @since 1.0.0
		 * @param string $ffmpeg   Binary.
		 * @param string $file     Path.
		 * @param array  $settings Settings.
		 * @return int|WP_Error WebM size in bytes.
		 */
		private static function encode_webm( $ffmpeg, $file, $settings ) {
			if ( ! Capms_Environment::ffmpeg_has_encoder( 'libvpx-vp9' ) ) {
				return new WP_Error( 'capms_no_vp9', __( 'This FFmpeg build has no VP9 (libvpx-vp9) encoder - WebM skipped.', 'captain-media-shield' ) );
			}

			$dest  = $file . '.webm';
			$tmp   = $dest . '.part.webm';
			$scale = self::scale_filter( $settings );

			/**
			 * Filter the VP9 CRF value for WebM output.
			 *
			 * @param int $crf Default 33.
			 */
			$crf  = (int) apply_filters( 'capms_webm_crf', 33 );
			$args = array( '-y', '-hide_banner', '-loglevel', 'error', '-i', $file );

			if ( ! empty( $settings['video_strip_meta'] ) ) {
				array_push( $args, '-map_metadata', '-1' );
			}

			array_push( $args, '-c:v', 'libvpx-vp9', '-crf', (string) $crf, '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4' );
			if ( $scale ) {
				array_push( $args, '-vf', $scale );
			}

			$audio = 'original' === $settings['audio_bitrate'] ? '128' : absint( $settings['audio_bitrate'] );
			if ( Capms_Environment::ffmpeg_has_encoder( 'libopus' ) ) {
				array_push( $args, '-c:a', 'libopus', '-b:a', $audio . 'k' );
			} else {
				array_push( $args, '-c:a', 'libvorbis', '-b:a', $audio . 'k' );
			}

			$args[] = $tmp;

			$run = self::run( $ffmpeg, $args );
			if ( is_wp_error( $run ) ) {
				wp_delete_file( $tmp );
				return $run;
			}

			clearstatcache();
			if ( ! is_file( $tmp ) || filesize( $tmp ) <= 0 ) {
				wp_delete_file( $tmp );
				return new WP_Error( 'capms_webm_empty', __( 'WebM conversion produced no output.', 'captain-media-shield' ) );
			}

			if ( ! Capms_Image_Optimizer::replace_file( $tmp, $dest ) ) {
				return new WP_Error( 'capms_webm_move', __( 'Could not save the WebM file.', 'captain-media-shield' ) );
			}

			return (int) filesize( $dest );
		}

		/**
		 * Run ffmpeg with every argument shell-escaped.
		 *
		 * @since 1.0.0
		 * @param string $ffmpeg Binary.
		 * @param array  $args   Arguments.
		 * @return true|WP_Error
		 */
		private static function run( $ffmpeg, $args ) {
			if ( ! Capms_Environment::shell_function_available( 'exec' ) ) {
				return new WP_Error( 'capms_no_exec', __( 'exec() is disabled on this server.', 'captain-media-shield' ) );
			}

			$cmd = escapeshellarg( $ffmpeg ) . ' ' . implode( ' ', array_map( 'escapeshellarg', $args ) ) . ' 2>&1';

			$output = array();
			$code   = 1;
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
			exec( $cmd, $output, $code );

			if ( 0 !== $code ) {
				$tail = trim( implode( ' ', array_slice( $output, -3 ) ) );
				/* translators: %s: last lines of the ffmpeg error output */
				return new WP_Error( 'capms_ffmpeg_failed', sprintf( __( 'FFmpeg failed: %s', 'captain-media-shield' ), sanitize_text_field( $tail ) ) );
			}

			return true;
		}
	}
}
