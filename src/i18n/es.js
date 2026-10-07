export default {
  code: "es",
  label: "Español",
  strings: {
    tagline: "temporizador rotativo para stand-ups",

    namesPlaceholder: "Ana\nBruno\nCarla\nDavid",
    people: "Personas",
    peopleHint: "— una por línea. El orden se fija al empezar.",
    minutesLabel: "Minutos por persona",
    order: "Orden",
    orderAlpha: "Alfabético",
    orderRandom: "Aleatorio",
    changeMode: "Cambio de persona",
    modeAuto: "Automático",
    modeManual: "Manual",
    start: "Empezar",
    addPeople: "Añade personas para empezar.",
    estimate: "{people} · {min} cada uno · ~{total} en total",
    estimateManualSuffix: " (orientativo)",

    personOne: "persona",
    personOther: "personas",

    nowSpeaking: "Ahora habla",
    manualTag: "modo manual",
    overtimeNote: "Tiempo agotado — pulsa Siguiente para continuar",
    personXofY: "Persona {i} de {n}",
    nextIs: "Siguiente: {name}",
    lastPerson: "Última persona",
    tagNow: "ahora",
    tagDone: "hecho",
    pause: "Pausa",
    resume: "Reanudar",
    next: "Siguiente ›",
    reset: "Reiniciar",
    confirmReset: "¿Quieres detener la ronda y volver a la configuración?",

    standupDone: "✅ Stand-up terminado",
    doneSub: "{people} · {total} en total · objetivo {target} por persona",
    total: "Total",
    restart: "Volver a empezar",
    share: "Compartir",
    shareCopied: "Enlace copiado",

    getReady: "Preparados",
    prerollSkip: "Pulsa una tecla para empezar ya",
    themeToggle: "Cambiar tema claro/oscuro",
    helpTitle: "Qué es Time is up y cómo funciona",
    helpText:
      "Time is up es un cronómetro rotativo para los stand-ups (dailies): da a cada persona el mismo tiempo para hablar, así la reunión es corta y equilibrada.\n" +
      "Escribe los nombres, elige los minutos por persona y el orden (alfabético o aleatorio) y pulsa Empezar. Hay una cuenta atrás de 5 segundos antes de la primera persona.\n" +
      "En modo Automático se pasa solo a la siguiente persona cuando se acaba el tiempo; en modo Manual suena el aviso y tú decides cuándo continuar.\n" +
      "Al final verás cuánto ha hablado cada persona y el total. Atajos: Espacio pausa, Flecha derecha siguiente, R reinicia.\n" +
      "La configuración (nombres, minutos, idioma y tema) se guarda en tu navegador con localStorage, no con cookies. No sale de tu dispositivo: ni cuentas, ni servidor, ni seguimiento.",

    /* training mode */
    modeLabel: "Modo",
    modeStandup: "Stand-up",
    modeTraining: "Entrenamiento",
    changeModeTraining: "Cambio de actividad",
    exercises: "Ejercicios",
    exercisesHint: "— uno por línea, en el orden en que los harás. Una línea en blanco separa los bloques.",
    exercisesPlaceholder: "Flexiones\nSentadillas\nPlancha\nZancadas",
    exercisesDefault:
      "Press militar\nSentadillas con mancuernas\nPress militar\nSentadillas con mancuernas\nPress militar\nSentadillas con mancuernas\n\n" +
      "Remo con mancuernas\nZancadas con mancuernas\nRemo con mancuernas\nZancadas con mancuernas\nRemo con mancuernas\nZancadas con mancuernas\n\n" +
      "Flexiones\nGiros rusos\nFlexiones\nGiros rusos\nFlexiones\nGiros rusos",
    secondsPerExerciseLabel: "Segundos por ejercicio",
    restLabel: "Descanso entre ejercicios",
    restHint: "segundos · 0 para encadenarlos",
    blockRestLabel: "Descanso entre bloques",
    blockRestHint: "segundos · el cambio de bloque",
    addExercises: "Añade ejercicios para empezar.",
    estimateTraining: "{items} · {min} cada uno · {rest} de descanso · ~{total} en total",
    restNone: "sin descanso",
    exerciseOne: "ejercicio",
    exerciseOther: "ejercicios",
    exerciseXofY: "Ejercicio {i} de {n}",
    restingNow: "Descanso",
    skipRest: "Saltar descanso",
    lastExercise: "Último ejercicio",
    blockStarting: "Empezamos el bloque {i}",
    blockXofY: "Bloque {i} de {n}",
    blockChange: "¡Cambio de bloque!",
    letsGo: "¡Vamos!",
    workoutLabel: "Rutina",
    workoutCustom: "Lista propia",
    workoutDay: "Día {n} · {title}",
    workoutHint: "— cada bloque se hace {rounds} veces seguidas (A, B, A, B…).",
    blockTitle: "Bloque {i}: {title}",
    historyStreak: "🔥 Racha de {days}",
    historyBest: "mejor: {days}",
    historyNone: "Aún no has terminado ningún entrenamiento. ¡Hoy puede ser el primero!",
    dayOne: "día",
    dayOther: "días",
    workoutOne: "entrenamiento",
    workoutOther: "entrenamientos",
    workoutDone: "💪 Entrenamiento terminado",
    doneSubTraining: "{items} · {worked} de ejercicio · {total} en total"
  }
};
