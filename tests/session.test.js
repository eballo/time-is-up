import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  Session,
  SEGMENT,
  ITEM_STATUS,
  parseLines,
  orderNames,
  shuffle
} from "../src/js/core/session.js";

/** Walk a session to the end, collecting one value per segment. */
function walk(session, pick) {
  const seen = [];
  do {
    seen.push(pick(session));
  } while (session.advance());
  return seen;
}

describe("parseLines", () => {
  test("trims each line and drops the blank ones", () => {
    assert.deepEqual(parseLines("  Anna \n\n\tBernat\n   \nCarla\n"), [
      "Anna",
      "Bernat",
      "Carla"
    ]);
  });

  test("empty input yields no entries", () => {
    assert.deepEqual(parseLines("   \n\n"), []);
  });
});

describe("orderNames", () => {
  const compare = (a, b) => a.localeCompare(b, "en", { sensitivity: "base" });

  test("alphabetical ignores case", () => {
    assert.deepEqual(orderNames(["Carla", "anna", "Bernat"], "alphabetical", compare), [
      "anna",
      "Bernat",
      "Carla"
    ]);
  });

  test("neither ordering mutates the input", () => {
    const names = ["Carla", "Anna"];
    orderNames(names, "alphabetical", compare);
    orderNames(names, "random", compare);
    assert.deepEqual(names, ["Carla", "Anna"]);
  });

  test("random keeps every name exactly once", () => {
    const names = ["A", "B", "C", "D", "E"];
    const result = orderNames(names, "random", compare);
    assert.deepEqual([...result].sort(), [...names].sort());
  });

  test("shuffle does eventually reorder", () => {
    // Guards against a shuffle that silently returns the input untouched.
    const names = ["A", "B", "C", "D", "E", "F"];
    const moved = Array.from({ length: 40 }, () => shuffle(names)).some(
      (result) => result.join() !== names.join()
    );
    assert.ok(moved, "40 shuffles produced the original order every time");
  });
});

describe("a stand-up session", () => {
  test("is one segment per person, all the same length", () => {
    const session = Session.forStandup(["Anna", "Bernat", "Carla"], 90);
    assert.deepEqual(walk(session, (s) => s.currentLabel), ["Anna", "Bernat", "Carla"]);
    assert.equal(Session.forStandup(["Anna"], 90).currentSeconds, 90);
  });

  test("never reports a rest", () => {
    const session = Session.forStandup(["Anna", "Bernat"], 90);
    assert.deepEqual(walk(session, (s) => s.isResting), [false, false]);
  });

  test("knows who is next, and when nobody is", () => {
    const session = Session.forStandup(["Anna", "Bernat"], 90);
    assert.equal(session.nextItemLabel, "Bernat");
    session.advance();
    assert.equal(session.nextItemLabel, null);
    assert.ok(session.isLast);
  });
});

describe("a training session", () => {
  test("alternates exercise and rest", () => {
    const session = Session.forTraining(["Push-ups", "Squats", "Plank"], 45, 15);
    assert.deepEqual(walk(session, (s) => s.current.kind), [
      SEGMENT.exercise,
      SEGMENT.rest,
      SEGMENT.exercise,
      SEGMENT.rest,
      SEGMENT.exercise
    ]);
  });

  test("ends on the last exercise, not on a rest nobody asked for", () => {
    const session = Session.forTraining(["A", "B"], 45, 15);
    const kinds = walk(session, (s) => s.current.kind);
    assert.equal(kinds.at(-1), SEGMENT.exercise);
  });

  test("a rest of zero collapses away entirely", () => {
    const session = Session.forTraining(["A", "B", "C"], 30, 0);
    assert.deepEqual(walk(session, (s) => s.current.kind), [
      SEGMENT.exercise,
      SEGMENT.exercise,
      SEGMENT.exercise
    ]);
  });

  test("a single exercise gets no rest at all", () => {
    const session = Session.forTraining(["Only one"], 30, 20);
    assert.deepEqual(walk(session, (s) => s.current.kind), [SEGMENT.exercise]);
  });

  test("work and rest carry their own durations", () => {
    const session = Session.forTraining(["A", "B"], 45, 15);
    assert.equal(session.currentSeconds, 45);
    session.advance();
    assert.equal(session.currentSeconds, 15);
  });

  test("during a rest, the label points at what is coming", () => {
    const session = Session.forTraining(["Push-ups", "Squats"], 45, 15);
    session.advance();
    assert.ok(session.isResting);
    assert.equal(session.nextItemLabel, "Squats");
  });

  test("rests are not listed as items", () => {
    const session = Session.forTraining(["A", "B", "C"], 30, 10);
    assert.equal(session.totalItems, 3);
    assert.deepEqual(
      session.items.map((item) => item.label),
      ["A", "B", "C"]
    );
  });
});

describe("queue statuses", () => {
  test("mark the finished, the current and the upcoming", () => {
    const session = Session.forStandup(["A", "B", "C"], 60);
    session.advance();
    assert.deepEqual(
      [0, 1, 2].map((i) => session.statusOfItem(i)),
      [ITEM_STATUS.done, ITEM_STATUS.current, ITEM_STATUS.upcoming]
    );
  });

  test("during a rest nothing is current — the next one is merely upcoming", () => {
    const session = Session.forTraining(["A", "B"], 30, 10);
    session.recordCurrent(30);
    session.advance(); // now resting
    assert.ok(session.isResting);
    assert.deepEqual(
      [0, 1].map((i) => session.statusOfItem(i)),
      [ITEM_STATUS.done, ITEM_STATUS.upcoming]
    );
  });

  test("the exercise after a rest becomes current again", () => {
    const session = Session.forTraining(["A", "B"], 30, 10);
    session.recordCurrent(30);
    session.advance();
    session.recordCurrent(10);
    session.advance();
    assert.deepEqual(
      [0, 1].map((i) => session.statusOfItem(i)),
      [ITEM_STATUS.done, ITEM_STATUS.current]
    );
  });
});

describe("what a session records", () => {
  test("a stand-up totals the speaking time", () => {
    const session = Session.forStandup(["A", "B"], 60);
    session.recordCurrent(58);
    session.advance();
    session.recordCurrent(71);
    assert.equal(session.totalSpentSeconds, 129);
    assert.deepEqual(
      session.results.map((r) => r.label),
      ["A", "B"]
    );
  });

  test("delta is measured against that segment's own target", () => {
    const session = Session.forStandup(["A"], 60);
    session.recordCurrent(75);
    assert.equal(session.results[0].deltaSeconds, 15);
    assert.equal(session.results[0].targetSeconds, 60);
  });

  test("time spent is never negative, however it is reported", () => {
    const session = Session.forStandup(["A"], 60);
    session.recordCurrent(-5);
    assert.equal(session.results[0].spentSeconds, 0);
  });

  test("rests count towards the total but not towards the work", () => {
    const session = Session.forTraining(["A", "B"], 45, 15);
    session.recordCurrent(45); // exercise
    session.advance();
    session.recordCurrent(12); // rest, cut short
    session.advance();
    session.recordCurrent(50); // exercise, overrun

    assert.equal(session.workedSpentSeconds, 95, "work excludes the rest");
    assert.equal(session.restSpentSeconds, 12, "rest is counted on its own");
    assert.equal(session.totalSpentSeconds, 107, "the total is everything");
    assert.equal(
      session.totalSpentSeconds,
      session.workedSpentSeconds + session.restSpentSeconds,
      "the three figures have to add up — they are shown together on the summary"
    );
  });

  test("a stand-up has no rest time to report", () => {
    const session = Session.forStandup(["A"], 60);
    session.recordCurrent(60);
    assert.equal(session.restSpentSeconds, 0);
  });

  test("rests never appear as summary rows", () => {
    const session = Session.forTraining(["A", "B"], 30, 10);
    session.recordCurrent(30);
    session.advance();
    session.recordCurrent(10);
    session.advance();
    session.recordCurrent(30);
    assert.deepEqual(
      session.results.map((r) => r.label),
      ["A", "B"]
    );
  });
});

describe("guard rails", () => {
  test("a session with no segments is refused", () => {
    assert.throws(() => new Session([]), /at least one segment/);
  });

  test("advance reports the end rather than running off it", () => {
    const session = Session.forStandup(["only"], 60);
    assert.equal(session.advance(), false);
    assert.equal(session.currentLabel, "only");
  });
});
