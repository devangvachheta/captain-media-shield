import React from 'react';

const Svg = ( { children, ...rest } ) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" { ...rest }>
        { children }
    </svg>
);

export const IconDashboard = () => (
    <Svg><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></Svg>
);
export const IconImage = () => (
    <Svg><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></Svg>
);
export const IconVideo = () => (
    <Svg><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></Svg>
);
export const IconBackup = () => (
    <Svg><path d="M21 8v13H3V8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></Svg>
);
export const IconBulk = () => (
    <Svg><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>
);
export const IconHealth = () => (
    <Svg><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Svg>
);
export const IconShield = () => (
    <Svg><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>
);
export const IconLayers = () => (
    <Svg><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></Svg>
);
export const IconResize = () => (
    <Svg><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></Svg>
);
export const IconGlobe = () => (
    <Svg><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Svg>
);
export const IconSliders = () => (
    <Svg><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></Svg>
);
export const IconMusic = () => (
    <Svg><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></Svg>
);
export const IconClock = () => (
    <Svg><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Svg>
);
export const IconTrash = () => (
    <Svg><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></Svg>
);
export const IconRestore = () => (
    <Svg><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.35" /></Svg>
);
export const IconCheck = ( props ) => (
    <Svg strokeWidth="3" width="12" height="12" { ...props }><polyline points="20 6 9 17 4 12" /></Svg>
);
export const IconX = ( props ) => (
    <Svg strokeWidth="3" width="12" height="12" { ...props }><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Svg>
);
export const IconInfo = () => (
    <Svg width="15" height="15"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></Svg>
);
export const IconWarning = () => (
    <Svg width="15" height="15"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Svg>
);
export const IconPlay = () => (
    <Svg><polygon points="5 3 19 12 5 21 5 3" /></Svg>
);
export const IconPause = () => (
    <Svg><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></Svg>
);
export const IconStop = () => (
    <Svg><rect x="5" y="5" width="14" height="14" rx="1" /></Svg>
);
export const IconRefresh = () => (
    <Svg><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></Svg>
);
export const IconDatabase = () => (
    <Svg><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></Svg>
);
export const IconPercent = () => (
    <Svg><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></Svg>
);
export const IconZap = () => (
    <Svg><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>
);
export const IconTerminal = () => (
    <Svg><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></Svg>
);
