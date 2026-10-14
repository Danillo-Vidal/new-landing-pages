/** Port for the "lesson unlocked" sound. Swap the implementation to use an audio file later. */
export interface UnlockSound {
  /**
   * MUST be called inside the user gesture (the "Liberar aula" click): browsers only allow
   * creating/resuming audio there. Never throws.
   */
  play(options: { readonly volume: number; readonly delayMs: number }): void;
}

/** Notes of the chime: C5 · E5 · G5 with a soft C6 tail, ~90 ms apart. */
const CHIME = [
  { frequency: 523.25, type: 'sine', peak: 0.5, decay: 0.45 },
  { frequency: 659.25, type: 'sine', peak: 0.5, decay: 0.45 },
  { frequency: 783.99, type: 'triangle', peak: 0.4, decay: 0.45 },
  { frequency: 1046.5, type: 'sine', peak: 0.3, decay: 0.8 },
] as const satisfies readonly {
  frequency: number;
  type: OscillatorType;
  peak: number;
  decay: number;
}[];

const NOTE_GAP_S = 0.09;
const TICK_S = 0.02;

/** Short low-passed noise burst: the mechanical "click" of the lock. */
function scheduleTick(context: AudioContext, output: AudioNode, startAt: number) {
  const length = Math.floor(context.sampleRate * TICK_S);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    samples[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 2000;
  noise.connect(lowpass).connect(output);
  noise.start(startAt);
}

function scheduleChime(context: AudioContext, output: AudioNode, startAt: number) {
  CHIME.forEach((note, index) => {
    const start = startAt + 0.06 + index * NOTE_GAP_S;
    const oscillator = context.createOscillator();
    oscillator.type = note.type;
    oscillator.frequency.value = note.frequency;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(note.peak, start + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + note.decay);
    oscillator.connect(envelope).connect(output);
    oscillator.start(start);
    oscillator.stop(start + note.decay + 0.05);
  });
}

/** Synthesized with the Web Audio API: no files, no network. */
export class WebAudioUnlockSound implements UnlockSound {
  private context: AudioContext | null = null;

  play({ volume, delayMs }: { readonly volume: number; readonly delayMs: number }): void {
    if (document.hidden) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => undefined);
      const master = this.context.createGain();
      master.gain.value = volume;
      master.connect(this.context.destination);
      const startAt = this.context.currentTime + delayMs / 1000;
      scheduleTick(this.context, master, startAt);
      scheduleChime(this.context, master, startAt);
    } catch {
      // Audio is a nice-to-have: a failure must never break the unlock flow.
    }
  }
}
