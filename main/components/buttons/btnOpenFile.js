import { El } from "../../elems.js";
import { C_FILES } from "../dialog/Files.js";
import { C_VID_STATE } from "../VideoState.js";

window.nativePlaylistMemory = [];
window.currentPlaylistPointerIndex = 0;
window.globalCurrentFileName = "No File Loaded";

AFRAME.registerComponent('btn-open-file', {
    init: function () {
        const el = this.el;
        const nativeFileInput = document.getElementById('fileInput');
        const videoElement = document.getElementById('video');
        const environmentManager = document.getElementById('env') || document.querySelector('a-videosphere');

        if (!nativeFileInput || !videoElement) return;

        el.addEventListener('click', () => {
            nativeFileInput.click();
        });

        this.updateGlobalTrackState = (fileName) => {
            window.globalCurrentFileName = fileName || "Streaming Video File";
            const textDisplay = document.getElementById('vrVideoTitle');
            if (textDisplay) {
                textDisplay.setAttribute('value', window.globalCurrentFileName);
            }
            videoElement.ontimeupdate = () => {
                const timelineEl = document.getElementById('timeline');
                if (timelineEl && videoElement.duration) {
                    const progressRatio = videoElement.currentTime / videoElement.duration;
                    timelineEl.emit('timeline-update', {
                        progress: progressRatio,
                        currentTime: videoElement.currentTime,
                        duration: videoElement.duration
                    }, false);
                }
            };
        };

        if (nativeFileInput.dataset.wired === 'true') return;
        nativeFileInput.dataset.wired = 'true';

        nativeFileInput.addEventListener('change', (event) => {
            const targetFiles = event.target.files;
            if (targetFiles && targetFiles.length > 0) {
                window.nativePlaylistMemory = Array.from(targetFiles).sort((a, b) => 
                    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                );
                nativeFileInput.blur();

                const targetFirstVideo = targetFiles[0];
                const initialBlobUrl = URL.createObjectURL(targetFirstVideo);

                videoElement.pause();
                videoElement.src = initialBlobUrl;
                videoElement.dataset.fileName = targetFirstVideo.name;
                videoElement.dataset.currentSize = targetFirstVideo.size.toString();
                window.currentPlaylistPointerIndex = window.nativePlaylistMemory.findIndex(f => f.name === targetFirstVideo.name) || 0;

                videoElement.onloadedmetadata = () => {
                    videoElement.play().then(() => {
                        this.updateGlobalTrackState(targetFirstVideo.name);
                        if (environmentManager) {
                            environmentManager.removeAttribute('material');
                            environmentManager.setAttribute('material', {
                                src: '#video',
                                shader: 'flat',
                                side: 'back'
                            });
                        }
                    }).catch(err => {
                        videoElement.muted = true;
                        videoElement.play();
                        this.updateGlobalTrackState(targetFirstVideo.name);
                    });
                };

                if (El.videoState) {
                    El.videoState.setAttribute(C_VID_STATE, {
                        src: initialBlobUrl,
                        fileName: targetFirstVideo.name
                    });
                }

                const dialogEl = document.getElementById('dialog');
                if (dialogEl) dialogEl.setAttribute('visible', 'false');
            }
        });

        this.onKeyDown = (event) => {
            if (!event.metaKey) return;

            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                event.stopPropagation();

                const activePlaylist = window.nativePlaylistMemory;
                if (!activePlaylist || activePlaylist.length === 0) return;

                let activePositionIndex = window.currentPlaylistPointerIndex;

                if (event.key === 'ArrowRight') {
                    window.currentPlaylistPointerIndex = (activePositionIndex + 1) % activePlaylist.length;
                } else if (event.key === 'ArrowLeft') {
                    window.currentPlaylistPointerIndex = (activePositionIndex - 1 + activePlaylist.length) % activePlaylist.length;
                }

                const targetFileObj = activePlaylist[window.currentPlaylistPointerIndex];
                if (!targetFileObj) return;

                const freshBlobUrl = URL.createObjectURL(targetFileObj);

                videoElement.pause();
                videoElement.src = freshBlobUrl;
                videoElement.dataset.fileName = targetFileObj.name;
                videoElement.dataset.currentSize = targetFileObj.size.toString();

                videoElement.onloadedmetadata = () => {
                    videoElement.play().then(() => {
                        this.updateGlobalTrackState(targetFileObj.name);
                        if (environmentManager) {
                            environmentManager.removeAttribute('material');
                            environmentManager.setAttribute('material', {
                                src: '#video',
                                shader: 'flat',
                                side: 'back'
                            });
                        }
                    }).catch(err => {
                        videoElement.muted = true;
                        videoElement.play();
                        this.updateGlobalTrackState(targetFileObj.name);
                    });
                };

                if (El.videoState) {
                    El.videoState.setAttribute(C_VID_STATE, {
                        src: freshBlobUrl,
                        fileName: targetFileObj.name
                    });
                }
            }
        };

        window.addEventListener('keydown', this.onKeyDown);
    },

    remove: function () {
        window.removeEventListener('keydown', this.onKeyDown);
    }
});
