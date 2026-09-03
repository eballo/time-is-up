import { prefersDarkColorScheme } from "../util/dom.js";

/** Must track the --bg tokens in styles.css: this is what mobile browsers
 *  paint their chrome with, and a stale value looks broken beside the page. */
const CHROME_COLORS = { light: "#f4f5f7", dark: "#12161c" };

/**
 * Owns the light/dark decision: the stored choice when there is one, the
 * system preference otherwise.
 */
export class ThemeController {
  #preferences;
  #toggleButton;
  #chromeColorMeta;
  #labelProvider;

  /**
   * @param {object} options
   * @param {import("./preferences.js").Preferences} options.preferences
   * @param {HTMLElement} options.toggleButton
   * @param {HTMLElement} options.chromeColorMeta  the <meta name="theme-color">
   * @param {() => string} options.labelProvider   translated button label
   */
  constructor({ preferences, toggleButton, chromeColorMeta, labelProvider }) {
    this.#preferences = preferences;
    this.#toggleButton = toggleButton;
    this.#chromeColorMeta = chromeColorMeta;
    this.#labelProvider = labelProvider;

    toggleButton.addEventListener("click", () => this.toggle());
    this.#followSystemWhileUnset();
  }

  get #storedTheme() {
    return this.#preferences.theme;
  }

  /** What the viewer actually sees right now. */
  get effectiveTheme() {
    return this.#storedTheme ?? (prefersDarkColorScheme() ? "dark" : "light");
  }

  apply() {
    const stored = this.#storedTheme;
    if (stored) document.documentElement.setAttribute("data-theme", stored);
    else document.documentElement.removeAttribute("data-theme");

    this.#chromeColorMeta?.setAttribute("content", CHROME_COLORS[this.effectiveTheme]);
    this.refreshLabel();
  }

  toggle() {
    this.#preferences.theme = this.effectiveTheme === "dark" ? "light" : "dark";
    this.apply();
  }

  /** Re-reads the translated label; call after the language changes. */
  refreshLabel() {
    // The button offers the theme you would switch *to*.
    this.#toggleButton.textContent = this.effectiveTheme === "dark" ? "☀️" : "🌙";
    const label = this.#labelProvider();
    this.#toggleButton.title = label;
    this.#toggleButton.setAttribute("aria-label", label);
  }

  #followSystemWhileUnset() {
    if (!window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!this.#storedTheme) this.apply();
    };
    if (query.addEventListener) query.addEventListener("change", onChange);
    else query.addListener?.(onChange);
  }
}
