import { ajax } from './api.js';

/**
 * Helpers for the Media Cleanup and Storage Report screens.
 *
 * Every scan is driven from the browser in small batches (a handful of
 * attachments per request) so a big library never hits a PHP / server
 * timeout, and the person can cancel at any moment.
 */

export const loadLibrary = async () => {
    const res = await ajax( 'cleanup_ids' );
    if ( ! res.success || ! res.data ) {
        throw new Error( res.message || 'Could not read the Media Library.' );
    }
    return res.data; // { ids, estimate_ratio, registered_sizes }
};

/**
 * Run one scan mode over `ids`, `size` at a time.
 * Resolves to 'done' or 'cancelled'; throws on a failed request.
 */
export const scanBatches = async ( { ids, mode, size, extra = {}, cancel, onData, onProgress } ) => {
    for ( let i = 0; i < ids.length; i += size ) {
        if ( cancel.current ) return 'cancelled';

        const chunk = ids.slice( i, i + size );
        const res   = await ajax( 'cleanup_scan', { mode, ids: chunk, ...extra } );

        if ( ! res.success ) {
            throw new Error( res.message || 'Request failed.' );
        }

        onData( res.data || {}, chunk );
        if ( onProgress ) onProgress( Math.min( i + size, ids.length ), ids.length );
    }
    return 'done';
};

/**
 * Delete attachments (the server re-checks usage for every one).
 * Returns { deleted: number[], skipped: number[], bytes }.
 */
export const deleteBatches = async ( { ids, strict, keep, cancel, onProgress } ) => {
    const total = { deleted: [], skipped: [], bytes: 0 };

    for ( let i = 0; i < ids.length; i += 20 ) {
        if ( cancel && cancel.current ) break;

        const chunk = ids.slice( i, i + 20 );
        const res   = await ajax( 'cleanup_delete', { ids: chunk, strict: strict ? 1 : 0, keep: keep ? 1 : 0 } );

        if ( ! res.success || ! res.data ) {
            throw new Error( res.message || 'Request failed.' );
        }

        total.deleted.push( ...( res.data.deleted || [] ) );
        total.skipped.push( ...( res.data.skipped || [] ) );
        total.bytes += Number( res.data.bytes ) || 0;
        if ( onProgress ) onProgress( Math.min( i + 20, ids.length ), ids.length );
    }

    return total;
};
