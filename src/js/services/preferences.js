const KEYS = {
  mode: "tiu.appMode",
  names: "tiu.names",
  exercises: "tiu.exercises",
  workoutDay: "tiu.workoutDay",
  secondsPerExercise: "tiu.exerciseSeconds",
  /** What versions up to 1.3.0 kept instead, in minutes. Read, never written. */
  minutesPerExercise: "tiu.exerciseMinutes",
  restSeconds: "tiu.rest",
  blockRestSeconds: "tiu.blockRest",
  minutes: "tiu.minutes",
  order: "tiu.order",
  switchMode: "tiu.mode",
  language: "tiu.lang",
  theme: "tiu.theme"
};

export const MIN_MINUTES_PER_PERSON = 0.5;
export const MAX_MINUTES_PER_PERSON = 10;
export const DEFAULT_MINUTES_PER_PERSON = 1.5;

export const MIN_SECONDS_PER_EXERCISE = 5;
export const MAX_SECONDS_PER_EXERCISE = 600;
export const DEFAULT_SECONDS_PER_EXERCISE = 20;

export const MIN_REST_SECONDS = 0;
export const MAX_REST_SECONDS = 300;
export const DEFAULT_REST_SECONDS = 30;
export const DEFAULT_BLOCK_REST_SECONDS = 60;

/** Keep a typed minutes value inside the range the input allows. */
export function clampMinutesPerPerson(value) {
  const parsed = Number.parseFloat(value);
  const safe = Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_MINUTES_PER_PERSON : parsed;
  return Math.min(MAX_MINUTES_PER_PERSON, Math.max(MIN_MINUTES_PER_PERSON, safe));
}

/** An exercise is short enough to think about in seconds too. */
export function clampSecondsPerExercise(value) {
  const parsed = Number.parseInt(value, 10);
  const safe = Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_SECONDS_PER_EXERCISE : parsed;
  return Math.min(MAX_SECONDS_PER_EXERCISE, Math.max(MIN_SECONDS_PER_EXERCISE, safe));
}

/** Rest is short enough to think about in seconds; 0 means straight through. */
export function clampRestSeconds(value) {
  const parsed = Number.parseInt(value, 10);
  const safe = Number.isNaN(parsed) || parsed < 0 ? DEFAULT_REST_SECONDS : parsed;
  return Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, safe));
}

/** Same range as the ordinary rest, but its own default. */
export function clampBlockRestSeconds(value) {
  const parsed = Number.parseInt(value, 10);
  const safe = Number.isNaN(parsed) || parsed < 0 ? DEFAULT_BLOCK_REST_SECONDS : parsed;
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

  /** null until something is saved, so the caller can offer its default workout. */
  get exercises() {
    return this.#read(KEYS.exercises);
  }

  set exercises(value) {
    this.#write(KEYS.exercises, value);
  }

  /** 1-based day of the programme, or null for your own list. */
  get workoutDay() {
    const day = Number.parseInt(this.#read(KEYS.workoutDay), 10);
    return Number.isInteger(day) && day > 0 ? day : null;
  }

  set workoutDay(value) {
    this.#write(KEYS.workoutDay, value === null ? "" : String(value));
  }

  /** Falls back to the minutes an earlier version saved, so nobody loses theirs. */
  get secondsPerExercise() {
    const stored = this.#read(KEYS.secondsPerExercise);
    if (stored !== null) return clampSecondsPerExercise(stored);
    const legacyMinutes = Number.parseFloat(this.#read(KEYS.minutesPerExercise));
    return Number.isNaN(legacyMinutes) ? null : clampSecondsPerExercise(Math.round(legacyMinutes * 60));
  }

  set secondsPerExercise(value) {
    this.#write(KEYS.secondsPerExercise, String(clampSecondsPerExercise(value)));
  }

  get restSeconds() {
    const stored = this.#read(KEYS.restSeconds);
    return stored === null ? null : clampRestSeconds(stored);
  }

  set restSeconds(value) {
    this.#write(KEYS.restSeconds, String(clampRestSeconds(value)));
  }

  get blockRestSeconds() {
    const stored = this.#read(KEYS.blockRestSeconds);
    return stored === null ? null : clampBlockRestSeconds(stored);
  }

  set blockRestSeconds(value) {
    this.#write(KEYS.blockRestSeconds, String(clampBlockRestSeconds(value)));
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
