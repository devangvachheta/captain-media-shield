import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './redux/store.js';
import Captain_app from './captain_app.js';
import './style/global.scss';
import './style/settings_page.scss';
import './style/ui.scss';

const container = document.getElementById( 'captain-media-shield-app' );

if ( container ) {
    const root = createRoot( container );

    root.render(
        <Provider store={ store }>
            <Captain_app />
        </Provider>
    );
}
