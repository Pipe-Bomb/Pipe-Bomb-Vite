import { Grid, Text } from "@nextui-org/react";
import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import PipeBombUser from "../components/PipeBombUser";
import PlaylistIndex from "../logic/PlaylistIndex";
import styles from "../styles/Home.module.scss";
import TrackList from "pipebomb.js/dist/collection/TrackList";
import PipeBombConnection, { UserData } from "../logic/PipeBombConnection";
import ChartIndex from "../logic/ChartIndex";
import SquareChart from "../components/SquareChart";
import PlaylistCollection from "../components/PlaylistCollection";
import React from "react";
import useTranslation from "../hooks/TranslationHook";

const HomePage = React.memo(function HomePage() {
    const [playlists, setPlaylists] = useState(PlaylistIndex.getInstance().getPlaylists());
    const [charts, setCharts] = useState<TrackList[] | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    
    function reload() {
        ChartIndex.getInstance().getCharts().then(setCharts);
    }

    useEffect(() => {
        PipeBombConnection.getInstance().getUserData().then(setUserData);

        PipeBombConnection.getInstance().registerUpdateCallback(reload);
        PlaylistIndex.getInstance().registerUpdateCallback(setPlaylists);
        reload();

        return () => {
            PipeBombConnection.getInstance().unregisterUpdateCallback(reload);
            PlaylistIndex.getInstance().unregisterUpdateCallback(setPlaylists);
        }
    }, []);

    const playlistsText = useTranslation("pages.home.playlists");
    
    function generatePlaylistHTML() {
        if (playlists === null) {
            return (
                <div className={styles.loaderContainer}>
                    <Loader text="Loading Playlists" />
                </div>
            )
        }

        if (playlists.length) {
            return (
                <>
                    <Text h2 className={styles.title}>{playlistsText}</Text>
                    <PlaylistCollection playlists={playlists} />
                </>
            )
        }

        return null;
    }

    const chartsText = useTranslation("pages.home.charts");

    function generateChartHTML() {
        if (charts === null) {
            return (
                <div className={styles.loaderContainer}>
                    <Loader text="Loading Charts" />
                </div>
            )
        }

        if (charts.length) {
            return (
                <>
                    <Text h2 className={styles.title}>{chartsText}</Text>
                    <div className={styles.charts}>
                        {charts.map((chart, index) => (
                            <div key={index} className={styles.chart}>
                                <SquareChart chart={chart} />
                            </div>
                        ))}
                    </div>
                </>
            )
        }

        return null;
    }


    return <>
        <Grid.Container justify="space-between" alignItems="center">
            <Grid>
                {userData ? (
                    <h1>{useTranslation("pages.home.welcomeUser", userData.username)}</h1>
                ) : (
                    <h1>{useTranslation("pages.home.welcome")}</h1>
                )}
            </Grid>
            <Grid>
                <PipeBombUser />
            </Grid>
        </Grid.Container>
        
        
        { generatePlaylistHTML() }
        { generateChartHTML() }
        
        <div className={styles.bottom}></div>
    </>
});

export default HomePage;