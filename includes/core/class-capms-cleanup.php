<?php
/**
 * Storage cleanup tools: unused media, duplicate files, unused thumbnail
 * sizes and the storage report.
 *
 * @since      0.1.0
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

if ( ! class_exists( 'Capms_Cleanup' ) ) {

	/**
	 * Everything here is deliberately conservative: when there is any sign
	 * that a file might still be used, it is reported as "in use" and is
	 * never offered for deletion. Deleting always re-checks usage first.
	 *
	 * Scans are done in small batches (a handful of attachments per
	 * request) so they never time out on big libraries.
	 *
	 * @since 0.1.0
	 */
	class Capms_Cleanup {

		/**
		 * Post meta keys that never count as "usage".
		 *
		 * @var array
		 */
		const IGNORED_META_KEYS = array( '_wp_attached_file', '_wp_attachment_metadata', '_wp_attachment_backup_sizes', '_wp_attachment_image_alt', '_edit_lock', '_edit_last', '_capms_optimized', '_capms_pending', '_capms_hash', '_capms_hash_sig' );

		/**
		 * Meta key fragments that usually hold an attachment ID.
		 *
		 * @var array
		 */
		const ID_META_HINTS = array( 'image', 'thumb', 'logo', 'icon', 'gallery', 'photo', 'media', 'attachment', 'avatar', 'banner', 'background', 'cover', 'poster', 'file' );

		/**
		 * All attachment IDs (newest first).
		 *
		 * @since 0.1.0
		 * @return int[]
		 */
		public static function get_attachment_ids() {
			global $wpdb;

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$ids = $wpdb->get_col( "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_status <> 'trash' ORDER BY ID DESC" );

			return array_map( 'intval', (array) $ids );
		}

		/**
		 * Average size reduction (0-1) seen so far, used for the
		 * "potential savings" estimate. Falls back to 30%.
		 *
		 * @since 0.1.0
		 * @return float
		 */
		public static function estimate_ratio() {
			$summary = Capms_Stats::get_summary();
			$ratio   = isset( $summary['ratio'] ) ? (float) $summary['ratio'] / 100 : 0;

			return $ratio > 0.05 ? min( 0.8, $ratio ) : 0.3;
		}

		/**
		 * Needles (uploads-relative paths without extension) that identify
		 * an attachment inside post content, options and meta.
		 *
		 * @since 0.1.0
		 * @param int $id Attachment ID.
		 * @return string[]
		 */
		private static function needles( $id ) {
			$relative = (string) get_post_meta( $id, '_wp_attached_file', true );
			if ( '' === $relative ) {
				return array();
			}

			$needles   = array();
			$dir       = dirname( $relative );
			$dir       = '.' === $dir ? '' : trailingslashit( $dir );
			$filename  = pathinfo( $relative, PATHINFO_FILENAME );
			$basename  = basename( $relative );

			$needles[] = $dir . $filename;
			$needles[] = $relative;

			$meta = wp_get_attachment_metadata( $id );
			if ( is_array( $meta ) && ! empty( $meta['original_image'] ) ) {
				$needles[] = $dir . pathinfo( $meta['original_image'], PATHINFO_FILENAME );
				$needles[] = $dir . $meta['original_image'];
			}

			// Sub-size filenames as needles as well.
			if ( is_array( $meta ) && ! empty( $meta['sizes'] ) && is_array( $meta['sizes'] ) ) {
				foreach ( $meta['sizes'] as $size_data ) {
					if ( ! empty( $size_data['file'] ) ) {
						$needles[] = $dir . $size_data['file'];
						$needles[] = $dir . pathinfo( $size_data['file'], PATHINFO_FILENAME );
					}
				}
			}

			// "-scaled" copies are referenced by their un-scaled name too.
			foreach ( $needles as $needle ) {
				if ( '-scaled' === substr( $needle, -7 ) ) {
					$needles[] = substr( $needle, 0, -7 );
				}
			}

			// Add JSON-escaped needles (e.g. Elementor stores "uploads\/2024\/05\/image.jpg").
			$json_needles = array();
			foreach ( $needles as $needle ) {
				if ( false !== strpos( $needle, '/' ) ) {
					$json_needles[] = str_replace( '/', '\/', $needle );
				}
			}

			return array_values( array_unique( array_filter( array_merge( $needles, $json_needles ) ) ) );
		}

		/**
		 * Is this attachment referenced anywhere?
		 *
		 * @since 0.1.0
		 * @param int  $id     Attachment ID.
		 * @param bool $strict When true, "attached to a post" alone does not
		 *                     count as usage (only real references do).
		 * @return array { used: bool, reasons: string[] }
		 */
		public static function check_usage( $id, $strict = false ) {
			global $wpdb;

			$id      = absint( $id );
			$reasons = array();
			$needles = self::needles( $id );
			$post    = get_post( $id );

			if ( ! $post || 'attachment' !== $post->post_type ) {
				return array(
					'used'    => true,
					'reasons' => array( 'missing' ),
				);
			}

			// 1) Attached to a (living) post.
			if ( ! $strict && $post->post_parent ) {
				$parent = get_post( $post->post_parent );
				if ( $parent && ! in_array( $parent->post_status, array( 'trash', 'auto-draft' ), true ) ) {
					$reasons[] = 'attached';
				}
			}

			// 2) Featured image / WooCommerce gallery.
			// phpcs:disable WordPress.DB.DirectDatabaseQuery
			if ( $wpdb->get_var( $wpdb->prepare( "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_thumbnail_id' AND meta_value = %s LIMIT 1", (string) $id ) ) ) {
				$reasons[] = 'featured';
			}
			if ( $wpdb->get_var( $wpdb->prepare( "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_product_image_gallery' AND FIND_IN_SET( %s, meta_value ) LIMIT 1", (string) $id ) ) ) {
				$reasons[] = 'gallery';
			}

			// 3) Post content / excerpt: file path, block id, wp-image class.
			$content_sql = "SELECT ID FROM {$wpdb->posts} WHERE post_type NOT IN ('revision','attachment') AND post_status NOT IN ('trash','auto-draft') AND ID <> %d AND (";
			$content_args = array( $id );
			$clauses      = array();

			foreach ( $needles as $needle ) {
				$clauses[]      = 'post_content LIKE %s OR post_excerpt LIKE %s';
				$like           = '%' . $wpdb->esc_like( $needle ) . '%';
				$content_args[] = $like;
				$content_args[] = $like;
			}
			foreach ( array(
				'%"id":' . $id . ',%',
				'%"id":' . $id . '}%',
				'%"id":"' . $id . '"%',
				'%wp-image-' . $id . '"%',
				'%wp-image-' . $id . ' %',
				'%"mediaId":' . $id . '%',
				'%"ids":[%' . $id . '%',
				'%image="' . $id . '"%',
				'%image=\'' . $id . '\'%',
				'%images="' . $id . '"%',
				'%ids="' . $id . '"%',
				'%ids=\'' . $id . '\'%',
			) as $pattern ) {
				$clauses[]      = 'post_content LIKE %s';
				$content_args[] = $pattern;
			}
			// [gallery ids="1,2,3"] style lists and comma separated IDs.
			$clauses[]      = '( post_content LIKE %s AND ( post_content LIKE %s OR post_content LIKE %s OR post_content LIKE %s ) )';
			$content_args[] = '%[gallery%';
			$content_args[] = '%' . $wpdb->esc_like( (string) $id ) . '%';
			$content_args[] = '%,' . $wpdb->esc_like( (string) $id ) . ',%';
			$content_args[] = '%,' . $wpdb->esc_like( (string) $id ) . '"%';

			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared
			if ( $wpdb->get_var( $wpdb->prepare( $content_sql . implode( ' OR ', $clauses ) . ') LIMIT 1', $content_args ) ) ) {
				$reasons[] = 'content';
			}

			// 4) Any other post meta (page builders, ACF, theme options...).
			if ( $needles ) {
				$meta_clauses = array();
				$meta_args    = array( $id );
				foreach ( $needles as $needle ) {
					$meta_clauses[] = 'meta_value LIKE %s';
					$meta_args[]    = '%' . $wpdb->esc_like( $needle ) . '%';
				}
				$ignored      = implode( ',', array_fill( 0, count( self::IGNORED_META_KEYS ), '%s' ) );
				$meta_args    = array_merge( $meta_args, self::IGNORED_META_KEYS );
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared
				if ( $wpdb->get_var( $wpdb->prepare( "SELECT meta_id FROM {$wpdb->postmeta} WHERE post_id <> %d AND (" . implode( ' OR ', $meta_clauses ) . ") AND meta_key NOT IN ($ignored) LIMIT 1", $meta_args ) ) ) {
					$reasons[] = 'meta';
				}
			}

			// Meta fields that store the attachment ID itself.
			$hint_clauses = array();
			$hint_args    = array( (string) $id, $id );
			foreach ( self::ID_META_HINTS as $hint ) {
				$hint_clauses[] = 'meta_key LIKE %s';
				$hint_args[]    = '%' . $wpdb->esc_like( $hint ) . '%';
			}
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared
			if ( $wpdb->get_var( $wpdb->prepare( "SELECT meta_id FROM {$wpdb->postmeta} WHERE meta_value = %s AND post_id <> %d AND (" . implode( ' OR ', $hint_clauses ) . ') LIMIT 1', $hint_args ) ) ) {
				$reasons[] = 'meta';
			}

			// 5) Options: widgets, theme mods, site icon / logo, customizer.
			$site_ids = array( (int) get_option( 'site_icon', 0 ), (int) get_option( 'site_logo', 0 ) );
			if ( in_array( $id, $site_ids, true ) ) {
				$reasons[] = 'site';
			}

			$option_clauses = array();
			$option_args    = array();
			foreach ( $needles as $needle ) {
				$option_clauses[] = 'option_value LIKE %s';
				$option_args[]    = '%' . $wpdb->esc_like( $needle ) . '%';
			}
			$option_clauses[] = '( option_name LIKE %s AND ( option_value LIKE %s OR option_value LIKE %s ) )';
			$option_args[]    = 'theme\_mods\_%';
			$option_args[]    = '%' . $wpdb->esc_like( 'i:' . $id . ';' ) . '%';
			$option_args[]    = '%' . $wpdb->esc_like( '"' . $id . '"' ) . '%';

			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared
			if ( $wpdb->get_var( $wpdb->prepare( "SELECT option_id FROM {$wpdb->options} WHERE option_name NOT LIKE %s AND option_name NOT LIKE %s AND option_name NOT LIKE %s AND (" . implode( ' OR ', $option_clauses ) . ') LIMIT 1', array_merge( array( '\_transient\_%', '\_site\_transient\_%', 'capms\_%' ), $option_args ) ) ) ) {
				$reasons[] = 'options';
			}

			// 6) Term meta (e.g. WooCommerce category images).
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			if ( $wpdb->get_var( $wpdb->prepare( "SELECT meta_id FROM {$wpdb->termmeta} WHERE (meta_value = %s OR meta_value LIKE %s) LIMIT 1", (string) $id, '%' . $wpdb->esc_like( (string) $id ) . '%' ) ) ) {
				$reasons[] = 'term';
			}

			// 7) Usermeta (local avatars, author profile pictures).
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			if ( $wpdb->get_var( $wpdb->prepare( "SELECT umeta_id FROM {$wpdb->usermeta} WHERE (meta_value = %s OR meta_value LIKE %s) AND (meta_key LIKE %s OR meta_key LIKE %s OR meta_key LIKE %s OR meta_key LIKE %s) LIMIT 1", (string) $id, '%"id":' . $id . '%', '%avatar%', '%photo%', '%image%', '%profile%' ) ) ) {
				$reasons[] = 'user';
			}

			// 8) Elementor _elementor_data JSON check.
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			if ( $wpdb->get_var( $wpdb->prepare( "SELECT meta_id FROM {$wpdb->postmeta} WHERE meta_key = '_elementor_data' AND (meta_value LIKE %s OR meta_value LIKE %s OR meta_value LIKE %s) LIMIT 1", '%"id":' . $id . ',%', '%"id":' . $id . '}%', '%"id":"' . $id . '"%' ) ) ) {
				$reasons[] = 'elementor';
			}
			// phpcs:enable WordPress.DB.DirectDatabaseQuery

			/**
			 * Let other code (page builders, custom storage) mark an
			 * attachment as in use.
			 *
			 * @param string[] $reasons Reasons found so far.
			 * @param int      $id      Attachment ID.
			 * @param bool     $strict  Strict mode.
			 */
			$reasons = (array) apply_filters( 'capms_attachment_usage_reasons', array_values( array_unique( $reasons ) ), $id, $strict );

			return array(
				'used'    => ! empty( $reasons ),
				'reasons' => $reasons,
			);
		}

		/**
		 * Total bytes of an attachment (original + sizes + our copies).
		 *
		 * @since 0.1.0
		 * @param int $id Attachment ID.
		 * @return array { main, sizes, extras }
		 */
		public static function get_bytes( $id ) {
			$file = get_attached_file( $id );
			$out  = array(
				'main'   => 0,
				'sizes'  => 0,
				'extras' => 0,
			);

			if ( ! $file ) {
				return $out;
			}

			$paths = Capms_Processor::get_image_files( $file, wp_get_attachment_metadata( $id ) );
			foreach ( $paths as $index => $path ) {
				if ( is_file( $path ) ) {
					$bytes = (int) filesize( $path );
					if ( 0 === $index ) {
						$out['main'] += $bytes;
					} else {
						$out['sizes'] += $bytes;
					}
				}
				foreach ( array( 'webp', 'avif', 'webm', 'mp4', 'poster.jpg' ) as $ext ) {
					if ( is_file( $path . '.' . $ext ) ) {
						$out['extras'] += (int) filesize( $path . '.' . $ext );
					}
				}
			}

			return $out;
		}

		/**
		 * Basic card data for the UI.
		 *
		 * @since 0.1.0
		 * @param int $id Attachment ID.
		 * @return array
		 */
		public static function describe( $id ) {
			$file  = get_attached_file( $id );
			$thumb = wp_get_attachment_image_url( $id, 'thumbnail' );

			return array(
				'id'    => (int) $id,
				'title' => get_the_title( $id ),
				'file'  => $file ? wp_basename( $file ) : '',
				'path'  => (string) get_post_meta( $id, '_wp_attached_file', true ),
				'mime'  => (string) get_post_mime_type( $id ),
				'thumb' => $thumb ? esc_url_raw( $thumb ) : '',
				'edit'  => esc_url_raw( get_edit_post_link( $id, 'raw' ) ),
			);
		}

		/**
		 * Unused media scan for a batch of attachments.
		 *
		 * @since 0.1.0
		 * @param int[] $ids    Attachment IDs.
		 * @param bool  $strict Strict mode.
		 * @return array { items: array, checked: int }
		 */
		public static function scan_unused( $ids, $strict = false ) {
			$items = array();

			foreach ( $ids as $id ) {
				$usage = self::check_usage( $id, $strict );
				if ( $usage['used'] ) {
					continue;
				}

				$bytes   = self::get_bytes( $id );
				$items[] = array_merge(
					self::describe( $id ),
					array(
						'bytes' => $bytes['main'] + $bytes['sizes'] + $bytes['extras'],
					)
				);
			}

			return array(
				'items'   => $items,
				'checked' => count( $ids ),
			);
		}

		/**
		 * Original file sizes (first, cheap step of the duplicate scan).
		 *
		 * @since 0.1.0
		 * @param int[] $ids Attachment IDs.
		 * @return array id => bytes
		 */
		public static function scan_sizes( $ids ) {
			$out = array();
			foreach ( $ids as $id ) {
				$file = get_attached_file( $id );
				if ( $file && is_file( $file ) ) {
					$out[ $id ] = (int) filesize( $file );
				}
			}
			return $out;
		}

		/**
		 * MD5 of the original files (second step of the duplicate scan).
		 * Cached in post meta together with size + mtime.
		 *
		 * @since 0.1.0
		 * @param int[] $ids Attachment IDs.
		 * @return array id => md5
		 */
		public static function hash_files( $ids ) {
			$out = array();
			/**
			 * Files larger than this many bytes are not hashed.
			 *
			 * @param int $max Default 200 MB.
			 */
			$max = (int) apply_filters( 'capms_hash_max_size', 200 * MB_IN_BYTES );

			foreach ( $ids as $id ) {
				$file = get_attached_file( $id );
				if ( ! $file || ! is_file( $file ) || filesize( $file ) > $max ) {
					continue;
				}

				$sig    = filesize( $file ) . '-' . filemtime( $file );
				$cached = get_post_meta( $id, '_capms_hash', true );
				if ( $cached && get_post_meta( $id, '_capms_hash_sig', true ) === $sig ) {
					$out[ $id ] = $cached;
					continue;
				}

				$hash = md5_file( $file );
				if ( $hash ) {
					update_post_meta( $id, '_capms_hash', $hash );
					update_post_meta( $id, '_capms_hash_sig', $sig );
					$out[ $id ] = $hash;
				}
			}

			return $out;
		}

		/**
		 * Detail for the duplicate groups found by the browser.
		 *
		 * @since 0.1.0
		 * @param array $groups Array of arrays of attachment IDs.
		 * @return array
		 */
		public static function describe_duplicate_groups( $groups ) {
			$out = array();

			foreach ( array_slice( (array) $groups, 0, 300 ) as $group ) {
				$members = array();
				foreach ( array_slice( array_map( 'absint', (array) $group ), 0, 50 ) as $id ) {
					if ( ! $id || 'attachment' !== get_post_type( $id ) ) {
						continue;
					}
					$usage   = self::check_usage( $id, false );
					$bytes   = self::get_bytes( $id );
					$post    = get_post( $id );
					$members[] = array_merge(
						self::describe( $id ),
						array(
							'bytes'   => $bytes['main'] + $bytes['sizes'] + $bytes['extras'],
							'used'    => $usage['used'],
							'reasons' => $usage['reasons'],
							'date'    => $post ? mysql2date( 'Y-m-d', $post->post_date ) : '',
						)
					);
				}
				if ( count( $members ) > 1 ) {
					$out[] = $members;
				}
			}

			return $out;
		}

		/**
		 * Thumbnail sizes of an attachment that are no longer registered.
		 *
		 * @since 0.1.0
		 * @param int $id Attachment ID.
		 * @return array List of { name, file, path, bytes } that are safe to delete.
		 */
		public static function find_unused_sizes( $id ) {
			global $wpdb;

			$meta = wp_get_attachment_metadata( $id );
			$file = get_attached_file( $id );
			if ( ! $file || ! is_array( $meta ) || empty( $meta['sizes'] ) ) {
				return array();
			}

			$registered = function_exists( 'wp_get_registered_image_subsizes' ) ? array_keys( wp_get_registered_image_subsizes() ) : get_intermediate_image_sizes();
			/**
			 * Size names that must never be removed.
			 *
			 * @param string[] $keep Size names.
			 */
			$keep = (array) apply_filters( 'capms_thumbnail_keep_sizes', array() );
			$dir  = trailingslashit( dirname( $file ) );
			$rel  = (string) get_post_meta( $id, '_wp_attached_file', true );
			$rdir = '.' === dirname( $rel ) ? '' : trailingslashit( dirname( $rel ) );
			$out  = array();

			foreach ( $meta['sizes'] as $name => $size ) {
				if ( in_array( $name, $registered, true ) || in_array( $name, $keep, true ) || empty( $size['file'] ) ) {
					continue;
				}

				$path = $dir . $size['file'];
				if ( ! is_file( $path ) || $path === $file ) {
					continue;
				}

				// Same file used as another (still registered) size.
				foreach ( $meta['sizes'] as $other_name => $other ) {
					if ( $other_name !== $name && ! empty( $other['file'] ) && $other['file'] === $size['file'] && in_array( $other_name, $registered, true ) ) {
						continue 2;
					}
				}

				// Referenced by file name in content, meta or options?
				$like = '%' . $wpdb->esc_like( $rdir . pathinfo( $size['file'], PATHINFO_FILENAME ) ) . '%';
				// phpcs:disable WordPress.DB.DirectDatabaseQuery
				$hit = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_type <> 'revision' AND post_status <> 'trash' AND post_content LIKE %s LIMIT 1", $like ) )
					|| $wpdb->get_var( $wpdb->prepare( "SELECT meta_id FROM {$wpdb->postmeta} WHERE meta_value LIKE %s AND meta_key NOT IN ('_wp_attachment_metadata','_wp_attached_file','_wp_attachment_backup_sizes') LIMIT 1", $like ) )
					|| $wpdb->get_var( $wpdb->prepare( "SELECT option_id FROM {$wpdb->options} WHERE option_value LIKE %s AND option_name NOT LIKE %s LIMIT 1", $like, '\_transient\_%' ) );
				// phpcs:enable WordPress.DB.DirectDatabaseQuery
				if ( $hit ) {
					continue;
				}

				$bytes = (int) filesize( $path );
				foreach ( array( 'webp', 'avif' ) as $ext ) {
					if ( is_file( $path . '.' . $ext ) ) {
						$bytes += (int) filesize( $path . '.' . $ext );
					}
				}

				$out[] = array(
					'name'  => $name,
					'file'  => $size['file'],
					'bytes' => $bytes,
				);
			}

			return $out;
		}

		/**
		 * Unused thumbnail scan for a batch of attachments.
		 *
		 * @since 0.1.0
		 * @param int[] $ids Attachment IDs.
		 * @return array { items, checked }
		 */
		public static function scan_thumbnails( $ids ) {
			$items = array();

			foreach ( $ids as $id ) {
				$sizes = self::find_unused_sizes( $id );
				if ( ! $sizes ) {
					continue;
				}
				$items[] = array_merge(
					self::describe( $id ),
					array(
						'sizes' => $sizes,
						'bytes' => array_sum( wp_list_pluck( $sizes, 'bytes' ) ),
					)
				);
			}

			return array(
				'items'   => $items,
				'checked' => count( $ids ),
			);
		}

		/**
		 * Delete the unused thumbnail sizes of the given attachments.
		 *
		 * @since 0.1.0
		 * @param int[] $ids  Attachment IDs.
		 * @param bool  $keep Whether to copy thumbnails to deleted/ folder before deleting.
		 * @return array { files, bytes }
		 */
		public static function clean_thumbnails( $ids, $keep = false ) {
			$files = 0;
			$bytes = 0;

			$deleted_dir = '';
			if ( $keep && Capms_Backup::ensure_root() ) {
				$deleted_dir = trailingslashit( Capms_Backup::get_root() ) . 'deleted/thumbnails/';
				wp_mkdir_p( $deleted_dir );
			}

			foreach ( $ids as $id ) {
				$sizes = self::find_unused_sizes( $id );
				$meta  = wp_get_attachment_metadata( $id );
				$file  = get_attached_file( $id );
				if ( ! $sizes || ! is_array( $meta ) || ! $file ) {
					continue;
				}

				$dir = trailingslashit( dirname( $file ) );
				foreach ( $sizes as $size ) {
					$path = $dir . $size['file'];
					foreach ( array( '', '.webp', '.avif' ) as $suffix ) {
						$target_file = $path . $suffix;
						if ( is_file( $target_file ) ) {
							$bytes += (int) filesize( $target_file );
							if ( $deleted_dir ) {
								$target_copy = $deleted_dir . $id . '-' . basename( $target_file );
								@copy( $target_file, $target_copy );
							}
							wp_delete_file( $target_file );
							++$files;
						}
					}
					unset( $meta['sizes'][ $size['name'] ] );
				}

				Capms_Processor::$skip_processing = true;
				wp_update_attachment_metadata( $id, $meta );
				Capms_Processor::$skip_processing = false;
			}

			return array(
				'files' => $files,
				'bytes' => $bytes,
			);
		}

		/**
		 * Delete attachments that are still unused (or are unused
		 * duplicates). Usage is checked again here, so a stale scan can
		 * never delete something that has since been put to use.
		 *
		 * @since 0.1.0
		 * @param int[] $ids    Attachment IDs.
		 * @param bool  $strict Strict mode used for the scan.
		 * @param bool  $keep   Keep a copy of every deleted original.
		 * @return array { deleted, skipped, bytes }
		 */
		public static function delete_unused( $ids, $strict = false, $keep = true ) {
			$deleted = array();
			$skipped = array();
			$bytes   = 0;

			foreach ( $ids as $id ) {
				$id = absint( $id );
				$can_delete = ( defined( 'WP_CLI' ) && WP_CLI ) || current_user_can( 'delete_post', $id );
				if ( ! $id || 'attachment' !== get_post_type( $id ) || ! $can_delete ) {
					$skipped[] = $id;
					continue;
				}

				$usage = self::check_usage( $id, $strict );
				if ( $usage['used'] ) {
					$skipped[] = $id;
					continue;
				}

				$size = self::get_bytes( $id );
				if ( $keep ) {
					$copied = self::keep_copy( $id );
					if ( ! $copied ) {
						// Safety copy failed, do not proceed with deletion.
						$skipped[] = $id;
						continue;
					}
				}

				if ( wp_delete_attachment( $id, true ) ) {
					$deleted[] = $id;
					$bytes    += $size['main'] + $size['sizes'] + $size['extras'];
				} else {
					$skipped[] = $id;
				}
			}

			return array(
				'deleted' => $deleted,
				'skipped' => $skipped,
				'bytes'   => $bytes,
			);
		}

		/**
		 * Copy the original into the backup folder (deleted/ sub folder)
		 * before an attachment is removed.
		 *
		 * @since 0.1.0
		 * @param int $id Attachment ID.
		 * @return bool
		 */
		private static function keep_copy( $id ) {
			$file     = get_attached_file( $id );
			$relative = (string) get_post_meta( $id, '_wp_attached_file', true );
			if ( ! $file || ! is_file( $file ) || '' === $relative || false !== strpos( $relative, '..' ) ) {
				return false;
			}

			if ( ! Capms_Backup::ensure_root() ) {
				return false;
			}
			$root = Capms_Backup::get_root();

			$target = trailingslashit( $root ) . 'deleted/' . $id . '-' . ltrim( $relative, '/' );
			wp_mkdir_p( dirname( $target ) );

			$copied = copy( $file, $target ); // phpcs:ignore WordPress.WP.AlternativeFunctions

			// Also preserve all intermediate thumbnail sizes in the safety backup folder.
			$meta = wp_get_attachment_metadata( $id );
			if ( is_array( $meta ) && ! empty( $meta['sizes'] ) && is_array( $meta['sizes'] ) ) {
				$source_dir = dirname( $file );
				$target_dir = dirname( $target );
				foreach ( $meta['sizes'] as $size_data ) {
					if ( ! empty( $size_data['file'] ) ) {
						$sub_source = trailingslashit( $source_dir ) . $size_data['file'];
						$sub_target = trailingslashit( $target_dir ) . $size_data['file'];
						if ( is_file( $sub_source ) ) {
							@copy( $sub_source, $sub_target );
						}
					}
				}
			}

			return $copied;
		}

		/**
		 * Scan safety copies stored in deleted/ backup folder.
		 *
		 * @since 1.0.3
		 * @return array
		 */
		public static function list_safety_copies() {
			$root = trailingslashit( Capms_Backup::get_root() ) . 'deleted';
			if ( ! is_dir( $root ) ) {
				return array();
			}

			$items = array();
			$iterator = new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator( $root, FilesystemIterator::SKIP_DOTS ),
				RecursiveIteratorIterator::CHILD_FIRST
			);

			$root_len = strlen( wp_normalize_path( trailingslashit( $root ) ) );

			foreach ( $iterator as $file_info ) {
				if ( ! $file_info->isFile() ) {
					continue;
				}

				$real_path       = wp_normalize_path( $file_info->getPathname() );
				$relative_path   = substr( $real_path, $root_len );
				$filename        = $file_info->getFilename();
				$size            = $file_info->getSize();
				$mtime           = $file_info->getMTime();
				$is_thumb        = ( 0 === strpos( $relative_path, 'thumbnails/' ) );

				// Extract ID if prefix like "855-" exists.
				$base_target = $is_thumb ? substr( $relative_path, 11 ) : $relative_path;
				$id          = 0;
				if ( preg_match( '/^(\d+)-(.*)$/', $base_target, $matches ) ) {
					$id          = (int) $matches[1];
					$orig_name   = $matches[2];
				} else {
					$orig_name   = $filename;
				}

				$items[] = array(
					'rel_path'  => $relative_path,
					'filename'  => $filename,
					'orig_name' => basename( $orig_name ),
					'id'        => $id,
					'size'      => $size,
					'mtime'     => $mtime,
					'date'      => date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $mtime ),
					'is_thumb'  => $is_thumb,
				);
			}

			// Sort newest first.
			usort( $items, function( $a, $b ) {
				return $b['mtime'] - $a['mtime'];
			} );

			return $items;
		}

		/**
		 * Restore a safety copy back to uploads directory.
		 *
		 * @since 1.0.3
		 * @param string $relative_path Relative path inside deleted/ folder.
		 * @return array
		 */
		public static function restore_safety_copy( $relative_path ) {
			if ( empty( $relative_path ) || false !== strpos( $relative_path, '..' ) ) {
				return array( 'success' => false, 'message' => __( 'Invalid file path.', 'captain-media-shield' ) );
			}

			$root = trailingslashit( Capms_Backup::get_root() ) . 'deleted/';
			$source_file = wp_normalize_path( $root . ltrim( $relative_path, '/' ) );

			if ( ! is_file( $source_file ) ) {
				return array( 'success' => false, 'message' => __( 'Safety copy file does not exist on disk.', 'captain-media-shield' ) );
			}

			$upload_dir = wp_upload_dir();
			$basedir    = wp_normalize_path( $upload_dir['basedir'] );

			$is_thumb = ( 0 === strpos( $relative_path, 'thumbnails/' ) );

			if ( $is_thumb ) {
				// E.g. thumbnails/855-image-150x150.jpg -> restore thumbnail into uploads folder.
				$base_file = substr( $relative_path, 11 );
				$orig_file = preg_replace( '/^\d+-/', '', $base_file );
				$dest_file = trailingslashit( $basedir ) . $orig_file;

				wp_mkdir_p( dirname( $dest_file ) );
				if ( ! @copy( $source_file, $dest_file ) ) {
					return array( 'success' => false, 'message' => __( 'Could not write thumbnail file to uploads.', 'captain-media-shield' ) );
				}
				@unlink( $source_file );

				return array(
					'success' => true,
					'message' => sprintf( __( 'Restored thumbnail %s successfully.', 'captain-media-shield' ), basename( $dest_file ) ),
				);
			}

			// Original media file: e.g. "855-2024/05/sample.jpg" or "855-sample.jpg"
			$dest_rel = preg_replace( '/^\d+-/', '', $relative_path );
			$dest_file = trailingslashit( $basedir ) . ltrim( $dest_rel, '/' );

			wp_mkdir_p( dirname( $dest_file ) );
			if ( ! @copy( $source_file, $dest_file ) ) {
				return array( 'success' => false, 'message' => __( 'Could not copy file back to uploads directory.', 'captain-media-shield' ) );
			}

			// Also restore sub-sizes if saved in the same deleted sub-folder.
			$source_dir = dirname( $source_file );
			$dest_dir   = dirname( $dest_file );
			if ( preg_match( '/^(\d+)-/', $relative_path, $m ) ) {
				$attach_id = (int) $m[1];
			} else {
				$attach_id = 0;
			}

			// Only restore thumbnail sub-sizes that belong strictly to this specific file.
			// Never iterate or copy unrelated files from the deleted/ folder root.
			$base_name = pathinfo( $dest_file, PATHINFO_FILENAME );
			$base_ext  = pathinfo( $dest_file, PATHINFO_EXTENSION );

			if ( is_dir( $source_dir ) && $handle = opendir( $source_dir ) ) {
				while ( false !== ( $entry = readdir( $handle ) ) ) {
					if ( '.' === $entry || '..' === $entry ) {
						continue;
					}
					// Must match this specific file's thumbnail format (e.g. "sample-150x150.jpg" or "855-sample-150x150.jpg")
					$pattern = '/^(?:' . ( $attach_id > 0 ? $attach_id . '-' : '\d+-' ) . ')?' . preg_quote( $base_name, '/' ) . '-\d+x\d+\.' . preg_quote( $base_ext, '/' ) . '$/i';
					if ( preg_match( $pattern, $entry ) ) {
						$sub_source = trailingslashit( $source_dir ) . $entry;
						$sub_name   = preg_replace( '/^\d+-/', '', $entry );
						$sub_dest   = trailingslashit( $dest_dir ) . $sub_name;
						if ( is_file( $sub_source ) && $sub_source !== $source_file ) {
							@copy( $sub_source, $sub_dest );
							@unlink( $sub_source );
						}
					}
				}
				closedir( $handle );
			}

			// Restore attachment in WordPress database if missing or in trash.
			if ( $attach_id > 0 ) {
				$post = get_post( $attach_id );
				if ( $post ) {
					if ( 'trash' === $post->post_status ) {
						wp_untrash_post( $attach_id );
					}
					update_attached_file( $attach_id, $dest_file );
				} else {
					// Re-create attachment entry in Media Library.
					$filetype = wp_check_filetype( basename( $dest_file ), null );
					$attachment = array(
						'guid'           => trailingslashit( $upload_dir['baseurl'] ) . _wp_relative_upload_path( $dest_file ),
						'post_mime_type' => $filetype['type'] ? $filetype['type'] : 'image/jpeg',
						'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $dest_file ) ),
						'post_content'   => '',
						'post_status'    => 'inherit',
					);
					$new_id = wp_insert_attachment( $attachment, $dest_file );
					if ( ! is_wp_error( $new_id ) && $new_id > 0 ) {
						require_once ABSPATH . 'wp-admin/includes/image.php';
						$meta = wp_generate_attachment_metadata( $new_id, $dest_file );
						wp_update_attachment_metadata( $new_id, $meta );
					}
				}
			}

			@unlink( $source_file );

			return array(
				'success' => true,
				'message' => sprintf( __( 'Successfully restored %s to Media Library.', 'captain-media-shield' ), basename( $dest_file ) ),
			);
		}

		/**
		 * Purge all safety copies in deleted/ folder.
		 *
		 * @since 1.0.3
		 * @return array
		 */
		public static function purge_safety_copies() {
			$root = trailingslashit( Capms_Backup::get_root() ) . 'deleted';
			if ( ! is_dir( $root ) ) {
				return array( 'count' => 0, 'bytes' => 0 );
			}

			$count = 0;
			$bytes = 0;
			$files = new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator( $root, FilesystemIterator::SKIP_DOTS ),
				RecursiveIteratorIterator::CHILD_FIRST
			);

			foreach ( $files as $file ) {
				if ( $file->isDir() ) {
					@rmdir( $file->getRealPath() );
				} else {
					$bytes += $file->getSize();
					$count++;
					@unlink( $file->getRealPath() );
				}
			}
			@rmdir( $root );

			return array( 'count' => $count, 'bytes' => $bytes );
		}

		/**
		 * Per-attachment numbers for the storage report (the browser
		 * adds them up).
		 *
		 * @since 0.1.0
		 * @param int[] $ids Attachment IDs.
		 * @return array
		 */
		public static function scan_storage( $ids ) {
			$items = array();

			foreach ( $ids as $id ) {
				$bytes = self::get_bytes( $id );
				$row   = Capms_Stats::get( $id );
				$rel   = (string) get_post_meta( $id, '_wp_attached_file', true );
				$mime  = (string) get_post_mime_type( $id );

				$items[] = array(
					'id'        => (int) $id,
					'title'     => get_the_title( $id ),
					'path'      => $rel,
					'folder'    => '.' === dirname( $rel ) ? '/' : dirname( $rel ),
					'mime'      => $mime,
					'type'      => strtok( $mime, '/' ),
					'main'      => $bytes['main'],
					'sizes'     => $bytes['sizes'],
					'extras'    => $bytes['extras'],
					'optimized' => $row && 'optimized' === $row['status'],
					'edit'      => esc_url_raw( get_edit_post_link( $id, 'raw' ) ),
				);
			}

			return $items;
		}
	}
}
