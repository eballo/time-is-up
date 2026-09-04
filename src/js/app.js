/*
 * "Time is up" — rotating stand-up timer.
 *
 * This file is wiring only: it builds the services, screens and timer, then
 * routes events between them. The rules live in core/, the plumbing in
 * services/, and everything that paints in ui/.
 */
import { languages, FALLBACK_LANGUAGE } from "../i18n/index.js";

import { Session, orderNames } from "./core/session.js";
import { TurnTimer } from "./core/turn-timer.js";

import { Chime } from "./services/chime.js";
import { Preferences } from "./services/preferences.js";
import { ScreenWakeLock } from "./services/screen-wake-lock.js";
import { ThemeController } from "./services/theme-controller.js";
import { Translator } from "./services/translator.js";

import { collectElements } from "./ui/elements.js";
import { Fireworks } from "./ui/fireworks.js";
import { KeyboardShortcuts, SCREEN } from "./ui/keyboard-shortcuts.js";
import { PrerollCountdown } from "./ui/preroll-countdown.js";
import { RunningScreen } from "./ui/running-screen.js";
import { SetupScreen, MODE } from "./ui/setup-screen.js";
import { ShareButton } from "./ui/share-button.js";
import { SummaryScreen } from "./ui/summary-screen.js";
import { TabTitle } from "./ui/tab-title.js";

import { createElement } from "./util/dom.js";
import { minutesToSeconds } from "./util/time-format.js";
import { APP_VERSION } from "./version.js";

/** A turn ends one second past zero, leaving the overtime visible for a beat. */
const OVERTIME_GRACE_SECONDS = -1;

export class App {
  #elements = collectElements();
  #preferences = new Preferences();
  #translator = new Translator(languages, FALLBACK_LANGUAGE);
  #chime = new Chime();
  #wakeLock = new ScreenWakeLock();
  #tabTitle = new TabTitle();

  #theme;
  #setupScreen;
  #runningScreen;
  #summaryScreen;
  #preroll;
  #fireworks;
  #share;
  #timer;

  #session = null;
  #screen = SCREEN.setup;

  constructor() {
    this.#theme = new ThemeController({
      preferences: this.#preferences,
      toggleButton: this.#elements.header.themeToggle,
      chromeColorMeta: this.#elements.header.chromeColorMeta,
      labelProvider: () => this.#translator.translate("themeToggle")
    });

    this.#setupScreen = new SetupScreen({
      elements: this.#elements.setup,
      translator: this.#translator,
      preferences: this.#preferences,
      onStart: () => this.#startRun(),
      onModeChange: (mode) => this.#applyMode(mode)
    });

    this.#runningScreen = new RunningScreen({
      elements: this.#elements.running,
      translator: this.#translator
    });

    this.#summaryScreen = new SummaryScreen({
      elements: this.#elements.summary,
      translator: this.#translator
    });

    this.#preroll = new PrerollCountdown({
      ...this.#elements.preroll,
      translator: this.#translator,
      chime: this.#chime,
      onFinish: () => this.#beginTurn()
    });

    this.#fireworks = new Fireworks(this.#elements.fireworksCanvas);

    this.#share = new ShareButton({
      button: this.#elements.share,
      translator: this.#translator
    });

    this.#timer = new TurnTimer({
      onSecondChanged: (remaining) => this.#onSecondChanged(remaining),
      onReachedZero: () => this.#chime.timeUp()
    });

    this.#bindEvents();
  }

  start() {
    this.#elements.version.textContent = `v${APP_VERSION}`;
    this.#buildLanguagePicker();
    this.#theme.apply();
    this.#applyMode(this.#setupScreen.mode);
    this.#setLanguage(
      this.#translator.resolveInitialLanguage(this.#preferences.language, navigator.language)
    );
    this.#showScreen(SCREEN.setup);
  }

  /* ---------- run lifecycle ---------- */

  /** The mode swaps the accent and which fields show; the rules are identical. */
  #applyMode(mode) {
    document.documentElement.setAttribute("data-mode", mode);
  }

  #startRun() {
    const entries = this.#setupScreen.entries;
    if (entries.length === 0) return;

    this.#setupScreen.saveValues();
    this.#session = this.#buildSession(entries);

    this.#showScreen(SCREEN.countdown);
    this.#runningScreen.primeFor(this.#session);
    this.#wakeLock.acquire(); // must ride the click that got us here
    this.#preroll.start();
  }

  #buildSession(entries) {
    const seconds = minutesToSeconds(this.#setupScreen.minutesPerItem);
    if (this.#setupScreen.isTraining) {
      // A workout's sequence is deliberate, so exercises run as written.
      return Session.forTraining(entries, seconds, this.#setupScreen.restSeconds);
    }
    return Session.forStandup(
      orderNames(entries, this.#setupScreen.order, (a, b) => this.#translator.compareNames(a, b)),
      seconds
    );
  }

  #beginTurn() {
    this.#showScreen(SCREEN.running);
    this.#timer.start(this.#session.currentSeconds);
    this.#runningScreen.renderSegment(this.#session, this.#viewOptions);
    this.#runningScreen.renderPauseButton(false);
    this.#renderClock();
  }

  get #viewOptions() {
    return { mode: this.#setupScreen.mode, switchMode: this.#setupScreen.switchMode };
  }

  #onSecondChanged(remainingSeconds) {
    this.#renderClock();
    // One step per tick at most: the next turn gets a fresh deadline, so
    // coming back from a long absence never stampedes through the queue.
    if (
      this.#setupScreen.switchMode === "automatic" &&
      remainingSeconds <= OVERTIME_GRACE_SECONDS
    ) {
      this.#advance();
    }
  }

  #advance() {
    this.#session.recordCurrent(this.#timer.elapsedSeconds);
    if (this.#session.advance()) {
      this.#beginTurn();
    } else {
      this.#finishRun();
    }
  }

  #finishRun() {
    this.#timer.stop();
    this.#wakeLock.release();
    this.#tabTitle.reset();
    this.#summaryScreen.render(this.#session, this.#setupScreen.mode);
    this.#chime.sessionFinished();
    this.#showScreen(SCREEN.summary);
    this.#fireworks.launch();
  }

  #togglePause() {
    if (this.#timer.isRunning) {
      this.#timer.pause();
      this.#renderClock();
    } else {
      this.#timer.resume();
    }
    this.#runningScreen.renderPauseButton(!this.#timer.isRunning);
  }

  /** Reset throws away a run in progress, so that one asks first. */
  #requestReset() {
    const isMidRun = this.#screen === SCREEN.running || this.#screen === SCREEN.countdown;
    if (isMidRun && !window.confirm(this.#translator.translate("confirmReset"))) return;
    this.#returnToSetup();
  }

  #returnToSetup() {
    this.#preroll.cancel();
    this.#fireworks.stop();
    this.#timer.stop();
    this.#wakeLock.release();
    this.#tabTitle.reset();
    this.#session = null;
    this.#showScreen(SCREEN.setup);
    this.#setupScreen.refreshEstimate();
  }

  #renderClock() {
    const remaining = this.#timer.remainingSeconds;
    const resting = this.#session.isResting;
    this.#runningScreen.renderClock(remaining, this.#timer.durationSeconds, {
      switchMode: this.#setupScreen.switchMode,
      isResting: resting
    });
    this.#tabTitle.showTurn(
      remaining,
      resting
        ? this.#translator.translate("restingNow")
        : this.#session.currentLabel
    );
  }

  /* ---------- screens ---------- */

  #showScreen(screen) {
    this.#screen = screen;
    const { sections } = this.#elements;
    sections.setup.hidden = screen !== SCREEN.setup;
    // The count-in is an overlay on the running screen, not a screen of its own.
    sections.running.hidden = !(screen === SCREEN.running || screen === SCREEN.countdown);
    sections.summary.hidden = screen !== SCREEN.summary;
  }

  /* ---------- language ---------- */

  #buildLanguagePicker() {
    const picker = this.#elements.header.languagePicker;
    const fragment = document.createDocumentFragment();
    for (const { code, label } of this.#translator.languages) {
      const option = createElement("option", null, label);
      option.value = code;
      fragment.appendChild(option);
    }
    picker.innerHTML = "";
    picker.appendChild(fragment);
  }

  #setLanguage(code) {
    this.#translator.language = code;
    this.#preferences.language = this.#translator.language;
    this.#elements.header.languagePicker.value = this.#translator.language;
    document.documentElement.lang = this.#translator.language;
    this.#renderAllText();
  }

  /** Re-render every translated string, including a run already in progress. */
  #renderAllText() {
    this.#elements.header.tagline.textContent = this.#translator.translate("tagline");
    this.#theme.refreshLabel();
    this.#setupScreen.renderText();
    this.#runningScreen.renderText();
    this.#runningScreen.renderPauseButton(this.#session !== null && !this.#timer.isRunning);
    this.#preroll.renderText();
    this.#summaryScreen.renderText();
    this.#share.renderText();

    if (this.#screen === SCREEN.running) {
      this.#runningScreen.renderSegment(this.#session, this.#viewOptions);
      this.#renderClock();
    } else if (this.#screen === SCREEN.summary && this.#session) {
      this.#summaryScreen.render(this.#session, this.#setupScreen.mode);
    }
  }

  /* ---------- events ---------- */

  #bindEvents() {
    const { header, running, summary } = this.#elements;

    header.languagePicker.addEventListener("change", (event) =>
      this.#setLanguage(event.target.value)
    );

    running.pause.addEventListener("click", () => this.#togglePause());
    running.next.addEventListener("click", () => this.#advance());
    running.reset.addEventListener("click", () => this.#requestReset());
    summary.again.addEventListener("click", () => this.#returnToSetup());

    document.addEventListener("visibilitychange", () => this.#onTabVisible());

    new KeyboardShortcuts({
      getScreen: () => this.#screen,
      handlers: {
        onStart: () => {
          if (this.#setupScreen.canStart) this.#startRun();
        },
        onSkipCountdown: () => this.#preroll.skip(),
        onTogglePause: () => this.#togglePause(),
        onAdvance: () => this.#advance(),
        onReset: () => this.#requestReset()
      }
    });
  }

  #onTabVisible() {
    if (document.hidden || this.#screen !== SCREEN.running) return;
    // Catch the clock up now rather than waiting for the next throttled tick.
    if (this.#timer.isRunning) this.#timer.refresh();
    // The browser drops the screen lock whenever the tab is hidden.
    this.#wakeLock.acquire();
  }
}

new App().start();
