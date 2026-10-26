<?php
/**
 * WP-CLI commands.
 *
 * @since      0.1.0
 *
 * @package    captain-media-shield
 * @subpackage captain-media-shield/includes/cli
 */

/**
 * Exit if accessed directly.
 * */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( defined( 'WP_CLI' ) && WP_CLI && ! class_exists( 'Capms_CLI' ) ) {

	/**
	 * Optimize media and clean up storage from the command line.
	 *
	 * @since 0.1.0
	 */
	class Capms_CLI {

		/**
		 * Optimize images and videos in the Media Library.
		 *
		 * ## OPTIONS
		 *
		 * [--ids=<ids>]
		 * : Comma separated attachment IDs. Default: everything not optimized yet.
		 *
		 * [--type=<type>]
		 * : Only this kind of media.
		 * ---
		 * default: all
		 * options:
		 *   - all
		 *   - image
		 *   - video
		 * ---
		 *
		 * [--retry-failed]
		 * : Also retry files that failed or were skipped before.
		 *
		 * ## EXAMPLES
		 *
		 *     wp capms optimize
		 *     wp capms optimize --type=image --retry-failed
		 *     wp capms optimize --ids=12,15,18
		 *
		 * @param array $args       Positional arguments.
		 * @param array $assoc_args Associative arguments.
		 * @return void
		 */
		public function optimize( $args, $assoc_args ) {
			unset( $args );

			if ( ! empty( $assoc_args['ids'] ) ) {
				$ids = array_values( array_filter( array_map( 'absint', explode( ',', (string) $assoc_args['ids'] ) ) ) );
			} else {
				$ids = Capms_Processor::get_queue_ids( isset( $assoc_args['type'] ) ? (string) $assoc_args['type'] : 'all', ! empty( $assoc_args['retry-failed'] ) );
			}

			if ( ! $ids ) {
				WP_CLI::success( 'Nothing to optimize.' );
				return;
			}

			$progress = \WP_CLI\Utils\make_progress_bar( 'Optimizing media', count( $ids ) );
			$done     = 0;
			$failed   = 0;
			$saved    = 0;

			foreach ( $ids as $id ) {
				$result = Capms_Processor::get_instance()->process_attachment( $id );
				if ( is_wp_error( $result ) ) {
					++$failed;
					Capms_Stats::save(
						$id,
						array(
							'media_type' => 0 === strpos( (string) get_post_mime_type( $id ), 'video/' ) ? 'video' : 'image',
							'status'     => 'failed',
							'message'    => $result->get_error_message(),
						)
					);
					WP_CLI::debug( '#' . $id . ': ' . $result->get_error_message(), 'capms' );
				} else {
					++$done;
					$saved += max( 0, (int) $result['original_size'] - (int) $result['optimized_size'] );
				}
				$progress->tick();
			}

			$progress->finish();
			WP_CLI::success( sprintf( '%1$d processed, %2$d failed, %3$s saved.', $done, $failed, size_format( $saved, 2 ) ? size_format( $saved, 2 ) : '0 B' ) );
		}

		/**
		 * Restore the original of one or more attachments from the backup.
		 *
		 * ## OPTIONS
		 *
		 * <id>...
		 * : One or more attachment IDs.
		 *
		 * ## EXAMPLES
		 *
		 *     wp capms restore 123 124
		 *
		 * @param array $args Attachment IDs.
		 * @return void
		 */
		public function restore( $args ) {
			foreach ( $args as $id ) {
				$result = Capms_Backup::restore( absint( $id ) );
				if ( is_wp_error( $result ) ) {
					WP_CLI::warning( '#' . absint( $id ) . ': ' . $result->get_error_message() );
				} else {
					WP_CLI::log( '#' . absint( $id ) . ' restored.' );
				}
			}
			WP_CLI::success( 'Done.' );
		}

		/**
		 * Show how much has been optimized and saved.
		 *
		 * ## EXAMPLES
		 *
		 *     wp capms status
		 *
		 * @return void
		 */
		public function status() {
			$summary = Capms_Stats::get_summary();

			WP_CLI::log( sprintf( 'Optimized files : %d', $summary['processed'] ) );
			WP_CLI::log( sprintf( 'Storage saved    : %1$s (%2$s%%)', $summary['saved_human'], $summary['ratio'] ) );
			WP_CLI::log( sprintf( 'Backups kept     : %1$d file(s), %2$s', $summary['backup_files'], $summary['backup_human'] ) );
			WP_CLI::log( sprintf( 'Failed / skipped : %1$d / %2$d', $summary['failed'], $summary['skipped'] ) );
			WP_CLI::log( sprintf( 'Waiting to run   : %d', count( Capms_Processor::get_queue_ids( 'all', false ) ) ) );
		}

		/**
		 * Find (and optionally delete) unused media, duplicate files or
		 * unused thumbnail sizes.
		 *
		 * ## OPTIONS
		 *
		 * <what>
		 * : What to look for.
		 * ---
		 * options:
		 *   - unused
		 *   - duplicates
		 *   - thumbnails
		 * ---
		 *
		 * [--strict]
		 * : Unused / duplicates only. Do not treat "attached to a post" as in use.
		 *
		 * [--delete]
		 * : Delete what was found. Without it, the command only reports.
		 *
		 * [--no-copy]
		 * : Do not keep a copy of deleted originals in the backup folder.
		 *
		 * [--yes]
		 * : Do not ask for confirmation.
		 *
		 * ## EXAMPLES
		 *
		 *     wp capms cleanup unused
		 *     wp capms cleanup duplicates --delete --yes
		 *     wp capms cleanup thumbnails --delete
		 *
		 * @param array $args       Positional arguments.
		 * @param array $assoc_args Associative arguments.
		 * @return void
		 */
		public function cleanup( $args, $assoc_args ) {
			$what   = isset( $args[0] ) ? $args[0] : '';
			$strict = ! empty( $assoc_args['strict'] );
			$delete = ! empty( $assoc_args['delete'] );
			$keep   = empty( $assoc_args['no-copy'] );
			$ids    = Capms_Cleanup::get_attachment_ids();

			if ( 'unused' === $what ) {
				$found = array();
				foreach ( array_chunk( $ids, 25 ) as $chunk ) {
					$found = array_merge( $found, Capms_Cleanup::scan_unused( $chunk, $strict )['items'] );
				}
				$this->report( $found, 'unused file(s)' );

				if ( $delete && $found ) {
					WP_CLI::confirm( 'Delete these ' . count( $found ) . ' attachment(s)?', $assoc_args );
					$result = Capms_Cleanup::delete_unused( wp_list_pluck( $found, 'id' ), $strict, $keep );
					WP_CLI::success( sprintf( 'Deleted %1$d, skipped %2$d, freed %3$s.', count( $result['deleted'] ), count( $result['skipped'] ), size_format( $result['bytes'], 2 ) ) );
				}
				return;
			}

			if ( 'thumbnails' === $what ) {
				$found = array();
				foreach ( array_chunk( $ids, 25 ) as $chunk ) {
					$found = array_merge( $found, Capms_Cleanup::scan_thumbnails( $chunk )['items'] );
				}
				$this->report( $found, 'attachment(s) with unused thumbnail sizes' );

				if ( $delete && $found ) {
					WP_CLI::confirm( 'Delete the unused thumbnail files?', $assoc_args );
					$result = Capms_Cleanup::clean_thumbnails( wp_list_pluck( $found, 'id' ) );
					WP_CLI::success( sprintf( 'Deleted %1$d file(s), freed %2$s.', $result['files'], size_format( $result['bytes'], 2 ) ) );
				}
				return;
			}

			if ( 'duplicates' === $what ) {
				$this->duplicates( $ids, $delete, $keep, $assoc_args );
				return;
			}

			WP_CLI::error( 'Use: unused, duplicates or thumbnails.' );
		}

		/**
		 * Delete every backup of an original file.
		 *
		 * ## OPTIONS
		 *
		 * [--yes]
		 * : Do not ask for confirmation.
		 *
		 * ## EXAMPLES
		 *
		 *     wp capms purge-backups --yes
		 *
		 * @param array $args       Positional arguments.
		 * @param array $assoc_args Associative arguments.
		 * @return void
		 */
		public function purge_backups( $args, $assoc_args ) {
			unset( $args );
			WP_CLI::confirm( 'Delete all backups of original files? Restore will no longer be possible.', $assoc_args );
			$result = Capms_Backup::purge_all();
			WP_CLI::success( sprintf( 'Purged %1$d file(s), freed %2$s.', $result['files'], size_format( $result['bytes'], 2 ) ? size_format( $result['bytes'], 2 ) : '0 B' ) );
		}

		/**
		 * Duplicate scan: same size first, then MD5.
		 *
		 * @param int[] $ids        Attachment IDs.
		 * @param bool  $delete     Delete unused duplicates.
		 * @param bool  $keep       Keep a copy of deleted originals.
		 * @param array $assoc_args Command arguments.
		 * @return void
		 */
		private function duplicates( $ids, $delete, $keep, $assoc_args ) {
			$sizes = array();
			foreach ( array_chunk( $ids, 100 ) as $chunk ) {
				$sizes += Capms_Cleanup::scan_sizes( $chunk );
			}

			$by_size = array();
			foreach ( $sizes as $id => $bytes ) {
				$by_size[ $bytes ][] = $id;
			}

			$by_hash = array();
			foreach ( $by_size as $same ) {
				if ( count( $same ) < 2 ) {
					continue;
				}
				foreach ( Capms_Cleanup::hash_files( $same ) as $id => $hash ) {
					$by_hash[ $hash ][] = $id;
				}
			}

			$groups = array_values( array_filter( $by_hash, static function ( $members ) {
				return count( $members ) > 1;
			} ) );

			$described = Capms_Cleanup::describe_duplicate_groups( $groups );
			if ( ! $described ) {
				WP_CLI::success( 'No duplicate files found.' );
				return;
			}

			$to_delete = array();
			foreach ( $described as $number => $members ) {
				WP_CLI::log( sprintf( 'Group %d:', $number + 1 ) );
				// Keep the first one that is in use, or the oldest.
				$keeper = null;
				foreach ( $members as $member ) {
					if ( $member['used'] ) {
						$keeper = $member['id'];
						break;
					}
				}
				$keeper = null === $keeper ? $members[0]['id'] : $keeper;

				foreach ( $members as $member ) {
					WP_CLI::log( sprintf( '  #%1$d %2$s %3$s%4$s', $member['id'], $member['path'], size_format( $member['bytes'], 1 ), $member['used'] ? ' (in use)' : '' ) );
					if ( $member['id'] !== $keeper && ! $member['used'] ) {
						$to_delete[] = $member['id'];
					}
				}
			}

			WP_CLI::log( sprintf( '%d duplicate group(s); %d unused copy/copies can be deleted.', count( $described ), count( $to_delete ) ) );

			if ( $delete && $to_delete ) {
				WP_CLI::confirm( 'Delete the unused duplicate copies?', $assoc_args );
				$result = Capms_Cleanup::delete_unused( $to_delete, false, $keep );
				WP_CLI::success( sprintf( 'Deleted %1$d, skipped %2$d, freed %3$s.', count( $result['deleted'] ), count( $result['skipped'] ), size_format( $result['bytes'], 2 ) ) );
			}
		}

		/**
		 * Print a table of findings.
		 *
		 * @param array  $items Items.
		 * @param string $label What was found.
		 * @return void
		 */
		private function report( $items, $label ) {
			if ( ! $items ) {
				WP_CLI::success( 'Nothing found.' );
				return;
			}

			$total = 0;
			$rows  = array();
			foreach ( $items as $item ) {
				$total += (int) $item['bytes'];
				$rows[] = array(
					'ID'    => $item['id'],
					'File'  => $item['path'],
					'Size'  => size_format( $item['bytes'], 1 ),
				);
			}

			\WP_CLI\Utils\format_items( 'table', $rows, array( 'ID', 'File', 'Size' ) );
			WP_CLI::log( sprintf( '%1$d %2$s, %3$s in total.', count( $items ), $label, size_format( $total, 2 ) ) );
		}
	}

	WP_CLI::add_command( 'capms', 'Capms_CLI' );
}
