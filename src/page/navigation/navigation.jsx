import React, { useState } from 'react';
import './navigation.scss';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';
import { toggleTheme, toggleSidebar } from '../../redux/slice.jsx';
import { IconDashboard, IconImage, IconVideo, IconBackup, IconBulk, IconHealth, IconDocs, IconDatabase, IconTrash } from '../../components/icons.jsx';

const PLUGIN_VERSION = ( typeof capms_data !== 'undefined' && capms_data?.capms_version ) ? capms_data.capms_version : '0.0.1';

const IconChevron = ( { open } ) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={ { transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' } }>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// Brand mark: the Captain "C" ring wrapped around a shield.
const LogoSVG = ( { theme } ) => {
    const color = theme === 'dark' ? '#ffffff' : '#085F63';
    return (
        <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M89.5 24.2C84.2 15 76.1 7.8 66.4 3.7 56.8-.4 46.2-1.1 36.1 1.6 26 4.3 17.1 10.3 10.6 18.7 4.1 27.1.4 37.5 0 48.3c-.3 10.8 2.7 21.4 8.6 30.2 5.9 8.9 14.5 15.5 24.3 18.9 9.9 3.4 20.5 3.4 30.4.1 9.9-3.4 18.4-10 24.4-18.8L74.6 69.1c-4 5.9-9.7 10.3-16.3 12.5-6.6 2.3-13.7 2.3-20.3 0-6.6-2.3-12.3-6.7-16.2-12.6-4-5.9-6-13-5.7-20.1.2-7.2 2.7-14.1 7-19.7 4.3-5.6 10.3-9.6 17-11.4 6.7-1.8 13.8-1.3 20.2 1.4 6.4 2.7 11.8 7.5 15.4 13.7L89.5 24.2Z" fill={ color } />
            <path d="M66 36.5l-16-6-16 6v11c0 10.5 7 19.6 16 22 9-2.4 16-11.5 16-22v-11Z" fill={ color } />
            <path d="M43.5 49.5l5 5 9-10" stroke={ theme === 'dark' ? '#1a1d27' : '#ffffff' } strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

const ThemeToggle = ( { theme, dispatch } ) => (
    <button
        type="button"
        className="capms-dm-toggle"
        title={ theme === 'dark' ? __( 'Switch to Light Mode', 'captain-media-shield' ) : __( 'Switch to Dark Mode', 'captain-media-shield' ) }
        aria-label={ theme === 'dark' ? __( 'Switch to Light Mode', 'captain-media-shield' ) : __( 'Switch to Dark Mode', 'captain-media-shield' ) }
        onClick={ () => dispatch( toggleTheme() ) }
    >
        <svg className="capms-dm-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <svg className="capms-dm-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    </button>
);

const IconHamburger = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);
const IconClose = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const IconSidebarToggle = ( { collapsed = false } ) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"
        style={ { transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' } }>
        <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Navigation = () => {
    const location         = useLocation();
    const dispatch         = useDispatch();
    const theme            = useSelector( state => state.theme );
    const sidebarCollapsed = useSelector( state => state.sidebarCollapsed );
    const [ optimizeOpen, setOptimizeOpen ] = useState( true );
    const [ toolsOpen, setToolsOpen ]       = useState( true );
    const [ mobileOpen, setMobileOpen ]     = useState( false );

    const closeMobile = () => setMobileOpen( false );

    const isActive = ( path ) => ( path === '/' ? location.pathname === '/' : location.pathname.startsWith( path ) );
    const linkClass    = ( path ) => `capms-nav-link ${ isActive( path ) ? 'capms-nav-link--active' : '' }`;
    const subLinkClass = ( path ) => `capms-nav-sublink ${ isActive( path ) ? 'capms-nav-sublink--active' : '' }`;

    return (
        <>
            <button
                className={ `capms-hamburger${ mobileOpen ? ' capms-hamburger--hidden' : '' }` }
                aria-label={ __( 'Toggle navigation menu', 'captain-media-shield' ) }
                aria-expanded={ mobileOpen }
                onClick={ () => setMobileOpen( ( o ) => ! o ) }
            >
                { mobileOpen ? <IconClose /> : <IconHamburger /> }
            </button>
            { mobileOpen && <div className="capms-nav-overlay" onClick={ closeMobile } aria-hidden="true" /> }

            <div className={ `capms-navigation-sidebar${ sidebarCollapsed ? ' capms-navigation-sidebar--collapsed' : '' }${ mobileOpen ? ' capms-nav--open' : '' }` }>

                <div className="capms-navigation-sidebar-logo">
                    <span className="capms-nav-logo-hover-area">
                        <span className="capms-nav-logo-icon"><LogoSVG theme={ theme } /></span>
                        <button
                            type="button"
                            className="capms-nav-collapse-btn capms-nav-collapse-btn--overlay"
                            title={ __( 'Expand sidebar', 'captain-media-shield' ) }
                            aria-label={ __( 'Expand sidebar', 'captain-media-shield' ) }
                            onClick={ () => dispatch( toggleSidebar() ) }
                        >
                            <IconSidebarToggle collapsed={ sidebarCollapsed } />
                        </button>
                    </span>
                    <h3>{ __( 'Captain Media Shield', 'captain-media-shield' ) }</h3>
                    <button
                        type="button"
                        className="capms-nav-collapse-btn capms-nav-collapse-btn--inline"
                        title={ __( 'Collapse sidebar', 'captain-media-shield' ) }
                        aria-label={ __( 'Collapse sidebar', 'captain-media-shield' ) }
                        onClick={ () => dispatch( toggleSidebar() ) }
                    >
                        <IconSidebarToggle />
                    </button>
                </div>

                <nav className="capms-navigation-sidebar-menu">

                    <Link to="/" className={ linkClass( '/' ) } onClick={ closeMobile }>
                        <span className="capms-nav-icon"><IconDashboard /></span>
                        <span className="capms-nav-label">{ __( 'Dashboard', 'captain-media-shield' ) }</span>
                    </Link>

                    <Link to="/bulk" className={ linkClass( '/bulk' ) } onClick={ closeMobile }>
                        <span className="capms-nav-icon"><IconBulk /></span>
                        <span className="capms-nav-label">{ __( 'Bulk Optimizer', 'captain-media-shield' ) }</span>
                    </Link>

                    <div className="capms-nav-group">
                        <button
                            className={ `capms-nav-group-header ${ optimizeOpen ? 'capms-nav-group-header--open' : '' }` }
                            onClick={ () => setOptimizeOpen( ( o ) => ! o ) }
                        >
                            <span className="capms-nav-group-label">{ __( 'Optimization', 'captain-media-shield' ) }</span>
                            <span className="capms-nav-group-chevron"><IconChevron open={ optimizeOpen } /></span>
                        </button>
                        { ( optimizeOpen || sidebarCollapsed ) && (
                            <div className="capms-nav-group-items">
                                <Link to="/images" className={ subLinkClass( '/images' ) } onClick={ closeMobile }>
                                    <span className="capms-nav-icon"><IconImage /></span>
                                    <span>{ __( 'Images & Formats', 'captain-media-shield' ) }</span>
                                </Link>
                                <Link to="/videos" className={ subLinkClass( '/videos' ) } onClick={ closeMobile }>
                                    <span className="capms-nav-icon"><IconVideo /></span>
                                    <span>{ __( 'Video & Streaming', 'captain-media-shield' ) }</span>
                                </Link>
                            </div>
                        ) }
                    </div>

                    <div className="capms-nav-group">
                        <button
                            className={ `capms-nav-group-header ${ toolsOpen ? 'capms-nav-group-header--open' : '' }` }
                            onClick={ () => setToolsOpen( ( o ) => ! o ) }
                        >
                            <span className="capms-nav-group-label">{ __( 'Storage & System', 'captain-media-shield' ) }</span>
                            <span className="capms-nav-group-chevron"><IconChevron open={ toolsOpen } /></span>
                        </button>
                        { ( toolsOpen || sidebarCollapsed ) && (
                            <div className="capms-nav-group-items">
                                <Link to="/backup" className={ subLinkClass( '/backup' ) } onClick={ closeMobile }>
                                    <span className="capms-nav-icon"><IconBackup /></span>
                                    <span>{ __( 'Backup & Retention', 'captain-media-shield' ) }</span>
                                </Link>
                                <Link to="/storage" className={ subLinkClass( '/storage' ) } onClick={ closeMobile }>
                                    <span className="capms-nav-icon"><IconDatabase /></span>
                                    <span>{ __( 'Storage Report', 'captain-media-shield' ) }</span>
                                </Link>
                                <Link to="/cleanup" className={ subLinkClass( '/cleanup' ) } onClick={ closeMobile }>
                                    <span className="capms-nav-icon"><IconTrash /></span>
                                    <span>{ __( 'Media Cleanup', 'captain-media-shield' ) }</span>
                                </Link>
                                <Link to="/health" className={ subLinkClass( '/health' ) } onClick={ closeMobile }>
                                    <span className="capms-nav-icon"><IconHealth /></span>
                                    <span>{ __( 'Server Health', 'captain-media-shield' ) }</span>
                                </Link>
                                <Link to="/docs/overview" className={ subLinkClass( '/docs' ) } onClick={ closeMobile }>
                                    <span className="capms-nav-icon"><IconDocs /></span>
                                    <span>{ __( 'Documentation', 'captain-media-shield' ) }</span>
                                </Link>
                            </div>
                        ) }
                    </div>
                </nav>

                <div className="capms-navigation-sidebar-footer">
                    <span className="capms-nav-version">
                        { __( 'VERSION', 'captain-media-shield' ) } : { PLUGIN_VERSION }
                    </span>
                    <ThemeToggle theme={ theme } dispatch={ dispatch } />
                </div>
            </div>
        </>
    );
};

export default Navigation;
