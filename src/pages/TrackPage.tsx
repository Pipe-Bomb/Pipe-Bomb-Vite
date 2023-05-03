import { useParams } from "react-router-dom";
import useTrack from "../hooks/TrackHook"
import useTrackMeta from "../hooks/TrackMetaHook";
import Loader from "../components/Loader";
import { Button, Text } from "@nextui-org/react"
import { convertArrayToString } from "../logic/Utils";
import styles from "../styles/TrackPage.module.scss"
import LazyImage from "../components/LazyImage";
import Waveform from "../components/Waveform";
import useWindowSize from "../hooks/WindowSizeHook";
import useCurrentTrack from "../hooks/CurrentTrackHook";
import usePlayerUpdate from "../hooks/PlayerUpdateHook";
import { useCallback, useEffect, useRef, useState } from "react";
import AudioPlayer from "../logic/AudioPlayer";
import ImageWrapper from "../components/ImageWrapper";
import { MdPause, MdPlayArrow } from "react-icons/md";
import GlowEffect from "../components/GlowEffect";

export default function TrackPage() {
    let paramID: any = useParams().ID;
    const size = useWindowSize();
    
    const track = useTrack(paramID);
    const trackMeta = useTrackMeta(track);
    const currentTrack = useCurrentTrack();
    const playerState = usePlayerUpdate({
        currentTime: true,
        paused: true
    });

    function resize(node: HTMLDivElement) {
        if (!node) return;
        const width = node.clientWidth;
        setWaveformSegments(Math.round(width / 10));
    }

    const waveformContainer = useRef<HTMLDivElement>(null);
    const waveformContainerCallback = useCallback((node: HTMLDivElement) => {
        waveformContainer.current = node;
        resize(node);
    }, []);
    const [waveformPercentage, setWaveformPercentage] = useState(-1);

    const [waveformSegments, setWaveformSegments] = useState(10);

    useEffect(() => {
        if (!waveformContainer.current) return;
        resize(waveformContainer.current);
    }, [size]);

    if (trackMeta === null) {
        return <Loader text="Loading..." />
    }

    if (!trackMeta || !track) {
        return <>
            <Text h1>Error 404</Text>
            <Text h3>Track Not Found.</Text>
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
            const x = pageX - element.offsetLeft - 250;
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
                                <Button size="xl" auto onPress={playTrack} className={styles.roundButton} color="gradient">
                                    { shouldPause ? (
                                        <MdPause />
                                    ) : (
                                        <MdPlayArrow />
                                    )}
                                </Button>
                            </div>
                            <Text h3 className={styles.artist}>{ convertArrayToString(trackMeta.artists) }</Text>
                            <div className={styles.waveform} ref={waveformContainerCallback} onMouseDownCapture={waveformClick}>
                                <Waveform url={ track.getAudioUrl() } active={true} percent={waveformPercentage != -1 ? waveformPercentage : isActive ? (playerState.currentTime / playerState.duration * 100) : 0} segments={waveformSegments} />
                            </div>
                            
                        </div>
                    </div>
                </GlowEffect>
            </div>
        </>
    )
}