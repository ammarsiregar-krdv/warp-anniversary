// All sounds are synthesised via Web Audio API.
// No audio files needed — works offline, no CDN dependencies.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  gain: number,
  type: OscillatorType = "sine",
  startOffset = 0
) {
  const c   = getCtx();
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.type  = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + startOffset);
  g.gain.setValueAtTime(0.0001, c.currentTime + startOffset);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + startOffset + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startOffset + duration);
  osc.connect(g); g.connect(c.destination);
  osc.start(c.currentTime + startOffset);
  osc.stop(c.currentTime + startOffset + duration + 0.05);
}

function ramp(
  freqA: number,
  freqB: number,
  duration: number,
  gain: number,
  type: OscillatorType = "sine",
  startOffset = 0
) {
  const c   = getCtx();
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.type  = type;
  osc.frequency.setValueAtTime(freqA, c.currentTime + startOffset);
  osc.frequency.exponentialRampToValueAtTime(freqB, c.currentTime + startOffset + duration);
  g.gain.setValueAtTime(gain, c.currentTime + startOffset);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startOffset + duration);
  osc.connect(g); g.connect(c.destination);
  osc.start(c.currentTime + startOffset);
  osc.stop(c.currentTime + startOffset + duration + 0.05);
}

function noise(duration: number, gain: number, loFreq = 200, hiFreq = 1200, startOffset = 0) {
  const c    = getCtx();
  const size = Math.floor(c.sampleRate * duration);
  const buf  = c.createBuffer(1, size, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buf;

  const bpf       = c.createBiquadFilter();
  bpf.type        = "bandpass";
  bpf.frequency.value = (loFreq + hiFreq) / 2;
  bpf.Q.value     = 0.7;

  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime + startOffset);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startOffset + duration);

  src.connect(bpf); bpf.connect(g); g.connect(c.destination);
  src.start(c.currentTime + startOffset);
  src.stop(c.currentTime + startOffset + duration + 0.05);
}

// ── Phase sounds ─────────────────────────────────────────────

export function soundBuildup() {
  noise(1.2, 0.09, 60, 220);
  ramp(90,  380, 1.1, 0.13, "sawtooth");
  ramp(200, 520, 0.9, 0.07, "sine");
}

export function soundTransit() {
  noise(0.45, 0.20, 300, 4000);
  ramp(700, 180, 0.5, 0.16, "sine");
}

export function soundImpact(rarity: number) {
  if (rarity === 3) {
    noise(0.15, 0.22, 400, 2000);
    tone(420, 0.65, 0.18);
    tone(630, 0.45, 0.10);
  } else if (rarity === 4) {
    noise(0.22, 0.30, 200, 2400);
    tone(280, 0.95, 0.22);
    tone(420, 0.75, 0.15);
    tone(560, 0.55, 0.09, "triangle");
    // Delayed choir bloom
    tone(840,  1.2, 0.09, "sine", 0.18);
    tone(1050, 1.0, 0.06, "sine", 0.22);
  } else {
    // 5-star: full orchestral hit
    noise(0.35, 0.38, 60, 1000);
    // Deep bell stack
    [120, 240, 360, 480].forEach((f, i) => {
      tone(f, 2.2 - i * 0.15, 0.26 - i * 0.04, "sine");
    });
    // Choir cascade — staggered 80ms apart
    [0, 0.08, 0.16, 0.26].forEach((offset, i) => {
      tone(660 + i * 110, 1.8 - i * 0.2, 0.10 - i * 0.015, "sine", offset);
    });
    // High glitter sparkles
    for (let i = 0; i < 8; i++) {
      tone(1800 + Math.random() * 900, 0.3, 0.055, "sine", 0.35 + i * 0.05);
    }
  }
}