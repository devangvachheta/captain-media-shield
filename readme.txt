=== Captain Media Shield ===
Contributors: devangvachheta
Tags: image optimizer, webp, avif, media cleanup, unused media
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Optimize images and videos on your own server, then reclaim disk space: find unused media, duplicate files and leftover thumbnails. No external API.

== Description ==

Captain Media Shield optimizes the images and videos in your Media Library right on your own server, and then helps you **take back the storage** that years of uploads leave behind. There is no external API, no quota and no account: everything runs on your hosting.

What makes it different from a plain image optimizer:

* **Media Cleanup:** finds unused media, byte-for-byte duplicate files and thumbnail sizes left behind by old themes and plugins, and removes them only after you confirm.
* **Storage Report:** shows where your uploads space goes (by type, by year, largest files) and estimates what optimizing the rest would save.
* **Animated GIF to video:** serves heavy GIFs as small, muted, looping MP4/WebM videos.
* **Images and videos in one plugin**, processed in the background, with backups and one-click restore.
* **WP-CLI commands** for large sites and automation.

= Images =

* Creates WebP and AVIF copies of every JPG and PNG, including every thumbnail size. Your original file is never replaced.
* Adjustable compression quality (1-100).
* Removes EXIF, GPS, IPTC and XMP metadata (colour profile is kept).
* Automatically resizes oversized uploads (maximum width and height).
* Serves the best format to each visitor, using either a `<picture>` tag or `.htaccess` rewrite rules.
* Keeps a converted copy only when it is really smaller than the original.
* **Exclude rules:** skip folders, file patterns (for example `logos/*` or `*-original.png`) or specific attachment IDs.
* **Nginx rules:** a ready-to-copy Nginx snippet gives the same "same URL, best format" delivery as the `.htaccess` method.

= Videos (requires FFmpeg on the server) =

* H.264 compression with a maximum resolution (1080p or 720p) and audio bitrate options.
* "Fast Start" (moov atom first) so playback begins quickly.
* WebM (VP9 / Opus) companion files, added automatically to videos shown with the WordPress video shortcode and the Video block.
* Video metadata removal.
* **Poster images:** a lightweight JPEG frame is saved next to each video and used as its poster, so players show a picture instantly.
* **Animated GIF to video:** each animated GIF gets an MP4 (and WebM) copy and is shown as a muted, looping video, usually 80-95% lighter. The GIF stays as the fallback. Optional, off by default.
* Heavy work runs in the background through WP-Cron, so uploads stay fast.

= Backups and storage =

* The untouched original of every optimized file is kept in `wp-content/uploads/captain-ms-backups/`.
* Choose how long backups are kept: immediately deleted, 1 hour, 1 day, 7 days, 30 days or never.
* One-click "Restore Original" from the Media Library.
* "Purge All Backups Now" to free disk space.

= Media Cleanup and Storage Report =

* **Unused media:** every file is checked against post content, featured images, galleries, widgets, theme settings, page-builder data and custom fields. Anything that might be in use is left out. An optional stricter scan also lists files that are only "attached" to a post.
* **Duplicate files:** files are compared by size, then by a content fingerprint (MD5), so only identical copies are reported. A copy that is still in use cannot be deleted from the screen.
* **Unused thumbnails:** finds thumbnail files for image sizes your site no longer registers and that no content refers to. Original images are never touched.
* Nothing is deleted without your confirmation, usage is checked again right before each deletion, and deleted originals can be kept in `wp-content/uploads/captain-ms-backups/deleted/`.
* **Storage Report:** library size split into originals, thumbnails, next-gen copies and backups, plus size by file type, by upload year and the largest files.
* All scans run in small batches from your browser, so large libraries do not time out, and you can stop at any time.

= WP-CLI =

* `wp capms optimize [--ids=<ids>] [--type=<all|image|video>] [--retry-failed]`
* `wp capms status`
* `wp capms restore <id>...`
* `wp capms cleanup <unused|duplicates|thumbnails> [--strict] [--delete] [--no-copy] [--yes]`
* `wp capms purge-backups [--yes]`

= Multisite =

The plugin works per site. Network activation sets up every existing site, new sites are set up automatically, and uninstalling removes the data of every site.

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
* **Post meta:** `_capms_optimized` and `_capms_pending` on attachments, plus `_capms_hash` and `_capms_hash_sig` (a cached file fingerprint) after a duplicate scan.
* **Files:** `.webp`, `.avif` and `.webm` copies next to your originals, `.poster.jpg` poster images next to videos, `.mp4` / `.webm` copies next to converted GIFs, and the backup folder `wp-content/uploads/captain-ms-backups/` (with a `deleted/` sub folder if you keep copies of deleted media).
* **.htaccess:** only if you choose the `.htaccess` delivery method, a block marked "Captain Media Shield" is added to `wp-content/uploads/.htaccess`. It is removed when you switch method or deactivate the plugin.
* **Scheduled events (WP-Cron):** `capms_process_video_event` for background video processing, `capms_process_gif_event` for GIF conversion and `capms_backup_cleanup_event` for backup retention.
* **Server command:** when video optimization is on and FFmpeg is installed, the plugin runs FFmpeg through PHP `exec()`. The binary path is validated and every argument is escaped. If `exec()` is disabled, videos are simply skipped.
* **Admin screen:** the plugin does not hide or remove notices from WordPress or other plugins.
* **Deleting media:** only when you press a delete button in Media Cleanup and confirm it. Nothing is ever deleted automatically.

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

Nginx ignores `.htaccess` files, but you do not lose anything. Open **Images & Formats** and use **Nginx Rules** to copy a ready-made snippet for your Nginx configuration, or use the Picture tag method, which works on every server.

= How does Media Cleanup decide that a file is unused? =

It looks for the file in post content (including block and gallery data), featured images, WooCommerce galleries, widgets, theme settings, site icon and logo, term meta and custom fields. If any of these refer to the file, it is treated as in use and is never offered for deletion. Plugins that store media in their own tables can mark files as in use with the `capms_attachment_usage_reasons` filter.

= Is it safe to delete duplicate files? =

Only copies that are not used anywhere can be deleted from the screen. A duplicate that is still in use is marked "In use": replace it in your content with the copy you keep, then scan again.

= Could removing unused thumbnails break my site? =

Only sizes that your site does not register while you are in the admin are listed, and sizes referenced by content are skipped. A few themes register sizes only on the front end; review the list before deleting, and use any thumbnail regeneration tool if you ever need a size back.

= Do I need FFmpeg? =

Only for video optimization, poster images and GIF to video. Images work without it. If FFmpeg is not found, videos are skipped and the reason is shown in the Media Library.

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

= 0.1.0 =
* New: Media Cleanup - unused media finder, duplicate file finder and unused thumbnail cleaner.
* New: Storage Report with size by type, by year and the largest files.
* New: Animated GIF to MP4/WebM conversion.
* New: Video poster images.
* New: Exclude rules (folders, file patterns, attachment IDs).
* New: Nginx rules snippet for AVIF/WebP delivery.
* New: WP-CLI commands (`wp capms`).
* New: Multisite support (network activation, new sites, uninstall).
* Changed: notices from WordPress and other plugins are no longer hidden on the plugin screen.
* Changed: removed the unneeded `load_plugin_textdomain()` call (translations load automatically).

= 0.0.1 =
* Initial release.
