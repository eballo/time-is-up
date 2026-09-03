# ⏱️ Time is up

Timer rotatiu per als **stand-ups / dailies**. Dona a cada persona el mateix
temps per parlar i, quan s'acaba, passa a la següent. Així la reunió és curta,
equilibrada i tothom sap quan li toca.

Pàgina estàtica: **sense build, sense dependències, sense backend**. S'obre
directament (`file://`) o es serveix des de qualsevol hosting estàtic.

---

## Funcionalitats

### Configuració

- **Llista de persones** — una per línia en un quadre de text.
- **Minuts per persona** — de 0,5 a 10, en passos de 0,5 (igual per a tothom).
- **Ordre** — **Alfabètic** (segons la locale de l'idioma actiu) o **Aleatori**
  (barreja Fisher–Yates). L'ordre es fixa en prémer *Start*.
- **Canvi de persona**
  - **Automàtic** — en arribar a 0 salta sol a la persona següent.
  - **Manual** — en arribar a 0 sona l'avís, el rellotge continua comptant en
    positiu (`+M:SS`) i esperes a prémer **Següent ›** per canviar.
- **Estimació** — sota el botó es mostra `N persones · X min cadascú · ~Y min en
  total` (marcat com a orientatiu en mode manual).

### Durant la ronda

- **Compte enrere d'inici** — 5 segons («Prepara't» → 5·4·3·2·1) abans de la
  primera persona. Es pot saltar amb qualsevol tecla o fent clic.
- **Rellotge gran** amb estats de color: verd → groc (≤40 %) → vermell (≤15 %)
  → parpelleig quan passa de 0.
- **Avís sonor** generat amb WebAudio (cap fitxer d'àudio): tics durant el compte
  enrere, triple to en arribar a 0, doble to en acabar.
- **Barra de progrés** del torn i indicador de *«Persona X de Y»* / *«Següent: …»*.
- **Cua de participants** amb l'estat de cadascú (ara / fet / pendent).
- **Controls**: Pausa / Reprèn, Següent ›, Reinicia.

### En acabar

- **Resum** amb el temps real que ha parlat cada persona, la **diferència
  respecte l'objectiu** (`+M:SS` en vermell si s'ha passat, `−M:SS` en verd si ha
  anat curt) i el **total**.
- **Focs artificials** — animació de celebració a `<canvas>` (~4 s).

### Interfície

- **Multiidioma**: català, castellà, anglès, francès i neerlandès. Es detecta
  l'idioma del navegador i es recorda la tria. Afegir o treure idiomes és **un
  fitxer + una línia** → vegeu [`src/i18n/README.md`](src/i18n/README.md).
- **Tema clar / fosc** — botó ☀️/🌙 a la capçalera. Per defecte segueix el
  sistema; en clicar-lo el fixes i es recorda.
- **Panell d'ajuda** — desplegable «Què és Time is up i com funciona» amb
  l'explicació i les dreceres, en l'idioma actiu.
- **Detall**: el títol fa una petita animació en passar-hi el ratolí.
- **Accessibilitat**: el compte enrere, els focs artificials i les animacions
  respecten `prefers-reduced-motion`.

### Persistència

Es guarden al navegador (`localStorage`): llista de noms, minuts, ordre, mode de
canvi, idioma i tema. Si l'idioma desat ja no existeix, torna a l'anglès.

---

## Dreceres de teclat

| Acció | Tecla |
|---|---|
| Començar (des de la configuració) | `Espai` |
| Saltar el compte enrere d'inici | qualsevol tecla o clic |
| Pausa / Reprèn | `Espai` |
| Següent persona | `→` |
| Tornar a la configuració | `R` |

---

## Estructura del projecte

```
index.html               Marcatge + ordre de càrrega dels scripts
src/
  css/
    styles.css            Tots els estils (temes, animacions, layout)
  js/
    app.js                Lògica: timer, estats, render, tema, focs artificials
  i18n/
    registry.js           Motor mínim d'idiomes (window.TimeIsUpI18n)
    ca.js  es.js  en.js  fr.js  nl.js
                           Un fitxer per idioma; es registra sol
    _template.js           Còpia-la per fer un idioma nou (no es carrega)
    README.md              Com afegir/treure idiomes + totes les claus
README.md
```

Els scripts són **clàssics** (no ES modules), així que `index.html` funciona
obrint-lo directament al navegador, sense servidor. Ordre de càrrega:
`registry.js` → fitxers d'idioma → `app.js`.

---

## Ús

Obre `index.html` al navegador, o serveix la carpeta:

```sh
python3 -m http.server 8000
# http://localhost:8000
```

---

## Afegir un idioma (resum)

```sh
cp src/i18n/_template.js src/i18n/de.js   # edita codi, etiqueta i textos
```

Afegeix a `index.html`, al costat dels altres:

```html
<script src="src/i18n/de.js"></script>
```

El selector d'idioma s'actualitza sol. Per treure'n un: esborra el fitxer i la
seva línia `<script>`. Detalls i taula de claus a
[`src/i18n/README.md`](src/i18n/README.md).

---

## Desplegament

És una pàgina estàtica: qualsevol hosting serveix (GitHub Pages, Netlify, un
bucket S3…). Per **GitHub Pages**, activa Pages sobre la branca `main` / arrel.
