import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { __ } from '@wordpress/i18n';
import { ajax } from '../services/api.js';
import { setSettingsData } from '../redux/slice.jsx';

/**
 * Staged settings editing for one page.
 *
 * `keys` limits which settings this page owns - Save only sends those,
 * Reset only resets those, and "dirty" only compares those - so leaving
 * unsaved changes on one page never leaks into another page's save.
 */
const useSettings = ( keys ) => {
    const dispatch = useDispatch();
    const saved    = useSelector( state => state.settings );
    const defaults = useSelector( state => state.defaults );
    const support  = useSelector( state => state.support );

    const [ draft, setDraft ]     = useState( null );
    const [ saving, setSaving ]   = useState( false );
    const [ message, setMessage ] = useState( '' );
    const [ tone, setTone ]       = useState( 'success' );

    useEffect( () => {
        if ( saved ) {
            setDraft( pick( saved, keys ) );
            return;
        }
        ajax( 'get_settings' ).then( ( result ) => {
            if ( result.success && result.data ) {
                dispatch( setSettingsData( result.data ) );
                setDraft( pick( result.data.settings, keys ) );
            }
        } );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    const dirty = useMemo( () => {
        if ( ! draft || ! saved ) return false;
        return keys.some( ( key ) => String( draft[ key ] ) !== String( saved[ key ] ) );
    }, [ draft, saved, keys ] );

    const set = ( key, value ) => setDraft( ( prev ) => ( { ...prev, [ key ]: value } ) );

    const flash = ( text, t = 'success' ) => {
        setMessage( text );
        setTone( t );
        setTimeout( () => setMessage( '' ), t === 'success' ? 3000 : 7000 );
    };

    const save = async () => {
        setSaving( true );
        const result = await ajax( 'save_settings', { settings: draft } );
        setSaving( false );

        if ( result.success && result.data ) {
            dispatch( setSettingsData( result.data ) );
            setDraft( pick( result.data.settings, keys ) );
            if ( result.description ) {
                flash( result.description, 'error' );
            } else {
                flash( result.message || __( 'Settings saved.', 'captain-media-shield' ) );
            }
        } else {
            flash( result.message || __( 'Could not save settings.', 'captain-media-shield' ), 'error' );
        }
    };

    const reset   = () => defaults && setDraft( pick( defaults, keys ) );
    const discard = () => saved && setDraft( pick( saved, keys ) );

    return { draft, saved, support: support || {}, set, save, reset, discard, dirty, saving, message, tone };
};

const pick = ( obj, keys ) => keys.reduce( ( acc, key ) => {
    acc[ key ] = obj ? obj[ key ] : undefined;
    return acc;
}, {} );

export default useSettings;
