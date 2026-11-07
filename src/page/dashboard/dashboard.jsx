import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import { ajax, formatBytes, percentSaved } from '../../services/api.js';
import { setStats } from '../../redux/slice.jsx';
import { PageHeader, Section, StatCard, StatusPill, Skeleton, Notice } from '../../components/ui.jsx';
import { IconDatabase, IconZap, IconPercent, IconBackup, IconImage, IconVideo, IconHealth, IconRefresh, IconBulk } from '../../components/icons.jsx';
import { OVERVIEW_VIDEO_URL } from '../../constants/videos.js';

const Dashboard = () => {
    const dispatch = useDispatch();
    const stats    = useSelector( state => state.stats );
    const [ env, setEnv ]         = useState( null );
    const [ loading, setLoading ] = useState( false );
    const [ error, setError ]     = useState( '' );

    const load = async () => {
        setLoading( true );
        setError( '' );
        try {
            const [ s, e ] = await Promise.all( [ ajax( 'get_stats' ), ajax( 'get_environment' ) ] );
            if ( s && s.success ) {
                dispatch( setStats( s.data ) );
            } else if ( s && s.data && s.data.message ) {
                setError( s.data.message );
            }
            if ( e && e.success ) {
                setEnv( e.data );
            }
        } catch ( err ) {
            setError( err?.message || __( 'Failed to load dashboard data. Please try again.', 'captain-media-shield' ) );
        } finally {
            setLoading( false );
        }
    };

    useEffect( () => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    const summary = stats?.summary;
    const images  = summary?.images || {};
    const videos  = summary?.videos || {};
    const library = stats?.library;
    const remaining = library ? library.image.remaining + library.video.remaining : 0;

    return (
        <div className="capms-settings-wrapper">
            <PageHeader
                title={ __( 'Analytics & Server Health', 'captain-media-shield' ) }
                subtitle={ __( 'What Captain Media Shield has saved on your server so far.', 'captain-media-shield' ) }
                actions={
                    <>
                        <a
                            href={ OVERVIEW_VIDEO_URL }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="capms-btn capms-btn--ghost"
                            style={ { textDecoration: 'none' } }
                            title={ __( 'Watch Plugin Overview & Tutorial', 'captain-media-shield' ) }
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff0000" style={ { flexShrink: 0 } }>
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            <span>{ __( 'Watch Tutorial', 'captain-media-shield' ) }</span>
                        </a>
                        <button type="button" className="capms-btn capms-btn--ghost" onClick={ load } disabled={ loading }>
                            <IconRefresh />
                            { loading ? __( 'Refreshing…', 'captain-media-shield' ) : __( 'Refresh', 'captain-media-shield' ) }
                        </button>
                    </>
                }
            />

            { error && <Notice tone="error">{ error }</Notice> }

            { ! summary ? (
                <div className="capms-stat-grid">
                    <Skeleton height={ 96 } /><Skeleton height={ 96 } /><Skeleton height={ 96 } /><Skeleton height={ 96 } />
                </div>
            ) : (
                <div className="capms-stat-grid">
                    <StatCard icon={ <IconDatabase /> } tone="green" label={ __( 'Total Storage Saved', 'captain-media-shield' ) } value={ formatBytes( summary.saved_bytes ) } sub={ sprintf( /* translators: %1$s: size before optimization, %2$s: size after optimization. */ __( '%1$s → %2$s', 'captain-media-shield' ), formatBytes( summary.original_size ), formatBytes( summary.optimized_size ) ) } />
                    <StatCard icon={ <IconZap /> } label={ __( 'Total Media Processed', 'captain-media-shield' ) } value={ summary.processed } sub={ sprintf( /* translators: %1$d: number of images, %2$d: number of videos. */ __( '%1$d images · %2$d videos', 'captain-media-shield' ), images.processed || 0, videos.processed || 0 ) } />
                    <StatCard icon={ <IconPercent /> } tone="purple" label={ __( 'Compression Ratio', 'captain-media-shield' ) } value={ `${ summary.ratio }%` } sub={ __( 'Average size reduction', 'captain-media-shield' ) } />
                    <StatCard icon={ <IconBackup /> } tone="orange" label={ __( 'Backups on Disk', 'captain-media-shield' ) } value={ stats.backup_disk?.human || '0 B' } sub={ sprintf( /* translators: %d: number of backed-up original files. */ __( '%d original file(s)', 'captain-media-shield' ), stats.backup_disk?.files || 0 ) } />
                </div>
            ) }

            { remaining > 0 && (
                <div className="capms-cta">
                    <div>
                        <strong>{ sprintf( /* translators: %d: number of files not optimized yet. */ __( '%d file(s) in your Media Library are not optimized yet.', 'captain-media-shield' ), remaining ) }</strong>
                        <span>{ __( 'Run the Bulk Optimizer to compress them and create WebP/AVIF/WebM versions.', 'captain-media-shield' ) }</span>
                    </div>
                    <Link to="/bulk" className="capms-btn capms-btn--primary"><IconBulk />{ __( 'Open Bulk Optimizer', 'captain-media-shield' ) }</Link>
                </div>
            ) }

            <div className="capms-dash-grid">
                <Section icon={ <IconImage /> } title={ __( 'Images', 'captain-media-shield' ) }>
                    <div className="capms-breakdown">
                        <div><span>{ __( 'Optimized', 'captain-media-shield' ) }</span><strong>{ images.processed || 0 }</strong></div>
                        <div><span>{ __( 'Saved', 'captain-media-shield' ) }</span><strong>{ formatBytes( ( images.original_size || 0 ) - ( images.optimized_size || 0 ) ) }</strong></div>
                        <div><span>{ __( 'Reduction', 'captain-media-shield' ) }</span><strong>{ percentSaved( images.original_size, images.optimized_size ) }%</strong></div>
                        <div><span>{ __( 'WebP versions', 'captain-media-shield' ) }</span><strong>{ images.webp_count || 0 }</strong></div>
                        <div><span>{ __( 'AVIF versions', 'captain-media-shield' ) }</span><strong>{ images.avif_count || 0 }</strong></div>
                        <div><span>{ __( 'Next Generation size', 'captain-media-shield' ) }</span><strong>{ formatBytes( ( images.webp_size || 0 ) + ( images.avif_size || 0 ) ) }</strong></div>
                    </div>
                </Section>
                <Section icon={ <IconVideo /> } title={ __( 'Videos', 'captain-media-shield' ) }>
                    <div className="capms-breakdown">
                        <div><span>{ __( 'Optimized', 'captain-media-shield' ) }</span><strong>{ videos.processed || 0 }</strong></div>
                        <div><span>{ __( 'Saved', 'captain-media-shield' ) }</span><strong>{ formatBytes( ( videos.original_size || 0 ) - ( videos.optimized_size || 0 ) ) }</strong></div>
                        <div><span>{ __( 'Reduction', 'captain-media-shield' ) }</span><strong>{ percentSaved( videos.original_size, videos.optimized_size ) }%</strong></div>
                        <div><span>{ __( 'WebM versions', 'captain-media-shield' ) }</span><strong>{ videos.webm_count || 0 }</strong></div>
                        <div><span>{ __( 'Queued', 'captain-media-shield' ) }</span><strong>{ summary?.queued || 0 }</strong></div>
                        <div><span>{ __( 'Skipped / Failed', 'captain-media-shield' ) }</span><strong>{ ( summary?.skipped || 0 ) + ( summary?.failed || 0 ) }</strong></div>
                    </div>
                </Section>
            </div>

            <div className="capms-dash-grid">
                <Section icon={ <IconZap /> } title={ __( 'Recent Activity', 'captain-media-shield' ) }>
                    { stats?.recent?.length ? (
                        <ul className="capms-recent">
                            { stats.recent.map( ( item ) => (
                                <li key={ item.attachment_id }>
                                    <span className="capms-recent-thumb">
                                        { item.thumb ? <img src={ item.thumb } alt="" /> : ( item.media_type === 'video' ? <IconVideo /> : <IconImage /> ) }
                                    </span>
                                    <span className="capms-recent-main">
                                        <a href={ item.edit_link } className="capms-recent-title">{ item.title || `#${ item.attachment_id }` }</a>
                                        <span className="capms-recent-sub">
                                            { item.status === 'optimized'
                                                ? `${ formatBytes( item.original_size ) } → ${ formatBytes( item.optimized_size ) }`
                                                : ( item.message || item.status ) }
                                        </span>
                                    </span>
                                    <span className={ `capms-recent-status capms-recent-status--${ item.status }` }>
                                        { item.status === 'optimized' ? `−${ percentSaved( item.original_size, item.optimized_size ) }%` : item.status }
                                    </span>
                                </li>
                            ) ) }
                        </ul>
                    ) : (
                        <p className="capms-empty">{ __( 'Nothing processed yet. Upload a file or run the Bulk Optimizer.', 'captain-media-shield' ) }</p>
                    ) }
                </Section>

                <Section
                    icon={ <IconHealth /> }
                    title={ __( 'Server Environment', 'captain-media-shield' ) }
                    badge={ <Link to="/health" className="capms-section-link">{ __( 'Full report →', 'captain-media-shield' ) }</Link> }
                >
                    { ! env ? <Skeleton height={ 180 } /> : (
                        <ul className="capms-env-list">
                            <li><span>{ __( 'GD Library', 'captain-media-shield' ) }</span><StatusPill ok={ env.gd } yes={ env.gd_version || __( 'Installed', 'captain-media-shield' ) } no={ __( 'Missing', 'captain-media-shield' ) } /></li>
                            <li><span>{ __( 'Imagick', 'captain-media-shield' ) }</span><StatusPill ok={ env.imagick } yes={ __( 'Installed', 'captain-media-shield' ) } no={ __( 'Missing', 'captain-media-shield' ) } /></li>
                            <li><span>{ __( 'WebP Support', 'captain-media-shield' ) }</span><StatusPill ok={ env.webp } /></li>
                            <li><span>{ __( 'AVIF Support', 'captain-media-shield' ) }</span><StatusPill ok={ env.avif } /></li>
                            <li><span>{ __( 'FFmpeg Binary', 'captain-media-shield' ) }</span><StatusPill ok={ env.ffmpeg } yes={ __( 'Detected', 'captain-media-shield' ) } no={ __( 'Not found', 'captain-media-shield' ) } /></li>
                            <li><span>{ __( 'Server Memory Limit', 'captain-media-shield' ) }</span><strong>{ env.memory_limit }</strong></li>
                            <li><span>{ __( 'Max Upload Limit', 'captain-media-shield' ) }</span><strong>{ env.max_upload }</strong></li>
                        </ul>
                    ) }
                </Section>
            </div>
        </div>
    );
};

export default Dashboard;
