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

    getReady: "Preparados",
    prerollSkip: "Pulsa una tecla para empezar ya",
    themeToggle: "Cambiar tema claro/oscuro",
    helpTitle: "Qué es Time is up y cómo funciona",
    helpText:
      "Time is up es un cronómetro rotativo para los stand-ups (dailies): da a cada persona el mismo tiempo para hablar, así la reunión es corta y equilibrada.\n" +
      "Escribe los nombres, elige los minutos por persona y el orden (alfabético o aleatorio) y pulsa Empezar. Hay una cuenta atrás de 5 segundos antes de la primera persona.\n" +
      "En modo Automático se pasa solo a la siguiente persona cuando se acaba el tiempo; en modo Manual suena el aviso y tú decides cuándo continuar.\n" +
      "Al final verás cuánto ha hablado cada persona y el total. Atajos: Espacio pausa, Flecha derecha siguiente, R reinicia."
  }
};
