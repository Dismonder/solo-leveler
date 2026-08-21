import { getGlobalVolume, getSystemAudioEnabled } from "./audio";

let audioCtx: AudioContext | null = null;
const lastPlayedAt = new Map<string, number>();

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      void audioCtx.resume().catch(() => undefined);
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function shouldPlay(soundId: string, throttleMs = 60): boolean {
  if (!getSystemAudioEnabled() || getGlobalVolume() <= 0) return false;
  const now = performance.now();
  const last = lastPlayedAt.get(soundId) ?? 0;
  if (now - last < throttleMs) return false;
  lastPlayedAt.set(soundId, now);
  return true;
}

/** Generates a short noise buffer for whooshes, impacts and explosions */
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = Math.max(1, Math.floor(sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** Normal attack / slash sound */
export function playIdleAttackSfx(critical = false): void {
  if (!shouldPlay("idle-attack", 75)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = getGlobalVolume() * (critical ? 0.35 : 0.22);

  // 1. Blade whoosh (filtered noise)
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.12);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(critical ? 3200 : 2200, now);
  filter.frequency.exponentialRampToValueAtTime(critical ? 600 : 400, now + 0.12);
  filter.Q.setValueAtTime(3, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol * 0.9, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);

  // 2. Blade tone / metallic slice
  const osc = ctx.createOscillator();
  osc.type = critical ? "sawtooth" : "triangle";
  osc.frequency.setValueAtTime(critical ? 780 : 540, now);
  osc.frequency.exponentialRampToValueAtTime(critical ? 120 : 80, now + 0.1);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(vol * 0.7, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

/** Impact hit / damage sound */
export function playIdleHitSfx(target: "enemy" | "hero", critical = false): void {
  if (!shouldPlay("idle-hit", 60)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = getGlobalVolume() * (critical ? 0.4 : 0.25);

  const osc = ctx.createOscillator();
  osc.type = target === "hero" ? "square" : "sine";
  osc.frequency.setValueAtTime(critical ? 260 : 180, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + (critical ? 0.18 : 0.12));

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (critical ? 0.18 : 0.12));

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);

  if (critical) {
    // Metal impact crunch
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.1);
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1400, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  }
}

/** Skill 1: Rozszczep Południka (Meridian Rend) - heavy energy slash */
export function playSkillRendSfx(): void {
  if (!shouldPlay("skill-rend", 200)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = getGlobalVolume() * 0.45;

  // Energy charge up & slash
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.28);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(4000, now);
  filter.frequency.exponentialRampToValueAtTime(800, now + 0.28);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol * 0.4, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.32);
}

/** Skill 2: Skok przez Szew (Seam Step) - shadow warp & barrier */
export function playSkillStepSfx(): void {
  if (!shouldPlay("skill-step", 200)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = getGlobalVolume() * 0.38;

  // Warp glide
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.exponentialRampToValueAtTime(1400, now + 0.09);
  osc.frequency.exponentialRampToValueAtTime(350, now + 0.24);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol * 0.8, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.26);
}

/** Skill 3: Deszcz Odłamków (Shard Rain) - crystal ping & glass shatter */
export function playSkillShardSfx(hitIndex = 0): void {
  if (!shouldPlay(`skill-shard-${hitIndex}`, 40)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = getGlobalVolume() * 0.32;
  const pitch = 1400 + hitIndex * 160;

  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.04);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, now + 0.12);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.14);
}

/** Skill 4: Zew Ech (Echo Call) - spectral roar / void summon */
export function playSkillEchoSfx(): void {
  if (!shouldPlay("skill-echo", 250)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = getGlobalVolume() * 0.42;

  // Dark drone
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.linearRampToValueAtTime(240, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.45);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.linearRampToValueAtTime(1800, now + 0.15);
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.45);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol * 0.3, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.5);
}

/** Skill 5: Ostatni Południk (Last Meridian - Ultimate) - apocalyptic lightning crash */
export function playSkillUltimateSfx(): void {
  if (!shouldPlay("skill-ultimate", 500)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = getGlobalVolume() * 0.65;

  // 1. Sub-bass charge & shockwave
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(90, now);
  sub.frequency.linearRampToValueAtTime(180, now + 0.12);
  sub.frequency.exponentialRampToValueAtTime(30, now + 0.6);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(vol * 0.9, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

  sub.connect(subGain);
  subGain.connect(ctx.destination);
  sub.start(now);
  sub.stop(now + 0.7);

  // 2. Cosmic lightning thunder explosion
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.55);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(4500, now);
  filter.frequency.exponentialRampToValueAtTime(350, now + 0.55);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
}

/** Monster / Enemy defeat dissolve sound */
export function playIdleEnemyDeathSfx(isBoss = false): void {
  if (!shouldPlay(isBoss ? "boss-death" : "enemy-death", 200)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = getGlobalVolume() * (isBoss ? 0.6 : 0.3);

  const osc = ctx.createOscillator();
  osc.type = isBoss ? "sawtooth" : "sine";
  osc.frequency.setValueAtTime(isBoss ? 220 : 160, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + (isBoss ? 0.6 : 0.25));

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (isBoss ? 0.65 : 0.28));

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + (isBoss ? 0.7 : 0.3));

  if (isBoss) {
    // Victory chord fanfare: C5, E5, G5, C6
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const chime = ctx.createOscillator();
      chime.type = "triangle";
      chime.frequency.setValueAtTime(freq, now + 0.15 + i * 0.08);

      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(vol * 0.45, now + 0.15 + i * 0.08);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + i * 0.08);

      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now + 0.15 + i * 0.08);
      chime.stop(now + 0.7 + i * 0.08);
    });
  }
}

/** Upgrade success sound (Skills, Equipment, Summons, Abyss) */
export function playIdleUpgradeSfx(): void {
  if (!shouldPlay("idle-upgrade", 150)) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const vol = getGlobalVolume() * 0.35;

  // 3-note ascending chime
  [587.33, 739.99, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.06);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, now + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22 + i * 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.06);
    osc.stop(now + 0.25 + i * 0.06);
  });
}
