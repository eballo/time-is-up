import { createElement } from "../util/dom.js";
import { parseNames } from "../core/standup-run.js";
import { clampMinutesPerPerson } from "../services/preferences.js";
import { formatRoughMinutes, minutesToSeconds } from "../util/time-format.js";

/** The configuration screen: who is speaking, for how long, and in what order. */
export class SetupScreen {
  #elements;
  #translator;
  #preferences;
  #onStart;

  #order;
  #switchMode;

  constructor({ elements, translator, preferences, onStart }) {
    this.#elements = elements;
    this.#translator = translator;
    this.#preferences = preferences;
    this.#onStart = onStart;

    this.#order = preferences.order;
    this.#switchMode = preferences.switchMode;

    this.#bindEvents();
    this.#restoreSavedValues();
  }

  get order() {
    return this.#order;
  }

  get switchMode() {
    return this.#switchMode;
  }

  get namesText() {
    return this.#elements.names.value;
  }

  get names() {
    return parseNames(this.namesText);
  }

  get minutesPerPerson() {
    return clampMinutesPerPerson(this.#elements.minutes.value);
  }

  get canStart() {
    return this.names.length > 0;
  }

  /** Persist what the run was configured with. */
  saveValues() {
    this.#preferences.names = this.namesText;
    this.#preferences.minutesPerPerson = this.minutesPerPerson;
  }

  /** Re-render every translated string plus the estimate. */
  renderText() {
    const el = this.#elements;
    const t = (key) => this.#translator.translate(key);

    el.names.placeholder = t("namesPlaceholder");
    el.peopleLabel.textContent = t("people");
    el.peopleHint.textContent = t("peopleHint");
    el.minutesLabel.textContent = t("minutesLabel");
    el.orderLabel.textContent = t("order");
    el.orderAlphabetical.textContent = t("orderAlpha");
    el.orderRandom.textContent = t("orderRandom");
    el.switchModeLabel.textContent = t("changeMode");
    el.switchModeAutomatic.textContent = t("modeAuto");
    el.switchModeManual.textContent = t("modeManual");
    el.start.textContent = t("start");
    el.helpTitle.textContent = t("helpTitle");

    this.#renderHelpBody();
    this.refreshEstimate();
  }

  refreshEstimate() {
    const people = this.names.length;
    this.#elements.start.disabled = people === 0;

    if (people === 0) {
      this.#elements.estimate.textContent = this.#translator.translate("addPeople");
      return;
    }

    const minutes = this.minutesPerPerson;
    let text = this.#translator.format("estimate", {
      people: this.#translator.countPeople(people),
      min: this.#translator.minuteValue(minutes),
      total: formatRoughMinutes(people * minutesToSeconds(minutes))
    });
    // In manual mode the total is only a guide: turns end when you say so.
    if (this.#switchMode === "manual") {
      text += this.#translator.translate("estimateManualSuffix");
    }
    this.#elements.estimate.textContent = text;
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

    el.names.addEventListener("input", () => this.refreshEstimate());
    el.minutes.addEventListener("input", () => this.refreshEstimate());
    el.minutes.addEventListener("change", () => {
      el.minutes.value = this.minutesPerPerson;
      this.refreshEstimate();
    });

    el.orderAlphabetical.addEventListener("click", () => this.#setOrder("alphabetical"));
    el.orderRandom.addEventListener("click", () => this.#setOrder("random"));
    el.switchModeAutomatic.addEventListener("click", () => this.#setSwitchMode("automatic"));
    el.switchModeManual.addEventListener("click", () => this.#setSwitchMode("manual"));
    el.start.addEventListener("click", () => this.#onStart());
  }

  #restoreSavedValues() {
    const savedNames = this.#preferences.names;
    if (savedNames) this.#elements.names.value = savedNames;

    const savedMinutes = this.#preferences.minutesPerPerson;
    if (savedMinutes !== null) this.#elements.minutes.value = savedMinutes;

    this.#reflectOrder();
    this.#reflectSwitchMode();
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
