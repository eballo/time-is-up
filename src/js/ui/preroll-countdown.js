import { restartAnimation, prefersReducedMotion } from "../util/dom.js";

export const PREROLL_SECONDS = 5;

/**
 * The "get ready" count-in shown over the stage before the first speaker.
 *
 * On the same wall clock as the turn timer, for the same reason: tabbing away
 * during the count-in must not leave the run parked on "5".
 */
export class PrerollCountdown {
  #root;
  #label;
  #number;
  #hint;
  #translator;
  #chime;
  #onFinish;

  #intervalId = null;
  #endsAt = null;
  #displayedNumber = null;

  constructor({ root, label, number, hint, translator, chime, onFinish }) {
    this.#root = root;
    this.#label = label;
    this.#number = number;
    this.#hint = hint;
    this.#translator = translator;
    this.#chime = chime;
    this.#onFinish = onFinish;

    root.addEventListener("click", () => this.skip());
  }

  get isActive() {
    return this.#intervalId !== null;
  }

  renderText() {
    this.#label.textContent = this.#translator.translate("getReady");
    this.#hint.textContent = this.#translator.translate("prerollSkip");
  }

  start(seconds = PREROLL_SECONDS) {
    this.cancel();
    this.renderText();
    this.#root.hidden = false;
    this.#endsAt = Date.now() + seconds * 1000;
    this.#show(seconds);
    this.#intervalId = setInterval(() => this.#tick(), 200);
  }

  /** Jump straight to the run; used by the click handler and the keyboard. */
  skip() {
    if (!this.isActive) return;
    this.#finish();
  }

  /** Stop without starting the run — for Reset during the count-in. */
  cancel() {
    if (this.#intervalId !== null) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
    this.#endsAt = null;
    this.#root.hidden = true;
  }

  #tick() {
    const remaining = Math.ceil((this.#endsAt - Date.now()) / 1000);
    if (remaining <= 0) {
      this.#finish();
    } else if (remaining !== this.#displayedNumber) {
      this.#show(remaining);
    }
  }

  #show(value) {
    this.#displayedNumber = value;
    this.#number.textContent = String(value);
    if (!prefersReducedMotion()) restartAnimation(this.#number, "pop");
    this.#chime.countdownTick();
  }

  #finish() {
    this.cancel();
    this.#chime.turnStarting();
    this.#onFinish();
  }
}
