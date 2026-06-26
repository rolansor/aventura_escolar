# Carpeta `data/` — datos del juego

Todos los datos viven aquí como **`.json`** (la fuente de verdad). Un paso de build
(`python herramientas/build.py`, recursivo) genera un **`.js` gemelo** junto a cada `.json`
que rellena `window.__DATOS__["<clave>"]` (la clave incluye la subcarpeta, p. ej.
`"mapas/cantones"`). Cada página los carga con `<script src="data/<…>.js">` y los aplica con
`Datos.cargar([...])`. **Sin `fetch`**, así funciona con doble clic (`file://`) y servido.

> **Tras editar cualquier `.json`: `python herramientas/build.py`.** No edites los `.js` (se regeneran).

## Organización

| Ubicación | Qué es | Quién lo consume |
|---|---|---|
| **`data/contenido/<modo>.json`** | **Contenido de las actividades** que usa el **runner genérico** (`src/core/contenido.js`). Uno por actividad, categorizado por materia / tipo de juego / 3 niveles. | `Contenido.montar("<modo>")` — ver `docs/ESQUEMA_CONTENIDO.md`. |
| **`data/mapas/*.json`** | **Geografía del Ecuador**: `provincias`, `regiones`, `detalle`, `cantones` (GeoJSON procesado) y `mapa-ec` (SVG). | `mapas.js`, `mapacantones.js`, `donde.js`, `quiz.js` (vía `DATOS.mapas`, `ECUADOR_CANTONES`, `ECUADOR_SVG`). |
| **`data/materias.json`** | Estructura del **menú**: materias y sus actividades. | `src/core/menu.js` (`DATOS.materias`). |
| **`data/ortografia.json`** | Palabras de **ortografía** por categoría. | `src/modos/ortografia.js` (loader propio). |
| **`data/parrafos.json`** | Párrafos de **Corregir/Dictado**. | `src/modos/copia.js` (loader propio). |
| **`data/generador-parrafos.json`** | Piezas para generar párrafos en el Banco de contenido. | `src/modos/banco.js`. |
| **`data/secuencias.json`** | Secuencias numéricas base (Matemáticas). | `src/modos/secuencias.js`. |
| **`data/nino.json`** | Nombre por defecto del niño (fallback). | `Datos.cargar` → `window.NINO`. |

## ¿Por qué hay cosas en `data/contenido/` y otras en la raíz?
- **`data/contenido/`** = lo que consume el **runner** (esquema unificado). Es donde editas/agregas la
  mayoría del contenido de las actividades. Empieza por `docs/ESQUEMA_CONTENIDO.md`.
- **La raíz de `data/`** = datos de **sistema** (`materias`, `nino`) y bancos con **loader propio**
  (`ortografia`, `parrafos`, `generador-parrafos`, `secuencias`), que no pasan por el runner.
- **`data/mapas/`** = toda la **geografía** junta (incluye `cantones` y `mapa-ec`).
