import { useParams } from "react-router-dom";
import AudioPlayer from "../logic/AudioPlayer";
import TrackList from "pipebomb.js/dist/collection/TrackList";
import { useEffect, useState } from "react";
import ChartIndex from "../logic/ChartIndex";
import Loader from "../components/Loader";
import { Button, Dropdown, Grid, Text } from "@nextui-org/react";
import { convertTracklistToM3u } from "../logic/Utils";
import styles from "../styles/Chart.module.scss";
import { MdMoreHoriz, MdPlayArrow, MdShuffle } from "react-icons/md";
import ListTrack from "../components/ListTrack";
import NumberWrapper from "../components/NumberWrapper";
import Track from "pipebomb.js/dist/music/Track";
import PipeBombConnection from "../logic/PipeBombConnection";
import { ViewportList } from "react-viewport-list";
import React from "react";
import useTranslation from "../hooks/TranslationHook";

const ChartPage = React.memo(function ChartPage() {
    let paramID: any = useParams().chartID;
    const audioPlayer = AudioPlayer.getInstance();
    const [chart, setChart] = useState<TrackList | null>(null);
    const [trackList, setTrackList] = useState<Track[] | null>();
    
    useEffect(() => {
        ChartIndex.getInstance().getChart(paramID)
        .then(chart => {
            if (!chart) {
                console.error("invalid chart!");
            } else {
                setChart(chart);
                const newTrackList = chart.getTrackList();
                if (newTrackList) {
                    setTrackList(newTrackList);
                }
            }
        });
    }, []);

    if (!chart || !trackList) {
        return <Loader text="Loading"></Loader>
    }

    function playChart() {
        if (!trackList) return;
        audioPlayer.clearQueue();
        audioPlayer.addToQueue(trackList, false, 0);
        audioPlayer.nextTrack();
    }

    function shuffleChart() {
        if (!trackList) return;
        audioPlayer.clearQueue();
        audioPlayer.addToQueue(trackList, true, 0);
        audioPlayer.nextTrack();
    }

    function contextMenu(button: React.Key) {
        switch (button) {
            case "m3u":
                if (trackList) {
                    convertTracklistToM3u(PipeBombConnection.getInstance().getUrl(), trackList, false, true);
                }
                break;
            case "queue":
                if (trackList) {
                    audioPlayer.addToQueue(trackList);
                }
                break;
            case "share":
                PipeBombConnection.getInstance().copyLink("chart", chart.collectionID.split("/")[1]);
                break;
        }
    }

    return (
        <>
            <Text h1>{chart.getName()}</Text>
            <Grid.Container gap={2} alignItems="center" className={styles.top}>
                <Grid>
                    <Button size="xl" auto onPress={playChart} className={styles.roundButton} color="gradient"><MdPlayArrow /></Button>
                </Grid>
                <Grid>
                    <Button size="lg" auto onPress={shuffleChart} className={styles.roundButton} bordered><MdShuffle /></Button>
                </Grid>
                <Grid>
                    <Dropdown>
                        <Dropdown.Trigger>
                            <Button light size="xl" className={styles.contextButton}>
                                <MdMoreHoriz />
                            </Button>
                        </Dropdown.Trigger>
                        <Dropdown.Menu onAction={contextMenu}>
                            <Dropdown.Item key="queue">{useTranslation("buttons.queue")}</Dropdown.Item>
                            <Dropdown.Item key="share">{useTranslation("buttons.share")}</Dropdown.Item>
                            <Dropdown.Item key="m3u">{useTranslation("buttons.m3u")}</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    
                </Grid>
            </Grid.Container>
            <ViewportList items={trackList}>
                {(track, index) => (
                    <NumberWrapper key={index} number={index + 1}>
                        <ListTrack track={track} />
                    </NumberWrapper>
                )}
            </ViewportList>
        </>
    )
});

export default ChartPage;