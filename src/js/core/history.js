/**
 * Finished workouts and the streak they add up to.
 *
 * An entry is { date: "YYYY-MM-DD", day: number|null, exercises, workedSeconds,
 * totalSeconds }, the date taken in the local calendar: a workout at 23:30
 * counts for that evening, wherever the clock's time zone puts UTC. Holds no
 * storage and touches no DOM; the app reads and writes the list.
 */

/** Plenty for years of daily training, and small enough to stay a few kB. */
export const HISTORY_LIMIT = 1000;

/** "2026-10-07" for the local calendar day the date falls on. */
export function localDateKey(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The key of the day before. Calendar arithmetic, so DST changes cannot skip a day. */
function previousDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return localDateKey(new Date(y, m - 1, d - 1));
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Drop anything that is not an entry — the list comes back from storage. */
export function sanitizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => entry && typeof entry.date === "string" && DATE_KEY.test(entry.date));
}

/** A new list with the entry at the end, the oldest dropped past the limit. */
export function withEntry(history, entry, limit = HISTORY_LIMIT) {
  return [...history, entry].slice(-limit);
}

/**
 * Days in a row with at least one workout, counting back from today. A streak
 * that reached yesterday is still alive today — it only breaks once a whole
 * day goes by without training.
 */
export function currentStreak(history, today = new Date()) {
  const days = new Set(history.map((entry) => entry.date));
  let key = localDateKey(today);
  if (!days.has(key)) key = previousDay(key);
  let streak = 0;
  while (days.has(key)) {
    streak += 1;
    key = previousDay(key);
  }
  return streak;
}

/** The longest run of consecutive training days ever. */
export function bestStreak(history) {
  const days = [...new Set(history.map((entry) => entry.date))].sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const key of days) {
    run = previous !== null && previousDay(key) === previous ? run + 1 : 1;
    best = Math.max(best, run);
    previous = key;
  }
  return best;
}

/** The programme days finished at least once, as day numbers. */
export function completedProgrammeDays(history) {
  return new Set(history.map((entry) => entry.day).filter((day) => Number.isInteger(day)));
}
