/*
 * Study Grove sound engine
 *
 * This module owns the entire audio subsystem. It deliberately uses the
 * browser's native Web Audio API instead of adding a runtime dependency: the
 * app stays offline-first, starts quickly, and can still layer synthesis,
 * samples, filters, jitter, and reverb.
 */

const SAMPLE_PATHS = Object.freeze({
  'shared/click': 'assets/sounds/shared/kenney-click.mp3',
  'shared/toggle': 'assets/sounds/shared/kenney-toggle.mp3',
  'grove/wood-click': 'assets/sounds/grove/wood-click.mp3',
  'grove/wood-creak': 'assets/sounds/grove/wood-creak.mp3',
  'lagoon/water-drop': 'assets/sounds/lagoon/water-drop.mp3',
  'hearth/fire-short': 'assets/sounds/hearth/fire-crackle-short.mp3',
  'hearth/fire-loop': 'assets/sounds/hearth/fire-crackle-loop.mp3',
  'mythic/wind-chimes': 'assets/sounds/mythic/wind-chimes.mp3'
});

const THEME_SAMPLE = Object.freeze({
  nebula: 'grove/wood-click',
  ocean: 'lagoon/water-drop',
  ember: 'hearth/fire-short',
  aurora: 'mythic/wind-chimes'
});

const THEME_SOUND_CONFIG = Object.freeze({
  nebula: {
    start: {
      tones: [{ freq: 523, duration: 0.46, type: 'triangle', voices: 3, detuneSpread: 7, filterStart: 3200, filterEnd: 1050, volume: 0.16 }],
      sample: { key: 'grove/wood-click', gain: 0.52, delay: 0.02, pitchJitter: 0.035, reverbSend: 0.12 }
    },
    pause: {
      tones: [{ freq: 440, duration: 0.42, type: 'triangle', voices: 2, detuneSpread: 5, filterStart: 2400, filterEnd: 650, volume: 0.13 }],
      sample: { key: 'grove/wood-creak', gain: 0.38, delay: 0.07, pitchJitter: 0.055, reverbSend: 0.18 }
    },
    save: {
      tones: [
        { freq: 494, duration: 0.28, type: 'sine', voices: 2, detuneSpread: 3, filterStart: 2100, filterEnd: 850, volume: 0.10 },
        { freq: 622, duration: 0.48, type: 'triangle', voices: 2, delay: 0.11, filterStart: 2500, filterEnd: 950, volume: 0.13 }
      ],
      // A warm hearth texture makes saving feel settled and rewarding without
      // bringing back the sharper wooden transient.
      sample: { key: 'hearth/fire-short', gain: 0.29, delay: 0.04, pitchJitter: 0.045, reverbSend: 0.22 }
    },
    button: {
      tones: [{ freq: 392, duration: 0.22, type: 'sine', voices: 2, detuneSpread: 2, filterStart: 1700, filterEnd: 720, volume: 0.055 }],
      reverbSend: 0.07
    },
    timerComplete: {
      tones: [
        { freq: 660, duration: 0.54, type: 'triangle', voices: 3, detuneSpread: 7, filterStart: 3300, filterEnd: 1200, volume: 0.15 },
        { freq: 880, duration: 0.72, type: 'triangle', voices: 3, detuneSpread: 8, delay: 0.10, filterStart: 3600, filterEnd: 1200, volume: 0.17 }
      ],
      reverbSend: 0.34
    },
    todoComplete: {
      tones: [{ freq: 784, duration: 0.32, type: 'triangle', voices: 2, filterStart: 2800, filterEnd: 900, volume: 0.10 }],
      sample: { key: 'shared/click', gain: 0.24, delay: 0.01, pitchJitter: 0.03, reverbSend: 0.08 }
    },
    themeChange: {
      tones: [{ freq: 587, duration: 0.30, type: 'triangle', voices: 2, filterStart: 2800, filterEnd: 950, volume: 0.10 }],
      sample: { key: 'grove/wood-click', gain: 0.22, delay: 0.02, pitchJitter: 0.04, reverbSend: 0.10 }
    }
  },
  ocean: {
    start: {
      tones: [{ freq: 494, duration: 0.50, type: 'sine', voices: 3, detuneSpread: 9, filterStart: 4200, filterEnd: 1250, volume: 0.15 }],
      sample: { key: 'lagoon/water-drop', gain: 0.47, delay: 0.26, pitchJitter: 0.045, reverbSend: 0.25 }
    },
    pause: {
      tones: [{ freq: 415, duration: 0.44, type: 'sine', voices: 2, detuneSpread: 6, filterStart: 2600, filterEnd: 560, volume: 0.12 }],
      sample: { key: 'lagoon/water-drop', gain: 0.34, delay: 0.03, playbackRate: 0.84, pitchJitter: 0.04, reverbSend: 0.28 }
    },
    save: {
      tones: [
        { freq: 587, duration: 0.20, type: 'sine', voices: 2, volume: 0.12 },
        { freq: 740, duration: 0.38, type: 'sine', voices: 3, delay: 0.10, filterStart: 3800, filterEnd: 1100, volume: 0.14 }
      ],
      sample: { key: 'lagoon/water-drop', gain: 0.38, delay: 0.02, pitchJitter: 0.05, reverbSend: 0.27 }
    },
    button: {
      tones: [{ freq: 587, duration: 0.24, type: 'sine', voices: 2, detuneSpread: 3, filterStart: 2500, filterEnd: 980, volume: 0.05 }],
      sample: { key: 'lagoon/water-drop', gain: 0.075, delay: 0.05, pitchJitter: 0.03, reverbSend: 0.16 },
      reverbSend: 0.12
    },
    timerComplete: {
      tones: [
        { freq: 660, duration: 0.56, type: 'sine', voices: 3, detuneSpread: 8, filterStart: 4200, filterEnd: 1450, volume: 0.14 },
        { freq: 990, duration: 0.74, type: 'sine', voices: 3, detuneSpread: 10, delay: 0.10, filterStart: 4600, filterEnd: 1500, volume: 0.16 }
      ],
      reverbSend: 0.42
    },
    todoComplete: {
      tones: [{ freq: 880, duration: 0.34, type: 'sine', voices: 2, filterStart: 3500, filterEnd: 900, volume: 0.09 }],
      sample: { key: 'shared/click', gain: 0.20, delay: 0.01, pitchJitter: 0.03, reverbSend: 0.13 }
    },
    themeChange: {
      tones: [{ freq: 659, duration: 0.34, type: 'sine', voices: 3, filterStart: 3600, filterEnd: 1150, volume: 0.10 }],
      sample: { key: 'lagoon/water-drop', gain: 0.20, delay: 0.18, pitchJitter: 0.04, reverbSend: 0.22 }
    }
  },
  ember: {
    start: {
      tones: [{ freq: 494, duration: 0.48, type: 'sawtooth', voices: 2, detuneSpread: 8, filterStart: 2600, filterEnd: 850, volume: 0.11 }],
      sample: { key: 'hearth/fire-short', gain: 0.34, delay: 0.01, pitchJitter: 0.07, reverbSend: 0.17 }
    },
    pause: {
      tones: [{ freq: 415, duration: 0.43, type: 'sawtooth', voices: 2, detuneSpread: 6, filterStart: 1900, filterEnd: 460, volume: 0.095 }],
      sample: { key: 'hearth/fire-short', gain: 0.28, delay: 0.06, pitchJitter: 0.08, reverbSend: 0.18 }
    },
    save: {
      tones: [
        { freq: 554, duration: 0.19, type: 'triangle', voices: 2, volume: 0.12 },
        { freq: 698, duration: 0.38, type: 'sawtooth', voices: 2, delay: 0.10, filterStart: 2600, filterEnd: 900, volume: 0.13 }
      ],
      sample: { key: 'hearth/fire-short', gain: 0.32, delay: 0.02, pitchJitter: 0.08, reverbSend: 0.17 }
    },
    button: {
      tones: [{ freq: 330, duration: 0.22, type: 'triangle', voices: 2, detuneSpread: 3, filterStart: 1500, filterEnd: 650, volume: 0.05 }],
      sample: { key: 'hearth/fire-short', gain: 0.07, delay: 0.02, pitchJitter: 0.05, reverbSend: 0.14 },
      reverbSend: 0.10
    },
    timerComplete: {
      tones: [
        { freq: 660, duration: 0.56, type: 'sawtooth', voices: 2, detuneSpread: 8, filterStart: 2800, filterEnd: 900, volume: 0.105 },
        { freq: 830, duration: 0.76, type: 'triangle', voices: 3, detuneSpread: 7, delay: 0.10, filterStart: 3200, filterEnd: 1000, volume: 0.15 }
      ],
      sample: { key: 'hearth/fire-loop', gain: 0.25, delay: 0.02, pitchJitter: 0.05, reverbSend: 0.27, duration: 1.35, randomOffset: true },
      reverbSend: 0.30
    },
    todoComplete: {
      tones: [{ freq: 740, duration: 0.32, type: 'triangle', voices: 2, filterStart: 2400, filterEnd: 850, volume: 0.09 }],
      sample: { key: 'shared/click', gain: 0.20, delay: 0.01, pitchJitter: 0.03, reverbSend: 0.08 }
    },
    themeChange: {
      tones: [{ freq: 622, duration: 0.32, type: 'triangle', voices: 2, filterStart: 2600, filterEnd: 800, volume: 0.10 }],
      sample: { key: 'hearth/fire-short', gain: 0.20, delay: 0.01, pitchJitter: 0.07, reverbSend: 0.16 }
    }
  },
  // Aurora is the mobile-only minimalist theme. Its voice is airy and
  // ethereal: bright sine chimes riding the wind-chimes sample with extra
  // reverb, so it reads as light and floating rather than grounded.
  aurora: {
    start: {
      tones: [
        { freq: 880, duration: 0.52, type: 'sine', voices: 3, detuneSpread: 9, filterStart: 5200, filterEnd: 2200, volume: 0.12 },
        { freq: 1175, duration: 0.66, type: 'sine', voices: 2, detuneSpread: 6, delay: 0.10, filterStart: 5600, filterEnd: 2400, volume: 0.10 }
      ],
      sample: { key: 'mythic/wind-chimes', gain: 0.40, delay: 0.04, pitchJitter: 0.05, reverbSend: 0.40 }
    },
    pause: {
      tones: [{ freq: 698, duration: 0.50, type: 'sine', voices: 2, detuneSpread: 7, filterStart: 4200, filterEnd: 1500, volume: 0.10 }],
      sample: { key: 'mythic/wind-chimes', gain: 0.30, delay: 0.02, playbackRate: 0.86, pitchJitter: 0.05, reverbSend: 0.44 }
    },
    save: {
      tones: [
        { freq: 784, duration: 0.22, type: 'sine', voices: 2, volume: 0.11 },
        { freq: 1047, duration: 0.46, type: 'sine', voices: 3, detuneSpread: 8, delay: 0.10, filterStart: 5200, filterEnd: 2200, volume: 0.12 }
      ],
      sample: { key: 'mythic/wind-chimes', gain: 0.38, delay: 0.06, pitchJitter: 0.05, reverbSend: 0.42 }
    },
    button: {
      tones: [{ freq: 988, duration: 0.24, type: 'sine', voices: 2, detuneSpread: 4, filterStart: 4600, filterEnd: 2000, volume: 0.045 }],
      sample: { key: 'mythic/wind-chimes', gain: 0.085, delay: 0.02, pitchJitter: 0.04, reverbSend: 0.26 },
      reverbSend: 0.18
    },
    timerComplete: {
      tones: [
        { freq: 784, duration: 0.50, type: 'sine', voices: 3, detuneSpread: 9, filterStart: 5200, filterEnd: 2400, volume: 0.13 },
        { freq: 1175, duration: 0.80, type: 'sine', voices: 3, detuneSpread: 10, delay: 0.12, filterStart: 6000, filterEnd: 2600, volume: 0.14 },
        { freq: 1568, duration: 0.90, type: 'sine', voices: 2, detuneSpread: 5, delay: 0.26, filterStart: 6200, filterEnd: 3000, volume: 0.10 }
      ],
      sample: { key: 'mythic/wind-chimes', gain: 0.34, delay: 0.02, pitchJitter: 0.05, reverbSend: 0.46 },
      reverbSend: 0.48
    },
    todoComplete: {
      tones: [{ freq: 1175, duration: 0.34, type: 'sine', voices: 2, detuneSpread: 6, filterStart: 5200, filterEnd: 2200, volume: 0.085 }],
      sample: { key: 'shared/click', gain: 0.18, delay: 0.01, pitchJitter: 0.03, reverbSend: 0.16 }
    },
    themeChange: {
      tones: [{ freq: 1047, duration: 0.36, type: 'sine', voices: 3, detuneSpread: 8, filterStart: 5400, filterEnd: 2400, volume: 0.10 }],
      sample: { key: 'mythic/wind-chimes', gain: 0.28, delay: 0.10, pitchJitter: 0.05, reverbSend: 0.38 }
    }
  }
});

const ACHIEVEMENT_SOUND_CONFIG = Object.freeze({
  common: {
    tones: [{ freq: 660, duration: 0.48, type: 'triangle', voices: 2, detuneSpread: 5, filterStart: 3200, filterEnd: 950, volume: 0.14 }],
    reverbSend: 0.16,
    lockSeconds: 0.75
  },
  rare: {
    tones: [
      { freq: 587, duration: 0.36, type: 'triangle', voices: 2, volume: 0.12 },
      { freq: 784, duration: 0.54, type: 'triangle', voices: 3, delay: 0.12, filterStart: 3500, filterEnd: 1000, volume: 0.14 }
    ],
    reverbSend: 0.22,
    lockSeconds: 0.95
  },
  epic: {
    tones: [
      { freq: 523, duration: 0.34, type: 'triangle', voices: 2, volume: 0.11 },
      { freq: 659, duration: 0.38, type: 'triangle', voices: 2, delay: 0.10, volume: 0.12 },
      { freq: 880, duration: 0.64, type: 'triangle', voices: 3, delay: 0.22, filterStart: 3800, filterEnd: 1100, volume: 0.15 }
    ],
    reverbSend: 0.30,
    sampleGain: 0.28,
    sampleDelay: 0.20,
    lockSeconds: 1.35
  },
  legendary: {
    tones: [
      { freq: 494, duration: 0.32, type: 'triangle', voices: 2, volume: 0.10 },
      { freq: 622, duration: 0.36, type: 'triangle', voices: 2, delay: 0.09, volume: 0.11 },
      { freq: 784, duration: 0.42, type: 'triangle', voices: 3, delay: 0.18, volume: 0.12 },
      { freq: 1047, duration: 0.78, type: 'triangle', voices: 3, delay: 0.30, filterStart: 4200, filterEnd: 1200, volume: 0.16 }
    ],
    reverbSend: 0.40,
    sampleGain: 0.38,
    sampleDelay: 0.28,
    lockSeconds: 1.75
  },
  mythic: {
    tones: [
      { freq: 494, duration: 0.34, type: 'triangle', voices: 3, detuneSpread: 7, volume: 0.11 },
      { freq: 622, duration: 0.38, type: 'triangle', voices: 3, detuneSpread: 7, delay: 0.09, volume: 0.12 },
      { freq: 784, duration: 0.44, type: 'triangle', voices: 3, detuneSpread: 8, delay: 0.18, volume: 0.13 },
      { freq: 1047, duration: 0.86, type: 'triangle', voices: 4, detuneSpread: 9, delay: 0.30, filterStart: 4500, filterEnd: 1300, volume: 0.17 },
      { freq: 1568, duration: 0.72, type: 'sine', voices: 2, detuneSpread: 4, delay: 0.36, filterStart: 5200, filterEnd: 1900, volume: 0.055 }
    ],
    reverbSend: 0.52,
    sample: { key: 'mythic/wind-chimes', gain: 0.54, delay: 0.36, pitchJitter: 0.018, reverbSend: 0.42 },
    lockSeconds: 2.85
  }
});

let audioCtx = null;
let masterBus = null;
let reverbBus = null;
let reverbReturn = null;
let sampleCache = new Map();
let achievementBusyUntil = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function getContext() {
  if (!audioCtx) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) throw new Error('Web Audio API is unavailable.');
    audioCtx = new AudioContextCtor();

    masterBus = audioCtx.createGain();
    masterBus.gain.value = 0.92;

    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    masterBus.connect(compressor);
    compressor.connect(audioCtx.destination);

    reverbBus = createReverb(audioCtx, 2.3, 2.8);
    reverbReturn = audioCtx.createGain();
    reverbReturn.gain.value = 0.62;
    reverbBus.connect(reverbReturn);
    reverbReturn.connect(masterBus);
  }

  if (audioCtx.state === 'suspended') void audioCtx.resume();
  return audioCtx;
}

function createReverb(ctx, seconds, decay) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      const envelope = Math.pow(1 - index / length, decay);
      data[index] = (Math.random() * 2 - 1) * envelope;
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

function resolveAssetUrl(key) {
  const relativePath = SAMPLE_PATHS[key];
  return relativePath ? new URL(`./${relativePath}`, import.meta.url).href : null;
}

async function loadSample(ctx, key) {
  const url = resolveAssetUrl(key);
  if (!url) return null;
  if (!sampleCache.has(url)) {
    const promise = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Audio asset returned ${response.status}: ${key}`);
        return response.arrayBuffer();
      })
      .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
      .catch(error => {
        console.warn(`[Study Grove] Audio sample unavailable: ${key}`, error);
        return null;
      });
    sampleCache.set(url, promise);
  }
  return sampleCache.get(url);
}

function scheduleTone(ctx, config, outputGain) {
  const duration = Math.max(0.12, Number(config.duration) || 0.3);
  const delay = Math.max(0, Number(config.delay) || 0);
  const now = ctx.currentTime + delay;
  const voices = Math.max(1, Math.min(5, Number.parseInt(config.voices, 10) || 2));
  const detuneSpread = Number(config.detuneSpread ?? 6) || 0;
  const baseFrequency = Math.max(40, Number(config.freq) || 440);
  const peakVolume = clamp(Number(config.volume ?? 0.12), 0.0005, 0.35);
  const filterStart = Math.max(250, Number(config.filterStart) || 3000);
  const filterEnd = Math.max(200, Number(config.filterEnd) || 900);
  const attack = Math.min(0.045, Math.max(0.012, duration * 0.16));
  const release = Math.min(0.10, Math.max(0.045, duration * 0.18));

  for (let voiceIndex = 0; voiceIndex < voices; voiceIndex += 1) {
    const oscillator = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const spread = (voiceIndex - (voices - 1) / 2) * detuneSpread;
    const jitter = (Math.random() - 0.5) * Math.min(5, Math.max(1, detuneSpread));

    oscillator.type = ['sine', 'triangle', 'sawtooth', 'square'].includes(config.type) ? config.type : 'sine';
    oscillator.frequency.setValueAtTime(baseFrequency, now);
    oscillator.detune.setValueAtTime(spread + jitter, now);

    filter.type = 'lowpass';
    filter.Q.value = 0.65;
    filter.frequency.setValueAtTime(filterStart, now);
    filter.frequency.exponentialRampToValueAtTime(filterEnd, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0005, (peakVolume / voices)), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(outputGain.dry);

    if (outputGain.reverb && outputGain.reverbSend > 0) {
      const send = ctx.createGain();
      send.gain.value = outputGain.reverbSend;
      gain.connect(send);
      send.connect(outputGain.reverb);
    }

    oscillator.start(now);
    oscillator.stop(now + duration + release);
  }
}

function scheduleSample(ctx, buffer, config, outputGain, volumeScale = 1) {
  if (!buffer) return;
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const delay = Math.max(0, Number(config.delay) || 0);
  const start = ctx.currentTime + delay;
  const pitchJitter = clamp(Number(config.pitchJitter ?? 0.04), 0, 0.20);
  const rate = Number(config.playbackRate) || 1;
  const playbackRate = Math.max(0.55, Math.min(1.55, rate * (1 + (Math.random() * 2 - 1) * pitchJitter)));
  const peakVolume = clamp((Number(config.gain) || 0.3) * volumeScale, 0.0005, 0.65);
  const fadeIn = Math.min(0.025, Math.max(0.006, buffer.duration * 0.12));
  const requestedDuration = Number(config.duration);
  const duration = Number.isFinite(requestedDuration) && requestedDuration > 0
    ? Math.min(requestedDuration, buffer.duration)
    : buffer.duration;
  const offset = config.randomOffset
    ? Math.random() * Math.max(0, buffer.duration - duration)
    : Math.max(0, Math.min(Number(config.offset) || 0, Math.max(0, buffer.duration - duration)));

  source.buffer = buffer;
  source.playbackRate.setValueAtTime(playbackRate, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peakVolume, start + fadeIn);
  gain.gain.setValueAtTime(peakVolume, start + Math.max(fadeIn, duration - 0.045));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(gain);
  gain.connect(outputGain.dry);
  if (outputGain.reverb && outputGain.reverbSend > 0) {
    const send = ctx.createGain();
    send.gain.value = Number(config.reverbSend ?? outputGain.reverbSend);
    gain.connect(send);
    send.connect(outputGain.reverb);
  }

  source.start(start, offset, duration);
}

function createOutput(ctx, reverbSend = 0.2) {
  const dry = ctx.createGain();
  dry.gain.value = 1;
  dry.connect(masterBus);
  return { dry, reverb: reverbBus, reverbSend: Math.max(0, Number(reverbSend) || 0) };
}

function scheduleConfig(ctx, config, volumeScale) {
  const output = createOutput(ctx, config.reverbSend ?? 0.2);
  const tones = Array.isArray(config.tones) ? config.tones : [];
  tones.forEach(tone => scheduleTone(ctx, { ...tone, volume: (Number(tone.volume) || 0.12) * volumeScale }, output));

  if (config.sample && config.sample.key) {
    void loadSample(ctx, config.sample.key).then(buffer => {
      if (buffer) scheduleSample(ctx, buffer, config.sample, output, volumeScale);
    });
  }
}

function scheduleAchievement(ctx, rarity, theme, volumeScale) {
  const normalizedRarity = Object.prototype.hasOwnProperty.call(ACHIEVEMENT_SOUND_CONFIG, rarity) ? rarity : 'common';
  const config = ACHIEVEMENT_SOUND_CONFIG[normalizedRarity];
  const output = createOutput(ctx, config.reverbSend);
  config.tones.forEach(tone => scheduleTone(ctx, { ...tone, volume: (Number(tone.volume) || 0.12) * volumeScale }, output));

  const sample = config.sample || (config.sampleGain
    ? { key: THEME_SAMPLE[theme] || THEME_SAMPLE.nebula, gain: config.sampleGain, delay: config.sampleDelay, pitchJitter: 0.04, reverbSend: config.reverbSend * 0.75 }
    : null);
  if (sample) {
    void loadSample(ctx, sample.key).then(buffer => {
      if (buffer) scheduleSample(ctx, buffer, sample, output, volumeScale);
    });
  }
  achievementBusyUntil = Math.max(achievementBusyUntil, ctx.currentTime + config.lockSeconds);
}

export async function primeAudioEngine() {
  try {
    const ctx = getContext();
    await Promise.all(Object.keys(SAMPLE_PATHS).map(key => loadSample(ctx, key)));
    return true;
  } catch (error) {
    console.warn('[Study Grove] Could not prime the audio engine.', error);
    return false;
  }
}

export async function playCue(eventName, options = {}) {
  const volume = clamp(options.volume ?? 0.7, 0, 1);
  if (volume <= 0) return false;

  let ctx;
  try {
    ctx = getContext();
  } catch (error) {
    console.warn('[Study Grove] Audio is unavailable in this browser.', error);
    return false;
  }

  const theme = Object.prototype.hasOwnProperty.call(THEME_SOUND_CONFIG, options.theme) ? options.theme : 'nebula';
  if (eventName !== 'achievement' && ctx.currentTime < achievementBusyUntil) return false;

  if (eventName === 'achievement') {
    scheduleAchievement(ctx, options.rarity || 'common', theme, volume);
    return true;
  }

  const config = THEME_SOUND_CONFIG[theme]?.[eventName];
  if (!config) return false;
  scheduleConfig(ctx, config, volume);
  return true;
}
