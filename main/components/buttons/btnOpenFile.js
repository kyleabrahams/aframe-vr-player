import { El } from "../../elems.js";
import { C_FILES } from "../dialog/Files.js";
import { C_VID_STATE } from "../VideoState.js";

AFRAME.registerComponent('btn-open-file', {
    init: function () {
        const el = this.el;
        const nativeFileInput = document.getElementById('fileInput');
        const videoElement = document.getElementById('video');
        const environmentManager = document.getElementById('env') || document.querySelector('a-videosphere');

        if (!nativeFileInput || !videoElement) {
            console.warn("Required media interface items (#fileInput or #video) are missing from the HTML.");
            return;
        }

        // 1. Listen for the physical user click on the 3D VR Folder icon
        el.addEventListener('click', () => {
            // Natively prompt the browser to display your Mac's file picker
            nativeFileInput.click();
        });

        // 2. Clear out any previous change listeners to prevent memory leaking
        if (nativeFileInput.dataset.wired === 'true') return;
        nativeFileInput.dataset.wired = 'true';

        // 3. Process the video file selected from your local hard drive directory
        nativeFileInput.addEventListener('change', (event) => {
            const targetFiles = event.target.files;
            if (targetFiles && targetFiles.length > 0) {
                // The main clicked video file target from the directory
                const videoFile = targetFiles[0];

                // ADD THIS LINE HERE: Drops focus instantly from the browser file uploader input box
                // This forces your Mac mini keyboard hotkeys to map straight back onto the main window layout
                nativeFileInput.blur();

                // Generate a temporary streaming asset URL that passes through browser sandbox blocks
                const streamingBlobUrl = URL.createObjectURL(videoFile);

                // Pause active decoder threads and hot-swap the video stream path
                videoElement.pause();
                videoElement.src = streamingBlobUrl;
                
                // CRUCIAL DATA ANCHORS: Track file parameters dynamically to prevent index loop drops
                videoElement.dataset.fileName = videoFile.name;
                videoElement.dataset.currentSize = videoFile.size.toString();

                // DYNAMIC INDEX LOOKUP: Find exactly where our clicked video sits in our sorted folder arrays
                if (window.nativePlaylistMemory && window.nativePlaylistMemory.length > 0) {
                    const foundIndex = window.nativePlaylistMemory.findIndex(file => file.name === videoFile.name || file.size === videoFile.size);
                    window.currentPlaylistPointerIndex = foundIndex !== -1 ? foundIndex : 0;
                    console.log(`Starting media track locked at array position index: [${window.currentPlaylistPointerIndex + 1}/${window.nativePlaylistMemory.length}]`);
                } else {
                    window.currentPlaylistPointerIndex = 0; // Baseline fallback
                }

                // Track metadata caching updates before firing playback sequences
                videoElement.onloadedmetadata = () => {
                    videoElement.play().then(() => {
                        console.log("Local hard drive data streaming smoothly onto canvas surfaces.");
                        
                        // FIX: Forces text node updates on browser open operations
                        const textDisplay = document.getElementById('vrVideoTitle');
                        if (textDisplay) {
                            textDisplay.setAttribute('value', videoFile.name);
                        }

                        if (environmentManager) {
                            environmentManager.removeAttribute('material');
                            environmentManager.setAttribute('material', {
                                src: '#video',
                                shader: 'flat',
                                side: 'back'
                            });
                        }
                    }).catch(err => {
                        console.warn("Autoplay interaction block caught. Muting to bypass browser security sandbox:", err);
                        videoElement.muted = true;
                        videoElement.play();
                    });
                };

                // 4. Safely keep your internal tracking state synchronized (Fixed nesting placement)
                if (El.videoState) {
                    El.videoState.setAttribute(C_VID_STATE, {
                        src: streamingBlobUrl,
                        fileName: videoFile.name
                    });
                }

                // 5. Hide the open directory file panel dialogue context overlay (Fixed nesting placement)
                const dialogEl = document.getElementById('dialog');
                if (dialogEl) {
                    dialogEl.setAttribute('visible', 'false');
                }
            }
        });
    }
});
