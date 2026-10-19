import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import useSettings from '../../hooks/useSettings.js';
import { ajax } from '../../services/api.js';
import { setStats } from '../../redux/slice.jsx';
import { PageHeader, Section, ToggleRow, SelectRow, Row, SaveBar, Notice, ConfirmModal, StatCard, Skeleton } from '../../components/ui.jsx';
import { IconBackup, IconClock, IconTrash, IconRestore, IconDatabase, IconRefresh } from '../../components/icons.jsx';

const KEYS = [ 'backup_enabled', 'delete_originals', 'backup_retention' ];

const RETENTION_OPTIONS = [
    { value: 'immediate', label: __( 'Immediate (No Retention)', 'captain-media-shield' ) },
    { value: '3600', label: __( 'After 1 Hour', 'captain-media-shield' ) },
    { value: '86400', label: __( 'After 24 Hours / 1 Day', 'captain-media-shield' ) },
    { value: '604800', label: __( 'After 7 Days', 'captain-media-shield' ) },
    { value: '2592000', label: __( 'After 30 Days', 'captain-media-shield' ) },
    { value: 'never', label: __( 'Never (Manual Cleanup Only)', 'captain-media-shield' ) },
];

const formatWhen = ( ts, now ) => {
    if ( ! ts ) return '—';
    const diff = ts - now;
    const abs  = Math.abs( diff );
    let text;
    if ( abs < 60 ) text = __( 'less than a minute', 'captain-media-shield' );
    else if ( abs < 3600 ) text = sprintf( __( '%d min', 'captain-media-shield' ), Math.round( abs / 60 ) );
    else if ( abs < 86400 ) text = sprintf( __( '%d h', 'captain-media-shield' ), Math.round( abs / 3600 ) );
    else text = sprintf( __( '%d days', 'captain-media-shield' ), Math.round( abs / 86400 ) );
    return diff >= 0 ? sprintf( __( 'in %s', 'captain-media-shield' ), text ) : sprintf( __( '%s ago', 'captain-media-shield' ), text );
};

const Backups = () => {
    const dispatch = useDispatch();
    const stats    = useSelector( state => state.stats );
    const { draft, saved, set, save, reset, discard, dirty, saving, message, tone } = useSettings( KEYS );

    const [ confirmPurge, setConfirmPurge ] = useState( false );
    const [ busy, setBusy ]                 = useState( false );
    const [ actionMsg, setActionMsg ]       = useState( null );

    const loadStats = async () => {
        const result = await ajax( 'get_stats' );
        if ( result.success ) dispatch( setStats( result.data ) );
    };

    useEffect( () => {
        loadStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] );

    // Reload stats after a save - shortening the retention runs a cleanup.
    useEffect( () => {
        if ( saved ) loadStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ saved?.backup_retention ] );

    const flash = ( text, t = 'success' ) => {
        setActionMsg( { text, tone: t } );
        setTimeout( () => setActionMsg( null ), 6000 );
    };

    const purge = async () => {
        setBusy( true );
        const result = await ajax( 'purge_backups' );
        setBusy( false );
        setConfirmPurge( false );
        flash( result.message || ( result.success ? __( 'Backups purged.', 'captain-media-shield' ) : __( 'Purge failed.', 'captain-media-shield' ) ), result.success ? 'success' : 'error' );
        loadStats();
    };

    const runCleanup = async () => {
        setBusy( true );
        const result = await ajax( 'run_cleanup' );
        setBusy( false );
        flash( result.message, result.success ? 'success' : 'error' );
        loadStats();
    };

    if ( ! draft ) {
        return (
            <div className="capms-settings-wrapper">
                <PageHeader title={ __( 'Original Backup & Retention Policy', 'captain-media-shield' ) } />
                <Skeleton height={ 220 } />
            </div>
        );
    }

    const disk = stats?.backup_disk;
    const now  = stats?.now || Math.floor( Date.now() / 1000 );

    return (
        <div className="capms-settings-wrapper">
            <PageHeader
                title={ __( 'Original Backup & Retention Policy', 'captain-media-shield' ) }
                subtitle={ sprintf( __( 'Untouched originals are kept in %s so any file can be restored. Decide how long they stay.', 'captain-media-shield' ), capms_data?.backup_dir || 'wp-content/uploads/captain-backups/' ) }
            />

            <div className="capms-stat-grid capms-stat-grid--3">
                <StatCard icon={ <IconDatabase /> } label={ __( 'Backup storage used', 'captain-media-shield' ) } value={ disk ? disk.human : '…' } sub={ disk ? sprintf( __( '%d original file(s)', 'captain-media-shield' ), disk.files ) : '' } />
                <StatCard icon={ <IconClock /> } tone="purple" label={ __( 'Next scheduled cleanup', 'captain-media-shield' ) } value={ saved?.backup_retention === 'never' ? __( 'Disabled', 'captain-media-shield' ) : formatWhen( stats?.cleanup_next, now ) } sub={ __( 'WP-Cron · runs hourly', 'captain-media-shield' ) } />
                <StatCard icon={ <IconTrash /> } tone="orange" label={ __( 'Last cleanup', 'captain-media-shield' ) } value={ stats?.cleanup_last?.time ? formatWhen( stats.cleanup_last.time, now ) : __( 'Not yet', 'captain-media-shield' ) } sub={ stats?.cleanup_last?.time ? sprintf( __( '%d backup(s) removed', 'captain-media-shield' ), stats.cleanup_last.removed || 0 ) : '' } />
            </div>

            <div className="capms-settings-sections">
                <Section
                    icon={ <IconBackup /> }
                    title={ __( 'Original Backups', 'captain-media-shield' ) }
                    description={ __( 'The backup folder is protected from direct web access.', 'captain-media-shield' ) }
                >
                    <ToggleRow
                        label={ sprintf( __( 'Save Original Backup in %s', 'captain-media-shield' ), capms_data?.backup_dir || 'wp-content/uploads/captain-backups/' ) }
                        hint={ __( 'Required for "Restore Original". Without a backup, optimization cannot be undone.', 'captain-media-shield' ) }
                        checked={ !! draft.backup_enabled }
                        onChange={ ( v ) => set( 'backup_enabled', v ) }
                    />
                    <ToggleRow
                        last
                        danger
                        label={ __( 'Immediate Auto-Delete Originals after WebP/AVIF/WebM conversion', 'captain-media-shield' ) }
                        hint={ __( 'Maximum storage saving: the backed-up original is deleted as soon as conversion succeeds, ignoring the schedule below. Restore will not be possible for those files.', 'captain-media-shield' ) }
                        checked={ !! draft.delete_originals }
                        onChange={ ( v ) => set( 'delete_originals', v ) }
                        disabled={ ! draft.backup_enabled }
                    />
                </Section>

                <Section
                    icon={ <IconClock /> }
                    title={ __( 'Scheduled Backup Auto-Cleanup', 'captain-media-shield' ) }
                    description={ __( 'A WP-Cron job checks every hour and deletes backups older than the selected period.', 'captain-media-shield' ) }
                >
                    <SelectRow
                        label={ __( 'Delete backups', 'captain-media-shield' ) }
                        hint={ draft.backup_retention === 'immediate'
                            ? __( 'Backups are deleted right after each file is processed - effectively no backup.', 'captain-media-shield' )
                            : __( 'Shortening this period applies to existing backups as soon as you save.', 'captain-media-shield' ) }
                        value={ draft.backup_retention }
                        onChange={ ( v ) => set( 'backup_retention', v ) }
                        options={ RETENTION_OPTIONS }
                        disabled={ ! draft.backup_enabled }
                    />
                    <Row last label={ __( 'Run cleanup now', 'captain-media-shield' ) } hint={ __( 'Apply the saved retention period immediately instead of waiting for the next cron run.', 'captain-media-shield' ) }>
                        <button type="button" className="capms-btn capms-btn--ghost" onClick={ runCleanup } disabled={ busy || saved?.backup_retention === 'never' }>
                            <IconRefresh />
                            { __( 'Run Cleanup', 'captain-media-shield' ) }
                        </button>
                    </Row>
                </Section>

                <Section
                    icon={ <IconTrash /> }
                    title={ __( 'Manual Controls', 'captain-media-shield' ) }
                >
                    <Row label={ __( 'Purge All Backups Now', 'captain-media-shield' ) } hint={ __( 'Permanently deletes every original in the backup folder and frees that space. Optimized files and WebP/AVIF/WebM copies are not affected.', 'captain-media-shield' ) }>
                        <button type="button" className="capms-btn capms-btn--danger" onClick={ () => setConfirmPurge( true ) } disabled={ busy || ( disk && disk.files === 0 ) }>
                            <IconTrash />
                            { __( 'Purge All Backups', 'captain-media-shield' ) }
                        </button>
                    </Row>
                    <Row last label={ <span className="capms-label-icon"><IconRestore />{ __( 'Restore Original File', 'captain-media-shield' ) }</span> } hint={ __( 'Open the Media Library in list view - every optimized image or video with a backup gets a "Restore Original" link in the Media Shield column, row actions and attachment details.', 'captain-media-shield' ) }>
                        <a className="capms-btn capms-btn--ghost" href={ capms_data?.media_url }>
                            { __( 'Open Media Library', 'captain-media-shield' ) }
                        </a>
                    </Row>
                </Section>

                { actionMsg && <Notice tone={ actionMsg.tone === 'error' ? 'error' : 'success' }>{ actionMsg.text }</Notice> }
            </div>

            <SaveBar dirty={ dirty } saving={ saving } onSave={ save } onReset={ reset } onDiscard={ discard } message={ message } messageTone={ tone } />

            { confirmPurge && (
                <ConfirmModal
                    icon={ <IconTrash /> }
                    title={ __( 'Purge all backups?', 'captain-media-shield' ) }
                    confirmLabel={ __( 'Yes, purge everything', 'captain-media-shield' ) }
                    danger
                    busy={ busy }
                    onConfirm={ purge }
                    onClose={ () => ! busy && setConfirmPurge( false ) }
                >
                    <p>
                        { disk
                            ? sprintf( __( 'This permanently deletes %1$d original file(s) (%2$s). Optimized media keeps working, but these files can no longer be restored.', 'captain-media-shield' ), disk.files, disk.human )
                            : __( 'This permanently deletes every backed-up original. Optimized media keeps working, but files can no longer be restored.', 'captain-media-shield' ) }
                    </p>
                    <strong className="capms-settings-warning-text">{ __( 'This action cannot be undone.', 'captain-media-shield' ) }</strong>
                </ConfirmModal>
            ) }
        </div>
    );
};

export default Backups;
