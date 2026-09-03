# Idiomes / Languages

Cada idioma és **un fitxer** `src/i18n/<codi>.js` que es registra sol.

## Afegir un idioma

```sh
cp src/i18n/_template.js src/i18n/de.js
```

1. Edita `src/i18n/de.js`: canvia el codi (`"de"`), l'etiqueta (`"Deutsch"`) i
   tradueix tots els valors. **No toquis els `{placeholders}`.**
2. A `index.html`, afegeix la línia al costat de les altres:

   ```html
   <script src="src/i18n/de.js"></script>
   ```

Ja està. El selector d'idioma s'actualitza sol amb el nou codi.

## Treure un idioma

Esborra el fitxer `src/i18n/<codi>.js` i la seva línia `<script>` a `index.html`.
Si algú tenia aquell idioma desat al navegador, torna automàticament a l'idioma
de reserva (anglès, o el primer registrat si l'anglès no hi és).

## Com funciona

- `registry.js` exposa `window.TimeIsUpI18n` amb `register()`, `languages()`,
  `dict()`, `has()` i `fallback()`.
- `src/js/app.js` construeix el `<select>` a partir de `languages()` i tradueix
  amb `t(clau)`. Si una clau falta en un idioma, cau a l'idioma de reserva; si hi
  falta també, mostra el nom de la clau.
- Ordre de càrrega a `index.html`: `registry.js` → fitxers d'idioma → `app.js`.

## Claus de traducció

| Clau | On surt | Notes |
|---|---|---|
| `tagline` | subtítol de la capçalera | |
| `namesPlaceholder` | exemple dins el quadre de noms | separa noms amb `\n` |
| `people` | etiqueta del quadre de noms | |
| `peopleHint` | pista al costat de `people` | |
| `minutesLabel` | etiqueta del camp de minuts | |
| `order` / `orderAlpha` / `orderRandom` | selector d'ordre | |
| `changeMode` / `modeAuto` / `modeManual` | selector automàtic/manual | |
| `start` | botó d'inici | |
| `addPeople` | text quan la llista és buida | |
| `estimate` | resum sota el botó | `{people}`, `{min}`, `{total}` |
| `estimateManualSuffix` | s'afegeix a `estimate` en mode manual | inclou l'espai inicial |
| `personOne` / `personOther` | plural de «persona» | 1 vs. la resta |
| `nowSpeaking` / `manualTag` | eyebrow de la vista en marxa | |
| `overtimeNote` | avís quan s'acaba el temps (manual) | |
| `personXofY` | «Persona i de n» | `{i}`, `{n}` |
| `nextIs` / `lastPerson` | qui parla després | `{name}` |
| `tagNow` / `tagDone` | etiquetes de la cua | |
| `pause` / `resume` / `next` / `reset` | botons de la vista en marxa | |
| `standupDone` | títol de la pantalla final | |
| `doneSub` | subtítol del resum | `{people}`, `{total}`, `{target}` |
| `total` | fila de total al resum | |
| `restart` | botó de tornar a començar | |
| `getReady` | text sobre el compte enrere de 5 s | |
| `prerollSkip` | pista per saltar-se el compte enrere | |
| `themeToggle` | títol/aria-label del botó clar/fosc | |
| `helpTitle` | text del `<summary>` del panell d'ajuda | |
| `helpText` | cos del panell d'ajuda | un paràgraf per línia (`\n`) |
