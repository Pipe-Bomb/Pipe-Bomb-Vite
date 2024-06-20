import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PipeBombConnection from "../logic/PipeBombConnection";
import User from "pipebomb.js/dist/User";
import Playlist from "pipebomb.js/dist/collection/Playlist";
import Loader from "../components/Loader";
import styles from "../styles/UserPage.module.scss"
import ImageWrapper from "../components/ImageWrapper";
import { Text } from "@nextui-org/react"
import PlaylistCollection from "../components/PlaylistCollection";
import React from "react";
import useTranslation from "../hooks/TranslationHook";
import ErrorPage from "./ErrorPage";

const UserPage = React.memo(function UserPage() {
    const userID = useParams().userID;

    const [user, setUser] = useState<User | false>(null);
    const [userImage, setUserImage] = useState<string>(null);
    const [playlists, setPlaylists] = useState<Playlist[]>(null);

    useEffect(() => {
        PipeBombConnection.getInstance().getApi().v1.getUser(userID)
        .then(userData => {
            setUser(userData.user);
            setUserImage(PipeBombConnection.getAvatarUrl(userData.user.rawID));
            setPlaylists(userData.playlists);
        }).catch(e => {
            console.error(e);
            setUser(false);
        });
    }, [userID]);

    if (user === false) {
        return (
            <>
                <ErrorPage type="404" cause="user"></ErrorPage>
            </>
        )
    }

    if (!user) {
        return (
            <Loader text={useTranslation("common.loader.user") as string} />
        )
    }

    return (
        <>
            <div className={styles.top}>
                <div className={styles.topImage}>
                    <div className={styles.topImageInternal}>
                        <ImageWrapper src={userImage} />
                    </div>
                </div>
                <div className={styles.info}>
                    <Text h1>{ user.username }</Text>
                    <Text h2>{ user.userID.includes("@") ? user.userID : `@${user.userID}` }</Text>
                </div>
            </div>

            { !!playlists.length && (
                <div className={styles.playlists}>
                    <Text h2>{useTranslation("pages.user.playlists")}</Text>
                    <div className={styles.playlistContainer}>
                        <PlaylistCollection playlists={playlists} />
                    </div>
                </div>
            )}
        </>
    )
});

export default UserPage;