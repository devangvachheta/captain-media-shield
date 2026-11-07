/**
 * YouTube tutorial & overview videos for Captain Media Shield.
 * Privacy-friendly: zero external requests on page load.
 */

export const OVERVIEW_VIDEO_ID  = 'yUrMv-WrrrU';
export const OVERVIEW_VIDEO_URL = `https://www.youtube.com/watch?v=${ OVERVIEW_VIDEO_ID }`;

// Privacy-enhanced YouTube domain (no tracking cookies before playback)
export const youtubeEmbedUrl = ( id = OVERVIEW_VIDEO_ID ) => `https://www.youtube-nocookie.com/embed/${ id }`;

export const VIDEO_TUTORIALS = [
    {
        id: OVERVIEW_VIDEO_ID,
        key: 'overview',
        title: 'Full Plugin Overview & Walkthrough',
        desc: 'Complete walkthrough: WebP & AVIF conversion, FastStart video streaming, and media cleanup.',
    },
];
