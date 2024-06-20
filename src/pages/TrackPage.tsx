import { useParams } from "react-router-dom";
import useTrack from "../hooks/TrackHook"
import useTrackMeta from "../hooks/TrackMetaHook";
import Loader from "../components/Loader";
import { Button, Dropdown, Grid, Text } from "@nextui-org/react"
import { convertArrayToString, downloadFile } from "../logic/Utils";
import styles from "../styles/TrackPage.module.scss"
import Waveform from "../components/Waveform";
import useCurrentTrack from "../hooks/CurrentTrackHook";
import usePlayerUpdate from "../hooks/PlayerUpdateHook";
import { useEffect, useState } from "react";
import AudioPlayer from "../logic/AudioPlayer";
import ImageWrapper from "../components/ImageWrapper";
import { MdMoreHoriz, MdPause, MdPlayArrow } from "react-icons/md";
import GlowEffect from "../components/GlowEffect";
import TrackList from "pipebomb.js/dist/collection/TrackList";
import ListTrack from "../components/ListTrack";
import { openAddToPlaylist } from "../components/AddToPlaylist";
import { useResizeDetector } from "react-resize-detector";
import { BiPlus } from "react-icons/bi";
import PipeBombConnection from "../logic/PipeBombConnection";
import React from "react";
import useTranslation from "../hooks/TranslationHook";
import ErrorPage from "./ErrorPage";

const TrackPage = React.memo(function TrackPage() {
    let paramID: any = useParams().ID;
    const waveformRef = useResizeDetector();
    
    const track = useTrack(paramID);
    const trackMeta = useTrackMeta(track);
    const currentTrack = useCurrentTrack();
    const playerState = usePlayerUpdate({
        currentTime: true,
        paused: true
    });
    const [suggestions, setSuggestions] = useState<TrackList | null | false>(null);
    const [waveformSegments, setWaveformSegments] = useState(10);

    useEffect(() => {
        if (track) {
            setSuggestions(null);
            track.getSuggestedTracks()
            .then(setSuggestions)
            .catch(() => {
                setSuggestions(false);
            });
        } else {
            setSuggestions(false);
        }
        
    }, [track]);

    useEffect(() => {
        if (!waveformRef.width) return;
        setWaveformSegments(Math.round(waveformRef.width / 10));
    }, [waveformRef.width]);

    const [waveformPercentage, setWaveformPercentage] = useState(-1);




    if (trackMeta === null) {
        return <Loader text="Loading" />
    }

    if (!trackMeta || !track) {
        return <>
            <ErrorPage type="404" cause="track"></ErrorPage>
        </>
    }

    function waveformClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (!track) return;
        if (currentTrack?.trackID != track.trackID) {
            playTrack();
            return;
        }

        const element = e.currentTarget;

        let percent = 0;
        function setPercentage(pageX: number) {
            let x = pageX - element.getBoundingClientRect().left;

            percent = x / element.clientWidth * 100;
            setWaveformPercentage(percent);
        }

        setPercentage(e.pageX);

        function mouseMove(e: MouseEvent) {
            setPercentage(e.pageX);
        }

        document.addEventListener("mousemove", mouseMove);
        document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove", mouseMove);
            AudioPlayer.getInstance().setTime(percent);
            setWaveformPercentage(-1);
        }, {
            once: true
        });
    }

    const isActive = currentTrack?.trackID == track.trackID;
    const shouldPause = isActive && !playerState.paused;

    function playTrack() {
        if (!track) return;
        if (isActive) {
            if (playerState.paused) {
                AudioPlayer.getInstance().play();
            } else {
                AudioPlayer.getInstance().pause();
            }
        } else {
            AudioPlayer.getInstance().playTrack(track);
        }
    }

    function playSuggestions() {
        if (!suggestions) return;
        const audioPlayer = AudioPlayer.getInstance();
        audioPlayer.clearQueue();
        audioPlayer.addToQueue(suggestions.getTrackList(), false, 0);
        audioPlayer.nextTrack();
    }

    function generateSuggestionsHTML() {
        if (suggestions === null) {
            return (
                <>
                    <Text h2>{useTranslation("pages.track.similar")}</Text>
                    <div className={styles.suggestionsLoader}>
                        <Loader />
                    </div>
                </>
                
            )
        }

        if (!suggestions || !suggestions.getTrackList().length) {
            const title = trackMeta ? trackMeta.title : "this";
            return (
                <>
                    <Text h2>{useTranslation("pages.track.similar")}</Text>
                    <Text h4>{useTranslation("pages.track.error", <span className={styles.underline}>{title}</span>)}</Text>
                </>
            )
        }

        return (
            <>
                <Grid.Container gap={2} alignItems="center">
                    <Grid>
                        <Text h2>{useTranslation("pages.track.similar")}</Text>
                    </Grid>
                    <Grid>
                        <Button size="md" auto onPress={playSuggestions} className={styles.roundButton} color="gradient"><MdPlayArrow /></Button>
                    </Grid>
                </Grid.Container>
                
                <div className={styles.suggestionsList}>
                { suggestions.getTrackList().map((track, index) => (
                    <ListTrack key={index} track={track} />
                ))}
            </div>
            </>
        )
    }

    function contextMenu(button: React.Key) {
        if (!track) return;
        const audioPlayer = AudioPlayer.getInstance();
        switch (button) {
            case "queue":
                AudioPlayer.getInstance().addToQueue([track]);
                break;
            case "next-up":
                audioPlayer.addToQueue([track], false, 0);
                break;
            case "playlist":
                openAddToPlaylist(track);
                break;
            case "download":
                const filename = (trackMeta ? trackMeta.title : track.trackID) + ".mp3";
                downloadFile(track.getAudioUrl(), filename);
                break;
            case "share":
                PipeBombConnection.getInstance().copyLink("track", track.trackID);
                break;
        }
    }

    return (
        <>
            <div className={styles.top}>
                <GlowEffect active={isActive} spread={50} image={ track.getThumbnailUrl() }>
                    <div className={styles.topFlex}>
                        <div className={styles.topImage} onClick={playTrack}>
                            <ImageWrapper src={ track.getThumbnailUrl() } loadingSize="xl" />
                        </div>
                        <div className={styles.topInfo}>
                            <div className={styles.titleContainer}>
                                <Text h1 className={styles.title}>{ trackMeta.title }</Text>
                                <div className={styles.buttons}>
                                    <Button size="xl" auto onPress={playTrack} className={styles.roundButton} color="gradient">
                                        { shouldPause ? (
                                            <MdPause />
                                        ) : (
                                            <MdPlayArrow />
                                        )}
                                    </Button>
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <Button light size="xl" className={styles.contextButton}>
                                                <MdMoreHoriz />
                                            </Button>
                                        </Dropdown.Trigger>
                                        <Dropdown.Menu disabledKeys={[]} onAction={contextMenu}>
                                            <Dropdown.Item key="next-up">{useTranslation("buttons.playNext")}</Dropdown.Item>
                                            <Dropdown.Item key="queue">{useTranslation("buttons.queue")}</Dropdown.Item>
                                            <Dropdown.Item key="share">{useTranslation("buttons.share")}</Dropdown.Item>
                                            <Dropdown.Item key="playlist">{useTranslation("buttons.addToPlaylist")}</Dropdown.Item>
                                            <Dropdown.Item key="download">{useTranslation("buttons.download")}</Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    <Button light size="lg" className={styles.contextButton} onPress={() => openAddToPlaylist(track)}>
                                        <BiPlus />
                                    </Button>
                                </div>
                            </div>
                            <Text h3 className={styles.artist}>{ convertArrayToString(trackMeta.artists) }</Text>
                            <div className={styles.waveform} ref={waveformRef.ref} onMouseDownCapture={waveformClick}>
                                <Waveform url={ track.getAudioUrl() } active={true} percent={waveformPercentage != -1 ? waveformPercentage : isActive ? (playerState.currentTime / playerState.duration * 100) : 0} segments={waveformSegments} />
                            </div>
                            
                        </div>
                    </div>
                </GlowEffect>
            </div>
            <div className={styles.suggestions}>
                { generateSuggestionsHTML() }
            </div>
        </>
    )
});

export default TrackPage;