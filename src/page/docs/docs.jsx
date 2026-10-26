import React from 'react';
import { __ } from '@wordpress/i18n';
import { Link, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import './docs.scss';
import { Overview, Dashboard, Images, WebpAvif, Videos, Bulk, Delivery } from './articles.jsx';
import { Cleanup, Extras } from './articles3.jsx';
import { Backups, MediaLibrary, Settings, Health, HowItWorks, Privacy, Developer, Troubleshooting } from './articles2.jsx';

const T = 'captain-media-shield';

const DOC_LINKS = [
    { path: '/docs/overview',        label: __( 'Overview & Quick Start', T ) },
    { path: '/docs/dashboard',       label: __( 'Understanding the Dashboard', T ) },
    { path: '/docs/images',          label: __( 'Images & Formats Settings', T ) },
    { path: '/docs/webp-avif',       label: __( 'How WebP and AVIF Work', T ) },
    { path: '/docs/videos',          label: __( 'Video & Streaming', T ) },
    { path: '/docs/bulk',            label: __( 'Bulk Optimizer', T ) },
    { path: '/docs/delivery',        label: __( 'Serving WebP and AVIF', T ) },
    { path: '/docs/backups',         label: __( 'Backup & Retention', T ) },
    { path: '/docs/cleanup',        label: __( 'Media Cleanup & Storage Report', T ) },
    { path: '/docs/extras',         label: __( 'GIF to Video, Exclude Rules, Nginx & WP-CLI', T ) },
    { path: '/docs/media-library',   label: __( 'Media Library Integration', T ) },
    { path: '/docs/settings',        label: __( 'All Settings at a Glance', T ) },
    { path: '/docs/health',          label: __( 'Server Health', T ) },
    { path: '/docs/how-it-works',    label: __( 'How It Works Step by Step', T ) },
    { path: '/docs/privacy',         label: __( 'Security, Privacy & Uninstall', T ) },
    { path: '/docs/developer',       label: __( 'Hooks & Developer Reference', T ) },
    { path: '/docs/troubleshooting', label: __( 'Troubleshooting & FAQ', T ) },
];

const DocsSidebar = () => {
    const location = useLocation();
    return (
        <aside className="capms-docs-sidebar">
            <p className="capms-docs-sidebar-heading">{ __( 'Guides', T ) }</p>
            <div className="capms-docs-sidebar-links">
                { DOC_LINKS.map( ( doc ) => (
                    <Link
                        key={ doc.path }
                        to={ doc.path }
                        className={ `capms-docs-sidebar-link ${ location.pathname === doc.path ? 'capms-docs-sidebar-link--active' : '' }` }
                    >
                        { doc.label }
                    </Link>
                ) ) }
            </div>
        </aside>
    );
};

const Docs = () => (
    <div className="capms-docs-wrapper">
        <div className="capms-docs-header">
            <h1 className="capms-docs-title">{ __( 'Documentation', T ) }</h1>
            <p className="capms-docs-subtitle">{ __( 'Everything you need to set up and use Captain Media Shield.', T ) }</p>
        </div>

        <div className="capms-docs-layout">
            <DocsSidebar />
            <main className="capms-docs-content">
                <Routes>
                    <Route path="overview"        element={ <Overview /> } />
                    <Route path="dashboard"       element={ <Dashboard /> } />
                    <Route path="images"          element={ <Images /> } />
                    <Route path="webp-avif"       element={ <WebpAvif /> } />
                    <Route path="videos"          element={ <Videos /> } />
                    <Route path="bulk"            element={ <Bulk /> } />
                    <Route path="delivery"        element={ <Delivery /> } />
                    <Route path="backups"         element={ <Backups /> } />
                    <Route path="cleanup"         element={ <Cleanup /> } />
                    <Route path="extras"          element={ <Extras /> } />
                    <Route path="media-library"   element={ <MediaLibrary /> } />
                    <Route path="settings"        element={ <Settings /> } />
                    <Route path="health"          element={ <Health /> } />
                    <Route path="how-it-works"    element={ <HowItWorks /> } />
                    <Route path="privacy"         element={ <Privacy /> } />
                    <Route path="developer"       element={ <Developer /> } />
                    <Route path="troubleshooting" element={ <Troubleshooting /> } />
                    <Route path="*"               element={ <Navigate to="/docs/overview" replace /> } />
                </Routes>
            </main>
        </div>
    </div>
);

export default Docs;
