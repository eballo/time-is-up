const KEYS = {
  mode: "tiu.appMode",
  names: "tiu.names",
  exercises: "tiu.exercises",
  minutesPerExercise: "tiu.exerciseMinutes",
  restSeconds: "tiu.rest",
  minutes: "tiu.minutes",
  order: "tiu.order",
  switchMode: "tiu.mode",
  language: "tiu.lang",
  theme: "tiu.theme"
};

export const MIN_MINUTES_PER_PERSON = 0.5;
export const MAX_MINUTES_PER_PERSON = 10;
export const DEFAULT_MINUTES_PER_PERSON = 1.5;

export const MIN_REST_SECONDS = 0;
export const MAX_REST_SECONDS = 300;
export const DEFAULT_REST_SECONDS = 30;

/** Keep a typed minutes value inside the range the input allows. */
export function clampMinutesPerPerson(value) {
  const parsed = Number.parseFloat(value);
  const safe = Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_MINUTES_PER_PERSON : parsed;
  return Math.min(MAX_MINUTES_PER_PERSON, Math.max(MIN_MINUTES_PER_PERSON, safe));
}

/** Rest is short enough to think about in seconds; 0 means straight through. */
export function clampRestSeconds(value) {
  const parsed = Number.parseInt(value, 10);
  const safe = Number.isNaN(parsed) || parsed < 0 ? DEFAULT_REST_SECONDS : parsed;
  return Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, safe));
}

/**
 * The saved settings, behind guarded accessors.
 *
 * Reading localStorage throws outright in Safari private browsing and wherever
 * the browser blocks site data. Losing the saved settings is acceptable;
 * taking the whole app down with them is not, so every access is caught here
 * and nowhere else has to think about it.
 */
export class Preferences {
  #read(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  #write(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Not persisted; the session still works with in-memory state.
    }
  }

  /** "standup" | "training" */
  get mode() {
    return this.#read(KEYS.mode) === "training" ? "training" : "standup";
  }

  set mode(value) {
    this.#write(KEYS.mode, value);
  }

  get names() {
    return this.#read(KEYS.names) ?? "";
  }

  set names(value) {
    this.#write(KEYS.names, value);
  }

  get minutesPerPerson() {
    const stored = this.#read(KEYS.minutes);
    return stored === null ? null : clampMinutesPerPerson(stored);
  }

  set minutesPerPerson(value) {
    this.#write(KEYS.minutes, String(clampMinutesPerPerson(value)));
  }

  get exercises() {
    return this.#read(KEYS.exercises) ?? "";
  }

  set exercises(value) {
    this.#write(KEYS.exercises, value);
  }

  get minutesPerExercise() {
    const stored = this.#read(KEYS.minutesPerExercise);
    return stored === null ? null : clampMinutesPerPerson(stored);
  }

  set minutesPerExercise(value) {
    this.#write(KEYS.minutesPerExercise, String(clampMinutesPerPerson(value)));
  }

  get restSeconds() {
    const stored = this.#read(KEYS.restSeconds);
    return stored === null ? null : clampRestSeconds(stored);
  }

  set restSeconds(value) {
    this.#write(KEYS.restSeconds, String(clampRestSeconds(value)));
  }

  /** "alphabetical" | "random". "alpha" is what versions up to 1.0.1 wrote. */
  get order() {
    const stored = this.#read(KEYS.order);
    return stored === "alphabetical" || stored === "alpha" ? "alphabetical" : "random";
  }

  set order(value) {
    this.#write(KEYS.order, value);
  }

  /** "automatic" | "manual" */
  get switchMode() {
    return this.#read(KEYS.switchMode) === "manual" ? "manual" : "automatic";
  }

  set switchMode(value) {
    this.#write(KEYS.switchMode, value);
  }

  get language() {
    return this.#read(KEYS.language);
  }

  set language(value) {
    this.#write(KEYS.language, value);
  }

  /** "light" | "dark" | null, where null means "follow the system". */
  get theme() {
    const stored = this.#read(KEYS.theme);
    return stored === "light" || stored === "dark" ? stored : null;
  }

  set theme(value) {
    this.#write(KEYS.theme, value);
  }
}
