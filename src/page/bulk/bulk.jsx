import React, { useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { bulkRunner } from '../../services/bulkRunner.js';
import { ajax, formatBytes, percentSaved } from '../../services/api.js';
import { PageHeader, Section, Row, Notice, StatCard } from '../../components/ui.jsx';
import { IconBulk, IconImage, IconVideo, IconPlay, IconPause, IconStop, IconCheck, IconX, IconDatabase } from '../../components/icons.jsx';

const useBulkState = () => {
    const [ state, setState ] = useState( bulkRunner.getState() );
    useEffect( () => bulkRunner.subscribe( setState ), [] );
    return state;
};

const Bulk = () => {
    const run = useBulkState();
    const [ scope, setScope ]             = useState( 'all' );
    const [ retryFailed, setRetryFailed ] = useState( false );
    const [ library, setLibrary ]         = useState( null );

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

    const pct     = run.total ? Math.round( ( run.processed / run.total ) * 100 ) : 0;
    const active  = run.status === 'running' || run.status === 'paused' || run.status === 'loading';
    const elapsed = run.startedAt ? ( Date.now() - run.startedAt ) / 1000 : 0;
    const eta     = run.processed && run.status === 'running' ? Math.round( ( elapsed / run.processed ) * ( run.total - run.processed ) ) : 0;

    const statusLabel = {
        idle:    __( 'Ready', 'captain-media-shield' ),
        loading: __( 'Building queue…', 'captain-media-shield' ),
        running: __( 'Optimizing…', 'captain-media-shield' ),
        paused:  __( 'Paused', 'captain-media-shield' ),
        done:    run.total ? __( 'Completed', 'captain-media-shield' ) : __( 'Nothing to optimize', 'captain-media-shield' ),
    }[ run.status ];

    return (
        <div className="capms-settings-wrapper">
            <PageHeader
                title={ __( 'Bulk Media Optimizer', 'captain-media-shield' ) }
                subtitle={ __( 'Optimize everything already in your Media Library. One file per request - no timeouts, pause and resume any time.', 'captain-media-shield' ) }
            />

            <div className="capms-stat-grid capms-stat-grid--3">
                <StatCard
                    icon={ <IconImage /> }
                    label={ __( 'Images optimized', 'captain-media-shield' ) }
                    value={ library ? `${ library.image.optimized } / ${ library.image.total }` : '…' }
                    sub={ library ? sprintf( __( '%d remaining', 'captain-media-shield' ), library.image.remaining ) : '' }
                />
                <StatCard
                    icon={ <IconVideo /> }
                    tone="purple"
                    label={ __( 'Videos optimized', 'captain-media-shield' ) }
                    value={ library ? `${ library.video.optimized } / ${ library.video.total }` : '…' }
                    sub={ library ? sprintf( __( '%d remaining', 'captain-media-shield' ), library.video.remaining ) : '' }
                />
                <StatCard
                    icon={ <IconDatabase /> }
                    tone="green"
                    label={ __( 'Saved this run', 'captain-media-shield' ) }
                    value={ formatBytes( run.savedBytes ) }
                    sub={ run.total ? sprintf( __( '%1$d of %2$d files', 'captain-media-shield' ), run.processed, run.total ) : __( 'Start a run to see live savings', 'captain-media-shield' ) }
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
                        <div className="capms-bulk-head">
                            <div>
                                <span className={ `capms-bulk-status capms-bulk-status--${ run.status }` }>{ statusLabel }</span>
                                { run.status === 'running' && eta > 0 && (
                                    <span className="capms-bulk-eta">{ sprintf( __( '~%s left', 'captain-media-shield' ), eta > 90 ? `${ Math.round( eta / 60 ) } min` : `${ eta } s` ) }</span>
                                ) }
                            </div>
                            <span className="capms-bulk-pct">{ pct }%</span>
                        </div>

                        <div className="capms-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={ pct }>
                            <div className={ `capms-progress-bar ${ run.status === 'running' ? 'capms-progress-bar--animated' : '' }` } style={ { width: `${ pct }%` } } />
                        </div>

                        <div className="capms-bulk-counts">
                            <span>{ sprintf( __( 'Processed: %1$d / %2$d', 'captain-media-shield' ), run.processed, run.total ) }</span>
                            <span className="capms-text-success">{ sprintf( __( 'Succeeded: %d', 'captain-media-shield' ), run.succeeded ) }</span>
                            <span className="capms-text-error">{ sprintf( __( 'Failed: %d', 'captain-media-shield' ), run.failed ) }</span>
                        </div>

                        <div className="capms-bulk-actions">
                            { ( run.status === 'idle' || run.status === 'done' ) && (
                                <button type="button" className="capms-btn capms-btn--primary" onClick={ () => bulkRunner.start( scope, retryFailed ) }>
                                    <IconPlay />
                                    { run.status === 'done' ? __( 'Run Again', 'captain-media-shield' ) : __( 'Start Bulk Optimization', 'captain-media-shield' ) }
                                </button>
                            ) }
                            { run.status === 'loading' && (
                                <button type="button" className="capms-btn capms-btn--primary" disabled>
                                    <span className="capms-settings-btn-spinner" />
                                    { __( 'Preparing…', 'captain-media-shield' ) }
                                </button>
                            ) }
                            { run.status === 'running' && (
                                <button type="button" className="capms-btn capms-btn--warning" onClick={ () => bulkRunner.pause() }>
                                    <IconPause />
                                    { __( 'Pause', 'captain-media-shield' ) }
                                </button>
                            ) }
                            { run.status === 'paused' && (
                                <button type="button" className="capms-btn capms-btn--primary" onClick={ () => bulkRunner.resume() }>
                                    <IconPlay />
                                    { __( 'Resume', 'captain-media-shield' ) }
                                </button>
                            ) }
                            { ( run.status === 'running' || run.status === 'paused' ) && (
                                <button type="button" className="capms-btn capms-btn--ghost" onClick={ () => bulkRunner.stop() }>
                                    <IconStop />
                                    { __( 'Stop', 'captain-media-shield' ) }
                                </button>
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
                                    <span className="capms-log-icon">{ item.ok ? <IconCheck /> : <IconX /> }</span>
                                    <span className="capms-log-title">{ item.title }</span>
                                    <span className="capms-log-meta">
                                        { item.ok && item.status === 'optimized'
                                            ? <>
                                                { `${ formatBytes( item.before ) } → ${ formatBytes( item.after ) }` }
                                                <strong>{ ` −${ percentSaved( item.before, item.after ) }%` }</strong>
                                                { item.webp && <em>WebP</em> }
                                                { item.avif && <em>AVIF</em> }
                                                { item.webm && <em>WebM</em> }
                                            </>
                                            : ( item.message || item.status ) }
                                    </span>
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
