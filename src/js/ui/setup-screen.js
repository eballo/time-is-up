import { createElement, replaceChildren } from "../util/dom.js";
import { Session, parseBlocks, parseLines, workoutDayBlocks } from "../core/session.js";
import { workoutsFor, ROUNDS_PER_BLOCK } from "../../i18n/workouts/index.js";
import { createFigure, figuresForDay } from "./exercise-figures.js";
import {
  clampMinutesPerPerson,
  clampRestSeconds,
  clampBlockRestSeconds,
  clampSecondsPerExercise,
  MIN_SECONDS_PER_EXERCISE,
  MAX_SECONDS_PER_EXERCISE
} from "../services/preferences.js";
import { formatRoughMinutes, minutesToSeconds } from "../util/time-format.js";

export const MODE = { standup: "standup", training: "training" };

/**
 * The configuration screen for both modes.
 *
 * The two modes share one list box and one duration field — only their labels
 * and the fields beside them differ — so switching modes swaps the saved text
 * in and out rather than duplicating the markup.
 *
 * Training can also run a day of the built-in programme instead of the list:
 * the box then gives way to a read-only preview of that day.
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
  /* True while the exercise box still holds the built-in workout. It follows
     the language and is never saved, until the first edit makes it yours. */
  #showingDefaultExercises = false;
  /** 1-based programme day, or null for your own list. */
  #workoutDay;

  constructor({ elements, translator, preferences, onStart, onModeChange }) {
    this.#elements = elements;
    this.#translator = translator;
    this.#preferences = preferences;
    this.#onStart = onStart;
    this.#onModeChange = onModeChange;

    this.#mode = preferences.mode;
    this.#order = preferences.order;
    this.#switchMode = preferences.switchMode;
    this.#workoutDay = preferences.workoutDay;

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
    const blocks = this.workoutBlocks;
    if (blocks) return blocks.flatMap((block) => block.items.map((item) => item.label));
    return parseLines(this.#elements.entries.value);
  }

  /** The chosen programme day, ready for Session.forTraining; null otherwise. */
  get workoutBlocks() {
    const day = this.#selectedDay;
    return day
      ? workoutDayBlocks(day, ROUNDS_PER_BLOCK, figuresForDay(this.#workoutDay - 1))
      : null;
  }

  get #days() {
    return workoutsFor(this.#translator.language);
  }

  get #selectedDay() {
    if (!this.isTraining || this.#workoutDay === null) return null;
    return this.#days[this.#workoutDay - 1] ?? null;
  }

  /** The workout as blocks: the chosen day's, or the box split on blank lines. */
  get trainingBlocks() {
    return this.workoutBlocks ?? parseBlocks(this.#elements.entries.value);
  }

  /** The duration field holds minutes for a stand-up and seconds for a workout. */
  get secondsPerItem() {
    return this.isTraining
      ? clampSecondsPerExercise(this.#elements.minutes.value)
      : minutesToSeconds(this.#minutesPerPerson);
  }

  get #minutesPerPerson() {
    return clampMinutesPerPerson(this.#elements.minutes.value);
  }

  /** The field's value, cleaned up, in whichever unit the mode uses. */
  get #durationFieldValue() {
    return this.isTraining ? this.secondsPerItem : this.#minutesPerPerson;
  }

  get restSeconds() {
    return this.isTraining ? clampRestSeconds(this.#elements.rest.value) : 0;
  }

  get blockRestSeconds() {
    return this.isTraining ? clampBlockRestSeconds(this.#elements.blockRest.value) : 0;
  }

  get canStart() {
    return this.entries.length > 0;
  }

  /** Persist what this run was configured with. */
  saveValues() {
    this.#saveEntriesFor(this.#mode);
    if (this.isTraining) {
      this.#preferences.secondsPerExercise = this.secondsPerItem;
      this.#preferences.restSeconds = this.restSeconds;
      this.#preferences.blockRestSeconds = this.blockRestSeconds;
    } else {
      this.#preferences.minutesPerPerson = this.#minutesPerPerson;
    }
  }

  renderText() {
    const el = this.#elements;
    const t = (key) => this.#translator.translate(key);
    const training = this.isTraining;

    el.modeStandupLabel.textContent = t("modeStandup");
    el.modeTrainingLabel.textContent = t("modeTraining");
    el.modeGroup.setAttribute("aria-label", t("modeLabel"));

    if (training && this.#showingDefaultExercises) el.entries.value = t("exercisesDefault");
    el.entries.placeholder = t(training ? "exercisesPlaceholder" : "namesPlaceholder");
    el.entriesLabel.textContent = t(training ? "exercises" : "people");
    el.entriesHint.textContent = this.#selectedDay
      ? this.#translator.format("workoutHint", { rounds: ROUNDS_PER_BLOCK })
      : t(training ? "exercisesHint" : "peopleHint");
    el.workoutLabel.textContent = t("workoutLabel");
    this.#renderWorkoutPicker();
    this.#renderWorkoutPreview();
    el.minutesLabel.textContent = t(training ? "secondsPerExerciseLabel" : "minutesLabel");
    el.restLabel.textContent = t("restLabel");
    el.restHint.textContent = t("restHint");
    el.blockRestLabel.textContent = t("blockRestLabel");
    el.blockRestHint.textContent = t("blockRestHint");

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
    const minutes = this.#minutesPerPerson;
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
    const seconds = this.secondsPerItem;
    const rest = this.restSeconds;
    // Built rather than multiplied out: which rests are the longer block
    // changes depends on where the blocks fall.
    const totalSeconds = Session.forTraining(
      this.trainingBlocks,
      seconds,
      rest,
      this.blockRestSeconds
    ).plannedSeconds;
    let text = this.#translator.format("estimateTraining", {
      items: this.#translator.countExercises(exercises),
      min: `${seconds} s`,
      rest: rest > 0 ? `${rest} s` : this.#translator.translate("restNone"),
      total: formatRoughMinutes(totalSeconds)
    });
    if (this.#switchMode === "manual") {
      text += this.#translator.translate("estimateManualSuffix");
    }
    return text;
  }

  #renderWorkoutPicker() {
    const fragment = document.createDocumentFragment();
    const custom = createElement("option", null, this.#translator.translate("workoutCustom"));
    custom.value = "";
    fragment.appendChild(custom);
    this.#days.forEach((day, index) => {
      const option = createElement(
        "option",
        null,
        this.#translator.format("workoutDay", { n: index + 1, title: day.title })
      );
      option.value = String(index + 1);
      fragment.appendChild(option);
    });
    replaceChildren(this.#elements.workout, fragment);
    this.#elements.workout.value = this.#selectedDayValue;
  }

  get #selectedDayValue() {
    return this.#workoutDay !== null && this.#days[this.#workoutDay - 1]
      ? String(this.#workoutDay)
      : "";
  }

  /** Each block once, with what every exercise involves. */
  #renderWorkoutPreview() {
    const day = this.#selectedDay;
    const figures = day ? figuresForDay(this.#workoutDay - 1) : null;
    const fragment = document.createDocumentFragment();
    day?.blocks.forEach(({ title, exercises }, index) => {
      const block = createElement("section", "workout-block");
      // Same colours as the running screen, so a block looks the same in both.
      block.dataset.block = String((index % 4) + 1);
      block.appendChild(
        createElement("h3", null, this.#translator.format("blockTitle", { i: index + 1, title }))
      );
      const list = createElement("ol");
      exercises.forEach(([name, description], e) => {
        const row = createElement("li");
        const figure = createFigure(figures?.[index]?.[e]);
        if (figure) {
          row.classList.add("has-figure");
          row.appendChild(figure);
        }
        const text = createElement("span", "text");
        text.appendChild(createElement("span", "name", name));
        text.appendChild(createElement("span", "desc", description));
        row.appendChild(text);
        list.appendChild(row);
      });
      block.appendChild(list);
      fragment.appendChild(block);
    });
    replaceChildren(this.#elements.workoutPreview, fragment);
  }

  #setWorkoutDay(value) {
    this.#workoutDay = value === "" ? null : Number(value);
    this.#preferences.workoutDay = this.#workoutDay;
    this.#reflectMode();
    this.renderText();
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

    el.workout.addEventListener("change", () => this.#setWorkoutDay(el.workout.value));
    el.entries.addEventListener("input", () => {
      if (this.isTraining) this.#showingDefaultExercises = false;
      this.refreshEstimate();
    });
    el.minutes.addEventListener("input", () => this.refreshEstimate());
    el.minutes.addEventListener("change", () => {
      el.minutes.value = this.#durationFieldValue;
      this.refreshEstimate();
    });
    el.blockRest.addEventListener("input", () => this.refreshEstimate());
    el.blockRest.addEventListener("change", () => {
      el.blockRest.value = this.blockRestSeconds;
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
    el.minutes.value = this.#savedDurationFor(this.#mode);
    el.rest.value = this.#preferences.restSeconds ?? clampRestSeconds(null);
    el.blockRest.value = this.#preferences.blockRestSeconds ?? clampBlockRestSeconds(null);
    this.#reflectMode();
    this.#reflectOrder();
    this.#reflectSwitchMode();
  }

  #setMode(mode) {
    if (mode === this.#mode) return;
    // Hold on to what was typed for the mode being left.
    this.#saveEntriesFor(this.#mode);
    this.#saveDurationFor(this.#mode);

    this.#mode = mode;
    this.#preferences.mode = mode;

    this.#elements.entries.value = this.#savedEntriesFor(mode);
    this.#reflectMode();
    this.#elements.minutes.value = this.#savedDurationFor(mode);
    this.renderText();
    this.#onModeChange(mode);
  }

  #savedEntriesFor(mode) {
    if (mode !== MODE.training) return this.#preferences.names;
    const saved = this.#preferences.exercises;
    this.#showingDefaultExercises = saved === null;
    return saved ?? this.#translator.translate("exercisesDefault");
  }

  #saveEntriesFor(mode) {
    const value = this.#elements.entries.value;
    if (mode === MODE.training) {
      if (!this.#showingDefaultExercises) this.#preferences.exercises = value;
    } else {
      this.#preferences.names = value;
    }
  }

  #savedDurationFor(mode) {
    return mode === MODE.training
      ? this.#preferences.secondsPerExercise ?? clampSecondsPerExercise(null)
      : this.#preferences.minutesPerPerson ?? clampMinutesPerPerson(null);
  }

  /** Called before the mode flips, so the field still holds the old unit. */
  #saveDurationFor(mode) {
    if (mode === MODE.training) this.#preferences.secondsPerExercise = this.secondsPerItem;
    else this.#preferences.minutesPerPerson = this.#minutesPerPerson;
  }

  #reflectMode() {
    const training = this.isTraining;
    this.#elements.modeStandup.setAttribute("aria-pressed", String(!training));
    this.#elements.modeTraining.setAttribute("aria-pressed", String(training));
    // Rest belongs to a workout; running order belongs to a stand-up, where a
    // workout's sequence is deliberate and must not be shuffled.
    this.#elements.restField.hidden = !training;
    this.#elements.blockRestField.hidden = !training;
    // Same field, different unit: seconds in steps of 5, or minutes in halves.
    const field = this.#elements.minutes;
    field.min = training ? MIN_SECONDS_PER_EXERCISE : "0.5";
    field.max = training ? MAX_SECONDS_PER_EXERCISE : "10";
    field.step = training ? "5" : "0.5";
    this.#elements.orderField.hidden = training;
    // A programme day replaces the box with its preview.
    const day = this.#selectedDay !== null;
    this.#elements.workoutField.hidden = !training;
    this.#elements.entries.hidden = day;
    this.#elements.workoutPreview.hidden = !day;
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
