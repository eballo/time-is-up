/**
 * One speaker's countdown.
 *
 * The remaining time is derived from a wall-clock deadline rather than counted
 * down one second per callback. Browsers throttle timers in hidden tabs and
 * stop them entirely while the machine sleeps, so a decrementing counter
 * silently freezes the moment someone switches away mid stand-up — and every
 * recorded time is then wrong by the same amount.
 *
 * Knows nothing about the DOM: it reports, the caller decides.
 */

/** Sub-second polling so the display lands on each new second promptly. */
const POLL_INTERVAL_MS = 250;

export class TurnTimer {
  #durationSeconds = 0;
  #remainingSeconds = 0;
  #deadlineAt = null;
  #intervalId = null;
  #hasReachedZero = false;

  #onSecondChanged;
  #onReachedZero;

  /**
   * @param {object} handlers
   * @param {(remainingSeconds: number) => void} handlers.onSecondChanged
   * @param {() => void} handlers.onReachedZero  fired once per turn
   */
  constructor({ onSecondChanged = () => {}, onReachedZero = () => {} } = {}) {
    this.#onSecondChanged = onSecondChanged;
    this.#onReachedZero = onReachedZero;
  }

  get isRunning() {
    return this.#intervalId !== null;
  }

  get durationSeconds() {
    return this.#durationSeconds;
  }

  /** Counts below zero once the turn runs over. */
  get remainingSeconds() {
    return this.#remainingSeconds;
  }

  /** Time actually spent on this turn, never negative. */
  get elapsedSeconds() {
    return Math.max(0, this.#durationSeconds - this.#remainingSeconds);
  }

  /** Begin a fresh turn of the given length. */
  start(durationSeconds) {
    this.#durationSeconds = durationSeconds;
    this.#remainingSeconds = durationSeconds;
    this.#hasReachedZero = false;
    this.resume();
  }

  resume() {
    this.stop();
    this.#deadlineAt = Date.now() + this.#remainingSeconds * 1000;
    this.#intervalId = setInterval(() => this.#tick(), POLL_INTERVAL_MS);
  }

  /** Freeze at the exact current value; paused time is not charged to anyone. */
  pause() {
    this.#syncToClock();
    this.#deadlineAt = null;
    this.stop();
  }

  stop() {
    if (this.#intervalId === null) return;
    clearInterval(this.#intervalId);
    this.#intervalId = null;
  }

  /**
   * Recompute from the clock and emit if the whole second changed. Safe to
   * call directly — the app does so when a hidden tab becomes visible again,
   * rather than waiting for the next throttled callback.
   */
  refresh() {
    this.#tick();
  }

  #syncToClock() {
    if (!this.isRunning || this.#deadlineAt === null) return;
    this.#remainingSeconds = Math.ceil((this.#deadlineAt - Date.now()) / 1000);
  }

  #tick() {
    const previous = this.#remainingSeconds;
    this.#syncToClock();
    if (this.#remainingSeconds === previous) return;

    if (this.#remainingSeconds <= 0 && !this.#hasReachedZero) {
      this.#hasReachedZero = true;
      this.#onReachedZero();
    }
    this.#onSecondChanged(this.#remainingSeconds);
  }
}
