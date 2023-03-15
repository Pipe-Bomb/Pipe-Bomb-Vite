import Track from "pipebomb.js/dist/music/Track";
import AudioPlayerStatus from "./AudioPlayerStatus";
import PipeBombConnection from "./PipeBombConnection";
import { convertArrayToString } from "./Utils";
import { Howl } from "howler";

export default class AudioPlayer {
    private static instance: AudioPlayer;
    private audio: HTMLAudioElement | null = null;
    private status: AudioPlayerStatus = {
        paused: false,
        time: 0,
        duration: -1,
        loading: false,
        track: null,
        seekTime: -1,
        queue: []
    };
    private updateCallbacks: ((status: AudioPlayerStatus) => void)[] = [];

    private constructor() {
        if ("mediaSession" in navigator) {

            navigator.mediaSession.setActionHandler("previoustrack", () => this.previousTrack());

            navigator.mediaSession.setActionHandler("nexttrack", () => this.nextTrack());
        }

        setInterval(() => {
            const newTime = this.status.seekTime == -1 ? this.audio?.currentTime : this.status.seekTime;
            if (newTime != this.status.time && !(this.status.time === 0 && newTime === undefined)) {
                if (newTime === undefined) {
                    this.status.time = 0;
                } else {
                    this.status.time = newTime;
                }
                this.sendCallbacks();
            }
        }, 100);
    }

    public static getInstance() {
        if (!this.instance) this.instance = new AudioPlayer();
        return this.instance;
    }

    public playTrack(track: Track, forcePlay?: boolean) {
        if (this.status.track?.trackID == track.trackID && !forcePlay) {
            if (this.status.paused) this.play();
            return;
        }
        this.status.track = track;

        this.status.loading = true;
        this.status.paused = false;
        this.status.time = 0;
        const url = `${PipeBombConnection.getInstance().getUrl()}/v1/audio/${track.trackID}`;

        this.status.loading = true;
        this.status.duration = -1;
        this.sendCallbacks();
        if (this.audio) {
            this.audio.src = url;
            this.audio.load();
        } else {
            this.audio = new Audio(url);
        }
        

        this.audio.onplay = () => {
            if (!this.status.loading) this.status.paused = false;
            this.sendCallbacks();
        }

        this.audio.onplaying = () => {
            setTimeout(() => {
                this.status.loading = false;
            });
        }

        this.audio.onpause = () => {
            if (!this.status.loading) this.status.paused = true;
            this.sendCallbacks();
        };
        
        this.audio.onended = () => {
            console.log("track ended, next song");
            const nextTrack = this.status.queue.shift();
            if (nextTrack) {
                console.log("next!");
                this.playTrack(nextTrack, true);
            } else {
                console.log("not next");
                this.status.paused = true;
                this.sendCallbacks();
            }
        };

        this.audio.onloadeddata = () => {
            if (!this.audio) return;
            this.status.duration = this.audio.duration;
        }

        this.audio.oncanplay = () => {
            if (!this.audio) return;
            const difference = Math.abs(this.status.seekTime - this.audio.currentTime);
            if (difference < 1 || this.status.seekTime == -1) {
                this.status.loading = false;
                this.sendCallbacks();
                if (this.status.paused) {
                    this.audio.pause();
                } else {
                    this.audio.play();
                }
            }
        }
        
        this.audio.onerror = error => {
            console.error(error);
        };

        this.audio.onseeked = () => {
            if (!this.audio) return;
            const difference = Math.abs(this.status.seekTime - this.audio.currentTime);
            if (difference > 1) {
                this.audio.pause();
                if (!this.status.loading) {
                    this.status.loading = true;
                    this.sendCallbacks();
                }
                this.audio.currentTime = this.status.seekTime;
            } else {
                this.status.seekTime = -1;
            }
        }

        if (!this.status.paused) {
            this.audio.play();
        }

        this.sendCallbacks();

        if ("mediaSession" in navigator && this.status.track) {
            this.status.track.getMetadata().then(metadata => {
                const mediaMeta = new MediaMetadata({
                    title: metadata.title,
                    artist: convertArrayToString(metadata.artists),
                    artwork: metadata.image ? [{
                        src: metadata.image
                    }] : undefined
                });
                document.title = metadata.title;
                navigator.mediaSession.metadata = mediaMeta;
            }).catch(error => {
                console.error(error);
            })
        }
    }

    public getStatus(): AudioPlayerStatus {
        return Object.assign({}, this.status);
    }

    public registerCallback(callback: (status: AudioPlayerStatus) => void) {
        this.updateCallbacks.push(callback);
        callback(this.getStatus());
    }

    public unregisterCallback(callback: (status: AudioPlayerStatus) => void) {
        const index = this.updateCallbacks.indexOf(callback);
        if (index < 0) return;
        this.updateCallbacks.splice(index, 1);
    }

    private sendCallbacks() {
        const callback: AudioPlayerStatus = Object.assign({}, this.status);
        for (let callbackFunction of this.updateCallbacks) {
            callbackFunction(callback);
        }
    }

    public pause() {
        if (!this.audio) return;
        this.status.paused = true;
        this.audio.pause();
    }

    public play() {
        if (!this.audio) return;
        if (this.audio.duration == this.audio.currentTime) {
            this.audio.currentTime = 0;
            this.audio.play();
            return;
        }
        if (!this.status.track && this.status.queue.length) {
            this.nextTrack()
            return;
        }
        this.status.paused = false;
        this.audio.play();
    }

    public nextTrack() {
        const nextTrack = this.status.queue.shift();
        if (nextTrack) {
            this.playTrack(nextTrack, true);
        }
    }

    public previousTrack() {
        if (!this.audio) return;
        if (this.audio.currentTime > 10 || 1) {
            this.setTime(0);
            this.audio.play();
        } else {
            console.log("no functionality");
        }
    }

    public setTime(percent: number) {
        if (!this.audio) return;
        const time = this.status.duration / 100 * percent;
        this.status.seekTime = time;
        this.status.time = time;
        this.audio.currentTime = time;
    }

    public addToQueue(tracks: Track[], position?: number) {
        if (position !== undefined) {
            this.status.queue.splice(position, 0, ...tracks);
        } else {
            this.status.queue.push(...tracks);
        }
        this.sendCallbacks();
    }

    public getQueue() {
        return [...this.status.queue];
    }

    public setQueueOrder(order: number[]) {
        let newOrder: Track[] = [];

        for (let index of order) {
            newOrder.push(this.status.queue[index]);
        }
        this.status.queue.splice(0, this.status.queue.length, ...newOrder);
        this.sendCallbacks();
    }

    public removeFromQueue(index: number) {
        this.status.queue.splice(index, 1);
        this.sendCallbacks();
    }

    public clearQueue() {
        this.status.queue.splice(0, this.status.queue.length);
    }
}