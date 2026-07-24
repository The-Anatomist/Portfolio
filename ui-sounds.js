/* ============================================================
   TEDDY INDETIE — UI SOUND EFFECTS (Web Audio API)
   Crisp, subtle tactile feedback for button clicks & interactions.
   ============================================================ */

(function () {
    "use strict";

    let uiAudioCtx = null;

    function getAudioContext() {
        if (!uiAudioCtx) {
            uiAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (uiAudioCtx.state === 'suspended') {
            uiAudioCtx.resume();
        }
        return uiAudioCtx;
    }

    // Play a subtle mechanical click / tap sound
    function playClickSound() {
        try {
            const ctx = getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch (e) {
            // Audio context blocked or unavailable
        }
    }

    // Play a pleasant success chime (e.g. when copying email or code)
    function playSuccessSound() {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            [523.25, 659.25, 783.99].forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + index * 0.08);

                gain.gain.setValueAtTime(0.06, now + index * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.2);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + index * 0.08);
                osc.stop(now + index * 0.08 + 0.2);
            });
        } catch (e) {}
    }

    // Attach to interactive elements across the document
    function initUISounds() {
        const selectors = 'button, a, .project-card, .slide-btn, .slide-dot, .rps-btn, .calc-btn';
        
        document.addEventListener('click', (e) => {
            const target = e.target.closest(selectors);
            if (target) {
                if (target.classList.contains('copy-email') || target.classList.contains('copy-code-btn') || target.id === 'copy-snippet-btn') {
                    playSuccessSound();
                } else {
                    playClickSound();
                }
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUISounds);
    } else {
        initUISounds();
    }
})();
