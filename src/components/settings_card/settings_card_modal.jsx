import React, { useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Popup opened by a SettingsCard's gear icon - holds the deeper
 * configuration for that card so the card itself stays compact.
 *
 * `size="lg"` renders a wider, two-column-friendly popup with a richer
 * header (icon, badge, subtitle) and an optional footer (Reset/Cancel/Save).
 */
const SettingsCardModal = ({
    title,
    onClose,
    children,
    size = 'md',        // 'md' | 'lg'
    icon,
    badge,              // e.g. "v1.3 Active"
    subtitle,
    footer,             // optional custom footer node
}) => {
    const modalRef = useRef( null );

    useEffect( () => {
        const handleKeyDown = ( e ) => {
            if ( e.key === 'Escape' ) {
                e.stopPropagation();
                if ( onClose ) onClose();
            } else if ( e.key === 'Tab' && modalRef.current ) {
                const focusable = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if ( focusable.length ) {
                    const first = focusable[ 0 ];
                    const last  = focusable[ focusable.length - 1 ];
                    if ( e.shiftKey && document.activeElement === first ) {
                        last.focus();
                        e.preventDefault();
                    } else if ( ! e.shiftKey && document.activeElement === last ) {
                        first.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener( 'keydown', handleKeyDown );
        return () => document.removeEventListener( 'keydown', handleKeyDown );
    }, [ onClose ] );

    return (
        <div className="capms-scard-modal-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
            <div ref={modalRef} className={`capms-scard-modal ${size === 'lg' ? 'capms-scard-modal--lg' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="capms-scard-modal-header">
                    <div className="capms-scard-modal-heading">
                        {icon && <span className="capms-scard-modal-icon">{icon}</span>}
                        <div>
                            <div className="capms-scard-modal-title-row">
                                <h3 className="capms-scard-modal-title">{title}</h3>
                                {badge && <span className="capms-scard-modal-badge">{badge}</span>}
                            </div>
                            {subtitle && <p className="capms-scard-modal-subtitle">{subtitle}</p>}
                        </div>
                    </div>
                    <button type="button" className="capms-scard-modal-close" onClick={onClose} aria-label={ __( 'Close', 'captain-media-shield' ) }>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="capms-scard-modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="capms-scard-modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsCardModal;
