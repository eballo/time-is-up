import { createElement } from "../util/dom.js";
import { parseLines } from "../core/session.js";
import { clampMinutesPerPerson, clampRestSeconds } from "../services/preferences.js";
import { formatRoughMinutes, minutesToSeconds } from "../util/time-format.js";

export const MODE = { standup: "standup", training: "training" };

/**
 * The configuration screen for both modes.
 *
 * The two modes share one list box and one duration field — only their labels
 * and the fields beside them differ — so switching modes swaps the saved text
 * in and out rather than duplicating the markup.
 */
export class SetupScreen {
  #elements;
  #translator;
  #preferences;
  #onStart;
  #onModeChange;

  #mode;
  #order;
  #switchMode;

  constructor({ elements, translator, preferences, onStart, onModeChange }) {
    this.#elements = elements;
    this.#translator = translator;
    this.#preferences = preferences;
    this.#onStart = onStart;
    this.#onModeChange = onModeChange;

    this.#mode = preferences.mode;
    this.#order = preferences.order;
    this.#switchMode = preferences.switchMode;

    this.#bindEvents();
    this.#restoreSavedValues();
  }

  get mode() {
    return this.#mode;
  }

  get isTraining() {
    return this.#mode === MODE.training;
  }

  get order() {
    return this.#order;
  }

  get switchMode() {
    return this.#switchMode;
  }

  /** The people, or the exercises — whichever mode is showing. */
  get entries() {
    return parseLines(this.#elements.entries.value);
  }

  get minutesPerItem() {
    return clampMinutesPerPerson(this.#elements.minutes.value);
  }

  get restSeconds() {
    return this.isTraining ? clampRestSeconds(this.#elements.rest.value) : 0;
  }

  get canStart() {
    return this.entries.length > 0;
  }

  /** Persist what this run was configured with. */
  saveValues() {
    this.#saveEntriesFor(this.#mode);
    if (this.isTraining) {
      this.#preferences.minutesPerExercise = this.minutesPerItem;
      this.#preferences.restSeconds = this.restSeconds;
    } else {
      this.#preferences.minutesPerPerson = this.minutesPerItem;
    }
  }

  renderText() {
    const el = this.#elements;
    const t = (key) => this.#translator.translate(key);
    const training = this.isTraining;

    el.modeStandupLabel.textContent = t("modeStandup");
    el.modeTrainingLabel.textContent = t("modeTraining");
    el.modeGroup.setAttribute("aria-label", t("modeLabel"));

    el.entries.placeholder = t(training ? "exercisesPlaceholder" : "namesPlaceholder");
    el.entriesLabel.textContent = t(training ? "exercises" : "people");
    el.entriesHint.textContent = t(training ? "exercisesHint" : "peopleHint");
    el.minutesLabel.textContent = t(training ? "minutesPerExerciseLabel" : "minutesLabel");
    el.restLabel.textContent = t("restLabel");
    el.restHint.textContent = t("restHint");

    el.orderLabel.textContent = t("order");
    el.orderAlphabetical.textContent = t("orderAlpha");
    el.orderRandom.textContent = t("orderRandom");
    el.switchModeLabel.textContent = t(training ? "changeModeTraining" : "changeMode");
    el.switchModeAutomatic.textContent = t("modeAuto");
    el.switchModeManual.textContent = t("modeManual");
    el.start.textContent = t("start");
    el.helpTitle.textContent = t("helpTitle");

    this.#renderHelpBody();
    this.refreshEstimate();
  }

  refreshEstimate() {
    const count = this.entries.length;
    this.#elements.start.disabled = count === 0;

    if (count === 0) {
      this.#elements.estimate.textContent = this.#translator.translate(
        this.isTraining ? "addExercises" : "addPeople"
      );
      return;
    }

    this.#elements.estimate.textContent = this.isTraining
      ? this.#trainingEstimate(count)
      : this.#standupEstimate(count);
  }

  #standupEstimate(people) {
    const minutes = this.minutesPerItem;
    let text = this.#translator.format("estimate", {
      people: this.#translator.countPeople(people),
      min: this.#translator.minuteValue(minutes),
      total: formatRoughMinutes(people * minutesToSeconds(minutes))
    });
    // In manual mode the total is only a guide: turns end when you say so.
    if (this.#switchMode === "manual") {
      text += this.#translator.translate("estimateManualSuffix");
    }
    return text;
  }

  #trainingEstimate(exercises) {
    const minutes = this.minutesPerItem;
    const rest = this.restSeconds;
    // Rests sit between exercises, so there is one fewer of them.
    const totalSeconds = exercises * minutesToSeconds(minutes) + Math.max(0, exercises - 1) * rest;
    let text = this.#translator.format("estimateTraining", {
      items: this.#translator.countExercises(exercises),
      min: this.#translator.minuteValue(minutes),
      rest: rest > 0 ? `${rest} s` : this.#translator.translate("restNone"),
      total: formatRoughMinutes(totalSeconds)
    });
    if (this.#switchMode === "manual") {
      text += this.#translator.translate("estimateManualSuffix");
    }
    return text;
  }

  #renderHelpBody() {
    const fragment = document.createDocumentFragment();
    for (const line of String(this.#translator.translate("helpText")).split("\n")) {
      fragment.appendChild(createElement("p", null, line));
    }
    this.#elements.helpText.innerHTML = "";
    this.#elements.helpText.appendChild(fragment);
  }

  #bindEvents() {
    const el = this.#elements;

    el.modeStandup.addEventListener("click", () => this.#setMode(MODE.standup));
    el.modeTraining.addEventListener("click", () => this.#setMode(MODE.training));

    el.entries.addEventListener("input", () => this.refreshEstimate());
    el.minutes.addEventListener("input", () => this.refreshEstimate());
    el.minutes.addEventListener("change", () => {
      el.minutes.value = this.minutesPerItem;
      this.refreshEstimate();
    });
    el.rest.addEventListener("input", () => this.refreshEstimate());
    el.rest.addEventListener("change", () => {
      el.rest.value = this.restSeconds;
      this.refreshEstimate();
    });

    el.orderAlphabetical.addEventListener("click", () => this.#setOrder("alphabetical"));
    el.orderRandom.addEventListener("click", () => this.#setOrder("random"));
    el.switchModeAutomatic.addEventListener("click", () => this.#setSwitchMode("automatic"));
    el.switchModeManual.addEventListener("click", () => this.#setSwitchMode("manual"));
    el.start.addEventListener("click", () => this.#onStart());
  }

  #restoreSavedValues() {
    const el = this.#elements;
    el.entries.value = this.#savedEntriesFor(this.#mode);
    el.minutes.value = this.#savedMinutesFor(this.#mode);
    el.rest.value = this.#preferences.restSeconds ?? clampRestSeconds(null);
    this.#reflectMode();
    this.#reflectOrder();
    this.#reflectSwitchMode();
  }

  #setMode(mode) {
    if (mode === this.#mode) return;
    // Hold on to what was typed for the mode being left.
    this.#saveEntriesFor(this.#mode);
    this.#saveMinutesFor(this.#mode);

    this.#mode = mode;
    this.#preferences.mode = mode;

    this.#elements.entries.value = this.#savedEntriesFor(mode);
    this.#elements.minutes.value = this.#savedMinutesFor(mode);
    this.#reflectMode();
    this.renderText();
    this.#onModeChange(mode);
  }

  #savedEntriesFor(mode) {
    return mode === MODE.training ? this.#preferences.exercises : this.#preferences.names;
  }

  #saveEntriesFor(mode) {
    const value = this.#elements.entries.value;
    if (mode === MODE.training) this.#preferences.exercises = value;
    else this.#preferences.names = value;
  }

  #savedMinutesFor(mode) {
    const saved =
      mode === MODE.training
        ? this.#preferences.minutesPerExercise
        : this.#preferences.minutesPerPerson;
    return saved ?? clampMinutesPerPerson(null);
  }

  #saveMinutesFor(mode) {
    const value = this.minutesPerItem;
    if (mode === MODE.training) this.#preferences.minutesPerExercise = value;
    else this.#preferences.minutesPerPerson = value;
  }

  #reflectMode() {
    const training = this.isTraining;
    this.#elements.modeStandup.setAttribute("aria-pressed", String(!training));
    this.#elements.modeTraining.setAttribute("aria-pressed", String(training));
    // Rest belongs to a workout; running order belongs to a stand-up, where a
    // workout's sequence is deliberate and must not be shuffled.
    this.#elements.restField.hidden = !training;
    this.#elements.orderField.hidden = training;
  }

  #setOrder(order) {
    this.#order = order;
    this.#preferences.order = order;
    this.#reflectOrder();
  }

  #setSwitchMode(mode) {
    this.#switchMode = mode;
    this.#preferences.switchMode = mode;
    this.#reflectSwitchMode();
    this.refreshEstimate();
  }

  #reflectOrder() {
    const isAlphabetical = this.#order === "alphabetical";
    this.#elements.orderAlphabetical.setAttribute("aria-pressed", String(isAlphabetical));
    this.#elements.orderRandom.setAttribute("aria-pressed", String(!isAlphabetical));
  }

  #reflectSwitchMode() {
    const isAutomatic = this.#switchMode === "automatic";
    this.#elements.switchModeAutomatic.setAttribute("aria-pressed", String(isAutomatic));
    this.#elements.switchModeManual.setAttribute("aria-pressed", String(!isAutomatic));
  }
}
