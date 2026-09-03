import { createElement, replaceChildren } from "../util/dom.js";
import { formatDuration, formatDelta, secondsToMinutes } from "../util/time-format.js";

/** The closing scoreboard: what each person actually used, and the total. */
export class SummaryScreen {
  #elements;
  #translator;

  constructor({ elements, translator }) {
    this.#elements = elements;
    this.#translator = translator;
  }

  renderText() {
    this.#elements.title.textContent = this.#translator.translate("standupDone");
    this.#elements.again.textContent = this.#translator.translate("restart");
  }

  render(run) {
    this.renderText();

    const results = run.results;
    const total = run.totalSpentSeconds;

    this.#elements.subtitle.textContent = this.#translator.format("doneSub", {
      people: this.#translator.countPeople(results.length),
      total: formatDuration(total),
      target: this.#translator.minuteValue(secondsToMinutes(run.secondsPerPerson))
    });

    const fragment = document.createDocumentFragment();
    results.forEach((result, index) => {
      fragment.appendChild(this.#buildResultRow(result, index));
    });
    fragment.appendChild(this.#buildTotalRow(total));

    replaceChildren(this.#elements.list, fragment);
  }

  #buildResultRow({ name, spentSeconds, deltaSeconds }, index) {
    const row = createElement("li");
    row.appendChild(createElement("span", "num", String(index + 1)));
    row.appendChild(createElement("span", "name", name));
    row.appendChild(createElement("span", "time", formatDuration(spentSeconds)));

    const delta = createElement("span", "delta", formatDelta(deltaSeconds));
    if (deltaSeconds > 1) delta.classList.add("over");
    else if (deltaSeconds < -1) delta.classList.add("under");
    row.appendChild(delta);

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
