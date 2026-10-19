import React from 'react';
import { __ } from '@wordpress/i18n';
import { DocArticle, DocSection, DocSteps, DocList, DocNote, DocCode, DocTable, DocDivider } from './doc_kit.jsx';

const T = 'captain-media-shield';

export const Backups = () => (
    <DocArticle
        badge={ __( 'Storage', T ) }
        title={ __( 'Backup & Retention', T ) }
        intro={ __( 'Before a file is optimized, the plugin can keep a copy of the original so the change can be undone. This is what the Backup & Retention screen controls.', T ) }
    >
        <DocSection title={ __( 'Where backups are stored', T ) }>
            <DocCode>{ 'wp-content/uploads/captain-ms-backups/' }</DocCode>
            <p className="capms-doc-text">{ __( 'The folder mirrors your uploads structure, so 2026/10/photo.jpg is kept as captain-ms-backups/2026/10/photo.jpg. It is protected with an index.php and an .htaccess that block direct web access. This is a second copy of your files, so it uses real disk space.', T ) }</p>
            <DocNote type="info">{ __( 'Older versions used the folder name captain-backups. If it exists, it is renamed automatically the first time the plugin needs it, so existing backups keep working.', T ) }</DocNote>
        </DocSection>

        <DocSection title={ __( 'Settings', T ) }>
            <DocTable
                head={ [ __( 'Setting', T ), __( 'What it does', T ) ] }
                rows={ [
                    [ __( 'Save Original Backup', T ), __( 'Keeps the untouched original. Required for Restore Original. Without it an optimization cannot be undone.', T ) ],
                    [ __( 'Immediate Auto-Delete Originals', T ), __( 'Deletes the backup as soon as conversion succeeds. Maximum saving, but those files cannot be restored.', T ) ],
                    [ __( 'Delete backups', T ), __( 'Retention: Immediate, after 1 hour, 1 day, 7 days, 30 days, or Never. Never is the default.', T ) ],
                ] }
            />
            <DocNote type="warning">{ __( 'Because the default is Never, backups keep growing until you purge them or pick a shorter retention.', T ) }</DocNote>
        </DocSection>

        <DocSection title={ __( 'How the cleanup runs', T ) }>
            <p className="capms-doc-text">{ __( 'An hourly WP-Cron job removes backups older than your retention time. It is scheduled when you first save settings, and it runs immediately whenever you change retention to anything except Never. The time of the last cleanup and the number of files removed are recorded.', T ) }</p>
        </DocSection>

        <DocSection title={ __( 'Purge All Backups Now', T ) }>
            <p className="capms-doc-text">{ __( 'Permanently deletes every original in the backup folder and frees the space. Optimized files and their WebP, AVIF and WebM copies are not affected.', T ) }</p>
        </DocSection>

        <DocSection title={ __( 'Restore Original File', T ) }>
            <DocSteps steps={ [
                { title: __( 'Open the Media Library in list view', T ), text: __( 'Every optimized file that has a backup shows a Restore Original link in the Media Shield column, in the row actions and in the attachment details.', T ) },
                { title: __( 'Click Restore Original', T ), text: __( 'The original is copied back. If WordPress had renamed the live file (for example with -scaled), the restore handles that.', T ) },
                { title: __( 'Generated copies are removed', T ), text: __( 'The optimized file’s WebP, AVIF and WebM versions are deleted and the file is marked “Original restored”.', T ) },
            ] } />
        </DocSection>
    </DocArticle>
);

export const MediaLibrary = () => (
    <DocArticle
        badge={ __( 'Media Library', T ) }
        title={ __( 'Media Library Integration', T ) }
        intro={ __( 'You can see and control the optimization of any single file straight from the WordPress Media Library, without opening the plugin screens.', T ) }
    >
        <DocSection title={ __( 'The Media Shield column (list view)', T ) }>
            <DocTable
                head={ [ __( 'Status shown', T ), __( 'Meaning', T ) ] }
                rows={ [
                    [ __( 'Optimized — Saved X (Y%)', T ), __( 'The file was processed. A Restore Original link appears if a backup exists.', T ) ],
                    [ __( 'No backup kept', T ), __( 'Optimized, but the original was not saved, so it cannot be restored.', T ) ],
                    [ __( 'Queued / Processing in background…', T ), __( 'A video is waiting for or being processed by the background job.', T ) ],
                    [ __( 'Skipped', T ), __( 'Nothing was done, for example because FFmpeg is missing. The message explains why.', T ) ],
                    [ __( 'Original restored', T ), __( 'You restored the original file.', T ) ],
                    [ __( 'Not optimized — Optimize Now', T ), __( 'Not processed yet. Click Optimize Now to process just this file.', T ) ],
                    [ __( 'Not supported', T ), __( 'The file type is not one the plugin handles.', T ) ],
                ] }
            />
        </DocSection>
        <DocSection title={ __( 'Other places', T ) }>
            <DocList items={ [
                { term: __( 'Row actions', T ), text: __( 'Optimize Now or Restore Original under each file name in list view.', T ) },
                { term: __( 'Attachment details', T ), text: __( 'The same status and actions in the media popup and the edit screen.', T ) },
                { term: __( 'Deleting a file', T ), text: __( 'Also deletes its WebP, AVIF and WebM copies, its backup, its statistics row and any pending video job.', T ) },
            ] } />
        </DocSection>
        <DocNote type="tip">{ __( 'Grid view does not show the column. Switch to list view with the list icon at the top of the Media Library.', T ) }</DocNote>
    </DocArticle>
);

export const Settings = () => (
    <DocArticle
        badge={ __( 'Reference', T ) }
        title={ __( 'All Settings at a Glance', T ) }
        intro={ __( 'Every setting, its default and what values are allowed. Anything outside the allowed range is corrected automatically when you save.', T ) }
    >
        <DocTable
            head={ [ __( 'Setting', T ), __( 'Default', T ), __( 'Allowed values', T ) ] }
            rows={ [
                [ __( 'Optimize images on upload', T ), __( 'On', T ), __( 'On / Off', T ) ],
                [ __( 'WebP conversion', T ), __( 'On', T ), __( 'On / Off', T ) ],
                [ __( 'AVIF conversion', T ), __( 'On only if the server supports AVIF', T ), __( 'On / Off', T ) ],
                [ __( 'Image quality', T ), '80', __( '1 to 100', T ) ],
                [ __( 'Strip image metadata', T ), __( 'On', T ), __( 'On / Off', T ) ],
                [ __( 'Auto-resize large images', T ), __( 'On', T ), __( 'On / Off', T ) ],
                [ __( 'Max width / height', T ), '1920 / 1920', __( '320 to 10000', T ) ],
                [ __( 'Delivery method', T ), __( 'Picture tag', T ), __( 'Picture tag or .htaccess', T ) ],
                [ __( 'Video compression', T ), __( 'On', T ), __( 'On / Off', T ) ],
                [ __( 'WebM generation', T ), __( 'On', T ), __( 'On / Off', T ) ],
                [ __( 'Fast start', T ), __( 'On', T ), __( 'On / Off', T ) ],
                [ __( 'Max video resolution', T ), '1080', __( '1080, 720 or original', T ) ],
                [ __( 'Audio bitrate', T ), '128', __( '128, 96 or original', T ) ],
                [ __( 'Strip video metadata', T ), __( 'On', T ), __( 'On / Off', T ) ],
                [ __( 'FFmpeg path', T ), __( 'Empty (auto-detect)', T ), __( 'A file path only', T ) ],
                [ __( 'Save original backup', T ), __( 'On', T ), __( 'On / Off', T ) ],
                [ __( 'Auto-delete originals', T ), __( 'Off', T ), __( 'On / Off', T ) ],
                [ __( 'Backup retention', T ), __( 'Never', T ), __( 'Immediate, 1 hour, 1 day, 7 days, 30 days, Never', T ) ],
            ] }
        />
        <DocNote type="info">{ __( 'The FFmpeg path is treated as a file path only. If it contains characters such as ; & | ` $ < > or quotes, it is ignored for safety.', T ) }</DocNote>
    </DocArticle>
);

export const Health = () => (
    <DocArticle
        badge={ __( 'System', T ) }
        title={ __( 'Server Health', T ) }
        intro={ __( 'Server Health checks everything the plugin depends on, live on your server. Press Re-run Checks after your host changes anything.', T ) }
    >
        <DocTable
            head={ [ __( 'Check', T ), __( 'Why it matters', T ) ] }
            rows={ [
                [ __( 'GD Library and GD WebP / AVIF', T ), __( 'An image engine that can write WebP or AVIF.', T ) ],
                [ __( 'Imagick and Imagick WebP / AVIF', T ), __( 'The alternative engine. One of GD or Imagick is enough.', T ) ],
                [ __( 'WebP Support / AVIF Support', T ), __( 'The combined answer: can this server create the format at all.', T ) ],
                [ __( 'exec() available', T ), __( 'Needed to run FFmpeg.', T ) ],
                [ __( 'FFmpeg path and version', T ), __( 'Needed for any video work.', T ) ],
                [ __( 'PHP and WordPress memory limit', T ), __( 'Big images need memory to be processed.', T ) ],
                [ __( 'Max upload size and execution time', T ), __( 'Limits for large files and long jobs.', T ) ],
                [ __( 'Server software / .htaccess capable', T ), __( 'The .htaccess delivery method only works on Apache.', T ) ],
                [ __( 'Uploads folder writable', T ), __( 'Without it nothing can be saved. A red notice appears at the top if it is not writable.', T ) ],
            ] }
        />
        <DocNote type="tip">{ __( 'If a line shows Missing, ask your host to enable it. For WebP and AVIF, one engine with support is enough.', T ) }</DocNote>
    </DocArticle>
);

export const HowItWorks = () => (
    <DocArticle
        badge={ __( 'Under the Hood', T ) }
        title={ __( 'How the Optimization Works Step by Step', T ) }
        intro={ __( 'A technical walk-through of what happens to a file, from upload to delivery.', T ) }
    >
        <DocSection title={ __( 'Image upload', T ) }>
            <DocSteps steps={ [
                { title: __( 'Original is saved', T ), text: __( 'WordPress stores the upload. The plugin records its size and, if enabled, copies the untouched file to the backup folder.', T ) },
                { title: __( 'Original is prepared', T ), text: __( 'If it is larger than the maximum dimensions it is resized and re-encoded at your quality. Metadata is stripped if enabled.', T ) },
                { title: __( 'WordPress makes thumbnails', T ), text: __( 'Every thumbnail is generated at your quality setting.', T ) },
                { title: __( 'Every file gets converted', T ), text: __( 'For the main file and each thumbnail: strip metadata, create WebP, create AVIF, then apply the “must be smaller” rules.', T ) },
                { title: __( 'Result is recorded', T ), text: __( 'File sizes in the attachment data are refreshed and one statistics row is saved, which feeds the Dashboard.', T ) },
            ] } />
        </DocSection>

        <DocDivider />

        <DocSection title={ __( 'Video upload', T ) }>
            <p className="capms-doc-text">{ __( 'A video is queued and processed later by WP-Cron: MP4 files are re-encoded in place with H.264 and fast start, then an optional WebM copy is created. See the Video & Streaming guide.', T ) }</p>
        </DocSection>

        <DocDivider />

        <DocSection title={ __( 'Delivery', T ) }>
            <p className="capms-doc-text">{ __( 'When a visitor opens a page, either the Picture tag filter or the .htaccess rules pick the smallest supported format that exists on disk. See the Delivery guide.', T ) }</p>
        </DocSection>

        <DocDivider />

        <DocSection title={ __( 'Safety measures', T ) }>
            <DocList items={ [
                { term: __( 'No double compression', T ), text: __( 'If the main file was already re-encoded during resize, it is not compressed a second time.', T ) },
                { term: __( 'Only keep what helps', T ), text: __( 'Converted copies that are not smaller are deleted.', T ) },
                { term: __( 'Safe video writes', T ), text: __( 'Videos are encoded to a temporary file and only replace the original when the encode succeeds.', T ) },
                { term: __( 'WordPress format conversion paused', T ), text: __( 'While the plugin works, core’s own image format conversion is switched off so the plugin controls the output.', T ) },
            ] } />
        </DocSection>
    </DocArticle>
);

export const Privacy = () => (
    <DocArticle
        badge={ __( 'Security', T ) }
        title={ __( 'Security, Privacy & Uninstall', T ) }
        intro={ __( 'What the plugin protects, what it stores and what happens when you remove it.', T ) }
    >
        <DocSection title={ __( 'Security', T ) }>
            <DocList items={ [
                { term: __( 'Admin only', T ), text: __( 'Every request is checked with a nonce and needs the manage_options capability.', T ) },
                { term: __( 'Validated settings', T ), text: __( 'Only known settings are saved and every value is checked against its allowed range.', T ) },
                { term: __( 'Safe commands', T ), text: __( 'FFmpeg arguments are escaped and the FFmpeg path cannot contain shell characters.', T ) },
                { term: __( 'Protected backups', T ), text: __( 'The backup folder blocks direct access from the web.', T ) },
            ] } />
        </DocSection>
        <DocSection title={ __( 'Privacy', T ) }>
            <p className="capms-doc-text">{ __( 'Nothing leaves your server. There is no external API, tracking or account. Stripping EXIF and GPS data also removes location information from your images.', T ) }</p>
        </DocSection>
        <DocSection title={ __( 'Deactivate and uninstall', T ) }>
            <DocList items={ [
                { term: __( 'Deactivate', T ), text: __( 'The .htaccess rules block is removed. Your media and converted copies stay.', T ) },
                { term: __( 'Delete the plugin', T ), text: __( 'Removes settings, the statistics table, plugin data and scheduled events.', T ) },
                { term: __( 'Files are kept', T ), text: __( 'Media files, WebP, AVIF, WebM copies and the backup folder are never deleted automatically. Remove them yourself if you want the space back.', T ) },
            ] } />
        </DocSection>
    </DocArticle>
);

export const Developer = () => (
    <DocArticle
        badge={ __( 'Developers', T ) }
        title={ __( 'Hooks & Developer Reference', T ) }
        intro={ __( 'Filters and events you can use to adjust the plugin from your own code.', T ) }
    >
        <DocTable
            head={ [ __( 'Hook', T ), __( 'Type', T ), __( 'Purpose', T ) ] }
            rows={ [
                [ 'capms_supported_video_mimes', __( 'Filter', T ), __( 'Change the list of video types that are processed.', T ) ],
                [ 'capms_video_crf', __( 'Filter', T ), __( 'H.264 quality for MP4. Default 26. Lower means better quality and a bigger file.', T ) ],
                [ 'capms_webm_crf', __( 'Filter', T ), __( 'VP9 quality for WebM. Default 33.', T ) ],
                [ 'capms_settings_updated', __( 'Action', T ), __( 'Fires after settings are saved. The plugin uses it to sync .htaccess and the cleanup schedule.', T ) ],
                [ 'capms_process_video_event', __( 'Event', T ), __( 'Background video processing job for one attachment.', T ) ],
                [ 'capms_backup_cleanup_event', __( 'Event', T ), __( 'Hourly job that removes expired backups.', T ) ],
            ] }
        />
        <DocSection title={ __( 'Example', T ) }>
            <DocCode>{ "add_filter( 'capms_video_crf', function () {\n    return 23; // higher quality, larger file\n} );" }</DocCode>
        </DocSection>
        <DocNote type="info">{ __( 'The admin screens are a React app. After changing files under src/, run npm install and npm run build to update the compiled files.', T ) }</DocNote>
    </DocArticle>
);

export const Troubleshooting = () => (
    <DocArticle
        badge={ __( 'Help', T ) }
        title={ __( 'Troubleshooting & FAQ', T ) }
        intro={ __( 'Quick answers to the most common questions.', T ) }
    >
        <DocTable
            head={ [ __( 'Problem', T ), __( 'Likely cause', T ), __( 'What to do', T ) ] }
            rows={ [
                [ __( 'I see no .webp files in uploads', T ), __( 'The copies are named .jpg.webp, next to the originals.', T ), __( 'Search the uploads folder for “.jpg.webp”.', T ) ],
                [ __( 'WebP exists but pages still load JPG', T ), __( 'The image is not printed through a filter the Picture tag covers (for example WooCommerce), or rewrites are not working.', T ), __( 'Switch Delivery to .htaccess. Enable mod_rewrite and AllowOverride All.', T ) ],
                [ __( 'No AVIF files', T ), __( 'Server cannot encode AVIF, the switch was off, or AVIF was larger than WebP.', T ), __( 'Check Server Health, turn AVIF on, then run Bulk Optimizer again.', T ) ],
                [ __( 'Uploads folder doubled in size', T ), __( 'Backups of originals are kept forever by default.', T ), __( 'Backup & Retention → Purge All Backups, or choose a shorter retention.', T ) ],
                [ __( 'Videos stay Queued', T ), __( 'WP-Cron is not running or FFmpeg is missing.', T ), __( 'Visit the site or run wp-cron.php. Check FFmpeg in Server Health.', T ) ],
                [ __( 'Video shows Skipped', T ), __( 'FFmpeg or exec() is unavailable, or video optimization is off.', T ), __( 'Read the message in the Media Library column and fix the cause.', T ) ],
                [ __( 'Some files failed in Bulk', T ), __( 'Missing source file, folder not writable or a corrupt image.', T ), __( 'Fix the cause and press Run Again.', T ) ],
                [ __( 'Restore Original is missing', T ), __( 'No backup exists for that file.', T ), __( 'Backups must be on before optimizing. A purged or auto-deleted backup cannot be restored.', T ) ],
                [ __( 'I cannot find the menu', T ), __( 'It lives under Media, and only administrators see it.', T ), __( 'Go to Media → Captain Media Shield.', T ) ],
            ] }
        />
    </DocArticle>
);
