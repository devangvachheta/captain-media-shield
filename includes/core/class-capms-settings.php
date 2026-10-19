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

				// Videos.
				'video_enabled'      => true,
				'webm_enabled'       => true,
				'faststart_enabled'  => true,
				'video_resolution'   => '1080', // '1080' | '720' | 'original'.
				'audio_bitrate'      => '128', // '128' | '96' | 'original'.
				'video_strip_meta'   => true,
				'ffmpeg_path'        => '',

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
