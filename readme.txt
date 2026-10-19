=== Captain Media Shield ===
Contributors: dipakdodiya
Tags: image optimizer, webp, avif, video compression, compress images
Requires at least: 6.0
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv3
License URI: https://opensource.org/licenses/GPL-3.0

All-in-one free Image & Video Optimizer, WebP/AVIF Converter, Video Compressor (WebM/Fast Start), Metadata Stripper, and Server Storage Saver.

== Description ==

Captain Media Shield optimizes every image and video right on your own server - no external API, no quota, no account.

**Images**

* WebP and AVIF conversion for the original and every thumbnail size
* Adjustable compression quality (1-100)
* Lossless EXIF / GPS / IPTC / XMP metadata stripping (colour profile kept)
* Auto-resize oversized uploads (max width / height)
* Delivery through `.htaccess` rewrites or `<picture>` tag replacement

**Videos (requires FFmpeg on the server)**

* H.264 compression with max resolution (1080p / 720p) and audio bitrate caps
* "Fast Start" (moov atom first) for instant web playback
* WebM (VP9 / Opus) companion files, added automatically to video players
* Video metadata stripping
* Heavy work runs in the background through WP-Cron

**Backups & storage**

* Untouched originals kept in `wp-content/uploads/captain-backups/`
* Scheduled backup cleanup (1 hour, 1 day, 7 days, 30 days, immediate or never)
* One-click "Restore Original" from the Media Library
* "Purge All Backups Now"

**Bulk optimizer & analytics**

* AJAX bulk optimizer for images and videos with pause / resume
* Storage saved, files processed, compression ratio
* Server health check: GD, Imagick, WebP/AVIF, FFmpeg, memory and upload limits

== Development ==

The admin screen is a React app built with `@wordpress/scripts`:

`npm install`
`npm run build`

== Changelog ==

= 1.0.0 =
* Initial release.
