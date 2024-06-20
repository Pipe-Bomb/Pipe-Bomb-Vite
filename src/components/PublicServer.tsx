import ServerInfo from "pipebomb.js/dist/ServerInfo"
import styles from "../styles/PublicServer.module.scss"
import HostInfo from "pipebomb.js/dist/HostInfo";
import { Button, Grid, Loading, Text } from "@nextui-org/react";
import { MdLockOpen, MdLockOutline, MdSignalWifiBad } from "react-icons/md";
import { formatTimeWords } from "../logic/Utils";
import { useState } from "react";
import ServerIndex from "../logic/ServerIndex";
import React from "react";
import useTranslation from "../hooks/TranslationHook";

export interface PublicServerProps {
    server: ServerInfo,
    connectCallback: (hostInfo: HostInfo, status: string) => void
}

const PublicServer = React.memo(function PublicServer({ server, connectCallback }: PublicServerProps) {
    const [ping, setPing] = useState<number | null | false>(false);
    const disabled = !!ServerIndex.getInstance().getServers().find(s => s.host == server.address);

    const innerHTML = (() => {
        switch (server.getStatus()) {
            case "offline":
                return <MdSignalWifiBad className={styles.icon} />
            case "secure":
                return <MdLockOutline className={styles.icon} />
            case "insecure":
                return <MdLockOpen className={styles.icon} />
        }
    })();

    const hostInfo: HostInfo = {
        host: server.address,
        name: server.name,
        https: server.getStatus() == "secure"
    }

    function getPing() {
        if (ping == null) return;
        setPing(null);
        server.getLatency()
        .then(newPing => {
            if (typeof newPing == "number") {
                setPing(newPing);
            } else {
                setPing(false)
            }
        })
    }

    function generatePingHTML() {
        if (ping == false) {
            return (
                <Button onClick={getPing} auto bordered size="sm">{useTranslation("buttons.connect.getPing")}</Button>
            )
        }

        if (!ping) {
            return (
                <Loading size="sm" />
            )
        }

        return (
            <Text h5 onClick={getPing} style={{cursor: "pointer"}}><span>{ ping }ms</span></Text>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.iconContainer}>
                {innerHTML}
            </div>
            <Grid.Container justify="space-between" alignItems="center" className={styles.content}>
                <Grid>
                    <Text h3>{server.name}</Text>
                    <Text h5>{server.address}</Text>
                </Grid>
                <Grid className={styles.details}>
                    <Text h5>{useTranslation("pages.connect.uptime", <span className={styles.value}>{formatTimeWords(server.uptime)}</span>)}</Text>
                    <div className={styles.ping}>
                        <Text h5>Ping: </Text>
                        { generatePingHTML() }
                    </div>
                </Grid>
                <Grid>
                    <Button auto color="gradient" size="xl" className={styles.button} onPress={() => connectCallback(hostInfo, server.getStatus())} disabled={disabled || !["secure", "insecure"].includes(server.getStatus())}>Save</Button>
                </Grid>
            </Grid.Container>
        </div>
    )
});

export default PublicServer;