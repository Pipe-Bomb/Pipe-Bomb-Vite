import { useEffect, useRef, useState } from "react";
import styles from "../styles/NotificationManager.module.scss"
import Notification from "./Notification";
import React from "react";

let lastNotificationTime = 0;
let notificationDupeCount = 0;

let mouseInTime: number;

export interface NotificationInfo {
    text: React.ReactNode,
    status?: "normal" | "warning" | "error"
}

interface NotificationInfoWrapper {
    info: NotificationInfo,
    alive: boolean,
    id: string,
    created: number,
    timer?: ReturnType<typeof setTimeout>
}

const notifications: NotificationInfoWrapper[] = [];
let setNotificationsUpdate: (notifications: NotificationInfoWrapper[]) => void;

function update() {
    if (setNotificationsUpdate) setNotificationsUpdate(Array.from(notifications));
}

function setWrapperTimer(wrapper: NotificationInfoWrapper, delay: number) {
    wrapper.timer = setTimeout(() => {
        wrapper.alive = false;
        update();

        setTimeout(() => {
            const index = notifications.indexOf(wrapper);
            if (index < 0) return;
            notifications.splice(index, 1);
            update();
        }, 300);
    }, delay);
}

export function createNotification(notification: NotificationInfo) {
    const timestamp = Date.now();
    let id: string;

    if (timestamp == lastNotificationTime) {
        id = timestamp.toString() + ` ${++notificationDupeCount}`;
    } else {
        lastNotificationTime = timestamp;
        notificationDupeCount = 0;
        id = timestamp.toString();
    }

    const wrapper: NotificationInfoWrapper = {
        info: notification,
        id,
        alive: false,
        created: timestamp
    };

    setTimeout(() => {
        wrapper.alive = true;
        update();
    }, 10);

    if (!mouseInTime) setWrapperTimer(wrapper, 5_000);

    notifications.push(wrapper);
    update();
}

function mouseEnter() {
    mouseInTime = Date.now();

    for (let wrapper of notifications) {
        clearTimeout(wrapper.timer);
    }
}

function mouseExit() {
    const timeDifference = Date.now() - mouseInTime;
    mouseInTime = 0;

    for (let wrapper of notifications) {
        wrapper.created += timeDifference;
        setWrapperTimer(wrapper, wrapper.created - Date.now() + 5_000);
    }
}

const NotificationManager = React.memo(function NotificationManager() {
    const [notificationList, setNotifications] = useState(Array.from(notifications));
    setNotificationsUpdate = setNotifications;
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (container.current) {
            const mouseIn = () => mouseEnter();
            const mouseOut = () => mouseExit();

            container.current.addEventListener("mouseenter", mouseIn);
            container.current.addEventListener("mouseleave", mouseOut);

            return () => {
                if (container.current) {
                    container.current.removeEventListener("mouseenter", mouseIn);
                    container.current.removeEventListener("mouseleave", mouseOut);
                }
            }
        }
    });

    return (
        <div ref={container} className={styles.container}>
            {notificationList.map(notification => (
                <Notification data={notification.info} key={notification.id} alive={notification.alive} />
            ))}
        </div>
    )
});

export default NotificationManager;