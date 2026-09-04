import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  formatCountdown,
  formatDuration,
  formatDelta,
  formatRoughMinutes,
  formatMinuteValue,
  minutesToSeconds,
  secondsToMinutes
} from "../src/js/util/time-format.js";

describe("formatCountdown — what the running clock shows", () => {
  test("pads the seconds", () => {
    assert.equal(formatCountdown(65), "1:05");
    assert.equal(formatCountdown(90), "1:30");
    assert.equal(formatCountdown(600), "10:00");
  });

  test("zero reads as zero, not as overtime", () => {
    assert.equal(formatCountdown(0), "0:00");
  });

  test("overtime counts up behind a plus", () => {
    assert.equal(formatCountdown(-1), "+0:01");
    assert.equal(formatCountdown(-75), "+1:15");
  });
});

describe("formatDuration — summaries and totals", () => {
  test("never shows a negative", () => {
    assert.equal(formatDuration(-30), "0:00");
  });

  test("rounds to the nearest second", () => {
    assert.equal(formatDuration(59.6), "1:00");
    assert.equal(formatDuration(59.4), "0:59");
  });
});

describe("formatDelta — over or under the target", () => {
  test("a second either way counts as on target", () => {
    // Otherwise every turn would show a delta, which is noise, not information.
    assert.equal(formatDelta(0), "±0:00");
    assert.equal(formatDelta(1), "±0:00");
    assert.equal(formatDelta(-1), "±0:00");
  });

  test("over is a plus, under is a real minus sign", () => {
    assert.equal(formatDelta(17), "+0:17");
    assert.equal(formatDelta(-28), "−0:28");
    assert.ok(formatDelta(-28).startsWith("−"), "should be U+2212, not a hyphen");
  });
});

describe("formatRoughMinutes — the estimate line", () => {
  test("rounds to whole minutes", () => {
    assert.equal(formatRoughMinutes(450), "8 min");
    assert.equal(formatRoughMinutes(30), "1 min");
    assert.equal(formatRoughMinutes(0), "0 min");
  });
});

describe("formatMinuteValue — the per-item budget", () => {
  test("follows the reader's decimal separator", () => {
    assert.equal(formatMinuteValue(1.5, "en"), "1.5 min");
    assert.equal(formatMinuteValue(1.5, "ca"), "1,5 min");
    assert.equal(formatMinuteValue(1.5, "fr"), "1,5 min");
  });

  test("drops a pointless decimal", () => {
    assert.equal(formatMinuteValue(2, "en"), "2 min");
  });

  test("an unusable locale still produces a number", () => {
    assert.match(formatMinuteValue(1.5, "not-a-locale!!"), /1[.,]5 min/);
  });
});

describe("minute and second conversion", () => {
  test("round-trips the values the app actually offers", () => {
    for (const minutes of [0.5, 1, 1.5, 2, 10]) {
      assert.equal(secondsToMinutes(minutesToSeconds(minutes)), minutes);
    }
  });

  test("produces whole seconds", () => {
    assert.equal(minutesToSeconds(0.5), 30);
    assert.equal(Number.isInteger(minutesToSeconds(1.5)), true);
  });
});
