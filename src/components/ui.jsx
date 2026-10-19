import React from 'react';
import { __ } from '@wordpress/i18n';
import { IconCheck, IconInfo, IconWarning } from './icons.jsx';
import SettingsCardModal from './settings_card/settings_card_modal.jsx';
import './settings_card/settings_card.scss';

/**
 * Shared building blocks for every settings page - same visual language
 * as the other Captain plugins (section card with gradient header, toggle
 * rows, switcher, select).
 */

export const PageHeader = ( { title, subtitle, actions } ) => (
    <div className="capms-settings-header capms-page-header">
        <div>
            <h1 className="capms-settings-title">{ title }</h1>
            { subtitle && <p className="capms-settings-subtitle">{ subtitle }</p> }
        </div>
        { actions && <div className="capms-page-header-actions">{ actions }</div> }
    </div>
);

export const Section = ( { icon, title, description, badge, children } ) => (
    <div className="capms-settings-section">
        <div className="capms-settings-section-header">
            { icon && <span className="capms-settings-section-icon">{ icon }</span> }
            <div className="capms-section-head-text">
                <h3 className="capms-settings-section-title">
                    { title }
                    { badge }
                </h3>
                { description && <p className="capms-settings-section-desc">{ description }</p> }
            </div>
        </div>
        <div className="capms-section-rows">
            { children }
        </div>
    </div>
);

export const Switcher = ( { checked, onChange, disabled, danger, label } ) => (
    <button
        type="button"
        className={ `capms-switcher ${ checked ? 'capms-switcher--on' : '' } ${ danger && checked ? 'capms-switcher--danger' : '' }` }
        onClick={ () => ! disabled && onChange( ! checked ) }
        aria-pressed={ !! checked }
        aria-label={ label }
        disabled={ disabled }
    >
        <span className="capms-switcher-thumb" />
    </button>
);

export const Row = ( { label, hint, children, last, stacked, locked } ) => (
    <div className={ `capms-settings-toggle-row ${ last ? '' : 'capms-settings-row--border' } ${ stacked ? 'capms-row--stacked' : '' } ${ locked ? 'capms-row--locked' : '' }` }>
        <div className="capms-settings-toggle-info">
            <span className="capms-settings-cache-label">{ label }</span>
            { hint && <span className="capms-settings-cache-hint">{ hint }</span> }
        </div>
        <div className="capms-row-control">{ children }</div>
    </div>
);

export const ToggleRow = ( { label, hint, checked, onChange, disabled, danger, last, extra } ) => (
    <Row label={ label } hint={ hint } last={ last } locked={ disabled }>
        { extra }
        <Switcher checked={ checked } onChange={ onChange } disabled={ disabled } danger={ danger } label={ typeof label === 'string' ? label : undefined } />
    </Row>
);

export const SelectRow = ( { label, hint, value, options, onChange, disabled, last } ) => (
    <Row label={ label } hint={ hint } last={ last } locked={ disabled }>
        <select className="capms-settings-select" value={ value } onChange={ ( e ) => onChange( e.target.value ) } disabled={ disabled }>
            { options.map( ( opt ) => (
                <option key={ opt.value } value={ opt.value }>{ opt.label }</option>
            ) ) }
        </select>
    </Row>
);

export const Pill = ( { tone = 'blue', children } ) => (
    <span className={ `capms-scard-subcard-pill capms-scard-subcard-pill--${ tone } capms-pill` }>{ children }</span>
);

export const StatusPill = ( { ok, yes, no } ) => (
    <span className={ `capms-status-pill ${ ok ? 'capms-status-pill--ok' : 'capms-status-pill--bad' }` }>
        { ok ? <IconCheck /> : null }
        { ok ? ( yes || __( 'Available', 'captain-media-shield' ) ) : ( no || __( 'Not available', 'captain-media-shield' ) ) }
    </span>
);

export const Notice = ( { tone = 'info', children } ) => (
    <div className={ `capms-notice capms-notice--${ tone }` }>
        { tone === 'warning' || tone === 'error' ? <IconWarning /> : <IconInfo /> }
        <div>{ children }</div>
    </div>
);

export const StatCard = ( { icon, label, value, sub, tone = 'blue' } ) => (
    <div className={ `capms-stat-card capms-stat-card--${ tone }` }>
        <span className="capms-stat-icon">{ icon }</span>
        <div className="capms-stat-body">
            <span className="capms-stat-label">{ label }</span>
            <span className="capms-stat-value">{ value }</span>
            { sub && <span className="capms-stat-sub">{ sub }</span> }
        </div>
    </div>
);

/**
 * Sticky footer with Reset / Save - shown on every settings page.
 */
export const SaveBar = ( { dirty, saving, onSave, onReset, onDiscard, message, messageTone } ) => (
    <div className={ `capms-savebar ${ dirty ? 'capms-savebar--dirty' : '' }` }>
        <button type="button" className="capms-scard-reset-link" onClick={ onReset }>
            { __( 'Reset to Defaults', 'captain-media-shield' ) }
        </button>
        <div className="capms-savebar-right">
            { message && <span className={ `capms-settings-inline-msg capms-settings-inline-msg--${ messageTone || 'success' }` }>{ message }</span> }
            { dirty && ! saving && (
                <button type="button" className="capms-scard-btn-cancel" onClick={ onDiscard }>
                    { __( 'Discard', 'captain-media-shield' ) }
                </button>
            ) }
            <button type="button" className="capms-scard-btn-save" onClick={ onSave } disabled={ ! dirty || saving }>
                <IconCheck />
                { saving ? __( 'Saving...', 'captain-media-shield' ) : __( 'Save Changes', 'captain-media-shield' ) }
            </button>
        </div>
    </div>
);

export const ConfirmModal = ( { title, children, confirmLabel, danger, busy, onConfirm, onClose, icon } ) => (
    <SettingsCardModal
        title={ title }
        icon={ icon }
        onClose={ onClose }
        footer={
            <div className="capms-scard-footer-actions capms-confirm-actions">
                <button type="button" className="capms-scard-btn-cancel" onClick={ onClose } disabled={ busy }>
                    { __( 'Cancel', 'captain-media-shield' ) }
                </button>
                <button type="button" className={ `capms-scard-btn-save ${ danger ? 'capms-btn-danger' : '' }` } onClick={ onConfirm } disabled={ busy }>
                    { busy ? __( 'Working...', 'captain-media-shield' ) : confirmLabel }
                </button>
            </div>
        }
    >
        <div className="capms-confirm-body">{ children }</div>
    </SettingsCardModal>
);

export const Skeleton = ( { height = 120 } ) => (
    <div className="capms-skeleton" style={ { height } } />
);
