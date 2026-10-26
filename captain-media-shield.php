<?php
/**
 * Plugin Name: Captain Media Shield
 * Description: All-in-one free Image & Video Optimizer, WebP/AVIF Converter, Video Compressor (WebM/Fast Start), Metadata Stripper, and Server Storage Saver for WordPress.
 * Version: 0.1.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: devangvachheta
 * Author URI: https://profiles.wordpress.org/devangvachheta/
 * Text Domain: captain-media-shield
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package captain-media-shield
 */

/**
 * Exit if accessed directly.
 * */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CAPMS_VERSION', '0.1.0' );
define( 'CAPMS_FILE', __FILE__ );
define( 'CAPMS_URL', plugins_url( '/', __FILE__ ) );
define( 'CAPMS_PATH', plugin_dir_path( __FILE__ ) );

// Folder (inside wp-content/uploads) where untouched originals are kept
// before any optimization runs - restore and the retention cron both
// work off this single location.
define( 'CAPMS_BACKUP_DIR_NAME', 'captain-ms-backups' );

// Folder name used before the rename - kept only so existing backups are
// moved across automatically (see Capms_Backup::get_root()).
define( 'CAPMS_LEGACY_BACKUP_DIR_NAME', 'captain-backups' );

require_once CAPMS_PATH . 'includes/class-capms-plugin-load.php';
