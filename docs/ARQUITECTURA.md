# Arquitectura — La Aventura de Nelson (modular)

Objetivo: separar **datos** (`.json`), **lógica** (`.js`) y **vista** (`.html`/`.css`) en carpetas,
con un buen patrón, y que **el mismo código** funcione de dos formas:

- **Doble clic** (`file://`): se abre `index.html`. Los datos están precompilados en `data/*.js`.
- **Servido** (GitHub Pages / `python -m http.server`): el mismo `index.html`, sin cambios.

No hay carpeta `dist/`: ambos modos usan exactamente los mismos archivos.

> Decisión clave: **NO usar módulos ES** (`import/export`) ni `fetch`. Se mantienen módulos **IIFE**
> que exponen globales (`window.X`), y los datos llegan como `<script src="data/<n>.js">`. Así no hay
> diferencia entre servido y `file://`.

## Estructura de carpetas

```
index.html                 perfiles → grado y trimestre → materias → actividades
paginas/                   1 HTML por actividad (53: 30 del runner, 21 con lógica propia y las 2 de adultos)
data/                      *.json canónicos (editables) + *.js generados por build.py
  curriculo.json           grados, trimestres y plan (qué actividad se ve en cada trimestre)
  materias.json            catálogo de materias y actividades
  contenido/               1 JSON por actividad del runner (data/contenido/<modo>.json) + sus .js
  mapas/                   geografía: provincias, regiones, detalle, cantones, mapa-ec
src/
  core/                    juego.js (API compartida), datos.js (cargador), perfiles.js, curriculo.js,
                           menu.js, contenido.js (runner genérico), mc.js / actividad.js (motores),
                           arrastrar.js
  modos/                   los que NO usan el runner: ortografia.js, copia.js, los generadores de
                           Matemáticas, geometria.js, mapas.js, mapacantones.js, donde.js, quiz.js,
                           editor.js (Ajustes) y banco.js (Banco de contenido)
  efectos/                 escena3d.js (fondo three.js), luna.js (mascota),
                           modelo3d.js (escenario 3D de las actividades)
    modelos/               1 archivo por modelo 3D: planta, flor, cicloagua, bloques, fraccion
css/modulos/               base, menu, ejercicios, editor, mapas, cantones, efectos (.css)
lib/                       three.min.js (r128, copia local: el 3D no depende de internet)
recursos/                  ecuador_1.0/2.0.svg, gadm41_ECU_2.json (fuente de cantones), banderas/EC-*.svg,
                           senala/*.svg (dibujos de "Señala la parte")
herramientas/              Python, sin instalar nada (NO Node):
  build.py                 precompila data/**/*.json -> data/**/*.js (incrusta {"$archivo": …})
  validar.py               revisa que el contenido no tenga trampas (sale con 1 si hay errores)
  humo.py + cdp.py         prueba de humo en Chrome/Edge sin ventana (inicio, todas las páginas y temas)
  corregir_cantones.py     corrige los nombres de cantones que trae la fuente GADM
docs/                      ARQUITECTURA.md, ESQUEMA_CONTENIDO.md
```

> Nota sobre `src/modos/`: "**un módulo por actividad**" es cierto **solo** para lo que NO usa el runner
> (ver "Capa de contenido"). Las 30 actividades del runner **no tienen** un `src/modos/<modo>.js` propio:
> su lógica vive de forma centralizada en `src/core/contenido.js`.

## Datos: `.json` canónico → `.js` generado

1. Los datos editables son `data/*.json` (incluye `data/mapas/*`).
2. `herramientas/build.py` genera, junto a cada `.json`, un `.js` gemelo:
   `(window.__DATOS__ = window.__DATOS__ || {})["<n>"] = <json>;`
3. Cada página incluye los `<script src="data/<n>.js">` que necesita (antes de `src/core/datos.js`).
4. `src/core/datos.js` (`window.Datos.cargar([...])`) lee de `window.__DATOS__` y los coloca en los
   globales que la lógica espera (`DATOS.ortografia`, `NINO`, `ECUADOR_SVG`, `ECUADOR_CANTONES`…),
   y devuelve una `Promise`. **Sin fetch.** Tiene una **regla por prefijo**: cualquier clave que empiece
   con `contenido/` se enruta a `DATOS.contenido[<modo>]` (p. ej. `contenido/animales` → `DATOS.contenido.animales`);
   el resto usa la tabla fija `DEST` (nombre → destino).

Los módulos (`src/modos/*`) **no** contienen literales de datos grandes: los leen de esos globales.
(Pendiente menor: `mapas.js`/`mapacantones.js` aún tienen sus tablas `PROVINCIAS/REGIONES/DET`
internas; `data/mapas/*.json` ya existen para de-duplicarlas más adelante.)

## Patrón de módulos y navegación

- Cada modo es un IIFE `window.Modo = { init, ... }`. Su página carga: three.js (`lib/three.min.js`,
  siempre la copia local), efectos, core (datos + juego), su módulo, sus `data/*.js`, y arranca con
  `Datos.cargar([...]).then(function(){ Juego.iniciarBase(); Modo.init(); })`.
- **Grado y trimestre**: `index.html` pide primero el grado (1.º–7.º de básica; los que no tienen plan
  salen "en construcción") y el trimestre. El plan de `data/curriculo.json` reparte las actividades del
  catálogo (`data/materias.json`) por trimestre; lo lee `src/core/curriculo.js`, que también pinta el
  mapa conceptual de ayuda. El curso elegido se recuerda en el perfil (`Juego.curso/fijarCurso`).
- **Multipágina**: el menú (`index.html`) genera las materias desde `DATOS.materias` y cada actividad
  ENLAZA a `paginas/<modo>.html` (`src/core/menu.js`). El marcador (estrellas/nivel) persiste en
  `localStorage`, así que se mantiene entre páginas.
- Las páginas de `paginas/` usan `<base href="../">` para que css/scripts/recursos resuelvan desde la
  raíz; la navegación por JS usa `window.RUTA_INICIO` (`../index.html`).
- `src/core/juego.js` = la API compartida (persistencia, utilidades, puntaje, sonido, temporizador,
  identidad/mascota) + `iniciarBase()` (arranque común de cada página y barra superior). Sin la
  navegación SPA antigua.

## Capa de contenido (runner genérico)

Casi **todas** las actividades ya no tienen un módulo propio en `src/modos/`: guardan su contenido en
`data/contenido/<modo>.json` y lo ejecuta un **runner genérico**, `src/core/contenido.js`
(`window.Contenido`). Cada JSON está categorizado por **materia** (lengua/matemáticas/sociales/ciencias/inglés),
por **tipo de juego** (el campo `tipo` de cada tema) y por **3 niveles** de dificultad
(`[ básico, intermedio, avanzado ]`; un nivel `[]` "cae" al inferior). El esquema completo del JSON está
en `docs/ESQUEMA_CONTENIDO.md`.

- **`Contenido.montar("<modo>")`** lee `DATOS.contenido[<modo>]` y, según el `motor` del archivo, construye
  rondas para uno de los dos motores existentes:
  - **`motor: "actividad"`** (manipulativo, `src/core/actividad.js`): cada tema se traduce a una `ronda(host, ctrl)`
    a partir de su `tipo`. Tipos soportados: `clasificar`, `emparejar`, `ordenar`, `silabas`, `alfabetico`,
    `vf`, `definir`, `sujeto`, `signos`, `formas`, `escena`, `senala`, `problema`, `terminos`, `ahorcado`.
    Muchos de ellos usan `src/core/arrastrar.js` para el arrastrar-y-soltar; `senala`, `escena` y
    `clasificar` (con `dibujo`) pueden montar además un **modelo 3D** (ver abajo).
  - **`motor: "mc"`** (opción múltiple, `src/core/mc.js`): tipos `mc` y `lectura` (comprensión lectora).
- **Enrutado del dato**: `src/core/datos.js` coloca cada `contenido/<modo>` en `DATOS.contenido[<modo>]`
  (regla por prefijo, ver arriba).
- **Página por actividad**: cada `paginas/<modo>.html` carga su `data/contenido/<modo>.js`, luego `datos.js`,
  el motor (`actividad.js` o `mc.js`), `arrastrar.js` y `contenido.js`, y arranca con
  `Datos.cargar(["contenido/<modo>"]).then(() => Contenido.montar("<modo>").init())`.
  Toda la lógica que antes se duplicaba en cada `src/modos/<modo>.js` vive ahora **una sola vez** en el runner.

**Flujo de datos del contenido** (extiende el pipeline general):

```
data/contenido/<modo>.json
   │  herramientas/build.py   (recursivo)
   ▼
data/contenido/<modo>.js      →  (window.__DATOS__||{})["contenido/<modo>"] = {…}
   │  <script src="data/contenido/<modo>.js"> en la página
   ▼
Datos.cargar(["contenido/<modo>"])   (prefijo "contenido/" → DATOS.contenido[<modo>])
   ▼
DATOS.contenido[<modo>]
   │  Contenido.montar("<modo>")
   ▼
Actividad(px, temas)   ó   MC(px, temas)
```

### Qué NO usa el runner

Algunas piezas conservan su **lógica propia** en `src/modos/` y no pasan por `Contenido.montar`:

- **Lengua**: ortografía (`ortografia.js`, generadores por `estrategia`) y Corregir/Dictado (`copia.js`).
- **Estudios Sociales**: mapa de provincias (`mapas.js`), mapa por cantones (`mapacantones.js`),
  "¿Dónde está?" (`donde.js`) y el Quiz (`quiz.js`: la geografía se genera desde `DATOS.mapas`; sus bancos
  de texto sí están en `data/contenido/quiz.json`).
- **Matemáticas**: los generadores numéricos (aritmética, tablas, multiplicación, división, etc.) y la
  geometría (`geometria.js`: un archivo con dos actividades —rectas y ángulos, cuadriláteros y perímetro—
  hechas en SVG con eventos de puntero sobre el motor `Actividad`).
- **Zona de adultos**: ⚙️ Ajustes (`editor.js`) y 📚 Banco de contenido (`src/modos/banco.js`,
  global **`window.BancoContenido`** — no confundir con el runner `window.Contenido` de `src/core/`).

## Grado y trimestre (`src/core/curriculo.js`)

`window.Curriculo` lee `DATOS.curriculo` (`data/curriculo.json`): la lista de **trimestres**, la de **grados**
y, por cada grado, su **plan** (`plan[trimestre][materia] = [modo, …]`). Un grado sin plan sale "en
construcción"; un trimestre sin plan, también.

- `Curriculo.materias(gradoId, triId)` devuelve las materias del catálogo, cada una **solo** con las
  actividades de ese trimestre (en el orden del plan). `src/core/menu.js` pinta con eso las tres
  sub-pantallas del índice: `pantalla-curso` → `pantalla-menu` → `pantalla-materia`.
- `Curriculo.abrirMapa(gradoId, alIr)` pinta la ayuda: un mapa conceptual con una columna por trimestre y
  una fila por materia; marca qué actividades se repiten y deja saltar a un trimestre o a una actividad.
- El curso elegido se guarda en el perfil (`Juego.curso()` / `Juego.fijarCurso(grado, trimestre)`), así al
  volver de una actividad (`index.html?materia=<id>`) se cae en la misma materia y trimestre.
- Las actividades no saben en qué trimestre están: el plan solo decide desde dónde se enlazan. Por eso
  repetir una actividad en otro trimestre es añadir su `modo` a otra lista.

## Modelos 3D de las actividades (`src/efectos/modelo3d.js`)

`window.Modelo3D` es un **escenario three.js reutilizable**: pone un modelo dentro de la caja de juego para
que el niño lo gire, lo toque y le suelte fichas encima. Da luces, sombra de contacto, cámara que encuadra
sola, giro con el dedo (con límites), detección de la parte tocada (con tolerancia para dedos pequeños),
resaltado de acierto/error, etiquetas y controles **anclados** a un punto del modelo, y limpieza al salir.

- Los modelos se construyen **por código** (sin `.glb`/`.obj`: `file://` no permite cargarlos) en
  `src/efectos/modelos/<nombre>.js`, con `Modelo3D.registrar("<nombre>", function (api, opts) { … })`.
  El `api` trae ayudantes de geometría: `tubo` (tallos, raíces), `lamina` (hojas y pétalos curvos),
  `torno` (sólidos de revolución), `mat`/`color` y `parte(obj, id)` para marcar qué es tocable.
- Modelos actuales: **planta**, **flor** (por dentro), **cicloagua** (maqueta animada), **bloques**
  (base 10 con tamaños reales) y **fraccion** (pizza / barra).
- **Siempre hay respaldo sin WebGL**: `Modelo3D.disponible(nombre)` devuelve `false` y la actividad usa su
  dibujo SVG (o bloques 2D con CSS). Mientras hay un modelo activo, el fondo baja el ritmo
  (`ESCENA.ahorro(true)`).
- Una actividad lo crea una vez por tema y lo reutiliza de ronda en ronda guardándolo en `ctrl.memo`;
  se destruye con `ctrl.alTerminar(() => m.destruir())` (ver `src/core/actividad.js`).

## Pruebas (sin instalar nada)

```bash
python herramientas/validar.py          # contenido: 0 errores
python herramientas/humo.py --todos     # el juego de verdad, en los 3 niveles
```

`humo.py` usa Chrome o Edge ya instalados, sin ventana y con un perfil temporal (no toca el progreso
real). `herramientas/cdp.py` es el cliente mínimo que lo maneja y sirve para escribir más pruebas
(capturas, clics y arrastres reales).

## Cómo regenerar los datos

Tras editar cualquier `data/*.json`:

```bash
python herramientas/build.py
```

Esto reescribe los `data/*.js`. (Se versionan en el repo para que el doble clic funcione sin pasos.)
