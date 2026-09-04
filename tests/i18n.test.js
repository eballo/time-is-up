import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { languages, FALLBACK_LANGUAGE } from "../src/i18n/index.js";
import template from "../src/i18n/_template.js";

const reference = languages.find((language) => language.code === FALLBACK_LANGUAGE);
const referenceKeys = Object.keys(reference.strings).sort();
const placeholdersIn = (value) => (String(value).match(/\{\w+\}/g) ?? []).sort().join(",");

describe("the language list", () => {
  test("includes the fallback", () => {
    assert.ok(reference, `no language registered with the code "${FALLBACK_LANGUAGE}"`);
  });

  test("every entry has a code, a label and strings", () => {
    for (const language of languages) {
      assert.ok(language.code, "a language is missing its code");
      assert.ok(language.label, `${language.code} is missing its label`);
      assert.ok(language.strings, `${language.code} is missing its strings`);
    }
  });

  test("codes are unique", () => {
    const codes = languages.map((l) => l.code);
    assert.equal(new Set(codes).size, codes.length, `duplicate code in ${codes}`);
  });
});

describe("every language carries the same keys", () => {
  // Miss a key and that string silently falls back to English mid-interface.
  for (const language of languages) {
    test(`${language.code} (${language.label})`, () => {
      const keys = Object.keys(language.strings).sort();
      const missing = referenceKeys.filter((key) => !keys.includes(key));
      const extra = keys.filter((key) => !referenceKeys.includes(key));
      assert.deepEqual(missing, [], `${language.code} is missing keys`);
      assert.deepEqual(extra, [], `${language.code} has keys no other language has`);
    });
  }
});

describe("no string is left empty", () => {
  for (const language of languages) {
    test(`${language.code}`, () => {
      const blank = Object.entries(language.strings)
        .filter(([, value]) => !String(value).trim())
        .map(([key]) => key);
      assert.deepEqual(blank, [], `${language.code} has blank strings`);
    });
  }
});

describe("placeholders survive translation", () => {
  // A dropped {name} leaves a gap in the interface; a renamed one leaves the
  // literal text on screen.
  const keysWithPlaceholders = referenceKeys.filter(
    (key) => placeholdersIn(reference.strings[key]) !== ""
  );

  test("there are some to check", () => {
    assert.ok(keysWithPlaceholders.length > 0);
  });

  for (const key of keysWithPlaceholders) {
    test(`${key} — ${placeholdersIn(reference.strings[key])}`, () => {
      const expected = placeholdersIn(reference.strings[key]);
      for (const language of languages) {
        assert.equal(
          placeholdersIn(language.strings[key]),
          expected,
          `${language.code} changed the placeholders in "${key}"`
        );
      }
    });
  }
});

describe("the template stays usable", () => {
  test("covers every key a language needs", () => {
    const templateKeys = Object.keys(template.strings).sort();
    const missing = referenceKeys.filter((key) => !templateKeys.includes(key));
    const extra = templateKeys.filter((key) => !referenceKeys.includes(key));
    assert.deepEqual(missing, [], "the template would produce an incomplete language");
    assert.deepEqual(extra, [], "the template has keys the app no longer uses");
  });

  test("is not registered as a real language", () => {
    assert.ok(
      !languages.some((language) => language.code === template.code),
      "the template placeholder code leaked into the language list"
    );
  });

  test("its multi-line strings really are multi-line", () => {
    // These are split on "\n" to build paragraphs; a literal backslash-n
    // would render as text.
    assert.ok(template.strings.helpText.includes("\n"));
    assert.ok(template.strings.exercisesPlaceholder.includes("\n"));
    assert.ok(!template.strings.exercisesPlaceholder.includes("\\n"));
  });
});

describe("strings the interface splits or joins", () => {
  test("helpText has several paragraphs in every language", () => {
    for (const language of languages) {
      const lines = String(language.strings.helpText).split("\n").filter(Boolean);
      assert.ok(lines.length >= 2, `${language.code} helpText is a single paragraph`);
    }
  });

  test("the example names are one per line", () => {
    for (const language of languages) {
      for (const key of ["namesPlaceholder", "exercisesPlaceholder"]) {
        const value = String(language.strings[key]);
        assert.ok(value.includes("\n"), `${language.code} ${key} is not multi-line`);
        assert.ok(!value.includes("\\n"), `${language.code} ${key} has a literal backslash-n`);
      }
    }
  });

  test("the manual-mode suffix keeps its leading space", () => {
    // It is appended straight onto the estimate.
    for (const language of languages) {
      assert.match(
        String(language.strings.estimateManualSuffix),
        /^\s/,
        `${language.code} would run the suffix into the estimate`
      );
    }
  });
});
