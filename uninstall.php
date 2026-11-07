<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * Removes the plugin's options, log table, transients and cron events.
 * Media files are never touched here: optimized files and the
 * WebP/AVIF/WebM copies stay valid, and any originals still in
 * uploads/captain-ms-backups/ are left for the site owner to keep or delete.
 *
 * @since      0.0.1
 * @package captain-media-shield
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

// Read settings to check user's uninstall preferences.
$capms_settings     = get_option( 'capms_settings', array() );
$clear_on_uninstall = ! empty( $capms_settings['clear_on_uninstall'] );
$preserve_settings  = ! empty( $capms_settings['preserve_settings'] );

// If preserve is on, or clear on uninstall is off, keep all data safe and do not wipe database.
if ( $preserve_settings || ! $clear_on_uninstall ) {
	return;
}

if ( ! function_exists( 'capms_uninstall_site' ) ) {
	/**
	 * Remove everything this plugin stored for the current site.
	 *
	 * @return void
	 */
	function capms_uninstall_site() {
		global $wpdb;

		// 1. Drop the log table.
		$capms_table = $wpdb->prefix . 'capms_media';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.SchemaChange
		$wpdb->query( "DROP TABLE IF EXISTS {$capms_table}" );

		// 2. Options and transients.
		delete_option( 'capms_settings' );
		delete_option( 'capms_db_version' );
		delete_option( 'capms_last_cleanup' );
		delete_transient( 'capms_ffmpeg_path' );

		// 3. Post meta.
		delete_post_meta_by_key( '_capms_optimized' );
		delete_post_meta_by_key( '_capms_pending' );
		delete_post_meta_by_key( '_capms_hash' );
		delete_post_meta_by_key( '_capms_hash_sig' );
		delete_post_meta_by_key( '_capms_custom_quality' );

		// 4. Server configuration blocks cleanup.
		$htaccess_file = ABSPATH . '.htaccess';
		if ( file_exists( $htaccess_file ) && is_writable( $htaccess_file ) ) {
			$content = (string) @file_get_contents( $htaccess_file );
			if ( false !== strpos( $content, '# BEGIN Captain Media Shield' ) ) {
				$content = preg_replace( '/\s*# BEGIN Captain Media Shield.*?# END Captain Media Shield\s*/s', "\n", $content );
				@file_put_contents( $htaccess_file, $content );
			}
		}
		$user_ini = ABSPATH . '.user.ini';
		if ( file_exists( $user_ini ) && is_writable( $user_ini ) ) {
			$ini_content = (string) @file_get_contents( $user_ini );
			if ( false !== strpos( $ini_content, '; BEGIN Captain Media Shield' ) ) {
				$ini_content = preg_replace( '/\s*; BEGIN Captain Media Shield.*?; END Captain Media Shield\s*/s', "\n", $ini_content );
				@file_put_contents( $user_ini, $ini_content );
			}
		}

		// 5. Cron.
		wp_clear_scheduled_hook( 'capms_backup_cleanup_event' );
		wp_clear_scheduled_hook( 'capms_process_video_event' );
		wp_clear_scheduled_hook( 'capms_process_gif_event' );
	}
}

if ( is_multisite() ) {
	foreach ( get_sites( array( 'fields' => 'ids', 'number' => 0 ) ) as $capms_blog_id ) {
		switch_to_blog( $capms_blog_id );
		capms_uninstall_site();
		restore_current_blog();
	}
} else {
	capms_uninstall_site();
}
