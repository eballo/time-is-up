/** Screens the shortcuts behave differently on. */
export const SCREEN = {
  setup: "setup",
  countdown: "countdown",
  running: "running",
  summary: "summary"
};

const TYPING_TAGS = new Set(["TEXTAREA", "INPUT", "SELECT", "SUMMARY"]);
const SKIP_KEYS = new Set(["Space", "Enter", "ArrowRight", "Escape"]);

/**
 * Keyboard handling for the whole app, kept in one place so the rules are
 * readable together rather than scattered through a switch.
 */
export class KeyboardShortcuts {
  #getScreen;
  #handlers;

  /**
   * @param {object} options
   * @param {() => string} options.getScreen  which SCREEN is showing
   * @param {object} options.handlers  onStart, onSkipCountdown, onTogglePause,
   *                                   onAdvance, onReset
   */
  constructor({ getScreen, handlers }) {
    this.#getScreen = getScreen;
    this.#handlers = handlers;
    document.addEventListener("keydown", (event) => this.#handle(event));
  }

  #handle(event) {
    const tagName = event.target?.tagName;
    if (TYPING_TAGS.has(tagName)) return;
    // A focused button already activates on Space/Enter; acting here as well
    // would run the shortcut and the button's own click for one keypress.
    if (tagName === "BUTTON" && (event.code === "Space" || event.code === "Enter")) return;

    switch (this.#getScreen()) {
      case SCREEN.setup:
        if (event.code === "Space") {
          event.preventDefault();
          this.#handlers.onStart();
        }
        return;

      case SCREEN.countdown:
        if (SKIP_KEYS.has(event.code)) {
          event.preventDefault();
          this.#handlers.onSkipCountdown();
        } else if (this.#isResetKey(event)) {
          // The Reset button works during the count-in; keep the key in step.
          this.#handlers.onReset();
        }
        return;

      case SCREEN.running:
        if (event.code === "Space") {
          event.preventDefault();
          this.#handlers.onTogglePause();
        } else if (event.code === "ArrowRight") {
          event.preventDefault();
          this.#handlers.onAdvance();
        } else if (this.#isResetKey(event)) {
          this.#handlers.onReset();
        }
        return;

      default:
        // Nothing is bound on the summary screen.
    }
  }

  #isResetKey(event) {
    return event.key === "r" || event.key === "R";
  }
}
