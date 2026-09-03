# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-09-03

### Added

- Favicon, so the tab is identifiable and the site stops answering
  `/favicon.ico` with a 404. Also a meta description and a `theme-color` that
  follows the active theme.
- The tab title now carries the state that matters while the window is in the
  background: `1:23 · Anna`, restored to the plain name once the round ends.
- A screen wake lock during a run, so the phone or tablet propped up for the
  meeting stops dimming halfway through. Re-acquired after a tab switch, and a
  no-op where the API is missing or the context is insecure.
- A confirmation before Reset discards a run in progress — one stray `R`
  used to wipe it. New `confirmReset` translation key.

- **The layout is properly responsive.** The running view — the one people
  actually watch during a stand-up — now fits without scrolling on every size
  tested, from a 320×568 phone to a 1920×1080 desktop, in portrait and
  landscape. Previously it needed 158px of scrolling on an iPhone 8 and 425px
  on a phone in landscape, because the clock and speaker were sized off
  viewport *width* only and stayed huge on short screens; both are now capped
  by viewport height as well. Phones get tighter padding, full-width controls
  and 44px touch targets (the theme button was 28px); on genuinely short
  screens the participant queue scrolls inside itself so the clock and buttons
  stay put, and on a landscape phone it gives way entirely. Long names can no
  longer widen a row.
- Fireworks motion is driven by elapsed time instead of per-frame steps, so it
  lasts the same few seconds on a 144 Hz display as on a 60 Hz one. Spent
  particles are dropped rather than carried, and a wall-clock backstop tears the
  canvas down even if the tab is hidden and no frames ever run.

### Changed

- **The run controls now say what they are for.** Pause was the filled accent
  button and Next looked identical to Reset, which had the hierarchy backwards:
  Next is pressed once per person, Pause occasionally, and Reset throws the whole
  run away. Next takes the filled accent, Pause is a quiet peer, and Reset is
  recessed — no border, muted text — turning red only when you reach for it, so
  a destructive action no longer looks like the button beside it. The colours
  stay out of it deliberately: the clock's green→amber→red is the only signal
  that carries meaning, and three coloured buttons would compete with it.
- Run and summary controls are centred under their centred compositions instead
  of sitting on the left margin. Setup keeps its button on the left with the
  form fields.
- The whole app is vertically centred once it fits the viewport, which mainly
  shows on a landscape tablet where the card used to sit at the top with dead
  space below it.
- A scrollable participant queue fades at its cut edge, so a half-visible row
  reads as "more below" rather than as a row that failed to draw.

- **The JavaScript is now a set of small ES modules built around classes**,
  replacing a single 854-line IIFE with 45 functions over one shared mutable
  `state` object. Eighteen files averaging under a hundred lines, split by what
  they are responsible for: `core/` holds the rules (`TurnTimer`, `StandupRun`)
  and touches neither the DOM nor any browser API, `services/` wraps the
  platform (`Preferences`, `Translator`, `Chime`, `ThemeController`,
  `ScreenWakeLock`), `ui/` holds everything that paints, and `app.js` is
  reduced to wiring. Behaviour is unchanged; names now say what things are
  (`chime.timeUp()` rather than `beep(3)`).
- **Languages are ES modules too.** Each file default-exports
  `{ code, label, strings }` and `src/i18n/index.js` lists them, replacing the
  global `TimeIsUpI18n` registry. Adding one is still a file plus a line — an
  import instead of a `<script>` tag. A stored `tiu.order` of `"alpha"` written
  by earlier versions is still understood, so upgrading does not silently reset
  the order preference.
- **`index.html` no longer opens straight from disk.** Browsers refuse to load
  ES modules over `file://`, so the folder has to be served over http://. The
  published site and any static host are unaffected; the README says so.

### Fixed

- **The countdown no longer freezes in a background tab.** It was decrementing a
  counter once per `setInterval` callback; browsers throttle those in hidden tabs
  and stop them while the machine sleeps, so switching away mid stand-up silently
  stalled the clock and skewed every recorded time by the same amount. The
  countdown is now derived from a wall-clock deadline, catches up on
  `visibilitychange`, and only ever advances one turn on return.
- **Space no longer fires twice when a button has focus.** A focused button
  already activates on Space/Enter, so a single keypress ran both the button and
  the global shortcut: after clicking Pause with the mouse, Space appeared to stop
  working (the two toggles cancelled out), and Space on a focused "Next" advanced
  and paused at once. Arrow keys and `R` still work while a button has focus.
- **The page no longer renders blank when `localStorage` is unavailable.** Reading
  it throws in Safari private browsing and whenever site data is blocked, and the
  first read happened during init, aborting the whole script. All access is now
  guarded; preferences are simply not persisted in that case.
- The five-second start countdown is on the same wall clock as the turn timer,
  so tabbing away during the count-in no longer parks a run on "5".
- Accessibility: turn changes are announced (`aria-live` on the speaker), the
  clock is a `role="timer"` that does not spam a screen reader every second,
  the two `<label>` elements that labelled button groups rather than a form
  control are now `<span>`s, and the summary heading is a real `<h2>`.
- Pressing `R` during the start countdown now offers to reset, matching what
  the Reset button already did there.

## [1.0.0] - 2026-09-03

First release.

### Added

- Rotating stand-up timer: equal speaking time per person, moving on when the
  time runs out.
- People list, minutes per person (0.5–10), alphabetical or random order
  (Fisher–Yates), locked in at start.
- Automatic or manual turn switching. Manual keeps counting into overtime
  (`+M:SS`) until you press Next.
- Five-second start countdown, skippable with any key or a click.
- Colour-coded clock (green → amber → red → blinking overtime), turn progress
  bar, participant queue, and estimated total.
- WebAudio cues with no audio files: ticks during the countdown, a triple tone at
  zero, a double tone at the end.
- End summary with each person's actual time, the difference against the target,
  and the total — plus a fireworks animation.
- Five languages (Catalan, Spanish, English, French, Dutch), auto-detected from
  the browser and remembered. One file per language, self-registering, so adding
  or removing one is a file plus a `<script>` tag.
- Light/dark theme toggle that follows the system until you pin a choice.
- Collapsible help panel and keyboard shortcuts (`Space`, `→`, `R`).
- Preferences persisted in `localStorage`; animations honour
  `prefers-reduced-motion`.

[Unreleased]: https://github.com/eballo/time-is-up/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/eballo/time-is-up/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/eballo/time-is-up/releases/tag/v1.0.0
