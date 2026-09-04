import { createElement, replaceChildren } from "../util/dom.js";
import { formatCountdown } from "../util/time-format.js";
import { ITEM_STATUS } from "../core/session.js";
import { MODE } from "./setup-screen.js";

/** Fraction of the segment left at which the clock changes colour. */
const WARN_THRESHOLD = 0.4;
const DANGER_THRESHOLD = 0.15;

/**
 * The stage: who or what is up, how long is left, and what is queued.
 *
 * A rest is deliberately kept off the green→amber→red ramp. Running out of rest
 * is not a problem to warn anyone about, so it gets its own cool colour and the
 * screen turns into a heads-up for the exercise about to start.
 */
export class RunningScreen {
  #elements;
  #translator;
  /* Remembered so the class attributes are only written when they change. The
     clock ticks four times a second, and rewriting className that often
     restarted its colour transition before it could ever finish — leaving the
     clock stuck on the previous colour. */
  #clockSeverity;
  #progressSeverity;

  constructor({ elements, translator }) {
    this.#elements = elements;
    this.#translator = translator;
  }

  renderText() {
    this.#elements.overtimeNote.textContent = this.#translator.translate("overtimeNote");
    this.#elements.reset.textContent = this.#translator.translate("reset");
  }

  /** Label the pause button for what pressing it would do. */
  renderPauseButton(isPaused) {
    this.#elements.pause.textContent = this.#translator.translate(isPaused ? "resume" : "pause");
  }

  /** During a rest, the forward button is offering to cut the rest short. */
  renderNextButton(isResting) {
    this.#elements.next.textContent = this.#translator.translate(isResting ? "skipRest" : "next");
  }

  /** Everything that changes when the segment changes. */
  renderSegment(session, { mode, switchMode }) {
    const el = this.#elements;
    const training = mode === MODE.training;

    if (session.isResting) {
      el.eyebrow.textContent = this.#translator.translate("restingNow");
      // What you are getting ready for is the useful thing to read here.
      el.speaker.textContent = session.nextItemLabel ?? "";
      el.turnCount.textContent = this.#translator.format("exerciseXofY", {
        i: session.currentItemPosition + 1,
        n: session.totalItems
      });
      el.nextUp.textContent = "";
    } else {
      el.eyebrow.textContent = this.#eyebrowFor(training, switchMode);
      el.speaker.textContent = session.currentLabel;
      el.turnCount.textContent = this.#translator.format(
        training ? "exerciseXofY" : "personXofY",
        { i: session.currentItemPosition, n: session.totalItems }
      );
      el.nextUp.textContent = session.nextItemLabel
        ? this.#translator.format("nextIs", { name: session.nextItemLabel })
        : this.#translator.translate(training ? "lastExercise" : "lastPerson");
    }

    this.renderNextButton(session.isResting);
    this.renderQueue(session);
  }

  /** Everything that changes every second. */
  renderClock(remainingSeconds, durationSeconds, { switchMode, isResting }) {
    const el = this.#elements;
    el.clock.textContent = formatCountdown(remainingSeconds);

    const remainingFraction = remainingSeconds / durationSeconds;
    const severity = isResting
      ? "resting"
      : this.#severityFor(remainingSeconds, remainingFraction);
    this.#setSeverity(severity);

    // Only manual mode leaves the decision to a human, so only it needs the nudge.
    el.overtimeNote.hidden = !(remainingSeconds < 0 && switchMode === "manual");

    const progress = Math.max(0, Math.min(100, (1 - remainingFraction) * 100));
    el.progressFill.style.width = `${progress}%`;
  }

  #setSeverity(severity) {
    if (severity === this.#clockSeverity) return;
    this.#clockSeverity = severity;
    this.#elements.clock.className = severity ? `clock ${severity}` : "clock";

    // The bar has no separate overtime look; it just stays in the danger colour.
    const barSeverity = severity === "over" ? "danger" : severity;
    if (barSeverity === this.#progressSeverity) return;
    this.#progressSeverity = barSeverity;
    this.#elements.progressBar.className = barSeverity ? `progress ${barSeverity}` : "progress";
  }

  /** Show the stage behind the count-in overlay before the clock starts. */
  primeFor(session) {
    const el = this.#elements;
    el.speaker.textContent = session.currentLabel;
    el.clock.textContent = formatCountdown(session.currentSeconds);
    el.clock.className = "clock";
    el.progressBar.className = "progress";
    this.#clockSeverity = null;
    this.#progressSeverity = null;
    this.renderQueue(session);
  }

  renderQueue(session) {
    const fragment = document.createDocumentFragment();

    session.items.forEach((item, index) => {
      const status = session.statusOfItem(index);
      const row = createElement("li", status === ITEM_STATUS.upcoming ? null : status);
      row.appendChild(createElement("span", "num", String(index + 1)));
      row.appendChild(createElement("span", "name", item.label));

      if (status === ITEM_STATUS.current) {
        row.appendChild(createElement("span", "tag", this.#translator.translate("tagNow")));
      } else if (status === ITEM_STATUS.done) {
        row.appendChild(createElement("span", "tag", this.#translator.translate("tagDone")));
      }
      fragment.appendChild(row);
    });

    replaceChildren(this.#elements.queue, fragment);
  }

  #eyebrowFor(training, switchMode) {
    const base = this.#translator.translate(training ? "modeTraining" : "nowSpeaking");
    return switchMode === "manual"
      ? `${base} · ${this.#translator.translate("manualTag")}`
      : base;
  }

  #severityFor(remainingSeconds, remainingFraction) {
    if (remainingSeconds < 0) return "over";
    if (remainingFraction <= DANGER_THRESHOLD) return "danger";
    if (remainingFraction <= WARN_THRESHOLD) return "warn";
    return null;
  }
}
