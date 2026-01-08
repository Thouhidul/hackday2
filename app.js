const PALETTES = {
    neon: ['#FF00FF', '#00FFFF', '#FFFF00'],
    warm: ['#FF4500', '#FFD700', '#B22222']
};

const INTENT_MAP = { MEET: '🤝', OK: '👌', HELP: '🆘', SAFE: '🏠', WAIT: '⏳', CALL: '📞', FOOD: '🍕', SLEEP: '😴' };

let appState = {
    emotion: 'serenity', intensity: 50, palette: 'neon', intent: null, seed: Math.random()
};

window.addEventListener('load', () => {
    // Canvas fix for visibility
    const obs = new ResizeObserver(entries => {
        for (let e of entries) {
            e.target.width = e.target.clientWidth;
            e.target.height = e.target.clientHeight;
        }
    });
    obs.observe(document.getElementById('preview-canvas'));
    obs.observe(document.getElementById('view-canvas'));

    initUI();
    startAnimation(document.getElementById('preview-canvas'));
});

function initUI() {
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
}

function switchView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + id).classList.remove('hidden');
}

function startAnimation(canvas) {
    const ctx = canvas.getContext('2d');
    let t = 0;

    const draw = () => {
        if (!canvas.width) return requestAnimationFrame(draw);
        
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width,canvas.height);

        const colors = PALETTES[appState.palette];
        const factor = appState.intensity / 100;

        for (let i=0; i< (5 + factor*20); i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            let x = canvas.width/2 + Math.sin(t + i)*100*factor;
            let y = canvas.height/2 + Math.cos(t*0.5 + i)*80;
            ctx.arc(x, y, 8, 0, Math.PI*2);
            ctx.fill();
        }
        t += 0.02;
        requestAnimationFrame(draw);
    };
    draw();
}