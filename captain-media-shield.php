<?php
/**
 * Plugin Name: Captain Media Shield
 * Description: All-in-one free Image & Video Optimizer, WebP/AVIF Converter, Video Compressor (WebM/Fast Start), Metadata Stripper, and Server Storage Saver for WordPress.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: dipakdodiya
 * Text Domain: captain-media-shield
 * Domain Path: /languages
 * License: GPLv3
 * License URI: https://opensource.org/licenses/GPL-3.0
 *
 * @package captain-media-shield
 */

/**
 * Exit if accessed directly.
 * */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CAPMS_VERSION', '1.0.0' );
define( 'CAPMS_FILE', __FILE__ );
define( 'CAPMS_URL', plugins_url( '/', __FILE__ ) );
define( 'CAPMS_PATH', plugin_dir_path( __FILE__ ) );

// Folder (inside wp-content/uploads) where untouched originals are kept
// before any optimization runs - restore and the retention cron both
// work off this single location.
define( 'CAPMS_BACKUP_DIR_NAME', 'captain-backups' );

require_once CAPMS_PATH . 'includes/class-capms-plugin-load.php';
