AFRAME.registerComponent('btn-hide-controls', {
    init: function () {
        const el = this.el;
        const controlsContainer = document.getElementById('controls');

        const toggleControlsUi = () => {
            if (controlsContainer) {
                const isVisible = controlsContainer.getAttribute('visible') !== false;
                const nextState = !isVisible;
                
                controlsContainer.setAttribute('visible', nextState);
                
                // Track text element visibility changes natively
                const titleTextEl = document.getElementById('vrVideoTitle');
                if (titleTextEl) {
                    titleTextEl.setAttribute('visible', nextState);
                }

                // Track cursor visibility changes natively
                const cursorEl = document.getElementById('cursor');
                if (cursorEl) {
                    cursorEl.setAttribute('visible', nextState);
                }

                console.log(`UI Visibility Synchronized: ${nextState}`);
            }
        };

        el.addEventListener('click', () => {
            toggleControlsUi();
        });

        this.onKeyDown = (event) => {
            if (event.key.toLowerCase() === 'h') {
                toggleControlsUi();
            }
        };

        window.addEventListener('keydown', this.onKeyDown);
    },
    remove: function () {
        window.removeEventListener('keydown', this.onKeyDown);
    }
});
