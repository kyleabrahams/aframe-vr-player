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

// Framework-Isolated Shortcut Listener to process Cmd + ArrowRight / ArrowLeft folder skips
window.addEventListener('keydown', async (event) => {
    // Only intercept if the user holds down the Command key on Mac mini
    if (!event.metaKey) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        // OVERRIDE WALL: Hard stop browser from triggering native text field or timeline reloads
        event.preventDefault(); 
        event.stopPropagation(); 
        event.stopImmediatePropagation();

        const videoElement = document.getElementById('video');
        const dialogFilesEl = document.querySelector('[dialog-files]') || document.getElementById('dialog');

        if (!videoElement) return;

        // Reach directly into your active 3D A-Frame Files panel instance memory maps
        let filesComponent = null;
        if (dialogFilesEl && dialogFilesEl.components && dialogFilesEl.components['dialog-files']) {
            filesComponent = dialogFilesEl.components['dialog-files'];
        }

        // If the 3D file browser dashboard menu layout hasn't loaded any folder entries yet, stop here
        if (!filesComponent || !filesComponent.files || filesComponent.files.length === 0) {
            console.warn("Skipper Aborted: Open your 3D folder menu selector to parse a movie list first.");
            return;
        }

        const currentPlaylist = filesComponent.files; // Array list of strings (filenames)
        const currentTrackingName = videoElement.dataset.fileName || "";
        
        // Locate where we are in our file directory track array
        let currentIndex = currentPlaylist.indexOf(currentTrackingName);

        // Fallback Sync: If data markers missed, try to extract position via matching state filename string tokens
        if (currentIndex === -1 && videoElement.src) {
            currentIndex = currentPlaylist.findIndex(fileName => videoElement.src.includes(encodeURIComponent(fileName)));
        }

        // Safe Fallback: If position tracks are still lost, default back to index 0
        if (currentIndex === -1) {
            currentIndex = typeof window.currentPlaylistPointerIndex === 'number' ? window.currentPlaylistPointerIndex : 0;
        }

        // Calculate next targeted item array layout index
        let targetIndex = currentIndex;
        if (event.key === 'ArrowRight') {
            targetIndex = (currentIndex + 1) % currentPlaylist.length;
        } else if (event.key === 'ArrowLeft') {
            targetIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
        }

        console.log(`Skipper successful: Stepping track position [${currentIndex} -> ${targetIndex}] inside active 3D directory pool.`);

        // AUTOMATED CLICK ROUTER:
        // Instead of writing brittle custom streaming pipelines, we look at the exact 3D file tiles 
        // compiled on your purple interface screen and execute a direct programmatic click on the target item slot!
        if (filesComponent.allFiles && filesComponent.allFiles[targetIndex]) {
            const targetedRecord = filesComponent.allFiles[targetIndex];
            
            // Explicitly sync tracking indices before driving execution pipelines
            window.currentPlaylistPointerIndex = targetIndex;
            videoElement.dataset.fileName = targetedRecord.name;

            // Look down into your custom file tile generation context mappings
            // We fetch your existing working direct hard drive click handler and run it cleanly
            if (filesComponent.el) {
                // Find all active interactive grid buttons generated inside your UI layout tree
                const fileButtons = filesComponent.el.querySelectorAll('[clickable]');
                // If the screen elements match our indexes, trigger the native file compiler block smoothly
                if (fileButtons && fileButtons[targetIndex]) {
                    console.log(`Programmatically driving click event layer onto 3D menu tile: ${targetedRecord.name}`);
                    fileButtons[targetIndex].emit('click');
                } else {
                    // Failover: If the menu UI isn't open or drawn, we load the file handle natively
                    try {
                        const fileData = await targetedRecord.handle.getFile();
                        const streamingBlobUrl = URL.createObjectURL(fileData);
                        
                        videoElement.pause();
                        videoElement.src = streamingBlobUrl;
                        
                        videoElement.onloadedmetadata = () => {
                            videoElement.play().catch(e => console.log("Autoplay block caught:", e));
                            const textDisplay = document.getElementById('vrVideoTitle');
                            if (textDisplay) textDisplay.setAttribute('value', targetedRecord.name);
                        };
                    } catch (readErr) {
                        console.error("Direct fallback load cycle encountered an entry error:", readErr);
                    }
                }
            }
        }
    }
}, true); // The true capture flag handles event processing before any subordinate HTML elements can intercept it
