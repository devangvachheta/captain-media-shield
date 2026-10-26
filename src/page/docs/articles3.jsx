import React from 'react';
import { __ } from '@wordpress/i18n';
import { DocArticle, DocSection, DocList, DocNote, DocCode, DocTable } from './doc_kit.jsx';

const T = 'captain-media-shield';

export const Cleanup = () => (
    <DocArticle
        badge={ __( 'Storage', T ) }
        title={ __( 'Media Cleanup & Storage Report', T ) }
        intro={ __( 'Optimizing makes new files smaller. Cleanup removes the files you no longer need. Nothing is deleted until you confirm, and every file is checked again right before it is removed.', T ) }
    >
        <DocSection title={ __( 'Unused Media', T ) }>
            <p className="capms-doc-text">{ __( 'Each file is searched for in post content (including block and gallery data), featured images, WooCommerce galleries, widgets, theme settings, site icon and logo, term meta and custom fields. If anything refers to it, it is treated as in use and never listed.', T ) }</p>
            <DocNote type="info">{ __( 'The stricter scan also lists files that are only attached to a post (uploaded there) but not actually used in it. Review those before deleting.', T ) }</DocNote>
        </DocSection>

        <DocSection title={ __( 'Duplicate Files', T ) }>
            <p className="capms-doc-text">{ __( 'Files are compared by size and then by an MD5 fingerprint, so only identical copies are reported. The copy that is in use (or the oldest) is kept. A duplicate that is still in use is marked "In use" and cannot be deleted here: replace it in your content, then scan again.', T ) }</p>
        </DocSection>

        <DocSection title={ __( 'Unused Thumbnails', T ) }>
            <p className="capms-doc-text">{ __( 'Finds thumbnail files for sizes your site no longer registers and that no content refers to. Original images are never touched.', T ) }</p>
            <DocNote type="warning">{ __( 'A few themes register sizes only on the front end. Review the list before deleting; a missing size can be regenerated with any thumbnail regeneration tool.', T ) }</DocNote>
        </DocSection>

        <DocSection title={ __( 'Safety net', T ) }>
            <DocList items={ [
                { term: __( 'Confirmation', T ), text: __( 'Every delete button asks first.', T ) },
                { term: __( 'Re-check', T ), text: __( 'Usage is checked again on the server for each file just before deleting.', T ) },
                { term: __( 'Kept copies', T ), text: __( 'Optionally keeps a copy of each deleted original in the backup folder, in a deleted/ sub folder.', T ) },
            ] } />
        </DocSection>

        <DocSection title={ __( 'Storage Report', T ) }>
            <p className="capms-doc-text">{ __( 'Shows library size split into originals, thumbnails, next-gen copies and backups, size by file type and by upload year, the largest files, and an estimate of what optimizing the remaining JPEG/PNG files could save. Scanning only reads file sizes.', T ) }</p>
        </DocSection>
    </DocArticle>
);

export const Extras = () => (
    <DocArticle
        badge={ __( 'Features', T ) }
        title={ __( 'GIF to Video, Posters, Exclude Rules, Nginx & WP-CLI', T ) }
        intro={ __( 'Smaller features that round out the plugin.', T ) }
    >
        <DocSection title={ __( 'Animated GIF to video', T ) }>
            <p className="capms-doc-text">{ __( 'With this on (Video & Streaming), animated GIFs get an MP4 and WebM copy next to the file, for example animation.gif.mp4. Full-size GIFs in content are shown as a muted, looping video with the GIF as fallback. Existing GIFs are converted by the Bulk Optimizer. Needs FFmpeg with H.264.', T ) }</p>
        </DocSection>

        <DocSection title={ __( 'Video posters', T ) }>
            <p className="capms-doc-text">{ __( 'A JPEG frame is saved as video.mp4.poster.jpg and used as the poster of videos that have none, so the player never shows a black box.', T ) }</p>
        </DocSection>

        <DocSection title={ __( 'Exclude rules', T ) }>
            <p className="capms-doc-text">{ __( 'In Images & Formats, list folders or file patterns (one per line, matched inside the uploads folder) and attachment IDs that must be left untouched.', T ) }</p>
            <DocCode>{ 'private/\nlogos/*\n*-original.png' }</DocCode>
        </DocSection>

        <DocSection title={ __( 'Nginx rules', T ) }>
            <p className="capms-doc-text">{ __( 'Nginx ignores .htaccess. Images & Formats can show a ready-made snippet that serves AVIF/WebP from the same URL. Copy it into your Nginx config and reload.', T ) }</p>
        </DocSection>

        <DocSection title={ __( 'WP-CLI', T ) }>
            <DocTable
                head={ [ __( 'Command', T ), __( 'What it does', T ) ] }
                rows={ [
                    [ 'wp capms optimize', __( 'Optimize everything that is waiting (options: --ids, --type, --retry-failed).', T ) ],
                    [ 'wp capms status', __( 'Show savings and queue size.', T ) ],
                    [ 'wp capms restore <id>', __( 'Restore an original from its backup.', T ) ],
                    [ 'wp capms cleanup unused|duplicates|thumbnails', __( 'Report, or delete with --delete.', T ) ],
                    [ 'wp capms purge-backups', __( 'Delete all backups.', T ) ],
                ] }
            />
        </DocSection>
    </DocArticle>
);
