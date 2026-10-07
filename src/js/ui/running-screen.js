import { createElement, replaceChildren, restartAnimation } from "../util/dom.js";
import { formatCountdown } from "../util/time-format.js";
import { ITEM_STATUS } from "../core/session.js";
import { MODE } from "./setup-screen.js";
import { createFigure } from "./exercise-figures.js";

/** Block colours cycle through this many tokens (--block-1 … --block-4). */
const BLOCK_COLOURS = 4;

/**
 * Which block colour something wears, or null when there is only one block
 * and colour would say nothing.
 */
function blockColour(session, blockIndex) {
  return session.totalBlocks < 2 ? null : String((blockIndex % BLOCK_COLOURS) + 1);
}

function setBlockColour(element, colour) {
  if (colour) element.dataset.block = colour;
  else delete element.dataset.block;
}

/** The last seconds of a block change, when "rest" turns into "go". */
export const BLOCK_GO_SECONDS = 3;

/** Fraction of the segment left at which the clock changes colour. */
const WARN_THRESHOLD = 0.4;
const DANGER_THRESHOLD = 0.15;

/**
 * The stage: who or what is up, how long is left, and what is queued.
 *
 * A rest is deliberately kept off the green→amber→red ramp. Running out of rest
 * is not a problem to warn anyone about, so it gets its own cool colour and the
 * screen turns into a heads-up for the exercise about to start.
 */
export class RunningScreen {
  #elements;
  #translator;
  /* Remembered so the class attributes are only written when they change. The
     clock ticks four times a second, and rewriting className that often
     restarted its colour transition before it could ever finish — leaving the
     clock stuck on the previous colour. */
  #clockSeverity;
  #progressSeverity;
  /** Whether the "let's go" cue of the current block change is already up. */
  #goShown = false;
  /** Which figure is drawn, so a repeat of the same exercise is not redrawn. */
  #figureId = null;

  constructor({ elements, translator }) {
    this.#elements = elements;
    this.#translator = translator;
  }

  renderText() {
    this.#elements.overtimeNote.textContent = this.#translator.translate("overtimeNote");
    this.#elements.reset.textContent = this.#translator.translate("reset");
    // A run always opens on something that is not a rest. Without this the
    // button sits blank all through the count-in, which happens before the
    // first segment is ever rendered.
    this.renderNextButton(false);
  }

  /** Label the pause button for what pressing it would do. */
  renderPauseButton(isPaused) {
    this.#elements.pause.textContent = this.#translator.translate(isPaused ? "resume" : "pause");
  }

  /** During a rest, the forward button is offering to cut the rest short. */
  renderNextButton(isResting) {
    this.#elements.next.textContent = this.#translator.translate(isResting ? "skipRest" : "next");
  }

  /** Everything that changes when the segment changes. */
  renderSegment(session, { mode, switchMode }) {
    const el = this.#elements;
    const training = mode === MODE.training;

    // Only a programme day has these; a typed list leaves both slots empty.
    // A block change names the block coming up instead.
    const description = session.isBlockChange
      ? this.#upcomingBlockName(session)
      : session.currentDescription;
    el.description.textContent = description ?? "";
    el.description.hidden = !description;

    this.#renderFigure(session.currentFigure);

    this.#goShown = false;
    el.root.classList.remove("block-go");
    if (session.isBlockChange) restartAnimation(el.root, "block-change");
    else el.root.classList.remove("block-change");

    if (session.isResting) {
      el.eyebrow.textContent = this.#eyebrowFor(training, switchMode, session.currentBlockTitle);
      // The state you are in goes in the big slot; what you are getting ready
      // for stays in view on the line below.
      // Leaving one block for the next is worth more than "rest": say so.
      el.speaker.textContent = this.#translator.translate(
        session.isBlockChange ? "blockChange" : "restingNow"
      );
      el.turnCount.textContent = this.#withBlock(
        session,
        this.#translator.format("exerciseXofY", {
          i: session.currentItemPosition + 1,
          n: session.totalItems
        })
      );
      el.nextUp.textContent = session.nextItemLabel
        ? this.#translator.format("nextIs", { name: session.nextItemLabel })
        : "";
    } else {
      el.eyebrow.textContent = this.#eyebrowFor(training, switchMode, session.currentBlockTitle);
      el.speaker.textContent = session.currentLabel;
      el.turnCount.textContent = this.#withBlock(
        session,
        this.#translator.format(training ? "exerciseXofY" : "personXofY", {
          i: session.currentItemPosition,
          n: session.totalItems
        })
      );
      el.nextUp.textContent = session.nextItemLabel
        ? this.#translator.format("nextIs", { name: session.nextItemLabel })
        : this.#translator.translate(training ? "lastExercise" : "lastPerson");
    }

    this.renderNextButton(session.isResting);
    setBlockColour(el.root, blockColour(session, session.currentBlockPosition - 1));
    this.renderQueue(session);
  }

  /** Everything that changes every second. */
  renderClock(remainingSeconds, durationSeconds, { switchMode, isResting, isBlockChange }) {
    const el = this.#elements;
    el.clock.textContent = formatCountdown(remainingSeconds);

    // The end of a block change: the big slot stops saying "change" and says go.
    if (isBlockChange && !this.#goShown && remainingSeconds <= BLOCK_GO_SECONDS) {
      this.#goShown = true;
      el.speaker.textContent = this.#translator.translate("letsGo");
      restartAnimation(el.root, "block-go");
    }

    const remainingFraction = remainingSeconds / durationSeconds;
    const severity = isResting
      ? "resting"
      : this.#severityFor(remainingSeconds, remainingFraction);
    this.#setSeverity(severity);

    // Only manual mode leaves the decision to a human, so only it needs the nudge.
    el.overtimeNote.hidden = !(remainingSeconds < 0 && switchMode === "manual");

    const progress = Math.max(0, Math.min(100, (1 - remainingFraction) * 100));
    el.progressFill.style.width = `${progress}%`;
  }

  #setSeverity(severity) {
    if (severity === this.#clockSeverity) return;
    this.#clockSeverity = severity;
    this.#elements.clock.className = severity ? `clock ${severity}` : "clock";

    // The bar has no separate overtime look; it just stays in the danger colour.
    const barSeverity = severity === "over" ? "danger" : severity;
    if (barSeverity === this.#progressSeverity) return;
    this.#progressSeverity = barSeverity;
    this.#elements.progressBar.className = barSeverity ? `progress ${barSeverity}` : "progress";
  }

  /** Show the stage behind the count-in overlay before the clock starts. */
  primeFor(session) {
    const el = this.#elements;
    this.renderNextButton(session.isResting);
    el.speaker.textContent = session.currentLabel;
    el.description.hidden = true;
    this.#renderFigure(session.currentFigure);
    el.root.classList.remove("block-change", "block-go");
    setBlockColour(el.root, blockColour(session, 0));
    el.clock.textContent = formatCountdown(session.currentSeconds);
    el.clock.className = "clock";
    el.progressBar.className = "progress";
    this.#clockSeverity = null;
    this.#progressSeverity = null;
    this.renderQueue(session);
  }

  /**
   * The queue lists the block in hand only: the whole workout is a long list,
   * and the next block shows up when its turn — or its block change — comes.
   */
  renderQueue(session) {
    const fragment = document.createDocumentFragment();
    const block = session.currentBlockPosition - 1;
    const filtered = session.totalBlocks > 1;
    let position = 0;

    session.items.forEach((item, index) => {
      if (filtered && (item.block ?? 0) !== block) return;
      position += 1;
      const status = session.statusOfItem(index);
      const row = createElement("li", status === ITEM_STATUS.upcoming ? null : status);
      setBlockColour(row, blockColour(session, item.block ?? 0));
      row.appendChild(createElement("span", "num", String(position)));
      row.appendChild(createElement("span", "name", item.label));

      if (status === ITEM_STATUS.current) {
        row.appendChild(createElement("span", "tag", this.#translator.translate("tagNow")));
      } else if (status === ITEM_STATUS.done) {
        row.appendChild(createElement("span", "tag", this.#translator.translate("tagDone")));
      }
      fragment.appendChild(row);
    });

    replaceChildren(this.#elements.queue, fragment);
  }

  /** The figure beside the clock; during a rest, the exercise coming up. */
  #renderFigure(id) {
    if (id === this.#figureId) return;
    this.#figureId = id;
    const slot = this.#elements.figure;
    slot.innerHTML = "";
    const figure = id ? createFigure(id) : null;
    if (figure) slot.appendChild(figure);
    slot.hidden = !figure;
  }

  /** "Block 2: Strength and stability", or "Starting block 2" for an untitled one. */
  #upcomingBlockName(session) {
    const i = session.currentBlockPosition;
    const title = session.currentBlockTitle;
    return title
      ? this.#translator.format("blockTitle", { i, title })
      : this.#translator.format("blockStarting", { i });
  }

  /** "Block 2 of 3 · Exercise 7 of 18", or just the count when there is one block. */
  #withBlock(session, countText) {
    if (session.totalBlocks < 2) return countText;
    const block = this.#translator.format("blockXofY", {
      i: session.currentBlockPosition,
      n: session.totalBlocks
    });
    return `${block} · ${countText}`;
  }

  /** A named block says which block you are in; otherwise, which mode. */
  #eyebrowFor(training, switchMode, blockTitle) {
    const base = blockTitle ?? this.#translator.translate(training ? "modeTraining" : "nowSpeaking");
    return switchMode === "manual"
      ? `${base} · ${this.#translator.translate("manualTag")}`
      : base;
  }

  #severityFor(remainingSeconds, remainingFraction) {
    if (remainingSeconds < 0) return "over";
    if (remainingFraction <= DANGER_THRESHOLD) return "danger";
    if (remainingFraction <= WARN_THRESHOLD) return "warn";
    return null;
  }
}
