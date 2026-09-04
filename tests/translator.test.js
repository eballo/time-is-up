import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { Translator } from "../src/js/services/translator.js";

const LANGUAGES = [
  {
    code: "ca",
    label: "Català",
    strings: {
      greeting: "Hola",
      personOne: "persona",
      personOther: "persones",
      exerciseOne: "exercici",
      exerciseOther: "exercicis",
      slot: "Persona {i} de {n}"
      // deliberately missing "onlyInEnglish"
    }
  },
  {
    code: "en",
    label: "English",
    strings: {
      greeting: "Hello",
      personOne: "person",
      personOther: "people",
      exerciseOne: "exercise",
      exerciseOther: "exercises",
      slot: "Person {i} of {n}",
      onlyInEnglish: "Fallback text"
    }
  }
];

describe("choosing a language", () => {
  test("lists them in declaration order", () => {
    const t = new Translator(LANGUAGES, "en");
    assert.deepEqual(t.languages.map((l) => l.code), ["ca", "en"]);
  });

  test("a saved choice wins", () => {
    const t = new Translator(LANGUAGES, "en");
    assert.equal(t.resolveInitialLanguage("ca", "en-GB"), "ca");
  });

  test("otherwise the browser's language, matched on the first two letters", () => {
    const t = new Translator(LANGUAGES, "en");
    assert.equal(t.resolveInitialLanguage(null, "ca-ES"), "ca");
    assert.equal(t.resolveInitialLanguage(null, "EN-us"), "en");
  });

  test("an unknown language falls back rather than blanking the interface", () => {
    const t = new Translator(LANGUAGES, "en");
    assert.equal(t.resolveInitialLanguage("de", "de-DE"), "en");
    assert.equal(t.resolveInitialLanguage(null, undefined), "en");
  });

  test("setting an unknown language leaves the fallback in place", () => {
    const t = new Translator(LANGUAGES, "en");
    t.language = "de";
    assert.equal(t.language, "en");
  });

  test("a fallback that is not registered falls back to the first language", () => {
    const t = new Translator(LANGUAGES, "de");
    assert.equal(t.language, "ca");
  });

  test("no languages at all is a programming error, not a silent empty app", () => {
    assert.throws(() => new Translator([], "en"), /at least one language/);
  });
});

describe("looking up a string", () => {
  test("uses the active language", () => {
    const t = new Translator(LANGUAGES, "en");
    t.language = "ca";
    assert.equal(t.translate("greeting"), "Hola");
  });

  test("a missing key falls through to the fallback language", () => {
    const t = new Translator(LANGUAGES, "en");
    t.language = "ca";
    assert.equal(t.translate("onlyInEnglish"), "Fallback text");
  });

  test("a key missing everywhere shows its own name, never nothing", () => {
    // A blank label is a worse failure than a visibly wrong one.
    const t = new Translator(LANGUAGES, "en");
    assert.equal(t.translate("noSuchKey"), "noSuchKey");
  });
});

describe("filling in placeholders", () => {
  test("substitutes by name", () => {
    const t = new Translator(LANGUAGES, "en");
    assert.equal(t.format("slot", { i: 2, n: 5 }), "Person 2 of 5");
  });

  test("a missing value empties the placeholder instead of printing it", () => {
    const t = new Translator(LANGUAGES, "en");
    assert.equal(t.format("slot", { i: 2 }), "Person 2 of ");
  });

  test("zero is a value, not an absence", () => {
    const t = new Translator(LANGUAGES, "en");
    assert.equal(t.format("slot", { i: 0, n: 0 }), "Person 0 of 0");
  });
});

describe("counting", () => {
  test("picks singular only for exactly one", () => {
    const t = new Translator(LANGUAGES, "en");
    assert.equal(t.countPeople(1), "1 person");
    assert.equal(t.countPeople(2), "2 people");
    assert.equal(t.countPeople(0), "0 people");
    assert.equal(t.countExercises(1), "1 exercise");
    assert.equal(t.countExercises(4), "4 exercises");
  });

  test("counts in the active language", () => {
    const t = new Translator(LANGUAGES, "en");
    t.language = "ca";
    assert.equal(t.countPeople(3), "3 persones");
    assert.equal(t.countExercises(1), "1 exercici");
  });
});

describe("locale-aware helpers", () => {
  test("the minute value follows the active language", () => {
    const t = new Translator(LANGUAGES, "en");
    assert.equal(t.minuteValue(1.5), "1.5 min");
    t.language = "ca";
    assert.equal(t.minuteValue(1.5), "1,5 min");
  });

  test("name comparison is case-insensitive", () => {
    const t = new Translator(LANGUAGES, "en");
    assert.ok(t.compareNames("anna", "Bernat") < 0);
    assert.equal(t.compareNames("Anna", "anna"), 0);
  });
});
