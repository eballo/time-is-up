# ⏱️ Time is up

A rotating timer with two modes.

- **Stand-up** — everyone gets the same time to speak, and it moves on when the
  time runs out, so the meeting stays short, balanced and predictable.
- **Training** — the same clock over a list of exercises, with a configurable
  rest between them that you can cut short whenever you're ready.

Static page: **no build, no dependencies, no backend**. Serve the folder with
any static host — the code is ES modules, which browsers refuse to load from
`file://`, so it needs an http:// origin rather than a double-click.

**Live:** https://eballo.github.io/time-is-up/ · **Changes:** [CHANGELOG.md](CHANGELOG.md)

---

## Features

### Modes

Two tabs at the top of the setup screen. Each keeps its own list, duration and
settings, so switching back and forth never costs you what you typed. Training
carries its own accent so you can tell the two apart across a room.

### Setup

- **People list** — one name per line in a text box.
- **Minutes per person** — 0.5 to 10, in steps of 0.5 (same for everyone).
- **Order** — **Alphabetical** (using the active language's locale) or **Random**
  (Fisher–Yates shuffle). The order is locked in when you press *Start*.
- **Turn switching**
  - **Automatic** — moves to the next person on its own when the clock hits 0.
  - **Manual** — at 0 the alert sounds, the clock keeps counting up (`+M:SS`)
    and it waits for you to press **Next ›**.
- **Estimate** — shown under the button: `N people · X min each · ~Y min total`
  (flagged as approximate in manual mode).

In training mode the list becomes **Exercises**, the duration becomes minutes
per exercise, and **Rest between exercises** replaces the order control — a
workout's sequence is deliberate, so it runs as written. Rest is in seconds; 0
runs the exercises back to back.

### During a round

- **Start countdown** — 5 seconds ("Get ready" → 5·4·3·2·1) before the first
  person. Skippable with any key or a click.
- **Large clock** with colour states: green → amber (≤40%) → red (≤15%) →
  blinking once it goes past 0.
- **Sound cues** generated with WebAudio (no audio files): ticks during the
  countdown, a triple tone at 0, a double tone at the end.
- **Progress bar** for the turn plus a *"Person X of Y"* / *"Next: …"* indicator.
- **Participant queue** showing each person's state (now / done / upcoming).
- **Controls**: Pause / Resume, Next ›, Reset.

During a **rest**, the clock switches to its own cool colour — running out of
rest is nothing to warn anyone about — the next exercise is shown large so you
can get set, and the forward button becomes **Skip rest**.

### At the end

- **Summary** with each person's actual speaking time, the **difference vs. the
  target** (`+M:SS` in red if over, `−M:SS` in green if under) and the **total**.
  A workout lists the exercises only, and separates time spent working from the
  total including rests.
- **Fireworks** — a short celebratory `<canvas>` animation (~4s).

### Interface

- **Multi-language**: Catalan, Spanish, English, French and Dutch. The browser
  language is detected and the choice is remembered. Adding or removing a
  language is **one file + one line** → see [`src/i18n/README.md`](src/i18n/README.md).
- **Light / dark theme** — a ☀️/🌙 button in the header. Follows the system by
  default; clicking it pins a choice, which is remembered.
- **Help panel** — a collapsible "What Time is up is and how it works" section
  with the explanation and shortcuts, in the active language.
- **Responsive** from a 320px phone to a large desktop, portrait and landscape.
  The running view always fits without scrolling; on a phone the controls go
  full-width with 44px touch targets, and on very short screens the queue
  scrolls inside itself so the clock and buttons stay put.
- **Tab title** shows the state while the window is in the background:
  `1:23 · Anna`.
- **Screen wake lock** during a run, so a propped-up phone or tablet does not
  dim halfway through. Silently skipped where unsupported.
- **Detail**: the title does a small animation on hover.
- **Accessibility**: turn changes are announced to screen readers, the clock is
  a `role="timer"` that does not read out every second, and the countdown,
  fireworks and animations honour `prefers-reduced-motion`.

### Persistence

Stored in the browser (`localStorage`): people list, minutes, order, turn-switch
mode, language and theme. If a stored language no longer exists, it falls back to
English.

---

## Keyboard shortcuts

| Action | Key |
|---|---|
| Start (from the setup screen) | `Space` |
| Skip the start countdown | any key or click |
| Pause / Resume | `Space` |
| Next person | `→` |
| Back to setup (asks first during a run) | `R` |

---

## Project structure

```
index.html                 Markup; loads src/js/app.js as a module
favicon.svg
src/
  css/styles.css           All styles (themes, animations, responsive)
  js/
    app.js                 Wiring only: builds everything, routes events
    core/                  The rules. No DOM, no browser APIs.
      turn-timer.js          TurnTimer  one segment's countdown
      session.js             Session    the sequence of segments both modes run
    services/              Talking to the platform.
      preferences.js         Preferences   guarded localStorage
      translator.js          Translator    string lookup with fallback
      chime.js               Chime         WebAudio cues
      theme-controller.js    ThemeController
      screen-wake-lock.js    ScreenWakeLock
    ui/                    Everything that paints.
      elements.js            collectElements()  every id, resolved once
      setup-screen.js        SetupScreen
      running-screen.js      RunningScreen
      summary-screen.js      SummaryScreen
      preroll-countdown.js   PrerollCountdown
      fireworks.js           Fireworks
      tab-title.js           TabTitle
      keyboard-shortcuts.js  KeyboardShortcuts
    util/
      dom.js                 small DOM helpers
      time-format.js         every duration the app displays
  i18n/
    index.js                 the language list — add or remove one here
    ca.js es.js en.js fr.js nl.js
    _template.js             copy it to add a language (not imported)
    README.md                how to add/remove languages + every key
```

`core/` is deliberately free of the DOM and of browser APIs, so the timing and
turn-order rules can be reasoned about — and tested — on their own.

---

## Running

Serve the folder and open it over http://:

```sh
python3 -m http.server 8000
# http://localhost:8000
```

Opening `index.html` straight from disk does not work: browsers block ES module
loading over `file://`.

---

## Adding a language (short version)

```sh
cp src/i18n/_template.js src/i18n/de.js   # edit the code, label and strings
```

Import it in `src/i18n/index.js` and add it to the array:

```js
import de from "./de.js";
export const languages = [ca, es, en, fr, nl, de];
```

The language picker is built from that array, so it updates itself. To remove
one: delete the file and both of its lines. Full details and the key reference are in
[`src/i18n/README.md`](src/i18n/README.md).

---

## Deployment

It is a static page — any host works (GitHub Pages, Netlify, an S3 bucket…). For
**GitHub Pages**, enable Pages on the `main` branch / root.
