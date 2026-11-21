let sharedAudioCtx: AudioContext | null = null;
let listenersBound = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
}

export function bindAudioUnlockListeners(): void {
  if (typeof window === 'undefined' || listenersBound) return;
  listenersBound = true;

  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

/**
 * تشغيل نغمة تنبيه هادئة وواضحة لوصول طلب جديد في لوحة التحكم
 */
export async function playNewOrderChime(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const notes = [
      { freq: 587.33, start: 0, duration: 0.16, peak: 0.18 }, // D5
      { freq: 880.0, start: 0.14, duration: 0.2, peak: 0.22 }, // A5
      { freq: 1046.5, start: 0.28, duration: 0.34, peak: 0.2 }, // C6
    ];

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.0001, now + n.start);
      gain.gain.exponentialRampToValueAtTime(n.peak, now + n.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.duration + 0.02);
    }

    return true;
  } catch {
    return false;
  }
}
