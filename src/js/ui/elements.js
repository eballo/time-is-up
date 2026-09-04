import { byId } from "../util/dom.js";

/**
 * Every element the app touches, resolved once and grouped by the screen that
 * owns it. Keeping the id strings here means nothing else has to know them.
 */
export function collectElements() {
  const progressBar = byId("turnbar");

  return {
    sections: {
      setup: byId("setup"),
      running: byId("running"),
      summary: byId("done")
    },

    header: {
      tagline: byId("tagline"),
      themeToggle: byId("theme"),
      languagePicker: byId("lang"),
      chromeColorMeta: byId("theme-color")
    },

    setup: {
      modeStandup: byId("mode-standup"),
      modeTraining: byId("mode-training"),
      modeStandupLabel: byId("mode-standup-label"),
      modeTrainingLabel: byId("mode-training-label"),
      modeGroup: byId("lbl-modes"),
      entries: byId("names"),
      restField: byId("field-rest"),
      rest: byId("rest"),
      restLabel: byId("lbl-rest"),
      restHint: byId("rest-hint"),
      orderField: byId("field-order"),
      minutes: byId("minutes"),
      entriesLabel: byId("lbl-people"),
      entriesHint: byId("lbl-people-hint"),
      minutesLabel: byId("lbl-minutes"),
      orderLabel: byId("lbl-order"),
      orderAlphabetical: byId("order-alpha"),
      orderRandom: byId("order-random"),
      switchModeLabel: byId("lbl-mode"),
      switchModeAutomatic: byId("mode-auto"),
      switchModeManual: byId("mode-manual"),
      start: byId("start"),
      estimate: byId("estimate"),
      helpTitle: byId("help-title"),
      helpText: byId("help-text")
    },

    running: {
      eyebrow: byId("eyebrow"),
      speaker: byId("speaker"),
      clock: byId("clock"),
      overtimeNote: byId("overtime-note"),
      progressBar,
      progressFill: progressBar.querySelector("i"),
      turnCount: byId("turn-count"),
      nextUp: byId("next-up"),
      queue: byId("queue"),
      pause: byId("pause"),
      next: byId("next"),
      reset: byId("reset")
    },

    preroll: {
      root: byId("preroll"),
      label: byId("preroll-label"),
      number: byId("preroll-num"),
      hint: byId("preroll-skip")
    },

    summary: {
      title: byId("done-title"),
      subtitle: byId("done-sub"),
      list: byId("summary"),
      again: byId("again")
    },

    version: byId("version"),
    fireworksCanvas: byId("fireworks")
  };
}
