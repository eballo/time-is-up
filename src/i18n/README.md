# Languages

Each language is **one file** `src/i18n/<code>.js` that registers itself.

## Adding a language

```sh
cp src/i18n/_template.js src/i18n/de.js
```

1. Edit `src/i18n/de.js`: change the code (`"de"`), the label (`"Deutsch"`) and
   translate every value. **Do not touch the `{placeholders}`.**
2. In `src/i18n/index.js`, import it and add it to the array:

   ```js
   import de from "./de.js";
   export const languages = [ca, es, en, fr, nl, de];
   ```

That's it. The language picker is built from that array, so it picks up the new
code on its own.

## Removing a language

Delete the file `src/i18n/<code>.js` and both of its lines in `index.js`.
If someone had that language stored in their browser, it falls back automatically
to the fallback language (English, or the first registered one if English is not
present).

## The training programme

The day-by-day workouts live apart from the interface strings, in
`src/i18n/workouts/<code>.js`: an array of days, each with a title and blocks,
each block with a title and its exercises as `[name, description]`. Every file
holds the same days in the same order, and a test checks that they line up.
Register a new language's file in `src/i18n/workouts/index.js`; without one,
the programme shows in English.

## How it works

- Each language file default-exports `{ code, label, strings }`.
- `index.js` collects them into `languages` and names the `FALLBACK_LANGUAGE`.
- `src/js/services/translator.js` wraps that list. `translate(key)` falls back to
  the fallback language when a key is missing, and to the key name itself when it
  is missing there too — so a half-finished language degrades to English rather
  than blanking the interface.
- `src/js/app.js` builds the `<select>` from `translator.languages`.

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
| `modeLabel` | accessible name of the mode tabs | |
| `modeStandup` / `modeTraining` | the two mode tabs | |
| `exercises` / `exercisesHint` | label and hint of the exercise list | |
| `exercisesPlaceholder` | example exercises | separate lines with `\n` |
| `exercisesDefault` | the workout the list starts with until it is edited | `\n` between exercises, `\n\n` between blocks |
| `secondsPerExerciseLabel` | label of the duration field in training (seconds) | |
| `restLabel` / `restHint` | the rest field and the note under it | |
| `addExercises` | shown when the exercise list is empty | |
| `estimateTraining` | summary under the button, training mode | `{items}`, `{min}`, `{rest}`, `{total}` |
| `restNone` | stands in for the rest value when it is 0 | |
| `exerciseOne` / `exerciseOther` | plural of "exercise" | 1 vs. the rest |
| `exerciseXofY` | "Exercise i of n" | `{i}`, `{n}` |
| `restingNow` | eyebrow while resting | |
| `skipRest` | the forward button during a rest | |
| `lastExercise` | shown instead of "next" on the last exercise | |
| `blockStarting` | names an untitled block during the change into it | `{i}` |
| `blockChange` | big text during the rest between two blocks | |
| `letsGo` | replaces `blockChange` for the last 3 seconds of that rest | |
| `blockRestLabel` / `blockRestHint` | the rest-between-blocks field and the note beside it | |
| `blockXofY` | prefixed to `exerciseXofY` when the list has blocks | `{i}`, `{n}` |
| `workoutLabel` | label of the routine picker in training | |
| `workoutCustom` | the picker option that runs your own list | |
| `workoutDay` | one picker option per programme day | `{n}`, `{title}` |
| `workoutHint` | hint beside the exercises while a day is chosen | `{rounds}` |
| `blockTitle` | heading of each block in the day's preview | `{i}`, `{title}` |
| `workoutDone` | title of the final screen, training mode | |
| `doneSubTraining` | subtitle of the training summary | `{items}`, `{worked}`, `{total}` |
| `getReady` | text above the 5s countdown | |
| `prerollSkip` | hint for skipping the countdown | |
| `themeToggle` | title/aria-label of the light/dark button | |
| `helpTitle` | text of the help panel `<summary>` | |
| `helpText` | body of the help panel | one paragraph per line (`\n`) |
