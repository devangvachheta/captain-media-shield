import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import './help.scss';
import { OVERVIEW_VIDEO_URL, VIDEO_TUTORIALS, youtubeEmbedUrl } from '../../constants/videos.js';

const IconDiscord = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
);

const IconYouTube = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);

const IconX = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const IconFacebook = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const SOCIAL_LINKS = {
    facebook: 'https://www.facebook.com/people/Captain-InfoTech/61590753579945/',
    x: 'https://x.com/devangvachheta7',
    youtube: 'https://www.youtube.com/@captaininfotech',
    discord: 'https://discord.gg/UvdHSYQA5',
};

const Help = () => {
    const [ playingVideo, setPlayingVideo ] = useState( null );
    const faqs = [
        {
            question: __( 'How does Captain Media Shield optimize images?', 'captain-media-shield' ),
            answer: __( 'It uses high-performance on-server algorithms (GD / Imagick) to compress images and generate modern WebP and AVIF formats without relying on external cloud APIs or third-party paid subscriptions.', 'captain-media-shield' ),
        },
        {
            question: __( 'Will converting to WebP/AVIF break my existing image URLs?', 'captain-media-shield' ),
            answer: __( 'No! Your original image URLs remain completely intact. Captain Media Shield serves Next Generation WebP/AVIF automatically via .htaccess rewrite rules or <picture> tags for browsers that support them.', 'captain-media-shield' ),
        },
        {
            question: __( 'Can I adjust compression quality for specific images?', 'captain-media-shield' ),
            answer: __( 'Yes! In addition to global settings (default 80%), you can adjust compression quality per image directly from the Media Library list view (using the Quick Quality popup) and the single attachment details screen.', 'captain-media-shield' ),
        },
        {
            question: __( 'Where are original backup images stored and how do I restore?', 'captain-media-shield' ),
            answer: __( 'Original uncompressed files are safely backed up in your wp-content/uploads/capms-backups/ folder. You can click "Restore" on any image to instantly bring back the original and remove generated Next Generation files.', 'captain-media-shield' ),
        },
        {
            question: __( 'Does Captain Media Shield support video compression?', 'captain-media-shield' ),
            answer: __( 'Yes! It includes FastStart streaming optimization (moving the MP4 moov atom to the front for instant video playback) and optional WebM conversion with VP9/Opus encoding via on-server ffmpeg.', 'captain-media-shield' ),
        },
        {
            question: __( 'Does Captain Media Shield send my media to external servers?', 'captain-media-shield' ),
            answer: __( 'Never. 100% of the optimization, conversion, and cleanup takes place directly on your own WordPress host server, ensuring zero data leakage, zero monthly quotas, and complete privacy.', 'captain-media-shield' ),
        },
    ];

    const socialCards = [
        {
            icon: <IconDiscord />,
            label: __( 'DISCORD COMMUNITY', 'captain-media-shield' ),
            title: __( 'Chat with Developers', 'captain-media-shield' ),
            desc: __( 'Join our Discord server to discuss features, get live help, and share feedback with creators.', 'captain-media-shield' ),
            linkText: __( 'Join Discord', 'captain-media-shield' ),
            href: SOCIAL_LINKS.discord,
        },
        {
            icon: <IconYouTube />,
            label: '@CAPTAININFOTECH',
            title: __( 'YouTube Video Tutorials', 'captain-media-shield' ),
            desc: __( 'Watch step-by-step visual setup tutorials, feature tours, and walkthroughs.', 'captain-media-shield' ),
            linkText: __( 'Watch on YouTube', 'captain-media-shield' ),
            href: OVERVIEW_VIDEO_URL,
        },
        {
            icon: <IconX />,
            label: '@DEVANGVACHHETA7',
            title: __( 'Follow Developer on X', 'captain-media-shield' ),
            desc: __( 'Get immediate updates on upcoming releases, development roadmaps, and tips.', 'captain-media-shield' ),
            linkText: __( 'Follow on X', 'captain-media-shield' ),
            href: SOCIAL_LINKS.x,
        },
        {
            icon: <IconFacebook />,
            label: __( 'CAPTAIN INFOTECH', 'captain-media-shield' ),
            title: __( 'Facebook Page', 'captain-media-shield' ),
            desc: __( 'Follow Captain InfoTech on Facebook for announcements, news, and community discussions.', 'captain-media-shield' ),
            linkText: __( 'Visit Facebook Page', 'captain-media-shield' ),
            href: SOCIAL_LINKS.facebook,
        },
    ];

    return (
        <div className="capms-help-wrapper">
            <div className="capms-help-header">
                <h1 className="capms-help-title">{ __( 'Help & Support', 'captain-media-shield' ) }</h1>
                <p className="capms-help-subtitle">{ __( 'Find answers to common questions and get started quickly.', 'captain-media-shield' ) }</p>
            </div>

            <div className="capms-help-cards">
                <div className="capms-help-card">
                    <div className="capms-help-card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </div>
                    <h3>{ __( 'Documentation', 'captain-media-shield' ) }</h3>
                    <p>{ __( 'Read our comprehensive documentation to learn all available optimization and storage features.', 'captain-media-shield' ) }</p>
                    <a href="#/docs/overview" className="capms-help-link">{ __( 'View Docs', 'captain-media-shield' ) }</a>
                </div>

                <div className="capms-help-card">
                    <div className="capms-help-card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <h3>{ __( 'Support Forum', 'captain-media-shield' ) }</h3>
                    <p>{ __( 'Open a support topic on WordPress.org and our engineering team will get back to you quickly.', 'captain-media-shield' ) }</p>
                    <a href="https://wordpress.org/support/plugin/captain-media-shield/" target="_blank" rel="noopener noreferrer" className="capms-help-link">
                        { __( 'Get Support', 'captain-media-shield' ) }
                    </a>
                </div>

                <div className="capms-help-card">
                    <div className="capms-help-card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </div>
                    <h3>{ __( 'Rate Us', 'captain-media-shield' ) }</h3>
                    <p>{ __( 'Enjoying faster loading speeds and saved disk space? Leave us a 5-star review on WordPress.org!', 'captain-media-shield' ) }</p>
                    <a href="https://wordpress.org/support/plugin/captain-media-shield/reviews/" target="_blank" rel="noopener noreferrer" className="capms-help-link">
                        { __( 'Rate Plugin', 'captain-media-shield' ) }
                    </a>
                </div>
            </div>

            <div className="capms-help-section-header">
                <h2 className="capms-help-section-title">{ __( 'Community & Social Channels', 'captain-media-shield' ) }</h2>
                <p className="capms-help-section-subtitle">{ __( 'Join fellow site owners, watch feature video tutorials, and follow developer updates.', 'captain-media-shield' ) }</p>
            </div>

            <div className="capms-help-social-cards">
                { socialCards.map( ( card, index ) => (
                    <a
                        className="capms-help-social-card"
                        href={ card.href }
                        target="_blank"
                        rel="noopener noreferrer"
                        key={ index }
                    >
                        <div className="capms-help-social-card-icon">{ card.icon }</div>
                        <span className="capms-help-social-card-label">{ card.label }</span>
                        <h3>{ card.title}</h3>
                        <p>{ card.desc }</p>
                        <span className="capms-help-social-card-link">
                            { card.linkText }
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="7" y1="17" x2="17" y2="7" />
                                <polyline points="7 7 17 7 17 17" />
                            </svg>
                        </span>
                    </a>
                ) ) }
            </div>

            <div className="capms-help-videos">
                <div className="capms-help-section-header">
                    <h2 className="capms-help-section-title">{ __( 'Video Tutorials', 'captain-media-shield' ) }</h2>
                    <p className="capms-help-section-subtitle">{ __( 'Step-by-step visual guides to get the most out of Captain Media Shield.', 'captain-media-shield' ) }</p>
                </div>

                <div className="capms-help-videos-grid">
                    { VIDEO_TUTORIALS.map( ( video, idx ) => (
                        <div className="capms-help-video-card" key={ idx }>
                            <div className="capms-help-video-media">
                                { playingVideo === idx ? (
                                    <iframe
                                        src={ `${ youtubeEmbedUrl( video.id ) }?autoplay=1` }
                                        title={ video.title }
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <button
                                        type="button"
                                        className="capms-help-video-poster"
                                        onClick={ () => setPlayingVideo( idx ) }
                                        aria-label={ `${ __( 'Play video:', 'captain-media-shield' ) } ${ video.title }` }
                                    >
                                        <div className="capms-help-video-local-poster">
                                            <div className="capms-help-video-brand-badge">
                                                <IconYouTube />
                                                <span>YouTube</span>
                                            </div>
                                            <span className="capms-help-video-play" aria-hidden="true">
                                                <svg viewBox="0 0 68 48">
                                                    <path d="M66.5 7.7c-.8-2.9-2.9-5.2-5.8-6C55.8 0 34 0 34 0S12.2 0 7.3 1.6C4.4 2.4 2.3 4.8 1.5 7.7 0 12.6 0 24 0 24s0 11.4 1.5 16.3c.8 2.9 2.9 5.2 5.8 6C12.2 48 34 48 34 48s21.8 0 26.7-1.6c2.9-.8 5-3.1 5.8-6C68 35.4 68 24 68 24s0-11.4-1.5-16.3z" fill="#ff0000" />
                                                    <path d="M27 34l18-10-18-10v20z" fill="#fff" />
                                                </svg>
                                            </span>
                                            <span className="capms-help-video-prompt">{ __( 'Click to play tutorial', 'captain-media-shield' ) }</span>
                                        </div>
                                    </button>
                                ) }
                            </div>
                            <h4>{ video.title }</h4>
                            <p>{ video.desc }</p>
                        </div>
                    ) ) }
                </div>
                <p className="capms-help-video-privacy-note">
                    { __( 'Privacy Note: Clicking play connects to YouTube (Google LLC) and may send your IP address. No cookies or external requests occur before clicking play.', 'captain-media-shield' ) }
                    { ' · ' }
                    <a href={ OVERVIEW_VIDEO_URL } target="_blank" rel="noopener noreferrer">
                        { __( 'Watch directly on YouTube ↗', 'captain-media-shield' ) }
                    </a>
                </p>
            </div>

            <div className="capms-help-faq">
                <h2 className="capms-help-faq-title">{ __( 'Frequently Asked Questions', 'captain-media-shield' ) }</h2>
                <div className="capms-help-faq-list">
                    { faqs.map( ( faq, index ) => (
                        <div className="capms-help-faq-item" key={ index }>
                            <h4 className="capms-help-faq-q">{ faq.question }</h4>
                            <p className="capms-help-faq-a">{ faq.answer }</p>
                        </div>
                    ) ) }
                </div>
            </div>
        </div>
    );
};

export default Help;
