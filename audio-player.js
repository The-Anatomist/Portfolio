/* ============================================================
   TEDDY INDETIE — AUDIO-PLAYER.JS
   Shuffled background music player with a bottom control bar
   and a real audio-reactive visualizer (Web Audio API), driven
   by whatever frequency data the currently playing track has —
   not a canned animation.

   SETUP:
   1. Create a folder called "audio" next to your HTML files.
   2. Drop your own legally-owned MP3s in there, named to match
      the FILES list below (see MANIFEST.txt in the starter kit).
   3. Include this file on every page: <script src="audio-player.js"></script>
   ============================================================ */

(function () {
    "use strict";

    /* ---- Playlist — filenames are what you should name your own
       trimmed MP3s (silence-trimmed at start/end) ---- */
    const TRACKS = [
        { file: "audio/01-mood.mp3", title: "Mood", artist: "24kGoldn ft. iann dior" },
        { file: "audio/02-no-lie.mp3", title: "No Lie", artist: "Sean Paul ft. Dua Lipa" },
        { file: "audio/03-havana.mp3", title: "Havana", artist: "Camila Cabello ft. Young Thug" },
        { file: "audio/04-rockstar.mp3", title: "Rockstar", artist: "Post Malone ft. 21 Savage" },
        { file: "audio/05-unstoppable.mp3", title: "Unstoppable", artist: "Sia" },
        { file: "audio/06-cradles.mp3", title: "Cradles", artist: "Sub Urban" },
        { file: "audio/07-sweet-but-psycho.mp3", title: "Sweet but Psycho", artist: "Ava Max" },
        { file: "audio/08-believer.mp3", title: "Believer", artist: "Imagine Dragons" },
        { file: "audio/09-billie-eilish.mp3", title: "Billie Eilish", artist: "Armani White" },
        { file: "audio/10-bye-bye.mp3", title: "Bye Bye", artist: "Marshmello ft. Juice WRLD" },
        { file: "audio/11-eastside.mp3", title: "Eastside", artist: "Benny Blanco ft. Halsey & Khalid" },
        { file: "audio/12-beautiful-things.mp3", title: "Beautiful Things", artist: "Benson Boone" },
        { file: "audio/13-rush.mp3", title: "Rush", artist: "Ayra Starr" },
        { file: "audio/14-empty.mp3", title: "Empty", artist: "Juice WRLD" },
        { file: "audio/15-goosebumps.mp3", title: "Goosebumps", artist: "Travis Scott ft. Kendrick Lamar" },
        { file: "audio/16-the-box.mp3", title: "The Box", artist: "Roddy Ricch" },
        { file: "audio/17-astronaut-in-the-ocean.mp3", title: "Astronaut In The Ocean", artist: "Masked Wolf" },
        { file: "audio/18-ransom.mp3", title: "Ransom", artist: "Lil Tecca" },
        { file: "audio/19-smile.mp3", title: "Smile", artist: "Juice WRLD x The Weeknd" },
        { file: "audio/20-savage-love.mp3", title: "Savage Love", artist: "Jason Derulo x Jawsh 685" },
        { file: "audio/21-lean-on.mp3", title: "Lean On", artist: "Major Lazer & DJ Snake ft. MØ" }
    ];

    /* ---- Fisher-Yates shuffle ---- */
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    let order = shuffle(TRACKS.map((_, i) => i));
    let pointer = 0;
    let failCount = 0;

    /* ---- Build the audio element ---- */
    const audio = document.createElement("audio");
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    document.body.appendChild(audio);

    /* ---- Restore saved volume / mute preference ---- */
    const savedVolume = parseFloat(localStorage.getItem("ti_player_volume"));
    const savedMuted = localStorage.getItem("ti_player_muted") === "true";
    audio.volume = Number.isFinite(savedVolume) ? savedVolume : 0.5;
    audio.muted = savedMuted;

    /* ---- Build the bottom control bar ---- */
    const style = document.createElement("style");
    style.textContent = `
        #ti-player-bar {
            position: fixed;
            left: 50%;
            bottom: 18px;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 14px;
            background: rgba(17, 17, 17, 0.85);
            backdrop-filter: blur(14px);
            border: 1px solid rgba(0, 173, 181, 0.25);
            border-radius: 999px;
            padding: 8px 18px 8px 10px;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #eee;
            box-shadow: 0 12px 40px rgba(0,0,0,0.5);
            max-width: 92vw;
            transition: opacity 0.4s ease, transform 0.4s ease;
        }
        #ti-player-bar.ti-hidden {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
            pointer-events: none;
        }
        .ti-btn {
            background: none;
            border: none;
            color: #ccc;
            cursor: pointer;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
            flex-shrink: 0;
        }
        .ti-btn:hover {
            background: rgba(0, 173, 181, 0.15);
            color: #00adb5;
            transform: scale(1.08);
        }
        .ti-btn svg { width: 16px; height: 16px; fill: currentColor; }
        #ti-play-btn { background: #00adb5; color: #111; width: 38px; height: 38px; }
        #ti-play-btn:hover { background: #00d9c0; color: #111; }

        #ti-track-info {
            display: flex;
            flex-direction: column;
            line-height: 1.2;
            min-width: 90px;
            max-width: 160px;
            overflow: hidden;
        }
        #ti-track-title {
            font-size: 0.8rem;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        #ti-track-artist {
            font-size: 0.68rem;
            color: #888;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        #ti-visualizer {
            width: 60px;
            height: 28px;
            flex-shrink: 0;
        }

        #ti-volume-wrap {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        #ti-volume {
            width: 70px;
            accent-color: #00adb5;
            cursor: pointer;
        }

        #ti-player-hint {
            position: fixed;
            left: 50%;
            bottom: 74px;
            transform: translateX(-50%);
            background: rgba(17,17,17,0.9);
            border: 1px solid rgba(0,173,181,0.3);
            color: #ccc;
            font-size: 0.75rem;
            padding: 6px 14px;
            border-radius: 999px;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            opacity: 0;
            transition: opacity 0.4s ease;
            pointer-events: none;
        }
        #ti-player-hint.ti-show { opacity: 1; }

        @media (max-width: 560px) {
            #ti-track-info { display: none; }
            #ti-volume-wrap { display: none; }
        }
    `;
    document.head.appendChild(style);

    const bar = document.createElement("div");
    bar.id = "ti-player-bar";
    bar.innerHTML = `
        <button class="ti-btn" id="ti-prev-btn" title="Previous track" aria-label="Previous track">
            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button class="ti-btn" id="ti-play-btn" title="Play/Pause" aria-label="Play or pause">
            <svg id="ti-play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg id="ti-pause-icon" viewBox="0 0 24 24" style="display:none"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
        </button>
        <button class="ti-btn" id="ti-next-btn" title="Next track" aria-label="Next track">
            <svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z"/></svg>
        </button>
        <canvas id="ti-visualizer" width="60" height="28"></canvas>
        <div id="ti-track-info">
            <span id="ti-track-title">Loading…</span>
            <span id="ti-track-artist">—</span>
        </div>
        <div id="ti-volume-wrap">
            <button class="ti-btn" id="ti-mute-btn" title="Mute/Unmute" aria-label="Mute or unmute">
                <svg id="ti-vol-icon" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 00-2.5-4.03v8.06A4.5 4.5 0 0016.5 12z"/></svg>
                <svg id="ti-mute-icon" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12A4.5 4.5 0 0014 8v2.17l2.45 2.45c.03-.2.05-.4.05-.62zM3 10v4h4l5 5v-4.17L5.83 8.83 3 6v4zm14.73 8.27L19.27 17 5.73 3.46 4.19 5l3.31 3.31L3 10v4h4l5 5v-6.17l3.73 3.73c-.52.4-1.11.71-1.73.9V19c1.61-.36 3.09-1.15 4.27-2.28l1.46 1.46 1.27-1.27z"/></svg>
            </button>
            <input type="range" id="ti-volume" min="0" max="1" step="0.01" value="0.5">
        </div>
    `;
    document.body.appendChild(bar);

    const hint = document.createElement("div");
    hint.id = "ti-player-hint";
    hint.textContent = "🎵 Click anywhere to start the music";
    document.body.appendChild(hint);

    const playBtn = document.getElementById("ti-play-btn");
    const playIcon = document.getElementById("ti-play-icon");
    const pauseIcon = document.getElementById("ti-pause-icon");
    const prevBtn = document.getElementById("ti-prev-btn");
    const nextBtn = document.getElementById("ti-next-btn");
    const muteBtn = document.getElementById("ti-mute-btn");
    const volIcon = document.getElementById("ti-vol-icon");
    const muteIcon = document.getElementById("ti-mute-icon");
    const volumeSlider = document.getElementById("ti-volume");
    const titleEl = document.getElementById("ti-track-title");
    const artistEl = document.getElementById("ti-track-artist");
    const visCanvas = document.getElementById("ti-visualizer");
    const visCtx = visCanvas.getContext("2d");

    volumeSlider.value = audio.volume;
    updateMuteIcon();

    function updateMuteIcon() {
        const isMuted = audio.muted || audio.volume === 0;
        volIcon.style.display = isMuted ? "none" : "block";
        muteIcon.style.display = isMuted ? "block" : "none";
    }

    function loadTrack(i, autoplay) {
        const track = TRACKS[order[i]];
        audio.src = track.file;
        titleEl.textContent = track.title;
        artistEl.textContent = track.artist;
        if (autoplay) {
            audio.play().catch(() => {
                showHint();
            });
        }
    }

    function next() {
        pointer = (pointer + 1) % order.length;
        if (pointer === 0) order = shuffle(TRACKS.map((_, i) => i)); // reshuffle each loop
        loadTrack(pointer, true);
    }

    function prev() {
        pointer = (pointer - 1 + order.length) % order.length;
        loadTrack(pointer, true);
    }

    function showHint() {
        hint.classList.add("ti-show");
        const startOnInteract = () => {
            setupAnalyser();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            audio.play().then(() => {
                hint.classList.remove("ti-show");
            }).catch(() => {});
        };
        document.addEventListener("click", startOnInteract, { once: true });
        document.addEventListener("keydown", startOnInteract, { once: true });
    }

    audio.addEventListener("ended", next);
    audio.addEventListener("error", () => {
        failCount++;
        if (failCount < TRACKS.length) {
            // Likely a missing/renamed file — skip forward quietly
            next();
        } else {
            titleEl.textContent = "Add your MP3s to /audio";
            artistEl.textContent = "See MANIFEST.txt";
        }
    });

    audio.addEventListener("play", () => {
        playIcon.style.display = "none";
        pauseIcon.style.display = "block";
        hint.classList.remove("ti-show");
    });
    audio.addEventListener("pause", () => {
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
    });

    playBtn.addEventListener("click", () => {
        setupAnalyser();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (audio.paused) {
            audio.play().catch(() => showHint());
        } else {
            audio.pause();
        }
    });
    nextBtn.addEventListener("click", next);
    prevBtn.addEventListener("click", prev);

    muteBtn.addEventListener("click", () => {
        audio.muted = !audio.muted;
        localStorage.setItem("ti_player_muted", audio.muted);
        updateMuteIcon();
    });

    volumeSlider.addEventListener("input", () => {
        audio.volume = parseFloat(volumeSlider.value);
        if (audio.volume > 0 && audio.muted) {
            audio.muted = false;
            localStorage.setItem("ti_player_muted", "false");
        }
        localStorage.setItem("ti_player_volume", audio.volume);
        updateMuteIcon();
    });

    /* ---- Real audio-reactive visualizer via Web Audio API ---- */
    let audioCtx, analyser, sourceNode, dataArray;
    function setupAnalyser() {
        if (audioCtx) {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return;
        }
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            sourceNode = audioCtx.createMediaElementSource(audio);
            sourceNode.connect(analyser);
            analyser.connect(audioCtx.destination);
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        } catch (e) {
            // Web Audio unavailable — visualizer will idle
        }
    }

    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);
        visCtx.clearRect(0, 0, visCanvas.width, visCanvas.height);

        const barCount = 9;
        const barWidth = 3;
        const gap = 3;
        const totalWidth = barCount * (barWidth + gap) - gap;
        const startX = (visCanvas.width - totalWidth) / 2;

        if (analyser && dataArray && !audio.paused) {
            analyser.getByteFrequencyData(dataArray);
            for (let i = 0; i < barCount; i++) {
                const v = dataArray[i * 2] / 255;
                const h = Math.max(2, v * visCanvas.height);
                visCtx.fillStyle = `rgba(0, 173, 181, ${0.5 + v * 0.5})`;
                visCtx.fillRect(startX + i * (barWidth + gap), (visCanvas.height - h) / 2, barWidth, h);
            }
        } else {
            // Idle state — tiny flat bars so it doesn't look broken while paused
            for (let i = 0; i < barCount; i++) {
                visCtx.fillStyle = "rgba(0, 173, 181, 0.25)";
                visCtx.fillRect(startX + i * (barWidth + gap), visCanvas.height / 2 - 1, barWidth, 2);
            }
        }
    }
    drawVisualizer();

    function boot() {
        loadTrack(pointer, false);
        // Attempt autoplay; browsers usually block audio with sound until
        // a user gesture, so we gracefully fall back to the click hint.
        const tryPlay = () => {
            setupAnalyser();
            audio.play().catch(() => showHint());
        };
        // AudioContext must be created/resumed after a user gesture in
        // most browsers, so set it up lazily on first play attempt too.
        document.addEventListener("click", setupAnalyser, { once: true });
        document.addEventListener("keydown", setupAnalyser, { once: true });
        tryPlay();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
