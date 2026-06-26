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
index.html                 menú principal (materias)
paginas/                   1 HTML por módulo (ortografia, copia, mapas, cantones, editor, contenido… + ~24 del runner)
data/                      *.json canónicos (editables) + *.js generados por build.py
  contenido/               1 JSON por actividad migrada al runner (data/contenido/<modo>.json) + sus .js
src/
  core/                    juego.js (API compartida), datos.js (cargador), menu.js,
                           contenido.js (runner genérico), mc.js / actividad.js (motores), arrastrar.js
  modos/                   los que NO usan el runner: ortografia.js, copia.js, editor.js (Ajustes),
                           banco.js (Banco de contenido), mapas.js, mapacantones.js …  (las ~24 migradas YA NO viven aquí)
  efectos/                 escena3d.js (fondo three.js), luna.js (mascota)
css/modulos/               base, menu, ejercicios, editor, mapas, cantones, efectos (.css)
lib/                       three.min.js (r128, para 3D offline)
recursos/                  ecuador_1.0/2.0.svg, banderas/EC-*.svg
herramientas/build.py      precompila data/*.json -> data/*.js  (Python; NO Node; recursivo incl. data/contenido/)
docs/                      ARQUITECTURA.md, ESQUEMA_CONTENIDO.md, capturas/
```

> Nota sobre `src/modos/`: "**un módulo por actividad**" sigue siendo cierto **solo** para lo que NO usa
> el runner (ver "Capa de contenido"). Las ~24 actividades migradas al runner **ya no tienen** un
> `src/modos/<modo>.js` propio: su lógica vive de forma centralizada en `src/core/contenido.js`.

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

- Cada modo es un IIFE `window.Modo = { init, ... }`. Su página carga: three.js (CDN + respaldo
  local), efectos, core (datos + juego), su módulo, sus `data/*.js`, y arranca con
  `Datos.cargar([...]).then(function(){ Juego.iniciarBase(); Modo.init(); })`.
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
(`window.Contenido`). Cada JSON está categorizado por **materia** (lengua/matemáticas/sociales/ciencias),
por **tipo de juego** (el campo `tipo` de cada tema) y por **3 niveles** de dificultad
(`[ básico, intermedio, avanzado ]`; un nivel `[]` "cae" al inferior). El esquema completo del JSON está
en `docs/ESQUEMA_CONTENIDO.md`.

- **`Contenido.montar("<modo>")`** lee `DATOS.contenido[<modo>]` y, según el `motor` del archivo, construye
  rondas para uno de los dos motores existentes:
  - **`motor: "actividad"`** (manipulativo, `src/core/actividad.js`): cada tema se traduce a una `ronda(host, ctrl)`
    a partir de su `tipo`. Tipos soportados: `clasificar`, `emparejar`, `ordenar`, `silabas`, `alfabetico`,
    `vf`, `definir`, `sujeto`, `signos`, `formas`, `escena`, `senala`, `problema`, `terminos`. Muchos de
    ellos usan `src/core/arrastrar.js` para el arrastrar-y-soltar.
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

Algunas piezas conservan su **loader / lógica propia** en `src/modos/` y no pasan por `Contenido.montar`:

- **Lengua**: ortografía (`ortografia.js`, generadores por `estrategia`) y copia/párrafos (`copia.js`).
- **Repasos**: el quiz de opción múltiple cuando se arma a mano (motor `MC` directo).
- **Estudios Sociales**: mapas (`mapas.js`), cantones (`mapacantones.js`) y el quiz `donde`.
- **Matemáticas**: los generadores numéricos (aritmética, tablas, multiplicación, división, etc.).
- **Zona de adultos**: ⚙️ Ajustes (`editor.js`) y 📚 Banco de contenido (`src/modos/banco.js`,
  global **`window.BancoContenido`** — no confundir con el runner `window.Contenido` de `src/core/`).

## Cómo regenerar los datos

Tras editar cualquier `data/*.json`:

```bash
python herramientas/build.py
```

Esto reescribe los `data/*.js`. (Se versionan en el repo para que el doble clic funcione sin pasos.)
