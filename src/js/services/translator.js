import { formatMinuteValue } from "../util/time-format.js";

/**
 * Looks up interface strings for the active language.
 *
 * A missing key falls back to the fallback language and then to the key name
 * itself, so a half-translated language file degrades to English rather than
 * blanking out the interface.
 */
export class Translator {
  #languages;
  #stringsByCode = new Map();
  #fallbackCode;
  #activeCode;

  /** @param {{code: string, label: string, strings: object}[]} languages */
  constructor(languages, preferredFallbackCode = "en") {
    if (!languages.length) throw new Error("Translator needs at least one language");
    this.#languages = languages.map(({ code, label }) => ({ code, label }));
    for (const { code, strings } of languages) this.#stringsByCode.set(code, strings);
    this.#fallbackCode = this.has(preferredFallbackCode)
      ? preferredFallbackCode
      : languages[0].code;
    this.#activeCode = this.#fallbackCode;
  }

  /** @returns {{code: string, label: string}[]} in declaration order */
  get languages() {
    return this.#languages.slice();
  }

  get language() {
    return this.#activeCode;
  }

  set language(code) {
    this.#activeCode = this.has(code) ? code : this.#fallbackCode;
  }

  has(code) {
    return this.#stringsByCode.has(code);
  }

  /**
   * Pick the best language for a visitor: their saved choice, else the
   * browser's, else the fallback.
   */
  resolveInitialLanguage(savedCode, browserLanguage) {
    if (this.has(savedCode)) return savedCode;
    const short = (browserLanguage || "").slice(0, 2).toLowerCase();
    return this.has(short) ? short : this.#fallbackCode;
  }

  translate(key) {
    const active = this.#stringsByCode.get(this.#activeCode);
    if (active?.[key] != null) return active[key];
    const fallback = this.#stringsByCode.get(this.#fallbackCode);
    return fallback?.[key] ?? key;
  }

  /** translate() plus {placeholder} substitution. */
  format(key, values = {}) {
    return String(this.translate(key)).replace(
      /\{(\w+)\}/g,
      (_, name) => (values[name] != null ? values[name] : "")
    );
  }

  /** "1 person" / "5 people", in the active language. */
  countPeople(count) {
    return this.#count(count, "personOne", "personOther");
  }

  /** "1 exercise" / "4 exercises", in the active language. */
  countExercises(count) {
    return this.#count(count, "exerciseOne", "exerciseOther");
  }

  #count(count, singularKey, pluralKey) {
    return `${count} ${this.translate(count === 1 ? singularKey : pluralKey)}`;
  }

  /** The per-person budget, formatted for the active locale. */
  minuteValue(minutes) {
    return formatMinuteValue(minutes, this.#activeCode);
  }

  /** Sorts names the way the active language expects them sorted. */
  compareNames(a, b) {
    return a.localeCompare(b, this.#activeCode, { sensitivity: "base" });
  }
}
