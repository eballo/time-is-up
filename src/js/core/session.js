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
 * Blocks of entries, a blank line closing one block and opening the next.
 * A list with no blank lines is a single block.
 */
export function parseBlocks(text) {
  return text
    .split(/\n\s*\n/)
    .map(parseLines)
    .filter((block) => block.length > 0);
}

/**
 * A programme day as Session.forTraining takes it: each block's exercises
 * gone through `rounds` times — A, B, A, B, … — before moving on.
 *
 * @param {{blocks: {title: string, exercises: [string, string][]}[]}} day
 * @param {string[][]} [figures]  a figure id per exercise, as [block][exercise]
 */
export function workoutDayBlocks(day, rounds, figures = null) {
  return day.blocks.map(({ title, exercises }, b) => ({
    title,
    items: Array.from({ length: rounds }, () =>
      exercises.map(([label, description], e) => ({
        label,
        description,
        figure: figures?.[b]?.[e] ?? null
      }))
    ).flat()
  }));
}

/**
 * @param {string[]} names
 * @param {"alphabetical"|"random"} order
 * @param {(a: string, b: string) => number} compare  locale-aware comparator
 */
export function orderNames(names, order, compare) {
  return order === "alphabetical" ? names.slice().sort(compare) : shuffle(names);
}

/** Every shape forTraining accepts, as [{title, items}]. */
function toBlocks(exercises) {
  if (!exercises.length) return [];
  const first = exercises[0];
  if (Array.isArray(first)) return exercises.map((items) => ({ title: null, items }));
  if (first.items) return exercises.map(({ title = null, items }) => ({ title, items }));
  return [{ title: null, items: exercises }];
}

function toItem(item) {
  return typeof item === "string"
    ? { label: item, description: null, figure: null }
    : { label: item.label, description: item.description ?? null, figure: item.figure ?? null };
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

  /** @param {{label: string, seconds: number, kind: string, block?: number, blockTitle?: string, description?: string}[]} segments */
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
   *
   * Takes a flat list, a list of blocks, or a list of {title, items} blocks;
   * an item is a label or a {label, description}.
   *
   * The rest between two blocks is `blockRestSeconds` — longer, as a rule —
   * and stands in for the ordinary rest there rather than adding to it.
   */
  static forTraining(exercises, workSeconds, restSeconds, blockRestSeconds = restSeconds) {
    const flat = toBlocks(exercises).flatMap(({ title, items }, block) =>
      items.map((item) => ({ ...toItem(item), block, blockTitle: title }))
    );
    const segments = [];
    flat.forEach((exercise, index) => {
      segments.push({ ...exercise, seconds: workSeconds, kind: SEGMENT.exercise });
      if (index === flat.length - 1) return;
      // A rest belongs to the block it leads into, so the one before a new
      // block is where that block gets announced.
      const { block, blockTitle } = flat[index + 1];
      const seconds = block !== exercise.block ? blockRestSeconds : restSeconds;
      if (seconds > 0) {
        segments.push({ label: null, seconds, kind: SEGMENT.rest, block, blockTitle });
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

  /**
   * How the exercise is done. During a rest, the one coming up — that is the
   * one worth reading about while you get into position.
   */
  get currentDescription() {
    return this.#upcomingExercise?.description ?? null;
  }

  /** The figure that shows the exercise, picked the same way as the description. */
  get currentFigure() {
    return this.#upcomingExercise?.figure ?? null;
  }

  /** The current segment, or during a rest the next one that is not. */
  get #upcomingExercise() {
    for (let i = this.#index; i < this.#segments.length; i += 1) {
      if (this.#segments[i].kind !== SEGMENT.rest) return this.#segments[i];
    }
    return null;
  }

  /** The block's name, when the workout gives its blocks one. */
  get currentBlockTitle() {
    return this.current.blockTitle ?? null;
  }

  get currentSeconds() {
    return this.current.seconds;
  }

  get isResting() {
    return this.current.kind === SEGMENT.rest;
  }

  /* ---- blocks: only a workout split by blank lines has more than one ---- */

  get totalBlocks() {
    return new Set(this.#segments.map((segment) => segment.block ?? 0)).size;
  }

  /** 1-based block of the current segment; a rest counts as the block ahead. */
  get currentBlockPosition() {
    return (this.current.block ?? 0) + 1;
  }

  /** What the whole session adds up to if every segment runs to time. */
  get plannedSeconds() {
    return this.#segments.reduce((total, segment) => total + segment.seconds, 0);
  }

  /** True for the rest that leads from one block into the next. */
  get isBlockChange() {
    const previous = this.#segments[this.#index - 1];
    return this.isResting && previous !== undefined && previous.block !== this.current.block;
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
