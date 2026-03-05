const AudioEngine = (() => {
  let ctx = null;
  let enabled = true;
  let volume = 0.7;
  let warmedUp = false;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function ensureResumed() {
    const c = getCtx();
    if (c.state === 'suspended') {
      c.resume();
    }
  }

  function warmUp() {
    if (warmedUp) return;
    const c = getCtx();
    ensureResumed();
    const osc = c.createOscillator();
    const g = c.createGain();
    g.gain.value = 0.001;
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.05);
    warmedUp = true;
  }

  function playNote(freq, type, duration, vol = 1, delay = 0) {
    if (!enabled) return;
    const c = getCtx();
    ensureResumed();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol * volume, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration + 0.05);
  }

  function noise(duration, vol = 0.3, delay = 0) {
    if (!enabled) return;
    const c = getCtx();
    ensureResumed();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const g = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    g.gain.setValueAtTime(vol * volume, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    src.start(c.currentTime + delay);
  }

  return {
    init() {
      warmUp();
    },

    warmUp,

    setEnabled(val) { enabled = val; },
    isEnabled() { return enabled; },
    setVolume(val) { volume = Math.max(0, Math.min(1, val)); },
    getVolume() { return volume; },

    haptic(intensity = 0.6, durationMs = 50) {
      if (navigator.vibrate) {
        navigator.vibrate(durationMs);
      }
      const c = getCtx();
      ensureResumed();
      const dur = durationMs / 1000;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = 25;
      g.gain.setValueAtTime(intensity * volume, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      osc.connect(g);
      g.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur + 0.01);
    },

    woodfish() {
      if (!enabled) return;
      playNote(150, 'sine', 0.25, 0.8);
      playNote(100, 'sine', 0.4, 0.5, 0.02);
      playNote(200, 'triangle', 0.15, 0.3);
      noise(0.08, 0.15);
    },

    blockLand(delay = 0) {
      if (!enabled) return;
      noise(0.15, 0.5, delay);
      playNote(300, 'square', 0.05, 0.2, delay);
      playNote(180, 'sine', 0.1, 0.3, delay + 0.02);
    },

    holyResult() {
      if (!enabled) return;
      playNote(800, 'sine', 0.8, 0.4);
      playNote(1000, 'sine', 0.6, 0.3, 0.1);
      playNote(1200, 'sine', 0.8, 0.35, 0.2);
      playNote(600, 'triangle', 1.0, 0.15);
    },

    angryResult() {
      if (!enabled) return;
      playNote(120, 'sine', 1.2, 0.5);
      playNote(80, 'sine', 1.5, 0.3, 0.1);
      playNote(60, 'triangle', 1.0, 0.2, 0.2);
    },

    laughResult() {
      if (!enabled) return;
      playNote(400, 'sine', 0.3, 0.3);
      playNote(350, 'sine', 0.3, 0.3, 0.15);
      playNote(400, 'sine', 0.3, 0.3, 0.3);
    },

    tripleHoly() {
      if (!enabled) return;
      [0, 0.12, 0.24].forEach((d, i) => {
        playNote(800 + i * 200, 'sine', 1.0, 0.4, d);
        playNote(600 + i * 150, 'triangle', 0.8, 0.2, d + 0.05);
      });
      playNote(1600, 'sine', 1.5, 0.3, 0.4);
      playNote(1200, 'triangle', 1.5, 0.2, 0.5);
    },

    meritUp() {
      if (!enabled) return;
      playNote(600, 'sine', 0.12, 0.15);
      playNote(800, 'sine', 0.1, 0.1, 0.05);
    },

    bell() {
      if (!enabled) return;
      playNote(500, 'sine', 2.0, 0.3);
      playNote(750, 'sine', 1.5, 0.15, 0.05);
      playNote(1000, 'triangle', 1.0, 0.08, 0.1);
    },

    penanceComplete() {
      if (!enabled) return;
      [523, 587, 659, 784, 880, 1047].forEach((f, i) => {
        playNote(f, 'sine', 0.4, 0.4, i * 0.08);
        playNote(f * 1.5, 'triangle', 0.3, 0.15, i * 0.08 + 0.02);
      });
    },

    unlock() {
      if (!enabled) return;
      [523, 659, 784, 1047].forEach((f, i) => {
        playNote(f, 'sine', 0.3, 0.35, i * 0.1);
      });
    }
  };
})();
