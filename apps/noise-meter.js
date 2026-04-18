import { copyToClipboard } from '../clipboard.js';
import { showNotification } from '../notify.js';
import { getStorage } from '../storage.js';

const storage = getStorage('noise-meter');

export default function render(container) {
    container.innerHTML = `
        <div class="noise-meter">
            <div class="nm-header">
                <span class="nm-icon">🎤</span>
                <div>
                    <h3>Měřič hluku</h3>
                    <p>Měří okolní hluk pomocí mikrofonu</p>
                </div>
            </div>

            <div class="nm-level-display">
                <div class="nm-level-value" id="nm-level-value">0</div>
                <div class="nm-level-unit">dB</div>
            </div>

            <!-- PEAK -->
            <div class="nm-peak">
                🔺 Peak: <span id="nm-peak">0</span> dB
            </div>

            <!-- GRAF -->
            <canvas id="nm-graph" height="80"></canvas>

            <div class="nm-meter">
                <div class="nm-meter-bar" id="nm-meter-bar"></div>
            </div>

            <div class="nm-description" id="nm-description">
                🎤 Klikni na "Spustit měření"
            </div>

            <div class="nm-controls">
                <button id="nm-start" class="nm-btn nm-btn-primary">🎤 Spustit</button>
                <button id="nm-stop" class="nm-btn nm-btn-secondary" disabled>⏹ Stop</button>
            </div>

            <div class="nm-stats">
                <div><b id="nm-min">0</b><br>min</div>
                <div><b id="nm-max">0</b><br>max</div>
                <div><b id="nm-avg">0</b><br>avg</div>
            </div>
        </div>
    `;

    const levelEl = document.getElementById('nm-level-value');
    const peakEl = document.getElementById('nm-peak');
    const bar = document.getElementById('nm-meter-bar');
    const desc = document.getElementById('nm-description');
    const startBtn = document.getElementById('nm-start');
    const stopBtn = document.getElementById('nm-stop');
    const minEl = document.getElementById('nm-min');
    const maxEl = document.getElementById('nm-max');
    const avgEl = document.getElementById('nm-avg');

    const canvas = document.getElementById('nm-graph');
    const ctx = canvas.getContext('2d');

    let audioContext, analyser, source, stream;
    let running = false;
    let animationId;

    let history = [];
    let peak = 0;
    let peakHoldTime = 0;

    function dbApprox(dbFS) {
        // lepší stabilní aproximace (méně agresivní než původní)
        return Math.max(20, Math.min(110, 60 + dbFS * 1.2));
    }

    function drawGraph() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        history.forEach((v, i) => {
            const x = (i / history.length) * canvas.width;
            const y = canvas.height - (v / 120) * canvas.height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function update() {
        if (!running) return;

        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);

        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
        }

        const rms = Math.sqrt(sum / data.length);
        let dbFS = rms > 0.0001 ? 20 * Math.log10(rms) : -100;

        let level = Math.round(dbApprox(dbFS));

        // smoothing
        if (history.length > 0) {
            level = Math.round(history[history.length - 1] * 0.6 + level * 0.4);
        }

        // PEAK HOLD
        if (level > peak) {
            peak = level;
            peakHoldTime = Date.now();
        } else if (Date.now() - peakHoldTime > 2000) {
            peak -= 1;
        }

        // UI
        levelEl.textContent = level;
        peakEl.textContent = peak;

        const percent = (level / 120) * 100;
        bar.style.width = percent + '%';

        if (level < 40) desc.textContent = '🔇 Ticho';
        else if (level < 70) desc.textContent = '💬 Běžný hluk';
        else if (level < 90) desc.textContent = '📢 Hlasité';
        else desc.textContent = '⚠️ Velmi hlučné';

        // historie
        history.push(level);
        if (history.length > 100) history.shift();

        drawGraph();

        // stats
        const min = Math.min(...history);
        const max = Math.max(...history);
        const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);

        minEl.textContent = min;
        maxEl.textContent = max;
        avgEl.textContent = avg;

        animationId = requestAnimationFrame(update);
    }

    async function start() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 1024;

            source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            running = true;
            history = [];
            peak = 0;

            startBtn.disabled = true;
            stopBtn.disabled = false;

            update();
            showNotification('Měření spuštěno', 'success');
        } catch (e) {
            showNotification('Povol mikrofon', 'error');
        }
    }

    function stop() {
        running = false;

        cancelAnimationFrame(animationId);

        if (stream) stream.getTracks().forEach(t => t.stop());
        if (audioContext) audioContext.close();

        startBtn.disabled = false;
        stopBtn.disabled = true;

        levelEl.textContent = '0';
        peakEl.textContent = '0';
        bar.style.width = '0%';
        desc.textContent = '⏹ Zastaveno';
    }

    startBtn.onclick = start;
    stopBtn.onclick = stop;

    window.addEventListener('beforeunload', stop);
}