import React from 'react';
import Dashboard from '../page/dashboard/dashboard.jsx';
import Images from '../page/images/images.jsx';
import Videos from '../page/videos/videos.jsx';
import Backups from '../page/backups/backups.jsx';
import Bulk from '../page/bulk/bulk.jsx';
import Health from '../page/health/health.jsx';
import Storage from '../page/storage/storage.jsx';
import Cleanup from '../page/cleanup/cleanup.jsx';
import Docs from '../page/docs/docs.jsx';
import Settings from '../page/settings/settings.jsx';
import Help from '../page/help/help.jsx';
import OurProducts from '../page/our-products/our-products.jsx';

const routes = [
    { path: '/',             element: <Dashboard /> },
    { path: '/images',       element: <Images /> },
    { path: '/videos',       element: <Videos /> },
    { path: '/backup',       element: <Backups /> },
    { path: '/bulk',         element: <Bulk /> },
    { path: '/health',       element: <Health /> },
    { path: '/storage',      element: <Storage /> },
    { path: '/cleanup',      element: <Cleanup /> },
    { path: '/settings',     element: <Settings /> },
    { path: '/help',         element: <Help /> },
    { path: '/our-products', element: <OurProducts /> },
    { path: '/docs/*',       element: <Docs /> },
    { path: '*',             element: <Dashboard /> },
];

export default routes;
