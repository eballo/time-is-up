/**
 * The audible cues, synthesised with WebAudio so the app ships no audio files.
 *
 * Methods are named for the moment they mark rather than the sound they make,
 * so call sites read as intent: chime.timeUp(), not beep(3, 880).
 */

/** Rockets in the finale, as [delay before launch, starting pitch]. */
const FINALE_ROCKETS = [
  [0, 520],
  [0.3, 660],
  [0.56, 590]
];

const ROCKET_RISE = 0.26; // how long a rocket climbs before it bursts
const BURST_TAIL = 0.6; // how long the crackle takes to fade

export class Chime {
  #audioContext = null;
  #noise = null;

  /** Lazily created: browsers only allow this after a user gesture. */
  #context() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    this.#audioContext ??= new AudioContextClass();
    return this.#audioContext;
  }

  /** A plain tone, repeated. The workhorse behind the everyday cues. */
  #tone(count, frequency) {
    try {
      const context = this.#context();
      if (!context) return;
      const startedAt = context.currentTime;
      for (let index = 0; index < count; index += 1) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain).connect(context.destination);

        const at = startedAt + index * 0.28;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
        oscillator.start(at);
        oscillator.stop(at + 0.24);
      }
    } catch {
      // No audio output available; silence is an acceptable outcome here.
    }
  }

  /** One tick per digit of the start countdown. */
  countdownTick() {
    this.#tone(1, 620);
  }

  /** The count-in is over and the first person is up. */
  turnStarting() {
    this.#tone(2, 920);
  }

  /** A speaker's time has run out. */
  timeUp() {
    this.#tone(3, 880);
  }

  /**
   * The whole session is done — a small volley of fireworks to match the ones
   * on screen. Deliberately unlike the other cues: those mark a moment inside
   * the run, this one marks the end of it.
   */
  sessionFinished() {
    try {
      const context = this.#context();
      if (!context) return;
      const startedAt = context.currentTime;
      for (const [delay, pitch] of FINALE_ROCKETS) {
        this.#rocket(context, startedAt + delay, pitch);
        this.#burst(context, startedAt + delay + ROCKET_RISE);
      }
    } catch {
      // No audio output available.
    }
  }

  /** The whistle: a short rise in pitch, quiet, that sets up the bang. */
  #rocket(context, at, fromHz) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(fromHz, at);
    oscillator.frequency.exponentialRampToValueAtTime(fromHz * 3, at + ROCKET_RISE);

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.16, at + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + ROCKET_RISE);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + ROCKET_RISE + 0.02);
  }

  /**
   * The bang: white noise with a hard attack, swept downwards so it opens
   * bright and decays into a crackle rather than staying as hiss.
   */
  #burst(context, at) {
    const source = context.createBufferSource();
    source.buffer = this.#noiseBuffer(context);

    // Lowpass rather than bandpass: a bandpass narrow enough to sound like a
    // crack throws away most of the noise energy, leaving a thin tick.
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(3200, at);
    filter.frequency.exponentialRampToValueAtTime(220, at + BURST_TAIL);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.55, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + BURST_TAIL);

    source.connect(filter).connect(gain).connect(context.destination);
    source.start(at);
    source.stop(at + BURST_TAIL + 0.05);
  }

  /** One second of white noise, generated once and reused by every burst. */
  #noiseBuffer(context) {
    if (this.#noise) return this.#noise;
    const length = context.sampleRate;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) samples[i] = Math.random() * 2 - 1;
    this.#noise = buffer;
    return buffer;
  }
}
