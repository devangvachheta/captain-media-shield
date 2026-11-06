import React from 'react';
import { __ } from '@wordpress/i18n';
import useSettings from '../../hooks/useSettings.js';
import { PageHeader, Section, ToggleRow, SelectRow, Notice, Skeleton } from '../../components/ui.jsx';
import { IconGlobe, IconDatabase } from '../../components/icons.jsx';
import './settings.scss';

const KEYS = [ 'admin_bar_menu', 'admin_bar_inspector_mode', 'preserve_settings', 'clear_on_uninstall' ];

const Settings = () => {
    const { draft, set, save, reset, discard, dirty, saving, message, tone } = useSettings( KEYS );

    if ( ! draft ) {
        return (
            <div className="capms-settings-wrapper">
                <PageHeader title={ __( 'Settings', 'captain-media-shield' ) } />
                <Skeleton height={ 180 } />
                <Skeleton height={ 220 } />
            </div>
        );
    }

    const handlePreserveChange = ( val ) => {
        set( 'preserve_settings', val );
        if ( val ) {
            set( 'clear_on_uninstall', false );
        }
    };

    const handleClearChange = ( val ) => {
        set( 'clear_on_uninstall', val );
        if ( val ) {
            set( 'preserve_settings', false );
        }
    };

    return (
        <div className="capms-settings-wrapper capms-settings-page">
            <PageHeader
                title={ __( 'Settings', 'captain-media-shield' ) }
                subtitle={ __( 'Manage WordPress admin bar integration and plugin data retention options.', 'captain-media-shield' ) }
                saveProps={ { dirty, saving, onSave: save, onReset: reset, onDiscard: discard, message, messageTone: tone } }
            />

            <div className="capms-settings-sections">
                <Section
                    icon={ <IconGlobe /> }
                    title={ __( 'Toolbar & Admin Bar', 'captain-media-shield' ) }
                    description={ __( 'Control how Captain Media Shield appears in the top WordPress admin bar for administrators.', 'captain-media-shield' ) }
                >
                    <ToggleRow
                        last={ draft.admin_bar_menu === false }
                        label={ __( 'Show in WordPress Admin Bar', 'captain-media-shield' ) }
                        hint={ __( 'Displays a live Page Media Inspector and status indicator in the top toolbar when logged in as administrator.', 'captain-media-shield' ) }
                        checked={ draft.admin_bar_menu !== false }
                        onChange={ ( v ) => set( 'admin_bar_menu', v ) }
                    />

                    { draft.admin_bar_menu !== false && (
                        <SelectRow
                            last
                            label={ __( 'Unoptimized Images Display Mode', 'captain-media-shield' ) }
                            hint={ __( 'Choose how unoptimized original images on the current page are shown and located in the Page Media Inspector.', 'captain-media-shield' ) }
                            value={ draft.admin_bar_inspector_mode || 'list' }
                            options={ [
                                { value: 'list', label: __( 'Expandable Thumbnail List (Click to Scroll) — Recommended', 'captain-media-shield' ) },
                                { value: 'highlight', label: __( 'Highlight on Page (Glowing Borders)', 'captain-media-shield' ) },
                                { value: 'both', label: __( 'Both (Thumbnail List & Highlight Button)', 'captain-media-shield' ) },
                            ] }
                            onChange={ ( v ) => set( 'admin_bar_inspector_mode', v ) }
                        />
                    ) }
                </Section>

                <Section
                    icon={ <IconDatabase /> }
                    title={ __( 'Plugin Data & Retention', 'captain-media-shield' ) }
                    description={ __( 'Choose whether to preserve or permanently remove plugin tables and settings when uninstalling.', 'captain-media-shield' ) }
                >
                    <ToggleRow
                        label={ __( 'Preserve settings if plugin is removed', 'captain-media-shield' ) }
                        hint={ __( 'Keeps all your plugin configurations and optimization records in the database even if the plugin is uninstalled.', 'captain-media-shield' ) }
                        checked={ !! draft.preserve_settings }
                        onChange={ handlePreserveChange }
                    />

                    <ToggleRow
                        last
                        danger
                        label={ __( 'Clear all data on uninstall', 'captain-media-shield' ) }
                        hint={
                            <div className="capms-uninstall-hint">
                                <span>
                                    { __( 'Permanently deletes all plugin database tables (capms_media), stored settings, post meta, and scheduled cron jobs when uninstalled. ', 'captain-media-shield' ) }
                                    <strong className="capms-settings-warning-text">{ __( 'This action cannot be undone.', 'captain-media-shield' ) }</strong>
                                </span>
                                { draft.clear_on_uninstall && (
                                    <div className="capms-settings-warning-badge">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        { __( 'All plugin data will be deleted on uninstall!', 'captain-media-shield' ) }
                                    </div>
                                ) }
                            </div>
                        }
                        checked={ !! draft.clear_on_uninstall }
                        onChange={ handleClearChange }
                    />
                </Section>

                <Notice tone="info">
                    <strong>{ __( 'Note on your media files:', 'captain-media-shield' ) }</strong>{ ' ' }
                    { __( 'Your optimized images, videos, and generated WebP/AVIF/WebM companion files stored in wp-content/uploads/ are never deleted during uninstall to protect your live website.', 'captain-media-shield' ) }
                </Notice>
            </div>
        </div>
    );
};

export default Settings;
