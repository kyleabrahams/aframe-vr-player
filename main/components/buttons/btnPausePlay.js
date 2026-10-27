import { El } from "../../elems.js";

AFRAME.registerComponent('btn-pause-play', {
    init: function () {
        let el = this.el

        this.video = El.video

        this.pausePlay = () => {
            if (this.video.paused) {
                this.video.play()
            } else {
                this.video.pause()
            }
        }
        this.onPause = () => el.setAttribute("src", "#asset-vp-play")
        this.onPlay = () => el.setAttribute("src", "#asset-vp-pause")

        // Bind the keyboard tracking loop for the Spacebar
        this.onKeyDown = (event) => {
            // Check for Spacebar signature inputs
            if (event.key === ' ' || event.code === 'Space') {
                // Prevent standard web browser scrolling mechanics when tapping space
                event.preventDefault();
                this.pausePlay();
            }
        };

        el.addEventListener('click', this.pausePlay)
        this.video.addEventListener("playing", this.onPlay)
        this.video.addEventListener("pause", this.onPause)
        window.addEventListener('keydown', this.onKeyDown)
    },
    remove: function () {
        this.el.removeEventListener('click', this.pausePlay)
        this.video.removeEventListener("playing", this.onPlay)
        this.video.removeEventListener("pause", this.onPause)
        window.removeEventListener('keydown', this.onKeyDown)
    }
});
