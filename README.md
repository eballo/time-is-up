# ⏱️ Time is up

A rotating timer for **stand-ups / dailies**. It gives everyone the same time to
speak and moves on to the next person when the time runs out, so the meeting
stays short, balanced, and predictable.

Static page: **no build, no dependencies, no backend**. Open it directly
(`file://`) or serve it from any static host.

---

## Features

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

### At the end

- **Summary** with each person's actual speaking time, the **difference vs. the
  target** (`+M:SS` in red if over, `−M:SS` in green if under) and the **total**.
- **Fireworks** — a short celebratory `<canvas>` animation (~4s).

### Interface

- **Multi-language**: Catalan, Spanish, English, French and Dutch. The browser
  language is detected and the choice is remembered. Adding or removing a
  language is **one file + one line** → see [`src/i18n/README.md`](src/i18n/README.md).
- **Light / dark theme** — a ☀️/🌙 button in the header. Follows the system by
  default; clicking it pins a choice, which is remembered.
- **Help panel** — a collapsible "What Time is up is and how it works" section
  with the explanation and shortcuts, in the active language.
- **Detail**: the title does a small animation on hover.
- **Accessibility**: the countdown, the fireworks and the animations honour
  `prefers-reduced-motion`.

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
| Back to setup | `R` |

---

## Project structure

```
index.html               Markup + script load order
src/
  css/
    styles.css            All styles (themes, animations, layout)
  js/
    app.js                Logic: timer, states, rendering, theme, fireworks
  i18n/
    registry.js           Tiny language registry (window.TimeIsUpI18n)
    ca.js  es.js  en.js  fr.js  nl.js
                           One file per language; self-registering
    _template.js           Copy it to add a language (not loaded)
    README.md              How to add/remove languages + every key
README.md
```

Scripts are **classic** (not ES modules), so `index.html` works when opened
straight from disk, with no server. Load order: `registry.js` → language files
→ `app.js`.

---

## Running

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# http://localhost:8000
```

---

## Adding a language (short version)

```sh
cp src/i18n/_template.js src/i18n/de.js   # edit the code, label and strings
```

Add it to `index.html`, next to the others:

```html
<script src="src/i18n/de.js"></script>
```

The language picker updates itself. To remove one: delete the file and its
`<script>` line. Full details and the key reference are in
[`src/i18n/README.md`](src/i18n/README.md).

---

## Deployment

It is a static page — any host works (GitHub Pages, Netlify, an S3 bucket…). For
**GitHub Pages**, enable Pages on the `main` branch / root.
