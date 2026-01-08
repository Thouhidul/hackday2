const PALETTES = {
    neon: ['#FF00FF', '#00FFFF', '#FFFF00'],
    joy: ['#FFD700', '#FF69B4', '#00FF7F'],
    rage: ['#FF4500', '#8B0000', '#FF0000'],
    grief: ['#483D8B', '#2F4F4F', '#000000']
};

const INTENT_MAP = { MEET: '🤝', OK: '👌', HELP: '🆘', SAFE: '🏠', WAIT: '⏳', CALL: '📞', FOOD: '🍕', SLEEP: '😴' };

let appState = {
    emotion: 'serenity', intensity: 50, palette: 'neon', intent: 'MEET', seed: Math.random()
};

/* --- INITIALIZATION --- */
window.addEventListener('load', () => {
    const obs = new ResizeObserver(entries => {
        for (let e of entries) {
            e.target.width = e.target.clientWidth;
            e.target.height = e.target.clientHeight;
        }
    });
    obs.observe(document.getElementById('preview-canvas'));
    obs.observe(document.getElementById('view-canvas'));

    initUI();
    if (window.location.hash) {
        switchView('decrypt');
    } else {
        switchView('create');
        startAnimation(document.getElementById('preview-canvas'));
    }
});

function initUI() {
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            appState.emotion = btn.dataset.emotion;
            appState.palette = btn.dataset.emotion === 'serenity' ? 'neon' : btn.dataset.emotion;
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
    document.getElementById('btn-encrypt').onclick = handleEncryption;
    document.getElementById('btn-decrypt').onclick = handleDecryption;
    document.getElementById('btn-copy').onclick = () => {
        const link = document.getElementById('share-link');
        link.select();
        document.execCommand('copy');
        showToast("Link Copied!");
    };
}

function switchView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
}

/* --- VISUAL ENGINE --- */
function startAnimation(canvas) {
    const ctx = canvas.getContext('2d');
    let t = 0;

    const draw = () => {
        if (!canvas.width) return requestAnimationFrame(draw);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width,canvas.height);

        const colors = PALETTES[appState.palette] || PALETTES.neon;
        const factor = appState.intensity / 100;

        // Intent Signature (Bottom Left)
        ctx.fillStyle = colors[0];
        const intentIdx = Object.keys(INTENT_MAP).indexOf(appState.intent) + 1;
        for(let j=0; j<intentIdx; j++) {
            ctx.fillRect(10 + (j*8), canvas.height - 15, 4, 4);
        }

        // Abstract Particles
        for (let i=0; i< (5 + factor*20); i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            let x = canvas.width/2 + Math.sin(t + i * appState.seed) * (100 * factor);
            let y = canvas.height/2 + Math.cos(t * 0.5 + i) * 80;
            ctx.arc(x, y, 5 + Math.sin(t)*3, 0, Math.PI*2);
            ctx.fill();
        }
        t += 0.02;
        requestAnimationFrame(draw);
    };
    draw();
}

/* --- CRYPTO ENGINE --- */
async function handleEncryption() {
    const pass = document.getElementById('encrypt-pass').value;
    if(!pass) return showToast("Enter a passphrase!");

    const msg = JSON.stringify({
        e: appState.emotion,
        i: appState.intensity,
        in: appState.intent,
        s: appState.seed
    });

    try {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        
        const keyMat = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey(
            {name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256"},
            keyMat, {name: "AES-GCM", length: 256}, false, ["encrypt"]
        );

        const cipher = await crypto.subtle.encrypt({name: "AES-GCM", iv}, key, enc.encode(msg));
        
        const package = {
            c: b64(cipher),
            s: b64(salt),
            v: b64(iv)
        };

        const link = window.location.origin + window.location.pathname + "#" + btoa(JSON.stringify(package));
        document.getElementById('share-link').value = link;
        document.getElementById('share-result').classList.remove('hidden');
        showToast("Encrypted Successfully!");
    } catch(e) {
        showToast("Encryption Failed");
    }
}

async function handleDecryption() {
    const pass = document.getElementById('decrypt-pass').value;
    const hash = window.location.hash.substring(1);
    
    try {
        const data = JSON.parse(atob(hash));
        const enc = new TextEncoder();
        
        const keyMat = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey(
            {name: "PBKDF2", salt: db64(data.s), iterations: 100000, hash: "SHA-256"},
            keyMat, {name: "AES-GCM", length: 256}, false, ["decrypt"]
        );

        const dec = await crypto.subtle.decrypt({name: "AES-GCM", iv: db64(data.v)}, key, db64(data.c));
        const result = JSON.parse(new TextDecoder().decode(dec));

        appState = { emotion: result.e, intensity: result.i, intent: result.in, seed: result.s, palette: result.e === 'serenity' ? 'neon' : result.e };
        
        document.getElementById('decrypt-input-area').classList.add('hidden');
        document.getElementById('decrypt-display-area').classList.remove('hidden');
        document.getElementById('res-emotion').innerText = result.e.toUpperCase();
        document.getElementById('res-intent').innerText = INTENT_MAP[result.in];
        
        startAnimation(document.getElementById('view-canvas'));
    } catch(e) {
        showToast("Wrong Passphrase!");
    }
}

function b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function db64(str) { return new Uint8Array(atob(str).split("").map(c => c.charCodeAt(0))).buffer; }

function showToast(m) {
    const t = document.createElement('div');
    t.style = "background: #333; color: #fff; padding: 10px 20px; border-radius: 20px; margin-top: 10px; border: 1px solid var(--accent);";
    t.innerText = m;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 3000);
}