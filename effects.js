/* ============================================================
   TEDDY INDETIE — EFFECTS.JS
   Extra "next level" interactivity layer:
   1. Canvas mouse trail (glowing teal particles)
   2. Click burst / ripple
   3. Magnetic nav links
   4. Ambient cursor glow spotlight
   5. Scroll-based tilt polish for cards
   Drop this file in alongside index.html / project-1.html and
   include it with: <script src="effects.js"></script>
   ============================================================ */

(function () {
    "use strict";

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const THEME = {
        teal: "0, 173, 181",   // rgb for #00adb5
        tealBright: "0, 217, 192"
    };

    /* ------------------------------------------------------
       1. MOUSE TRAIL — canvas-based particle stream
    ------------------------------------------------------ */
    function initMouseTrail() {
        if (prefersReducedMotion) return;

        const canvas = document.createElement("canvas");
        canvas.id = "trail-canvas";
        Object.assign(canvas.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "9998"
        });
        document.body.appendChild(canvas);

        const ctx = canvas.getContext("2d");
        let dpr = window.devicePixelRatio || 1;

        function resize() {
            dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + "px";
            canvas.style.height = window.innerHeight + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        window.addEventListener("resize", resize);

        let particles = [];
        let lastX = null;
        let lastY = null;
        let mouseActive = false;

        class TrailParticle {
            constructor(x, y, speed) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 2.5 + 1.5;
                this.life = 1;
                // fade speed scales gently with cursor speed so fast swipes
                // leave a slightly longer streak
                this.decay = 0.018 + Math.random() * 0.012;
                this.vx = (Math.random() - 0.5) * 0.6;
                this.vy = (Math.random() - 0.5) * 0.6 - 0.2;
                this.hue = Math.random() > 0.5 ? THEME.teal : THEME.tealBright;
                this.baseSize = this.size;
            }

            update() {
                this.life -= this.decay;
                this.x += this.vx;
                this.y += this.vy;
                this.size = this.baseSize * Math.max(this.life, 0);
            }

            draw(ctx) {
                if (this.life <= 0) return;
                ctx.save();
                ctx.globalCompositeOperation = "lighter";
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size * 4
                );
                gradient.addColorStop(0, `rgba(${this.hue}, ${this.life * 0.9})`);
                gradient.addColorStop(1, `rgba(${this.hue}, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        document.addEventListener("mousemove", (e) => {
            mouseActive = true;
            const x = e.clientX;
            const y = e.clientY;

            if (lastX !== null) {
                const dx = x - lastX;
                const dy = y - lastY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // interpolate particles along the movement so fast
                // motion doesn't leave gaps in the trail
                const steps = Math.min(Math.ceil(dist / 6), 8);
                for (let i = 0; i < steps; i++) {
                    const t = i / steps;
                    particles.push(
                        new TrailParticle(lastX + dx * t, lastY + dy * t, dist)
                    );
                }
            }
            lastX = x;
            lastY = y;

            if (particles.length > 220) {
                particles.splice(0, particles.length - 220);
            }
        });

        document.addEventListener("mouseleave", () => {
            mouseActive = false;
        });

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.update();
                p.draw(ctx);
            });
            particles = particles.filter((p) => p.life > 0);
            requestAnimationFrame(animate);
        }
        animate();
    }

    /* ------------------------------------------------------
       2. CLICK BURST — small ring + spark burst on every click
    ------------------------------------------------------ */
    function initClickBurst() {
        if (prefersReducedMotion) return;

        document.addEventListener("click", (e) => {
            // Skip form fields so it doesn't feel noisy while typing
            const tag = e.target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;

            const ring = document.createElement("div");
            Object.assign(ring.style, {
                position: "fixed",
                left: e.clientX + "px",
                top: e.clientY + "px",
                width: "8px",
                height: "8px",
                marginLeft: "-4px",
                marginTop: "-4px",
                borderRadius: "50%",
                border: `1.5px solid rgba(${THEME.teal}, 0.9)`,
                pointerEvents: "none",
                zIndex: "9999",
                transform: "scale(1)",
                opacity: "1",
                transition: "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.6s ease-out"
            });
            document.body.appendChild(ring);

            requestAnimationFrame(() => {
                ring.style.transform = "scale(6)";
                ring.style.opacity = "0";
            });

            setTimeout(() => ring.remove(), 650);

            // A few tiny sparks flying outward
            const sparkCount = 6;
            for (let i = 0; i < sparkCount; i++) {
                const spark = document.createElement("div");
                const angle = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.5;
                const distance = 24 + Math.random() * 18;
                Object.assign(spark.style, {
                    position: "fixed",
                    left: e.clientX + "px",
                    top: e.clientY + "px",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: `rgba(${THEME.tealBright}, 0.9)`,
                    pointerEvents: "none",
                    zIndex: "9999",
                    transition: "transform 0.5s ease-out, opacity 0.5s ease-out",
                    transform: "translate(0, 0) scale(1)",
                    opacity: "1"
                });
                document.body.appendChild(spark);

                requestAnimationFrame(() => {
                    spark.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`;
                    spark.style.opacity = "0";
                });

                setTimeout(() => spark.remove(), 550);
            }
        });
    }

    /* ------------------------------------------------------
       3. MAGNETIC NAV LINKS — subtle pull toward the cursor
    ------------------------------------------------------ */
    function initMagneticNav() {
        if (prefersReducedMotion) return;

        const links = document.querySelectorAll(".nav-link, .logo");
        links.forEach((link) => {
            link.style.display = link.style.display || "inline-block";
            link.addEventListener("mousemove", (e) => {
                const rect = link.getBoundingClientRect();
                const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
                const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
                link.style.transition = "transform 0.1s ease-out";
                link.style.transform = `translate(${x}px, ${y}px)`;
            });
            link.addEventListener("mouseleave", () => {
                link.style.transition = "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)";
                link.style.transform = "translate(0, 0)";
            });
        });
    }

    /* ------------------------------------------------------
       4. AMBIENT SPOTLIGHT — soft radial glow that follows the
          cursor over dark sections, for extra depth
    ------------------------------------------------------ */
    function initAmbientSpotlight() {
        if (prefersReducedMotion) return;

        const glow = document.createElement("div");
        glow.id = "ambient-spotlight";
        Object.assign(glow.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "500px",
            height: "500px",
            marginLeft: "-250px",
            marginTop: "-250px",
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${THEME.teal}, 0.06) 0%, rgba(${THEME.teal}, 0) 70%)`,
            pointerEvents: "none",
            zIndex: "1",
            transition: "opacity 0.3s ease",
            opacity: "0"
        });
        document.body.appendChild(glow);

        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight / 2;
        let curX = targetX;
        let curY = targetY;

        document.addEventListener("mousemove", (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
            glow.style.opacity = "1";
        });

        document.addEventListener("mouseleave", () => {
            glow.style.opacity = "0";
        });

        function loop() {
            curX += (targetX - curX) * 0.08;
            curY += (targetY - curY) * 0.08;
            glow.style.transform = `translate(${curX}px, ${curY}px)`;
            requestAnimationFrame(loop);
        }
        loop();
    }

    /* ------------------------------------------------------
       5. CARD TILT POLISH — reusable 3D tilt for any element
          carrying the data-tilt attribute (project cards etc.)
    ------------------------------------------------------ */
    function initTiltElements() {
        if (prefersReducedMotion) return;

        // NOTE: index.html's own .project-card tilt handler is stronger and
        // lives inline there; this generic tilt only applies to elements
        // that opt in via data-tilt (used by the project-1/2/3 detail pages)
        // so the two never fight over the same transform.
        const tiltEls = document.querySelectorAll("[data-tilt]");
        tiltEls.forEach((el) => {
            el.addEventListener("mousemove", (e) => {
                const rect = el.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
                const rotateX = -y * 10;
                const rotateY = x * 10;
                el.style.transition = "transform 0.1s ease-out";
                el.style.transform = `perspective(950px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.01)`;
            });
            el.addEventListener("mouseleave", () => {
                el.style.transition = "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)";
                el.style.transform = "";
            });
        });
    }

    /* ------------------------------------------------------
       6. PROJECT HEADER AMBIENT CANVAS — glowing orb, comets,
          drifting code glyphs and twinkling stars, shared across
          project-1/2/3.html so each detail page's header feels
          as alive as the main portfolio hero.
    ------------------------------------------------------ */
    function initProjectHeroCanvas() {
        const canvas = document.getElementById("project-hero-canvas");
        if (!canvas || prefersReducedMotion) return;

        const ctx = canvas.getContext("2d");
        const header = canvas.parentElement;

        let width, height, dpr;

        function resize() {
            width = header.offsetWidth;
            height = header.offsetHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        window.addEventListener("resize", resize);

        /* ---- soft drifting dots with faint connecting lines ---- */
        const dots = [];
        const dotCount = 34;
        class Dot {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 0.7;
                this.vx = (Math.random() - 0.5) * 0.25;
                this.vy = (Math.random() - 0.5) * 0.25;
                this.opacity = Math.random() * 0.5 + 0.25;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }
            draw() {
                ctx.save();
                ctx.fillStyle = `rgba(0, 173, 181, ${this.opacity})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = "#00adb5";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        for (let i = 0; i < dotCount; i++) dots.push(new Dot());

        /* ---- drifting code glyphs ---- */
        const glyphSymbols = ["{ }", "</>", "( )", ";", "#", "=>", "01", "00", "def"];
        const glyphs = [];
        const glyphCount = 6;
        class Glyph {
            constructor() { this.reset(true); }
            reset(initial) {
                this.x = Math.random() * width;
                this.y = initial ? Math.random() * height : height + 20;
                this.text = glyphSymbols[Math.floor(Math.random() * glyphSymbols.length)];
                this.size = Math.random() * 5 + 10;
                this.speed = Math.random() * 0.14 + 0.05;
                this.swayOffset = Math.random() * Math.PI * 2;
                this.opacity = Math.random() * 0.15 + 0.06;
            }
            update() {
                this.y -= this.speed;
                this.x += Math.sin(Date.now() / 1800 + this.swayOffset) * 0.15;
                if (this.y < -20) this.reset(false);
            }
            draw() {
                ctx.save();
                ctx.font = `${this.size}px 'Courier New', monospace`;
                ctx.fillStyle = `rgba(0, 173, 181, ${this.opacity})`;
                ctx.fillText(this.text, this.x, this.y);
                ctx.restore();
            }
        }
        for (let i = 0; i < glyphCount; i++) glyphs.push(new Glyph());

        /* ---- twinkling stars ---- */
        const twinkles = [];
        const twinkleCount = 10;
        class Twinkle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 1.3 + 0.5;
                this.phase = Math.random() * Math.PI * 2;
                this.speed = Math.random() * 0.015 + 0.008;
            }
            draw() {
                const glow = (Math.sin(Date.now() * this.speed + this.phase) + 1) / 2;
                ctx.save();
                ctx.fillStyle = `rgba(255, 255, 255, ${0.06 + glow * 0.3})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        for (let i = 0; i < twinkleCount; i++) twinkles.push(new Twinkle());

        /* ---- ambient glowing orb ---- */
        const orb = {
            x: Math.random() * width,
            y: Math.random() * height * 0.5,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.07,
            radius: Math.max(width, height) * 0.28
        };
        function updateDrawOrb() {
            orb.x += orb.vx;
            orb.y += orb.vy;
            if (orb.x < 0 || orb.x > width) orb.vx *= -1;
            if (orb.y < 0 || orb.y > height) orb.vy *= -1;

            const pulse = (Math.sin(Date.now() / 2600) + 1) / 2;
            const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
            grad.addColorStop(0, `rgba(0, 173, 181, ${0.06 + pulse * 0.03})`);
            grad.addColorStop(1, "rgba(0, 173, 181, 0)");
            ctx.save();
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }

        /* ---- comet streaks ---- */
        const comets = [];
        const maxComets = 2;
        function maybeSpawnComet() {
            if (comets.length < maxComets && Math.random() < 0.003) {
                const fromLeft = Math.random() > 0.5;
                const cool = Math.random() > 0.5;
                comets.push({
                    x: fromLeft ? -50 : width + 50,
                    y: Math.random() * height * 0.65,
                    vx: (fromLeft ? 1 : -1) * (Math.random() * 3 + 3.5),
                    vy: Math.random() * 1.2 + 0.5,
                    life: 1,
                    color: cool ? "0, 217, 192" : "120, 190, 255"
                });
            }
        }
        function updateDrawComets() {
            for (let i = comets.length - 1; i >= 0; i--) {
                const c = comets[i];
                c.x += c.vx;
                c.y += c.vy;
                c.life -= 0.016;

                ctx.save();
                ctx.strokeStyle = `rgba(${c.color}, ${Math.max(c.life, 0)})`;
                ctx.lineWidth = 1.4;
                ctx.shadowBlur = 9;
                ctx.shadowColor = `rgb(${c.color})`;
                ctx.beginPath();
                ctx.moveTo(c.x, c.y);
                ctx.lineTo(c.x - c.vx * 6, c.y - c.vy * 6);
                ctx.stroke();
                ctx.fillStyle = `rgba(${c.color}, ${Math.max(c.life, 0)})`;
                ctx.beginPath();
                ctx.arc(c.x, c.y, 1.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                if (c.life <= 0 || c.x < -100 || c.x > width + 100) comets.splice(i, 1);
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);

            updateDrawOrb();
            twinkles.forEach((t) => t.draw());

            dots.forEach((d) => {
                d.update();
                d.draw();

                dots.forEach((other) => {
                    const dx = d.x - other.x;
                    const dy = d.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 90 && dist > 0) {
                        ctx.strokeStyle = `rgba(0, 173, 181, ${0.1 * (1 - dist / 90)})`;
                        ctx.lineWidth = 0.7;
                        ctx.beginPath();
                        ctx.moveTo(d.x, d.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.stroke();
                    }
                });
            });

            glyphs.forEach((g) => {
                g.update();
                g.draw();
            });

            maybeSpawnComet();
            updateDrawComets();

            requestAnimationFrame(animate);
        }
        animate();
    }

    /* ------------------------------------------------------
       BOOT
    ------------------------------------------------------ */
    function boot() {
        initMouseTrail();
        initClickBurst();
        initMagneticNav();
        initAmbientSpotlight();
        initTiltElements();
        initProjectHeroCanvas();
        console.log(
            "%c[effects.js] Next-level interactions loaded (mouse trail, click burst, magnetic nav, spotlight, tilt, ambient canvas).",
            "color:#00adb5"
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
