import { Input, Button, Loading, Text } from "@nextui-org/react";
import { useState, useRef, useEffect } from "react";
import PipeBombConnection from "../logic/PipeBombConnection";
import Track from "pipebomb.js/dist/music/Track";
import ListTrack from "../components/ListTrack";
import styles from "../styles/Search.module.scss";
import Loader from "../components/Loader";
import ServiceInfo from "pipebomb.js/dist/ServiceInfo";
import ExternalCollection from "pipebomb.js/dist/collection/ExternalCollection";
import ListPlaylist from "../components/ListPlaylist";
import { useNavigate } from "react-router-dom";
import { TbMoodEmpty } from "react-icons/tb";
import CenterIcon from "../components/CenterIcon";
import PlaylistCollection from "../components/PlaylistCollection";
import React from "react";
import useTranslation from "../hooks/TranslationHook";

interface storedResults {
    tracks: Track[],
    playlists: ExternalCollection[]
}

let value = "";
let storedTrackList: storedResults = {
    tracks: [],
    playlists: []
};
let storedPlatform = "Youtube Music";

const SearchPage = React.memo(function SearchPage() {
    const input = useRef<HTMLInputElement>(null);
    const [currentPlatform, setCurrentPlatform] = useState(storedPlatform);
    const [services, setServices] = useState<ServiceInfo[] | null>(null);
    const [trackList, setTrackList] = useState(storedTrackList.tracks);
    const [playlists, setPlaylists] = useState(storedTrackList.playlists)
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function keyPress(event: React.KeyboardEvent) {
        if (event.key !== "Enter") return;
        search();
    }

    useEffect(() => {
        PipeBombConnection.getInstance().getApi().v1.getServices()
        .then(setServices)
        .catch(e => {
            console.error(e);
        });
    }, []);

    function search() {
        const target = input.current?.value;

        if (!target) return;
        setLoading(true);
        PipeBombConnection.getInstance().getApi().v1.search(storedPlatform, target)
        .then(response => {
            if (response.responseType == "found object") {
                if (response.objectType == "playlist") {
                    return navigate("/collection/playlist/" + response.id);
                }
                if (response.objectType == "track") {
                    return navigate("/track/" + response.id);
                }
            } else {
                storedTrackList.tracks.splice(0, storedTrackList.tracks.length);
                storedTrackList.playlists.splice(0, storedTrackList.playlists.length);

                for (let item of response.results) {
                    if (item instanceof Track) {
                        storedTrackList.tracks.push(item);
                    } else if (item instanceof ExternalCollection) {
                        storedTrackList.playlists.push(item);
                    }
                }
                setTrackList(storedTrackList.tracks);
                setPlaylists(storedTrackList.playlists);
                setLoading(false);
            }
        }).catch((error) => {
            console.error(error);
            setTrackList([]);
            setLoading(false);
        });
    }

    function setPlatform(platform: string) {
        if (storedPlatform == platform) return;
        storedPlatform = platform;
        setCurrentPlatform(storedPlatform);
        search();
    }

    function generateServices() {
        if (services === null) {
            return <Loader text="Loading Services"></Loader>;
        } else {
            const serverUrl = PipeBombConnection.getInstance().getUrl();
            return <>
                <div className={styles.buttonGroup}>
                    { services.map(service => (
                        <Button className={styles.serviceButton} key={service.name} disabled={currentPlatform == service.name} onPress={() => setPlatform(service.name)} light={currentPlatform != service.name} auto>
                            <img className={styles.icon} src={`${serverUrl}/v1/serviceicon/${service.name}`} />
                            {service.name}
                        </Button>
                    )) }
                </div>
                <div className={styles.list}>
                    { generateList() }
                </div>
            </>;
        }
    }

    function generateList() {
        if (loading) {
            return <Loader text="Searching"></Loader>;
        } else if (!trackList.length) {
            if (!value) return null;
            return (
                <CenterIcon icon={<TbMoodEmpty />} text="No Results" />
            )
        } else {
            const newTracklist = Array.from(trackList);
            const firstTracks = newTracklist.splice(0, 5);
            if (playlists.length) {
                return <>
                    <Text h2>{useTranslation("pages.search.top")}</Text>
                    {firstTracks.map((item, index) => (
                        <ListTrack key={index} track={item} />
                    ))}
                    <Text h2>{useTranslation("pages.search.playlists")}</Text>
                    <div className={styles.playlists}>
                        <PlaylistCollection>
                            {playlists.map((item, index) => (
                                <ListPlaylist key={index} url={`/collection/playlist/${item.collectionID}`} title={item.getName()} subtitle={item.service + " playlist"} image={item.getThumbnailUrl()} />
                            ))}
                        </PlaylistCollection>
                    </div>
                    {!!newTracklist.length && (
                        <Text h2>{useTranslation("pages.search.loadMore")}</Text>
                    )}
                    {newTracklist.map((item, index) => (
                        <ListTrack key={index} track={item} />
                    ))}
                </>
            } else {
                return <>
                    <Text h2>{useTranslation("pages.search.top")}</Text>
                    {firstTracks.map((item, index) => (
                        <ListTrack key={index} track={item} />
                    ))}
                    {!!newTracklist.length && (
                        <Text h2>{useTranslation("pages.search.loadMore")}</Text>
                    )}
                    {newTracklist.map((item, index) => (
                        <ListTrack key={index} track={item} />
                    ))}
                </>
            }
        }
    }

    return (
        <>
        <div className={styles.top}>
            <Input
                ref={input}
                size="xl"
                placeholder="Search"
                clearable
                bordered
                fullWidth
                onKeyDown={keyPress}
                onChange={e => value = e.target.value}
                className={styles.bar}
                initialValue={value}
                autoFocus
            />
            <Button
                size="lg"
                bordered onPress={search}
                className={styles.button}
                auto
            >
                {useTranslation("buttons.search")}
            </Button>
        </div>
        { generateServices() }
    </>
  );
});

export default SearchPage;