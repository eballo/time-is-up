export default {
  code: "fr",
  label: "Français",
  strings: {
    tagline: "minuteur tournant pour les stand-ups",

    namesPlaceholder: "Anaïs\nBruno\nCamille\nDavid",
    people: "Personnes",
    peopleHint: "— une par ligne. L'ordre est fixé au démarrage.",
    minutesLabel: "Minutes par personne",
    order: "Ordre",
    orderAlpha: "Alphabétique",
    orderRandom: "Aléatoire",
    changeMode: "Changement de personne",
    modeAuto: "Automatique",
    modeManual: "Manuel",
    start: "Démarrer",
    addPeople: "Ajoutez des personnes pour commencer.",
    estimate: "{people} · {min} chacun · ~{total} au total",
    estimateManualSuffix: " (indicatif)",

    personOne: "personne",
    personOther: "personnes",

    nowSpeaking: "Au tour de",
    manualTag: "mode manuel",
    overtimeNote: "Temps écoulé — appuyez sur Suivant pour continuer",
    personXofY: "Personne {i} / {n}",
    nextIs: "Suivant : {name}",
    lastPerson: "Dernière personne",
    tagNow: "en cours",
    tagDone: "fait",
    pause: "Pause",
    resume: "Reprendre",
    next: "Suivant ›",
    reset: "Réinitialiser",
    confirmReset: "Arrêter le tour et revenir à la configuration ?",

    standupDone: "✅ Stand-up terminé",
    doneSub: "{people} · {total} au total · objectif {target} par personne",
    total: "Total",
    restart: "Recommencer",

    getReady: "Prêt ?",
    prerollSkip: "Appuyez sur une touche pour commencer",
    themeToggle: "Basculer le thème clair/sombre",
    helpTitle: "Qu'est-ce que Time is up et comment ça marche",
    helpText:
      "Time is up est un minuteur tournant pour les stand-ups (dailies) : il donne à chacun le même temps de parole, pour une réunion courte et équilibrée.\n" +
      "Saisissez les noms, choisissez les minutes par personne et l'ordre (alphabétique ou aléatoire), puis appuyez sur Démarrer. Un compte à rebours de 5 secondes précède la première personne.\n" +
      "En mode Automatique, on passe seul à la personne suivante à la fin du temps ; en mode Manuel, l'alerte sonne et vous décidez quand continuer.\n" +
      "À la fin, vous voyez le temps de parole de chacun et le total. Raccourcis : Espace pause, Flèche droite suivant, R réinitialise.",

    /* training mode */
    modeLabel: "Mode",
    modeStandup: "Stand-up",
    modeTraining: "Entraînement",
    changeModeTraining: "Changement d'activité",
    exercises: "Exercices",
    exercisesHint: "— un par ligne, dans l'ordre où vous les ferez.",
    exercisesPlaceholder: "Pompes\nSquats\nGainage\nFentes",
    minutesPerExerciseLabel: "Minutes par exercice",
    restLabel: "Repos entre les exercices",
    restHint: "secondes · 0 pour enchaîner",
    addExercises: "Ajoutez des exercices pour commencer.",
    estimateTraining: "{items} · {min} chacun · {rest} de repos · ~{total} au total",
    restNone: "sans repos",
    exerciseOne: "exercice",
    exerciseOther: "exercices",
    exerciseXofY: "Exercice {i} / {n}",
    restingNow: "Repos",
    skipRest: "Passer le repos",
    lastExercise: "Dernier exercice",
    workoutDone: "💪 Séance terminée",
    doneSubTraining: "{items} · {worked} d'effort · {total} au total"
  }
};
