import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  localDateKey,
  sanitizeHistory,
  withEntry,
  currentStreak,
  bestStreak,
  completedProgrammeDays
} from "../src/js/core/history.js";

const on = (...dates) => dates.map((date, i) => ({ date, day: i + 1 }));
const today = new Date(2026, 9, 7); // 7 October 2026, local time

describe("localDateKey", () => {
  test("uses the local calendar, zero-padded", () => {
    assert.equal(localDateKey(new Date(2026, 0, 5, 23, 30)), "2026-01-05");
  });
});

describe("currentStreak", () => {
  test("counts consecutive days ending today", () => {
    assert.equal(currentStreak(on("2026-10-05", "2026-10-06", "2026-10-07"), today), 3);
  });

  test("a streak that reached yesterday is still alive today", () => {
    assert.equal(currentStreak(on("2026-10-05", "2026-10-06"), today), 2);
  });

  test("a whole day without training breaks it", () => {
    assert.equal(currentStreak(on("2026-10-04", "2026-10-05"), today), 0);
  });

  test("two workouts on one day count once", () => {
    assert.equal(currentStreak(on("2026-10-07", "2026-10-07"), today), 1);
  });

  test("runs across a month boundary and the end of daylight saving", () => {
    const history = on("2026-09-29", "2026-09-30", "2026-10-01");
    assert.equal(currentStreak(history, new Date(2026, 9, 1)), 3);
    const autumn = on("2026-10-24", "2026-10-25", "2026-10-26");
    assert.equal(currentStreak(autumn, new Date(2026, 9, 26)), 3);
  });

  test("no history, no streak", () => {
    assert.equal(currentStreak([], today), 0);
  });
});

describe("bestStreak", () => {
  test("finds the longest run, wherever it is", () => {
    const history = on("2026-09-01", "2026-09-02", "2026-09-03", "2026-09-10", "2026-10-07");
    assert.equal(bestStreak(history), 3);
  });

  test("does not depend on the order entries were stored in", () => {
    assert.equal(bestStreak(on("2026-09-03", "2026-09-01", "2026-09-02")), 3);
  });
});

describe("the stored list", () => {
  test("junk from storage is dropped, not trusted", () => {
    assert.deepEqual(sanitizeHistory("nope"), []);
    assert.deepEqual(
      sanitizeHistory([{ date: "2026-10-07" }, null, { date: "yesterday" }, 5]),
      [{ date: "2026-10-07" }]
    );
  });

  test("the oldest entries go first once the limit is reached", () => {
    const history = withEntry(on("2026-10-01", "2026-10-02"), { date: "2026-10-03" }, 2);
    assert.deepEqual(history.map((entry) => entry.date), ["2026-10-02", "2026-10-03"]);
  });

  test("programme days done are listed; free lists are not", () => {
    const history = [{ date: "2026-10-01", day: 3 }, { date: "2026-10-02", day: null }, { date: "2026-10-03", day: 3 }];
    assert.deepEqual([...completedProgrammeDays(history)], [3]);
  });
});
