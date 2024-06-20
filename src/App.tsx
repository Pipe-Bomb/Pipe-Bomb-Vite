import styles from "./styles/App.module.scss";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Navbar from './components/Navbar';
import Search from "./pages/Search";
import Home from "./pages/Home";
import Player from "./components/Player";
import Playlist from "./pages/Playlist";
import AddToPlaylist from "./components/AddToPlaylist";
import Connect from "./pages/Connect";
import CreatePlaylist from "./components/CreatePlaylist";
import SuggestionsPlaylist from "./pages/SuggestionsPlaylist";
import Chart from "./pages/Chart";
import NotificationManager from "./components/NotificationManager";
import TrackPage from "./pages/TrackPage";
import Volume from "./components/Volume";
import CastButton from "./components/CastButton";
import { Button, NextUIProvider } from "@nextui-org/react";
import { VscLayoutSidebarRight } from "react-icons/vsc"
import { useEffect, useState } from "react";
import UserPage from "./pages/UserPage";
import ExternalPlaylistPage from "./pages/ExternalPlaylistPage";
import ContextMenu from "./components/ContextMenu";
import BackgroundGlow from "./components/BackgroundGlow";
import Sidebar from "./components/Sidebar";
import PipeBombConnection from "./logic/PipeBombConnection";
import useAuthenticationStatus from "./hooks/AuthenticationStatusHook";
import LoginPage from "./pages/LoginPage";
import LoadingPage from "./pages/LoadingPage";
import SettingsPage from "./pages/SettingsPage";
import { getSetting, setSetting } from "./logic/SettingsIndex";
import Theme from "./logic/ThemeIndex";
import React from "react";
import RenamePlaylist from "./components/RenamePlaylist";
import { initialiseLanguageAdapter } from "./logic/LanguageAdapter";

const theme = Theme.getTheme(getSetting("theme", "Classic"));
initialiseLanguageAdapter();

const App = React.memo(function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarEnabled, setSidebarEnabled] = useState(getSetting("sidebarOpen", true));
    const authStatus = useAuthenticationStatus();
    const [lastUrl, setLastUrl] = useState("");

    useEffect(() => {
        setSetting("sidebarOpen", sidebarEnabled);
    }, [sidebarEnabled]);

    useEffect(() => {
        const path = location.pathname;
        if (!path.includes("@") || !path.includes("/")) return;
        const end = path.split("/").pop();
        if (!end.includes("@")) return;
        const parts = end.split("@", 2);
        if (parts[0] != PipeBombConnection.getInstance().getApi().context.getAddress()) return;
        const newPath = path.substring(0, path.length - end.length) + parts[1];
        navigate(newPath);
    }, [location.pathname]);

    useEffect(() => {
        if (authStatus == "disconnected" || authStatus == "loading") {
            navigate("/connect");
        } else if (authStatus == "unauthenticated") {
            setLastUrl(location.pathname);
            navigate("/login");
        } else if (authStatus == "authenticated" && location.pathname == "/login") {
            setLastUrl("");
            if (lastUrl && lastUrl != "/login") {
                navigate(lastUrl);
            } else {
                navigate("/");
            }
        }
    }, [authStatus]);

    function getRoutes() {
        return (
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search">
                    <Route index element={<Search />} />
                </Route>

                <Route path="/playlist">
                    <Route index element={<Search />} />
                    <Route path=":playlistID" element={<Playlist />}></Route>
                </Route>

                <Route path="/charts">
                    <Route index element={<Search />} />
                    <Route path=":chartID" element={<Chart />}></Route>
                </Route>

                <Route path="/track">
                    <Route path=":ID" element={<TrackPage />} />
                    <Route path=":ID/suggestions" element={<SuggestionsPlaylist />}></Route>
                </Route>

                <Route path="/user/:userID" element={<UserPage />} />

                <Route path="/collection/playlist/:collectionID" element={<ExternalPlaylistPage />} />

                <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        )
    }

    return (
        <NextUIProvider theme={theme}>
            <NotificationManager />
            <BackgroundGlow />
            <Routes>
                <Route path="/connect" element={<Connect />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={
                    authStatus == "pending" ? (
                        <LoadingPage />
                    ) : (
                        <>
                            <Navbar />
                            <Player>
                                <CastButton />
                                <Volume />
                                <Button auto rounded className={styles.roundButton} light={!sidebarEnabled} onPress={() => setSidebarEnabled(!sidebarEnabled)}><VscLayoutSidebarRight /></Button>
                            </Player>
                            <AddToPlaylist />
                            <CreatePlaylist />
                            <RenamePlaylist />
                            <ContextMenu />

                            <div className={styles.content}>
                                <div className={styles.main}>
                                    <div className={styles.page}>
                                        { getRoutes() }
                                    </div>
                                </div>
                                <Sidebar enabled={sidebarEnabled} />
                            </div>
                        </>
                    )
                } />
            </Routes>
        </NextUIProvider>
    )
});

export default App;
