import { Button, Grid, Loading, Modal, Text } from '@nextui-org/react';
import Track from 'pipebomb.js/dist/music/Track';
import { useState, useEffect } from "react";
import PlaylistIndex from '../logic/PlaylistIndex';
import styles from "../styles/AddToPlaylist.module.scss";
import { openCreatePlaylist } from "./CreatePlaylist";
import Playlist from 'pipebomb.js/dist/collection/Playlist';
import React from 'react';
import useTranslation from '../hooks/TranslationHook';

let openModal = () => {};
let addToPlaylist = (playlist: Playlist) => {};
let selectedTrack: Track | null = null;

export function openDeletePlaylist(track: Track) {
    selectedTrack = track;
    openModal();
}

interface lastButton {
    playlistID: string,
    value: string | JSX.Element
}

const AddToPlaylist = React.memo(function AddToPlaylist() {
    const [visible, setVisible] = useState(false);
    const [playlists, setPlaylists] = useState(PlaylistIndex.getInstance().getPlaylists());
    const [lastTrackButton, setLastTrackButton] = useState<lastButton>({
        playlistID: "",
        value: ""
    });

    openModal = () => {
        setLastTrackButton({
            playlistID: "",
            value: ""
        });
        setVisible(true);
    }

    useEffect(() => {
        PlaylistIndex.getInstance().registerUpdateCallback(setPlaylists);

        return () => {
            PlaylistIndex.getInstance().unregisterUpdateCallback(setPlaylists);
        }
    }, []);

    addToPlaylist = (playlist: Playlist) => {
        if (!selectedTrack || (lastTrackButton.playlistID == playlist.collectionID && lastTrackButton.value == "Added")) return;
        
        setLastTrackButton({
            playlistID: playlist.collectionID,
            value: <Loading type="points"></Loading>
        });

        playlist.addTracks(selectedTrack)
        .then(() => {
            setLastTrackButton({
                playlistID: playlist.collectionID,
                value: "Added"
            });
        }).catch(error => {
            console.error(error);
            setLastTrackButton({
                playlistID: playlist.collectionID,
                value: "Error"
            });
        });
    }

    return (
        <Modal
            closeButton
            aria-labelledby="modal-title"
            open={visible}
            onClose={() => setVisible(false)}
            width="600px"
            scroll
        >
            <Text h2>Add to Playlist</Text>
            {playlists && playlists.map(playlist => (
                <div key={playlist.collectionID} className={styles.playlist}>
                    <Text className={styles.name} h3>{playlist.getName()}</Text>
                    <Button className={styles.add} color="secondary" auto onPress={() => addToPlaylist(playlist)} disabled={lastTrackButton.playlistID == playlist.collectionID}>{lastTrackButton.playlistID == playlist.collectionID ? lastTrackButton.value : "Add"}</Button>
                </div>
            ))}
            <Grid.Container justify="flex-end">
                <Grid>
                    <Button onPress={() => openCreatePlaylist(selectedTrack || undefined)} className={styles.newPlaylist} bordered auto>{useTranslation("button.newPlaylist")}</Button>
                </Grid>
            </Grid.Container>
        </Modal>
    )
});

export default AddToPlaylist;