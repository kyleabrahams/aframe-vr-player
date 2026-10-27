import { El } from "../../elems.js";
import { C_FILES } from "../dialog/Files.js";
import { C_VID_STATE } from "../VideoState.js";

// Dedicated global playlists mapping memory buffers
window.nativePlaylistMemory = [];
window.currentPlaylistPointerIndex = 0;

AFRAME.registerComponent('btn-open-file', {
    init: function () {
        const el = this.el;
        const nativeFileInput = document.getElementById('fileInput');
        const videoElement = document.getElementById('video');
        const environmentManager = document.getElementById('env') || document.querySelector('a-videosphere');

        if (!nativeFileInput || !videoElement) return;

        // 1. Physically trigger file exploration dialogues when clicking the 3D VR Folder model asset
        el.addEventListener('click', () => {
            nativeFileInput.click();
        });

        // 2. Prevent event stacking leak loops
        if (nativeFileInput.dataset.wired === 'true') return;
        nativeFileInput.dataset.wired = 'true';

        // 3. Process video logs whenever changes are registered inside your hard drive prompt window
        nativeFileInput.addEventListener('change', (event) => {
            const targetFiles = event.target.files;
            if (targetFiles && targetFiles.length > 0) {
                // Alphabetize track matrix array indices to match your local Finder look cleanly
                window.nativePlaylistMemory = Array.from(targetFiles).sort((a, b) => 
                    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                );
                console.log(`Playlist safely cached: ${window.nativePlaylistMemory.length} files loaded.`);

                // Release DOM focus parameters immediately so the browser drops text field tracking holds
                nativeFileInput.blur();

                // Build initial stream paths pointing onto item index position 0
                const targetFirstVideo = targetFiles[0];
                const initialBlobUrl = URL.createObjectURL(targetFirstVideo);

                videoElement.pause();
                videoElement.src = initialBlobUrl;
                
                // Mount reference metadata parameters securely into dataset node rows
                videoElement.dataset.fileName = targetFirstVideo.name;
                videoElement.dataset.currentSize = targetFirstVideo.size.toString();
                window.currentPlaylistPointerIndex = window.nativePlaylistMemory.findIndex(f => f.name === targetFirstVideo.name) || 0;

                videoElement.onloadedmetadata = () => {
                    videoElement.play().then(() => {
                        // Dynamically update the dynamic 3D Floating layout headers text string
                        const textDisplay = document.getElementById('vrVideoTitle');
                        if (textDisplay) textDisplay.setAttribute('value', targetFirstVideo.name);

                        // Invalidate WebGL projection material textures cache buffers to display fresh frame pixels
                        if (environmentManager) {
                            environmentManager.removeAttribute('material');
                            environmentManager.setAttribute('material', {
                                src: '#video',
                                shader: 'flat',
                                side: 'back'
                            });
                        }
                    }).catch(err => {
                        console.warn("Autoplay block caught. Bypassing tracks via muted safety layer:", err);
                        videoElement.muted = true;
                        videoElement.play();
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

        // 4. Framework-Shielded Keyboard Shortcut Processing Routine
        this.onKeyDown = (event) => {
            // Check if the Command/Meta modification key parameter is actively held down
            if (!event.metaKey) return;

            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                // HARD OVERRIDE DEFENSE: Swallow execution signals before Chrome window layers can capture them
                event.preventDefault();
                event.stopPropagation();

                const activePlaylist = window.nativePlaylistMemory;
                if (!activePlaylist || activePlaylist.length === 0) {
                    console.log("Active file array index queue empty. Open files panel menus to parse tracks.");
                    return;
                }

                let activePositionIndex = window.currentPlaylistPointerIndex;

                // Move forward or backward across your directory track arrays safely
                if (event.key === 'ArrowRight') {
                    window.currentPlaylistPointerIndex = (activePositionIndex + 1) % activePlaylist.length;
                } else if (event.key === 'ArrowLeft') {
                    window.currentPlaylistPointerIndex = (activePositionIndex - 1 + activePlaylist.length) % activePlaylist.length;
                }

                const targetFileObj = activePlaylist[window.currentPlaylistPointerIndex];
                if (!targetFileObj) return;

                console.log(`Skipping directly onto track position [${window.currentPlaylistPointerIndex + 1}/${activePlaylist.length}]: ${targetFileObj.name}`);

                const freshBlobUrl = URL.createObjectURL(targetFileObj);

                videoElement.pause();
                videoElement.src = freshBlobUrl;
                videoElement.dataset.fileName = targetFileObj.name;
                videoElement.dataset.currentSize = targetFileObj.size.toString();

                videoElement.onloadedmetadata = () => {
                    videoElement.play().then(() => {
                        const textDisplay = document.getElementById('vrVideoTitle');
                        if (textDisplay) textDisplay.setAttribute('value', targetFileObj.name);

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
