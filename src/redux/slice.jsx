import { createSlice } from '@reduxjs/toolkit';

// Read saved theme from localStorage (persists across page reloads)
const getSavedTheme = () => {
    try {
        return localStorage.getItem( 'capms_theme' ) || 'light';
    } catch {
        return 'light';
    }
};

const getSavedSidebarCollapsed = () => {
    try {
        return localStorage.getItem( 'capms_sidebar_collapsed' ) === '1';
    } catch {
        return false;
    }
};

const initialState = {
    theme:            getSavedTheme(),
    sidebarCollapsed: getSavedSidebarCollapsed(),
    // Cached AJAX results shared across pages, so switching nav pages
    // doesn't re-fire the same request every time.
    settings: null, // saved settings
    defaults: null, // default settings (for "Reset to Defaults")
    support:  null, // server capability flags
    stats:    null, // get_stats response.data
};

const Slice = createSlice( {
    name: 'Slice',
    initialState,
    reducers: {
        toggleTheme: ( state ) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            try {
                localStorage.setItem( 'capms_theme', state.theme );
            } catch {}
        },
        toggleSidebar: ( state ) => {
            state.sidebarCollapsed = ! state.sidebarCollapsed;
            try {
                localStorage.setItem( 'capms_sidebar_collapsed', state.sidebarCollapsed ? '1' : '0' );
            } catch {}
        },
        setSettingsData: ( state, action ) => {
            const { settings, defaults, support } = action.payload;
            if ( settings ) state.settings = settings;
            if ( defaults ) state.defaults = defaults;
            if ( support ) state.support = support;
        },
        setStats: ( state, action ) => {
            state.stats = action.payload;
        },
    },
} );

export const { toggleTheme, toggleSidebar, setSettingsData, setStats } = Slice.actions;
export default Slice.reducer;
