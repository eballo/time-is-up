/**
 * The audible cues, synthesised with WebAudio so the app ships no audio files.
 *
 * Methods are named for the moment they mark rather than the sound they make,
 * so call sites read as intent: chime.timeUp(), not beep(3, 880).
 */
export class Chime {
  #audioContext = null;

  /** Lazily created: browsers only allow this after a user gesture. */
  #context() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    this.#audioContext ??= new AudioContextClass();
    return this.#audioContext;
  }

  #play(count, frequency) {
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

        const toneStart = startedAt + index * 0.28;
        gain.gain.setValueAtTime(0.0001, toneStart);
        gain.gain.exponentialRampToValueAtTime(0.3, toneStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + 0.22);
        oscillator.start(toneStart);
        oscillator.stop(toneStart + 0.24);
      }
    } catch {
      // No audio output available; silence is an acceptable outcome here.
    }
  }

  /** One tick per digit of the start countdown. */
  countdownTick() {
    this.#play(1, 620);
  }

  /** The count-in is over and the first person is up. */
  turnStarting() {
    this.#play(2, 920);
  }

  /** A speaker's time has run out. */
  timeUp() {
    this.#play(3, 880);
  }

  /** The whole stand-up is done. */
  standupFinished() {
    this.#play(2, 880);
  }
}
