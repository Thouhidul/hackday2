const PALETTES = {
    serenity: ['#00FFFF', '#0080FF', '#7FFFD4'],
    joy: ['#FFD700', '#FF69B4', '#FF00FF'],
    rage: ['#FF4500', '#FF0000', '#8B0000'],
    grief: ['#4B0082', '#000000', '#2F4F4F']
};

const INTENT_MAP = { MEET: '🤝', OK: '👌', HELP: '🆘', SAFE: '🏠', WAIT: '⏳', CALL: '📞', FOOD: '🍕', SLEEP: '😴' };

let appState = {
    emotion: 'serenity', intensity: 50, intent: 'MEET', seed: Math.random()
};

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
    document.getElementById('btn-open-key').onclick = () => document.getElementById('modal-key').style.display = 'block';
    
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
    document.getElementById('btn-encrypt').onclick = handleEncryption;
    document.getElementById('btn-decrypt').onclick = handleDecryption;
    document.getElementById('btn-copy').onclick = () => {
        document.getElementById('share-link').select();
        document.execCommand('copy');
        showToast("Link Copied!");
    };
}

function switchView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
}

/* --- PHYSICS ENGINE: THE EMOTION LOGIC --- */
function startAnimation(canvas) {
    const ctx = canvas.getContext('2d');
    let t = 0;

    const draw = () => {
        if (!canvas.width) return requestAnimationFrame(draw);
        
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const colors = PALETTES[appState.emotion];
        const factor = appState.intensity / 100;
        const count = 6 + Math.floor(factor * 15);

        // Intent Marks
        ctx.fillStyle = colors[0];
        const idx = Object.keys(INTENT_MAP).indexOf(appState.intent) + 1;
        for(let j=0; j<idx; j++) ctx.fillRect(15 + (j*8), canvas.height - 20, 5, 5);

        for (let i = 0; i < count; i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            let x, y, size = 6;

            if (appState.emotion === 'serenity') {
                x = canvas.width/2 + Math.sin(t + i) * (canvas.width/3);
                y = canvas.height/2 + Math.cos(t * 0.3 + i) * (canvas.height/4);
                ctx.arc(x, y, 10 * factor + 5, 0, Math.PI*2);
            } 
            else if (appState.emotion === 'joy') {
                x = canvas.width/2 + Math.cos(t * 2 + i) * (80 * factor + i*10);
                y = canvas.height/2 + Math.sin(t * 2 + i) * (80 * factor + i*10);
                ctx.arc(x, y, 8, 0, Math.PI*2);
            } 
            else if (appState.emotion === 'rage') {
                x = canvas.width/2 + (Math.random()-0.5) * canvas.width * factor;
                y = canvas.height/2 + (Math.random()-0.5) * canvas.height * factor;
                ctx.moveTo(x, y);
                ctx.lineTo(x+15, y+15);
                ctx.lineTo(x-15, y+15);
                ctx.closePath();
            } 
            else if (appState.emotion === 'grief') {
                x = (canvas.width / count) * i + Math.sin(t + i)*10;
                y = (t * 100 + i * 50) % canvas.height;
                ctx.arc(x, y, 12 * (1-factor*0.5), 0, Math.PI*2);
            }
            ctx.fill();
        }
        t += 0.01 + (factor * 0.04);
        requestAnimationFrame(draw);
    };
    draw();
}

/* --- ENCRYPTION but with LOGIC --- */
async function handleEncryption() {
    const pass = document.getElementById('encrypt-pass').value;
    if(!pass) return showToast("Enter a passphrase!");

    const msg = JSON.stringify({ e: appState.emotion, i: appState.intensity, in: appState.intent, s: appState.seed });

    try {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const keyMat = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey({name:"PBKDF2", salt, iterations:100000, hash:"SHA-256"}, keyMat, {name:"AES-GCM", length:256}, false, ["encrypt"]);
        const cipher = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, enc.encode(msg));
        
        const pkg = { c: b64(cipher), s: b64(salt), v: b64(iv) };
        document.getElementById('share-link').value = window.location.origin + window.location.pathname + "#" + btoa(JSON.stringify(pkg));
        document.getElementById('share-result').classList.remove('hidden');
    } catch(e) { showToast("Error creating link"); }
}

async function handleDecryption() {
    const pass = document.getElementById('decrypt-pass').value;
    const hash = window.location.hash.substring(1);
    try {
        const data = JSON.parse(atob(hash));
        const enc = new TextEncoder();
        const keyMat = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey({name:"PBKDF2", salt:db64(data.s), iterations:100000, hash:"SHA-256"}, keyMat, {name:"AES-GCM", length:256}, false, ["decrypt"]);
        const dec = await crypto.subtle.decrypt({name:"AES-GCM", iv:db64(data.v)}, key, db64(data.c));
        const res = JSON.parse(new TextDecoder().decode(dec));

        appState = { emotion: res.e, intensity: res.i, intent: res.in, seed: res.s };
        document.getElementById('decrypt-input-area').classList.add('hidden');
        document.getElementById('decrypt-display-area').classList.remove('hidden');
        document.getElementById('res-emotion').innerText = res.e === 'serenity' ? '🌊' : (res.e === 'joy' ? '✨' : (res.e === 'rage' ? '🔥' : '🌑'));
        document.getElementById('res-intent').innerText = INTENT_MAP[res.in];
        startAnimation(document.getElementById('view-canvas'));
    } catch(e) { showToast("Wrong Passphrase!"); }
}

function b64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function db64(str) { return new Uint8Array(atob(str).split("").map(c => c.charCodeAt(0))).buffer; }
function showToast(m) {
    const t = document.createElement('div');
    t.style = "background: #333; color: var(--accent); padding: 10px 20px; border-radius: 20px; border: 1px solid #444; margin-top: 10px;";
    t.innerText = m;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 2500);
}