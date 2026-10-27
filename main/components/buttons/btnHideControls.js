AFRAME.registerComponent('btn-hide-controls', {
    init: function () {
        const el = this.el;
        const controlsContainer = document.getElementById('controls');

        // Core action to toggle UI visibility state uniformly
        const toggleControlsUi = () => {
            if (controlsContainer) {
                // 1. Determine if the controls panel is currently visible
                const isVisible = controlsContainer.getAttribute('visible') !== false;
                const nextState = !isVisible;
                
                // 2. Toggle the parent container state cleanly
                controlsContainer.setAttribute('visible', nextState);
                
                // 3. Toggle the 3D video title overlay text component
                const titleTextEl = document.getElementById('vrVideoTitle');
                if (titleTextEl) {
                    titleTextEl.setAttribute('visible', nextState);
                }

                // 4. TARGETED CURSOR OVERRIDE:
                // Explicitly find the green dot cursor entity and sync its visibility 
                // so it disappears cleanly along with the rest of your player dashboard
                const cursorEl = document.getElementById('cursor');
                if (cursorEl) {
                    cursorEl.setAttribute('visible', nextState);
                }

                console.log(`UI, Title, and Green Dot visibility toggled to: ${nextState}`);
            }
        };

        // Handle physical mouse or VR cursor raycaster selection clicks on the image button
        el.addEventListener('click', () => {
            toggleControlsUi();
        });

        // Handle typing the physical 'H' key on your Mac mini's keyboard layout
        this.onKeyDown = (event) => {
            if (event.key.toLowerCase() === 'h') {
                toggleControlsUi();
            }
        };

        window.addEventListener('keydown', this.onKeyDown);
    },

    // Safely remove event maps if the scene structure drops out or reloads
    remove: function () {
        window.removeEventListener('keydown', this.onKeyDown);
    }
});
