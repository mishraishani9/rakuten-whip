/**
 * WHIP soundtrack. Everything is synthesised with WebAudio so it works offline.
 *
 * Three independent layers:
 *  - "menu"     : calm bed for splash / home
 *  - "setup"    : brighter bed for game configuration
 *  - "gameplay" : driving bed for an active session
 *  - tick       : loud clock overlay that plays ON TOP of the gameplay bed
 *                 while a question is on screen.
 */

type TrackName = "menu" | "setup" | "gameplay";

type Layer = {
  timer: number | null;
  step: number;
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let current: TrackName | null = null;
let unlocked = false;

const layer: Layer = { timer: null, step: 0 };

const PATTERNS: Record<TrackName, { bass: number[]; lead: number[]; beatMs: number; gain: number }> = {
  menu: {
    bass: [98, 98, 130.81, 116.54],
    lead: [392, 493.88, 587.33, 493.88],
    beatMs: 760,
    gain: 0.1,
  },
  setup: {
    bass: [104, 104, 138.59, 123.47],
    lead: [415.3, 523.25, 622.25, 523.25, 466.16, 415.3],
    beatMs: 620,
    gain: 0.11,
  },
  gameplay: {
    bass: [110, 110, 146.83, 130.81],
    lead: [440, 493.88, 587.33, 493.88, 440, 392, 440, 523.25],
    beatMs: 500,
    gain: 0.14,
  },
};

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, volume: number, type: OscillatorType = "sine", when = 0) {
  const c = audio();
  if (!c || !master || !enabled) return;
  const start = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function stopLayer() {
  if (layer.timer !== null) window.clearInterval(layer.timer);
  layer.timer = null;
  layer.step = 0;
}

function runTrack(name: TrackName) {
  const pattern = PATTERNS[name];
  const beat = () => {
    if (!enabled) return;
    const bass = pattern.bass[layer.step % pattern.bass.length]!;
    tone(bass, pattern.beatMs / 1400, pattern.gain, "triangle");
    tone(bass / 2, pattern.beatMs / 1100, pattern.gain * 0.6, "sine");
    if (layer.step % 2 === 0) {
      const lead = pattern.lead[(layer.step / 2) % pattern.lead.length]!;
      tone(lead, 0.24, pattern.gain * 0.35, "sawtooth");
    }
    layer.step++;
  };
  beat();
  layer.timer = window.setInterval(beat, pattern.beatMs);
}

export const gameAudio = {
  isEnabled: () => enabled,

  /** Browsers block audio until the first gesture: call this from any click/tap. */
  unlock() {
    if (unlocked) return;
    if (!audio()) return;
    unlocked = true;
    if (current) {
      stopLayer();
      runTrack(current);
    }
  },

  setEnabled(next: boolean) {
    enabled = next;
    if (!next) stopLayer();
    else if (current) {
      stopLayer();
      runTrack(current);
    }
  },

  /** Switches the looping background bed. Calling it with the same track is a no-op. */
  playTrack(name: TrackName) {
    if (current === name && layer.timer !== null) return;
    current = name;
    stopLayer();
    if (!enabled) return;
    if (!audio()) return;
    runTrack(name);
  },

  stopTrack() {
    current = null;
    stopLayer();
  },

  /** Loud clock tick layered over the gameplay bed, once per countdown second. */
  tick(secondsLeft: number) {
    const urgent = secondsLeft <= 10;
    tone(urgent ? 1600 : 1150, 0.06, urgent ? 0.55 : 0.4, "square");
    tone(urgent ? 300 : 220, 0.1, 0.34, "triangle");
  },

  dice() {
    for (let i = 0; i < 5; i++) tone(180 + i * 90, 0.05, 0.22, "square", i * 0.05);
  },

  correct() {
    tone(659.25, 0.16, 0.3, "triangle");
    tone(880, 0.22, 0.28, "triangle", 0.14);
    tone(1174.66, 0.3, 0.24, "sine", 0.28);
  },

  wrong() {
    tone(196, 0.32, 0.32, "sawtooth");
    tone(155.56, 0.42, 0.28, "square", 0.12);
  },

  timeUp() {
    tone(233.08, 0.5, 0.34, "sawtooth");
    tone(174.61, 0.6, 0.3, "square", 0.2);
  },
};
