/*
 * LANGUAGE TEMPLATE — copy this file to add a language.
 *
 *   1. cp src/i18n/_template.js src/i18n/<code>.js       (e.g. de.js, it.js, pt.js)
 *   2. Change the code ("xx") and label ("Language name") below.
 *   3. Translate every value. Keep the {placeholders} exactly as they are.
 *   4. In src/i18n/index.js, import it and add it to the languages array:
 *          import de from "./de.js";
 *          export const languages = [ca, es, en, fr, nl, de];
 *
 * The language picker is built from that array, so it updates itself. To
 * remove a language, delete its file and both of its lines in index.js.
 *
 * This file is not imported anywhere (the leading "_" marks it as a template).
 */
export default {
  code: "xx",
  label: "Language name",
  strings: {
    /* header */
    tagline: "rotating timer for stand-ups",

    /* setup screen */
    namesPlaceholder: "Anna\nBrian\nCarla\nDavid",
    people: "People",
    peopleHint: "— one per line. The order is locked in when you start.",
    minutesLabel: "Minutes per person",
    order: "Order",
    orderAlpha: "Alphabetical",
    orderRandom: "Random",
    changeMode: "Turn switching",
    modeAuto: "Automatic",
    modeManual: "Manual",
    start: "Start",
    addPeople: "Add people to get started.",
    // {people} = "5 people", {min} = "1.5 min", {total} = "8 min"
    estimate: "{people} · {min} each · ~{total} total",
    estimateManualSuffix: " (approx.)",

    /* plural of "person" — {one} used for exactly 1, {other} otherwise */
    personOne: "person",
    personOther: "people",

    /* running screen */
    nowSpeaking: "Now speaking",
    manualTag: "manual mode",
    overtimeNote: "Time's up — press Next to continue",
    personXofY: "Person {i} of {n}",
    nextIs: "Next: {name}",
    lastPerson: "Last person",
    tagNow: "now",
    tagDone: "done",
    pause: "Pause",
    resume: "Resume",
    next: "Next ›",
    reset: "Reset",
    // shown in a confirm() when Reset would discard a run in progress
    confirmReset: "Stop the round and go back to setup?",

    /* done screen */
    standupDone: "✅ Stand-up finished",
    // {people} = "5 people", {total} = "6:12", {target} = "1.5 min"
    doneSub: "{people} · {total} in total · target {target} per person",
    total: "Total",
    restart: "Start again",
    share: "Share",
    shareCopied: "Link copied",

    /* pre-roll countdown, theme button, help panel */
    getReady: "Get ready",
    prerollSkip: "Press any key to start now",
    themeToggle: "Toggle light/dark theme",
    helpTitle: "What Time is up is and how it works",
    // one paragraph per line — split on "\n"
    helpText:
      "Time is up is a rotating timer for stand-ups: everyone gets the same time to speak.\n" +
      "Type the names, pick minutes per person and the order, then press Start.\n" +
      "Automatic mode moves on by itself; Manual mode waits for you to press Next.\n" +
      "At the end you see each person's time and the total.\n" +
      "Your settings are kept in your own browser using localStorage, not cookies. Nothing leaves your device: no accounts, no server, no tracking.",

    /* ---- training mode ---- */
    modeLabel: "Mode",
    modeStandup: "Stand-up",
    modeTraining: "Training",
    changeModeTraining: "Activity switching",
    exercises: "Exercises",
    exercisesHint: "\u2014 one per line, in the order you'll do them.",
    exercisesPlaceholder: "Push-ups\nSquats\nPlank\nLunges",
    minutesPerExerciseLabel: "Minutes per exercise",
    restLabel: "Rest between exercises",
    restHint: "seconds \u00b7 0 to run them back to back",
    addExercises: "Add exercises to get started.",
    // {items} = "4 exercises", {min} = "0.5 min", {rest} = "30 s", {total} = "4 min"
    estimateTraining: "{items} \u00b7 {min} each \u00b7 {rest} rest \u00b7 ~{total} total",
    restNone: "no rest",
    exerciseOne: "exercise",
    exerciseOther: "exercises",
    exerciseXofY: "Exercise {i} of {n}",
    restingNow: "Rest",
    skipRest: "Skip rest",
    lastExercise: "Last exercise",
    workoutDone: "\ud83d\udcaa Workout finished",
    // {worked} = time actually exercising, {total} = including rests
    doneSubTraining: "{items} \u00b7 {worked} working \u00b7 {total} in total"
  }
};
