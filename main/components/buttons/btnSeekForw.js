import { El } from "../../elems.js";

AFRAME.registerComponent('btn-seek-forw', {
    init: function () {
        let el = this.el;
        this.video = El.video;
        this.holdCounter = 0; // Tracks hold length to ramp speed up dynamically

        this.seekForward = (skipAmount = 10) => {
            this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + skipAmount);
        };

        this.onKeyDown = (event) => {
            // ADD THIS GUARD: If the Command key is held down, exit immediately and let main.js handle the file skip
            if (event.metaKey || event.ctrlKey) return;

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                
                this.holdCounter++;
                let skipAmount = 10;

                if (this.holdCounter > 15) {
                    skipAmount = 60;
                } else if (this.holdCounter > 5) {
                    skipAmount = 30;
                }

                this.seekForward(skipAmount);
            }
        };

        // Reset the counter completely the exact millisecond the user lifts their finger
        this.onKeyUp = (event) => {
            if (event.key === 'ArrowRight') {
                this.holdCounter = 0;
            }
        };

        el.addEventListener('click', () => this.seekForward(10));
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    },
    remove: function () {
        this.el.removeEventListener('click', () => this.seekForward(10));
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
});
