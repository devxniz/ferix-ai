const SOUND_STORAGE_KEY = "ferix_sound_enabled_v1";

let audioCtx: AudioContext | null = null;
let soundEnabledCache: boolean | null = null;

function readStoredPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (raw === null) return true;
    return raw !== "false";
  } catch {
    return true;
  }
}

export function isSoundEnabled(): boolean {
  if (soundEnabledCache === null) {
    soundEnabledCache = readStoredPreference();
  }
  return soundEnabledCache;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabledCache = enabled;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    } catch {
      // Ignore storage errors
    }
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextCtor();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume().catch(() => {
      // Ignore autoplay resume rejection before user interaction
    });
  }
  return audioCtx;
}

/**
 * 1. Soft Cyber Tap: crisp 40ms high-tech glass click (600Hz -> 900Hz sine, gain: 0.08)
 */
export function playCyberTap(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.004);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch {
    // Ignore audio errors
  }
}

/**
 * 2. Message Sent Whoosh: smooth 140ms upward plasma swoosh (250Hz -> 650Hz, gain: 0.12)
 */
export function playMessageWhoosh(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.14);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Ignore audio errors
  }
}

/**
 * 3. Ferix AI Reply Chime: soft two-note crystalline chime (E5 -> B5 +80ms, 300ms fade-out, gain: 0.1)
 */
export function playReplyChime(): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes: Array<{ freq: number; offset: number }> = [
      { freq: 659.25, offset: 0 }, // E5
      { freq: 987.77, offset: 0.08 }, // B5 (+80ms)
    ];

    for (const note of notes) {
      const start = now + note.offset;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, start);

      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.linearRampToValueAtTime(0.1, start + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 0.31);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.32);
    }
  } catch {
    // Ignore audio errors
  }
}
