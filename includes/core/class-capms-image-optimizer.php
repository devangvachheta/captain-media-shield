<?php
/**
 * Image optimization - resize, recompress, strip metadata, WebP/AVIF.
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

if ( ! class_exists( 'Capms_Image_Optimizer' ) ) {

	/**
	 * Works on files only (no attachment knowledge) - Capms_Processor
	 * decides which files of an attachment go through which step.
	 *
	 * Next-gen copies are written next to the source with the format
	 * appended (photo.jpg -> photo.jpg.webp / photo.jpg.avif) so the
	 * .htaccess rewrite and the <picture> filter can find them with a
	 * plain string append, and two sources with the same base name but
	 * different extensions never collide.
	 *
	 * @since 0.0.1
	 */
	class Capms_Image_Optimizer {

		/**
		 * Source mime types this optimizer handles.
		 *
		 * @var array
		 */
		const SUPPORTED_MIMES = array( 'image/jpeg', 'image/png' );

		/**
		 * Is this mime type something we optimize?
		 *
		 * @since 0.0.1
		 * @param string $mime Mime type.
		 * @return bool
		 */
		public static function is_supported( $mime ) {
			/**
			 * Filter the image mime types Captain Media Shield optimizes.
			 *
			 * @param array $mimes Mime types.
			 */
			return in_array( $mime, apply_filters( 'capms_supported_image_mimes', self::SUPPORTED_MIMES ), true );
		}

		/**
		 * First pass on a freshly uploaded original: auto-rotate from EXIF
		 * orientation (before that tag is stripped) and downscale anything
		 * over the configured max dimensions.
		 *
		 * @since 0.0.1
		 * @param string $file Absolute path.
		 * @param string $mime Mime type.
		 * @return bool True when the file was re-encoded.
		 */
		public static function prepare_original( $file, $mime ) {
			$settings = Capms_Settings::get_all();
			$editor   = wp_get_image_editor( $file );
			if ( is_wp_error( $editor ) ) {
				return false;
			}

			$changed = false;

			// Stripping removes the EXIF Orientation tag, so bake the
			// rotation into the pixels first or phone photos end up sideways.
			if ( ! empty( $settings['strip_metadata'] ) && method_exists( $editor, 'maybe_exif_rotate' ) ) {
				$rotated = $editor->maybe_exif_rotate();
				if ( true === $rotated ) {
					$changed = true;
				}
			}

			if ( ! empty( $settings['resize_enabled'] ) ) {
				$size  = $editor->get_size();
				$max_w = absint( $settings['max_width'] );
				$max_h = absint( $settings['max_height'] );

				if ( ( $max_w && $size['width'] > $max_w ) || ( $max_h && $size['height'] > $max_h ) ) {
					$resized = $editor->resize( $max_w ? $max_w : null, $max_h ? $max_h : null, false );
					if ( ! is_wp_error( $resized ) ) {
						$changed = true;
					}
				}
			}

			if ( ! $changed ) {
				return false;
			}

			$editor->set_quality( absint( $settings['image_quality'] ) );
			$saved = $editor->save( $file, $mime );

			return ! is_wp_error( $saved );
		}

		/**
		 * Downscale an existing file over the max dimensions (bulk path).
		 *
		 * @since 0.0.1
		 * @param string $file Absolute path.
		 * @param string $mime Mime type.
		 * @return bool True when resized.
		 */
		public static function maybe_resize( $file, $mime ) {
			if ( ! Capms_Settings::get( 'resize_enabled' ) ) {
				return false;
			}
			return self::prepare_original( $file, $mime );
		}

		/**
		 * Re-encode at the configured quality; keep the result only if it
		 * is actually smaller.
		 *
		 * @since 0.0.1
		 * @param string $file Absolute path.
		 * @param string $mime Mime type.
		 * @return bool True when the file was replaced.
		 */
		public static function recompress( $file, $mime ) {
			if ( ! is_file( $file ) ) {
				return false;
			}

			$editor = wp_get_image_editor( $file );
			if ( is_wp_error( $editor ) ) {
				return false;
			}

			$ext = pathinfo( $file, PATHINFO_EXTENSION );
			$tmp = trailingslashit( dirname( $file ) ) . 'capms-tmp-' . wp_generate_password( 8, false ) . '.' . $ext;

			$editor->set_quality( absint( Capms_Settings::get( 'image_quality', 80 ) ) );
			$saved = $editor->save( $tmp, $mime );

			if ( is_wp_error( $saved ) || empty( $saved['path'] ) || ! is_file( $saved['path'] ) ) {
				return false;
			}

			clearstatcache();
			$before = (int) filesize( $file );
			$after  = (int) filesize( $saved['path'] );

			if ( $after > 0 && $after < $before ) {
				return self::replace_file( $saved['path'], $file );
			}

			wp_delete_file( $saved['path'] );
			return false;
		}

		/**
		 * Remove privacy-sensitive metadata (EXIF incl. GPS, XMP, IPTC,
		 * comments) losslessly - no re-encode, so zero quality loss. The
		 * ICC colour profile is kept so colours don't shift.
		 *
		 * @since 0.0.1
		 * @param string $file Absolute path.
		 * @param string $mime Mime type.
		 * @return bool True when the file changed.
		 */
		public static function strip_metadata( $file, $mime ) {
			if ( ! is_file( $file ) ) {
				return false;
			}

			$data = file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			if ( false === $data ) {
				return false;
			}

			if ( 'image/jpeg' === $mime ) {
				$clean = self::strip_jpeg( $data );
			} elseif ( 'image/png' === $mime ) {
				$clean = self::strip_png( $data );
			} else {
				return false;
			}

			if ( false === $clean || strlen( $clean ) >= strlen( $data ) ) {
				return false;
			}

			return false !== file_put_contents( $file, $clean ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		}

		/**
		 * Drop APP1 (EXIF/GPS/XMP), APP13 (IPTC) and COM segments from a
		 * JPEG byte stream. Everything from SOS onwards is copied as-is.
		 *
		 * @since 0.0.1
		 * @param string $data JPEG bytes.
		 * @return string|false
		 */
		private static function strip_jpeg( $data ) {
			$len = strlen( $data );
			if ( $len < 4 || "\xFF\xD8" !== substr( $data, 0, 2 ) ) {
				return false;
			}

			$out = "\xFF\xD8";
			$pos = 2;

			while ( $pos < $len ) {
				if ( "\xFF" !== $data[ $pos ] ) {
					return false; // Corrupt / unexpected - leave the file alone.
				}

				$marker = ord( $data[ $pos + 1 ] );

				// Padding bytes.
				if ( 0xFF === $marker ) {
					++$pos;
					continue;
				}

				// Start of scan or end of image: copy the remainder verbatim.
				if ( 0xDA === $marker || 0xD9 === $marker ) {
					$out .= substr( $data, $pos );
					return $out;
				}

				// Stand-alone markers without a length field.
				if ( 0x01 === $marker || ( $marker >= 0xD0 && $marker <= 0xD7 ) ) {
					$out .= substr( $data, $pos, 2 );
					$pos += 2;
					continue;
				}

				if ( $pos + 4 > $len ) {
					return false;
				}

				$seg_len = ( ord( $data[ $pos + 2 ] ) << 8 ) + ord( $data[ $pos + 3 ] );
				$seg_end = $pos + 2 + $seg_len;
				if ( $seg_len < 2 || $seg_end > $len ) {
					return false;
				}

				$drop = in_array( $marker, array( 0xE1, 0xED, 0xFE ), true );
				if ( ! $drop ) {
					$out .= substr( $data, $pos, $seg_end - $pos );
				}
				$pos = $seg_end;
			}

			return false;
		}

		/**
		 * Drop eXIf / tEXt / zTXt / iTXt / tIME chunks from a PNG.
		 *
		 * @since 0.0.1
		 * @param string $data PNG bytes.
		 * @return string|false
		 */
		private static function strip_png( $data ) {
			$sig = "\x89PNG\r\n\x1a\n";
			$len = strlen( $data );
			if ( $len < 8 || substr( $data, 0, 8 ) !== $sig ) {
				return false;
			}

			$out  = $sig;
			$pos  = 8;
			$drop = array( 'eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME' );

			while ( $pos + 12 <= $len ) {
				$chunk_len = unpack( 'N', substr( $data, $pos, 4 ) )[1];
				$type      = substr( $data, $pos + 4, 4 );
				$total     = 12 + $chunk_len;

				if ( $pos + $total > $len ) {
					return false;
				}
				if ( ! in_array( $type, $drop, true ) ) {
					$out .= substr( $data, $pos, $total );
				}
				$pos += $total;

				if ( 'IEND' === $type ) {
					return $out;
				}
			}

			return false;
		}

		/**
		 * Write a WebP or AVIF copy next to $file. The copy is only kept
		 * when it is smaller than the source - serving a bigger "optimized"
		 * file would defeat the point.
		 *
		 * @since 0.0.1
		 * @param string $file   Absolute source path.
		 * @param string $format 'webp' | 'avif'.
		 * @return int Bytes of the kept copy (0 when none).
		 */
		public static function convert( $file, $format ) {
			$mime = 'avif' === $format ? 'image/avif' : 'image/webp';
			if ( ! is_file( $file ) || ! Capms_Environment::supports_mime( $mime ) ) {
				return 0;
			}

			$dest = $file . '.' . $format;

			$editor = wp_get_image_editor( $file );
			if ( is_wp_error( $editor ) ) {
				return 0;
			}

			$editor->set_quality( absint( Capms_Settings::get( 'image_quality', 80 ) ) );
			$saved = $editor->save( $dest, $mime );

			if ( is_wp_error( $saved ) || empty( $saved['path'] ) || ! is_file( $saved['path'] ) ) {
				return 0;
			}

			// Some editors normalise the extension - make sure the copy
			// lives exactly where the delivery layer will look for it.
			if ( wp_normalize_path( $saved['path'] ) !== wp_normalize_path( $dest ) ) {
				if ( ! self::replace_file( $saved['path'], $dest ) ) {
					return 0;
				}
			}

			clearstatcache();
			$size   = (int) filesize( $dest );
			$source = (int) filesize( $file );

			if ( $size <= 0 || $size >= $source ) {
				wp_delete_file( $dest );
				return 0;
			}

			return $size;
		}

		/**
		 * Move $from over $to (rename, with a copy fallback across devices).
		 *
		 * @since 0.0.1
		 * @param string $from Source.
		 * @param string $to   Destination.
		 * @return bool
		 */
		public static function replace_file( $from, $to ) {
			if ( @rename( $from, $to ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.rename_rename
				return true;
			}
			if ( @copy( $from, $to ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				wp_delete_file( $from );
				return true;
			}
			wp_delete_file( $from );
			return false;
		}
	}
}
