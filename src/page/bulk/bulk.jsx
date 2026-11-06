import React, { useEffect, useState, useMemo } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { bulkRunner } from '../../services/bulkRunner.js';
import { ajax, formatBytes, percentSaved } from '../../services/api.js';
import { PageHeader, Section, Row, Notice, StatCard } from '../../components/ui.jsx';
import { IconBulk, IconImage, IconVideo, IconPlay, IconPause, IconStop, IconCheck, IconX, IconDatabase } from '../../components/icons.jsx';
import './bulk.scss';

const useBulkState = () => {
    const [ state, setState ] = useState( bulkRunner.getState() );
    useEffect( () => bulkRunner.subscribe( setState ), [] );
    return state;
};

const AI_STEPS = [
    __( 'Analyzing image dimensions and EXIF metadata…', 'captain-media-shield' ),
    __( 'Applying smart lossless compression algorithms…', 'captain-media-shield' ),
    __( 'Generating ultra-sharp Next Generation WebP copy…', 'captain-media-shield' ),
    __( 'Optimizing companion thumbnail sizes…', 'captain-media-shield' ),
    __( 'Shrinking byte footprint without quality loss…', 'captain-media-shield' ),
    __( 'Finalizing media records and saving storage…', 'captain-media-shield' ),
];

const Bulk = () => {
    const run = useBulkState();
    const [ scope, setScope ]             = useState( 'all' );
    const [ retryFailed, setRetryFailed ] = useState( false );
    const [ library, setLibrary ]         = useState( null );
    const [ aiStepIndex, setAiStepIndex ] = useState( 0 );
    const [ fadeAnim, setFadeAnim ]       = useState( true );

    const loadLibrary = async () => {
        const result = await ajax( 'get_stats' );
        if ( result.success ) setLibrary( result.data.library );
    };

    useEffect( () => {
        loadLibrary();
    }, [] );

    // Refresh library counts when a run finishes.
    useEffect( () => {
        if ( run.status === 'done' ) loadLibrary();
    }, [ run.status ] );

    // Cycle animated AI status text while running
    useEffect( () => {
        if ( run.status !== 'running' ) return;
        const interval = setInterval( () => {
            setFadeAnim( false );
            setTimeout( () => {
                setAiStepIndex( ( prev ) => ( prev + 1 ) % AI_STEPS.length );
                setFadeAnim( true );
            }, 220 );
        }, 2400 );
        return () => clearInterval( interval );
    }, [ run.status ] );

    const active  = run.status === 'running' || run.status === 'paused' || run.status === 'loading';
    const elapsed = run.startedAt ? ( Date.now() - run.startedAt ) / 1000 : 0;
    const eta     = run.processed && run.status === 'running' ? Math.round( ( elapsed / run.processed ) * ( run.total - run.processed ) ) : 0;

    const remainingForScope = useMemo( () => {
        if ( ! library ) return null;
        if ( scope === 'image' ) return library.image.remaining;
        if ( scope === 'video' ) return library.video.remaining;
        return library.image.remaining + library.video.remaining;
    }, [ library, scope ] );

    const totalForScope = useMemo( () => {
        if ( ! library ) return 0;
        if ( scope === 'image' ) return library.image.total;
        if ( scope === 'video' ) return library.video.total;
        return library.image.total + library.video.total;
    }, [ library, scope ] );

    // Detect when all media in the chosen scope is already optimized
    const isAllOptimized = ! active && (
        ( remainingForScope === 0 && totalForScope > 0 && run.processed === 0 ) ||
        ( run.status === 'done' && run.total === 0 )
    );

    const pct = isAllOptimized
        ? 100
        : ( run.total ? Math.round( ( run.processed / run.total ) * 100 ) : ( run.status === 'done' ? 100 : 0 ) );

    let statusLabel = {
        idle:    __( 'Ready', 'captain-media-shield' ),
        loading: __( 'Building queue…', 'captain-media-shield' ),
        running: __( 'Optimizing…', 'captain-media-shield' ),
        paused:  __( 'Paused', 'captain-media-shield' ),
        done:    run.total ? __( 'Completed', 'captain-media-shield' ) : __( 'All Media Optimized', 'captain-media-shield' ),
    }[ run.status ];

    if ( isAllOptimized ) {
        statusLabel = __( 'All Media Optimized ✨', 'captain-media-shield' );
    }

    return (
        <div className="capms-settings-wrapper capms-bulk-page">
            <PageHeader
                title={ __( 'Bulk Media Optimizer', 'captain-media-shield' ) }
                subtitle={ __( 'Optimize everything already in your Media Library. One file per request - no timeouts, pause and resume any time.', 'captain-media-shield' ) }
            />

            <div className="capms-stat-grid capms-stat-grid--3">
                <StatCard
                    icon={ <IconImage /> }
                    label={ __( 'Images optimized', 'captain-media-shield' ) }
                    value={ library ? `${ library.image.optimized } / ${ library.image.total }` : '…' }
                    sub={ library ? sprintf( /* translators: %d: number of files still to optimize. */ __( '%d remaining', 'captain-media-shield' ), library.image.remaining ) : '' }
                />
                <StatCard
                    icon={ <IconVideo /> }
                    tone="purple"
                    label={ __( 'Videos optimized', 'captain-media-shield' ) }
                    value={ library ? `${ library.video.optimized } / ${ library.video.total }` : '…' }
                    sub={ library ? sprintf( /* translators: %d: number of files still to optimize. */ __( '%d remaining', 'captain-media-shield' ), library.video.remaining ) : '' }
                />
                <StatCard
                    icon={ <IconDatabase /> }
                    tone="green"
                    label={ __( 'Saved this run', 'captain-media-shield' ) }
                    value={ formatBytes( run.savedBytes ) }
                    sub={ run.total ? sprintf( /* translators: %1$d: files processed so far, %2$d: total files in this run. */ __( '%1$d of %2$d files', 'captain-media-shield' ), run.processed, run.total ) : __( 'Start a run to see live savings', 'captain-media-shield' ) }
                />
            </div>

            <div className="capms-settings-sections">
                <Section
                    icon={ <IconBulk /> }
                    title={ __( 'Run the Optimizer', 'captain-media-shield' ) }
                    description={ __( 'Uses your current Image, Video and Backup settings. Already optimized files are skipped.', 'captain-media-shield' ) }
                >
                    <Row label={ __( 'What to optimize', 'captain-media-shield' ) } locked={ active }>
                        <div className="capms-segmented">
                            { [
                                { value: 'all', label: __( 'Images & Videos', 'captain-media-shield' ) },
                                { value: 'image', label: __( 'Images only', 'captain-media-shield' ) },
                                { value: 'video', label: __( 'Videos only', 'captain-media-shield' ) },
                            ].map( ( opt ) => (
                                <button
                                    key={ opt.value }
                                    type="button"
                                    className={ `capms-segmented-btn ${ scope === opt.value ? 'capms-segmented-btn--active' : '' }` }
                                    onClick={ () => setScope( opt.value ) }
                                    disabled={ active }
                                >
                                    { opt.label }
                                </button>
                            ) ) }
                        </div>
                    </Row>
                    <Row label={ __( 'Retry failed / skipped files', 'captain-media-shield' ) } hint={ __( 'Include files that failed or were skipped before (e.g. videos uploaded before FFmpeg was installed).', 'captain-media-shield' ) } locked={ active }>
                        <label className="capms-checkbox">
                            <input type="checkbox" checked={ retryFailed } onChange={ ( e ) => setRetryFailed( e.target.checked ) } disabled={ active } />
                            <span>{ __( 'Retry', 'captain-media-shield' ) }</span>
                        </label>
                    </Row>

                    <div className="capms-bulk-panel">
                        { /* Celebratory Banner when all library files are already optimized */ }
                        { isAllOptimized && (
                            <div className="capms-bulk-all-optimized-banner">
                                <div className="capms-all-opt-icon-wrap">
                                    <span className="capms-all-opt-shield">🛡️</span>
                                    <span className="capms-all-opt-sparkle">✨</span>
                                </div>
                                <div className="capms-all-opt-content">
                                    <span className="capms-all-opt-badge">
                                        <span className="capms-all-opt-dot" />
                                        { __( '100% Up to Date', 'captain-media-shield' ) }
                                    </span>
                                    <h4 className="capms-all-opt-title">
                                        { __( 'All images are optimized! Nothing pending to optimize.', 'captain-media-shield' ) }
                                    </h4>
                                    <p className="capms-all-opt-desc">
                                        { totalForScope > 0
                                            ? sprintf(
                                                /* translators: %d: number of media files. */
                                                __( 'Awesome! All %d media file(s) in your library are already compressed and delivered in Next Generation WebP & AVIF formats.', 'captain-media-shield' ),
                                                totalForScope
                                            )
                                            : __( 'Awesome! All media files in your library are already compressed and delivered in Next Generation WebP & AVIF formats.', 'captain-media-shield' ) }
                                    </p>
                                </div>
                            </div>
                        ) }

                        { /* Celebratory Completion Card when finished */ }
                        { run.status === 'done' && run.processed > 0 && (
                            <div className="capms-bulk-done-card">
                                <div className="capms-done-badge-wrap">
                                    <span className="capms-done-badge-icon">🎉</span>
                                </div>
                                <div className="capms-done-text">
                                    <h4 className="capms-done-title">
                                        { run.failed === 0
                                            ? __( 'All Media Optimized Successfully!', 'captain-media-shield' )
                                            : sprintf( /* translators: 1: succeeded count, 2: failed count */ __( 'Optimization Finished (%1$d succeeded, %2$d failed)', 'captain-media-shield' ), run.succeeded, run.failed ) }
                                    </h4>
                                    <p className="capms-done-desc">
                                        { sprintf(
                                            /* translators: 1: processed files, 2: saved size formatted */
                                            __( 'Great job! Processed %1$d file(s) and saved %2$s of server storage.', 'captain-media-shield' ),
                                            run.processed,
                                            formatBytes( run.savedBytes )
                                        ) }
                                    </p>
                                </div>
                            </div>
                        ) }

                        { /* Live AI Processing Spotlight Banner while running/paused */ }
                        { ( run.status === 'running' || run.status === 'paused' ) && (
                            <div className="capms-bulk-live-spotlight">
                                <div className="capms-live-thumb-wrap">
                                    { run.currentThumb ? (
                                        <img src={ run.currentThumb } alt="" className="capms-live-thumb-img" />
                                    ) : (
                                        <div className="capms-live-thumb-placeholder">
                                            <IconImage />
                                        </div>
                                    ) }
                                    <span className="capms-live-pulse-badge" />
                                </div>

                                <div className="capms-live-details">
                                    <div className="capms-live-head-row">
                                        <span className={ `capms-live-tag ${ run.status === 'paused' ? 'capms-live-tag--paused' : '' }` }>
                                            <span className="capms-live-sparkle">✨</span>
                                            { run.status === 'paused' ? __( 'PAUSED', 'captain-media-shield' ) : __( 'NOW OPTIMIZING', 'captain-media-shield' ) }
                                        </span>
                                        <span className="capms-live-progress-badge">
                                            { sprintf( /* translators: %1$d: current file, %2$d: total files. */ __( 'File %1$d of %2$d', 'captain-media-shield' ), Math.min( run.processed + 1, run.total ), run.total ) }
                                        </span>
                                    </div>

                                    <div className="capms-live-filename" title={ run.currentTitle }>
                                        { run.currentTitle || sprintf( __( 'Processing Attachment #%d…', 'captain-media-shield' ), run.current ) }
                                    </div>

                                    <div className={ `capms-live-ai-msg ${ fadeAnim ? 'is-visible' : 'is-fading' }` }>
                                        <span className="capms-ai-icon">⚡</span>
                                        <span>{ AI_STEPS[ aiStepIndex ] }</span>
                                    </div>
                                </div>
                            </div>
                        ) }

                        <div className="capms-bulk-head">
                            <div>
                                <span className={ `capms-bulk-status ${ isAllOptimized ? 'capms-bulk-status--all-done' : `capms-bulk-status--${ run.status }` }` }>{ statusLabel }</span>
                                { run.status === 'running' && eta > 0 && (
                                    <span className="capms-bulk-eta">{ sprintf( /* translators: %s: estimated time remaining, for example "2 min" or "45 s". */ __( '~%s left', 'captain-media-shield' ), eta > 90 ? sprintf( /* translators: %d: number of minutes. */ __( '%d min', 'captain-media-shield' ), Math.round( eta / 60 ) ) : sprintf( /* translators: %d: number of seconds. */ __( '%d s', 'captain-media-shield' ), eta ) ) }</span>
                                ) }
                            </div>
                            <span className="capms-bulk-pct">{ pct }%</span>
                        </div>

                        <div className="capms-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={ pct }>
                            <div className={ `capms-progress-bar ${ run.status === 'running' ? 'capms-progress-bar--animated' : '' } ${ isAllOptimized ? 'capms-progress-bar--success' : '' }` } style={ { width: `${ pct }%` } } />
                        </div>

                        { isAllOptimized ? (
                            <div className="capms-bulk-counts capms-bulk-counts--all-done">
                                <span className="capms-text-brand">
                                    <IconCheck />
                                    { sprintf(
                                        /* translators: %d: total media files optimized */
                                        __( '%d Media Files Fully Protected & Compressed', 'captain-media-shield' ),
                                        totalForScope || ( library ? library.image.total + library.video.total : 0 )
                                    ) }
                                </span>
                                <span className="capms-all-done-pill">
                                    { __( 'WebP & AVIF Active', 'captain-media-shield' ) }
                                </span>
                            </div>
                        ) : (
                            <div className="capms-bulk-counts">
                                <span>{ sprintf( /* translators: %1$d: files processed so far, %2$d: total files in this run. */ __( 'Processed: %1$d / %2$d', 'captain-media-shield' ), run.processed, run.total ) }</span>
                                <span className="capms-text-success">{ sprintf( /* translators: %d: number of files optimized successfully. */ __( 'Succeeded: %d', 'captain-media-shield' ), run.succeeded ) }</span>
                                <span className="capms-text-error">{ sprintf( /* translators: %d: number of files that failed. */ __( 'Failed: %d', 'captain-media-shield' ), run.failed ) }</span>
                            </div>
                        ) }

                        <div className="capms-bulk-actions">
                            { isAllOptimized ? (
                                <div className="capms-bulk-actions-done">
                                    <button
                                        type="button"
                                        className="capms-btn capms-btn--success-done"
                                        disabled
                                    >
                                        <IconCheck />
                                        { __( 'All Media Optimized', 'captain-media-shield' ) }
                                    </button>

                                    <a
                                        href="#/"
                                        className="capms-btn capms-btn--ghost"
                                    >
                                        <IconDatabase />
                                        { __( 'View Dashboard Stats', 'captain-media-shield' ) }
                                    </a>

                                    <button
                                        type="button"
                                        className="capms-btn capms-btn--subtle-text"
                                        onClick={ () => bulkRunner.start( scope, true ) }
                                        title={ __( 'Scan media library again for any new uploads', 'captain-media-shield' ) }
                                    >
                                        { __( 'Scan Again', 'captain-media-shield' ) }
                                    </button>
                                </div>
                            ) : run.status === 'done' && run.processed > 0 ? (
                                <div className="capms-bulk-actions-done">
                                    <button
                                        type="button"
                                        className="capms-btn capms-btn--success-done"
                                        disabled
                                    >
                                        <IconCheck />
                                        { __( 'Optimization Complete', 'captain-media-shield' ) }
                                    </button>

                                    { run.failed > 0 && (
                                        <button
                                            type="button"
                                            className="capms-btn capms-btn--warning"
                                            onClick={ () => {
                                                setRetryFailed( true );
                                                bulkRunner.start( scope, true );
                                            } }
                                        >
                                            <IconPlay />
                                            { sprintf( /* translators: %d: failed files count */ __( 'Retry Failed (%d)', 'captain-media-shield' ), run.failed ) }
                                        </button>
                                    ) }

                                    <a
                                        href="#/"
                                        className="capms-btn capms-btn--ghost"
                                    >
                                        <IconDatabase />
                                        { __( 'View Dashboard Stats', 'captain-media-shield' ) }
                                    </a>

                                    <button
                                        type="button"
                                        className="capms-btn capms-btn--subtle-text"
                                        onClick={ () => bulkRunner.start( scope, retryFailed ) }
                                        title={ __( 'Check for any newly uploaded images', 'captain-media-shield' ) }
                                    >
                                        { __( 'Scan Again', 'captain-media-shield' ) }
                                    </button>
                                </div>
                            ) : (
                                ( run.status === 'idle' || run.status === 'done' ) && (
                                    <button type="button" className="capms-btn capms-btn--primary" onClick={ () => bulkRunner.start( scope, retryFailed ) }>
                                        <IconPlay />
                                        { __( 'Start Bulk Optimization', 'captain-media-shield' ) }
                                    </button>
                                )
                            ) }

                            { run.status === 'loading' && (
                                <button type="button" className="capms-btn capms-btn--primary" disabled>
                                    <span className="capms-settings-btn-spinner" />
                                    { __( 'Preparing…', 'captain-media-shield' ) }
                                </button>
                            ) }

                            { run.status === 'running' && (
                                <>
                                    <button type="button" className="capms-btn capms-btn--warning" onClick={ () => bulkRunner.pause() }>
                                        <IconPause />
                                        { __( 'Pause', 'captain-media-shield' ) }
                                    </button>
                                    <button
                                        type="button"
                                        className="capms-btn capms-btn--danger-outline"
                                        onClick={ () => {
                                            if ( window.confirm( __( 'Are you sure you want to stop bulk optimization? You can resume any time.', 'captain-media-shield' ) ) ) {
                                                bulkRunner.stop();
                                            }
                                        } }
                                    >
                                        <IconStop />
                                        { __( 'Stop Optimization', 'captain-media-shield' ) }
                                    </button>
                                </>
                            ) }

                            { run.status === 'paused' && (
                                <>
                                    <button type="button" className="capms-btn capms-btn--primary" onClick={ () => bulkRunner.resume() }>
                                        <IconPlay />
                                        { __( 'Resume Optimization', 'captain-media-shield' ) }
                                    </button>
                                    <button type="button" className="capms-btn capms-btn--danger-outline" onClick={ () => bulkRunner.stop() }>
                                        <IconStop />
                                        { __( 'Stop & Reset', 'captain-media-shield' ) }
                                    </button>
                                </>
                            ) }
                        </div>
                    </div>
                </Section>

                { run.status === 'running' && (
                    <Notice tone="info">
                        { __( 'You can switch to other pages of this plugin - the optimizer keeps running. Closing or reloading this browser tab pauses it; just start again to continue where it left off.', 'captain-media-shield' ) }
                    </Notice>
                ) }

                { run.log.length > 0 && (
                    <Section icon={ <IconCheck /> } title={ __( 'Live Activity', 'captain-media-shield' ) }>
                        <ul className="capms-log">
                            { run.log.map( ( item, i ) => (
                                <li key={ `${ item.id }-${ i }` } className={ `capms-log-item ${ item.ok ? '' : 'capms-log-item--error' }` }>
                                    { item.thumb ? (
                                        <img src={ item.thumb } alt="" className="capms-log-thumb" />
                                    ) : (
                                        <span className="capms-log-icon">{ item.ok ? <IconCheck /> : <IconX /> }</span>
                                    ) }
                                    <div className="capms-log-content">
                                        <span className="capms-log-title">{ item.title }</span>
                                        <span className="capms-log-meta">
                                            { item.ok && item.status === 'optimized'
                                                ? <>
                                                    <span className="capms-size-flow">{ `${ formatBytes( item.before ) } → ${ formatBytes( item.after ) }` }</span>
                                                    <strong className="capms-saved-badge">{ ` −${ percentSaved( item.before, item.after ) }%` }</strong>
                                                    { item.webp && <em className="capms-pill-format">WebP</em> }
                                                    { item.avif && <em className="capms-pill-format">AVIF</em> }
                                                    { item.webm && <em className="capms-pill-format">WebM</em> }
                                                </>
                                                : ( item.message || item.status ) }
                                        </span>
                                    </div>
                                </li>
                            ) ) }
                        </ul>
                    </Section>
                ) }
            </div>
        </div>
    );
};

export default Bulk;
