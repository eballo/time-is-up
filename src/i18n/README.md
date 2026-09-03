# Languages

Each language is **one file** `src/i18n/<code>.js` that registers itself.

## Adding a language

```sh
cp src/i18n/_template.js src/i18n/de.js
```

1. Edit `src/i18n/de.js`: change the code (`"de"`), the label (`"Deutsch"`) and
   translate every value. **Do not touch the `{placeholders}`.**
2. In `index.html`, add the line next to the others:

   ```html
   <script src="src/i18n/de.js"></script>
   ```

That's it. The language picker picks up the new code on its own.

## Removing a language

Delete the file `src/i18n/<code>.js` and its `<script>` line in `index.html`.
If someone had that language stored in their browser, it falls back automatically
to the fallback language (English, or the first registered one if English is not
present).

## How it works

- `registry.js` exposes `window.TimeIsUpI18n` with `register()`, `languages()`,
  `dict()`, `has()` and `fallback()`.
- `src/js/app.js` builds the `<select>` from `languages()` and translates with
  `t(key)`. If a key is missing in a language it falls back to the fallback
  language; if it is missing there too, it shows the key name.
- Load order in `index.html`: `registry.js` → language files → `app.js`.

## Translation keys

| Key | Where it shows | Notes |
|---|---|---|
| `tagline` | header subtitle | |
| `namesPlaceholder` | example inside the names box | separate names with `\n` |
| `people` | label of the names box | |
| `peopleHint` | hint next to `people` | |
| `minutesLabel` | label of the minutes field | |
| `order` / `orderAlpha` / `orderRandom` | order selector | |
| `changeMode` / `modeAuto` / `modeManual` | automatic/manual selector | |
| `start` | start button | |
| `addPeople` | text shown when the list is empty | |
| `estimate` | summary under the button | `{people}`, `{min}`, `{total}` |
| `estimateManualSuffix` | appended to `estimate` in manual mode | include the leading space |
| `personOne` / `personOther` | plural of "person" | 1 vs. the rest |
| `nowSpeaking` / `manualTag` | eyebrow of the running view | |
| `overtimeNote` | alert when time runs out (manual) | |
| `personXofY` | "Person i of n" | `{i}`, `{n}` |
| `nextIs` / `lastPerson` | who speaks next | `{name}` |
| `tagNow` / `tagDone` | queue tags | |
| `pause` / `resume` / `next` / `reset` | buttons of the running view | |
| `confirmReset` | confirmation before discarding a run in progress | plain text, shown in `confirm()` |
| `standupDone` | title of the final screen | |
| `doneSub` | subtitle of the summary | `{people}`, `{total}`, `{target}` |
| `total` | total row in the summary | |
| `restart` | "start again" button | |
| `getReady` | text above the 5s countdown | |
| `prerollSkip` | hint for skipping the countdown | |
| `themeToggle` | title/aria-label of the light/dark button | |
| `helpTitle` | text of the help panel `<summary>` | |
| `helpText` | body of the help panel | one paragraph per line (`\n`) |
