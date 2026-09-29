/** Tiny synthesized sounds (WebAudio), so no audio assets are needed. */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playShot(): void {
  const a = audio();
  if (!a) return;
  const len = 0.5;
  const buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / a.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 14);
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(3200, a.currentTime);
  lp.frequency.exponentialRampToValueAtTime(300, a.currentTime + len);
  const g = a.createGain();
  g.gain.value = 0.55;
  src.connect(lp).connect(g).connect(a.destination);
  src.start();
}

export function playRing(): void {
  const a = audio();
  if (!a) return;
  for (const [f, v] of [[1180, 0.18], [2710, 0.07]] as const) {
    const o = a.createOscillator();
    o.frequency.value = f;
    const g = a.createGain();
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 1.1);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + 1.2);
  }
}

export function playThud(): void {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(140, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(50, a.currentTime + 0.2);
  const g = a.createGain();
  g.gain.setValueAtTime(0.15, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.25);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + 0.3);
}
