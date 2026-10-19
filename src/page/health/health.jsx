import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { ajax } from '../../services/api.js';
import { PageHeader, Section, StatusPill, Notice, Skeleton } from '../../components/ui.jsx';
import { IconImage, IconVideo, IconHealth, IconRefresh } from '../../components/icons.jsx';

const Line = ( { label, children, hint } ) => (
    <li>
        <span className="capms-env-label">
            { label }
            { hint && <small>{ hint }</small> }
        </span>
        <span className="capms-env-value">{ children }</span>
    </li>
);

const Health = () => {
    const [ env, setEnv ]         = useState( null );
    const [ loading, setLoading ] = useState( false );

    const load = async ( refresh = false ) => {
        setLoading( true );
        const result = await ajax( 'get_environment', refresh ? { refresh: 1 } : {} );
        setLoading( false );
        if ( result.success ) setEnv( result.data );
    };

    useEffect( () => {
        load();
    }, [] );

    return (
        <div className="capms-settings-wrapper">
            <PageHeader
                title={ __( 'Server Environment Status', 'captain-media-shield' ) }
                subtitle={ __( 'Everything Captain Media Shield needs, checked live on this server.', 'captain-media-shield' ) }
                actions={
                    <button type="button" className="capms-btn capms-btn--ghost" onClick={ () => load( true ) } disabled={ loading }>
                        <IconRefresh />
                        { loading ? __( 'Checking…', 'captain-media-shield' ) : __( 'Re-run Checks', 'captain-media-shield' ) }
                    </button>
                }
            />

            { ! env ? <Skeleton height={ 320 } /> : (
                <div className="capms-settings-sections">
                    { ! env.uploads_writable && (
                        <Notice tone="error">{ __( 'The uploads folder is not writable - optimization and backups cannot run.', 'captain-media-shield' ) }</Notice>
                    ) }

                    <div className="capms-dash-grid">
                        <Section icon={ <IconImage /> } title={ __( 'Image Engines', 'captain-media-shield' ) }>
                            <ul className="capms-env-list">
                                <Line label={ __( 'GD Library', 'captain-media-shield' ) } hint={ env.gd_version }><StatusPill ok={ env.gd } yes={ __( 'Installed', 'captain-media-shield' ) } no={ __( 'Missing', 'captain-media-shield' ) } /></Line>
                                <Line label={ __( 'GD WebP / AVIF', 'captain-media-shield' ) }>
                                    <span className="capms-pill-pair">
                                        <StatusPill ok={ env.gd_webp } yes="WebP" no="WebP" />
                                        <StatusPill ok={ env.gd_avif } yes="AVIF" no="AVIF" />
                                    </span>
                                </Line>
                                <Line label={ __( 'Imagick', 'captain-media-shield' ) } hint={ env.imagick_version }><StatusPill ok={ env.imagick } yes={ __( 'Installed', 'captain-media-shield' ) } no={ __( 'Missing', 'captain-media-shield' ) } /></Line>
                                <Line label={ __( 'Imagick WebP / AVIF', 'captain-media-shield' ) }>
                                    <span className="capms-pill-pair">
                                        <StatusPill ok={ env.imagick_webp } yes="WebP" no="WebP" />
                                        <StatusPill ok={ env.imagick_avif } yes="AVIF" no="AVIF" />
                                    </span>
                                </Line>
                                <Line label={ __( 'WebP output (WordPress)', 'captain-media-shield' ) }><StatusPill ok={ env.webp } /></Line>
                                <Line label={ __( 'AVIF output (WordPress)', 'captain-media-shield' ) }><StatusPill ok={ env.avif } /></Line>
                            </ul>
                        </Section>

                        <Section icon={ <IconVideo /> } title={ __( 'Video Engine', 'captain-media-shield' ) }>
                            <ul className="capms-env-list">
                                <Line label={ __( 'exec() function', 'captain-media-shield' ) }><StatusPill ok={ env.exec } yes={ __( 'Enabled', 'captain-media-shield' ) } no={ __( 'Disabled', 'captain-media-shield' ) } /></Line>
                                <Line label={ __( 'FFmpeg Binary', 'captain-media-shield' ) } hint={ env.ffmpeg_path }><StatusPill ok={ env.ffmpeg } yes={ __( 'Detected', 'captain-media-shield' ) } no={ __( 'Not found', 'captain-media-shield' ) } /></Line>
                                <Line label={ __( 'H.264 encoder (libx264)', 'captain-media-shield' ) }><StatusPill ok={ env.ffmpeg_x264 } /></Line>
                                <Line label={ __( 'VP9 encoder (libvpx-vp9)', 'captain-media-shield' ) }><StatusPill ok={ env.ffmpeg_vp9 } /></Line>
                            </ul>
                            { env.ffmpeg_version && <p className="capms-mono">{ env.ffmpeg_version }</p> }
                        </Section>
                    </div>

                    <Section icon={ <IconHealth /> } title={ __( 'Server & Limits', 'captain-media-shield' ) }>
                        <ul className="capms-env-list capms-env-list--cols">
                            <Line label={ __( 'Server Memory Limit', 'captain-media-shield' ) } hint={ env.wp_memory_limit ? `WP_MEMORY_LIMIT: ${ env.wp_memory_limit }` : '' }><strong>{ env.memory_limit }</strong></Line>
                            <Line label={ __( 'Max Upload Limit', 'captain-media-shield' ) }><strong>{ env.max_upload }</strong></Line>
                            <Line label={ __( 'Max Execution Time', 'captain-media-shield' ) }><strong>{ env.max_execution ? `${ env.max_execution }s` : __( 'Unlimited', 'captain-media-shield' ) }</strong></Line>
                            <Line label={ __( 'PHP Version', 'captain-media-shield' ) }><strong>{ env.php_version }</strong></Line>
                            <Line label={ __( 'WordPress Version', 'captain-media-shield' ) }><strong>{ env.wp_version }</strong></Line>
                            <Line label={ __( 'Web Server', 'captain-media-shield' ) } hint={ env.server_software }><StatusPill ok={ env.htaccess_capable } yes={ __( '.htaccess supported', 'captain-media-shield' ) } no={ __( 'No .htaccess', 'captain-media-shield' ) } /></Line>
                            <Line label={ __( 'Uploads folder writable', 'captain-media-shield' ) }><StatusPill ok={ env.uploads_writable } yes={ __( 'Writable', 'captain-media-shield' ) } no={ __( 'Not writable', 'captain-media-shield' ) } /></Line>
                        </ul>
                    </Section>
                </div>
            ) }
        </div>
    );
};

export default Health;
