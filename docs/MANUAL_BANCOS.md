# Manual de bancos de contenido — *La Aventura de Nelson*

> ⚠️ **DESACTUALIZADO en parte.** Casi todas las actividades migraron a la arquitectura nueva: su contenido
> vive en **`data/contenido/<modo>.json`** y lo consume el runner `src/core/contenido.js`. Para editar esos
> bancos, usa **`docs/ESQUEMA_CONTENIDO.md`** (esquema canónico). Este manual sigue siendo válido para las
> excepciones con loader propio (ortografia, copia/párrafos, quiz, mapas) y para los conceptos generales;
> ignora las referencias a `src/modos/<modo>.js` de actividades ya migradas (esos archivos se eliminaron).

> Guía técnica para **editar, mejorar y ampliar** el contenido (preguntas, ítems, palabras) de cada
> actividad. Pensada para que la siga una persona **o otra IA** sin contexto previo. Si eres una IA:
> respeta **exactamente** las estructuras de datos; **no cambies** la lógica, los `export`/globales ni los
> prefijos; solo edita los **arreglos de datos**. Verifica siempre con `bun` y los smoke tests (final).

---

## 0. Contexto técnico mínimo

- **Stack**: HTML/CSS/**JavaScript vanilla** + three.js. **Sin npm, sin imports ES, sin `fetch`**. Debe
  funcionar con **doble clic** (`file://`) y servido.
- **Módulos IIFE** que exponen globales (`window.X`). Cada actividad = una página en `paginas/<modo>.html`
  + un módulo en `src/modos/<modo>.js`.
- **Dónde vive el contenido**:
  - La **mayoría es INLINE** dentro de `src/modos/<modo>.js` (arreglos JS). Editar el `.js` directamente.
  - **Excepciones en archivos de datos** (`data/*.json`, se compilan a `data/*.js`):
    - `data/ortografia.json` → palabras de ortografía.
    - `data/parrafos.json` → textos de "Corregir y Dictado".
    - `data/materias.json` → menú (qué actividades aparecen en cada materia).
    - Tras editar cualquier `data/*.json` hay que **recompilar**: `python herramientas/build.py`.
- **Idioma/nivel**: español del **Ecuador**, vocabulario para **~9 años** (Quinto de básica). Mantener
  tildes y ñ. Textos cortos (caben en un botón).

### Niveles de dificultad
Cada perfil tiene un nivel: **básico (0)**, **intermedio (1)**, **avanzado (2)**. En el código:
- `Juego.nivelIdx()` → `0 | 1 | 2`.
- `Juego.porNivel([valorBasico, valorIntermedio, valorAvanzado])` → devuelve el valor del nivel actual.
- **Convención de banco por niveles**: casi todos los bancos son un arreglo de 3 posiciones
  `[ básico, intermedio, avanzado ]`.
- **Helper `itemDe(niveles, niv)`** (presente en los módulos que escalan por nivel): toma un ítem al azar
  del nivel `niv`; si ese nivel está **vacío**, **baja** automáticamente al nivel inferior. Esto permite
  dejar `[]` en niveles donde una categoría aún no aplica.

### Motores y cómo resuelven una ronda
- **`Actividad(px, temas)`** (`src/core/actividad.js`) — actividades **manipulativas**. `temas` es un
  arreglo de `{ icono, nombre, desc, total?, ronda(host, ctrl) }`. La función `ronda` **arma la
  interacción** dentro de `host` y resuelve con el objeto `ctrl`:
  - `ctrl.ganar()` → acierto, frase positiva y avanza.
  - `ctrl.fallar(msgHTML)` → error, **revela** y avanza (termina la ronda).
  - `ctrl.reintento(msg)` → error pero **se queda** (que el niño reintente).
  - `ctrl.pregunta(html)` → escribe el enunciado. `ctrl.retro(txt, "bien"|"mal")`.
  - Atajos: `ctrl.azar(a,b)`, `ctrl.azarEl(arr)`, `ctrl.mezclar(arr)`.
- **`MC(px, temas)`** (`src/core/mc.js`) — **opción múltiple** (10 preguntas). `temas` =
  `{ icono, nombre, desc, gens:[fn,…] }`; cada `fn()` devuelve
  `{ tema, pregunta, opciones:[…], correcta, html?, pista? }`.
- **Ayudantes de arrastre/toque** (`src/core/arrastrar.js`), se usan **dentro** de una `ronda` de `Actividad`:
  - `Arrastrar.clasificar(host, ctrl, { pregunta, cestas:[{id,nombre,emoji}], items:[{txt,cesta}] })`.
  - `Arrastrar.emparejar(host, ctrl, { pregunta, pares:[{a,b}] })`.
  - `Arrastrar.ordenar(host, ctrl, { pregunta, correcto:[…en orden…] })`.

El **leaderboard** y los **niveles** se heredan gratis: no hay que tocar nada para eso.

---

## 1. Los 6 TIPOS DE BANCO (estructuras de datos)

Cada actividad usa uno o varios de estos tipos. Para editar/mejorar, **localiza el arreglo** y sigue la
forma exacta.

### A) Clasificar en cestas  (interacción: arrastrar a su grupo)
Patrón de referencia: `src/modos/animales.js`, `src/modos/invertebrados.js`.
```js
// Metadatos de cada cesta (id → nombre + emoji)
const G = { mamif: { nombre: "Mamífero", emoji: "🐘" }, ave: { nombre: "Ave", emoji: "🦅" }, /* … */ };

const TEMAS = [{
  icono: "🐾", nombre: "Grupos de vertebrados", desc: "…",
  pregunta: "¿A qué grupo pertenece? 👇",
  // Qué cestas aparecen por nivel  [básico, intermedio, avanzado]:
  cestasNivel: [["mamif","ave","pez"], ["mamif","ave","pez","reptil"], ["mamif","ave","pez","reptil","anfibio"]],
  // Ejemplos por cesta, cada uno [básico, intermedio, avanzado]:
  banco: {
    mamif: [["el perro","la vaca"], ["el caballo","la llama"], ["la ballena","el delfín"]],
    ave:   [["la gallina","el pato"], ["el cóndor","el colibrí"], ["el pingüino","el búho"]],
    /* … una entrada por cada id que aparezca en cestasNivel … */
  }
}];
```
**Reglas:** cada ronda toma **un ítem por cada cesta activa** (vía `itemDe`). Dentro de **un mismo tema**,
un mismo ejemplo debe pertenecer a **una sola cesta** (no repetir "la rana" en dos cestas). Para **agregar
ejemplos**: añádelos al arreglo del nivel correspondiente. Para **subir dificultad**: pon ejemplos menos
obvios en el índice `[2]` (avanzado).

### B) Emparejar parejas  (interacción: une izquierda↔derecha)
Referencia: `src/modos/sinonimos.js`, `src/modos/refranes.js`, `src/modos/epoca.js`.
```js
// Banco por nivel; cada nivel es una lista de parejas {a, b}:
const SINONIMOS = [
  [ {a:"feliz", b:"contento"}, {a:"grande", b:"enorme"} ],      // básico
  [ {a:"valiente", b:"audaz"}, {a:"empezar", b:"comenzar"} ],   // intermedio
  [ {a:"diminuto", b:"pequeño"}, {a:"hermoso", b:"precioso"} ]  // avanzado
];
// En la ronda:  Arrastrar.emparejar(host, ctrl, { pregunta, pares: Juego.porNivel(SINONIMOS) });
```
**Reglas:** `a` y `b` son las dos mitades que se unen. Textos **cortos**. Para refranes: `a`=comienzo,
`b`=final. Para adivinanzas: `a`=adivinanza, `b`=respuesta.

### C) Ordenar / línea de tiempo  (interacción: toca en orden)
Referencia: `src/modos/ordena.js` (oraciones), `src/modos/silabas.js` (sílabas),
`src/modos/alfabetico.js` (orden alfabético), `src/modos/epoca.js` (periodos).
```js
// Banco por nivel; cada nivel es una lista de "secuencias correctas":
const PERIODOS = [
  ["Paleoindio: cazadores", "Formativo: cerámica", "Integración: confederaciones"],   // básico
  ["Paleoindio: cazadores", "Formativo: cerámica", "Desarrollo Regional: orfebrería", "Integración: confederaciones"], // intermedio
  [ /* avanzado … */ ]
];
// En la ronda:  Arrastrar.ordenar(host, ctrl, { pregunta, correcto: Juego.porNivel(PERIODOS) });
```
**Reglas:** el arreglo va **en el orden correcto** (el juego lo baraja). El niño debe tocarlos en ese
orden. Para sílabas: el arreglo son las sílabas **separadas a mano** (`["ma","ri","po","sa"]`) — verificar
cada separación. Para alfabético: el módulo ordena solo (no escribir el orden a mano), pero el grupo de
palabras debe poder ordenarse sin ambigüedad.

### D) ¿Verdadero o falso?  (concepto)
Referencia: `src/modos/animales.js`, `invertebrados.js`, `plantas.js`, `cuerpo.js`, `materia.js`,
`ambiente.js`, `cicloagua.js`, `epoca.js`.
```js
const CONCEPTOS = [
  [ { t: "Las aves tienen plumas.", c: true,  exp: "" },                       // básico
    { t: "El perro es un ave.",     c: false, exp: "Es un mamífero." } ],
  [ /* intermedio: {t, c, exp} … */ ],
  [ /* avanzado … */ ]
];
```
- `t` = afirmación. `c` = `true` si es verdad, `false` si es falsa. `exp` = explicación corta que se
  muestra **al fallar** (déjala `""` si no hace falta). La resuelve `rondaVF`.

### E) ¿Qué es cada cosa?  (definición con opciones)
Misma referencia que (D).
```js
const DEFINICIONES = [
  [ { q: "¿Qué es un animal VIVÍPARO?", c: "Nace del vientre de su mamá", d: ["Nace de un huevo", "Nace de una semilla"] } ],
  [ /* intermedio … */ ],
  [ /* avanzado … */ ]
];
```
- `q` = pregunta. `c` = respuesta **correcta**. `d` = arreglo de **distractores** (2–3). La resuelve
  `rondaDef`, que baraja `[c].concat(d)`; **`c` SIEMPRE aparece** como opción. No repitas `c` dentro de `d`.

### F) Opción múltiple del motor MC
Dos sub-formas:

**F1) Quiz con generadores** — `src/modos/quiz.js`. Banco plano + un generador que usa el helper
`pregunta(...)` (que garantiza que la correcta esté entre las opciones):
```js
const ABORIGEN = [
  { p: "¿Qué cultura hizo la primera cerámica?", c: "Valdivia", d: ["La Tolita","Cañari","Las Vegas"], pista: "Sus figuras femeninas son famosas." },
  /* … */
];
function gAborigen() { const x = azarEl(ABORIGEN); return pregunta("🏺 Época Aborigen", x.p, x.c, x.d, x.pista ? { pista: x.pista } : null); }
// Registrar:  GEN.aborigen = [gAborigen];  TEMAS.push({id:"aborigen", …});  GEN.mixto = [].concat(…, GEN.aborigen);
```
- `p`=pregunta, `c`=correcta, `d`=distractores (3), `pista?`. **`c` no debe estar repetida en `d`.**

**F2) Comprensión lectora** — `src/modos/lectura.js`. Banco por nivel de lecturas con sus preguntas:
```js
const LECTURAS = [
  [ { texto: "El cóndor vive en los Andes…", preguntas: [ { q:"¿Dónde vive el cóndor?", opciones:["En los Andes","En el mar","En la ciudad"], correcta:"En los Andes" } ] } ], // básico
  [ /* intermedio … */ ], [ /* avanzado … */ ]
];
```
- **`correcta` debe ser EXACTAMENTE una de las `opciones`** y estar respaldada por el `texto`.

### Bancos en archivos de datos (no inline)
- **`data/parrafos.json`** (Corregir/Dictado): `[{ id, nombre, nivel, texto, textoMal? }]`. `texto` =
  versión correcta. `textoMal` (opcional) = misma frase con errores que el adulto define; si falta, el
  juego inventa los errores. **Tras editar: `python herramientas/build.py`.**
- **`data/ortografia.json`** (categorías de ortografía). Según el campo `estrategia`:
  - `letra` (b_v, c_s_z, g_j, m_p_b), `hache` (h_muda), `lly` (ll_y): arreglo **`palabras`**.
  - `tilde` (tildes): arreglo **`conTilde`**.
  - `mayus` (mayusculas): arreglos **`propios`** y **`comunes`**.
  - `clasificar` (acentuacion, diptongo_hiato): objeto **`banco`** con una lista por cada etiqueta de
    `clases` (p. ej. `"Aguda"`, `"Llana"`, `"Esdrújula"`…). **Cada palabra debe estar en su grupo
    correcto** (clasificación a mano; elegir ejemplos claros). **Tras editar: `build.py`.**

---

## 2. Referencia por MÓDULO

| Materia | Módulo (archivo) | Motor · prefijo · global | Tipos de banco que usa | Dónde editar |
|---|---|---|---|---|
| Lengua | `ortografia.js` | MC-like · `orto` · `Ortografia` | Ortografía (por estrategia) | `data/ortografia.json` → `build.py` |
| Lengua | `copia.js` | propio · `copia` · `Copia` | Párrafos (Corregir/Dictado) | `data/parrafos.json` → `build.py` |
| Lengua | `clases.js` | Actividad · `clases` · `Clases` | (A) clasificar | inline |
| Lengua | `familia.js` | Actividad · `fam` · `Familia` | (A) clasificar | inline |
| Lengua | `sinonimos.js` | Actividad · `sino` · `Sinonimos` | (B) emparejar | inline |
| Lengua | `refranes.js` | Actividad · `refran` · `Refranes` | (B) emparejar | inline |
| Lengua | `ordena.js` | Actividad · `ordena` · `Ordena` | (C) ordenar | inline |
| Lengua | `alfabetico.js` | Actividad · `alfab` · `Alfabetico` | (C) ordenar | inline |
| Lengua | `silabas.js` | Actividad · `silaba` · `Silabas` | (C) ordenar (sílabas a mano) | inline |
| Lengua | `sujeto.js` | Actividad · `sujeto` · `Sujeto` | toque propio `{palabras, corte}` | inline |
| Lengua | `signos.js` | Actividad · `signo` · `Signos` | toque propio `{antes, despues, correcto, opciones}` | inline |
| Lengua | `formas.js` | Actividad · `forma` · `Formas` | toque propio `{base, instr, correcto, opciones}` | inline |
| Lengua | `lectura.js` | MC · `lectura` · `Lectura` | (F2) lecturas | inline |
| Matemáticas | `secuencias/aritmetica/tablas/multiplicacion/division/…` | varios | numérico (se generan solos) | inline (rangos por nivel) |
| Sociales | `epoca.js` | Actividad · `epoca` · `Epoca` | (B)+(C)+(D)+(E) | inline |
| Sociales | `regiones.js` | Actividad · `regiones` · `Regiones` | (A)+(C) | inline |
| Sociales | `quiz.js` | propio MC · `quiz` · `Quiz` | (F1) gens | inline (bancos `ABORIGEN`, `TERRITORIO`, …) |
| Sociales | `mapas/cantones/donde.js` | propio (mapa SVG) | geografía (sin banco editable de texto) | — |
| Ciencias | `animales.js` | Actividad · `ani` · `Animales` | (A)+(D)+(E) | inline |
| Ciencias | `invertebrados.js` | Actividad · `inv` · `Invertebrados` | (A)+(D)+(E) | inline |
| Ciencias | `cuidafauna.js` | Actividad · `fauna` · `CuidaFauna` | (B)+(A) | inline |
| Ciencias | `plantas/cuerpo/materia/ambiente/cicloagua.js` | Actividad | (A)+(D)+(E) | inline |
| Ciencias | `senala.js` | propio (SVG clicable) | partes sobre SVG | inline (diagramas SVG) |

> Interacciones "toque propio" (`sujeto`, `signos`, `formas`): el banco es un arreglo `[b,i,a]` de objetos
> con su propia forma (ver la columna). Para editar, copia la forma de un ítem existente.

---

## 3. Recetas de edición (paso a paso)

1. **Agregar un ejemplo a una clasificación** (tipo A): abre el `.js`, busca `banco`, ubica la cesta y el
   nivel `[b,i,a]`, añade el string (con artículo: `"el zorro"`). Verifica que NO esté ya en otra cesta del
   mismo tema.
2. **Agregar una pareja** (tipo B): añade `{a:"…", b:"…"}` a la lista del nivel deseado.
3. **Agregar una secuencia para ordenar** (tipo C): añade un arreglo en el orden correcto. En sílabas,
   sepáralas a mano y revisa (`bi-blio-te-ca`).
4. **Agregar un Verdadero/Falso** (tipo D): añade `{ t:"afirmación", c:true|false, exp:"por qué" }`.
5. **Agregar una definición** (tipo E): añade `{ q:"pregunta", c:"correcta", d:["distractor","distractor"] }`.
   Asegúrate de que `c` sea inequívoca y los `d` plausibles pero incorrectos.
6. **Agregar una pregunta al Quiz** (tipo F1): añade `{ p, c, d:[3 distractores], pista? }` al banco
   correspondiente en `quiz.js`. La correcta no debe repetirse en los distractores.
7. **Agregar una lectura** (F2): añade `{ texto, preguntas:[{q,opciones,correcta}] }` al nivel; `correcta`
   debe coincidir literal con una `opcion`.
8. **Agregar palabras de ortografía**: edita `data/ortografia.json` (en el arreglo correcto según
   `estrategia`), luego `python herramientas/build.py`.
9. **Agregar un párrafo** (Corregir/Dictado): edita `data/parrafos.json` (`{id,nombre,nivel,texto}`),
   luego `build.py`.

**Mezclar conceptos (directriz):** una actividad no debe ser **solo** clasificar. Si un módulo del motor
`Actividad` solo tiene temas de clasificar/emparejar/ordenar, **añádele** temas de concepto (D) y (E)
copiando `itemDe`, `rondaVF` y `rondaDef` de `animales.js`, y empújalos al final:
```js
const temas = TEMAS.map(/* … temas de clasificar … */);
temas.push({ icono:"🤔", nombre:"¿Verdadero o falso?", desc:"…", total:6, ronda: rondaVF });
temas.push({ icono:"📖", nombre:"¿Qué es cada cosa?",  desc:"…", total:6, ronda: rondaDef });
window.X = Actividad("px", temas);
```

---

## 4. Añadir un MÓDULO/actividad nuevo (no solo contenido)

1. Crea `src/modos/<modo>.js` (copia el patrón de un módulo del mismo motor; p. ej. `clases.js` para
   `Actividad`, `lectura.html`/`mc.js` para `MC`).
2. Crea `paginas/<modo>.html` copiando una página del **mismo motor**; cambia: `<title>`, el id
   `pantalla-<px>`, **todos** los prefijos `…-` por `<px>-`, el `<script src="src/modos/<modo>.js">`, las
   referencias al global (`X.init()` / `X.volverSelector()`) y `MODO_VOLVER` → `index.html?materia=<materia>`.
   Incluye `arrastrar.js` solo si usas arrastrar/emparejar/ordenar.
3. Registra el modo en el mapa `PAGINA` de `src/core/menu.js`: `"<modo>": "paginas/<modo>.html"`.
4. Añade la actividad a su materia en `data/materias.json` (`{modo, icono, nombre, desc}`) y corre
   `python herramientas/build.py`.

---

## 5. Verificación técnica (OBLIGATORIA antes de dar por hecho)

- **Sintaxis JS** (servir con 200 NO garantiza que el JS parsee): para cada archivo tocado,
  ```sh
  bun build --no-bundle src/modos/<archivo>.js     # silencio = OK; imprime el error si lo hay
  ```
- **JSON válido** (si editaste un `data/*.json`):
  ```sh
  python -c "import json; json.load(open('data/ortografia.json', encoding='utf-8')); print('OK')"
  ```
- **Recompilar datos** tras editar `data/*.json`: `python herramientas/build.py` (regenera `data/*.js`).
- **Smoke test headless (happy-dom)** — prueba que cada actividad **arranca y corre** sin excepciones en
  básico y avanzado, "tocando" los botones de la ronda. Los scripts viven en el scratchpad de la sesión
  (`test_lengua.js`, `test_sociales.js`, `test_ciencias.js`) y se ejecutan con `bun <archivo>`. Para uno
  nuevo: instala `happy-dom` en una carpeta de pruebas (`bun add happy-dom`), simula un `Juego` con
  `nivelIdx`/`porNivel`/`azarEl`/`mezclar`, carga `actividad.js`/`arrastrar.js`/`mc.js` + el módulo, llama
  `init()`, dispara el clic del primer chip del selector y comprueba que `#<px>-extra` se llenó. (El patrón
  exacto está en los `test_*.js` existentes.)
- **En el navegador**: recargar con **Ctrl + Shift + R** tras editar JS/CSS.

---

## 6. Reglas de oro (para no romper nada)

- Edita **solo los arreglos de datos**. No toques `window.X = …`, ni las funciones `ronda`, ni los
  prefijos (`px`), ni los `id` de las páginas.
- Mantén la forma **`[ básico, intermedio, avanzado ]`** en los bancos por nivel. Puedes dejar `[]` en un
  nivel: `itemDe` cae al inferior.
- En **clasificar**, un mismo ejemplo va en **una sola cesta por tema**.
- En **opción múltiple/definición**, la **correcta** debe estar entre las opciones y **no** repetirse en
  los distractores.
- En **sílabas**, separa a mano y revisa; en **clasificar ortografía** (agudas/llanas/diptongo/hiato),
  clasifica a mano y usa ejemplos **claros** (evita palabras ambiguas).
- Contenido en **español del Ecuador**, **~9 años**, textos **cortos**. Datos **correctos** (científicos,
  históricos, geográficos).
- Tras editar `data/*.json`: **`python herramientas/build.py`**. Tras cualquier `.js`: **`bun build
  --no-bundle`**.
