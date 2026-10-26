<?php
/**
 * Plugin settings - single option, defaults and sanitization.
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

if ( ! class_exists( 'Capms_Settings' ) ) {

	/**
	 * Every setting lives in one `capms_settings` option array. All reads
	 * go through get() so missing keys always fall back to the defaults,
	 * and all writes go through sanitize() so nothing unexpected is ever
	 * stored.
	 *
	 * @since 0.0.1
	 */
	class Capms_Settings {

		/**
		 * Option name.
		 *
		 * @var string
		 */
		const OPTION_KEY = 'capms_settings';

		/**
		 * Allowed retention values (seconds, or a keyword).
		 *
		 * @var array
		 */
		const RETENTION_OPTIONS = array( 'immediate', '3600', '86400', '604800', '2592000', 'never' );

		/**
		 * Request-level cache of the merged settings.
		 *
		 * @var array|null
		 */
		private static $cache = null;

		/**
		 * Default values.
		 *
		 * AVIF and WebM defaults depend on what the server can actually do,
		 * so they are only ON out of the box when supported.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		public static function get_defaults() {
			static $defaults = null;
			if ( null !== $defaults ) {
				return $defaults;
			}

			$avif_supported = function_exists( 'wp_image_editor_supports' ) ? wp_image_editor_supports( array( 'mime_type' => 'image/avif' ) ) : false;

			$defaults = array(
				// Images.
				'webp_enabled'       => true,
				'avif_enabled'       => (bool) $avif_supported,
				'image_quality'      => 80,
				'strip_metadata'     => true,
				'resize_enabled'     => true,
				'max_width'          => 1920,
				'max_height'         => 1920,
				'delivery_method'    => 'picture', // 'htaccess' | 'picture'.
				'optimize_on_upload' => true,
				'exclude_paths'      => '', // One folder / file pattern per line.
				'exclude_ids'        => '', // Comma separated attachment IDs.

				// Videos.
				'video_enabled'      => true,
				'webm_enabled'       => true,
				'faststart_enabled'  => true,
				'video_resolution'   => '1080', // '1080' | '720' | 'original'.
				'audio_bitrate'      => '128', // '128' | '96' | 'original'.
				'video_strip_meta'   => true,
				'ffmpeg_path'        => '',
				'video_poster'       => true,
				'gif_to_video'       => false,

				// Backups.
				'backup_enabled'     => true,
				'delete_originals'   => false,
				'backup_retention'   => 'never',
			);

			return $defaults;
		}

		/**
		 * Get all settings merged over the defaults.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		public static function get_all() {
			if ( null === self::$cache ) {
				$saved       = get_option( self::OPTION_KEY, array() );
				self::$cache = wp_parse_args( is_array( $saved ) ? $saved : array(), self::get_defaults() );
			}
			return self::$cache;
		}

		/**
		 * Get a single setting.
		 *
		 * @since 0.0.1
		 * @param string $key     Setting key.
		 * @param mixed  $default Fallback.
		 * @return mixed
		 */
		public static function get( $key, $default = null ) {
			$all = self::get_all();
			return array_key_exists( $key, $all ) ? $all[ $key ] : $default;
		}

		/**
		 * Merge, sanitize and save a partial settings array.
		 *
		 * @since 0.0.1
		 * @param array $input Raw values (only known keys are kept).
		 * @return array The saved settings.
		 */
		public static function update( $input ) {
			$current = self::get_all();
			$clean   = self::sanitize( is_array( $input ) ? $input : array(), $current );
			$merged  = array_merge( $current, $clean );

			update_option( self::OPTION_KEY, $merged );
			self::$cache = null;

			/**
			 * Fires after settings are saved.
			 *
			 * @param array $merged  New settings.
			 * @param array $current Previous settings.
			 */
			do_action( 'capms_settings_updated', $merged, $current );

			return self::get_all();
		}

		/**
		 * Sanitize known keys, drop unknown ones.
		 *
		 * @since 0.0.1
		 * @param array $input   Raw values.
		 * @param array $current Current values (fallback for invalid input).
		 * @return array
		 */
		public static function sanitize( $input, $current ) {
			$defaults = self::get_defaults();
			$clean    = array();

			foreach ( $input as $key => $value ) {
				if ( ! array_key_exists( $key, $defaults ) ) {
					continue;
				}

				switch ( $key ) {
					case 'image_quality':
						$clean[ $key ] = max( 1, min( 100, absint( $value ) ) );
						break;

					case 'max_width':
					case 'max_height':
						$clean[ $key ] = max( 320, min( 10000, absint( $value ) ) );
						break;

					case 'delivery_method':
						$clean[ $key ] = in_array( $value, array( 'htaccess', 'picture' ), true ) ? $value : $current[ $key ];
						break;

					case 'video_resolution':
						$clean[ $key ] = in_array( (string) $value, array( '1080', '720', 'original' ), true ) ? (string) $value : $current[ $key ];
						break;

					case 'audio_bitrate':
						$clean[ $key ] = in_array( (string) $value, array( '128', '96', 'original' ), true ) ? (string) $value : $current[ $key ];
						break;

					case 'backup_retention':
						$clean[ $key ] = in_array( (string) $value, self::RETENTION_OPTIONS, true ) ? (string) $value : $current[ $key ];
						break;

					case 'exclude_paths':
						$clean[ $key ] = self::sanitize_patterns( $value );
						break;

					case 'exclude_ids':
						$clean[ $key ] = self::sanitize_ids( $value );
						break;

					case 'ffmpeg_path':
						// A filesystem path to a binary - never a command line.
						$path          = trim( sanitize_text_field( wp_unslash( (string) $value ) ) );
						$clean[ $key ] = preg_match( '/[;&|`$<>"\']/', $path ) ? '' : $path;
						break;

					default:
						// Every remaining key is a boolean toggle.
						$clean[ $key ] = filter_var( $value, FILTER_VALIDATE_BOOLEAN );
						break;
				}
			}

			return $clean;
		}

		/**
		 * One pattern per line. Only letters, numbers and path characters
		 * are kept; "..", leading slashes and empty lines are dropped.
		 *
		 * @since 0.1.0
		 * @param mixed $value Raw textarea value.
		 * @return string
		 */
		public static function sanitize_patterns( $value ) {
			$lines = preg_split( '/\r\n|\r|\n/', (string) wp_unslash( $value ) );
			$out   = array();

			foreach ( (array) $lines as $line ) {
				$line = trim( sanitize_text_field( $line ) );
				$line = str_replace( '\\', '/', $line );
				$line = preg_replace( '#[^A-Za-z0-9_\-\./\*\?\s]#', '', $line );
				$line = ltrim( (string) $line, '/' );

				if ( '' === $line || false !== strpos( $line, '..' ) ) {
					continue;
				}
				$out[] = $line;
			}

			return implode( "\n", array_slice( array_unique( $out ), 0, 100 ) );
		}

		/**
		 * Comma separated list of attachment IDs.
		 *
		 * @since 0.1.0
		 * @param mixed $value Raw value.
		 * @return string
		 */
		public static function sanitize_ids( $value ) {
			$ids = array_filter( array_map( 'absint', preg_split( '/[\s,]+/', (string) $value ) ) );
			return implode( ',', array_slice( array_unique( $ids ), 0, 1000 ) );
		}

		/**
		 * Is this attachment / file excluded from optimization by the
		 * user's rules?
		 *
		 * Folder or file patterns are matched against the path relative to
		 * the uploads folder (for example 2025/03/photo.jpg). A pattern
		 * with * or ? is a wildcard; any other pattern matches when it
		 * appears in the path (so "private/" excludes a whole folder).
		 *
		 * @since 0.1.0
		 * @param int    $attachment_id Attachment ID (0 when not known yet).
		 * @param string $file          Absolute file path (optional).
		 * @return bool
		 */
		public static function is_excluded( $attachment_id = 0, $file = '' ) {
			$attachment_id = absint( $attachment_id );

			$ids = (string) self::get( 'exclude_ids', '' );
			if ( $attachment_id && '' !== $ids && in_array( $attachment_id, array_map( 'absint', explode( ',', $ids ) ), true ) ) {
				return true;
			}

			$patterns = trim( (string) self::get( 'exclude_paths', '' ) );
			if ( '' === $patterns ) {
				return (bool) apply_filters( 'capms_is_excluded', false, $attachment_id, $file );
			}

			if ( ! $file && $attachment_id ) {
				$file = get_attached_file( $attachment_id );
			}
			if ( ! $file ) {
				return false;
			}

			$uploads  = wp_get_upload_dir();
			$base     = trailingslashit( wp_normalize_path( $uploads['basedir'] ) );
			$path     = wp_normalize_path( $file );
			$relative = 0 === strpos( $path, $base ) ? substr( $path, strlen( $base ) ) : ltrim( $path, '/' );
			$relative = strtolower( $relative );

			foreach ( explode( "\n", $patterns ) as $pattern ) {
				$pattern = strtolower( trim( $pattern ) );
				if ( '' === $pattern ) {
					continue;
				}

				if ( false !== strpbrk( $pattern, '*?' ) ) {
					if ( function_exists( 'fnmatch' ) && ( fnmatch( $pattern, $relative ) || fnmatch( '*' . $pattern, $relative ) ) ) {
						return true;
					}
				} elseif ( false !== strpos( $relative, $pattern ) ) {
					return true;
				}
			}

			return (bool) apply_filters( 'capms_is_excluded', false, $attachment_id, $file );
		}

		/**
		 * Retention period in seconds. 0 = immediate, -1 = never.
		 *
		 * @since 0.0.1
		 * @return int
		 */
		public static function get_retention_seconds() {
			$retention = (string) self::get( 'backup_retention', 'never' );
			if ( 'immediate' === $retention ) {
				return 0;
			}
			if ( 'never' === $retention ) {
				return -1;
			}
			return absint( $retention );
		}

		/**
		 * Clear the request cache (used after direct option writes).
		 *
		 * @since 0.0.1
		 * @return void
		 */
		public static function flush_cache() {
			self::$cache = null;
		}
	}
}
