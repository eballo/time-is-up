/**
 * One stand-up: who speaks, in what order, and how long each of them took.
 *
 * Holds no timer and touches no DOM — the app drives it and reads it back.
 */

/** One name per line, blanks dropped. */
export function parseNames(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Unbiased shuffle (Fisher–Yates); does not touch the input. */
export function shuffle(names) {
  const result = names.slice();
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

export const TURN_STATUS = {
  done: "done",
  current: "current",
  upcoming: "upcoming"
};

export class StandupRun {
  #names;
  #secondsPerPerson;
  #turnIndex = 0;
  #results = [];

  /**
   * @param {object} options
   * @param {string[]} options.names  already in speaking order
   * @param {number} options.secondsPerPerson
   */
  constructor({ names, secondsPerPerson }) {
    this.#names = names.slice();
    this.#secondsPerPerson = secondsPerPerson;
  }

  get names() {
    return this.#names.slice();
  }

  get secondsPerPerson() {
    return this.#secondsPerPerson;
  }

  get totalPeople() {
    return this.#names.length;
  }

  /** 1-based, for display. */
  get position() {
    return this.#turnIndex + 1;
  }

  get currentName() {
    return this.#names[this.#turnIndex];
  }

  get nextName() {
    return this.#names[this.#turnIndex + 1] ?? null;
  }

  get isLastTurn() {
    return this.#turnIndex >= this.#names.length - 1;
  }

  statusOf(index) {
    if (index < this.#turnIndex) return TURN_STATUS.done;
    if (index === this.#turnIndex) return TURN_STATUS.current;
    return TURN_STATUS.upcoming;
  }

  /** Close the current turn with the time actually spent on it. */
  recordCurrentTurn(spentSeconds) {
    this.#results.push({
      name: this.currentName,
      spentSeconds: Math.max(0, spentSeconds),
      deltaSeconds: Math.max(0, spentSeconds) - this.#secondsPerPerson
    });
  }

  /** @returns {boolean} false when that was the last person. */
  advance() {
    if (this.isLastTurn) return false;
    this.#turnIndex += 1;
    return true;
  }

  /** @returns {{name: string, spentSeconds: number, deltaSeconds: number}[]} */
  get results() {
    return this.#results.slice();
  }

  get totalSpentSeconds() {
    return this.#results.reduce((total, entry) => total + entry.spentSeconds, 0);
  }
}
