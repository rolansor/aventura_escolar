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
paginas/                   1 HTML por módulo (ortografia, secuencias, copia, mapas, cantones, editor)
data/                      *.json canónicos (editables) + *.js generados por build.py
src/
  core/                    juego.js (API compartida), datos.js (cargador), menu.js
  modos/                   ortografia.js, secuencias.js, copia.js, editor.js, mapas.js, mapacantones.js
  efectos/                 escena3d.js (fondo three.js), luna.js (mascota)
css/modulos/               base, menu, ejercicios, editor, mapas, cantones, efectos (.css)
lib/                       three.min.js (r128, para 3D offline)
recursos/                  ecuador_1.0/2.0.svg, banderas/EC-*.svg
herramientas/build.py      precompila data/*.json -> data/*.js  (Python; NO Node)
docs/                      ARQUITECTURA.md, capturas/
```

## Datos: `.json` canónico → `.js` generado

1. Los datos editables son `data/*.json` (incluye `data/mapas/*`).
2. `herramientas/build.py` genera, junto a cada `.json`, un `.js` gemelo:
   `(window.__DATOS__ = window.__DATOS__ || {})["<n>"] = <json>;`
3. Cada página incluye los `<script src="data/<n>.js">` que necesita (antes de `src/core/datos.js`).
4. `src/core/datos.js` (`window.Datos.cargar([...])`) lee de `window.__DATOS__` y los coloca en los
   globales que la lógica espera (`DATOS.ortografia`, `NINO`, `ECUADOR_SVG`, `ECUADOR_CANTONES`…),
   y devuelve una `Promise`. **Sin fetch.**

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

## Cómo regenerar los datos

Tras editar cualquier `data/*.json`:

```bash
python herramientas/build.py
```

Esto reescribe los `data/*.js`. (Se versionan en el repo para que el doble clic funcione sin pasos.)
