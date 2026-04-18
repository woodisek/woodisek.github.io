import { copyToClipboard } from '../clipboard.js';
import { showNotification } from '../notify.js';
import { getStorage } from '../storage.js';

const storage = getStorage('metronome');

const noteTypes = [
    { name: "Akcent", freq: 880, volume: 0.7, color: "#e74c3c", icon: "🔴" },
    { name: "Normální", freq: 660, volume: 0.4, color: "#3498db", icon: "🔵" },
    { name: "Ztlumeno", freq: 0, volume: 0, color: "#7f8c8d", icon: "⚪" }
];

const soundBanks = [
    { name: "🎵 Styl 1", click: 0, normal: 0, sub: 0, isCustom: true, folder: "vlastni1" },
    { name: "🎵 Styl 2", click: 0, normal: 0, sub: 0, isCustom: true, folder: "vlastni2" },
    { name: "🎵 Styl 3", click: 0, normal: 0, sub: 0, isCustom: true, folder: "vlastni3" },
    { name: "🎵 Styl 4", click: 0, normal: 0, sub: 0, isCustom: true, folder: "vlastni4" },  // ← PŘIDAT
    { name: "🎵 Styl 5", click: 0, normal: 0, sub: 0, isCustom: true, folder: "vlastni5" },  // ← PŘIDAT
    { name: "🎵 Styl 6", click: 0, normal: 0, sub: 0, isCustom: true, folder: "vlastni6" },  // ← PŘIDAT
    { name: "🎵 Styl 7", click: 0, normal: 0, sub: 0, isCustom: true, folder: "vlastni7" },  // ← PŘIDAT
    { name: "🎵 Styl 8", click: 0, normal: 0, sub: 0, isCustom: true, folder: "vlastni8" },  // ← PŘIDAT
    { name: "🎵 Styl 9", click: 880, normal: 660, sub: 440, isCustom: false },
    { name: "🎵 Styl 10", click: 1200, normal: 800, sub: 400, isCustom: false },
    { name: "🎵 Styl 11", click: 550, normal: 440, sub: 330, isCustom: false },
    { name: "🎵 Styl 12", click: 1600, normal: 1100, sub: 700, isCustom: false }
];

let customSounds = {
    click: null,
    normal: null,
    sub: null
};

export default function render(container) {
    container.innerHTML = `
        <div class="metronome">
            <div class="mt-header">
                <span class="mt-icon">🕰️</span>
                <div>
                    <h3>Metronom</h3>
                    <p>Udržuj tempo a trénuj rytmy</p>
                </div>
            </div>

            <div class="mt-bpm-row">
                <div class="mt-bpm-display">
                    <span class="mt-bpm-value" id="mt-bpm-value">120</span>
                    <span class="mt-bpm-label">BPM</span>
                </div>
            </div>

            <div class="mt-section">
                <label class="mt-label">🎵 Tempo (BPM)</label>
                <div class="mt-bpm-control">
                    <button id="mt-bpm-minus" class="mt-bpm-btn">−</button>
                    <input type="range" id="mt-bpm-slider" class="mt-slider" min="40" max="240" value="120" step="1">
                    <button id="mt-bpm-plus" class="mt-bpm-btn">+</button>
                </div>
            </div>

            <div class="mt-section mt-trainer-box">
                <label class="mt-label mt-checkbox-label" style="margin-bottom: 0;">
                    <input type="checkbox" id="mt-trainer-active"> 🚀 Speed Trainer (Automatické zrychlování)
                </label>
                <div id="mt-trainer-settings" class="mt-trainer-settings" style="display: none; margin-top: 10px;">
                    <div class="mt-trainer-flex">
                        <span>Zvýšit o</span>
                        <input type="number" id="mt-trainer-bpm" class="mt-input-small" value="5" min="1" max="50">
                        <span>BPM každých</span>
                        <input type="number" id="mt-trainer-bars" class="mt-input-small" value="4" min="1" max="100">
                        <span>taktů.</span>
                    </div>
                </div>
            </div>

            <div class="mt-section mt-grid-3">
                <div>
                    <label class="mt-label">📊 Takt</label>
                    <div style="display: flex; gap: 5px;">
                        <select id="mt-time-preset" class="mt-select-full">
                            <option value="2">2/4</option>
                            <option value="3">3/4</option>
                            <option value="4" selected>4/4</option>
                            <option value="5">5/4</option>
                            <option value="6">6/8</option>
                            <option value="7">7/8</option>
                            <option value="custom">Vlastní...</option>
                        </select>
                        <input type="number" id="mt-beats-custom" class="mt-input-small" min="1" max="16" value="4" style="display: none; width: 50px;">
                    </div>
                </div>
                <div>
                    <label class="mt-label">🔪 Dělení</label>
                    <select id="mt-subdivision" class="mt-select-full">
                        <optgroup label="Základní">
                            <option value="1">Čtvrtky (1)</option>
                            <option value="2">Osminy (2)</option>
                            <option value="4">Šestnáctiny (4)</option>
                        </optgroup>
                        <optgroup label="Trioly">
                            <option value="3">Trioly (3)</option>
                            <option value="6">Šestnáctinové trioly (6)</option>
                            <option value="12">Dvanáctiny (12)</option>
                        </optgroup>
                        <optgroup label="Rychlé">
                            <option value="8">Dvaatřicetiny (8)</option>
                            <option value="16">Šedesátičtyřky (16)</option>
                        </optgroup>
                        <optgroup label="Speciální">
                            <option value="5">Kvintoly (5)</option>
                            <option value="7">Septoly (7)</option>
                            <option value="9">Nonoly (9)</option>
                        </optgroup>
                    </select>
                </div>

                <div>
                    <label class="mt-label">🔊 Zvuk</label>
                    <select id="mt-sound-bank" class="mt-select-full">
                        ${soundBanks.map((bank, i) => `<option value="${i}">${bank.name}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="mt-section">
                <label class="mt-label">🎛️ Vizuál a Akcenty (Klikni na tečku pro změnu)</label>
                <div class="mt-visual">
                    <div class="mt-counter">
                        <div class="mt-counter-value" id="mt-counter-value">1</div>
                        <div class="mt-counter-label">Aktuální doba</div>
                    </div>
                    <div class="mt-pendulum" id="mt-pendulum">
                        <div class="mt-pendulum-pivot"></div>
                        <div class="mt-pendulum-arm" id="mt-pendulum-arm">
                            <div class="mt-pendulum-weight" id="mt-pendulum-weight"></div>
                        </div>
                    </div>
                    <div class="mt-light" id="mt-light"></div>
                    <div class="mt-beat-indicator" id="mt-beat-indicator"></div>
                </div>
            </div>

            <div class="mt-controls">
                <button id="mt-start" class="mt-btn mt-btn-primary">▶ Start</button>
                <button id="mt-stop" class="mt-btn mt-btn-secondary" disabled>⏹ Stop</button>
                <button id="mt-tap" class="mt-btn mt-btn-secondary">👆 Tap tempo</button>
                <button id="mt-reset" class="mt-btn mt-btn-secondary">🔄 Reset</button>
            </div>

            <div class="mt-section">
                <label class="mt-label">🔊 Hlasitost</label>
                <div class="mt-volume-control">
                    <span></span>
                    <input type="range" id="mt-volume" class="mt-slider" min="0" max="100" value="70">
                </div>
            </div>

            <!-- 3 POSUVNÍKY PRO VŠECHNY BANKY (vždy viditelné) -->
            <div class="mt-section">
                <div class="mt-volume-grid">
                    <div class="mt-volume-item">
                        <span>🔴</span>
                        <input type="range" id="mt-vol-click" class="mt-slider-small" min="0" max="100" value="100">
                        <span id="mt-vol-click-val" class="mt-volume-percent">100%</span>
                    </div>
                    <div class="mt-volume-item">
                        <span>🔵</span>
                        <input type="range" id="mt-vol-normal" class="mt-slider-small" min="0" max="100" value="70">
                        <span id="mt-vol-normal-val" class="mt-volume-percent">70%</span>
                    </div>
                    <div class="mt-volume-item">
                        <span>⚪</span>
                        <input type="range" id="mt-vol-sub" class="mt-slider-small" min="0" max="100" value="30">
                        <span id="mt-vol-sub-val" class="mt-volume-percent">30%</span>
                    </div>
                </div>
            </div>

            <div class="mt-section">
                <label class="mt-label">💾 Uložit nastavení</label>
                <div class="mt-preset-control">
                    <input type="text" id="mt-preset-name" class="mt-input" placeholder="Název presetu">
                    <button id="mt-save-preset" class="mt-btn mt-btn-secondary">Uložit</button>
                </div>
                <div id="mt-presets-list" class="mt-presets-list"></div>
            </div>
        </div>
    `;

    const bpmValueSpan = document.getElementById('mt-bpm-value');
    const bpmSlider = document.getElementById('mt-bpm-slider');
    const bpmMinus = document.getElementById('mt-bpm-minus');
    const bpmPlus = document.getElementById('mt-bpm-plus');
    
    const timePresetSelect = document.getElementById('mt-time-preset');
    const beatsCustom = document.getElementById('mt-beats-custom');
    
    const trainerActiveCb = document.getElementById('mt-trainer-active');
    const trainerSettings = document.getElementById('mt-trainer-settings');
    const trainerBpmInput = document.getElementById('mt-trainer-bpm');
    const trainerBarsInput = document.getElementById('mt-trainer-bars');

    const startBtn = document.getElementById('mt-start');
    const stopBtn = document.getElementById('mt-stop');
    const tapBtn = document.getElementById('mt-tap');
    const resetBtn = document.getElementById('mt-reset');
    const volumeSlider = document.getElementById('mt-volume');
    const lightDiv = document.getElementById('mt-light');
    const beatIndicator = document.getElementById('mt-beat-indicator');
    const counterValue = document.getElementById('mt-counter-value');
    const pendulumArm = document.getElementById('mt-pendulum-arm');
    const presetNameInput = document.getElementById('mt-preset-name');
    const savePresetBtn = document.getElementById('mt-save-preset');
    const presetsList = document.getElementById('mt-presets-list');
    const subdivisionSelect = document.getElementById('mt-subdivision');
    const soundBankSelect = document.getElementById('mt-sound-bank');

    let isRunning = false;
    let currentBpm = 120;
    let currentBeats = 4;
    let currentSubdivision = 1;
    let currentBeat = 0;
    let currentSubStep = 0;
    let beatNoteTypes = [];
    let interval = null;
    let audioCtx = null;
    let tapTimes = [];
    let volume = 0.7;
    let currentSoundBank = 0;
    let savedPresets = [];
    let pendulumSwingLeft = true;

    let trainerActive = false;
    let currentBarCount = 0;

    // Načtení WAV souborů podle vybrané vlastní banky
    async function loadCustomSounds() {
        if (!audioCtx) return;
        
        const bank = soundBanks[currentSoundBank];
        if (!bank.isCustom) {
            // Pokud není vlastní banka, smažeme načtené zvuky
            customSounds = { click: null, normal: null, sub: null };
            return;
        }
        
        const sounds = [
            { type: 'click', url: `apps/sounds/metronome/${bank.folder}/click.wav` },
            { type: 'normal', url: `apps/sounds/metronome/${bank.folder}/normal.wav` },
            { type: 'sub', url: `apps/sounds/metronome/${bank.folder}/sub.wav` }
        ];
        
        for (const sound of sounds) {
            try {
                const response = await fetch(sound.url);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    customSounds[sound.type] = audioBuffer;
                } else {
                    customSounds[sound.type] = null;
                }
            } catch (e) {
                customSounds[sound.type] = null;
            }
        }
    }

    function init() {
        loadSettings();
        initBeatNoteTypes();
        renderBeatIndicators();
        setupEventListeners();
    }

    function setupEventListeners() {
        subdivisionSelect.addEventListener('change', (e) => {
            currentSubdivision = parseInt(e.target.value);
            if (isRunning) updateIntervalTiming();
            saveSettings();
        });

        soundBankSelect.addEventListener('change', async (e) => {
            currentSoundBank = parseInt(e.target.value);
            if (audioCtx) {
                await loadCustomSounds();
            }
            saveSettings();
        });

        timePresetSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                beatsCustom.style.display = 'inline-block';
                applyCustomTime(beatsCustom.value);
            } else {
                beatsCustom.style.display = 'none';
                applyCustomTime(e.target.value);
            }
        });

        beatsCustom.addEventListener('change', (e) => applyCustomTime(e.target.value));

        trainerActiveCb.addEventListener('change', (e) => {
            trainerActive = e.target.checked;
            trainerSettings.style.display = trainerActive ? 'block' : 'none';
            currentBarCount = 0;
        });

        resetBtn.addEventListener('click', () => {
            updateBpm(120);
            timePresetSelect.value = "4";
            beatsCustom.style.display = 'none';
            applyCustomTime(4);
            subdivisionSelect.value = 1;
            soundBankSelect.value = 0;
            currentSoundBank = 0;
            trainerActiveCb.checked = false;
            trainerActive = false;
            trainerSettings.style.display = 'none';
            if (isRunning) { stopMetronome(); startMetronome(); }
            saveSettings();
            showNotification('Resetováno na výchozí nastavení', 'success');
        });

        // 3 POSUVNÍKY - ukládání
        const volClick = document.getElementById('mt-vol-click');
        const volNormal = document.getElementById('mt-vol-normal');
        const volSub = document.getElementById('mt-vol-sub');
        
        function saveVolumes() {
            storage.set('volumes', {
                click: parseInt(volClick?.value || 100) / 100,
                normal: parseInt(volNormal?.value || 70) / 100,
                sub: parseInt(volSub?.value || 30) / 100
            });
        }
        
        function updateVolumeDisplay(sliderId, spanId) {
            const slider = document.getElementById(sliderId);
            const span = document.getElementById(spanId);
            if (slider && span) {
                span.textContent = `${slider.value}%`;
            }
        }
        
        if (volClick) {
            volClick.addEventListener('input', (e) => {
                document.getElementById('mt-vol-click-val').textContent = `${e.target.value}%`;
                saveVolumes();
            });
        }
        if (volNormal) {
            volNormal.addEventListener('input', (e) => {
                document.getElementById('mt-vol-normal-val').textContent = `${e.target.value}%`;
                saveVolumes();
            });
        }
        if (volSub) {
            volSub.addEventListener('input', (e) => {
                document.getElementById('mt-vol-sub-val').textContent = `${e.target.value}%`;
                saveVolumes();
            });
        }
        
        function loadVolumes() {
            const vols = storage.get('volumes', { click: 1.0, normal: 0.7, sub: 0.3 });
            if (volClick) volClick.value = vols.click * 100;
            if (volNormal) volNormal.value = vols.normal * 100;
            if (volSub) volSub.value = vols.sub * 100;
            updateVolumeDisplay('mt-vol-click', 'mt-vol-click-val');
            updateVolumeDisplay('mt-vol-normal', 'mt-vol-normal-val');
            updateVolumeDisplay('mt-vol-sub', 'mt-vol-sub-val');
        }
        
        loadVolumes();
    }

    function applyCustomTime(val) {
        let newBeats = parseInt(val) || 4;
        if (newBeats < 1) newBeats = 1;
        if (newBeats > 16) newBeats = 16;
        
        beatsCustom.value = newBeats;
        if (newBeats !== currentBeats) {
            currentBeats = newBeats;
            initBeatNoteTypes();
            renderBeatIndicators();
            if (isRunning) { stopMetronome(); startMetronome(); }
            saveSettings();
        }
    }

    function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        loadCustomSounds();
    }

    function initBeatNoteTypes() {
        beatNoteTypes = Array(currentBeats).fill(1);
        if (beatNoteTypes.length > 0) beatNoteTypes[0] = 0;
    }

    function cycleBeatState(index) {
        beatNoteTypes[index] = (beatNoteTypes[index] + 1) % noteTypes.length;
        renderBeatIndicators();
        saveSettings();
    }

    function renderBeatIndicators() {
        beatIndicator.innerHTML = '';
        for (let i = 0; i < currentBeats; i++) {
            const span = document.createElement('span');
            span.className = 'mt-beat mt-interactive';
            span.innerText = '●';
            span.style.color = noteTypes[beatNoteTypes[i]].color;
            if (i === currentBeat) span.classList.add('active');
            span.addEventListener('click', () => cycleBeatState(i));
            beatIndicator.appendChild(span);
        }
    }

    function updateCounter() {
        counterValue.textContent = (currentBeat + 1).toString();
        counterValue.classList.add('pulse');
        setTimeout(() => counterValue.classList.remove('pulse'), 200);
    }

    function getNoteForBeat(beatIndex) {
        const currentBank = soundBanks[currentSoundBank];
        const noteType = noteTypes[beatNoteTypes[beatIndex]];
        
        if (noteType.name === "Ztlumeno") {
            return null;
        }
        
        if (currentBank.isCustom) {
            return { freq: 440, volume: noteType.volume };
        }
        
        let freq = noteType.freq;
        if (noteType.name === "Akcent") freq = currentBank.click;
        else if (noteType.name === "Normální") freq = currentBank.normal;
        return { freq: freq, volume: noteType.volume };
    }

    function playTick(freq, vol, soundType) {
        if (!audioCtx) return;
        
        const currentBank = soundBanks[currentSoundBank];
        const isCustomBankSelected = currentBank && currentBank.isCustom === true;
        
        // Načti hodnoty ze 3 posuvníků
        const volumes = storage.get('volumes', { click: 1.0, normal: 0.7, sub: 0.3 });
        let individualVol = 1;
        if (soundType === 'click') individualVol = volumes.click;
        else if (soundType === 'normal') individualVol = volumes.normal;
        else if (soundType === 'sub') individualVol = volumes.sub;
        
        let finalVolume = volume * individualVol;
        if (finalVolume <= 0) return;
        
    if (isCustomBankSelected && customSounds[soundType]) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const source = audioCtx.createBufferSource();
        const gainNode = audioCtx.createGain();
        
        source.buffer = customSounds[soundType];
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.value = finalVolume;
        
        source.start();
        
        // 🔥 PŘIDAT: Zastavit zvuk po kratší době (např. 0.1s)
        const duration = 60 / currentBpm / currentSubdivision; // délka jedné poddoby
        const stopTime = Math.min(0.1, duration * 0.8); // max 0.1s nebo 80% intervalu
        source.stop(audioCtx.currentTime + stopTime);
        
        return;
    }
        
        // Pro generované tóny
        finalVolume = finalVolume * vol;
        if (finalVolume <= 0) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = freq;
        gainNode.gain.value = finalVolume;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
        oscillator.stop(audioCtx.currentTime + 0.15);
    }

    function playMetronomeStep() {
        const isMainBeat = (currentSubStep === 0);

        if (isMainBeat) {
            const note = getNoteForBeat(currentBeat);
            if (note && note.freq > 0) {
                let soundType = 'normal';
                if (beatNoteTypes[currentBeat] === 0) soundType = 'click';
                else if (beatNoteTypes[currentBeat] === 1) soundType = 'normal';
                
                playTick(note.freq, note.volume, soundType);
                triggerVisualFlash(beatNoteTypes[currentBeat] === 0);
            }
            
            if (pendulumArm) {
                const duration = 60 / currentBpm; 
                pendulumArm.style.transition = `transform ${duration}s ease-in-out`;
                const angle = pendulumSwingLeft ? 35 : -35;
                pendulumArm.style.transform = `rotate(${angle}deg)`;
                pendulumSwingLeft = !pendulumSwingLeft;
            }

            updateCounter();
            renderBeatIndicators();
            
            if (currentBeat === currentBeats - 1) {
                if (trainerActive) {
                    currentBarCount++;
                    const targetBars = parseInt(trainerBarsInput.value) || 4;
                    if (currentBarCount >= targetBars) {
                        currentBarCount = 0;
                        const bpmStep = parseInt(trainerBpmInput.value) || 5;
                        let newBpm = currentBpm + bpmStep;
                        
                        if (newBpm <= 240) {
                            updateBpm(newBpm);
                            showNotification(`Speed Trainer: Zrychleno na ${newBpm} BPM`, 'info');
                        } else {
                            showNotification(`Dosaženo maximální rychlosti!`, 'warning');
                            trainerActive = false;
                            trainerActiveCb.checked = false;
                            trainerSettings.style.display = 'none';
                        }
                    }
                }
            }

            currentBeat = (currentBeat + 1) % currentBeats;
        } else {
            const isCurrentBeatMuted = beatNoteTypes[currentBeat] === 2;
            
            if (!isCurrentBeatMuted) {
                const bank = soundBanks[currentSoundBank];
                playTick(bank.sub, volume * 0.2, 'sub');
            }
        }

        currentSubStep = (currentSubStep + 1) % currentSubdivision;
    }

    function triggerVisualFlash(isAccent) {
        lightDiv.classList.add('active');
        if (isAccent) lightDiv.classList.add('accent');
        setTimeout(() => lightDiv.classList.remove('active', 'accent'), 80);
    }

    function updateIntervalTiming() {
        if (interval) {
            clearInterval(interval);
            const intervalMs = (60 / currentBpm / currentSubdivision) * 1000;
            interval = setInterval(playMetronomeStep, intervalMs);
        }
    }

    function updateBpm(value) {
        currentBpm = Math.min(240, Math.max(40, parseInt(value) || 40));
        bpmValueSpan.textContent = currentBpm;
        bpmSlider.value = currentBpm;
        
        if (isRunning) {
            updateIntervalTiming();
        }
        saveSettings();
    }

    function startMetronome() {
        if (isRunning) return;
        initAudio();
        
        currentBeat = 0;
        currentSubStep = 0;
        currentBarCount = 0;
        pendulumSwingLeft = true;
        
        playMetronomeStep();
        const intervalMs = (60 / currentBpm / currentSubdivision) * 1000;
        interval = setInterval(playMetronomeStep, intervalMs);
        
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
    }

    function stopMetronome() {
        if (!isRunning) return;
        if (interval) { clearInterval(interval); interval = null; }
        isRunning = false;
        currentBeat = 0;
        currentSubStep = 0;
        
        renderBeatIndicators();
        lightDiv.classList.remove('active');
        counterValue.textContent = '1';
        
        if (pendulumArm) {
            pendulumArm.style.transition = 'transform 0.5s ease-out';
            pendulumArm.style.transform = 'rotate(0deg)';
        }
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }

    function savePreset() {
    const name = presetNameInput.value.trim();
    if (!name) { showNotification('Zadej název presetu', 'warning'); return; }
    
    // Načti aktuální hodnoty posuvníků
    const volClick = document.getElementById('mt-vol-click');
    const volNormal = document.getElementById('mt-vol-normal');
    const volSub = document.getElementById('mt-vol-sub');
    
    const newPreset = {
        id: Date.now(),
        name: name,
        bpm: currentBpm,
        beats: currentBeats,
        subdivision: currentSubdivision,
        soundBank: currentSoundBank,
        beatNoteTypes: [...beatNoteTypes],
        // PŘIDÁNO: uložení hlasitostí
        volumes: {
            click: parseInt(volClick?.value || 100) / 100,
            normal: parseInt(volNormal?.value || 70) / 100,
            sub: parseInt(volSub?.value || 30) / 100
        }
    };
    savedPresets.push(newPreset);
    storage.set('presets', savedPresets);
    presetNameInput.value = '';
    renderPresets();
    showNotification(`Preset "${name}" uložen`, 'success');
}

    function loadPreset(preset) {
    updateBpm(preset.bpm);
    currentSubdivision = preset.subdivision;
    currentSoundBank = preset.soundBank;
    beatNoteTypes = [...preset.beatNoteTypes];
    
    // PŘIDÁNO: načtení hlasitostí z presetu
    if (preset.volumes) {
        const volClick = document.getElementById('mt-vol-click');
        const volNormal = document.getElementById('mt-vol-normal');
        const volSub = document.getElementById('mt-vol-sub');
        const clickValSpan = document.getElementById('mt-vol-click-val');
        const normalValSpan = document.getElementById('mt-vol-normal-val');
        const subValSpan = document.getElementById('mt-vol-sub-val');
        
        if (volClick) {
            volClick.value = preset.volumes.click * 100;
            if (clickValSpan) clickValSpan.textContent = `${preset.volumes.click * 100}%`;
        }
        if (volNormal) {
            volNormal.value = preset.volumes.normal * 100;
            if (normalValSpan) normalValSpan.textContent = `${preset.volumes.normal * 100}%`;
        }
        if (volSub) {
            volSub.value = preset.volumes.sub * 100;
            if (subValSpan) subValSpan.textContent = `${preset.volumes.sub * 100}%`;
        }
        
        // Ulož do storage
        storage.set('volumes', preset.volumes);
    }
    
    subdivisionSelect.value = currentSubdivision;
    soundBankSelect.value = currentSoundBank;
    
    const isStandard = ["2","3","4","5","6","7"].includes(preset.beats.toString());
    if (isStandard) {
        timePresetSelect.value = preset.beats;
        beatsCustom.style.display = 'none';
    } else {
        timePresetSelect.value = 'custom';
        beatsCustom.style.display = 'inline-block';
    }
    applyCustomTime(preset.beats);

    renderBeatIndicators();
    if (isRunning) updateIntervalTiming();
    saveSettings();
    showNotification(`Načten preset: ${preset.name}`, 'success');
}

    function deletePreset(id) {
        savedPresets = savedPresets.filter(p => p.id !== id);
        storage.set('presets', savedPresets);
        renderPresets();
    }

    function renderPresets() {
        if (!presetsList) return;
        if (savedPresets.length === 0) {
            presetsList.innerHTML = '<div class="mt-empty-presets">Žádné uložené presety</div>';
            return;
        }
        presetsList.innerHTML = '';
        savedPresets.forEach(preset => {
            const div = document.createElement('div');
            div.className = 'mt-preset-item';
            div.innerHTML = `
                <div class="mt-preset-info">
                    <strong>${preset.name.replace(/</g, '&lt;')}</strong>
                    <span>${preset.bpm} BPM | ${preset.beats}/4</span>
                </div>
                <div class="mt-preset-actions">
                    <button class="mt-preset-load mt-btn mt-btn-small">Načíst</button>
                    <button class="mt-preset-del mt-btn mt-btn-small">✖</button>
                </div>
            `;
            div.querySelector('.mt-preset-load').addEventListener('click', () => loadPreset(preset));
            div.querySelector('.mt-preset-del').addEventListener('click', () => deletePreset(preset.id));
            presetsList.appendChild(div);
        });
    }

    bpmSlider.addEventListener('input', (e) => updateBpm(e.target.value));
    bpmMinus.addEventListener('click', () => updateBpm(currentBpm - 1));
    bpmPlus.addEventListener('click', () => updateBpm(currentBpm + 1));
    startBtn.addEventListener('click', startMetronome);
    stopBtn.addEventListener('click', stopMetronome);
    volumeSlider.addEventListener('input', (e) => { volume = parseInt(e.target.value) / 100; saveSettings(); });
    savePresetBtn.addEventListener('click', savePreset);

    tapBtn.addEventListener('click', () => {
        const now = Date.now();
        tapTimes.push(now);
        if (tapTimes.length > 5) tapTimes.shift();
        if (tapTimes.length >= 2) {
            let total = 0;
            for (let i = 1; i < tapTimes.length; i++) total += tapTimes[i] - tapTimes[i - 1];
            const avgInterval = total / (tapTimes.length - 1);
            const bpm = Math.round(60000 / avgInterval);
            if (bpm >= 40 && bpm <= 240) updateBpm(bpm);
        }
        setTimeout(() => { if (tapTimes.length && Date.now() - tapTimes[tapTimes.length - 1] > 2000) tapTimes = []; }, 2000);
    });
    
    function saveSettings() {
        storage.set('bpm', currentBpm);
        storage.set('beats', currentBeats);
        storage.set('subdivision', currentSubdivision);
        storage.set('volume', volume);
        storage.set('soundBank', currentSoundBank);
        storage.set('beatNoteTypes', beatNoteTypes);
    }
    
    function loadSettings() {
        currentBpm = storage.get('bpm', 120);
        currentBeats = storage.get('beats', 4);
        currentSubdivision = storage.get('subdivision', 1);
        volume = storage.get('volume', 0.7);
        currentSoundBank = storage.get('soundBank', 0);
        beatNoteTypes = storage.get('beatNoteTypes', []);
        savedPresets = storage.get('presets', []);
        
        bpmSlider.value = currentBpm;
        bpmValueSpan.textContent = currentBpm;
        
        const isStandard = ["2","3","4","5","6","7"].includes(currentBeats.toString());
        if (isStandard) {
            timePresetSelect.value = currentBeats;
            beatsCustom.style.display = 'none';
        } else {
            timePresetSelect.value = 'custom';
            beatsCustom.value = currentBeats;
            beatsCustom.style.display = 'inline-block';
        }
        
        subdivisionSelect.value = currentSubdivision;
        soundBankSelect.value = currentSoundBank;
        volumeSlider.value = volume * 100;
        
        if (beatNoteTypes.length !== currentBeats) initBeatNoteTypes();
        renderBeatIndicators();
        renderPresets();
    }
    
    init();
}

export function cleanup() {
    if (interval) clearInterval(interval);
    if (audioCtx) audioCtx.close();
}