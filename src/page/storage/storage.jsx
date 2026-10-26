import React, { useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { ajax, formatBytes } from '../../services/api.js';
import { loadLibrary, scanBatches } from '../../services/cleanupScan.js';
import { PageHeader, Section, StatCard, Notice } from '../../components/ui.jsx';
import { IconDatabase, IconPlay, IconStop, IconRefresh, IconZap, IconLayers, IconBackup } from '../../components/icons.jsx';
import '../cleanup/cleanup.scss';

const empty = () => ( {
    count: 0, main: 0, sizes: 0, extras: 0,
    types: {}, folders: {}, top: [],
    unoptimizedBytes: 0, unoptimizedCount: 0,
} );

const addItems = ( agg, items ) => {
    const next = { ...agg, types: { ...agg.types }, folders: { ...agg.folders }, top: [ ...agg.top ] };
    items.forEach( ( it ) => {
        const total = it.main + it.sizes + it.extras;
        next.count += 1;
        next.main += it.main;
        next.sizes += it.sizes;
        next.extras += it.extras;
        next.types[ it.type ] = ( next.types[ it.type ] || 0 ) + total;
        const year = ( it.folder.split( '/' )[ 0 ] || '/' );
        next.folders[ year ] = ( next.folders[ year ] || 0 ) + total;
        next.top.push( { id: it.id, title: it.title || it.path, path: it.path, edit: it.edit, total } );
        if ( ! it.optimized && ( it.mime === 'image/jpeg' || it.mime === 'image/png' ) ) {
            next.unoptimizedBytes += it.main + it.sizes;
            next.unoptimizedCount += 1;
        }
    } );
    next.top = next.top.sort( ( a, b ) => b.total - a.total ).slice( 0, 15 );
    return next;
};

const Bars = ( { rows, total } ) => (
    <ul className="capms-st-bars">
        { rows.map( ( [ name, bytes ] ) => (
            <li key={ name }>
                <span className="capms-st-bar-label">{ name }</span>
                <span className="capms-st-bar-track"><span className="capms-st-bar-fill" style={ { width: `${ total ? Math.max( 2, ( bytes / total ) * 100 ) : 0 }%` } } /></span>
                <span className="capms-st-bar-value">{ formatBytes( bytes ) }</span>
            </li>
        ) ) }
    </ul>
);

const Storage = () => {
    const cancel                = useRef( false );
    const [ state, setState ]   = useState( 'idle' );
    const [ progress, setProg ] = useState( { done: 0, total: 0 } );
    const [ agg, setAgg ]       = useState( empty() );
    const [ ratio, setRatio ]   = useState( 0.3 );
    const [ backup, setBackup ] = useState( 0 );
    const [ error, setError ]   = useState( '' );

    const start = async () => {
        cancel.current = false;
        setError( '' );
        setAgg( empty() );
        setState( 'scanning' );
        let running = empty();
        try {
            const [ lib, stats ] = await Promise.all( [ loadLibrary(), ajax( 'get_stats' ) ] );
            setRatio( lib.estimate_ratio || 0.3 );
            setBackup( stats?.data?.backup_disk?.bytes || 0 );
            setProg( { done: 0, total: lib.ids.length } );
            await scanBatches( {
                ids: lib.ids, mode: 'storage', size: 25, cancel,
                onData: ( data ) => { running = addItems( running, data.items || [] ); setAgg( running ); },
                onProgress: ( done, total ) => setProg( { done, total } ),
            } );
        } catch ( e ) {
            setError( e.message );
        }
        setState( 'done' );
    };

    const total   = agg.main + agg.sizes + agg.extras;
    const pct     = progress.total ? Math.round( ( progress.done / progress.total ) * 100 ) : 0;
    const types   = Object.entries( agg.types ).sort( ( a, b ) => b[ 1 ] - a[ 1 ] );
    const folders = Object.entries( agg.folders ).sort( ( a, b ) => b[ 1 ] - a[ 1 ] ).slice( 0, 10 );
    const saving  = Math.round( agg.unoptimizedBytes * ratio );

    return (
        <div className="capms-settings-wrapper">
            <PageHeader
                title={ __( 'Storage Report', 'captain-media-shield' ) }
                subtitle={ __( 'See exactly where your uploads space goes and how much you could still save.', 'captain-media-shield' ) }
            />

            <div className="capms-settings-sections">
                <Section icon={ <IconDatabase /> } title={ __( 'Scan the Media Library', 'captain-media-shield' ) } description={ __( 'Reads file sizes only - nothing is changed. Large libraries are scanned in small steps.', 'captain-media-shield' ) }>
                    <div className="capms-cl-body">
                        { state === 'scanning' ? (
                            <>
                                <div className="capms-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={ pct }>
                                    <div className="capms-progress-bar capms-progress-bar--animated" style={ { width: `${ pct }%` } } />
                                </div>
                                <div className="capms-cl-scanrow">
                                    <span>{ sprintf( /* translators: %d: percent */ __( 'Measuring files · %d%%', 'captain-media-shield' ), pct ) }</span>
                                    <button type="button" className="capms-btn capms-btn--warning" onClick={ () => { cancel.current = true; } }><IconStop />{ __( 'Stop', 'captain-media-shield' ) }</button>
                                </div>
                            </>
                        ) : (
                            <button type="button" className="capms-btn capms-btn--primary" onClick={ start }>
                                { state === 'done' ? <IconRefresh /> : <IconPlay /> }
                                { state === 'done' ? __( 'Scan again', 'captain-media-shield' ) : __( 'Scan storage', 'captain-media-shield' ) }
                            </button>
                        ) }
                    </div>
                </Section>

                { error && <Notice tone="error">{ error }</Notice> }

                { agg.count > 0 && (
                    <>
                        <div className="capms-stat-grid">
                            <StatCard icon={ <IconDatabase /> } label={ __( 'Library size', 'captain-media-shield' ) } value={ formatBytes( total ) } sub={ sprintf( /* translators: %d: files */ __( '%d files', 'captain-media-shield' ), agg.count ) } />
                            <StatCard icon={ <IconLayers /> } label={ __( 'Originals', 'captain-media-shield' ) } value={ formatBytes( agg.main ) } sub={ sprintf( /* translators: %s: size */ __( 'Thumbnails: %s', 'captain-media-shield' ), formatBytes( agg.sizes ) ) } tone="blue" />
                            <StatCard icon={ <IconZap /> } label={ __( 'Next-gen copies', 'captain-media-shield' ) } value={ formatBytes( agg.extras ) } sub={ __( 'WebP, AVIF, WebM, posters', 'captain-media-shield' ) } tone="green" />
                            <StatCard icon={ <IconBackup /> } label={ __( 'Original backups', 'captain-media-shield' ) } value={ formatBytes( backup ) } sub={ __( 'Stored outside the library', 'captain-media-shield' ) } tone="orange" />
                        </div>

                        { agg.unoptimizedCount > 0 && (
                            <Notice tone="info">
                                { sprintf(
                                    /* translators: 1: number of images, 2: estimated saving */
                                    __( '%1$d JPEG/PNG image(s) are not optimized yet. Based on your results so far, optimizing them could save roughly %2$s (an estimate). Use the Bulk Optimizer to do it.', 'captain-media-shield' ),
                                    agg.unoptimizedCount,
                                    formatBytes( saving )
                                ) }
                            </Notice>
                        ) }

                        <div className="capms-dash-grid">
                            <Section title={ __( 'By file type', 'captain-media-shield' ) }>
                                <div className="capms-cl-body"><Bars rows={ types } total={ total } /></div>
                            </Section>
                            <Section title={ __( 'By upload year (largest)', 'captain-media-shield' ) }>
                                <div className="capms-cl-body"><Bars rows={ folders } total={ total } /></div>
                            </Section>
                        </div>

                        <Section title={ __( 'Largest files', 'captain-media-shield' ) } description={ __( 'Including their thumbnails and generated copies.', 'captain-media-shield' ) }>
                            <ul className="capms-cl-list">
                                { agg.top.map( ( f ) => (
                                    <li key={ f.id } className="capms-cl-row">
                                        <div className="capms-cl-info">
                                            <a href={ f.edit } target="_blank" rel="noreferrer" className="capms-cl-title">{ f.title }</a>
                                            <span className="capms-cl-path">{ f.path }</span>
                                        </div>
                                        <span className="capms-cl-size">{ formatBytes( f.total ) }</span>
                                    </li>
                                ) ) }
                            </ul>
                        </Section>
                    </>
                ) }
            </div>
        </div>
    );
};

export default Storage;
