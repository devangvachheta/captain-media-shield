<?php
/**
 * Server capability detection (GD, Imagick, WebP/AVIF, FFmpeg, limits).
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

if ( ! class_exists( 'Capms_Environment' ) ) {

	/**
	 * Capms_Environment
	 *
	 * @since 1.0.0
	 */
	class Capms_Environment {

		/**
		 * Request cache for the resolved ffmpeg binary.
		 *
		 * @var string|false|null
		 */
		private static $ffmpeg = null;

		/**
		 * Can the WordPress image editor write this mime type?
		 *
		 * @since 1.0.0
		 * @param string $mime e.g. image/webp.
		 * @return bool
		 */
		public static function supports_mime( $mime ) {
			static $cache = array();
			if ( ! isset( $cache[ $mime ] ) ) {
				$cache[ $mime ] = (bool) wp_image_editor_supports( array( 'mime_type' => $mime ) );
			}
			return $cache[ $mime ];
		}

		/**
		 * WebP output possible?
		 *
		 * @since 1.0.0
		 * @return bool
		 */
		public static function webp_supported() {
			return self::supports_mime( 'image/webp' );
		}

		/**
		 * AVIF output possible?
		 *
		 * @since 1.0.0
		 * @return bool
		 */
		public static function avif_supported() {
			return self::supports_mime( 'image/avif' );
		}

		/**
		 * Is a shell function usable (exists and not disabled)?
		 *
		 * @since 1.0.0
		 * @param string $func Function name.
		 * @return bool
		 */
		public static function shell_function_available( $func ) {
			if ( ! function_exists( $func ) ) {
				return false;
			}
			$disabled = array_map( 'trim', explode( ',', (string) ini_get( 'disable_functions' ) ) );
			return ! in_array( $func, $disabled, true );
		}

		/**
		 * Resolve a working ffmpeg binary, or false.
		 *
		 * Tries the user-configured path first, then the system PATH, then
		 * a few common install locations. Each candidate is verified by
		 * actually running `-version`, so a path that exists but can't run
		 * never counts as available.
		 *
		 * @since 1.0.0
		 * @param bool $refresh Ignore the cached result.
		 * @return string|false
		 */
		public static function get_ffmpeg( $refresh = false ) {
			if ( null !== self::$ffmpeg && ! $refresh ) {
				return self::$ffmpeg;
			}

			$cached = $refresh ? false : get_transient( 'capms_ffmpeg_path' );
			if ( false !== $cached ) {
				self::$ffmpeg = 'none' === $cached ? false : $cached;
				return self::$ffmpeg;
			}

			self::$ffmpeg = false;

			if ( self::shell_function_available( 'exec' ) ) {
				$candidates = array();
				$custom     = (string) Capms_Settings::get( 'ffmpeg_path', '' );
				if ( '' !== $custom ) {
					$candidates[] = $custom;
				}
				$candidates = array_merge(
					$candidates,
					array( 'ffmpeg', '/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg', '/opt/bin/ffmpeg', 'C:\\ffmpeg\\bin\\ffmpeg.exe' )
				);

				/**
				 * Filter the list of ffmpeg binary candidates.
				 *
				 * @param array $candidates Paths / command names.
				 */
				$candidates = apply_filters( 'capms_ffmpeg_candidates', $candidates );

				foreach ( $candidates as $candidate ) {
					if ( self::test_binary( $candidate ) ) {
						self::$ffmpeg = $candidate;
						break;
					}
				}
			}

			set_transient( 'capms_ffmpeg_path', self::$ffmpeg ? self::$ffmpeg : 'none', 12 * HOUR_IN_SECONDS );

			return self::$ffmpeg;
		}

		/**
		 * Run `<binary> -version` and check it answers like ffmpeg.
		 *
		 * @since 1.0.0
		 * @param string $binary Path or command name.
		 * @return bool
		 */
		private static function test_binary( $binary ) {
			$binary = trim( (string) $binary );
			if ( '' === $binary ) {
				return false;
			}
			// Absolute paths must exist; bare command names go through PATH.
			if ( ( false !== strpos( $binary, '/' ) || false !== strpos( $binary, '\\' ) ) && ! @is_file( $binary ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				return false;
			}

			$output = array();
			$code   = 1;
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
			@exec( escapeshellarg( $binary ) . ' -version 2>&1', $output, $code ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

			return 0 === $code && ! empty( $output[0] ) && false !== stripos( $output[0], 'ffmpeg' );
		}

		/**
		 * ffmpeg version line (for the health screen).
		 *
		 * @since 1.0.0
		 * @return string
		 */
		public static function get_ffmpeg_version() {
			$binary = self::get_ffmpeg();
			if ( ! $binary ) {
				return '';
			}
			$output = array();
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
			@exec( escapeshellarg( $binary ) . ' -version 2>&1', $output ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			return isset( $output[0] ) ? sanitize_text_field( $output[0] ) : '';
		}

		/**
		 * Does the ffmpeg build include a given encoder?
		 *
		 * @since 1.0.0
		 * @param string $encoder e.g. libvpx-vp9.
		 * @return bool
		 */
		public static function ffmpeg_has_encoder( $encoder ) {
			static $encoders = null;
			$binary          = self::get_ffmpeg();
			if ( ! $binary ) {
				return false;
			}
			if ( null === $encoders ) {
				$output = array();
				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
				@exec( escapeshellarg( $binary ) . ' -hide_banner -encoders 2>&1', $output ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				$encoders = implode( "\n", $output );
			}
			return (bool) preg_match( '/\s' . preg_quote( $encoder, '/' ) . '\s/', $encoders );
		}

		/**
		 * Full report for the Server Health screen.
		 *
		 * @since 1.0.0
		 * @return array
		 */
		public static function get_report() {
			$gd_info      = function_exists( 'gd_info' ) ? gd_info() : array();
			$imagick      = extension_loaded( 'imagick' ) && class_exists( 'Imagick' );
			$imagick_ver  = '';
			$imagick_avif = false;
			$imagick_webp = false;

			if ( $imagick ) {
				$version     = Imagick::getVersion();
				$imagick_ver = isset( $version['versionString'] ) ? sanitize_text_field( $version['versionString'] ) : '';
				$formats     = Imagick::queryFormats();
				$imagick_avif = in_array( 'AVIF', $formats, true );
				$imagick_webp = in_array( 'WEBP', $formats, true );
			}

			$ffmpeg = self::get_ffmpeg();

			return array(
				'php_version'      => PHP_VERSION,
				'wp_version'       => get_bloginfo( 'version' ),
				'gd'               => ! empty( $gd_info ),
				'gd_version'       => isset( $gd_info['GD Version'] ) ? sanitize_text_field( $gd_info['GD Version'] ) : '',
				'gd_webp'          => ! empty( $gd_info['WebP Support'] ),
				'gd_avif'          => ! empty( $gd_info['AVIF Support'] ),
				'imagick'          => $imagick,
				'imagick_version'  => $imagick_ver,
				'imagick_webp'     => $imagick_webp,
				'imagick_avif'     => $imagick_avif,
				'webp'             => self::webp_supported(),
				'avif'             => self::avif_supported(),
				'exec'             => self::shell_function_available( 'exec' ),
				'ffmpeg'           => (bool) $ffmpeg,
				'ffmpeg_path'      => $ffmpeg ? $ffmpeg : '',
				'ffmpeg_version'   => self::get_ffmpeg_version(),
				'ffmpeg_x264'      => $ffmpeg ? self::ffmpeg_has_encoder( 'libx264' ) : false,
				'ffmpeg_vp9'       => $ffmpeg ? self::ffmpeg_has_encoder( 'libvpx-vp9' ) : false,
				'memory_limit'     => (string) ini_get( 'memory_limit' ),
				'wp_memory_limit'  => defined( 'WP_MEMORY_LIMIT' ) ? WP_MEMORY_LIMIT : '',
				'max_upload'       => size_format( wp_max_upload_size() ),
				'max_execution'    => (int) ini_get( 'max_execution_time' ),
				'server_software'  => isset( $_SERVER['SERVER_SOFTWARE'] ) ? sanitize_text_field( wp_unslash( $_SERVER['SERVER_SOFTWARE'] ) ) : '',
				'htaccess_capable' => self::is_apache(),
				'uploads_writable' => wp_is_writable( wp_get_upload_dir()['basedir'] ),
			);
		}

		/**
		 * Apache / LiteSpeed (understands .htaccess)?
		 *
		 * @since 1.0.0
		 * @return bool
		 */
		public static function is_apache() {
			global $is_apache;
			return (bool) $is_apache;
		}
	}
}
