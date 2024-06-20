import ExternalCollection from "pipebomb.js/dist/collection/ExternalCollection";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import PipeBombConnection from "../logic/PipeBombConnection";
import Loader from "../components/Loader";
import { Button, Dropdown, Grid, Text } from "@nextui-org/react";
import styles from "../styles/ExternalPlaylistPage.module.scss"
import ImageWrapper from "../components/ImageWrapper";
import ListTrack from "../components/ListTrack";
import Track from "pipebomb.js/dist/music/Track";
import { MdMoreHoriz, MdPlayArrow, MdShuffle } from "react-icons/md";
import AudioPlayer from "../logic/AudioPlayer";
import { convertTracklistToM3u } from "../logic/Utils";
import PlaylistTop from "../components/PlaylistTop";
import { ViewportList } from "react-viewport-list";
import React from "react";
import useTranslation from "../hooks/TranslationHook";
import ErrorPage from "./ErrorPage";

const ExternalPlaylistPage = React.memo(function ExternalPlaylistPage() {
    const collectionID = useParams().collectionID;
    const [collection, setCollection] = useState<ExternalCollection | false>(null);
    const [tracklist, setTracklist] = useState<Track[]>(null);
    const [loading, setLoading] = useState(true);
    const audioPlayer = AudioPlayer.getInstance();

    useEffect(() => {
        setCollection(null);
        setLoading(true);
        PipeBombConnection.getInstance().getApi().v1.getExternalPlaylist(collectionID)
        .then(setCollection)
        .catch(() => setCollection(false));
    }, [collectionID]);

    function load() {
        if (!collection) return;     
        
        collection.loadNextPage().then(success => {
            setTracklist(collection.getTrackList());
            setLoading(success);
            if (success) {
                load();
            }
        });
    }

    useEffect(load, [collection]);

    useEffect(load, []);

    if (collection === false) {
        return (
            <>
                <ErrorPage type="404" cause="playlist"></ErrorPage>
            </>
        )
    }

    if (!collection) {
        return (
            <Loader text="Loading Playlist" />
        )
    }

    function playPlaylist() {
        if (!tracklist) return;
        audioPlayer.clearQueue();
        audioPlayer.addToQueue(tracklist);
        audioPlayer.nextTrack();
    }

    function shufflePlaylist() {
        if (!tracklist) return;
        audioPlayer.clearQueue();
        audioPlayer.addToQueue(tracklist, true);
        audioPlayer.nextTrack();
    }

    function contextMenu(button: React.Key) {
        switch (button) {
            case "m3u":
                if (tracklist) {
                    convertTracklistToM3u(PipeBombConnection.getInstance().getUrl(), tracklist, false, true);
                }
                break;
            case "queue":
                if (tracklist) {
                    audioPlayer.addToQueue(tracklist);
                }
                break;
            case "share":
                if (collection) {
                    PipeBombConnection.getInstance().copyLink("externalplaylist", collection.collectionID);
                }
                break;
        }
    }

     return (
        <>
            <PlaylistTop name={collection.getName()} trackCount={collection.getTrackListLength()} onPlay={playPlaylist} onShuffle={shufflePlaylist} image={collection.getThumbnailUrl()} contextMenu={
                <Dropdown.Menu onAction={contextMenu} disabledKeys={["like"]}>
                    <Dropdown.Item key="queue">{useTranslation("buttons.queue")}</Dropdown.Item>
                    <Dropdown.Item key="share">{useTranslation("buttons.share")}</Dropdown.Item>
                    <Dropdown.Item key="like">{useTranslation("buttons.likePlaylist")}</Dropdown.Item>
                    <Dropdown.Item key="m3u">{useTranslation("buttons.m3u")}</Dropdown.Item>
                </Dropdown.Menu>
            } />
            {tracklist && (
                <ViewportList items={tracklist}>
                    {(track, index) => (
                        <ListTrack key={index} track={track} />
                    )}
                </ViewportList>
            )}
            { loading && (
                <div className={styles.loader}>
                    <Loader text="Loading tracks" />
                </div>
            )}
        </>
    )
});

export default ExternalPlaylistPage;