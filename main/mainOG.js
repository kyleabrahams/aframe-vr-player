// systems
import './systems/LightControls.js'
import './systems/Controls.js'
import './systems/Thumbnails.js'

// events
import './components/Events.js'

// components
import './components/Stereo.js'
import './components/StereoCam.js'
import './components/Timeline.js'
import './components/ButtonHighlight.js'
import './components/Recenter.js'
import './components/CursorUtil.js'
import './components/AdjustCamera.js'
import './components/toggleAdjustUi.js'
import './components/Subtitles.js'

// components:dialog
import './components/dialog/MarqTxt.js'
import './components/dialog/Files.js'
import './components/dialog/Settings.js'
import './components/dialog/Loading.js'
import './components/dialog/Utils.js'

// components:settings
import './components/settings/Settings.js'

// components:env
import './components/env/EnvManager.js'
import './components/env/presets/FLAT.js'
import './components/env/presets/SBS_180_EQR.js'
import './components/env/presets/SBS_180_FE.js'
import './components/env/presets/TB_360_EQR.js'
import './components/env/presets/M_360_EQR.js'
import './components/env/presets/M_180_EQR.js'
import './components/env/presets/M_180_FE.js'

// buttons
import './components/buttons/btnOpenFile.js'
import './components/buttons/btnPausePlay.js'
import './components/buttons/btnSeekBack.js'
import './components/buttons/btnSeekForw.js'
import './components/buttons/btnVol.js'
import './components/buttons/btnHideControls.js'
import './components/buttons/btnSettings.js'

// 1. Flat memory array cache initialization
window.nativePlaylistMemory = [];

// 2. Capture and cache folder video files safely whenever loaded via the native file input element
document.addEventListener('change', (event) => {
    if (event.target && event.target.id === 'fileInput') {
        const fileList = event.target.files;
        if (fileList && fileList.length > 0) {
            window.nativePlaylistMemory = Array.from(fileList).sort((a, b) => 
                a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            );
            console.log(`Smart Playlist Synced: ${window.nativePlaylistMemory.length} files cached.`);
        }
    }
}, true);

// 4. Dynamic Input Re-creater & Listener Binder
window.rebuildNativeFileInput = () => {
    let nativeFileInput = document.getElementById('fileInput');
    if (!nativeFileInput) {
        nativeFileInput = document.createElement('input');
        nativeFileInput.type = 'file';
        nativeFileInput.id = 'fileInput';
        nativeFileInput.accept = 'video/*';
        nativeFileInput.multiple = true;
        nativeFileInput.style.display = 'none';
        document.body.appendChild(nativeFileInput);
        
        const btnOpenFileComp = document.querySelector('[btn-open-file]');
        if (btnOpenFileComp && btnOpenFileComp.components && btnOpenFileComp.components['btn-open-file']) {
            btnOpenFileComp.components['btn-open-file'].wireFileInput(nativeFileInput);
        }
    }
    return nativeFileInput;
};

// 3. FRAMEWORK INTEGRATED KEYBOARD CONTROLLER COMPONENT:
// This intercepts keyboard inputs inside A-Frame's system loops before the browser window can hijack it
AFRAME.registerComponent('scene-shortcut-skipper', {
    init: function () {
        this.onKeyDown = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.onKeyDown, true);
    },
    onKeyDown: async function (event) {
        // Look strictly for the Mac Command Key (metaKey) modification marker
        if (!event.metaKey) return; 

        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            // HARD STOP OVERRIDES: Strip away all capability for Chrome to parse browser timeline reloads
            event.preventDefault(); 
            event.stopPropagation(); 
            event.stopImmediatePropagation();

            const videoElement = document.getElementById('video');
            const environmentManager = document.getElementById('env') || document.querySelector('a-videosphere');
            const playlist = window.nativePlaylistMemory;

            if (!videoElement) return;

            // If the playlist tracker is completely empty, call our rebuild engine and prompt file assignment
            if (!playlist || playlist.length === 0) {
                console.log("No tracks found in playlist queue. Prompting folder loading...");
                const nativeFileInput = window.rebuildNativeFileInput();
                if (nativeFileInput) {
                    nativeFileInput.click();
                }
                return;
            }

            // FORCE TRUSTED DIRECT COUNTER TRACKING:
            if (typeof window.currentPlaylistPointerIndex !== 'number') {
                window.currentPlaylistPointerIndex = 0;
            }
            
            let currentIndex = window.currentPlaylistPointerIndex;

            // Ensure index tracking limits stay within our active video array boundaries
            if (currentIndex < 0 || currentIndex >= playlist.length) {
                currentIndex = 0;
            }

            // Calculate next targeted index steps cleanly
            let targetIndex = currentIndex;
            if (event.key === 'ArrowRight') {
                targetIndex = (currentIndex + 1) % playlist.length;
            } else if (event.key === 'ArrowLeft') {
                targetIndex = (currentIndex - 1 + playlist.length) % playlist.length;
            }

            const targetFile = playlist[targetIndex];
            if (!targetFile) return;

            console.log(`Skipper advancing successfully to track [${targetIndex + 1}/${playlist.length}]: ${targetFile.name}`);

            try {
                // Generate a fresh local streaming url asset token
                const freshStreamingBlobUrl = URL.createObjectURL(targetFile);

                // Halt current decoder channels and load the new binary media stream route
                videoElement.pause();
                videoElement.src = freshStreamingBlobUrl;
                
                // Lock metadata markers down into datasets to help component loops track position
                videoElement.dataset.fileName = targetFile.name;
                videoElement.dataset.currentSize = targetFile.size.toString();
                window.currentPlaylistPointerIndex = targetIndex; // Update our global counter map position

                videoElement.onloadedmetadata = () => {
                    videoElement.play().then(() => {
                        // Update your dynamic floating 3D canvas VR text indicator display node header instantly
                        const textDisplay = document.getElementById('vrVideoTitle');
                        if (textDisplay) {
                            textDisplay.setAttribute('value', targetFile.name);
                        }

                        // Force A-Frame rendering pipelines to invalidate texture cache and render the new incoming video stream
                        if (environmentManager) {
                            environmentManager.removeAttribute('material');
                            environmentManager.setAttribute('material', {
                                src: '#video',
                                shader: 'flat',
                                side: 'back'
                            });
                        }
                    }).catch(err => {
                        console.warn("Autoplay interaction block caught. Swapping via muted fallback channel:", err);
                        videoElement.muted = true;
                        videoElement.play();
                    });
                };

                // Keep internal structural state tracking modules data records completely synchronized
                const videoStateEl = document.getElementById('video-state');
                if (videoStateEl && window.AFRAME) {
                    videoStateEl.setAttribute('video-state', {
                        src: freshStreamingBlobUrl,
                        fileName: targetFile.name
                    });
                }

            } catch (err) {
                console.error("Critical crash shifting localized binary files allocations:", err);
            }
        }
    },
    remove: function () {
        window.removeEventListener('keydown', this.onKeyDown, true);
    }
});

// Inject the shortcut system component directly onto your primary 3D Scene layout root once ready
document.addEventListener('DOMContentLoaded', () => {
    const sceneEl = document.querySelector('a-scene');
    if (sceneEl) {
        sceneEl.setAttribute('scene-shortcut-skipper', '');
    } else {
        // Fallback catch if scene element execution threads are racing
        document.addEventListener('nodeready', () => {
            const retryScene = document.querySelector('a-scene');
            if (retryScene) retryScene.setAttribute('scene-shortcut-skipper', '');
        });
    }
});
