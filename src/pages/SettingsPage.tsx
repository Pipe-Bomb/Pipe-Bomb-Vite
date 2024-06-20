import { Button, Dropdown, Grid, Spacer, Text } from "@nextui-org/react";
import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import { getSetting, setSetting } from "../logic/SettingsIndex";
import Theme from "../logic/ThemeIndex";
import AudioPlayer from "../logic/AudioPlayer";
import LocalAudio from "../logic/audio/LocalAudio";
import Slider from "../components/Slider";
import useSetting from "../hooks/SettingHook";
import styles from "../styles/SettingsPage.module.scss"
import { useResizeDetector } from "react-resize-detector";
import React from "react";
import useTranslation from "../hooks/TranslationHook";

const themeObject = Theme.getTheme(getSetting("theme", "Classic"));

const SettingsPage = React.memo(function SettingsPage() {
    const [theme, setTheme] = useState<string>(getSetting("theme", "Classic"));
    const [themeChanged, setThemeChanged] = useState(false);
    const eqReload = useSetting("eq", "");
    const eqCanvas = useRef<HTMLCanvasElement>(null);
    const { width: eqWidth, height: eqHeight, ref: eqRef } = useResizeDetector();

    useEffect(() => {
        if (theme == getSetting("theme", "Classic")) return;
        setSetting("theme", theme);
        setThemeChanged(true);
    }, [theme]);
    

    function logout() {
        localStorage.removeItem("username");
        localStorage.removeItem("host");
        localStorage.removeItem("privateKey");
        Cookies.remove("jwt");
        location.reload();
    }

    const localAudio = AudioPlayer.getInstance().audio.getAudioType("local") as LocalAudio;
    const nodes = localAudio.getEqNodes();

    useEffect(() => {
        const localAudio = AudioPlayer.getInstance().audio.getAudioType("local") as LocalAudio;
        const audioContext = localAudio.getAudioContext();
        if (!audioContext) return console.log("no audio context");

        const FREQ_MIN = 0;
        const FREQ_MAX = 16000;
        const MAG_MIN = -80;
        const MAG_MAX = 80;
        const FREQS_NUM = 300;
        const FREQ_STEP = (FREQ_MAX - FREQ_MIN) / (FREQS_NUM - 1);

        const eqFreqs = new Float32Array(FREQS_NUM);
        for (let i = 0; i < FREQS_NUM; i++) {
            eqFreqs[i] = Math.round(FREQ_MIN + (i * FREQ_STEP));
        }
    
        const canvasCtx = eqCanvas.current?.getContext("2d");
        if (!canvasCtx) return;

        const canvasWidth = canvasCtx.canvas.width;
        const canvasHeight = canvasCtx.canvas.height;

        const stepX = canvasWidth / (FREQ_MAX - FREQ_MIN);
        const stepY = canvasHeight / (MAG_MAX - MAG_MIN);

        canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        const neutralY = canvasHeight - Math.round(-MAG_MIN * stepY);
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, neutralY);
        canvasCtx.lineTo(canvasWidth, neutralY);

        canvasCtx.strokeStyle = themeObject.colors.secondaryLightHover.value;
        canvasCtx.lineWidth = 4;
        canvasCtx.stroke();

        const eqMag = localAudio.getFrequencyResponse(eqFreqs);
        let firstPoint = true;
        canvasCtx.beginPath();
        for (let i = 0; i < eqFreqs.length; i++) {
            var x = Math.round((eqFreqs[i] - FREQ_MIN) * stepX);
            var y = canvasHeight - Math.round((eqMag[i] - MAG_MIN) * stepY);

            if (firstPoint) {
                firstPoint = false;
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
        }

        canvasCtx.strokeStyle = themeObject.colors.primary.value;
        canvasCtx.stroke();
    }, [eqReload, eqWidth, eqHeight, theme]);

    return (
        <>
            <h1>{useTranslation("pages.settings.title")}</h1>


            <Text h3>Theme</Text>
            {themeChanged && (
                <p>{useTranslation("pages.settings.reloadNotice")}</p>
            )}
            <Dropdown>
                <Dropdown.Button color="secondary">
                    {theme}
                </Dropdown.Button>
                <Dropdown.Menu onSelectionChange={e => setTheme(e == "all" ? "Classic" : e.values().next().value)} disallowEmptySelection selectionMode="single">
                    {Theme.getThemeIds().map(name => (
                        <Dropdown.Item key={name}>{name}</Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>

            <Spacer y={2} />

            <Text h3>{useTranslation("pages.settings.equalizer")}</Text>
            {!nodes.length ? (
                <p>{useTranslation("pages.settings.equalizer.notice")}</p>
            ) : (
                <>
                    <div className={styles.eqGraph} ref={eqRef}>
                        <canvas ref={eqCanvas} className={styles.eqCanvas} width={eqWidth} height={eqHeight} />
                    </div>
                    <Grid.Container justify="space-between" className={styles.eq}>
                        {nodes.map((node, index) => (
                            <Grid key={index} className={styles.eqOption}>
                                <Slider min={-30} max={20} value={node.getGain()} onChange={node.setGain} length={200} orientation="vertical" />
                                <span>{node.getGain()}DB</span>
                            </Grid>
                        ))}
                    </Grid.Container>
                </>
                
            )}
            

            <Spacer y={2} />

            <Button color="error" onPress={logout}>{useTranslation("buttons.logout")}</Button>
        </>
    )
});

export default SettingsPage;