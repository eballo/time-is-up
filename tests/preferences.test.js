import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  Preferences,
  clampMinutesPerPerson,
  clampRestSeconds,
  DEFAULT_MINUTES_PER_PERSON,
  DEFAULT_REST_SECONDS
} from "../src/js/services/preferences.js";

/** A localStorage that works, so the round-trips can be checked. */
function workingStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value))
  };
}

/** A localStorage that throws, as in Safari private browsing. */
const hostileStorage = {
  get getItem() {
    throw new DOMException("The operation is insecure.", "SecurityError");
  },
  get setItem() {
    throw new DOMException("The operation is insecure.", "SecurityError");
  }
};

function useStorage(storage) {
  globalThis.window = storage === null ? {} : { localStorage: storage };
}

afterEach(() => {
  delete globalThis.window;
});

describe("clampMinutesPerPerson", () => {
  test("keeps values inside the range the input offers", () => {
    assert.equal(clampMinutesPerPerson(0.1), 0.5);
    assert.equal(clampMinutesPerPerson(99), 10);
    assert.equal(clampMinutesPerPerson(1.5), 1.5);
  });

  test("nonsense falls back to the default", () => {
    assert.equal(clampMinutesPerPerson(""), DEFAULT_MINUTES_PER_PERSON);
    assert.equal(clampMinutesPerPerson("abc"), DEFAULT_MINUTES_PER_PERSON);
    assert.equal(clampMinutesPerPerson(null), DEFAULT_MINUTES_PER_PERSON);
    assert.equal(clampMinutesPerPerson(-3), DEFAULT_MINUTES_PER_PERSON);
  });
});

describe("clampRestSeconds", () => {
  test("zero is a legitimate choice — it means no rest", () => {
    assert.equal(clampRestSeconds(0), 0);
    assert.equal(clampRestSeconds("0"), 0);
  });

  test("clamps the extremes and rejects nonsense", () => {
    assert.equal(clampRestSeconds(9999), 300);
    assert.equal(clampRestSeconds(-5), DEFAULT_REST_SECONDS);
    assert.equal(clampRestSeconds("abc"), DEFAULT_REST_SECONDS);
  });
});

describe("Preferences with working storage", () => {
  beforeEach(() => useStorage(workingStorage()));

  test("values survive a round trip", () => {
    const prefs = new Preferences();
    prefs.names = "Anna\nBernat";
    prefs.exercises = "Push-ups";
    prefs.language = "ca";
    prefs.theme = "dark";
    assert.equal(prefs.names, "Anna\nBernat");
    assert.equal(prefs.exercises, "Push-ups");
    assert.equal(prefs.language, "ca");
    assert.equal(prefs.theme, "dark");
  });

  test("durations are clamped on the way in", () => {
    const prefs = new Preferences();
    prefs.minutesPerPerson = 99;
    prefs.restSeconds = 9999;
    assert.equal(prefs.minutesPerPerson, 10);
    assert.equal(prefs.restSeconds, 300);
  });

  test("an unset duration reports null, so a caller can pick its own default", () => {
    const prefs = new Preferences();
    assert.equal(prefs.minutesPerPerson, null);
    assert.equal(prefs.minutesPerExercise, null);
    assert.equal(prefs.restSeconds, null);
  });

  test("the two modes keep separate lists and durations", () => {
    const prefs = new Preferences();
    prefs.names = "Anna";
    prefs.exercises = "Squats";
    prefs.minutesPerPerson = 1.5;
    prefs.minutesPerExercise = 0.5;
    assert.equal(prefs.names, "Anna");
    assert.equal(prefs.exercises, "Squats");
    assert.equal(prefs.minutesPerPerson, 1.5);
    assert.equal(prefs.minutesPerExercise, 0.5);
  });

  test("only the known enum values are accepted back", () => {
    const prefs = new Preferences();
    assert.equal(prefs.mode, "standup", "unset defaults to stand-up");
    assert.equal(prefs.order, "random");
    assert.equal(prefs.switchMode, "automatic");
    assert.equal(prefs.theme, null, "unset means follow the system");
  });

  test("a junk theme is treated as unset rather than applied", () => {
    useStorage(workingStorage({ "tiu.theme": "chartreuse" }));
    assert.equal(new Preferences().theme, null);
  });
});

describe("upgrading from an earlier version", () => {
  test('the "alpha" order written before 1.2.0 is still understood', () => {
    // Getting this wrong silently resets someone's preference on upgrade.
    useStorage(workingStorage({ "tiu.order": "alpha" }));
    assert.equal(new Preferences().order, "alphabetical");
  });

  test("the current spelling still works", () => {
    useStorage(workingStorage({ "tiu.order": "alphabetical" }));
    assert.equal(new Preferences().order, "alphabetical");
  });

  test("anything else means random", () => {
    useStorage(workingStorage({ "tiu.order": "" }));
    assert.equal(new Preferences().order, "random");
  });
});

describe("Preferences when storage is unavailable", () => {
  // This is the path that used to render a blank page: the first read happened
  // during init and took the whole script down with it.
  test("reading a hostile storage yields defaults instead of throwing", () => {
    useStorage(hostileStorage);
    const prefs = new Preferences();
    assert.doesNotThrow(() => prefs.names);
    assert.equal(prefs.names, "");
    assert.equal(prefs.mode, "standup");
    assert.equal(prefs.order, "random");
    assert.equal(prefs.theme, null);
    assert.equal(prefs.minutesPerPerson, null);
  });

  test("writing to a hostile storage is silently dropped", () => {
    useStorage(hostileStorage);
    const prefs = new Preferences();
    assert.doesNotThrow(() => {
      prefs.names = "Anna";
      prefs.theme = "dark";
      prefs.minutesPerPerson = 2;
    });
  });

  test("no localStorage at all behaves the same way", () => {
    useStorage(null);
    const prefs = new Preferences();
    assert.doesNotThrow(() => prefs.names);
    assert.equal(prefs.names, "");
  });
});
