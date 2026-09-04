/**
 * A session is a sequence of timed segments.
 *
 * A stand-up is one segment per person. A workout alternates exercise and rest,
 * with no rest hanging off the end. Everything downstream — the timer, the
 * screens, the summary — works on segments, so neither mode needs its own copy
 * of the turn-taking logic.
 *
 * Holds no timer and touches no DOM: the app drives it and reads it back.
 */

export const SEGMENT = {
  /** Someone's turn to speak. */
  turn: "turn",
  /** An exercise being performed. */
  exercise: "exercise",
  /** Recovery between exercises; not something you "did". */
  rest: "rest"
};

/** One line per entry, blanks dropped. Used for both people and exercises. */
export function parseLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Unbiased shuffle (Fisher–Yates); does not touch the input. */
export function shuffle(entries) {
  const result = entries.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * @param {string[]} names
 * @param {"alphabetical"|"random"} order
 * @param {(a: string, b: string) => number} compare  locale-aware comparator
 */
export function orderNames(names, order, compare) {
  return order === "alphabetical" ? names.slice().sort(compare) : shuffle(names);
}

export const ITEM_STATUS = {
  done: "done",
  current: "current",
  upcoming: "upcoming"
};

export class Session {
  #segments;
  #index = 0;
  #results = [];

  /** @param {{label: string, seconds: number, kind: string}[]} segments */
  constructor(segments) {
    if (!segments.length) throw new Error("A session needs at least one segment");
    this.#segments = segments;
  }

  /** Everyone speaks for the same length; every exercise runs for the same length. */
  static forStandup(names, secondsPerPerson) {
    return new Session(
      names.map((label) => ({ label, seconds: secondsPerPerson, kind: SEGMENT.turn }))
    );
  }

  /**
   * Exercise, rest, exercise, … with the trailing rest dropped: the workout is
   * over when the last exercise is, not a rest later.
   */
  static forTraining(exercises, workSeconds, restSeconds) {
    const segments = [];
    exercises.forEach((label, index) => {
      segments.push({ label, seconds: workSeconds, kind: SEGMENT.exercise });
      if (restSeconds > 0 && index < exercises.length - 1) {
        segments.push({ label: null, seconds: restSeconds, kind: SEGMENT.rest });
      }
    });
    return new Session(segments);
  }

  get current() {
    return this.#segments[this.#index];
  }

  get currentLabel() {
    return this.current.label;
  }

  get currentSeconds() {
    return this.current.seconds;
  }

  get isResting() {
    return this.current.kind === SEGMENT.rest;
  }

  get isLast() {
    return this.#index >= this.#segments.length - 1;
  }

  /** The next segment, whatever its kind. */
  get nextSegment() {
    return this.#segments[this.#index + 1] ?? null;
  }

  /**
   * The next thing you will actually do, skipping past a rest — during a rest
   * this is what the screen should be telling you to get ready for.
   */
  get nextItemLabel() {
    for (let i = this.#index + 1; i < this.#segments.length; i += 1) {
      if (this.#segments[i].kind !== SEGMENT.rest) return this.#segments[i].label;
    }
    return null;
  }

  /* ---- items: the segments worth listing, i.e. everything but rests ---- */

  get items() {
    return this.#segments.filter((segment) => segment.kind !== SEGMENT.rest);
  }

  get totalItems() {
    return this.items.length;
  }

  /** 1-based position among items; during a rest, the item just completed. */
  get currentItemPosition() {
    let count = 0;
    for (let i = 0; i <= this.#index; i += 1) {
      if (this.#segments[i].kind !== SEGMENT.rest) count += 1;
    }
    return Math.max(1, count);
  }

  /**
   * During a rest nothing is "current", so the item that just finished reads as
   * done and the queue points at what is coming.
   */
  statusOfItem(itemIndex) {
    const position = this.currentItemPosition;
    const activeIndex = this.isResting ? position : position - 1;
    if (itemIndex < activeIndex) return ITEM_STATUS.done;
    if (itemIndex === activeIndex && !this.isResting) return ITEM_STATUS.current;
    if (itemIndex === activeIndex && this.isResting) return ITEM_STATUS.upcoming;
    return ITEM_STATUS.upcoming;
  }

  /* ---- progress ---- */

  recordCurrent(spentSeconds) {
    const spent = Math.max(0, spentSeconds);
    // Rests are part of the elapsed total but not something you performed.
    this.#results.push({
      label: this.currentLabel,
      kind: this.current.kind,
      spentSeconds: spent,
      targetSeconds: this.currentSeconds,
      deltaSeconds: spent - this.currentSeconds
    });
  }

  /** @returns {boolean} false when the session is over. */
  advance() {
    if (this.isLast) return false;
    this.#index += 1;
    return true;
  }

  /** What to list in the summary: performed segments, rests excluded. */
  get results() {
    return this.#results.filter((entry) => entry.kind !== SEGMENT.rest);
  }

  /** Wall time the whole session took, rests included. */
  get totalSpentSeconds() {
    return this.#results.reduce((total, entry) => total + entry.spentSeconds, 0);
  }

  /** Time spent actually doing things, which is what the per-item target is about. */
  get workedSpentSeconds() {
    return this.results.reduce((total, entry) => total + entry.spentSeconds, 0);
  }

  /** Time spent recovering. Zero for a stand-up, and for a workout with no rest. */
  get restSpentSeconds() {
    return this.#results
      .filter((entry) => entry.kind === SEGMENT.rest)
      .reduce((total, entry) => total + entry.spentSeconds, 0);
  }
}
