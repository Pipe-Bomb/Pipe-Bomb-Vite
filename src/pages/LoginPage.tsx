import { Button, Input, Loading } from "@nextui-org/react";
import useAuthenticationStatus from "../hooks/AuthenticationStatusHook";
import styles from "../styles/LoginPage.module.scss";
import { useRef, useState } from "react";
import PipeBombConnection from "../logic/PipeBombConnection";
import CustomModal from "../components/CustomModal";
import React from "react";
import useTranslation from "../hooks/TranslationHook";

const LoginPage = React.memo(function LoginPage() {
    const authStatus = useAuthenticationStatus();
    const form = useRef<HTMLFormElement>();

    const [username, setUsername] = useState<string>(undefined);
    const [password, setPassword] = useState<string>(undefined);

    const [modalOpen, setModalOpen] = useState(false);

    function submit() {
        if (authStatus != "unauthenticated") return;

        const usernameElement: any = form.current.elements.namedItem("username");
        const username: string = usernameElement.value;

        const passwordElement: any = form.current.elements.namedItem("password");
        const password: string = passwordElement.value;

        if (!username || !password) return;

        PipeBombConnection.getInstance().login(username, password);
    }

    function keyPress(event: React.KeyboardEvent) {
        if (event.key == "Enter") submit();
    }

    let usernameMessage = "";
    let usernameStatus: "default" | "primary" | "secondary" | "success" | "warning" | "error";
    if (typeof username == "string") {
        if (!username.length) {
            usernameMessage = "Please enter your username";
            usernameStatus = "error";
        } else if (username.length < 5) {
            usernameMessage = "Usernames shorter than 5 characters are insecure";
            usernameStatus = "warning";
        }
    }



    let passwordMessage = "";
    let passwordStatus: "default" | "primary" | "secondary" | "success" | "warning" | "error";
    if (typeof password == "string") {
        if (!password.length) {
            passwordMessage = "Please enter your password";
            passwordStatus = "error";
        } else if (password.length < 10) {
            passwordMessage = "Passwords shorter than 10 characters are insecure";
            passwordStatus = "warning";
        } else if (password.length >= 20) {
            passwordMessage = "This is an awesome password";
            passwordStatus = "success";
        }
    }

    return (
        <>
            <div className={styles.container}>
                <h1 className={styles.title}>{useTranslation("pages.login.title")}</h1>
                <form className={styles.modal} ref={form}>
                    <p className={styles.notice}>{useTranslation("pages.login.notice")}</p>
                    <div className={styles.input}>
                        <Input width="100%" name="username" bordered labelPlaceholder="Username" value={username || ""} onKeyDown={keyPress} onInput={e => setUsername(e.currentTarget.value)} helperColor={usernameStatus} helperText={usernameMessage} />
                    </div>
                    
                    <div className={styles.input}>
                        <Input.Password width="100%" name="password" bordered labelPlaceholder="Password" value={password || ""} onKeyDown={keyPress} onInput={e => setPassword(e.currentTarget.value)} helperColor={passwordStatus} helperText={passwordMessage} />
                    </div>
                    
                    <Button onPress={submit} disabled={!username || !password}>{
                        authStatus == "unauthenticated" ? "Login" : (
                            <Loading color={"white"} />
                        )
                    }</Button>
                    <div>
                        <Button className={styles.modalOpen} size="xs" light auto onPress={() => setModalOpen(true)}>{useTranslation("pages.login.modal.prompt")}</Button>
                    </div>
                </form>
            </div>
            <CustomModal title="Pipe Bomb User Accounts" visible={modalOpen} onClose={() => setModalOpen(false)}>
                <p>{useTranslation("pages.login.modal.0")}</p>
                <p>{useTranslation("pages.login.modal.1")}</p>
                <p>{useTranslation("pages.login.modal.2")}</p>
                <p>{useTranslation("pages.login.modal.3")}</p>
                <p>{useTranslation("pages.login.modal.4")}</p>
                <p>{useTranslation("pages.login.modal.5")}</p>
                <Button className={styles.modalClose} onPress={() => setModalOpen(false)}>{useTranslation("buttons.close")}</Button>
            </CustomModal>
        </>
    )
});

export default LoginPage;