/**
 * SilentSpeak v2.0 - Secure Visual Messaging
 */

const PALETTES = {
    neon: ['#FF00FF', '#00FFFF', '#FFFF00'],
    pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF'],
    monochrome: ['#FFFFFF', '#999999', '#333333'],
    warm: ['#FF4500', '#FFD700', '#B22222']
};

const INTENT_MAP = { MEET: '🤝', OK: '👌', HELP: '🆘', SAFE: '🏠', WAIT: '⏳', CALL: '📞' };

let appState = {
    emotion: 'serenity',
    intensity: 50,
    palette: 'neon',
    intent: null,
    seed: Math.random(),
    animationFrameId: null
};

/* --- INITIALIZATION --- */

window.addEventListener('load', () => {
    initUI();
    if (window.location.hash.length > 1) {
        switchView('decrypt');
    } else {
        switchView('create');
        initCreator();
    }
});

function initUI() {
    // Modal Logic
    document.getElementById('btn-open-key').onclick = () => document.getElementById('modal-key').classList.remove('hidden');
    document.getElementById('btn-close-key').onclick = () => document.getElementById('modal-key').classList.add('hidden');
    
    // Toggle Password
    document.querySelectorAll('.toggle-pass').forEach(btn => {
        btn.onclick = (e) => {
            const input = e.target.previousElementSibling;
            input.type = input.type === 'password' ? 'text' : 'password';
        };
    });
}

function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    setTimeout(() => {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const next = document.getElementById('view-' + name);
        next.classList.remove('hidden');
        void next.offsetWidth;
        next.classList.add('active');
    }, 300);
}

/* --- CREATOR --- */

function initCreator() {
    const canvas = document.getElementById('preview-canvas');
    setupCanvas(canvas);
    startAnimation(canvas);

    // Emotion Selection
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            appState.emotion = btn.dataset.emotion;
        };
    });

    // Intent Selection
    document.querySelectorAll('.intent-btn').forEach(btn => {
        btn.onclick = () => {
            const isSelected = btn.classList.contains('selected');
            document.querySelectorAll('.intent-btn').forEach(b => b.classList.remove('selected'));
            if(!isSelected) {
                btn.classList.add('selected');
                appState.intent = btn.dataset.intent;
            } else {
                appState.intent = null;
            }
        };
    });

    document.getElementById('intensity').oninput = (e) => {
        appState.intensity = e.target.value;
        document.getElementById('intensity-val').innerText = e.target.value + '%';
    };

    document.getElementById('palette').onchange = (e) => appState.palette = e.target.value;
    document.getElementById('btn-randomize').onclick = () => appState.seed = Math.random();
    document.getElementById('btn-goto-encrypt').onclick = () => switchView('encrypt');
    document.getElementById('btn-back-create').onclick = () => switchView('create');
}

/* --- VISUAL ENGINE (The "Cipher" inside the animation) --- */

function setupCanvas(canvas) {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

function startAnimation(canvas) {
    if(appState.animationFrameId) cancelAnimationFrame(appState.animationFrameId);
    const ctx = canvas.getContext('2d');
    let time = 0;

    function draw() {
        const { width, height, emotion, intensity, palette, seed, intent } = appState;
        const colors = PALETTES[palette];
        const factor = intensity / 100;

        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0, 0, width, height);

        // Render Intent Micro-Cipher
        if (intent) {
            ctx.strokeStyle = colors[0];
            ctx.lineWidth = 2;
            const size = 15;
            // Deterministic mark in corner based on intent name length
            const markCount = Object.keys(INTENT_MAP).indexOf(intent) + 1;
            for(let i=0; i<markCount; i++) {
                ctx.strokeRect(10 + (i*8), height - 20, 4, 4);
            }
        }

        // Render Particles
        const count = 5 + Math.floor(factor * 20);
        for (let i = 0; i < count; i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            let x, y;
            const off = i * seed * 10;

            if (emotion === 'joy') {
                x = width/2 + Math.cos(time * 3 + off) * (width/3 * factor);
                y = height/2 + Math.sin(time * 2 + off) * (height/3);
                ctx.arc(x, y, 5 + Math.sin(time*5)*3, 0, Math.PI*2);
            } else if (emotion === 'rage') {
                x = width/2 + (Math.random()-0.5) * width * factor;
                y = height/2 + (Math.random()-0.5) * height * factor;
                ctx.rect(x, y, 10, 10);
            } else if (emotion === 'grief') {
                x = (Math.sin(off) * 0.5 + 0.5) * width;
                y = (time * 40 + off) % height;
                ctx.arc(x, y, 15 * (1-factor*0.5), 0, Math.PI*2);
            } else { // Serenity
                x = width/2 + Math.sin(time + off) * (width/4);
                y = height/2 + Math.cos(time * 0.5 + off) * (height/4);
                ctx.arc(x, y, 20 + Math.sin(time)*10, 0, Math.PI*2);
            }
            ctx.fill();
        }
        time += 0.02 + (factor * 0.05);
        appState.animationFrameId = requestAnimationFrame(draw);
    }
    draw();
}

/* --- ENCRYPTION (CRITICAL: UNCHANGED) --- */

document.getElementById('btn-encrypt').onclick = async () => {
    const pass = document.getElementById('encrypt-pass').value;
    if(!pass) return showToast("Passphrase required", "error");
    
    document.getElementById('btn-encrypt').classList.add('loading');
    
    const msg = JSON.stringify({
        emotion: appState.emotion,
        intensity: appState.intensity,
        palette: appState.palette,
        intent: appState.intent,
        seed: appState.seed
    });

    try {
        const encrypted = await encryptMessage(msg, pass);
        const hash = btoa(JSON.stringify(encrypted));
        document.getElementById('share-link').value = window.location.origin + window.location.pathname + '#' + hash;
        document.getElementById('share-result').classList.remove('hidden');
    } catch(e) { showToast("Encryption failed"); }
    document.getElementById('btn-encrypt').classList.remove('loading');
};

/* --- DECRYPTION & INTERPRETATION --- */

document.getElementById('btn-decrypt').onclick = async () => {
    const pass = document.getElementById('decrypt-pass').value;
    const hash = window.location.hash.substring(1);
    
    try {
        const decrypted = await decryptMessage(JSON.parse(atob(hash)), pass);
        const data = JSON.parse(decrypted);
        appState = { ...appState, ...data };
        
        document.getElementById('decrypt-input-area').classList.add('hidden');
        document.getElementById('decrypt-display-area').classList.remove('hidden');
        
        const canvas = document.getElementById('view-canvas');
        setupCanvas(canvas);
        startAnimation(canvas);
        renderMeaningSummary(hash);
    } catch(e) { showToast("Invalid Passphrase", "error"); }
};

function renderMeaningSummary(messageId) {
    const icons = { serenity: '🌊', joy: '✨', rage: '🔥', grief: '🌑' };
    document.getElementById('res-emotion').innerText = icons[appState.emotion];
    document.getElementById('res-intensity-bar').style.width = appState.intensity + '%';
    document.getElementById('res-intent').innerText = INTENT_MAP[appState.intent] || '∅';

    // Derived Hints
    const hints = document.getElementById('res-mood-hints');
    hints.innerHTML = '';
    const moodIcons = appState.intensity > 70 ? ['⚡', '🔊'] : ['☁️', '💤'];
    moodIcons.forEach(i => hints.innerHTML += `<span>${i}</span>`);

    // Load saved interpretation
    const saved = localStorage.getItem('interpret_' + messageId.substring(0,10));
    document.querySelectorAll('.emoji-feedback button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.emoji === saved);
        btn.onclick = () => {
            localStorage.setItem('interpret_' + messageId.substring(0,10), btn.dataset.emoji);
            renderMeaningSummary(messageId);
            showToast("Interpretation saved locally");
        };
    });
}

/* --- HELPERS & CRYPTO (AES-GCM/PBKDF2) --- */

function showToast(m) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div'); t.className = 'toast'; t.innerText = m;
    c.appendChild(t); setTimeout(() => t.remove(), 3000);
}

// CRYPTO FUNCTIONS (SAME AS PREVIOUS)
async function encryptMessage(text, password) {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    const key = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 500000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
    const cipher = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));
    return { cipher: b64(cipher), salt: b64(salt), iv: b64(iv), iter: 500000 };
}

async function decryptMessage(data, password) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    const key = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt: db64(data.salt), iterations: data.iter, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const dec = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: db64(data.iv) }, key, db64(data.cipher));
    return new TextDecoder().decode(dec);
}

function b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function db64(str) { return new Uint8Array(atob(str).split("").map(c => c.charCodeAt(0))).buffer; }

document.getElementById('btn-copy').onclick = () => {
    document.getElementById('share-link').select();
    document.execCommand('copy');
    showToast("Link copied!");
};
document.getElementById('btn-home').onclick = () => location.hash = '';