import React from 'react';
import { __ } from '@wordpress/i18n';
import { DocArticle, DocSection, DocSteps, DocList, DocNote, DocCode, DocTable, DocDivider } from './doc_kit.jsx';

const T = 'captain-media-shield';

export const Overview = () => (
    <DocArticle
        badge={ __( 'Getting Started', T ) }
        title={ __( 'What Captain Media Shield Does', T ) }
        intro={ __( 'Captain Media Shield optimizes the images and videos in your Media Library on your own server. No external API or account is needed: files are resized, compressed, converted and delivered by your site.', T ) }
    >
        <DocSection title={ __( 'What you get', T ) }>
            <DocList items={ [
                { term: __( 'Image optimization', T ), text: __( 'Large uploads are resized, recompressed at your quality setting and cleaned of EXIF and GPS data.', T ) },
                { term: __( 'WebP and AVIF', T ), text: __( 'Smaller next-generation copies of every JPG and PNG, including every thumbnail size.', T ) },
                { term: __( 'Video optimization', T ), text: __( 'H.264 compression, a WebM companion and fast-start streaming, processed in the background with FFmpeg.', T ) },
                { term: __( 'Smart delivery', T ), text: __( 'Each visitor’s browser receives the smallest format it supports.', T ) },
                { term: __( 'Backups', T ), text: __( 'The untouched original of every optimized file is kept, so any change can be undone.', T ) },
                { term: __( 'Bulk Optimizer', T ), text: __( 'Optimizes the files that were already in your library before you installed the plugin.', T ) },
                { term: __( 'Analytics and Server Health', T ), text: __( 'See how much space you saved and whether your server has everything it needs.', T ) },
            ] } />
        </DocSection>

        <DocSection title={ __( 'Where to find each screen', T ) }>
            <DocTable
                head={ [ __( 'Screen', T ), __( 'What it is for', T ) ] }
                rows={ [
                    [ __( 'Dashboard', T ), __( 'Savings summary, recent activity and a short server report.', T ) ],
                    [ __( 'Bulk Optimizer', T ), __( 'Optimize the whole existing library in one run.', T ) ],
                    [ __( 'Images & Formats', T ), __( 'Quality, resize, WebP, AVIF and delivery method.', T ) ],
                    [ __( 'Video & Streaming', T ), __( 'Compression, WebM, fast start, resolution, audio and FFmpeg path.', T ) ],
                    [ __( 'Backup & Retention', T ), __( 'How long originals are kept, purge and restore.', T ) ],
                    [ __( 'Server Health', T ), __( 'Live checks of image engines, FFmpeg, memory and folders.', T ) ],
                    [ __( 'Documentation', T ), __( 'This guide.', T ) ],
                ] }
            />
            <DocNote type="info">{ __( 'In the WordPress menu the plugin lives under Media → Captain Media Shield. Every screen, including this documentation, is in the plugin’s own sidebar.', T ) }</DocNote>
        </DocSection>

        <DocSection title={ __( 'Quick start (5 minutes)', T ) }>
            <DocSteps steps={ [
                { title: __( 'Open Server Health', T ), text: __( 'Make sure GD or Imagick supports WebP. If you want AVIF, check the AVIF line too. For videos, FFmpeg must show as found.', T ) },
                { title: __( 'Set your image options', T ), text: __( 'Open Images & Formats. Keep the defaults (quality 80, resize to 1920 px) or adjust them, then press Save.', T ) },
                { title: __( 'Run the Bulk Optimizer', T ), text: __( 'Open Bulk Optimizer and start a run so existing media is processed. New uploads are optimized automatically from now on.', T ) },
                { title: __( 'Check the result on your site', T ), text: __( 'Open a page, go to DevTools → Network → Img and confirm the images load as webp or avif.', T ) },
            ] } />
        </DocSection>
    </DocArticle>
);

export const Dashboard = () => (
    <DocArticle
        badge={ __( 'Dashboard', T ) }
        title={ __( 'Understanding the Dashboard', T ) }
        intro={ __( 'The Dashboard (titled “Analytics & Server Health”) shows what the plugin has saved on your server so far. Use Refresh to reload the numbers.', T ) }
    >
        <DocSection title={ __( 'Top summary', T ) }>
            <DocList items={ [
                { term: __( 'Saved space', T ), text: __( 'Total size before and after optimization, with the number of images and videos processed.', T ) },
                { term: __( 'Average size reduction', T ), text: __( 'The average percentage saved across processed files.', T ) },
                { term: __( 'Backups', T ), text: __( 'How many original files are currently stored and how much disk they use.', T ) },
                { term: __( 'Not optimized yet', T ), text: __( 'If files in your library are still unprocessed, a notice offers a shortcut to the Bulk Optimizer.', T ) },
            ] } />
        </DocSection>

        <DocSection title={ __( 'Images and Videos cards', T ) }>
            <DocTable
                head={ [ __( 'Card value', T ), __( 'Meaning', T ) ] }
                rows={ [
                    [ __( 'Optimized', T ), __( 'Files processed successfully.', T ) ],
                    [ __( 'Saved / Reduction', T ), __( 'Bytes saved and the percentage, measured against the original.', T ) ],
                    [ __( 'WebP versions / AVIF versions', T ), __( 'How many converted copies exist.', T ) ],
                    [ __( 'Next-gen size', T ), __( 'Total size of the WebP and AVIF copies.', T ) ],
                    [ __( 'WebM versions', T ), __( 'How many videos have a WebM companion.', T ) ],
                    [ __( 'Queued', T ), __( 'Videos waiting for the background job.', T ) ],
                    [ __( 'Skipped / Failed', T ), __( 'Files that could not or did not need to be processed. See the message on the file for the reason.', T ) ],
                ] }
            />
        </DocSection>

        <DocSection title={ __( 'Recent Activity and Server Environment', T ) }>
            <p className="capms-doc-text">{ __( 'Recent Activity lists the latest processed files with their before and after size. The Server Environment box shows WebP support, AVIF support, FFmpeg, the PHP memory limit and the maximum upload size. “Full report” opens Server Health.', T ) }</p>
        </DocSection>
    </DocArticle>
);

export const Images = () => (
    <DocArticle
        badge={ __( 'Images', T ) }
        title={ __( 'Images & Formats Settings', T ) }
        intro={ __( 'These settings control how every JPG and PNG is handled when it is uploaded and when it is bulk optimized. Press Save after changing anything.', T ) }
    >
        <DocTable
            head={ [ __( 'Setting', T ), __( 'What it does', T ) ] }
            rows={ [
                [ __( 'Optimize images on upload', T ), __( 'Runs the whole pipeline automatically for every new upload. Turn it off if you only want to use the Bulk Optimizer.', T ) ],
                [ __( 'Enable WebP Conversion', T ), __( 'Creates a .webp copy of each image and thumbnail.', T ) ],
                [ __( 'Enable AVIF Conversion', T ), __( 'Creates an .avif copy. Disabled with a “Not supported by server” label when your server cannot encode AVIF.', T ) ],
                [ __( 'Image Quality Setting', T ), __( 'From 1 to 100. Default 80. 75 to 85 is a good balance for photos. Lower means a smaller file.', T ) ],
                [ __( 'Strip EXIF & GPS Metadata', T ), __( 'Removes camera data and location from JPG and PNG files. Saves space and protects privacy.', T ) ],
                [ __( 'Auto-Resize Large Image Uploads', T ), __( 'Shrinks images larger than the maximum dimensions below.', T ) ],
                [ __( 'Maximum dimensions', T ), __( 'Width and height limit. Default 1920 × 1920. Allowed range 320 to 10000. The image keeps its proportions.', T ) ],
                [ __( 'WebP/AVIF Delivery Method', T ), __( 'Picture tag or .htaccess. See the Delivery guide.', T ) ],
            ] }
        />
        <DocNote type="tip">{ __( 'Changing quality or size only affects files processed from now on. To apply it to existing media, use the Bulk Optimizer.', T ) }</DocNote>
        <DocNote type="info">{ __( 'Only JPEG and PNG images are processed. Other types, such as GIF and SVG, are left untouched.', T ) }</DocNote>
    </DocArticle>
);

export const WebpAvif = () => (
    <DocArticle
        badge={ __( 'Formats', T ) }
        title={ __( 'How WebP and AVIF Work', T ) }
        intro={ __( 'WebP and AVIF are modern image formats that are much smaller than JPG at similar quality. The plugin creates them as extra copies and your original stays in place.', T ) }
    >
        <DocSection title={ __( 'Where the files are', T ) }>
            <p className="capms-doc-text">{ __( 'Each converted file is saved next to the original with the format added to the end of its name:', T ) }</p>
            <DocCode>{ 'photo.jpg\nphoto.jpg.webp\nphoto.jpg.avif\nphoto-300x200.jpg.webp   (every thumbnail too)' }</DocCode>
            <DocNote type="info">{ __( 'The Media Library keeps showing the JPG because it is still the real attachment. Search for “.jpg.webp” in your uploads folder to find the copies.', T ) }</DocNote>
        </DocSection>

        <DocSection title={ __( 'Rules the plugin applies', T ) }>
            <DocList items={ [
                { term: __( 'Must be smaller', T ), text: __( 'A WebP or AVIF that is not smaller than its source is deleted at once. That image keeps using the original.', T ) },
                { term: __( 'AVIF must beat WebP', T ), text: __( 'AVIF is served first, so an AVIF that is not smaller than the WebP is deleted.', T ) },
                { term: __( 'Your original is never replaced', T ), text: __( 'Converted files are extra copies only.', T ) },
            ] } />
        </DocSection>

        <DocSection title={ __( 'When both switches are on', T ) }>
            <DocTable
                head={ [ __( 'Visitor’s browser', T ), __( 'File received', T ) ] }
                rows={ [
                    [ __( 'Modern Chrome, Firefox, Safari', T ), __( 'AVIF', T ) ],
                    [ __( 'WebP support but no AVIF', T ), __( 'WebP', T ) ],
                    [ __( 'Very old browser', T ), __( 'Original JPG or PNG', T ) ],
                ] }
            />
            <DocNote type="tip">{ __( 'Keeping both on gives the smallest pages with a safe fallback. The cost is extra disk space and a longer conversion time. Using AVIF alone is not recommended.', T ) }</DocNote>
        </DocSection>

        <DocSection title={ __( 'Why AVIF might not appear', T ) }>
            <DocList items={ [
                { term: __( 'Server cannot encode AVIF', T ), text: __( 'GD needs PHP 8.1+ with libavif. Imagick needs ImageMagick 7 with AVIF support. Check Server Health.', T ) },
                { term: __( 'Switch was off', T ), text: __( 'Turn it on, save, then run the Bulk Optimizer again.', T ) },
                { term: __( 'AVIF was larger than WebP', T ), text: __( 'The plugin removed it on purpose.', T ) },
            ] } />
        </DocSection>
    </DocArticle>
);

export const Videos = () => (
    <DocArticle
        badge={ __( 'Videos', T ) }
        title={ __( 'Video & Streaming', T ) }
        intro={ __( 'Videos are processed with FFmpeg in the background through WP-Cron, so uploading stays fast and the editor is never blocked.', T ) }
    >
        <DocTable
            head={ [ __( 'Setting', T ), __( 'What it does', T ) ] }
            rows={ [
                [ __( 'Enable Video Compression & Optimization', T ), __( 'Re-encodes MP4, M4V and MOV files with H.264 (preset medium, CRF 26) at a smaller size. The file is replaced in place; a backup keeps the original.', T ) ],
                [ __( 'Enable WebM Format Generation', T ), __( 'Creates a separate .webm copy with VP9 video and Opus audio for browsers that prefer it.', T ) ],
                [ __( 'Moov Atom “Fast Start” Optimization', T ), __( 'Moves the index to the start of the MP4 so playback begins before the whole file is downloaded. If compression is off, only this step runs and the video is not re-encoded.', T ) ],
                [ __( 'Max Video Resolution', T ), __( '1080, 720 or Original. The shorter side is capped, so portrait videos work too.', T ) ],
                [ __( 'Audio Bitrate Compression', T ), __( '128 kbps, 96 kbps or Original. Original re-encodes audio at 192 kbps.', T ) ],
                [ __( 'Custom FFmpeg binary path', T ), __( 'Leave empty to auto-detect. Enter the full path to the ffmpeg file if the server keeps it somewhere unusual.', T ) ],
            ] }
        />

        <DocSection title={ __( 'What happens after you upload a video', T ) }>
            <DocSteps steps={ [
                { title: __( 'It is queued', T ), text: __( 'The video is marked “Queued” and a background job is scheduled about 5 seconds later.', T ) },
                { title: __( 'WP-Cron runs FFmpeg', T ), text: __( 'The MP4 is optimized in place, then the WebM copy is created.', T ) },
                { title: __( 'Status updates', T ), text: __( 'The Media Library column changes to Optimized and shows the saving.', T ) },
            ] } />
        </DocSection>
        <DocNote type="warning">{ __( 'FFmpeg must be installed and exec() must be allowed. If either is missing the video is marked Skipped with a message, and no pointless backup is kept.', T ) }</DocNote>
        <DocNote type="info">{ __( 'WP-Cron only runs when someone visits the site. If a video stays queued on a quiet site, load any page or run wp-cron.php.', T ) }</DocNote>
        <DocNote type="tip">{ __( 'Delivery: WebM sources are added automatically to videos shown with the WordPress video shortcode and the Video block.', T ) }</DocNote>
    </DocArticle>
);

export const Bulk = () => (
    <DocArticle
        badge={ __( 'Bulk', T ) }
        title={ __( 'Using the Bulk Optimizer', T ) }
        intro={ __( 'Optimize every image and video that is already in your Media Library without touching them one by one.', T ) }
    >
        <DocSteps steps={ [
            { title: __( 'Start the run', T ), text: __( 'The plugin builds a queue of every file that is not optimized yet. Failed and skipped files are included unless you choose otherwise.', T ) },
            { title: __( 'One file at a time', T ), text: __( 'Files are sent to the server one by one. This avoids timeouts and keeps the progress bar accurate.', T ) },
            { title: __( 'Watch Live Activity', T ), text: __( 'Every row shows the file name, size before and after, the percentage saved and the format created.', T ) },
            { title: __( 'Completed', T ), text: __( 'The summary shows Processed, Succeeded and Failed. A failed file shows its reason and the run continues.', T ) },
            { title: __( 'Run Again', T ), text: __( 'Starts a new queue. Use it after changing settings, after fixing a failure or after uploading more files.', T ) },
        ] } />
        <DocNote type="tip">{ __( 'Files already optimized are skipped, so running the tool again is safe and quick.', T ) }</DocNote>
        <DocNote type="info">{ __( 'In bulk mode thumbnails are recompressed too, because they were created before the plugin existed. If the main image is resized, all thumbnails are regenerated from it.', T ) }</DocNote>
        <DocNote type="warning">{ __( 'Keep this page open while a run is in progress.', T ) }</DocNote>
    </DocArticle>
);

export const Delivery = () => (
    <DocArticle
        badge={ __( 'Delivery', T ) }
        title={ __( 'Serving WebP and AVIF on Your Site', T ) }
        intro={ __( 'Creating the files is only half the job. The delivery method decides how visitors’ browsers actually receive them. A format is only offered when its file really exists.', T ) }
    >
        <DocSection title={ __( 'Method 1: Picture tag (default)', T ) }>
            <p className="capms-doc-text">{ __( 'Images in post content, featured images and text or block widgets are wrapped in a <picture> tag: an AVIF source first, then WebP, then the normal image as the fallback.', T ) }</p>
            <DocNote type="warning">{ __( 'Images that WordPress does not print through those filters are not wrapped. That includes WooCommerce product galleries, many Elementor widgets and images created by JavaScript, such as gallery zoom images. Use the .htaccess method for those.', T ) }</DocNote>
        </DocSection>

        <DocDivider />

        <DocSection title={ __( 'Method 2: .htaccess rewrite', T ) }>
            <p className="capms-doc-text">{ __( 'The image URL never changes. Apache looks at what the browser accepts and, if a matching file exists, sends it instead of the JPG or PNG.', T ) }</p>
            <DocList items={ [
                { term: __( '1. AVIF', T ), text: __( 'If the browser accepts image/avif and the .avif file exists.', T ) },
                { term: __( '2. WebP', T ), text: __( 'Otherwise, if it accepts image/webp and the .webp file exists.', T ) },
                { term: __( '3. Original', T ), text: __( 'Otherwise the normal file is sent.', T ) },
            ] } />
            <p className="capms-doc-text">{ __( 'The rules are written to wp-content/uploads/.htaccess in a block named “Captain Media Shield”, together with the right content types and a Vary: Accept header so CDNs cache each format separately. The block is added or removed automatically when you save settings and when the plugin is deactivated.', T ) }</p>
            <DocSteps steps={ [
                { title: __( 'Select the method', T ), text: __( 'Images & Formats → WebP/AVIF Delivery Method → .htaccess, then Save.', T ) },
                { title: __( 'Confirm the rules', T ), text: __( 'Open wp-content/uploads/.htaccess. The Captain Media Shield block should be there.', T ) },
                { title: __( 'Verify in the browser', T ), text: __( 'DevTools → Network → Img. The image Type should show webp or avif.', T ) },
            ] } />
            <DocNote type="info">{ __( 'Needs Apache with mod_rewrite and AllowOverride All. Nginx ignores .htaccess, so use the Picture tag method there or add an equivalent rule to the server configuration.', T ) }</DocNote>
        </DocSection>
    </DocArticle>
);
