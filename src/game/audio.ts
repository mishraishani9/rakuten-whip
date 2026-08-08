/**
 * Lightweight WebAudio soundtrack for question rounds.
 * No asset downloads: everything is synthesised, so it works offline.
 */

type Ctx = AudioContext & { _whipMaster?: GainNode };

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let musicTimer: number | null = null;
let musicStep = 0;
let enabled = true;

const BASS_PATTERN = [110, 110, 146.83, 130.81];
const LEAD_PATTERN = [440, 493.88, 587.33, 493.88, 440, 392, 440, 523.25];

function audio(): Ctx | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor() as Ctx;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  when = 0,
) {
  const c = audio();
  if (!c || !master || !enabled) return;
  const start = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export const gameAudio = {
  isEnabled: () => enabled,
  setEnabled(next: boolean) {
    enabled = next;
    if (!next) gameAudio.stopMusic();
  },
  /** Suspenseful looping bed, played while a question is on screen. */
  startMusic() {
    if (!enabled || musicTimer !== null) return;
    if (!audio()) return;
    musicStep = 0;
    const beat = () => {
      const bass = BASS_PATTERN[musicStep % BASS_PATTERN.length]!;
      tone(bass, 0.42, 0.16, "triangle");
      tone(bass / 2, 0.5, 0.1, "sine");
      if (musicStep % 2 === 0) {
        const lead = LEAD_PATTERN[(musicStep / 2) % LEAD_PATTERN.length]!;
        tone(lead, 0.24, 0.05, "sawtooth");
      }
      musicStep++;
    };
    beat();
    musicTimer = window.setInterval(beat, 500);
  },
  stopMusic() {
    if (musicTimer !== null) window.clearInterval(musicTimer);
    musicTimer = null;
  },
  /** Loud clock tick, once per second of the countdown. */
  tick(secondsLeft: number) {
    const urgent = secondsLeft <= 10;
    tone(urgent ? 1500 : 1050, 0.07, urgent ? 0.5 : 0.34, "square");
    tone(urgent ? 320 : 240, 0.09, 0.3, "triangle");
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
