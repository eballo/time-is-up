/*
 * LANGUAGE TEMPLATE — copy this file to add a language.
 *
 *   1. cp src/i18n/_template.js src/i18n/<code>.js       (e.g. de.js, it.js, pt.js)
 *   2. Change the code ("xx") and label ("Language name") below.
 *   3. Translate every value. Keep the {placeholders} exactly as they are.
 *   4. In index.html, add next to the other language tags:
 *          <script src="src/i18n/<code>.js"></script>
 *
 * The language picker updates itself. To remove a language, delete its
 * file and its <script> tag.
 *
 * This file is NOT loaded by index.html (the leading "_" keeps it out).
 */
TimeIsUpI18n.register("xx", "Language name", {
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

  /* done screen */
  standupDone: "✅ Stand-up finished",
  // {people} = "5 people", {total} = "6:12", {target} = "1.5 min"
  doneSub: "{people} · {total} in total · target {target} per person",
  total: "Total",
  restart: "Start again",

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
    "At the end you see each person's time and the total."
});
