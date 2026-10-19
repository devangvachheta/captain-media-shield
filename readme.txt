=== Captain Media Shield ===
Contributors: devangvachheta
Tags: image optimizer, webp, avif, compress images, video compression
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Free image and video optimizer. Converts images to WebP and AVIF, compresses videos, strips metadata and saves server storage. No external API.

== Description ==

Captain Media Shield optimizes the images and videos in your Media Library right on your own server. There is no external API, no quota and no account: everything runs on your hosting.

= Images =

* Creates WebP and AVIF copies of every JPG and PNG, including every thumbnail size. Your original file is never replaced.
* Adjustable compression quality (1-100).
* Removes EXIF, GPS, IPTC and XMP metadata (colour profile is kept).
* Automatically resizes oversized uploads (maximum width and height).
* Serves the best format to each visitor, using either a `<picture>` tag or `.htaccess` rewrite rules.
* Keeps a converted copy only when it is really smaller than the original.

= Videos (requires FFmpeg on the server) =

* H.264 compression with a maximum resolution (1080p or 720p) and audio bitrate options.
* "Fast Start" (moov atom first) so playback begins quickly.
* WebM (VP9 / Opus) companion files, added automatically to videos shown with the WordPress video shortcode and the Video block.
* Video metadata removal.
* Heavy work runs in the background through WP-Cron, so uploads stay fast.

= Backups and storage =

* The untouched original of every optimized file is kept in `wp-content/uploads/captain-ms-backups/`.
* Choose how long backups are kept: immediately deleted, 1 hour, 1 day, 7 days, 30 days or never.
* One-click "Restore Original" from the Media Library.
* "Purge All Backups Now" to free disk space.

= Bulk optimizer and analytics =

* Optimize your whole existing library in one run, one file per request so nothing times out, with pause and resume.
* See storage saved, files processed and the average size reduction.
* Server Health screen: GD, Imagick, WebP and AVIF support, FFmpeg, memory and upload limits.
* Built-in documentation that explains every feature.

= Where to find it =

After activation go to **Media -> Captain Media Shield**. The Media Library list view also gets a "Media Shield" column with the status of each file and Optimize / Restore links.

= What the plugin adds to your site =

For full transparency, this is everything Captain Media Shield creates or changes:

* **Database:** one custom table, `{prefix}capms_media`, with one row per processed file (sizes, status, backup location).
* **Options:** `capms_settings`, `capms_db_version` and `capms_last_cleanup`, plus a short-lived `capms_ffmpeg_path` transient.
* **Post meta:** `_capms_optimized` and `_capms_pending` on attachments.
* **Files:** `.webp`, `.avif` and `.webm` copies next to your originals, and the backup folder `wp-content/uploads/captain-ms-backups/`.
* **.htaccess:** only if you choose the `.htaccess` delivery method, a block marked "Captain Media Shield" is added to `wp-content/uploads/.htaccess`. It is removed when you switch method or deactivate the plugin.
* **Scheduled events (WP-Cron):** `capms_process_video_event` for background video processing and `capms_backup_cleanup_event` for backup retention.
* **Server command:** when video optimization is on and FFmpeg is installed, the plugin runs FFmpeg through PHP `exec()`. The binary path is validated and every argument is escaped. If `exec()` is disabled, videos are simply skipped.
* **Admin screen:** on the Captain Media Shield screen only, notices from other plugins are hidden so the app layout stays clean. Other admin pages are not affected.

= Privacy =

The plugin does not send any data anywhere and does not use cookies. All processing happens on your server. The admin screen only remembers your light/dark theme and sidebar choice in your own browser (localStorage); this is never sent to a server.

== External services ==

This plugin does not connect to any external service or third-party API.

== Installation ==

1. Upload the `captain-media-shield` folder to the `/wp-content/plugins/` directory, or install the plugin from the Plugins screen in WordPress.
2. Activate the plugin through the Plugins screen.
3. Go to **Media -> Captain Media Shield -> Server Health** and check that WebP (and AVIF, if you want it) is supported. For videos, FFmpeg must be installed.
4. Open **Images & Formats**, adjust the settings if needed and press Save.
5. Open **Bulk Optimizer** and start a run to optimize the files that are already in your Media Library. New uploads are optimized automatically.

== Frequently Asked Questions ==

= I converted my images but I cannot find any .webp files. Where are they? =

Converted files are saved next to the original with the format added to the end of the name, for example `photo.jpg` and `photo.jpg.webp`. Search for `.jpg.webp` in your uploads folder. The Media Library keeps showing the JPG because it is still the real attachment.

= Why do I not get any AVIF files? =

AVIF needs a server that can encode it: GD with AVIF support (PHP 8.1 or newer) or ImageMagick 7 with AVIF support. Check the Server Health screen. An AVIF file is also removed automatically when it is not smaller than the WebP file.

= What happens if I turn on both WebP and AVIF? =

Both copies are created. Visitors whose browser supports AVIF receive AVIF, other modern browsers receive WebP, and very old browsers receive the original file.

= My WooCommerce or Elementor images still load as JPG. =

The Picture tag method only covers images printed through standard WordPress content filters. Switch **WebP/AVIF Delivery Method** to `.htaccess` on Apache servers to cover every image on the site.

= Does the .htaccess method work on Nginx? =

No. Nginx ignores `.htaccess` files. Use the Picture tag method, or add an equivalent rule to your Nginx configuration.

= Do I need FFmpeg? =

Only for video optimization. Images work without it. If FFmpeg is not found, videos are skipped and the reason is shown in the Media Library.

= Why is my video still "Queued"? =

Videos are processed in the background by WP-Cron, which runs when your site receives visits. Load any page on the site or trigger `wp-cron.php`.

= Can I get my original files back? =

Yes, as long as backups are on and the backup has not been deleted. Use "Restore Original" in the Media Library list view. Be careful with the retention setting and "Purge All Backups Now": deleted backups cannot be restored.

= My uploads folder got bigger. Why? =

The originals are backed up in `wp-content/uploads/captain-ms-backups/`, and WebP/AVIF files are extra copies. Choose a shorter backup retention or purge the backups once you are happy with the results.

= What happens to my files when I uninstall the plugin? =

Settings, the statistics table and scheduled events are removed. Your media files, the converted WebP/AVIF/WebM copies and the backup folder are not deleted.

== Screenshots ==

1. Dashboard with savings summary and server environment.
2. Bulk Optimizer with live activity.
3. Images & Formats settings.
4. Backup & Retention settings.

== Source code ==

The admin screens are a React application. The compiled files in the `build/` folder are generated from the human-readable source in the `src/` folder of this plugin, using `@wordpress/scripts`.

The full source code, including the build tools, is also available on GitHub: https://github.com/devangvachheta/captain-media-shield

To rebuild them:

1. Run `npm install` in the plugin folder.
2. Run `npm run build`.

Dependencies are listed in `package.json`.

== Changelog ==

= 0.0.1 =
* Initial release.
