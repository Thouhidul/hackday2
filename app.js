const PALETTES = {
    neon: ['#FF00FF', '#00FFFF', '#FFFF00'],
    pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF'],
    monochrome: ['#FFFFFF', '#999999', '#333333'],
    warm: ['#FF4500', '#FFD700', '#B22222']
};

const INTENT_MAP = { MEET: '🤝', OK: '👌', HELP: '🆘', SAFE: '🏠', WAIT: '⏳', CALL: '📞', FOOD: '🍕', SLEEP: '😴' };

let appState = {
    emotion: 'serenity', intensity: 50, palette: 'neon', intent: null, seed: Math.random(), animationFrameId: null
};

window.addEventListener('load', () => {
    initUI();
    // THE FIX: Use ResizeObserver to handle canvas sizing regardless of CSS state
    const obs = new ResizeObserver(entries => {
        for (let e of entries) {
            e.target.width = e.target.clientWidth;
            e.target.height = e.target.clientHeight;
        }
    });
    obs.observe(document.getElementById('preview-canvas'));
    obs.observe(document.getElementById('view-canvas'));

    if (window.location.hash) switchView('decrypt');
    else { switchView('create'); startAnimation(document.getElementById('preview-canvas')); }
});

function initUI() {
    document.getElementById('btn-open-key').onclick = () => document.getElementById('modal-key').classList.remove('hidden');
    document.getElementById('btn-close-key').onclick = () => document.getElementById('modal-key').classList.add('hidden');
    
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            appState.emotion = btn.dataset.emotion;
        };
    });

    document.querySelectorAll('.intent-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.intent-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            appState.intent = btn.dataset.intent;
        };
    });

    document.getElementById('intensity').oninput = (e) => {
        appState.intensity = e.target.value;
        document.getElementById('intensity-val').innerText = e.target.value + '%';
    };

    document.getElementById('btn-goto-encrypt').onclick = () => switchView('encrypt');
    document.getElementById('btn-back-create').onclick = () => switchView('create');
}

function switchView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + id).classList.remove('hidden');
}

function startAnimation(canvas) {
    if (appState.animationFrameId) cancelAnimationFrame(appState.animationFrameId);
    const ctx = canvas.getContext('2d');
    let t = 0;

    const draw = () => {
        const { width, height, emotion, intensity, palette, intent, seed } = appState;
        if (!width) return requestAnimationFrame(draw);

        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,width,height);

        const colors = PALETTES[palette];
        const factor = intensity / 100;

        // Intent Marks (Micro-Cipher)
        if (intent) {
            ctx.fillStyle = colors[0];
            const idx = Object.keys(INTENT_MAP).indexOf(intent) + 1;
            for(let i=0; i<idx; i++) ctx.fillRect(10 + (i*8), height - 15, 4, 4);
        }

        // Main Visuals
        for (let i=0; i< (5 + factor*15); i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            let x = width/2 + Math.sin(t + i*seed)*100*factor;
            let y = height/2 + Math.cos(t*0.5 + i)*50;
            ctx.arc(x, y, 10 + Math.sin(t)*5, 0, Math.PI*2);
            ctx.fill();
        }
        t += 0.02;
        appState.animationFrameId = requestAnimationFrame(draw);
    };
    draw();
}

// Minimal Crypto Helpers
async function encryptMessage(text, password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMat = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({name:"PBKDF2", salt, iterations:100000, hash:"SHA-256"}, keyMat, {name:"AES-GCM", length:256}, false, ["encrypt"]);
    const cipher = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, enc.encode(text));
    return { cipher: btoa(String.fromCharCode(...new Uint8Array(cipher))), salt: btoa(String.fromCharCode(...new Uint8Array(salt))), iv: btoa(String.fromCharCode(...new Uint8Array(iv))) };
}

document.getElementById('btn-encrypt').onclick = async () => {
    const pass = document.getElementById('encrypt-pass').value;
    const msg = JSON.stringify({e: appState.emotion, i: appState.intensity, p: appState.palette, in: appState.intent, s: appState.seed});
    const enc = await encryptMessage(msg, pass);
    document.getElementById('share-link').value = window.location.origin + window.location.pathname + "#" + btoa(JSON.stringify(enc));
    document.getElementById('share-result').classList.remove('hidden');
};