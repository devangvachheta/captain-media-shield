import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import routes from './router/routes.js';
import Navigation from './page/navigation/navigation.jsx';

const AppContent = () => {
    const theme            = useSelector( state => state.theme );
    const sidebarCollapsed = useSelector( state => state.sidebarCollapsed );

    // Apply data-capms-theme on the root wrapper - CSS vars cascade from here
    useEffect( () => {
        const el = document.getElementById( 'captain-media-shield-app' );
        if ( el ) {
            el.setAttribute( 'data-capms-theme', theme );
        }
    }, [ theme ] );

    return (
        <div className="capms-app" data-capms-theme={ theme } data-capms-sidebar={ sidebarCollapsed ? 'collapsed' : 'expanded' }>
            <Navigation />
            <div className={ `capms-app-main-content${ sidebarCollapsed ? ' capms-app-main-content--collapsed' : '' }` }>
                <React.Suspense fallback={ null }>
                    <Routes>
                        { routes.map( ( route, index ) => (
                            <Route key={ index } path={ route.path } element={ route.element } />
                        ) ) }
                    </Routes>
                </React.Suspense>
            </div>
        </div>
    );
};

const Captain_app = () => (
    <HashRouter>
        <AppContent />
    </HashRouter>
);

export default Captain_app;
