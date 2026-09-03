import { createElement, replaceChildren } from "../util/dom.js";
import { formatCountdown } from "../util/time-format.js";
import { TURN_STATUS } from "../core/standup-run.js";

/** Fraction of the turn left at which the clock changes colour. */
const WARN_THRESHOLD = 0.4;
const DANGER_THRESHOLD = 0.15;

/** The stage: who is speaking, how long they have left, and who is queued. */
export class RunningScreen {
  #elements;
  #translator;

  constructor({ elements, translator }) {
    this.#elements = elements;
    this.#translator = translator;
  }

  renderText() {
    const el = this.#elements;
    el.overtimeNote.textContent = this.#translator.translate("overtimeNote");
    el.next.textContent = this.#translator.translate("next");
    el.reset.textContent = this.#translator.translate("reset");
  }

  /** Label the pause button for what pressing it would do. */
  renderPauseButton(isPaused) {
    this.#elements.pause.textContent = this.#translator.translate(
      isPaused ? "resume" : "pause"
    );
  }

  /** Everything that changes when the speaker changes. */
  renderTurn(run, switchMode) {
    const el = this.#elements;
    const speaking = this.#translator.translate("nowSpeaking");

    el.speaker.textContent = run.currentName;
    el.eyebrow.textContent =
      switchMode === "manual"
        ? `${speaking} · ${this.#translator.translate("manualTag")}`
        : speaking;
    el.turnCount.textContent = this.#translator.format("personXofY", {
      i: run.position,
      n: run.totalPeople
    });
    el.nextUp.textContent = run.nextName
      ? this.#translator.format("nextIs", { name: run.nextName })
      : this.#translator.translate("lastPerson");

    this.renderQueue(run);
  }

  /** Everything that changes every second. */
  renderClock(remainingSeconds, durationSeconds, switchMode) {
    const el = this.#elements;
    el.clock.textContent = formatCountdown(remainingSeconds);

    const remainingFraction = remainingSeconds / durationSeconds;
    const severity = this.#severityFor(remainingSeconds, remainingFraction);
    el.clock.className = severity ? `clock ${severity}` : "clock";

    // Only manual mode leaves the decision to a human, so only it needs the nudge.
    el.overtimeNote.hidden = !(remainingSeconds < 0 && switchMode === "manual");

    const progress = Math.max(0, Math.min(100, (1 - remainingFraction) * 100));
    el.progressFill.style.width = `${progress}%`;
    el.progressBar.className =
      severity === "over" ? "progress danger" : severity ? `progress ${severity}` : "progress";
  }

  /** Show the stage behind the count-in overlay before the clock starts. */
  primeFor(run) {
    const el = this.#elements;
    el.speaker.textContent = run.currentName;
    el.clock.textContent = formatCountdown(run.secondsPerPerson);
    el.clock.className = "clock";
    this.renderQueue(run);
  }

  renderQueue(run) {
    const fragment = document.createDocumentFragment();

    run.names.forEach((name, index) => {
      const status = run.statusOf(index);
      const item = createElement("li", status === TURN_STATUS.upcoming ? null : status);
      item.appendChild(createElement("span", "num", String(index + 1)));
      item.appendChild(createElement("span", "name", name));

      if (status === TURN_STATUS.current) {
        item.appendChild(createElement("span", "tag", this.#translator.translate("tagNow")));
      } else if (status === TURN_STATUS.done) {
        item.appendChild(createElement("span", "tag", this.#translator.translate("tagDone")));
      }
      fragment.appendChild(item);
    });

    replaceChildren(this.#elements.queue, fragment);
  }

  #severityFor(remainingSeconds, remainingFraction) {
    if (remainingSeconds < 0) return "over";
    if (remainingFraction <= DANGER_THRESHOLD) return "danger";
    if (remainingFraction <= WARN_THRESHOLD) return "warn";
    return null;
  }
}
