import { ajax } from './api.js';

/**
 * Bulk optimizer queue that lives outside React, so a run keeps going
 * while the user moves between pages of the app (the Bulk page just
 * subscribes to it). One attachment per request keeps every request
 * short, so neither PHP nor the web server times out, and Pause simply
 * stops pulling the next item.
 */
const initial = () => ( {
    status:     'idle', // idle | loading | running | paused | done
    queue:      [],
    total:      0,
    processed:  0,
    succeeded:  0,
    failed:     0,
    savedBytes: 0,
    current:    null,
    log:        [],
    startedAt:  0,
} );

let state       = initial();
const listeners = new Set();

const emit = () => listeners.forEach( ( fn ) => fn( state ) );
const update = ( patch ) => {
    state = { ...state, ...patch };
    emit();
};

const pushLog = ( entry ) => {
    update( { log: [ entry, ...state.log ].slice( 0, 60 ) } );
};

// Guards against two loops when Pause → Resume happens while a request
// is still in flight (the first loop simply carries on).
let looping = false;

const loop = async () => {
    if ( looping ) return;
    looping = true;
    try {
        await drain();
    } finally {
        looping = false;
    }
};

const drain = async () => {
    while ( state.status === 'running' && state.queue.length ) {
        const [ id, ...rest ] = state.queue;
        update( { current: id } );

        const result = await ajax( 'bulk_process_item', { id } );
        const row    = result?.data?.row;
        const saved  = row ? Math.max( 0, Number( row.original_size ) - Number( row.optimized_size ) ) : 0;

        state = {
            ...state,
            queue:      rest,
            processed:  state.processed + 1,
            succeeded:  state.succeeded + ( result.success ? 1 : 0 ),
            failed:     state.failed + ( result.success ? 0 : 1 ),
            savedBytes: state.savedBytes + saved,
        };

        pushLog( {
            id,
            title:   result?.data?.title || `#${ id }`,
            ok:      !! result.success && row?.status !== 'failed',
            status:  row?.status || ( result.success ? 'optimized' : 'failed' ),
            message: result.success ? ( row?.message || '' ) : ( result.message || '' ),
            before:  row ? Number( row.original_size ) : 0,
            after:   row ? Number( row.optimized_size ) : 0,
            webp:    row ? Number( row.webp_size ) > 0 : false,
            avif:    row ? Number( row.avif_size ) > 0 : false,
            webm:    row ? Number( row.webm_size ) > 0 : false,
        } );
    }

    if ( state.status === 'running' ) {
        update( { status: 'done', current: null } );
    }
};

export const bulkRunner = {
    getState: () => state,

    subscribe( fn ) {
        listeners.add( fn );
        return () => listeners.delete( fn );
    },

    async start( scope = 'all', retryFailed = false ) {
        if ( state.status === 'running' || state.status === 'loading' ) return;

        state = { ...initial(), status: 'loading' };
        emit();

        const result = await ajax( 'get_bulk_queue', { scope, retry_failed: retryFailed ? 1 : '' } );
        const ids    = result?.data?.ids || [];

        if ( ! result.success || ! ids.length ) {
            update( { status: 'done', total: 0, queue: [] } );
            return;
        }

        update( { status: 'running', queue: ids, total: ids.length, startedAt: Date.now() } );
        loop();
    },

    pause() {
        if ( state.status === 'running' ) update( { status: 'paused' } );
    },

    resume() {
        if ( state.status !== 'paused' ) return;
        update( { status: 'running' } );
        loop();
    },

    stop() {
        update( { status: 'done', queue: [], current: null } );
    },

    reset() {
        if ( state.status === 'running' ) return;
        state = initial();
        emit();
    },
};
