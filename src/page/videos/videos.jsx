import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { __ } from '@wordpress/i18n';
import useSettings from '../../hooks/useSettings.js';
import { ajax } from '../../services/api.js';
import { setSettingsData } from '../../redux/slice.jsx';
import { PageHeader, Section, ToggleRow, SelectRow, Row, SaveBar, Notice, Pill, StatusPill, Skeleton } from '../../components/ui.jsx';
import { IconVideo, IconZap, IconMusic, IconShield, IconTerminal, IconRefresh } from '../../components/icons.jsx';

const KEYS = [ 'video_enabled', 'webm_enabled', 'faststart_enabled', 'video_resolution', 'audio_bitrate', 'video_strip_meta', 'ffmpeg_path' ];

const Videos = () => {
    const dispatch = useDispatch();
    const { draft, support, set, save, reset, discard, dirty, saving, message, tone } = useSettings( KEYS );
    const [ checking, setChecking ] = useState( false );
    const [ ffmpegInfo, setFfmpegInfo ] = useState( null );

    const recheck = async () => {
        setChecking( true );
        const result = await ajax( 'get_environment', { refresh: 1 } );
        setChecking( false );
        if ( result.success && result.data ) {
            setFfmpegInfo( result.data );
            dispatch( setSettingsData( { support: { ...support, ffmpeg: result.data.ffmpeg, exec: result.data.exec } } ) );
        }
    };

    if ( ! draft ) {
        return (
            <div className="capms-settings-wrapper">
                <PageHeader title={ __( 'Video Optimization & Streaming', 'captain-media-shield' ) } />
                <Skeleton height={ 220 } />
            </div>
        );
    }

    const hasFfmpeg = !! support.ffmpeg;

    return (
        <div className="capms-settings-wrapper">
            <PageHeader
                title={ __( 'Video Optimization & Streaming', 'captain-media-shield' ) }
                subtitle={ __( 'Compress uploads, generate WebM and enable instant playback with FFmpeg. Videos are processed in the background via WP-Cron.', 'captain-media-shield' ) }
            />

            <div className="capms-settings-sections">

                <Section
                    icon={ <IconTerminal /> }
                    title={ __( 'FFmpeg Engine', 'captain-media-shield' ) }
                    description={ __( 'All video features run through a local FFmpeg binary. Without it, videos are uploaded untouched - nothing breaks.', 'captain-media-shield' ) }
                    badge={ <StatusPill ok={ hasFfmpeg } yes={ __( 'FFmpeg detected', 'captain-media-shield' ) } no={ __( 'FFmpeg not found', 'captain-media-shield' ) } /> }
                >
                    <Row
                        last
                        label={ __( 'Custom FFmpeg binary path', 'captain-media-shield' ) }
                        hint={ ffmpegInfo?.ffmpeg_version
                            ? ffmpegInfo.ffmpeg_version
                            : __( 'Optional. Leave empty to auto-detect from the system PATH. Example: /usr/bin/ffmpeg or C:\\ffmpeg\\bin\\ffmpeg.exe', 'captain-media-shield' ) }
                    >
                        <div className="capms-inline-field">
                            <input
                                type="text"
                                className="capms-input capms-input--wide"
                                placeholder="/usr/bin/ffmpeg"
                                value={ draft.ffmpeg_path || '' }
                                onChange={ ( e ) => set( 'ffmpeg_path', e.target.value ) }
                            />
                            <button type="button" className="capms-btn capms-btn--ghost" onClick={ recheck } disabled={ checking || dirty }>
                                <IconRefresh />
                                { checking ? __( 'Checking…', 'captain-media-shield' ) : __( 'Re-check', 'captain-media-shield' ) }
                            </button>
                        </div>
                    </Row>
                </Section>

                { ! hasFfmpeg && (
                    <Notice tone="warning">
                        { support.exec === false
                            ? __( 'exec() is disabled on this server, so FFmpeg cannot be used. Ask your host to enable it - video settings below are saved but will not run until then.', 'captain-media-shield' )
                            : __( 'FFmpeg was not found. Install it on the server (or set its path above and save) to enable video compression, Fast Start and WebM. Image optimization works without it.', 'captain-media-shield' ) }
                    </Notice>
                ) }

                <Section
                    icon={ <IconVideo /> }
                    title={ __( 'Compression & Formats', 'captain-media-shield' ) }
                    description={ __( 'MP4 / MOV files are re-encoded to H.264 in place and only kept when smaller. WebM (VP9) is added as an extra, lighter source.', 'captain-media-shield' ) }
                >
                    <ToggleRow
                        label={ __( 'Enable Video Compression & Optimization', 'captain-media-shield' ) }
                        checked={ !! draft.video_enabled }
                        onChange={ ( v ) => set( 'video_enabled', v ) }
                        extra={ ! hasFfmpeg && <Pill tone="orange">{ __( 'Needs FFmpeg', 'captain-media-shield' ) }</Pill> }
                    />
                    <ToggleRow
                        last
                        label={ __( 'Enable WebM Format Generation', 'captain-media-shield' ) }
                        hint={ __( 'The WebM copy is offered first in [video] players and video blocks; browsers fall back to the MP4.', 'captain-media-shield' ) }
                        checked={ !! draft.webm_enabled }
                        onChange={ ( v ) => set( 'webm_enabled', v ) }
                        extra={ ! hasFfmpeg && <Pill tone="orange">{ __( 'Needs FFmpeg', 'captain-media-shield' ) }</Pill> }
                    />
                </Section>

                <Section
                    icon={ <IconZap /> }
                    title={ __( 'Streaming', 'captain-media-shield' ) }
                    description={ __( 'Settings that decide how fast a video starts and how heavy it is to stream.', 'captain-media-shield' ) }
                >
                    <ToggleRow
                        label={ __( 'Moov Atom "Fast Start" Optimization', 'captain-media-shield' ) }
                        hint={ __( 'Moves the index to the start of the file so playback begins instantly instead of after the whole file downloads. Lossless.', 'captain-media-shield' ) }
                        checked={ !! draft.faststart_enabled }
                        onChange={ ( v ) => set( 'faststart_enabled', v ) }
                    />
                    <SelectRow
                        last
                        label={ __( 'Max Video Resolution', 'captain-media-shield' ) }
                        hint={ __( 'Videos are never upscaled. Portrait videos are capped on their width.', 'captain-media-shield' ) }
                        value={ draft.video_resolution }
                        onChange={ ( v ) => set( 'video_resolution', v ) }
                        options={ [
                            { value: '1080', label: __( '1080p (Full HD)', 'captain-media-shield' ) },
                            { value: '720', label: __( '720p (HD)', 'captain-media-shield' ) },
                            { value: 'original', label: __( 'Keep Original', 'captain-media-shield' ) },
                        ] }
                    />
                </Section>

                <Section
                    icon={ <IconMusic /> }
                    title={ __( 'Audio & Metadata', 'captain-media-shield' ) }
                >
                    <SelectRow
                        label={ __( 'Audio Bitrate Compression', 'captain-media-shield' ) }
                        value={ draft.audio_bitrate }
                        onChange={ ( v ) => set( 'audio_bitrate', v ) }
                        options={ [
                            { value: '128', label: __( '128 kbps (Stereo - Recommended)', 'captain-media-shield' ) },
                            { value: '96', label: __( '96 kbps', 'captain-media-shield' ) },
                            { value: 'original', label: __( 'Keep Original', 'captain-media-shield' ) },
                        ] }
                    />
                    <ToggleRow
                        last
                        label={ <span className="capms-label-icon"><IconShield />{ __( 'Strip Video Metadata & Tags', 'captain-media-shield' ) }</span> }
                        hint={ __( 'Removes recording device, GPS location, creation tool and chapter data.', 'captain-media-shield' ) }
                        checked={ !! draft.video_strip_meta }
                        onChange={ ( v ) => set( 'video_strip_meta', v ) }
                    />
                </Section>
            </div>

            <SaveBar dirty={ dirty } saving={ saving } onSave={ save } onReset={ reset } onDiscard={ discard } message={ message } messageTone={ tone } />
        </div>
    );
};

export default Videos;
