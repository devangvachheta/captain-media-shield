/**
 * Single helper for every call to the plugin's AJAX router
 * (Capms_Dashboard_Ajax). Always resolves to the standard
 * { success, message, description, data } shape - network / JSON errors
 * are turned into a failed response instead of throwing.
 */
export const ajax = async ( type, fields = {} ) => {
    if ( typeof capms_data === 'undefined' ) {
        return { success: false, message: 'capms_data missing' };
    }

    const formData = new FormData();
    formData.append( 'action', 'capms_dashboard_ajax_call' );
    formData.append( 'nonce', capms_data.capms_nonce );
    formData.append( 'type', type );

    Object.entries( fields ).forEach( ( [ key, value ] ) => {
        formData.append( key, typeof value === 'object' ? JSON.stringify( value ) : value );
    } );

    try {
        const response = await fetch( capms_data.ajax_url, { method: 'POST', body: formData, credentials: 'same-origin' } );
        return await response.json();
    } catch ( e ) {
        return { success: false, message: e?.message || 'Request failed' };
    }
};

export const formatBytes = ( bytes ) => {
    const value = Number( bytes ) || 0;
    if ( value <= 0 ) return '0 B';
    const units = [ 'B', 'KB', 'MB', 'GB', 'TB' ];
    const i     = Math.min( units.length - 1, Math.floor( Math.log( value ) / Math.log( 1024 ) ) );
    return `${ ( value / Math.pow( 1024, i ) ).toFixed( i === 0 ? 0 : 2 ) } ${ units[ i ] }`;
};

export const percentSaved = ( before, after ) => {
    const b = Number( before ) || 0;
    const a = Number( after ) || 0;
    if ( b <= 0 ) return 0;
    return Math.max( 0, Math.round( ( ( b - a ) / b ) * 1000 ) / 10 );
};
