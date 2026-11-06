=== Captain Media Shield ===
Contributors: devangvachheta
Tags: image optimizer, webp converter, avif converter, media cleanup, speed optimization
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Optimize images and videos on your own server, then reclaim disk space: find unused media, duplicate files and leftover thumbnails. No external API.

== Description ==

<strong>Captain Media Shield</strong> is a comprehensive, on-server media optimization and storage reclaim suite for WordPress. Automatically convert images to lightweight Next Generation WebP and AVIF formats, compress video uploads with instant streaming (FastStart), and reclaim disk space by safely finding and removing unused media, byte-for-byte duplicate files, and leftover thumbnails.

Everything runs 100% on your own hosting server - no external APIs, no image credits, no third-party accounts, and zero monthly subscriptions.

[YouTube Tutorials](https://www.youtube.com/@captaininfokit) | [Free Support](https://wordpress.org/support/plugin/captain-media-shield)

<strong>🛡️ Why Choose Captain Media Shield?</strong>

* <strong>100% Free & Unlimited</strong> : No third-party API dependencies, no monthly quotas, and no subscription paywalls. Optimize thousands of images and videos without worrying about limits.
* <strong>Next Generation WebP & AVIF Formats</strong> : Generate ultra-compact WebP and AVIF copies for original images and every registered thumbnail size.
* <strong>Per-Image Custom Quality Override</strong> : Set global compression quality (1-100) or override quality for any individual image directly from the Media Library list view via the Quick Quality modal.
* <strong>Media Cleanup & Storage Saver</strong> : Safely detect and clean orphaned media, byte-for-byte MD5 duplicate files, and leftover legacy thumbnails from retired themes.
* <strong>Storage Diagnostics & Report</strong> : Visual breakdown of your entire uploads directory by file category, file extension, upload year, and largest files.
* <strong>Video Compression & Streaming</strong> : H.264 FastStart streaming, WebM companions, automatic poster frames, and animated GIF to video conversion.
* <strong>Safe Backups & 1-Click Restore</strong> : Untouched original files are preserved with configurable retention periods and 1-click restore.
* <strong>Modern Tabbed Navigation</strong> : Fast, organized tabbed settings interface that eliminates long vertical scrolling.
* <strong>Top Header Quick Actions</strong> : Convenient Save Changes and Reset to Defaults buttons placed right in the header for quick access.
* <strong>WP-CLI Automation</strong> : Complete headless command-line interface for enterprise sites and automated background workflows.

<strong>📸 Next Generation Image Optimization & Delivery</strong>

* <strong>Automated Next Generation Conversion</strong> : Converts JPEG and PNG uploads to high-efficiency WebP and AVIF copies.
* <strong>Compression Quality Slider</strong> : Choose your default quality sweet spot (1-100) with recommended presets (Balanced, Aggressive, Near-lossless).
* <strong>Media Library Quick Quality Modal</strong> : Click "Quick Quality" on any list-view item to adjust quality (e.g. 40-50% for heavy graphics) and re-optimize instantly.
* <strong>Privacy & EXIF Metadata Removal</strong> : Losslessly strips camera EXIF data, GPS coordinates, IPTC, and editing history while preserving colour profiles.
* <strong>Auto-Resize Large Uploads</strong> : Automatically scales down oversized camera images (e.g. 4000px+) before thumbnails are generated.
* <strong>Flexible Delivery Methods</strong> : Serve Next Generation formats via high-speed <code>.htaccess</code> rewrite rules (Apache/LiteSpeed) or HTML <code>&lt;picture&gt;</code> tag replacement.
* <strong>Nginx Configuration Generator</strong> : Ready-to-copy server configuration snippet for seamless Next Generation delivery on Nginx servers.
* <strong>Smart Exclude Rules</strong> : Exclude folders (e.g. <code>logos/*</code>), filename patterns, or specific attachment IDs from optimization.

<strong>🎬 Video Optimization & Streaming (FFmpeg)</strong>

* <strong>H.264 Video Compression</strong> : Re-encodes uploaded MP4/MOV videos to space-saving H.264 in place.
* <strong>Moov Atom "Fast Start"</strong> : Relocates video metadata to the beginning of the file so visitors can stream videos immediately without waiting for full download.
* <strong>WebM Companion Files</strong> : Automatically generates modern VP9/Opus WebM copies for HTML5 video players and the WordPress video block.
* <strong>Automatic Video Poster Frames</strong> : Saves a lightweight JPEG frame next to each video for an instant preview instead of a black box.
* <strong>Animated GIF to Video Conversion</strong> : Converts heavy animated GIFs into lightweight looping MP4/WebM videos (80-95% file size reduction).
* <strong>Resolution & Bitrate Controls</strong> : Cap video resolution (1080p, 720p, Keep Original) and adjust audio compression (128 kbps, 96 kbps).
* <strong>Background WP-Cron Processing</strong> : Video encoding runs asynchronously in the background so dashboard uploads stay quick and responsive.

<strong>🧹 Deep Media Cleanup & Duplicate Detector</strong>

* <strong>Unused Media Finder</strong> : Deep scans post content, Gutenberg blocks, featured images, WooCommerce galleries, widgets, custom post types, and custom fields. Anything potentially in use is protected.
* <strong>Byte-for-Byte Duplicate Detector</strong> : Compares files by exact size and MD5 hash fingerprint. Duplicates in use are safely locked from deletion.
* <strong>Orphan Thumbnail Cleaner</strong> : Scans and removes old thumbnail sizes registered by retired themes or uninstalled plugins.
* <strong>Zero-Risk Confirmation</strong> : Nothing is ever deleted automatically. Deletions require explicit confirmation, and safety backup copies can be retained.
* <strong>Interactive Storage Report</strong> : View storage distribution across original files, thumbnails, Next Generation copies, and backups.

<strong>💾 Backups & Safe Rollback</strong>

* <strong>Zero-Risk Backups</strong> : Untouched original files are stored in <code>wp-content/uploads/captain-ms-backups/</code>.
* <strong>Configurable Retention</strong> : Set how long backups are kept: immediately delete, 1 hour, 1 day, 7 days, 30 days, or indefinitely.
* <strong>1-Click Original Restore</strong> : Restore any original image or video directly from the Media Library list view or attachment details.
* <strong>Disk Purge</strong> : "Purge All Backups Now" button lets you free up backup storage once you are completely satisfied with results.

<strong>⚡ WordPress Media Library Integration</strong>

* <strong>Media Shield Status Column</strong> : Displays live optimization status (Optimized, Not Optimized, Processing), percentage saved, and active format badge (WebP/AVIF).
* <strong>Inline Quick Actions</strong> : Re-optimize, adjust quality via Quick Quality popup, or restore originals with one click without leaving the page.

<strong>Perfect for:</strong>

* <strong>Content Creators & Bloggers</strong> who want lightning-fast page loading and better Google Core Web Vitals (LCP).
* <strong>WooCommerce Store Owners</strong> who need thousands of product images compressed without losing visual sharpness.
* <strong>Photographers & Portfolio Sites</strong> wanting custom per-image compression quality for sensitive portfolio showcases.
* <strong>Agencies & Developers</strong> managing client websites with strict disk space limits and hosting storage quotas.
* <strong>High-Traffic Media Publishers</strong> looking to cut bandwidth costs with WebP/AVIF and FastStart video streaming.

== Key Features ==

* 🖼️ <strong>WebP & AVIF Conversion</strong> : Automated Next Generation image format generation for smaller, faster pages
* 🎚️ <strong>Per-Image Quality Override</strong> : Set custom compression levels per image via Quick Quality popup or global slider
* 🧹 <strong>Deep Media Cleanup</strong> : Find and safely remove orphaned media, duplicate files, and obsolete thumbnails
* 📊 <strong>Storage Report & Analytics</strong> : Detailed visual breakdown of uploads by type, year, and largest files
* 🎥 <strong>Video Compression & Streaming</strong> : H.264 FastStart streaming, WebM companion generation, and resolution capping
* 🖼️ <strong>Video Poster Frames</strong> : Instant video thumbnail generation for player previews
* 🎞️ <strong>Animated GIF to Video</strong> : 80-95% lighter looping MP4/WebM conversion for animated GIFs
* 🛡️ <strong>Safe Backups & 1-Click Restore</strong> : Zero-loss original file preservation with flexible retention
* 🌐 <strong>Multiple Delivery Methods</strong> : Support for Apache/LiteSpeed <code>.htaccess</code>, HTML <code>&lt;picture&gt;</code>, and Nginx rules
* 🚫 <strong>Smart Exclude Rules</strong> : Skip folders, filename wildcards, or specific attachment IDs
* 📑 <strong>Organized Tabbed Navigation</strong> : Clean tabbed settings interface that eliminates vertical scrolling
* 🔝 <strong>Header Save & Reset Actions</strong> : Top-right header actions giving maximum vertical room for content
* 🖥️ <strong>WP-CLI Integration</strong> : Full command-line support for automated workflows and large libraries
* 🩺 <strong>Server Health Screen</strong> : Real-time diagnostic check for GD, Imagick, WebP, AVIF, and FFmpeg
* 🌐 <strong>Multisite Compatible</strong> : Network activation and subsite management support
* 🔒 <strong>100% Privacy Focused</strong> : Local server processing with no telemetry, external calls, or tracking

== Supported Formats ==

* <strong>Input Image Formats</strong> : JPEG, JPG, PNG, GIF
* <strong>Output Next Generation Image Formats</strong> : WebP, AVIF
* <strong>Input Video Formats</strong> : MP4, MOV, M4V, AVI, MKV, WMV (requires FFmpeg)
* <strong>Output Video Formats</strong> : H.264 MP4 (FastStart streamable), WebM (VP9 / Opus)

== YouTube Tutorials ==

* [Captain InfoKit - Official YouTube Channel](https://www.youtube.com/@captaininfokit) : Subscribe to our official YouTube channel for step-by-step video tutorials, media optimization walkthroughs, performance tips, and WordPress server setup guides.

== 🌟 OUR PRODUCTS ==

<strong>[🥇 Captain Feed for YouTube](https://wordpress.org/plugins/captain-feed-for-youtube/)</strong> : Display customizable YouTube feeds for channels, playlists, Shorts, search results, and individual videos.

<strong>[🥇 Captain Advance Filter](https://wordpress.org/plugins/captain-advance-filter/)</strong> : Create powerful filters for WordPress with advanced filtering options, flexible layouts, and easy customization.

<strong>[🥇 Captain Social Review](https://wordpress.org/plugins/captain-social-review)</strong> : Display reviews and testimonials from multiple platforms with beautiful layouts, filtering options, and easy customization.

<strong>[🥇 Captain Widgets Kit](https://wordpress.org/plugins/captain-widgets-kit)</strong> : Extend your WordPress website with a collection of powerful widgets and elements designed to enhance your website building experience.

<strong>[🥇 Captain Funnel](https://wordpress.org/plugins/captain-funnel)</strong> : Automate WhatsApp messages for WooCommerce orders and form submissions using the official WhatsApp Cloud API by Meta.

<strong>[🥇 Captain Live Chat](https://wordpress.org/plugins/captain-live-chat)</strong> : Self-hosted live chat for WordPress with an AI agent, canned replies and full conversation history - no monthly subscription.

== Installation ==

1. Upload the plugin files to the <code>/wp-content/plugins/captain-media-shield</code> directory, or install directly through the WordPress <strong>Plugins</strong> screen.
2. Activate the plugin from the <strong>Plugins</strong> screen.
3. Go to <strong>Media -> Captain Media Shield -> Server Health</strong> to verify your server environment (GD/Imagick WebP/AVIF support and FFmpeg).
4. Open <strong>Images & Formats</strong> to configure your desired format settings, compression quality, and delivery method.
5. Open <strong>Bulk Optimizer</strong> to compress your existing Media Library in batch, or let new uploads optimize automatically.

== Usage Guide ==

1. <strong>Configure Image Settings</strong> : Go to <strong>Images & Formats</strong> and select your preferred compression quality (75-80% is recommended). Enable WebP and AVIF.
2. <strong>Choose Delivery Method</strong> : Select <code>.htaccess Rewrites</code> (fastest for Apache/LiteSpeed) or <code>&lt;picture&gt; tag replacement</code> (works on all servers).
3. <strong>Run Bulk Optimizer</strong> : If you have existing uploads, navigate to <strong>Bulk Optimizer</strong> and click "Start Optimization". The progress bar will update in real time.
4. <strong>Manage Single Images</strong> : In <strong>Media -> Library</strong> (list view), use the "Quick Quality" button in the Media Shield column to override quality for any image.
5. <strong>Reclaim Disk Space</strong> : Go to <strong>Media Cleanup</strong> to scan for unused files, duplicates, and old thumbnail sizes, then safely delete what you don't need.

== Frequently Asked Questions ==

= Can I set different compression quality for specific images? =

Yes! While the global compression quality slider sets the default quality for all uploads (recommended: 75-80%), you can override quality for any individual image directly in the Media Library list view via the <strong>Quick Quality</strong> modal or in the attachment edit screen. You can set aggressive compression (e.g. 40-50%) for heavy banner graphics or near-lossless (90-95%) for sensitive photography.

= I converted my images but I cannot find any .webp files. Where are they? =

Converted files are saved directly in your uploads directory alongside the original files with the new extension appended, for example <code>photo.jpg.webp</code> and <code>photo.jpg.avif</code>. The WordPress Media Library continues to reference the original filename while modern browsers automatically receive the Next Generation format.

= Why do I not get any AVIF files? =

AVIF generation requires PHP GD with AVIF support (PHP 8.1+) or ImageMagick 7+ with AVIF delegates compiled. Check the Server Health tab in Captain Media Shield to see your server's status. AVIF copies are also automatically discarded if they do not result in a smaller file size than the WebP version.

= What happens if I enable both WebP and AVIF? =

Both Next Generation copies are generated. Visitors with AVIF-compatible browsers receive the ultra-compact AVIF file, other modern browsers receive WebP, and older legacy browsers fall back to the original JPG/PNG.

= My WooCommerce or Elementor images still load as JPG. =

The Picture tag method filters standard WordPress post content and featured images. To serve Next Generation formats across all theme elements, sliders, Elementor widgets, and WooCommerce store templates, select the <code>.htaccess Rewrites</code> delivery method in <strong>Images & Formats -> Delivery & Server</strong>.

= Does the .htaccess method work on Nginx? =

Nginx does not read <code>.htaccess</code> files. However, Captain Media Shield includes a built-in <strong>Nginx Rules</strong> generator in <strong>Images & Formats -> Delivery & Server</strong>. Simply copy the snippet into your Nginx server configuration block and reload Nginx, or use the HTML <code>&lt;picture&gt;</code> tag method which works on all web servers.

= How does Media Cleanup decide that a file is unused? =

The scanner searches post and page content, Gutenberg blocks, featured images, WooCommerce gallery arrays, widgets, site icons/logos, custom taxonomies, and custom post meta. If any reference exists, the file is tagged as in use. Third-party plugins can register custom usage checks using the <code>capms_attachment_usage_reasons</code> filter.

= Is it safe to delete duplicate files? =

Yes. Only copies that are confirmed to have zero active usages can be deleted. If a duplicate is currently referenced in published content, the system marks it as "In Use" and prevents deletion until you replace the reference.

= Do I need FFmpeg installed? =

FFmpeg is only required for video compression (H.264), WebM generation, automatic video poster frames, and animated GIF to video conversion. All image optimization, WebP/AVIF generation, and Media Cleanup features function completely without FFmpeg.

= Can I restore my original files? =

Yes! As long as backups are enabled and within your configured retention window, you can restore original files with one click using the <strong>Restore Original</strong> button in the Media Library list view or Bulk Optimizer.

= Will optimizing images affect my SEO ranking? =

Yes, in a positive way! By serving WebP/AVIF and compressing large images, your page loading speed and Google Core Web Vitals (specifically Largest Contentful Paint - LCP) improve significantly, which is a confirmed ranking factor.

= What happens when I deactivate or uninstall the plugin? =

Upon deactivation or uninstallation, the plugin cleans up its database tables and scheduled events. Your original media files, converted Next Generation copies, and backups remain completely untouched on your server unless you choose to purge them.

== Screenshots ==

1. Analytics & Server Health Dashboard: Visual storage savings overview, compression ratio, active Next Generation formats, and server environment status.
2. Bulk Optimizer in Action: One-click batch processing for your existing media library with real-time progress tracking, pause/resume, and live activity log.
3. Next Generation Images & Formats: Tabbed settings for automated WebP/AVIF generation, compression quality controls, EXIF metadata stripping, auto-resizing, and delivery options.
4. Deep Media Cleanup & Duplicate Detector: Scan and safely reclaim disk space from unused orphaned media, byte-for-byte MD5 duplicate files, and leftover thumbnails.
5. Video & Streaming Compression: Tabbed FFmpeg configuration, H.264 FastStart streaming, WebM companion generation, automatic video poster frames, and animated GIF to video conversion.
6. WordPress Media Library Integration: Compact native list-view controls with Quick Quality popup, real-time savings metrics, format badges, and 1-click restore.

== Changelog ==

= 1.0.2 (06/11/2026) =

* New: Media Limit Bypass : Automatically resizes oversized image uploads (exceeding limits like 2 MB) directly in-browser for seamless WordPress uploads.
* New: Server Limit Booster Guide : Interactive popup modal with quick Apache/htaccess and php.ini directives to boost upload limit, including WAMP/local server quick steps.
* New: Front-End Admin Bar Click Protection : Prevents accidental page redirects when hovering over the Media Shield top admin bar node on front-end pages.
* Improve: Bulk Media Optimizer Celebratory UI : Re-engineered bulk optimizer completion state with brand blue styling, celebratory badge, and high-contrast green progress bar.
* Improve: Single Attachment Edit Layout : Optimized single media edit page (`post.php?action=edit`) to render spacious, comfortable full-width card controls while preserving compact sidebar display in modal view.
* Fix: Prevent plupload prototype collision and optimize mutation observer on WordPress upload screens.
* Fix: Minor UI polish, responsive layout refinements, and code stability enhancements.

= 1.0.1 (04/11/2026) =

* New: Page Media Inspector : Added a live Page Media Inspector directly inside the top WordPress Admin Bar on front-end pages.
* New: Live Media Detection : Real-time scanning and classification of images on the current page (Total Images, Next Generation WebP/AVIF, and Original formats).
* New: 1-Click Page Optimizer : Quick action button in the Admin Bar dropdown to optimize all detected unoptimized images on the live page in one click.
* New: Delivery Status Indicator : Lightweight live status dot (🟢 All Next-Gen, 🟡 Needs Optimization) in the top toolbar with interactive tooltip.
* New: Dedicated Settings Page : Added a new Settings page (#/settings) under Extra Options for managing toolbar integration and data retention.
* New: Admin Bar Integration Toggle : Configurable on/off option to enable or disable the WordPress Admin Bar shortcut.
* New: Plugin Data Retention Controls : Added "Preserve settings if plugin is removed" and "Clear all data on uninstall" options to give site owners full control over database retention.
* Improve: Terminology update : Replaced legacy "Next-Gen" with "Next Generation" across all UI labels, settings, storage reports, and documentation.
* Improve: Top Header Save Actions : Relocated "Save Changes" and "Reset to Defaults" to the top-right header for faster access and a spacious dashboard layout.
* Improve: Settings Navigation : Enhanced tabbed settings transitions on Images & Formats and Video & Streaming pages.
* Improve: Admin Bar Design & Alignment : Revamped the Page Media Inspector card with a sleek glassmorphic container, balanced 15px flex layout, and perfectly centered toolbar icon.
* Fix: Dark Mode icons : Unified clean white icons for documentation and community cards on the Help & Support page in dark mode.
* Fix: Minor styling refinements, line-height normalization, and responsive layout adjustments across light and dark themes.
* Fix: Minor bug fixes and overall improvements for better stability and performance.

= 1.0.0 (03/11/2026) =

* Initial release.
* New: Automated conversion : Automated Next Generation image conversion (WebP and AVIF) with lossless visual quality retention.
* New: Per-image custom compression : Per-image custom compression quality override and inline Quick Quality modal in Media Library list view.
* New: Modern tabbed navigation : Modern tabbed navigation on Images & Formats and Video & Streaming settings pages to eliminate page scrolling.
* New: Top-right header actions : Top-right header actions with "Save Changes", "Reset to Defaults", and status notifications.
* New: Deep Media Cleanup : Deep Media Cleanup suite - scan and remove unused media, duplicate files (MD5 hash), and obsolete thumbnails.
* New: Interactive Storage Report : Interactive Storage Report with space breakdown by file type, upload year, and largest files.
* New: Video Optimization : Video Optimization with H.264 compression, FastStart streaming (moov atom first), and WebM companions.
* New: Automatic video poster : Automatic video poster image frame generation.
* New: Animated GIF conversion : Animated GIF to MP4/WebM conversion (80-95% lighter looping video).
* New: Safe original backups : Safe original backups in wp-content/uploads/captain-ms-backups/ with customizable retention periods.
* New: One-click "Restore Original" : One-click "Restore Original" from Media Library list view and attachment screens.
* New: Flexible delivery methods : Flexible delivery methods: Apache/LiteSpeed .htaccess rewrite rules and HTML <picture> tag replacement.
* New: Nginx rewrite rules : Nginx rewrite rules snippet generator for fast server-level delivery.
* New: Exclude rules : Exclude rules for upload folders, filename wildcards, and specific attachment IDs.
* New: Bulk Optimizer : Bulk Optimizer with real-time progress tracking, pause/resume, and activity log.
* New: Server Health diagnostic : Server Health diagnostic screen checking GD, Imagick, WebP, AVIF, and FFmpeg environment.
* New: Extra Options menu : Extra Options menu with dedicated Help & Support center (#/help) and Our Products showcase (#/our-products).
* New: Full WP-CLI commands : Full WP-CLI commands suite (wp capms).
* New: Comprehensive WordPress Multisite : Comprehensive WordPress Multisite (WPMU) support.

== Upgrade Notice ==

= 1.0.2 =
Version 1.0.2 introduces the in-browser Media Upload Rescue Assistant for oversized images, Server Limit Booster guide, improved Bulk Optimizer completion screen, and single attachment edit layout improvements.

= 1.0.1 =
Version 1.0.1 introduces the live Page Media Inspector in the WordPress Admin Bar, 1-click page image optimization, dedicated Settings page with data retention controls, Next Generation terminology standardization, and UI improvements.
