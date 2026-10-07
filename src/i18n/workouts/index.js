/*
 * The day-by-day programme, one file per language. Each file holds the same
 * days in the same order, so a day is picked by its position whatever the
 * language. A language without a file here falls back to English.
 *
 * To add a day, add it at the end of every file; the picker follows.
 */
import ca from "./ca.js";
import en from "./en.js";
import es from "./es.js";
import fr from "./fr.js";
import nl from "./nl.js";

export const workoutsByLanguage = { ca, en, es, fr, nl };

/** How many times each block's exercises are gone through. */
export const ROUNDS_PER_BLOCK = 3;

export function workoutsFor(code) {
  return workoutsByLanguage[code] ?? workoutsByLanguage.en;
}
