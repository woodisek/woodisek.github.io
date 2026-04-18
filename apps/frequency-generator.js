import { showNotification } from '../notify.js';
import { getStorage } from '../storage.js';

const storage = getStorage('frequency-generator');

export default function render(container) {
    container.innerHTML = `
        <div class="frequency-generator">
            <div class="fg-header">
                <span class="fg-icon">🧘‍♀️</span>
                <div>
                    <h3>Frekvenční generátor</h3>
                    <p>Generuj tóny o různých frekvencích</p>
                </div>
            </div>

            <!-- Hlavní ovládání -->
            <div class="fg-section">
                <label class="fg-label">🎵 Frekvence (Hz)</label>
                <div class="fg-frequency-control">
                    <button id="fg-freq-minus" class="fg-freq-btn">−</button>
                    <input type="number" id="fg-frequency" class="fg-frequency-input" value="440" min="20" max="20000" step="1">
                    <button id="fg-freq-plus" class="fg-freq-btn">+</button>
                </div>
                <input type="range" id="fg-frequency-slider" class="fg-slider" min="20" max="2000" value="440" step="1">
                <div class="fg-frequency-presets">
                    <button data-freq="110" class="fg-preset">110 Hz (A2)</button>
                    <button data-freq="220" class="fg-preset">220 Hz (A3)</button>
                    <button data-freq="440" class="fg-preset active">440 Hz (A4)</button>
                    <button data-freq="880" class="fg-preset">880 Hz (A5)</button>
                    <button data-freq="1760" class="fg-preset">1760 Hz (A6)</button>
                </div>
            </div>

            <!-- Průběh vlny -->
            <div class="fg-section">
                <label class="fg-label">📊 Průběh vlny</label>
                <div class="fg-waveforms">
                    <button data-wave="sine" class="fg-wave-btn active">🔊 Sinus</button>
                    <button data-wave="square" class="fg-wave-btn">⬛ Čtvercový</button>
                    <button data-wave="sawtooth" class="fg-wave-btn">📈 Pilový</button>
                    <button data-wave="triangle" class="fg-wave-btn">📐 Trojúhelníkový</button>
                </div>
            </div>

            <!-- Hlasitost hlavního tónu -->
            <div class="fg-section">
                <label class="fg-label">🔊 Hlasitost tónu</label>
                <input type="range" id="fg-volume" class="fg-slider" min="0" max="100" value="50">
                <div class="fg-volume-value" id="fg-volume-value">50%</div>
            </div>

            <!-- HLAVNÍ TLAČÍTKO PŘEHRÁT TÓN (NAD BINAURÁLNÍM) -->
            <div class="fg-main-play">
                <button id="fg-play" class="fg-btn fg-btn-primary">▶ Přehrát</button>
            </div>

            <!-- EFEKTY -->
            <div class="fg-section">
                <label class="fg-label">✨ Efekty</label>
                <div class="fg-effects">
                    <div class="fg-effect">
                        <span>🎧 Panning</span>
                        <input type="range" id="fg-pan" min="-100" max="100" value="0" step="1">
                        <span id="fg-pan-value">Centrum</span>
                    </div>
                    <div class="fg-effect">
                        <span>📈 Tremolo</span>
                        <input type="range" id="fg-tremolo" min="0" max="15" step="0.5" value="0">
                        <span id="fg-tremolo-value">0 Hz</span>
                    </div>
                    <div class="fg-effect">
                        <span>🎻 Vibrato</span>
                        <input type="range" id="fg-vibrato" min="0" max="15" step="0.5" value="0">
                        <span id="fg-vibrato-value">0 Hz</span>
                    </div>
                    <div class="fg-effect">
                        <span>🌀 Phaser</span>
                        <input type="range" id="fg-phaser" min="0" max="100" value="0" step="1">
                        <span id="fg-phaser-value">0%</span>
                    </div>
                    <div class="fg-effect">
                        <span>📢 Reverb</span>
                        <input type="range" id="fg-reverb" min="0" max="100" value="0" step="1">
                        <span id="fg-reverb-value">0%</span>
                    </div>
                    <div class="fg-effect">
                        <span>🔄 Delay</span>
                        <input type="range" id="fg-delay" min="0" max="500" value="0" step="10">
                        <span id="fg-delay-value">0 ms</span>
                    </div>
                    <div class="fg-effect">
                        <span>📉 Distortion</span>
                        <input type="range" id="fg-distortion" min="0" max="100" value="0" step="1">
                        <span id="fg-distortion-value">0%</span>
                    </div>
                    <div class="fg-effect">
                        <span>🎚️ Low-pass</span>
                        <input type="range" id="fg-filter" min="20" max="20000" value="20000" step="10">
                        <span id="fg-filter-value">20 kHz</span>
                    </div>
                </div>
            </div>

            <!-- BINAURÁLNÍ RYTMY -->
            <div class="fg-section binaural-section">
                <label class="fg-label">🧘 Binaurální rytmy</label>
                
                <!-- Vlastní hlasitost pro binaurální -->
                <div class="fg-binaural-volume">
                    <span>🔊 Hlasitost</span>
                    <input type="range" id="fg-binaural-volume" min="0" max="100" value="50" step="1">
                    <span id="fg-binaural-volume-value">50%</span>
                </div>
                
                <!-- Základní frekvence -->
                <div class="fg-binaural-base">
                    <span>Základní tón:</span>
                    <input type="range" id="fg-binaural-base" min="100" max="300" value="200" step="1">
                    <span id="fg-binaural-base-value">200 Hz</span>
                </div>
                
                <!-- Rozdíl -->
                <div class="fg-binaural-diff">
                    <span>Rozdíl (Hz):</span>
                    <input type="range" id="fg-binaural-diff-slider" min="0" max="40" value="10" step="1">
                    <span id="fg-binaural-diff-value">10 Hz</span>
                </div>
                
                <!-- Informace o aktuálním stavu -->
                <div class="fg-binaural-info" id="fg-binaural-info">
                    🧠 Theta (10 Hz) - meditace, kreativita
                </div>
                
                <!-- Tlačítko Přehrát binaurální (přepínací) -->
                <button id="fg-binaural-play" class="fg-btn fg-btn-binaural">▶ Přehrát</button>
            </div>

            <!-- Tlačítko RESET uprostřed dole -->
            <div class="fg-reset-container">
                <button id="fg-reset" class="fg-btn fg-btn-reset">🔄 Reset</button>
            </div>
        </div>
    `;

    // ========== DOM elementy ==========
    const resetBtn = document.getElementById('fg-reset');
    const freqInput = document.getElementById('fg-frequency');
    const freqMinus = document.getElementById('fg-freq-minus');
    const freqPlus = document.getElementById('fg-freq-plus');
    const freqSlider = document.getElementById('fg-frequency-slider');
    const presetBtns = document.querySelectorAll('.fg-preset');
    const volumeSlider = document.getElementById('fg-volume');
    const volumeValue = document.getElementById('fg-volume-value');
    const waveBtns = document.querySelectorAll('.fg-wave-btn');
    const playBtn = document.getElementById('fg-play');
    
    // Efekty
    const panSlider = document.getElementById('fg-pan');
    const panValue = document.getElementById('fg-pan-value');
    const tremoloSlider = document.getElementById('fg-tremolo');
    const tremoloValue = document.getElementById('fg-tremolo-value');
    const vibratoSlider = document.getElementById('fg-vibrato');
    const vibratoValue = document.getElementById('fg-vibrato-value');
    const phaserSlider = document.getElementById('fg-phaser');
    const phaserValue = document.getElementById('fg-phaser-value');
    const reverbSlider = document.getElementById('fg-reverb');
    const reverbValue = document.getElementById('fg-reverb-value');
    const delaySlider = document.getElementById('fg-delay');
    const delayValue = document.getElementById('fg-delay-value');
    const distortionSlider = document.getElementById('fg-distortion');
    const distortionValue = document.getElementById('fg-distortion-value');
    const filterSlider = document.getElementById('fg-filter');
    const filterValue = document.getElementById('fg-filter-value');
    
    // Binaurální
    const binauralVolume = document.getElementById('fg-binaural-volume');
    const binauralVolumeValue = document.getElementById('fg-binaural-volume-value');
    const binauralBase = document.getElementById('fg-binaural-base');
    const binauralBaseValue = document.getElementById('fg-binaural-base-value');
    const binauralDiffSlider = document.getElementById('fg-binaural-diff-slider');
    const binauralDiffValue = document.getElementById('fg-binaural-diff-value');
    const binauralInfo = document.getElementById('fg-binaural-info');
    const binauralPlayBtn = document.getElementById('fg-binaural-play');

    let audioContext = null;
    let oscillator = null;
    let gainNode = null;
    let pannerNode = null;
    let filterNode = null;
    let distortionNode = null;
    let delayNode = null;
    let reverbGain = null;
    
    let leftOscillator = null;
    let rightOscillator = null;
    let leftGain = null;
    let rightGain = null;
    
    let isPlaying = false;
    let isBinaural = false;
    let currentFrequency = 440;
    let currentVolume = 0.5;
    let currentWaveform = 'sine';
    
    // Hodnoty efektů
    let currentPan = 0;
    let currentTremolo = 0;
    let currentVibrato = 0;
    let currentPhaser = 0;
    let currentReverb = 0;
    let currentDelay = 0;
    let currentDistortion = 0;
    let currentFilter = 20000;
    
    // Binaurální hodnoty
    let binauralVolumeValueNum = 0.5;
    let binauralBaseFreq = 200;
    let binauralDiff = 10;
    
    let tremoloInterval = null;
    let vibratoInterval = null;
    let phaserInterval = null;

    function initAudio() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    function updateBinauralInfo() {
        const diff = binauralDiff;
        let state = '';
        if (diff <= 4) state = '😴 Delta (spánek, hluboká relaxace)';
        else if (diff <= 8) state = '🧘 Theta (meditace, kreativita, snění)';
        else if (diff <= 14) state = '🌊 Alfa (relaxace, učení, lehký spánek)';
        else if (diff <= 30) state = '⚡ Beta (soustředění, bdělost, energie)';
        else state = '🌀 Gama (vnímání, vysoké soustředění)';
        
        binauralInfo.innerHTML = `🧠 ${state} (${diff} Hz rozdíl)`;
    }

    function setFrequency(freq) {
        currentFrequency = Math.min(20000, Math.max(20, freq));
        freqInput.value = Math.round(currentFrequency);
        freqSlider.value = currentFrequency;
        
        if (isPlaying && !isBinaural && oscillator) {
            oscillator.frequency.value = currentFrequency;
        }
        
        saveSettings();
    }

    function setVolume(volume) {
        currentVolume = Math.min(1, Math.max(0, volume / 100));
        volumeValue.textContent = `${Math.round(volume)}%`;
        if (gainNode) gainNode.gain.value = currentVolume;
        saveSettings();
    }

    function setBinauralVolume(volume) {
        binauralVolumeValueNum = Math.min(1, Math.max(0, volume / 100));
        binauralVolumeValue.textContent = `${Math.round(volume)}%`;
        if (leftGain) leftGain.gain.value = binauralVolumeValueNum;
        if (rightGain) rightGain.gain.value = binauralVolumeValueNum;
        saveSettings();
    }

    function setPan(pan) {
        currentPan = Math.min(100, Math.max(-100, pan));
        panSlider.value = currentPan;
        if (panValue) {
            if (currentPan === 0) panValue.textContent = 'Centrum';
            else if (currentPan < 0) panValue.textContent = `Levý ${Math.abs(currentPan)}%`;
            else panValue.textContent = `Pravý ${currentPan}%`;
        }
        if (pannerNode) pannerNode.pan.value = currentPan / 100;
        saveSettings();
    }

    function setFilter(freq) {
        currentFilter = Math.min(20000, Math.max(20, freq));
        filterSlider.value = currentFilter;
        if (currentFilter >= 20000) filterValue.textContent = '20 kHz';
        else if (currentFilter >= 1000) filterValue.textContent = `${(currentFilter/1000).toFixed(1)} kHz`;
        else filterValue.textContent = `${currentFilter} Hz`;
        
        if (filterNode) filterNode.frequency.value = currentFilter;
        saveSettings();
    }

    function setDistortion(amount) {
        currentDistortion = Math.min(100, Math.max(0, amount));
        distortionSlider.value = currentDistortion;
        distortionValue.textContent = `${currentDistortion}%`;
        
        if (distortionNode) {
            const curveAmount = currentDistortion / 100;
            const samples = 44100;
            const curve = new Float32Array(samples);
            for (let i = 0; i < samples; ++i) {
                const x = i * 2 / samples - 1;
                curve[i] = (3 + curveAmount * 10) * x * 20 * Math.PI / 180 / (Math.PI + curveAmount * 10 * Math.abs(x));
            }
            distortionNode.curve = curve;
        }
        saveSettings();
    }

    function setDelay(ms) {
        currentDelay = Math.min(500, Math.max(0, ms));
        delaySlider.value = currentDelay;
        delayValue.textContent = `${currentDelay} ms`;
        
        if (delayNode) {
            delayNode.delayTime.value = currentDelay / 1000;
        }
        saveSettings();
    }

    function setReverb(amount) {
        currentReverb = Math.min(100, Math.max(0, amount));
        reverbSlider.value = currentReverb;
        reverbValue.textContent = `${currentReverb}%`;
        
        if (reverbGain) {
            reverbGain.gain.value = currentReverb / 100;
        }
        saveSettings();
    }

    function setPhaser(amount) {
        currentPhaser = Math.min(100, Math.max(0, amount));
        phaserSlider.value = currentPhaser;
        phaserValue.textContent = `${currentPhaser}%`;
        saveSettings();
    }

    function setTremolo(value) {
        currentTremolo = value;
        tremoloSlider.value = currentTremolo;
        tremoloValue.textContent = `${currentTremolo} Hz`;
        if (isPlaying && !isBinaural) applyTremolo();
        saveSettings();
    }

    function setVibrato(value) {
        currentVibrato = value;
        vibratoSlider.value = currentVibrato;
        vibratoValue.textContent = `${currentVibrato} Hz`;
        if (isPlaying && !isBinaural) applyVibrato();
        saveSettings();
    }

    function setBinauralBase(value) {
        binauralBaseFreq = value;
        binauralBase.value = binauralBaseFreq;
        binauralBaseValue.textContent = `${binauralBaseFreq} Hz`;
        saveSettings();
    }

    function setBinauralDiff(value) {
        binauralDiff = value;
        binauralDiffSlider.value = binauralDiff;
        binauralDiffValue.textContent = `${binauralDiff} Hz`;
        updateBinauralInfo();
        saveSettings();
    }

    function applyTremolo() {
        if (tremoloInterval) clearInterval(tremoloInterval);
        if (currentTremolo > 0 && isPlaying && !isBinaural && gainNode) {
            let time = 0;
            tremoloInterval = setInterval(() => {
                if (!isPlaying || isBinaural || !gainNode) return;
                const mod = (Math.sin(time * currentTremolo * Math.PI * 2) + 1) / 2;
                gainNode.gain.value = currentVolume * (0.3 + mod * 0.7);
                time += 0.05;
            }, 50);
        } else if (gainNode && !isBinaural) {
            gainNode.gain.value = currentVolume;
        }
    }

    function applyVibrato() {
        if (vibratoInterval) clearInterval(vibratoInterval);
        if (currentVibrato > 0 && isPlaying && !isBinaural && oscillator) {
            let time = 0;
            vibratoInterval = setInterval(() => {
                if (!isPlaying || isBinaural || !oscillator) return;
                const mod = Math.sin(time * currentVibrato * Math.PI * 2);
                oscillator.frequency.value = currentFrequency + (mod * 8);
                time += 0.05;
            }, 50);
        } else if (oscillator && !isBinaural) {
            oscillator.frequency.value = currentFrequency;
        }
    }

    function applyPhaser() {
        if (phaserInterval) clearInterval(phaserInterval);
        if (currentPhaser > 0 && isPlaying && !isBinaural && filterNode) {
            let time = 0;
            phaserInterval = setInterval(() => {
                if (!isPlaying || isBinaural || !filterNode) return;
                const mod = (Math.sin(time * 5) + 1) / 2;
                const freq = 200 + mod * currentPhaser * 80;
                filterNode.frequency.value = freq;
                time += 0.05;
            }, 50);
        } else if (filterNode && !isBinaural) {
            filterNode.frequency.value = currentFilter;
        }
    }

    function resetAll() {
        if (isPlaying) stopSound();
        
        setFrequency(440);
        setVolume(50);
        
        currentWaveform = 'sine';
        waveBtns.forEach(btn => {
            if (btn.dataset.wave === 'sine') btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        setPan(0);
        setTremolo(0);
        setVibrato(0);
        setPhaser(0);
        setReverb(0);
        setDelay(0);
        setDistortion(0);
        setFilter(20000);
        
        setBinauralBase(200);
        setBinauralDiff(10);
        setBinauralVolume(50);
        
        presetBtns.forEach(btn => {
            if (parseFloat(btn.dataset.freq) === 440) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        // Reset textů tlačítek
        playBtn.innerHTML = '▶ Přehrát';
        binauralPlayBtn.innerHTML = '▶ Přehrát';
        
        showNotification('Všechny hodnoty byly resetovány', 'success');
        saveSettings();
    }

    async function playSound() {
        if (isPlaying) {
            stopSound();
            playBtn.innerHTML = '▶ Přehrát';
            return;
        }
        
        initAudio();
        if (audioContext.state === 'suspended') await audioContext.resume();
        
        isBinaural = false;
        
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        pannerNode = audioContext.createStereoPanner();
        
        filterNode = audioContext.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.value = currentFilter;
        filterNode.Q.value = 1;
        
        distortionNode = audioContext.createWaveShaper();
        setDistortion(currentDistortion);
        
        delayNode = audioContext.createDelay();
        delayNode.delayTime.value = currentDelay / 1000;
        
        reverbGain = audioContext.createGain();
        reverbGain.gain.value = currentReverb / 100;
        
        oscillator.type = currentWaveform;
        oscillator.frequency.value = currentFrequency;
        gainNode.gain.value = currentVolume;
        pannerNode.pan.value = currentPan / 100;
        
        oscillator.connect(gainNode);
        gainNode.connect(filterNode);
        filterNode.connect(distortionNode);
        distortionNode.connect(delayNode);
        delayNode.connect(pannerNode);
        delayNode.connect(reverbGain);
        reverbGain.connect(pannerNode);
        pannerNode.connect(audioContext.destination);
        
        oscillator.start();
        isPlaying = true;
        
        playBtn.innerHTML = '⏹ Zastavit';
        
        applyTremolo();
        applyVibrato();
        applyPhaser();
        
        showNotification(`Přehrávání ${Math.round(currentFrequency)} Hz`, 'success');
        saveSettings();
    }

    async function playBinaural() {
        if (isPlaying) {
            stopSound();
            binauralPlayBtn.innerHTML = '▶ Přehrát';
            return;
        }
        
        initAudio();
        if (audioContext.state === 'suspended') await audioContext.resume();
        
        isBinaural = true;
        
        const leftFreq = binauralBaseFreq;
        const rightFreq = binauralBaseFreq + binauralDiff;
        
        leftOscillator = audioContext.createOscillator();
        rightOscillator = audioContext.createOscillator();
        leftGain = audioContext.createGain();
        rightGain = audioContext.createGain();
        
        leftOscillator.type = 'sine';
        rightOscillator.type = 'sine';
        leftOscillator.frequency.value = leftFreq;
        rightOscillator.frequency.value = rightFreq;
        leftGain.gain.value = binauralVolumeValueNum;
        rightGain.gain.value = binauralVolumeValueNum;
        
        const pannerL = audioContext.createStereoPanner();
        const pannerR = audioContext.createStereoPanner();
        pannerL.pan.value = -1;
        pannerR.pan.value = 1;
        
        leftOscillator.connect(leftGain);
        leftGain.connect(pannerL);
        pannerL.connect(audioContext.destination);
        
        rightOscillator.connect(rightGain);
        rightGain.connect(pannerR);
        pannerR.connect(audioContext.destination);
        
        leftOscillator.start();
        rightOscillator.start();
        isPlaying = true;
        
        binauralPlayBtn.innerHTML = '⏹ Zastavit';
        
        showNotification(`Binaurální: ${leftFreq} Hz / ${rightFreq} Hz (${binauralDiff} Hz rozdíl)`, 'success');
        saveSettings();
    }

    function stopSound() {
        if (oscillator) { try { oscillator.stop(); oscillator.disconnect(); } catch(e) {} oscillator = null; }
        if (leftOscillator) { try { leftOscillator.stop(); leftOscillator.disconnect(); } catch(e) {} leftOscillator = null; }
        if (rightOscillator) { try { rightOscillator.stop(); rightOscillator.disconnect(); } catch(e) {} rightOscillator = null; }
        if (gainNode) { try { gainNode.disconnect(); } catch(e) {} gainNode = null; }
        if (leftGain) { try { leftGain.disconnect(); } catch(e) {} leftGain = null; }
        if (rightGain) { try { rightGain.disconnect(); } catch(e) {} rightGain = null; }
        if (filterNode) { try { filterNode.disconnect(); } catch(e) {} filterNode = null; }
        if (distortionNode) { try { distortionNode.disconnect(); } catch(e) {} distortionNode = null; }
        if (delayNode) { try { delayNode.disconnect(); } catch(e) {} delayNode = null; }
        if (pannerNode) { try { pannerNode.disconnect(); } catch(e) {} pannerNode = null; }
        if (reverbGain) { try { reverbGain.disconnect(); } catch(e) {} reverbGain = null; }
        
        if (tremoloInterval) { clearInterval(tremoloInterval); tremoloInterval = null; }
        if (vibratoInterval) { clearInterval(vibratoInterval); vibratoInterval = null; }
        if (phaserInterval) { clearInterval(phaserInterval); phaserInterval = null; }
        
        isPlaying = false;
        isBinaural = false;
        
        showNotification('Zastaveno', 'info');
    }

    // ========== EVENT LISTENERS ==========
    
    resetBtn.addEventListener('click', resetAll);
    
    freqMinus.addEventListener('click', () => setFrequency(Math.max(20, currentFrequency - 10)));
    freqPlus.addEventListener('click', () => setFrequency(Math.min(20000, currentFrequency + 10)));
    freqInput.addEventListener('change', () => setFrequency(parseFloat(freqInput.value) || 440));
    freqSlider.addEventListener('input', (e) => setFrequency(parseFloat(e.target.value)));
    
    volumeSlider.addEventListener('input', (e) => setVolume(parseFloat(e.target.value)));
    
    playBtn.addEventListener('click', playSound);
    
    panSlider.addEventListener('input', (e) => setPan(parseFloat(e.target.value)));
    filterSlider.addEventListener('input', (e) => setFilter(parseFloat(e.target.value)));
    distortionSlider.addEventListener('input', (e) => setDistortion(parseFloat(e.target.value)));
    delaySlider.addEventListener('input', (e) => setDelay(parseFloat(e.target.value)));
    phaserSlider.addEventListener('input', (e) => setPhaser(parseFloat(e.target.value)));
    reverbSlider.addEventListener('input', (e) => setReverb(parseFloat(e.target.value)));
    tremoloSlider.addEventListener('input', (e) => setTremolo(parseFloat(e.target.value)));
    vibratoSlider.addEventListener('input', (e) => setVibrato(parseFloat(e.target.value)));
    
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setFrequency(parseFloat(btn.dataset.freq));
        });
    });
    
    waveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            waveBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWaveform = btn.dataset.wave;
            if (oscillator && !isBinaural) oscillator.type = currentWaveform;
            saveSettings();
        });
    });
    
    // Binaurální eventy
    binauralVolume.addEventListener('input', (e) => {
    setBinauralVolume(parseFloat(e.target.value));
    // Pokud hraje binaurální, aktualizuj hlasitost v reálném čase
    if (isPlaying && isBinaural && leftGain && rightGain) {
        leftGain.gain.value = binauralVolumeValueNum;
        rightGain.gain.value = binauralVolumeValueNum;
    }
});
    binauralBase.addEventListener('input', (e) => {
    setBinauralBase(parseFloat(e.target.value));
    // Pokud hraje binaurální, aktualizuj frekvence v reálném čase
    if (isPlaying && isBinaural && leftOscillator && rightOscillator) {
        const rightFreq = binauralBaseFreq + binauralDiff;
        leftOscillator.frequency.value = binauralBaseFreq;
        rightOscillator.frequency.value = rightFreq;
    }
});
    binauralDiffSlider.addEventListener('input', (e) => {
    setBinauralDiff(parseFloat(e.target.value));
    // Pokud hraje binaurální, aktualizuj pravou frekvenci v reálném čase
    if (isPlaying && isBinaural && rightOscillator) {
        const rightFreq = binauralBaseFreq + binauralDiff;
        rightOscillator.frequency.value = rightFreq;
    }
});
    binauralPlayBtn.addEventListener('click', playBinaural);
    
    function saveSettings() {
        storage.set('frequency', currentFrequency);
        storage.set('volume', currentVolume * 100);
        storage.set('waveform', currentWaveform);
        storage.set('pan', currentPan);
        storage.set('tremolo', currentTremolo);
        storage.set('vibrato', currentVibrato);
        storage.set('phaser', currentPhaser);
        storage.set('reverb', currentReverb);
        storage.set('delay', currentDelay);
        storage.set('distortion', currentDistortion);
        storage.set('filter', currentFilter);
        storage.set('binauralBase', binauralBaseFreq);
        storage.set('binauralDiff', binauralDiff);
        storage.set('binauralVolume', binauralVolumeValueNum * 100);
    }
    
    function loadSettings() {
        setFrequency(storage.get('frequency', 440));
        setVolume(storage.get('volume', 50));
        currentWaveform = storage.get('waveform', 'sine');
        setPan(storage.get('pan', 0));
        setFilter(storage.get('filter', 20000));
        setDistortion(storage.get('distortion', 0));
        setDelay(storage.get('delay', 0));
        setPhaser(storage.get('phaser', 0));
        setReverb(storage.get('reverb', 0));
        setTremolo(storage.get('tremolo', 0));
        setVibrato(storage.get('vibrato', 0));
        setBinauralBase(storage.get('binauralBase', 200));
        setBinauralDiff(storage.get('binauralDiff', 10));
        setBinauralVolume(storage.get('binauralVolume', 50));
        
        waveBtns.forEach(btn => {
            if (btn.dataset.wave === currentWaveform) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        presetBtns.forEach(btn => {
            if (parseFloat(btn.dataset.freq) === currentFrequency) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }
    
    loadSettings();
    
    window.addEventListener('beforeunload', () => {
        if (isPlaying) stopSound();
        if (audioContext) audioContext.close();
    });
}

export function cleanup() {
    if (isPlaying) stopSound();
    if (audioContext) audioContext.close();
    if (tremoloInterval) clearInterval(tremoloInterval);
    if (vibratoInterval) clearInterval(vibratoInterval);
    if (phaserInterval) clearInterval(phaserInterval);
}