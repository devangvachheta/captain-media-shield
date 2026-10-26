import React, { useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { ajax, formatBytes } from '../../services/api.js';
import { loadLibrary, scanBatches, deleteBatches } from '../../services/cleanupScan.js';
import { PageHeader, Section, StatCard, Notice, ConfirmModal, Pill } from '../../components/ui.jsx';
import { IconTrash, IconRefresh, IconStop, IconPlay, IconLayers, IconDatabase, IconWarning } from '../../components/icons.jsx';
import './cleanup.scss';

const TABS = () => [
    { id: 'unused', label: __( 'Unused Media', 'captain-media-shield' ) },
    { id: 'duplicates', label: __( 'Duplicate Files', 'captain-media-shield' ) },
    { id: 'thumbs', label: __( 'Unused Thumbnails', 'captain-media-shield' ) },
];

/* ---------- shared bits ---------- */

const Thumb = ( { item } ) => (
    item.thumb
        ? <img className="capms-cl-thumb" src={ item.thumb } alt="" loading="lazy" />
        : <span className="capms-cl-thumb capms-cl-thumb--file">{ ( item.file.split( '.' ).pop() || '' ).slice( 0, 4 ).toUpperCase() }</span>
);

const ScanBar = ( { state, progress, label, onStart, onCancel, startLabel } ) => {
    const pct = progress.total ? Math.round( ( progress.done / progress.total ) * 100 ) : 0;
    return (
        <div className="capms-cl-scanbar">
            { state === 'scanning' ? (
                <>
                    <div className="capms-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={ pct }>
                        <div className="capms-progress-bar capms-progress-bar--animated" style={ { width: `${ pct }%` } } />
                    </div>
                    <div className="capms-cl-scanrow">
                        <span>{ label } · { pct }%</span>
                        <button type="button" className="capms-btn capms-btn--warning" onClick={ onCancel }><IconStop />{ __( 'Stop', 'captain-media-shield' ) }</button>
                    </div>
                </>
            ) : (
                <button type="button" className="capms-btn capms-btn--primary" onClick={ onStart }>
                    { state === 'done' ? <IconRefresh /> : <IconPlay /> }
                    { state === 'done' ? __( 'Scan again', 'captain-media-shield' ) : startLabel }
                </button>
            ) }
        </div>
    );
};

const useScanState = () => {
    const cancel                = useRef( false );
    const [ state, setState ]   = useState( 'idle' ); // idle | scanning | done
    const [ progress, setProg ] = useState( { done: 0, total: 0 } );
    const [ label, setLabel ]   = useState( '' );
    const [ error, setError ]   = useState( '' );
    return { cancel, state, setState, progress, setProg, label, setLabel, error, setError };
};

const SelectAll = ( { items, selected, setSelected } ) => {
    const all = items.length > 0 && items.every( ( i ) => selected.has( i.id ) );
    return (
        <label className="capms-checkbox">
            <input type="checkbox" checked={ all } onChange={ ( e ) => setSelected( e.target.checked ? new Set( items.map( ( i ) => i.id ) ) : new Set() ) } />
            <span>{ all ? __( 'Deselect all', 'captain-media-shield' ) : __( 'Select all', 'captain-media-shield' ) }</span>
        </label>
    );
};

const toggle = ( set, id ) => {
    const next = new Set( set );
    if ( next.has( id ) ) next.delete( id ); else next.add( id );
    return next;
};

/* ---------- Unused media ---------- */

const UnusedTab = () => {
    const s                         = useScanState();
    const [ strict, setStrict ]     = useState( false );
    const [ items, setItems ]       = useState( [] );
    const [ selected, setSelected ] = useState( new Set() );
    const [ confirm, setConfirm ]   = useState( false );
    const [ keep, setKeep ]         = useState( true );
    const [ busy, setBusy ]         = useState( false );
    const [ result, setResult ]     = useState( null );

    const start = async () => {
        s.cancel.current = false;
        s.setError( '' );
        setResult( null );
        setItems( [] );
        setSelected( new Set() );
        s.setState( 'scanning' );
        s.setLabel( __( 'Checking where every file is used', 'captain-media-shield' ) );
        try {
            const lib = await loadLibrary();
            s.setProg( { done: 0, total: lib.ids.length } );
            await scanBatches( {
                ids: lib.ids, mode: 'unused', size: 20, extra: { strict: strict ? 1 : 0 }, cancel: s.cancel,
                onData: ( data ) => setItems( ( prev ) => [ ...prev, ...( data.items || [] ) ] ),
                onProgress: ( done, total ) => s.setProg( { done, total } ),
            } );
        } catch ( e ) {
            s.setError( e.message );
        }
        s.setState( 'done' );
    };

    const remove = async () => {
        setBusy( true );
        try {
            const ids = [ ...selected ];
            const res = await deleteBatches( { ids, strict, keep } );
            setItems( ( prev ) => prev.filter( ( i ) => ! res.deleted.includes( i.id ) ) );
            setSelected( new Set() );
            setResult( res );
        } catch ( e ) {
            s.setError( e.message );
        }
        setBusy( false );
        setConfirm( false );
    };

    const selBytes = items.filter( ( i ) => selected.has( i.id ) ).reduce( ( n, i ) => n + i.bytes, 0 );
    const allBytes = items.reduce( ( n, i ) => n + i.bytes, 0 );

    return (
        <>
            <Section
                icon={ <IconTrash /> }
                title={ __( 'Find media that is not used anywhere', 'captain-media-shield' ) }
                description={ __( 'Every file is checked against post content, featured images, galleries, widgets, theme settings, page-builder data and custom fields. Anything that looks even possibly in use is left out of the list.', 'captain-media-shield' ) }
            >
                <div className="capms-cl-body">
                    <label className="capms-checkbox">
                        <input type="checkbox" checked={ strict } onChange={ ( e ) => setStrict( e.target.checked ) } disabled={ s.state === 'scanning' } />
                        <span>{ __( 'Stricter scan: also list files that are only "attached" to a post (uploaded there) but not actually used in it', 'captain-media-shield' ) }</span>
                    </label>
                    <ScanBar state={ s.state } progress={ s.progress } label={ s.label } onStart={ start } onCancel={ () => { s.cancel.current = true; } } startLabel={ __( 'Scan for unused media', 'captain-media-shield' ) } />
                </div>
            </Section>

            { s.error && <Notice tone="error">{ s.error }</Notice> }
            { result && (
                <Notice tone="info">
                    { sprintf( /* translators: 1: deleted count, 2: size freed, 3: skipped count */ __( 'Deleted %1$d file(s) and freed %2$s. %3$d file(s) were skipped because they are in use now.', 'captain-media-shield' ), result.deleted.length, formatBytes( result.bytes ), result.skipped.length ) }
                </Notice>
            ) }

            { s.state === 'done' && ! s.error && items.length === 0 && ! result && (
                <Notice tone="info">{ __( 'No unused media found. Your library looks tidy.', 'captain-media-shield' ) }</Notice>
            ) }

            { items.length > 0 && (
                <>
                    <div className="capms-stat-grid capms-stat-grid--3">
                        <StatCard icon={ <IconLayers /> } label={ __( 'Unused files', 'captain-media-shield' ) } value={ items.length } tone="orange" />
                        <StatCard icon={ <IconDatabase /> } tone="green" label={ __( 'Could be freed', 'captain-media-shield' ) } value={ formatBytes( allBytes ) } sub={ __( 'Originals, thumbnails and our copies', 'captain-media-shield' ) } />
                        <StatCard icon={ <IconTrash /> } label={ __( 'Selected', 'captain-media-shield' ) } value={ selected.size } sub={ formatBytes( selBytes ) } />
                    </div>

                    <div className="capms-cl-toolbar">
                        <SelectAll items={ items } selected={ selected } setSelected={ setSelected } />
                        <button type="button" className="capms-btn capms-btn--danger" disabled={ ! selected.size } onClick={ () => setConfirm( true ) }>
                            <IconTrash />
                            { sprintf( /* translators: %d: number of selected files */ __( 'Delete %d selected', 'captain-media-shield' ), selected.size ) }
                        </button>
                    </div>

                    <ul className="capms-cl-list">
                        { items.map( ( item ) => (
                            <li key={ item.id } className="capms-cl-row">
                                <input type="checkbox" checked={ selected.has( item.id ) } onChange={ () => setSelected( toggle( selected, item.id ) ) } aria-label={ item.title } />
                                <Thumb item={ item } />
                                <div className="capms-cl-info">
                                    <a href={ item.edit } target="_blank" rel="noreferrer" className="capms-cl-title">{ item.title || item.file }</a>
                                    <span className="capms-cl-path">{ item.path }</span>
                                </div>
                                <span className="capms-cl-size">{ formatBytes( item.bytes ) }</span>
                            </li>
                        ) ) }
                    </ul>
                </>
            ) }

            { confirm && (
                <ConfirmModal
                    title={ __( 'Delete unused media?', 'captain-media-shield' ) }
                    icon={ <IconWarning /> }
                    danger
                    busy={ busy }
                    confirmLabel={ sprintf( /* translators: %d: number of files */ __( 'Delete %d file(s)', 'captain-media-shield' ), selected.size ) }
                    onConfirm={ remove }
                    onClose={ () => ! busy && setConfirm( false ) }
                >
                    <p>{ __( 'These files are removed from the Media Library and from the disk, together with their thumbnails and WebP/AVIF copies. Each file is checked once more right before it is deleted.', 'captain-media-shield' ) }</p>
                    <label className="capms-checkbox">
                        <input type="checkbox" checked={ keep } onChange={ ( e ) => setKeep( e.target.checked ) } />
                        <span>{ __( 'Keep a copy of every original in the backup folder (deleted/)', 'captain-media-shield' ) }</span>
                    </label>
                </ConfirmModal>
            ) }
        </>
    );
};

/* ---------- Duplicates ---------- */

const defaultKeeper = ( members ) => {
    const used = members.find( ( m ) => m.used );
    if ( used ) return used.id;
    return [ ...members ].sort( ( a, b ) => a.id - b.id )[ 0 ].id;
};

const DuplicatesTab = () => {
    const s                         = useScanState();
    const [ groups, setGroups ]     = useState( [] );
    const [ selected, setSelected ] = useState( new Set() );
    const [ confirm, setConfirm ]   = useState( false );
    const [ keep, setKeep ]         = useState( true );
    const [ busy, setBusy ]         = useState( false );
    const [ result, setResult ]     = useState( null );

    const start = async () => {
        s.cancel.current = false;
        s.setError( '' );
        setResult( null );
        setGroups( [] );
        setSelected( new Set() );
        s.setState( 'scanning' );

        try {
            const lib = await loadLibrary();

            // 1) Cheap pass: file sizes. Only files that share a size can be identical.
            s.setLabel( __( 'Comparing file sizes', 'captain-media-shield' ) );
            s.setProg( { done: 0, total: lib.ids.length } );
            const sizes = {};
            const r1 = await scanBatches( {
                ids: lib.ids, mode: 'sizes', size: 100, cancel: s.cancel,
                onData: ( data ) => Object.assign( sizes, data.sizes || {} ),
                onProgress: ( done, total ) => s.setProg( { done, total } ),
            } );
            if ( r1 === 'cancelled' ) { s.setState( 'done' ); return; }

            const bySize = {};
            Object.entries( sizes ).forEach( ( [ id, bytes ] ) => {
                if ( bytes > 0 ) ( bySize[ bytes ] = bySize[ bytes ] || [] ).push( Number( id ) );
            } );
            const candidates = Object.values( bySize ).filter( ( g ) => g.length > 1 ).flat();

            // 2) Fingerprint (MD5) only the candidates.
            s.setLabel( __( 'Fingerprinting possible duplicates', 'captain-media-shield' ) );
            s.setProg( { done: 0, total: candidates.length } );
            const hashes = {};
            const r2 = await scanBatches( {
                ids: candidates, mode: 'hash', size: 15, cancel: s.cancel,
                onData: ( data ) => Object.assign( hashes, data.hashes || {} ),
                onProgress: ( done, total ) => s.setProg( { done, total } ),
            } );
            if ( r2 === 'cancelled' ) { s.setState( 'done' ); return; }

            const byHash = {};
            Object.entries( hashes ).forEach( ( [ id, hash ] ) => ( byHash[ hash ] = byHash[ hash ] || [] ).push( Number( id ) ) );
            const same = Object.values( byHash ).filter( ( g ) => g.length > 1 );

            // 3) Load the details of every group.
            s.setLabel( __( 'Reading details', 'captain-media-shield' ) );
            s.setProg( { done: 0, total: same.length } );
            const found = [];
            for ( let i = 0; i < same.length; i += 10 ) {
                if ( s.cancel.current ) break;
                const res = await ajax( 'cleanup_duplicate_groups', { groups: same.slice( i, i + 10 ) } );
                if ( ! res.success ) throw new Error( res.message || 'Request failed.' );
                found.push( ...( res.data.groups || [] ) );
                setGroups( [ ...found ] );
                s.setProg( { done: Math.min( i + 10, same.length ), total: same.length } );
            }

            // Pre-select every unused copy except the one we keep.
            const pre = new Set();
            found.forEach( ( members ) => {
                const keeper = defaultKeeper( members );
                members.forEach( ( m ) => { if ( m.id !== keeper && ! m.used ) pre.add( m.id ); } );
            } );
            setSelected( pre );
        } catch ( e ) {
            s.setError( e.message );
        }
        s.setState( 'done' );
    };

    const remove = async () => {
        setBusy( true );
        try {
            const res = await deleteBatches( { ids: [ ...selected ], strict: false, keep } );
            setGroups( ( prev ) => prev
                .map( ( members ) => members.filter( ( m ) => ! res.deleted.includes( m.id ) ) )
                .filter( ( members ) => members.length > 1 ) );
            setSelected( new Set() );
            setResult( res );
        } catch ( e ) {
            s.setError( e.message );
        }
        setBusy( false );
        setConfirm( false );
    };

    const wasted = groups.reduce( ( n, members ) => {
        const bytes = members.map( ( m ) => m.bytes );
        return n + bytes.reduce( ( a, b ) => a + b, 0 ) - Math.max( ...bytes );
    }, 0 );
    const selBytes = groups.flat().filter( ( m ) => selected.has( m.id ) ).reduce( ( n, m ) => n + m.bytes, 0 );

    return (
        <>
            <Section
                icon={ <IconLayers /> }
                title={ __( 'Find identical files', 'captain-media-shield' ) }
                description={ __( 'Files are compared by size first and then by a content fingerprint, so only byte-for-byte identical copies are reported - never "similar" images.', 'captain-media-shield' ) }
            >
                <div className="capms-cl-body">
                    <ScanBar state={ s.state } progress={ s.progress } label={ s.label } onStart={ start } onCancel={ () => { s.cancel.current = true; } } startLabel={ __( 'Scan for duplicates', 'captain-media-shield' ) } />
                </div>
            </Section>

            { s.error && <Notice tone="error">{ s.error }</Notice> }
            { result && (
                <Notice tone="info">
                    { sprintf( /* translators: 1: deleted count, 2: size freed, 3: skipped count */ __( 'Deleted %1$d copy/copies and freed %2$s. %3$d were skipped because they are in use.', 'captain-media-shield' ), result.deleted.length, formatBytes( result.bytes ), result.skipped.length ) }
                </Notice>
            ) }

            { s.state === 'done' && ! s.error && groups.length === 0 && ! result && (
                <Notice tone="info">{ __( 'No duplicate files found.', 'captain-media-shield' ) }</Notice>
            ) }

            { groups.length > 0 && (
                <>
                    <Notice tone="warning">
                        { __( 'A copy that is still used somewhere is marked "In use" and cannot be deleted from here. Replace it in your content with the copy you keep, then scan again.', 'captain-media-shield' ) }
                    </Notice>

                    <div className="capms-stat-grid capms-stat-grid--3">
                        <StatCard icon={ <IconLayers /> } label={ __( 'Duplicate groups', 'captain-media-shield' ) } value={ groups.length } tone="orange" />
                        <StatCard icon={ <IconDatabase /> } tone="green" label={ __( 'Wasted space', 'captain-media-shield' ) } value={ formatBytes( wasted ) } />
                        <StatCard icon={ <IconTrash /> } label={ __( 'Selected', 'captain-media-shield' ) } value={ selected.size } sub={ formatBytes( selBytes ) } />
                    </div>

                    <div className="capms-cl-toolbar">
                        <span className="capms-cl-hint">{ __( 'Unused extra copies are pre-selected. The copy that is in use (or the oldest one) is kept.', 'captain-media-shield' ) }</span>
                        <button type="button" className="capms-btn capms-btn--danger" disabled={ ! selected.size } onClick={ () => setConfirm( true ) }>
                            <IconTrash />
                            { sprintf( /* translators: %d: number of selected copies */ __( 'Delete %d selected', 'captain-media-shield' ), selected.size ) }
                        </button>
                    </div>

                    { groups.map( ( members, index ) => {
                        const keeper = defaultKeeper( members );
                        return (
                            <div className="capms-cl-group" key={ members.map( ( m ) => m.id ).join( '-' ) }>
                                <div className="capms-cl-group-head">
                                    <strong>{ sprintf( /* translators: 1: group number, 2: copies */ __( 'Group %1$d · %2$d identical files', 'captain-media-shield' ), index + 1, members.length ) }</strong>
                                </div>
                                <ul className="capms-cl-list">
                                    { members.map( ( m ) => (
                                        <li key={ m.id } className="capms-cl-row">
                                            <input type="checkbox" disabled={ m.used } checked={ selected.has( m.id ) } onChange={ () => setSelected( toggle( selected, m.id ) ) } aria-label={ m.title } />
                                            <Thumb item={ m } />
                                            <div className="capms-cl-info">
                                                <a href={ m.edit } target="_blank" rel="noreferrer" className="capms-cl-title">{ m.title || m.file }</a>
                                                <span className="capms-cl-path">{ m.path } · { m.date }</span>
                                            </div>
                                            { m.id === keeper && <Pill tone="green">{ __( 'Keep', 'captain-media-shield' ) }</Pill> }
                                            { m.used && <Pill tone="orange">{ __( 'In use', 'captain-media-shield' ) }</Pill> }
                                            <span className="capms-cl-size">{ formatBytes( m.bytes ) }</span>
                                        </li>
                                    ) ) }
                                </ul>
                            </div>
                        );
                    } ) }
                </>
            ) }

            { confirm && (
                <ConfirmModal
                    title={ __( 'Delete duplicate copies?', 'captain-media-shield' ) }
                    icon={ <IconWarning /> }
                    danger
                    busy={ busy }
                    confirmLabel={ sprintf( /* translators: %d: number of files */ __( 'Delete %d copy/copies', 'captain-media-shield' ), selected.size ) }
                    onConfirm={ remove }
                    onClose={ () => ! busy && setConfirm( false ) }
                >
                    <p>{ __( 'The selected copies are removed from the Media Library and the disk. Usage is checked again for every file right before it is deleted.', 'captain-media-shield' ) }</p>
                    <label className="capms-checkbox">
                        <input type="checkbox" checked={ keep } onChange={ ( e ) => setKeep( e.target.checked ) } />
                        <span>{ __( 'Keep a copy of every original in the backup folder (deleted/)', 'captain-media-shield' ) }</span>
                    </label>
                </ConfirmModal>
            ) }
        </>
    );
};

/* ---------- Unused thumbnails ---------- */

const ThumbsTab = () => {
    const s                         = useScanState();
    const [ items, setItems ]       = useState( [] );
    const [ registered, setReg ]    = useState( [] );
    const [ selected, setSelected ] = useState( new Set() );
    const [ confirm, setConfirm ]   = useState( false );
    const [ busy, setBusy ]         = useState( false );
    const [ result, setResult ]     = useState( null );

    const start = async () => {
        s.cancel.current = false;
        s.setError( '' );
        setResult( null );
        setItems( [] );
        setSelected( new Set() );
        s.setState( 'scanning' );
        s.setLabel( __( 'Looking for thumbnail sizes nothing uses', 'captain-media-shield' ) );
        const found = [];
        try {
            const lib = await loadLibrary();
            setReg( lib.registered_sizes || [] );
            s.setProg( { done: 0, total: lib.ids.length } );
            await scanBatches( {
                ids: lib.ids, mode: 'thumbs', size: 20, cancel: s.cancel,
                onData: ( data ) => { found.push( ...( data.items || [] ) ); setItems( [ ...found ] ); },
                onProgress: ( done, total ) => s.setProg( { done, total } ),
            } );
            setSelected( new Set( found.map( ( i ) => i.id ) ) );
        } catch ( e ) {
            s.setError( e.message );
        }
        s.setState( 'done' );
    };

    const clean = async () => {
        setBusy( true );
        let files = 0;
        let bytes = 0;
        try {
            const ids = [ ...selected ];
            for ( let i = 0; i < ids.length; i += 10 ) {
                const res = await ajax( 'cleanup_clean_thumbs', { ids: ids.slice( i, i + 10 ) } );
                if ( ! res.success || ! res.data ) throw new Error( res.message || 'Request failed.' );
                files += Number( res.data.files ) || 0;
                bytes += Number( res.data.bytes ) || 0;
            }
            setItems( ( prev ) => prev.filter( ( it ) => ! selected.has( it.id ) ) );
            setSelected( new Set() );
            setResult( { files, bytes } );
        } catch ( e ) {
            s.setError( e.message );
        }
        setBusy( false );
        setConfirm( false );
    };

    const allBytes = items.reduce( ( n, i ) => n + i.bytes, 0 );
    const selBytes = items.filter( ( i ) => selected.has( i.id ) ).reduce( ( n, i ) => n + i.bytes, 0 );

    return (
        <>
            <Section
                icon={ <IconRefresh /> }
                title={ __( 'Find thumbnail sizes that are no longer registered', 'captain-media-shield' ) }
                description={ __( 'Changing themes or removing plugins leaves old thumbnail files behind. This finds files for sizes your site does not register any more and that no content refers to.', 'captain-media-shield' ) }
            >
                <div className="capms-cl-body">
                    <ScanBar state={ s.state } progress={ s.progress } label={ s.label } onStart={ start } onCancel={ () => { s.cancel.current = true; } } startLabel={ __( 'Scan thumbnails', 'captain-media-shield' ) } />
                </div>
            </Section>

            <Notice tone="warning">
                { __( 'Some themes and plugins only register image sizes on certain pages. If your front end uses a size that is not registered while you are in the admin, a missing size can be regenerated later with any "regenerate thumbnails" tool. Review the list before deleting.', 'captain-media-shield' ) }
            </Notice>

            { registered.length > 0 && (
                <p className="capms-cl-hint">
                    { sprintf( /* translators: %s: comma separated size names */ __( 'Sizes your site registers right now (always kept): %s', 'captain-media-shield' ), registered.join( ', ' ) ) }
                </p>
            ) }

            { s.error && <Notice tone="error">{ s.error }</Notice> }
            { result && (
                <Notice tone="info">
                    { sprintf( /* translators: 1: files, 2: size freed */ __( 'Deleted %1$d thumbnail file(s) and freed %2$s.', 'captain-media-shield' ), result.files, formatBytes( result.bytes ) ) }
                </Notice>
            ) }

            { s.state === 'done' && ! s.error && items.length === 0 && ! result && (
                <Notice tone="info">{ __( 'No unused thumbnail sizes found.', 'captain-media-shield' ) }</Notice>
            ) }

            { items.length > 0 && (
                <>
                    <div className="capms-stat-grid capms-stat-grid--3">
                        <StatCard icon={ <IconLayers /> } label={ __( 'Images with leftovers', 'captain-media-shield' ) } value={ items.length } tone="orange" />
                        <StatCard icon={ <IconDatabase /> } tone="green" label={ __( 'Could be freed', 'captain-media-shield' ) } value={ formatBytes( allBytes ) } />
                        <StatCard icon={ <IconTrash /> } label={ __( 'Selected', 'captain-media-shield' ) } value={ selected.size } sub={ formatBytes( selBytes ) } />
                    </div>

                    <div className="capms-cl-toolbar">
                        <SelectAll items={ items } selected={ selected } setSelected={ setSelected } />
                        <button type="button" className="capms-btn capms-btn--danger" disabled={ ! selected.size } onClick={ () => setConfirm( true ) }>
                            <IconTrash />
                            { __( 'Delete unused thumbnails', 'captain-media-shield' ) }
                        </button>
                    </div>

                    <ul className="capms-cl-list">
                        { items.map( ( item ) => (
                            <li key={ item.id } className="capms-cl-row">
                                <input type="checkbox" checked={ selected.has( item.id ) } onChange={ () => setSelected( toggle( selected, item.id ) ) } aria-label={ item.title } />
                                <Thumb item={ item } />
                                <div className="capms-cl-info">
                                    <a href={ item.edit } target="_blank" rel="noreferrer" className="capms-cl-title">{ item.title || item.file }</a>
                                    <span className="capms-cl-path">{ item.sizes.map( ( z ) => z.name ).join( ', ' ) }</span>
                                </div>
                                <span className="capms-cl-size">{ formatBytes( item.bytes ) }</span>
                            </li>
                        ) ) }
                    </ul>
                </>
            ) }

            { confirm && (
                <ConfirmModal
                    title={ __( 'Delete unused thumbnails?', 'captain-media-shield' ) }
                    icon={ <IconWarning /> }
                    danger
                    busy={ busy }
                    confirmLabel={ __( 'Delete thumbnails', 'captain-media-shield' ) }
                    onConfirm={ clean }
                    onClose={ () => ! busy && setConfirm( false ) }
                >
                    <p>{ __( 'Only the leftover thumbnail files (and their WebP/AVIF copies) are removed. The original images are never touched.', 'captain-media-shield' ) }</p>
                </ConfirmModal>
            ) }
        </>
    );
};

/* ---------- page ---------- */

const Cleanup = () => {
    const [ tab, setTab ] = useState( 'unused' );

    return (
        <div className="capms-settings-wrapper">
            <PageHeader
                title={ __( 'Media Cleanup', 'captain-media-shield' ) }
                subtitle={ __( 'Take back disk space: remove files nothing uses, identical copies and leftover thumbnails. Nothing is deleted until you confirm.', 'captain-media-shield' ) }
            />

            <div className="capms-cl-tabs" role="tablist">
                { TABS().map( ( t ) => (
                    <button
                        key={ t.id }
                        type="button"
                        role="tab"
                        aria-selected={ tab === t.id }
                        className={ `capms-segmented-btn ${ tab === t.id ? 'capms-segmented-btn--active' : '' }` }
                        onClick={ () => setTab( t.id ) }
                    >
                        { t.label }
                    </button>
                ) ) }
            </div>

            <div className="capms-settings-sections">
                <div hidden={ tab !== 'unused' }><UnusedTab /></div>
                <div hidden={ tab !== 'duplicates' }><DuplicatesTab /></div>
                <div hidden={ tab !== 'thumbs' }><ThumbsTab /></div>
            </div>
        </div>
    );
};

export default Cleanup;
