import React from 'react';
import Dashboard from '../page/dashboard/dashboard.jsx';

/* Every route except Dashboard is code-split into its own chunk via
 * React.lazy() - webpack.config.js merges all CSS back into index.css so
 * WordPress can still RTL-swap it. */
const Images  = React.lazy( () => import( /* webpackChunkName: "images" */ '../page/images/images.jsx' ) );
const Videos  = React.lazy( () => import( /* webpackChunkName: "videos" */ '../page/videos/videos.jsx' ) );
const Backups = React.lazy( () => import( /* webpackChunkName: "backup" */ '../page/backups/backups.jsx' ) );
const Bulk    = React.lazy( () => import( /* webpackChunkName: "bulk" */ '../page/bulk/bulk.jsx' ) );
const Health  = React.lazy( () => import( /* webpackChunkName: "health" */ '../page/health/health.jsx' ) );
const Docs    = React.lazy( () => import( /* webpackChunkName: "docs" */ '../page/docs/docs.jsx' ) );

const routes = [
    { path: '/',       element: <Dashboard /> },
    { path: '/images', element: <Images /> },
    { path: '/videos', element: <Videos /> },
    { path: '/backup', element: <Backups /> },
    { path: '/bulk',   element: <Bulk /> },
    { path: '/health', element: <Health /> },
    { path: '/docs/*', element: <Docs /> },
    { path: '*',       element: <Dashboard /> },
];

export default routes;
