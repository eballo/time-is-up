import { formatCountdown } from "../util/time-format.js";

/**
 * The tab is usually not the focused window during a stand-up, so the title
 * carries the state that matters: who is up and how long they have left.
 */
export class TabTitle {
  #baseTitle;

  constructor() {
    this.#baseTitle = document.title;
  }

  showTurn(remainingSeconds, speakerName) {
    document.title = `${formatCountdown(remainingSeconds)} · ${speakerName}`;
  }

  reset() {
    document.title = this.#baseTitle;
  }
}
