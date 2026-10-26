import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import useSettings from '../../hooks/useSettings.js';
import { ajax } from '../../services/api.js';
import { PageHeader, Section, ToggleRow, SelectRow, Row, SaveBar, Notice, Pill, Skeleton } from '../../components/ui.jsx';
import { IconLayers, IconSliders, IconShield, IconResize, IconGlobe, IconTerminal, IconX } from '../../components/icons.jsx';

const KEYS = [ 'optimize_on_upload', 'webp_enabled', 'avif_enabled', 'image_quality', 'strip_metadata', 'resize_enabled', 'max_width', 'max_height', 'delivery_method', 'exclude_paths', 'exclude_ids' ];

const qualityLabel = ( q ) => {
    if ( q >= 90 ) return __( 'Near-lossless', 'captain-media-shield' );
    if ( q >= 75 ) return __( 'Balanced (Recommended)', 'captain-media-shield' );
    if ( q >= 55 ) return __( 'Aggressive', 'captain-media-shield' );
    return __( 'Maximum compression', 'captain-media-shield' );
};

const Images = () => {
    const { draft, support, set, save, reset, discard, dirty, saving, message, tone } = useSettings( KEYS );
    const [ nginx, setNginx ]     = useState( null );
    const [ copied, setCopied ]   = useState( false );
    const [ loadingNginx, setLoadingNginx ] = useState( false );

    const showNginx = async () => {
        if ( nginx ) {
            setNginx( null );
            return;
        }
        setLoadingNginx( true );
        const result = await ajax( 'get_nginx_snippet' );
        setLoadingNginx( false );
        if ( result.success && result.data ) setNginx( result.data.snippet );
    };

    const copyNginx = async () => {
        try {
            await navigator.clipboard.writeText( nginx );
            setCopied( true );
            setTimeout( () => setCopied( false ), 2000 );
        } catch ( e ) {
            // Clipboard blocked - the text is selectable in the box anyway.
        }
    };

    if ( ! draft ) {
        return (
            <div className="capms-settings-wrapper">
                <PageHeader title={ __( 'Image Optimization & Formats', 'captain-media-shield' ) } />
                <Skeleton height={ 220 } />
                <Skeleton height={ 160 } />
            </div>
        );
    }

    const quality = Number( draft.image_quality ) || 80;

    return (
        <div className="capms-settings-wrapper">
            <PageHeader
                title={ __( 'Image Optimization & Formats', 'captain-media-shield' ) }
                subtitle={ __( 'Compress, resize and convert every image to next-gen formats - right on your own server.', 'captain-media-shield' ) }
            />

            <div className="capms-settings-sections">

                <Section
                    icon={ <IconLayers /> }
                    title={ __( 'Next-Gen Formats', 'captain-media-shield' ) }
                    description={ __( 'A WebP / AVIF copy is created for the original and every thumbnail size. A copy is only kept when it is smaller than the source.', 'captain-media-shield' ) }
                >
                    <ToggleRow
                        label={ __( 'Optimize images on upload', 'captain-media-shield' ) }
                        hint={ __( 'Run the full pipeline automatically for every new upload. Turn off to optimize only through the Bulk Optimizer.', 'captain-media-shield' ) }
                        checked={ !! draft.optimize_on_upload }
                        onChange={ ( v ) => set( 'optimize_on_upload', v ) }
                    />
                    <ToggleRow
                        label={ __( 'Enable WebP Conversion', 'captain-media-shield' ) }
                        hint={ __( '25-35% smaller than JPEG/PNG at the same visual quality. Supported by every modern browser.', 'captain-media-shield' ) }
                        checked={ !! draft.webp_enabled }
                        onChange={ ( v ) => set( 'webp_enabled', v ) }
                        disabled={ ! support.webp }
                        extra={ ! support.webp && <Pill tone="orange">{ __( 'Not supported by server', 'captain-media-shield' ) }</Pill> }
                    />
                    <ToggleRow
                        last
                        label={ __( 'Enable AVIF Conversion', 'captain-media-shield' ) }
                        hint={ __( 'Up to 50% smaller than JPEG. Needs Imagick or GD built with AVIF support.', 'captain-media-shield' ) }
                        checked={ !! draft.avif_enabled }
                        onChange={ ( v ) => set( 'avif_enabled', v ) }
                        disabled={ ! support.avif }
                        extra={ ! support.avif && <Pill tone="orange">{ __( 'Not supported by server', 'captain-media-shield' ) }</Pill> }
                    />
                </Section>

                <Section
                    icon={ <IconSliders /> }
                    title={ __( 'Compression Quality', 'captain-media-shield' ) }
                    description={ __( 'Applies to recompressed JPEGs, generated thumbnails and WebP/AVIF output.', 'captain-media-shield' ) }
                >
                    <Row
                        last
                        stacked
                        label={ __( 'Image Quality Setting', 'captain-media-shield' ) }
                        hint={ __( '80 is the sweet spot - visually identical for most photos with a big size drop.', 'captain-media-shield' ) }
                    >
                        <div className="capms-range">
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={ quality }
                                onChange={ ( e ) => set( 'image_quality', Number( e.target.value ) ) }
                                style={ { '--capms-range-pct': `${ quality }%` } }
                                aria-label={ __( 'Image quality', 'captain-media-shield' ) }
                            />
                            <div className="capms-range-meta">
                                <span className="capms-range-value">{ quality }</span>
                                <span className="capms-range-label">{ qualityLabel( quality ) }</span>
                            </div>
                        </div>
                    </Row>
                </Section>

                <Section
                    icon={ <IconShield /> }
                    title={ __( 'Privacy & Metadata', 'captain-media-shield' ) }
                    description={ __( 'Camera details, GPS location and editing history are removed losslessly - pixels are not touched, the colour profile is kept.', 'captain-media-shield' ) }
                >
                    <ToggleRow
                        last
                        label={ __( 'Strip EXIF & GPS Metadata', 'captain-media-shield' ) }
                        hint={ __( 'Photos are auto-rotated first, so removing the orientation tag never leaves them sideways.', 'captain-media-shield' ) }
                        checked={ !! draft.strip_metadata }
                        onChange={ ( v ) => set( 'strip_metadata', v ) }
                    />
                </Section>

                <Section
                    icon={ <IconResize /> }
                    title={ __( 'Auto-Resize Large Uploads', 'captain-media-shield' ) }
                    description={ __( 'Huge camera photos (4000px+) are scaled down before thumbnails are generated. Aspect ratio is always kept.', 'captain-media-shield' ) }
                >
                    <ToggleRow
                        label={ __( 'Auto-Resize Large Image Uploads', 'captain-media-shield' ) }
                        checked={ !! draft.resize_enabled }
                        onChange={ ( v ) => set( 'resize_enabled', v ) }
                    />
                    <Row
                        last
                        label={ __( 'Maximum dimensions', 'captain-media-shield' ) }
                        hint={ __( 'Images larger than this (in either direction) are scaled down to fit.', 'captain-media-shield' ) }
                        locked={ ! draft.resize_enabled }
                    >
                        <div className="capms-dim-inputs">
                            <label>
                                <span>{ __( 'Max Width', 'captain-media-shield' ) }</span>
                                <input type="number" min="320" max="10000" className="capms-input" value={ draft.max_width } disabled={ ! draft.resize_enabled } onChange={ ( e ) => set( 'max_width', e.target.value ) } />
                                <em>px</em>
                            </label>
                            <label>
                                <span>{ __( 'Max Height', 'captain-media-shield' ) }</span>
                                <input type="number" min="320" max="10000" className="capms-input" value={ draft.max_height } disabled={ ! draft.resize_enabled } onChange={ ( e ) => set( 'max_height', e.target.value ) } />
                                <em>px</em>
                            </label>
                        </div>
                    </Row>
                </Section>

                <Section
                    icon={ <IconGlobe /> }
                    title={ __( 'WebP / AVIF Delivery', 'captain-media-shield' ) }
                    description={ __( 'How visitors receive the next-gen files. Browsers without support always get the original JPEG/PNG.', 'captain-media-shield' ) }
                >
                    <SelectRow
                        last
                        label={ __( 'WebP/AVIF Delivery Method', 'captain-media-shield' ) }
                        hint={ draft.delivery_method === 'htaccess'
                            ? __( 'Rules are written to uploads/.htaccess - the same image URL serves AVIF/WebP to browsers that accept it. Fastest, works with page caches. Apache / LiteSpeed only.', 'captain-media-shield' )
                            : __( 'Each <img> in post content and featured images is wrapped in a <picture> tag with AVIF/WebP sources. Works on any server (Nginx included).', 'captain-media-shield' ) }
                        value={ draft.delivery_method }
                        onChange={ ( v ) => set( 'delivery_method', v ) }
                        options={ [
                            { value: 'htaccess', label: __( '.htaccess Rewrites', 'captain-media-shield' ) },
                            { value: 'picture', label: __( 'HTML <picture> tag replacement', 'captain-media-shield' ) },
                        ] }
                    />
                </Section>

                <Section
                    icon={ <IconTerminal /> }
                    title={ __( 'Nginx Rules', 'captain-media-shield' ) }
                    description={ __( 'Running Nginx? Nginx ignores .htaccess, but these rules give you the same result: AVIF/WebP served from the original image URL, no HTML changes. Generated from your current format settings.', 'captain-media-shield' ) }
                >
                    <Row
                        last
                        stacked
                        label={ __( 'Nginx configuration snippet', 'captain-media-shield' ) }
                        hint={ __( 'Copy it into your Nginx config and reload. The plugin cannot edit Nginx for you, so nothing changes until you do.', 'captain-media-shield' ) }
                    >
                        <div className="capms-snippet">
                            <div className="capms-snippet-actions">
                                <button type="button" className="capms-btn capms-btn--ghost" onClick={ showNginx } disabled={ loadingNginx }>
                                    { nginx ? <IconX /> : <IconTerminal /> }
                                    { nginx ? __( 'Hide rules', 'captain-media-shield' ) : __( 'Show Nginx rules', 'captain-media-shield' ) }
                                </button>
                                { nginx && (
                                    <button type="button" className="capms-btn capms-btn--primary" onClick={ copyNginx }>
                                        { copied ? __( 'Copied!', 'captain-media-shield' ) : __( 'Copy', 'captain-media-shield' ) }
                                    </button>
                                ) }
                            </div>
                            { nginx && <textarea className="capms-snippet-box" readOnly rows={ 16 } value={ nginx } onFocus={ ( e ) => e.target.select() } aria-label={ __( 'Nginx rules', 'captain-media-shield' ) } /> }
                        </div>
                    </Row>
                </Section>

                <Section
                    icon={ <IconShield /> }
                    title={ __( 'Exclude Rules', 'captain-media-shield' ) }
                    description={ __( 'Files that match these rules are never resized, compressed or converted, and are skipped by the Bulk Optimizer. Handy for logos, print files or anything you want kept exactly as uploaded.', 'captain-media-shield' ) }
                >
                    <Row
                        stacked
                        label={ __( 'Folders and file patterns', 'captain-media-shield' ) }
                        hint={ __( 'One per line, matched against the path inside your uploads folder (for example 2025/03/photo.jpg). Plain text matches anywhere in the path, so "private/" skips a whole folder. Use * as a wildcard, for example *-original.png.', 'captain-media-shield' ) }
                    >
                        <textarea
                            className="capms-snippet-box capms-snippet-box--edit"
                            rows={ 5 }
                            placeholder={ 'private/\nlogos/*\n*-original.png' }
                            value={ draft.exclude_paths || '' }
                            onChange={ ( e ) => set( 'exclude_paths', e.target.value ) }
                            aria-label={ __( 'Excluded folders and file patterns', 'captain-media-shield' ) }
                        />
                    </Row>
                    <Row
                        last
                        label={ __( 'Attachment IDs', 'captain-media-shield' ) }
                        hint={ __( 'Comma separated. Found in the Media Library URL (post=123). ID rules apply to the Bulk Optimizer and to WebP/AVIF creation; use a folder or file pattern to also keep a brand-new upload untouched.', 'captain-media-shield' ) }
                    >
                        <input
                            type="text"
                            className="capms-input capms-input--wide"
                            placeholder="12, 48, 301"
                            value={ draft.exclude_ids || '' }
                            onChange={ ( e ) => set( 'exclude_ids', e.target.value ) }
                        />
                    </Row>
                </Section>

                { draft.delivery_method === 'htaccess' && support.apache === false && (
                    <Notice tone="warning">
                        { __( 'Your server does not appear to be Apache or LiteSpeed, so .htaccess rules may be ignored. The <picture> tag method works everywhere.', 'captain-media-shield' ) }
                    </Notice>
                ) }
            </div>

            <SaveBar dirty={ dirty } saving={ saving } onSave={ save } onReset={ reset } onDiscard={ discard } message={ message } messageTone={ tone } />
        </div>
    );
};

export default Images;
