export default {
  code: "en",
  label: "English",
  strings: {
    tagline: "rotating timer for stand-ups",

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
    estimate: "{people} · {min} each · ~{total} total",
    estimateManualSuffix: " (approx.)",

    personOne: "person",
    personOther: "people",

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
    confirmReset: "Stop the round and go back to setup?",

    standupDone: "✅ Stand-up finished",
    doneSub: "{people} · {total} in total · target {target} per person",
    total: "Total",
    restart: "Start again",
    share: "Share",
    shareCopied: "Link copied",

    getReady: "Get ready",
    prerollSkip: "Press any key to start now",
    themeToggle: "Toggle light/dark theme",
    helpTitle: "What Time is up is and how it works",
    helpText:
      "Time is up is a rotating timer for stand-ups (dailies): it gives everyone the same time to speak, so the meeting stays short and balanced.\n" +
      "Type the names, pick the minutes per person and the order (alphabetical or random), then press Start. A 5-second countdown runs before the first person.\n" +
      "In Automatic mode it moves to the next person on its own when time runs out; in Manual mode it just sounds the alert and you decide when to continue.\n" +
      "At the end you see how long each person spoke and the total. Shortcuts: Space pauses, Right arrow next, R resets.\n" +
      "Your settings (names, minutes, language and theme) are kept in your own browser using localStorage, not cookies. Nothing leaves your device: no accounts, no server, no tracking.",

    /* training mode */
    modeLabel: "Mode",
    modeStandup: "Stand-up",
    modeTraining: "Training",
    changeModeTraining: "Activity switching",
    exercises: "Exercises",
    exercisesHint: "— one per line, in the order you'll do them. A blank line starts a new block.",
    exercisesPlaceholder: "Push-ups\nSquats\nPlank\nLunges",
    exercisesDefault:
      "Military press\nDumbbell squats\nMilitary press\nDumbbell squats\nMilitary press\nDumbbell squats\n\n" +
      "Dumbbell rows\nDumbbell lunges\nDumbbell rows\nDumbbell lunges\nDumbbell rows\nDumbbell lunges\n\n" +
      "Push-ups\nRussian twists\nPush-ups\nRussian twists\nPush-ups\nRussian twists",
    secondsPerExerciseLabel: "Seconds per exercise",
    restLabel: "Rest between exercises",
    restHint: "seconds · 0 to run them back to back",
    blockRestLabel: "Rest between blocks",
    blockRestHint: "seconds · the block change",
    addExercises: "Add exercises to get started.",
    estimateTraining: "{items} · {min} each · {rest} rest · ~{total} total",
    restNone: "no rest",
    exerciseOne: "exercise",
    exerciseOther: "exercises",
    exerciseXofY: "Exercise {i} of {n}",
    restingNow: "Rest",
    skipRest: "Skip rest",
    lastExercise: "Last exercise",
    blockStarting: "Starting block {i}",
    blockXofY: "Block {i} of {n}",
    blockChange: "Block change!",
    letsGo: "Let's go!",
    workoutLabel: "Routine",
    workoutCustom: "My own list",
    workoutDay: "Day {n} · {title}",
    workoutHint: "— each block is done {rounds} times through (A, B, A, B…).",
    blockTitle: "Block {i}: {title}",
    workoutDone: "💪 Workout finished",
    doneSubTraining: "{items} · {worked} working · {total} in total"
  }
};
