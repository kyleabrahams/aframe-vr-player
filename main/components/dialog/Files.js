import { El } from '../../elems.js'
import { createEl, getFileName, toTime, trimJoin } from '../../utils.js'
import { FILE_GET_URL, LISTING_URL } from '../Consts.js'
import { C_VID_STATE } from '../VideoState.js'
import { DHeight, DWidth, isVideo } from './Utils.js'

export const C_FILES = 'dialog-files'
const itemLimit = 7
const space = -DHeight * 0.11
const initialPosition = DHeight * 0.28

AFRAME.registerComponent(C_FILES, {
    schema: {
        url: { type: 'string', default: '' },
        reRender: { type: 'string', default: '' }
    },

    init: function () {
        let el = this.el
        el.setAttribute('geometry', `primitive: plane; width: ${DWidth}; height: ${DHeight}`)
        el.setAttribute('material', 'color: teal')
        el.setAttribute('dialog-utils', { 'screen': C_FILES })
        el.object3D.visible = true

        this.offset = {}

        this.fetchFiles = AFRAME.utils.bind(this.fetchFiles, this)
        this.insertFolderUI = AFRAME.utils.bind(this.insertFolderUI, this)
        this.renderFiles = AFRAME.utils.bind(this.renderFiles, this)
    },

    update: function (od) {
        var d = this.data
        var el = this.el
        if (d.reRender && d.reRender.length > 0) {
            el.setAttribute('dialog-utils', { 'screen': C_FILES })
            el.setAttribute(C_FILES, { reRender: '' })
            return
        }
        if (d.url !== od.url) {
            this.fetchFiles(this.el, d.url)
        } else {
            this.renderFiles()
        }
    },

    fetchFiles: async function (el, url) {
        // If no folder has been selected yet, stop here and render a click-to-open button
        if (!window.localFolderHandle) {
            el.removeAttribute('dialog-loading');
            this.renderSetupPrompt();
            return;
        }

        try {
            el.setAttribute('dialog-loading', '');
            let files = [];
            let folders = [];

            // Sweep and read entries from your selected hard drive directory
            for await (const entry of window.localFolderHandle.values()) {
                if (entry.kind === 'file') {
                    if (isVideo(entry.name)) {
                        files.push({
                            name: entry.name,
                            duration: 0,
                            handle: entry
                        });
                    }
                } else if (entry.kind === 'directory') {
                    folders.push({ name: entry.name });
                }
            }

            let videoFiles = files.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

            this.files = videoFiles.map((f) => f.name);
            this.filesDur = videoFiles.map((f) => f.duration);
            this.allFiles = videoFiles; 
            this.folders = folders.map((hd) => hd.name);
            
            // CRUCIAL SYNC OVERRIDE: Bind the raw physical folder handle structures globally
            window.activePlaylistFiles = videoFiles; 
            if (!window.localFolderHandle && this.el.sceneEl) {
                // Keep file path entry handles locked into memory
                window.globalPlaylistFiles = this.allFiles;
            }

            el.removeAttribute('dialog-loading');
            this.renderFiles();

        } catch (err) {
            console.error("Local folder scanning was denied or interrupted:", err);
            el.removeAttribute('dialog-loading');
        }
    },

        renderSetupPrompt: function () {
        const el = this.el;
        el.replaceChildren();
        el.setAttribute('clickable', '');
        el.object3D.visible = true;

        // Create a prominent click-target button that satisfies browser security rules
        let openButton = createEl("a-plane", {
            "geometry": `width: ${DWidth * 0.6}; height: ${DHeight * 0.2}`,
            "material": "color: #6d4aed;",
            "position": "0 0 1",
            "clickable": "",
            "button-highlight": "",
            "marq-text": "value: CLICK HERE TO CHOOSE VIDEO FOLDER; limit: 40",
        }, [], el);

        // Because this click event is driven directly by a physical user click,
        // the browser will legally allow the directory access window to open!
        openButton.onclick = async () => {
            try {
                window.localFolderHandle = await window.showDirectoryPicker();
                // Re-run the file query sequence now that we have granted permissions
                this.fetchFiles(el, "");
            } catch (err) {
                console.warn("User canceled folder selection window or blocked access.");
            }
        };
    },


    renderFiles: function () {

        const el = this.el
        const url = this.data.url

        el.replaceChildren()
        el.setAttribute('clickable', '')
        el.object3D.visible = true

        let offsetFiles = this.offset[url]?.files ?? 0
        let offsetFolders = this.offset[url]?.folders ?? 0
        // files 
        let pos = initialPosition
        for (let i = offsetFiles; i < offsetFiles + itemLimit; i++) {
            if (i < this.files.length) {
                // Look for matching subtitle strings locally if needed
                let subName = this.files[i].substr(0, this.files[i].lastIndexOf('.')) + '.srt'
                let sub = this.allFiles.find((f) => f.name === subName)
                
                let tile = createEl("a-plane", {
                    "geometry": `width: ${DWidth * 0.45}; height: ${DHeight * 0.1}`,
                    "material": "color: #801D9F;",
                    "position": `-${DWidth * 0.2} ${pos} 1`,
                    "clickable": "",
                    "button-highlight": "",
                    "marq-text": `value:${sub ? "[sub]":""}${getFileName(this.files[i])}; limit:30`,
                }, [], el)
                let tileDuration = createEl("a-plane", {
                    "geometry": `width: ${DWidth * 0.15}; height: ${DHeight * 0.1}`,
                    "material": "color: #6d4aed;",
                    "position": `${DWidth * 0.1} ${pos} 1`,
                    "marq-text": `value:${toTime(this.filesDur[i])}; limit:30`,
                }, [], el)

                // Updated click event handler for direct hard drive streaming
                tile.onclick = async () => {
                    let matchedFile = this.allFiles.find((f) => f.name === this.files[i])
                    
                    if (matchedFile && matchedFile.handle) {
                        try {
                            const fileData = await matchedFile.handle.getFile()
                            let src = URL.createObjectURL(fileData)

                            const nativeVideoEl = document.getElementById('video')
                            if (nativeVideoEl) {
                                nativeVideoEl.pause();
                                nativeVideoEl.src = src;
                                nativeVideoEl.dataset.fileName = this.files[i];
                                nativeVideoEl.dataset.currentSize = fileData.size.toString();

                                // Update global position layout indexes so your keyboard shortcuts map flawlessly
                                window.currentPlaylistPointerIndex = i;
                                
                                nativeVideoEl.onloadedmetadata = () => {
                                    nativeVideoEl.play().catch(err => {
                                        nativeVideoEl.muted = true;
                                        nativeVideoEl.play();
                                    });

                                    // GLOBAL PRODUCTION LOCKS: 
                                    window.globalCurrentFileName = matchedFile.name;
                                    
                                    const textDisplay = document.getElementById('vrVideoTitle');
                                    if (textDisplay) {
                                        textDisplay.setAttribute('value', matchedFile.name);
                                    }
                                    
                                    // Force direct hardware timeline synchronization updates
                                    nativeVideoEl.ontimeupdate = () => {
                                        const timelineEl = document.getElementById('timeline');
                                        if (timelineEl && nativeVideoEl.duration) {
                                            const progressRatio = nativeVideoEl.currentTime / nativeVideoEl.duration;
                                            timelineEl.emit('timeline-update', {
                                                progress: progressRatio,
                                                currentTime: nativeVideoEl.currentTime,
                                                duration: nativeVideoEl.duration
                                            }, false);
                                        }
                                    };
                                };
                            }

                            // Pass configuration state token to your custom modules tracker safely
                            if (El.videoState && typeof El.videoState.setAttribute === 'function') {
                                El.videoState.setAttribute(C_VID_STATE, {
                                    src: src,
                                    fileName: this.files[i]
                                });
                            }

                            // A-FRAME SPECIFIC TEXTURE RE-BINDING & THREE.JS BUFFER CLEAR:
                            const envEl = document.getElementById('env') || document.querySelector('a-videosphere') || document.querySelector('[material*="src: #video"]')
                            if (envEl && envEl.object3D) {
                                envEl.removeAttribute('material')
                                envEl.setAttribute('material', {
                                    src: '#video',
                                    shader: 'flat',
                                    side: 'back'
                                })

                                envEl.object3D.traverse((node) => {
                                    if (node.material && node.material.map) {
                                        node.material.map.needsUpdate = true;
                                    }
                                });
                            }

                        } catch (err) {
                            console.error("Failed to compile streaming blob URL resource link token:", err)
                        }
                    }

                    if (El.subtitles && typeof El.subtitles.removeAttribute === 'function') {
                        El.subtitles.removeAttribute('subtitles');
                    }
                }
                pos += space
            }
        }

        // folders
        pos = initialPosition
        for (let i = offsetFolders; i < offsetFolders + itemLimit; i++) {
            if (i < this.folders.length) {
                let folderName = this.folders[i];
                let tile = createEl("a-plane", {
                    "geometry": `width: ${DWidth * 0.45}; height: ${DHeight * 0.1}`,
                    "material": "color: #801D9F;",
                    "position": `-${DWidth * 0.2} ${pos} 1`,
                    "clickable": "",
                    "button-highlight": "",
                    "text": `value: ${sub ? "[sub] " : ""}${getFileName(this.files[i])}; align: center; width: 4; wrapCount: 35; zOffset: 0.05`
                }, [], el)
                
                tile.onclick = async () => {
                    try {
                        const subDirectoryHandle = await window.localFolderHandle.getDirectoryHandle(folderName);
                        window.localFolderHandle = subDirectoryHandle;
                        let nextUrl = url ? (url + "/" + folderName) : folderName;
                        el.setAttribute(C_FILES, { 'url': nextUrl });
                    } catch (err) {
                        console.error("Failed to access nested disk directory:", err);
                    }
                }
                pos += space
            }
        }

        this.insertFolderUI()
    },

    insertFolderUI: function () {

        const el = this.el
        const url = this.data.url

        let offsetFiles = this.offset[url]?.files ?? 0
        let offsetFolders = this.offset[url]?.folders ?? 0

        let p = el.getAttribute("geometry")

        createEl("a-plane", {
            "geometry": `primitive:plane; width:${p.width}; height: 3`,
            "position": `0 ${p.height / 2} 0.2`,
            "material": "color: #808080",
            "text": `value: folder:/${url}; align: center; width: 30; zOffset: 0.2;`
        }, [], el)

        createEl("a-image", {
            'src': "#asset-movie-icon",
            'position': `-${p.width / 2} 0 0.2`,
            'background-color': "blue",
            'scale': "4 4 1"
        }, [], el)
        createEl("a-image", {
            'src': "#asset-folder",
            'position': `${p.width / 2} 0 0.2`,
            'background-color': "blue",
            'scale': "4 4 1"
        }, [], el)

        let refreshBtn = createEl("a-image", {
            "src": "#asset-refresh",
            "scale": "3 3 1",
            "position": `${p.width * 0.05} ${p.height * 0.6} 0.3`,
            "clickable": "",
            "button-highlight": "",
        }, [], el)
        refreshBtn.addEventListener("click", () => {
            this.fetchFiles(el, url)
        })

        let backBtn = createEl("a-image", {
            "src": "#asset-back",
            "scale": "3 3 1",
            "position": `-${p.width * 0.05} ${p.height * 0.6} 0.3`,
            "clickable": "",
            "button-highlight": "",
        }, [], el)
        backBtn.addEventListener("click", () => {
            // Clear out the folder handles to reset navigation context smoothly back to the root dialer
            window.localFolderHandle = null;
            this.fetchFiles(el, "");
        })

        if (this.files.length > itemLimit) {
            if (offsetFiles != 0) {
                let filesUpBtn = createEl("a-image", {
                    "src": "#asset-up",
                    "scale": "3 3 1",
                    "position": `-${p.width * 0.25} ${p.height * 0.4} 0.2`,
                    "clickable": "",
                    "button-highlight": "",
                }, [], el)
                filesUpBtn.addEventListener("click", () => {
                    this.offset = {
                        ...this.offset,
                        [url]: {
                            files: offsetFiles - itemLimit,
                            folders: offsetFolders
                        }
                    }
                    this.renderFiles()
                })
            }
            if (offsetFiles + itemLimit < this.files.length) {
                let filesDownBtn = createEl("a-image", {
                    "src": "#asset-up",
                    "scale": "3 -3 1",
                    "position": `-${p.width * 0.25} -${p.height * 0.5} 0.2`,
                    "clickable": "",
                    "button-highlight": "",
                }, [], el)
                filesDownBtn.addEventListener("click", () => {
                    this.offset = {
                        ...this.offset,
                        [url]: {
                            files: offsetFiles + itemLimit,
                            folders: offsetFolders
                        }
                    }
                    this.renderFiles()
                })
            }
        }

        if (this.folders.length > itemLimit) {
            if (offsetFolders != 0) {
                let foldersUpBtn = createEl("a-image", {
                    "src": "#asset-up",
                    "scale": "3 3 1",
                    "position": `${p.width * 0.35} ${p.height * 0.4} 0.2`,
                    "clickable": "",
                    "button-highlight": "",
                }, [], el)
                foldersUpBtn.addEventListener("click", () => {
                    this.offset = {
                        ...this.offset,
                        [url]: {
                            files: offsetFiles,
                            folders: offsetFolders - itemLimit
                        }
                    }
                    this.renderFiles()
                })
            }
            if (offsetFolders + itemLimit < this.folders.length) {
                let foldersDownBtn = createEl("a-image", {
                    "src": "#asset-up",
                    "scale": "3 -3 1",
                    "position": `${p.width * 0.35} -${p.height * 0.5} 0.2`,
                    "clickable": "",
                    "button-highlight": "",
                }, [], el)
                foldersDownBtn.addEventListener("click", () => {
                    this.offset = {
                        ...this.offset,
                        [url]: {
                            files: offsetFiles,
                            folders: offsetFolders + itemLimit
                        }
                    }
                    this.renderFiles()

                })
            }
        }
    },

    remove: function () {
        let el = this.el
        el.replaceChildren()
        el.removeAttribute('clickable')
        el.setAttribute('dialog-utils', { 'screen': '' })
    }
});