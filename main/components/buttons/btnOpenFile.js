import { El } from "../../elems.js";
import { C_FILES } from "../dialog/Files.js";
import { C_VID_STATE } from "../VideoState.js";

// Clean global playlist data maps
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

        // 1. Physically open file manager layout when clicking the 3D menu button
        el.addEventListener('click', () => {
            nativeFileInput.click();
        });

        // 2. Global variable sync layer to keep titles and custom text elements updated
        this.updateGlobalTrackState = (fileName) => {
            window.globalCurrentFileName = fileName || "Streaming Video File";
            
            // Explicitly force the 3D title text component overlay to display the name
            const textDisplay = document.getElementById('vrVideoTitle');
            if (textDisplay) {
                textDisplay.setAttribute('value', window.globalCurrentFileName);
            }
        };

        // 3. Prevent duplicate tracking stacking loops
        if (nativeFileInput.dataset.wired === 'true') return;
        nativeFileInput.dataset.wired = 'true';

        // 4. Handle files loaded through the file selector popup window
        nativeFileInput.addEventListener('change', (event) => {
            const targetFiles = event.target.files;
            if (targetFiles && targetFiles.length > 0) {
                // Alphabetize track matrix array indices to match your local Finder look cleanly
                window.nativePlaylistMemory = Array.from(targetFiles).sort((a, b) => 
                    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                );
                console.log(`Smart Playlist Synced Natively: ${window.nativePlaylistMemory.length} tracks cached.`);

                // Release DOM focus parameters immediately so the browser drops text field tracking holds
                nativeFileInput.blur();

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
                        this.updateGlobalTrackState(targetFirstVideo.name);

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

        // 5. Framework-Shielded Keyboard Shortcut Processing Routine
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
