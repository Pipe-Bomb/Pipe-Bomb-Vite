import { Button, Grid, Loading, Text } from '@nextui-org/react';
import Track from 'pipebomb.js/dist/music/Track';
import { useState, useEffect } from "react";
import PlaylistIndex from '../logic/PlaylistIndex';
import styles from "../styles/AddToPlaylist.module.scss";
import { openCreatePlaylist } from "./CreatePlaylist";
import CustomModal from './CustomModal';
import Loader from './Loader';
import Playlist from 'pipebomb.js/dist/collection/Playlist';
import { createNotification } from './NotificationManager';
import React from 'react';
import useTranslation from '../hooks/TranslationHook';
import { localise } from '../logic/LanguageAdapter';

let openModal = () => {};
let addToPlaylist = (playlistID: string) => {};
let selectedTrack: Track | null = null;

export function openAddToPlaylist(track: Track) {
    selectedTrack = track;
    openModal();
}

export function addTrack(playlist: Playlist) {
    addToPlaylist(playlist.collectionID);
}

interface lastButton {
    playlistID: string,
    value: React.ReactNode,
    isAdded: boolean
}

const AddToPlaylist = React.memo(function AddToPlaylist() {
    const [visible, setVisible] = useState(false);
    const [playlists, setPlaylists] = useState(PlaylistIndex.getInstance().getPlaylists());
    const [lastTrackButton, setLastTrackButton] = useState<lastButton>({
        playlistID: "",
        value: "",
        isAdded: false
    });

    const lastTrackButtonAdd = useTranslation("components.addToPlaylist.lastTrackButton.add");
    const lastTrackButtonAdded = useTranslation("components.addToPlaylist.lastTrackButton.added");
    const lastTrackButtonError = useTranslation("components.addToPlaylist.lastTrackButton.error");

    openModal = () => {
        setLastTrackButton({
            playlistID: "",
            value: "",
            isAdded: false
        });
        setVisible(true);
    }

    useEffect(() => {
        PlaylistIndex.getInstance().registerUpdateCallback(setPlaylists);

        return () => {
            PlaylistIndex.getInstance().unregisterUpdateCallback(setPlaylists);
        }
    }, []);

    addToPlaylist = (playlistID: string) => {
        if (!selectedTrack || (lastTrackButton.playlistID == playlistID && lastTrackButton.isAdded)) return;

        PlaylistIndex.getInstance().getPlaylist(playlistID)
        .then(playlist => {
            setLastTrackButton({
                playlistID: playlist.collectionID,
                value: <Loading type="points"></Loading>,
                isAdded: false
            });

            if (!selectedTrack) return;
    
            playlist.addTracks(selectedTrack)
            .then(async () => {
                let trackName = "track";
                if (selectedTrack && !selectedTrack.isUnknown()) {
                    trackName = (await selectedTrack.loadMetadata()).title;
                }
                createNotification({
                    text: localise("components.addToPlaylist.notifications.added", trackName, playlist.getName())
                });
                setLastTrackButton({
                    playlistID: playlist.collectionID,
                    value: lastTrackButtonAdded,
                    isAdded: true
                });
            }).catch(async (error: any) => {
                console.error(error);
                let trackName = "track";
                if (selectedTrack && !selectedTrack.isUnknown()) {
                    trackName = (await selectedTrack.loadMetadata()).title;
                }
                createNotification({
                    text: localise("components.addToPlaylist.notifications.failed", trackName, playlist.getName())
                });
                setLastTrackButton({
                    playlistID: playlist.collectionID,
                    value: lastTrackButtonError,
                    isAdded: false
                });
            });
        })
    }

    const playlistsLoaderText = useTranslation("common.loader.playlists");

    function generatePlaylistHTML() {
        if (!playlists) return <Loader text={playlistsLoaderText as string} />;

        return playlists.map(playlist => (
            <div key={playlist.collectionID} className={styles.playlist}>
                <Text className={styles.name} h3>{playlist.getName()}</Text>
                <Button className={styles.add} color="secondary" auto onPress={() => addToPlaylist(playlist.collectionID)} disabled={lastTrackButton.playlistID == playlist.collectionID}>{lastTrackButton.playlistID == playlist.collectionID ? lastTrackButton.value : lastTrackButtonAdd}</Button>
            </div>
        ));
    }

    return (
        <>
            <CustomModal visible={visible} onClose={() => setVisible(false)} title={useTranslation("components.addToPlaylist.title") as string}>
                { generatePlaylistHTML() }
                <Grid.Container justify="flex-end">
                    <Grid>
                        <Button onPress={() => openCreatePlaylist(selectedTrack || undefined)} bordered auto>{useTranslation("buttons.newPlaylist")}</Button>
                    </Grid>
                </Grid.Container>
            </CustomModal>
        </>
    )
});

export default AddToPlaylist;