import { createElement, replaceChildren } from "../util/dom.js";
import { formatDuration, formatDelta, secondsToMinutes } from "../util/time-format.js";
import { MODE } from "./setup-screen.js";

/** The closing scoreboard: what each person actually used, and the total. */
export class SummaryScreen {
  #elements;
  #translator;
  #mode = MODE.standup;

  constructor({ elements, translator }) {
    this.#elements = elements;
    this.#translator = translator;
  }

  /** @param {string} mode one of MODE; defaults to the last one rendered. */
  renderText(mode = this.#mode) {
    this.#mode = mode;
    const training = mode === MODE.training;
    this.#elements.title.textContent = this.#translator.translate(
      training ? "workoutDone" : "standupDone"
    );
    this.#elements.again.textContent = this.#translator.translate("restart");
  }

  render(session, mode) {
    this.renderText(mode);

    const results = session.results;
    const total = session.totalSpentSeconds;

    this.#elements.subtitle.textContent =
      mode === MODE.training
        ? this.#translator.format("doneSubTraining", {
            items: this.#translator.countExercises(results.length),
            // Rests are wall time but not effort, so the two are shown apart.
            worked: formatDuration(session.workedSpentSeconds),
            total: formatDuration(total)
          })
        : this.#translator.format("doneSub", {
            people: this.#translator.countPeople(results.length),
            total: formatDuration(total),
            target: this.#translator.minuteValue(
              secondsToMinutes(results[0]?.targetSeconds ?? 0)
            )
          });

    const fragment = document.createDocumentFragment();
    results.forEach((result, index) => {
      fragment.appendChild(this.#buildResultRow(result, index));
    });
    // Rest is not an exercise, but it is part of where the time went, so it is
    // shown once as its own line rather than folded silently into the total.
    const restSeconds = session.restSpentSeconds;
    if (restSeconds > 0) fragment.appendChild(this.#buildRestRow(restSeconds));
    fragment.appendChild(this.#buildTotalRow(total));

    replaceChildren(this.#elements.list, fragment);
  }

  #buildResultRow({ label, spentSeconds, deltaSeconds }, index) {
    const row = createElement("li");
    row.appendChild(createElement("span", "num", String(index + 1)));
    row.appendChild(createElement("span", "name", label));
    row.appendChild(createElement("span", "time", formatDuration(spentSeconds)));

    const delta = createElement("span", "delta", formatDelta(deltaSeconds));
    if (deltaSeconds > 1) delta.classList.add("over");
    else if (deltaSeconds < -1) delta.classList.add("under");
    row.appendChild(delta);

    return row;
  }

  #buildRestRow(restSeconds) {
    const row = createElement("li", "aside");
    row.appendChild(createElement("span", "num", ""));
    row.appendChild(createElement("span", "name", this.#translator.translate("restingNow")));
    row.appendChild(createElement("span", "time", formatDuration(restSeconds)));
    row.appendChild(createElement("span", "delta", ""));
    return row;
  }

  #buildTotalRow(totalSeconds) {
    const row = createElement("li", "total");
    row.appendChild(createElement("span", "num", ""));
    row.appendChild(createElement("span", "name", this.#translator.translate("total")));
    row.appendChild(createElement("span", "time", formatDuration(totalSeconds)));
    row.appendChild(createElement("span", "delta", ""));
    return row;
  }
}
