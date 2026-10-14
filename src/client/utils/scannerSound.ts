// Scanner Audio and Vibration Engine
// Combina archivos MP3 (pip.mp3 y error.mp3) con sintetizador Web Audio API de respaldo infalible

let audioContext: AudioContext | null = null;
let pipAudio: HTMLAudioElement | null = null;
let errorAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  return audioContext;
}

export function initMobileAudio() {
  if (typeof window === 'undefined') return;

  if (!pipAudio) {
    pipAudio = new Audio('/sounds/pip.mp3');
    pipAudio.preload = 'auto';
  }
  if (!errorAudio) {
    errorAudio = new Audio('/sounds/error.mp3');
    errorAudio.preload = 'auto';
  }

  // Desbloquear AudioContext y elementos de audio en móvil
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  if (pipAudio) {
    pipAudio.play().then(() => {
      pipAudio?.pause();
      if (pipAudio) pipAudio.currentTime = 0;
    }).catch(() => {});
  }
  if (errorAudio) {
    errorAudio.play().then(() => {
      errorAudio?.pause();
      if (errorAudio) errorAudio.currentTime = 0;
    }).catch(() => {});
  }

  isAudioUnlocked = true;
}

// Sonido ¡PIP! (Entrada Válida / Primer Ingreso)
export function playSuccessSound() {
  if (typeof window === 'undefined') return;

  // 1. Intentar con MP3
  let played = false;
  if (!pipAudio) {
    pipAudio = new Audio('/sounds/pip.mp3');
  }

  try {
    pipAudio.currentTime = 0;
    pipAudio.volume = 1.0;
    const p = pipAudio.play();
    if (p !== undefined) {
      p.then(() => {
        played = true;
      }).catch(() => {
        // Fallback al sintetizador Web Audio API si el navegador bloquea el audio element
        synthesizePip();
      });
    }
  } catch {
    synthesizePip();
  }

  // 2. Vibración móvil corta (100ms)
  triggerVibrate(true);
}

// Sonido ¡BEEP-BEEP! / Alarma (Entrada Ya Utilizada / Duplicada / Rechazada)
export function playAlertSound() {
  if (typeof window === 'undefined') return;

  // 1. Intentar con MP3
  if (!errorAudio) {
    errorAudio = new Audio('/sounds/error.mp3');
  }

  try {
    errorAudio.currentTime = 0;
    errorAudio.volume = 1.0;
    const p = errorAudio.play();
    if (p !== undefined) {
      p.catch(() => {
        synthesizeBuzzer();
      });
    }
  } catch {
    synthesizeBuzzer();
  }

  // 2. Vibración móvil de alerta (patrón distintivo)
  triggerVibrate(false);
}

// Respaldo Web Audio API: Piteo agudo de supermercado (¡PIP!)
function synthesizePip() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(1900, now + 0.1);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {
    console.warn('Audio synth error:', e);
  }
}

// Respaldo Web Audio API: Buzzer grave de advertencia (¡BEEP-BEEP!)
function synthesizeBuzzer() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Pulso 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(220, now);
    gain1.gain.setValueAtTime(0.7, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Pulso 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(220, now + 0.2);
    gain2.gain.setValueAtTime(0.7, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.35);
  } catch (e) {
    console.warn('Buzzer synth error:', e);
  }
}

// Vibración táctil
export function triggerVibrate(isSuccess: boolean) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (isSuccess) {
        navigator.vibrate(120);
      } else {
        // Alerta: vibrar - pausa - vibrar - pausa - vibrar largo
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    } catch {}
  }
}
