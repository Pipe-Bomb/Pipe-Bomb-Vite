import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Grid, Text } from "@nextui-org/react";
import { TrackMeta } from "pipebomb.js/dist/music/Track";
import PipeBombConnection from "../logic/PipeBombConnection";
import Loader from "../components/Loader";
import ListTrack from "../components/ListTrack";
import AudioPlayer from "../logic/AudioPlayer";
import styles from "../styles/Playlist.module.scss";
import { MdPlayArrow, MdShuffle } from "react-icons/md";
import TrackList from "pipebomb.js/dist/collection/TrackList";
import useTrack from "../hooks/TrackHook";
import useTrackMeta from "../hooks/TrackMetaHook";
import React from "react";
import useTranslation from "../hooks/TranslationHook";
import ErrorPage from "./ErrorPage";

const SuggestionsPlaylist = React.memo(function SuggestionsPlaylist() {
    let paramID: any = useParams().ID;
    const track = useTrack(paramID);
    const trackMeta = useTrackMeta(track);
    const [suggestions, setSuggestions] = useState<TrackList | null | false>(null);

    const api = PipeBombConnection.getInstance().getApi();
    const audioPlayer = AudioPlayer.getInstance();

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

    if (trackMeta === null) {
        return <Loader text="Loading" />
    }

    if (!trackMeta) {
        return <>
            <ErrorPage type="404" cause="track"></ErrorPage>
        </>
    }

    function generateListHTML() {
        if (suggestions === null) {
            return <>
                {trackMeta && (
                    <Text h4>{useTranslation("pages.suggestions.description", <span className={styles.underline}>{trackMeta.title}</span>)}</Text>
                )}
                <Loader text="Loading Tracks" />
            </>
        }

        if (!suggestions || !suggestions.getTrackList().length) {
            const title = trackMeta ? trackMeta.title : "Unknown Track";
            return <Text h4>{useTranslation("pages.suggestions.error", <span className={styles.underline}>{title}</span>)}</Text>
        }

        return (
            <>
                {trackMeta && (
                    <Text h4>{useTranslation("pages.suggestions.description", <span className={styles.underline}>{trackMeta.title}</span>)}</Text>
                )}
                <Grid.Container gap={2} alignItems="center">
                    <Grid>
                        <Button size="xl" auto onPress={playPlaylist} className={styles.roundButton} color="gradient"><MdPlayArrow /></Button>
                    </Grid>
                    <Grid>
                        <Button size="lg" auto onPress={shufflePlaylist} className={styles.roundButton} bordered><MdShuffle /></Button>
                    </Grid>
                </Grid.Container>
                { suggestions.getTrackList().map((track, index) => (
                    <ListTrack key={index} track={track} />
                ))}
            </>
        )
    }

    function playPlaylist() {
        if (!suggestions) return;
        audioPlayer.clearQueue();
        audioPlayer.addToQueue(suggestions.getTrackList(), false, 0);
        audioPlayer.nextTrack();
    }

    function shufflePlaylist() {
        if (!suggestions) return;
        audioPlayer.clearQueue();
        audioPlayer.addToQueue(suggestions.getTrackList(), true, 0);
        audioPlayer.nextTrack();
    }

    return (
        <>
            <Text h1>{useTranslation("pages.suggestions.title")}</Text>
            { generateListHTML() }
        </>
    )
});

export default SuggestionsPlaylist;