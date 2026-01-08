const EMOJIS = ["🤝", "👌", "🆘", "🏠", "⏳", "📞", "🍕", "😴", "❤️", "🏃", "🚨", "🎁", "🫂", "✅", "❓", "⚠️", "🕊️", "💪", "🌈", "📍", "🔒", "💰", "🔥", "🧊", "💊", "💬", "💀", "🤫", "👀", "🥂", "🦋", "🛸", "🌌", "🧬", "🌹", "💎"];
const KEYS = ["🔑", "🎲", "🌲", "🌙", "☀️", "🍎", "🚗", "🐱", "👁️", "⚡", "💧", "🎵"];
const SECRETS = ["👻", "👽", "🤖", "🤡", "👺", "🎃", "👾", "🦄", "🐲", "🎱", "👑", "💍"];

const INTENT_MAP = { MEET: '🤝', OK: '👌', HELP: '🆘', SAFE: '🏠', WAIT: '⏳', CALL: '📞', FOOD: '🍕', SLEEP: '😴', LOVE: '❤️' };
const MORSE = { 'A': ".-", 'B': "-...", 'C': "-.-.", 'D': "-..", 'E': ".", 'F': "..-.", 'G': "--.", 'H': "....", 'I': "..", 'J': ".---", 'K': "-.-", 'L': ".-..", 'M': "--", 'N': "-.", 'O': "---", 'P': ".--.", 'Q': "--.-", 'R': ".-.", 'S': "...", 'T': "-", 'U': "..-", 'V': "...-", 'W': ".--", 'X': "-..-", 'Y': "-.--", 'Z': "--..", '1': ".----", '2': "..---", '3': "...--", '4': "....-", '5': ".....", '6': "-....", '7': "--...", '8': "---..", '9': "----.", '0': "-----" };

function getMorseSeq(str) {
    return str.split('').map(c => MORSE[c.toUpperCase()] || '').join('   ').split('').flatMap(s => {
        if (s === '.') return [1, 0];
        if (s === '-') return [1, 1, 1, 0];
        return [0, 0];
    });
}

let morseSeq = [];
let morseIdx = 0;
let lastTick = 0;

let state = { emo: 'serenity', int: 80, intent: ['🤝'], t: 0, secret: '👻' };
let showSecret = false;
let inputs = { en: "", de: "" };

/* --- AUDIO SYSTEM --- */
const audioSys = new class {
    constructor() {
        this.ctx = null; this.nodes = {}; this.enabled = false;
    }
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.main = this.ctx.createGain();
        this.main.gain.value = 0;
        this.main.connect(this.ctx.destination);

        // Drone layers
        this.o1 = this.mkOsc(); this.o2 = this.mkOsc();
        this.lfo = this.mkOsc(true);
        this.fil = this.ctx.createBiquadFilter();
        this.fil.connect(this.main);
        this.o1.g.connect(this.fil); this.o2.g.connect(this.fil);

        this.update();
    }
    mkOsc(isLfo) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g); o.start();
        if (isLfo) g.gain.value = 100;
        return { o, g };
    }
    toggle() {
        if (!this.ctx) this.init();
        this.enabled = !this.enabled;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.main.gain.setTargetAtTime(this.enabled ? 0.3 : 0, this.ctx.currentTime, 0.1);
        return this.enabled;
    }
    update() {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const i = state.int / 100;

        if (state.emo === 'serenity') {
            this.tone(this.o1, 100, 'sine', t);
            this.tone(this.o2, 150, 'sine', t);
            this.fil.frequency.setTargetAtTime(400 + i * 400, t, 1);
        } else if (state.emo === 'joy') {
            this.tone(this.o1, 300 + i * 100, 'triangle', t);
            this.tone(this.o2, 450 + i * 100, 'sine', t);
            this.fil.frequency.setTargetAtTime(2000, t, 1);
        } else if (state.emo === 'rage') {
            this.tone(this.o1, 50, 'sawtooth', t);
            this.tone(this.o2, 55 + i * 50, 'square', t);
            this.fil.frequency.setTargetAtTime(3000 * i, t, 0.1);
        } else {
            this.tone(this.o1, 60, 'sine', t);
            this.tone(this.o2, 120, 'triangle', t);
            this.fil.frequency.setTargetAtTime(100, t, 2);
        }
    }
    tone(n, f, type, t) {
        n.o.frequency.setTargetAtTime(f, t, 1);
        n.o.type = type;
    }
};

/* --- VISUAL ENGINE (Rainbow Liquid Motion) --- */
function runAnim(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const dpr = window.devicePixelRatio || 1;
            const rect = entry.contentRect;
            // Set actual canvas size to match display size * DPR
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            // Normalize coordinate system so drawing logic works on 1:1 pixels relative to CSS dimensions
            ctx.scale(dpr, dpr);
        }
    });
    resizeObserver.observe(canvas);

    function draw() {
        // If canvas is removed or hidden, pause loop provided it's not the preview which should run
        if (!canvas.offsetParent) {
            requestAnimationFrame(draw);
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width / dpr; // Logical width
        const h = canvas.height / dpr; // Logical height

        // Trail Effect
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, 0, w, h);

        // Morse Pulse Update
        const now = Date.now();
        let pulse = ((Math.sin(state.t * 3) + 1) / 2) * 0.5;

        if (morseSeq.length > 0) {
            if (now - lastTick > 200) {
                lastTick = now;
                morseIdx = (morseIdx + 1) % morseSeq.length;
            }
            if (morseSeq[morseIdx]) pulse = 1.0;
        }

        const factor = state.int / 100;
        const hueBase = state.t * 40;

        // Hidden Data (Micro dots)
        ctx.fillStyle = `hsla(${hueBase}, 100%, 50%, ${0.3 + pulse})`;
        // Multi-Emoji support: Use length of array
        const intentCount = Array.isArray(state.intent) ? state.intent.length : 1;
        for (let j = 0; j < intentCount; j++) ctx.fillRect(10 + (j * 6), h - 8, 4 + (pulse * 2), 4 + (pulse * 2));

        ctx.lineWidth = 1.5 + (factor * 3) + (pulse * 2);
        ctx.lineCap = 'round';

        const centerX = w / 2;
        const centerY = h / 2;
        const lines = 40 + (factor * 40);

        for (let i = 0; i < lines; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `hsl(${(i * 8) + hueBase}, 100%, 60%)`;

            const angle = (i / lines) * Math.PI * 2;
            let x1, y1, x2, y2;

            if (state.emo === 'serenity') {
                const rad = (Math.min(w, h) * 0.4) * factor;
                x1 = centerX + Math.sin(state.t + angle) * rad;
                y1 = centerY + Math.cos(state.t * 0.3 + angle) * rad;
                x2 = centerX + Math.sin(state.t * 0.5 + angle * 2) * (rad * 1.2);
                y2 = centerY + Math.cos(state.t + angle) * (rad * 1.2);
            } else if (state.emo === 'joy') {
                const rad = (Math.min(w, h) * 0.5) * factor;
                const p = Math.sin(state.t * 2) * 20;
                x1 = centerX + Math.cos(angle + state.t) * (p + 10);
                y1 = centerY + Math.sin(angle + state.t) * (p + 10);
                x2 = centerX + Math.cos(angle - state.t) * (rad + p);
                y2 = centerY + Math.sin(angle - state.t) * (rad + p);
            } else if (state.emo === 'rage') {
                x1 = Math.random() * w;
                y1 = Math.random() * h;
                x2 = x1 + (Math.random() - 0.5) * (300 * factor);
                y2 = y1 + (Math.random() - 0.5) * (300 * factor);
            } else {
                const r = (i * 15 + state.t * 100) % (Math.max(w, h) * factor);
                ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            }

            if (state.emo !== 'grief') {
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            } else {
                ctx.stroke();
            }
        }

        // Ghost Text Layer
        if (state.secret && showSecret) {
            ctx.save();
            ctx.font = '80px serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(state.secret, w - 20, h - 20);
            ctx.restore();
        }

        state.t += 0.015;
        requestAnimationFrame(draw);
    }
    draw();
}

/* --- UI HELPERS --- */
function initPad(mode) {
    const p = document.getElementById('pad-' + mode);
    if (!p) return;

    KEYS.forEach(k => {
        const b = document.createElement('button');
        b.className = 'pass-key'; b.innerText = k;
        b.onclick = () => {
            if (inputs[mode].length < 12) {
                inputs[mode] += k;
                updateDisp(mode);
            }
        };
        p.appendChild(b);
    });
    const bk = document.createElement('button');
    bk.className = 'pass-key'; bk.innerText = "⌫";
    bk.style.color = "#ff4444";
    bk.onclick = () => { inputs[mode] = inputs[mode].slice(0, -2); updateDisp(mode); };
    p.appendChild(bk);
}

function updateDisp(mode) {
    const el = document.getElementById('disp-' + mode);
    if (el) el.innerText = inputs[mode];
}

function switchView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    if (id === 'create' || id === 'decrypt') audioSys.update();
}

/* --- CRYPTO --- */
const b64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
const d64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function handleEnc() {
    try {
        const pass = inputs.en;
        if (!pass || pass.length === 0) return alert("SELECT EMOJI KEYS First! 🔑");

        console.log("Encrypting state:", state);

        const data = new TextEncoder().encode(JSON.stringify(state));
        let pack;

        // CHECK FOR SECURE CONTEXT
        if (window.crypto && crypto.subtle) {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const kMat = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
            const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 10000, hash: "SHA-256" }, kMat, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
            const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
            pack = { c: b64(cipher), s: b64(salt), v: b64(iv), m: 'secure' };
        } else {
            console.warn("Insecure Context - Using Demo Encryption");
            pack = { c: btoa(JSON.stringify(state)), m: 'demo' };
        }

        const resArea = document.getElementById('result-area');
        const linkInput = document.getElementById('final-link');

        if (linkInput && resArea) {
            linkInput.value = window.location.origin + window.location.pathname + '#' + encodeURIComponent(btoa(JSON.stringify(pack)));

            // Show first so it has dimensions for scrolling
            resArea.style.display = 'block';

            // Auto focus and scroll
            linkInput.select();
            resArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

    } catch (e) {
        alert("Encryption Error: " + e.message);
        console.error(e);
    }
}

async function handleDec() {
    try {
        const pass = inputs.de;
        const hashVal = window.location.hash.substring(1);
        if (!hashVal) return;

        const pack = JSON.parse(atob(decodeURIComponent(hashVal)));
        let res;

        if (pack.m === 'secure') {
            // Decrypt Secure
            if (!crypto.subtle) throw new Error("Secure context required to decrypt.");
            const kMat = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
            const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: d64(pack.s), iterations: 10000, hash: "SHA-256" }, kMat, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
            const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: d64(pack.v) }, key, d64(pack.c));
            res = JSON.parse(new TextDecoder().decode(dec));
        } else {
            // Decrypt Demo
            res = JSON.parse(atob(pack.c));
        }

        state = { ...res, t: 0 };
        document.getElementById('dec-input').style.display = 'none';
        document.getElementById('dec-output').style.display = 'flex';
        document.getElementById('res-emo').innerText = res.emo;
        // Handle array intent display
        const displayIntent = Array.isArray(res.intent) ? res.intent.join('') : res.intent;
        document.getElementById('res-int').innerText = displayIntent;

        runAnim('view-canvas');

        const c = document.getElementById('view-canvas');
        c.onmousedown = c.ontouchstart = () => showSecret = true;
        c.onmouseup = c.ontouchend = () => showSecret = false;

        // --- AUDIO FIX ---
        // Ensure audio context is ready and running
        if (!audioSys.ctx || audioSys.ctx.state === 'suspended') {
            audioSys.init();
            audioSys.ctx.resume().then(() => {
                audioSys.enabled = true; // Force enable for receiver
                audioSys.main.gain.value = 0.3;
                audioSys.update();
            });
        } else {
            audioSys.update();
        }

    } catch (e) { alert("ACCESS DENIED: WRONG KEY OR CONTEXT"); console.error(e); }
}

/* --- HELPERS & EXPORTS (MOVED AFTER FUNCTION DEFINITIONS) --- */
window.switchView = switchView;
window.handleEnc = handleEnc;
window.handleDec = handleDec;
window.appState = state; // Debug helper

/* --- INITIALIZATION --- */
window.addEventListener('DOMContentLoaded', () => {
    console.log("=== APP INITIALIZATION START ===");

    initPad('en');
    initPad('de');

    // Secret Picker
    const sp = document.getElementById('secret-picker');
    if (sp) {
        SECRETS.forEach(s => {
            const b = document.createElement('button');
            b.className = 'secret-opt'; b.innerText = s;
            b.onclick = () => {
                document.querySelectorAll('.secret-opt').forEach(btn => btn.classList.remove('selected'));
                b.classList.add('selected');
                state.secret = s;
            };
            if (s === '👻') b.classList.add('selected');
            sp.appendChild(b);
        });
    }

    // Intent Picker
    const picker = document.getElementById('intent-picker');
    if (picker) {
        EMOJIS.forEach(e => {
            const b = document.createElement('button');
            b.innerText = e;
            b.style.fontSize = "1rem"; b.style.padding = "5px";
            b.onclick = () => {
                // Toggle Logic
                const idx = state.intent.indexOf(e);
                if (idx > -1) {
                    // Remove if already selected (prevent empty list though)
                    if (state.intent.length > 1) state.intent.splice(idx, 1);
                } else {
                    // Add if limit not reached
                    if (state.intent.length < 5) state.intent.push(e);
                }

                // Update UI Visuals
                document.querySelectorAll('#intent-picker button').forEach(btn => {
                    btn.classList.toggle('selected', state.intent.includes(btn.innerText));
                });

                // Update State & Badge
                const intentName = state.intent.map(i => Object.keys(INTENT_MAP).find(key => INTENT_MAP[key] === i) || 'E').join('');
                morseSeq = getMorseSeq(intentName);
                document.getElementById('badge-int').innerText = state.intent.join('');
            };
            if (state.intent.includes(e)) b.classList.add('selected');
            picker.appendChild(b);
        });
    }

    // Event Listeners
    console.log("Initializing Event Listeners...");

    document.querySelectorAll('.emo-btn').forEach(b => {
        b.onclick = () => {
            document.querySelectorAll('.emo-btn').forEach(btn => btn.classList.remove('selected'));
            b.classList.add('selected');
            state.emo = b.dataset.emo;
            const badge = document.getElementById('badge-emo');
            if (badge) badge.innerText = b.dataset.emo;
            audioSys.update();
        }
    });

    const intensitySlider = document.getElementById('intensity');
    if (intensitySlider) {
        intensitySlider.oninput = (e) => {
            state.int = e.target.value;
            audioSys.update();
        };
    }

    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
        btnSound.onclick = (e) => {
            const on = audioSys.toggle();
            e.target.innerText = on ? '🔊' : '🔇';
            e.target.style.borderColor = on ? 'var(--accent)' : '#333';
        };
    }

    const gotoEnc = document.getElementById('goto-encrypt');
    if (gotoEnc) {
        gotoEnc.onclick = () => switchView('encrypt');
        console.log("✓ Goto Encrypt button wired");
    }

    const doEnc = document.getElementById('do-encrypt');
    if (doEnc) {
        console.log("✓ Found encrypt button:", doEnc);

        doEnc.onclick = (e) => {
            e.preventDefault();
            console.log("🔒 ENCRYPT BUTTON CLICKED!");
            handleEnc();
        };

        console.log("✓ Encrypt button event listener attached");
    } else {
        console.error("✗ Encrypt button NOT FOUND");
    }

    const doDec = document.getElementById('do-decrypt');
    if (doDec) {
        doDec.onclick = handleDec;
        console.log("✓ Decrypt button wired");
    }

    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const link = document.getElementById('final-link');
            link.select(); link.setSelectionRange(0, 99999);
            document.execCommand('copy');
            const t = document.getElementById('copy-toast');
            if (t) {
                t.style.display = 'block';
                setTimeout(() => t.style.display = 'none', 2000);
            }
        };
        console.log("✓ Copy button wired");
    }

    // Start Logic
    runAnim('preview-canvas');
    if (window.location.hash) switchView('decrypt');

    console.log("=== APP INITIALIZATION COMPLETE ===");
});