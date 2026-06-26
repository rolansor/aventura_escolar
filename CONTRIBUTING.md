# Cómo contribuir a La Aventura de Nelson

¡Gracias por tu interés! Este es un proyecto educativo pequeño y sencillo (HTML/CSS/JavaScript
vanilla + three.js, sin npm) para un niño de ~9 años, en español del Ecuador. Estas son las pautas
para proponer cambios.

## Reglas de oro

- **Vanilla, sin dependencias**: no introduzcas frameworks, bundlers ni paquetes de npm; no uses
  `import/export` de ES modules ni `fetch` a archivos locales. La única dependencia externa es
  **three.js** (por CDN, con copia local en `lib/three.min.js`).
- **Debe funcionar con doble clic (`file://`) y servido**: nada que rompa la versión que se abre
  directamente desde `index.html`. El contenido se embebe vía `<script src="data/…js">`, no se carga
  con `fetch`. Sin rutas absolutas.
- **Todo en español del Ecuador**: nombres de variables y funciones, comentarios y textos de la
  interfaz. Mantén tildes y la ñ. Vocabulario apropiado para ~9 años, textos cortos.
- Sigue el estilo y la organización del código existente; consulta `CLAUDE.md` para la arquitectura
  y `docs/ESQUEMA_CONTENIDO.md` para el esquema de contenido.

## Cómo proponer cambios

1. Haz un *fork* del repositorio (<https://github.com/rolansor/aventura_escolar>).
2. Crea una rama descriptiva a partir de `main` (por ejemplo `feature/nueva-actividad-ciencias`).
3. Haz tus cambios, verifícalos (ver "Verificación obligatoria") y pruébalos en el navegador.
4. Abre un *Pull Request* hacia `main` explicando qué cambia y por qué. Usa commits claros.

Para reportar errores o sugerir ideas, abre un *issue* describiendo el problema o la propuesta, con
pasos para reproducirlo si aplica.

## Cómo AÑADIR una actividad (flujo con el runner)

La mayoría de las actividades viven como **datos**: un JSON por modo que consume un **runner
genérico** (`src/core/contenido.js`). No hace falta escribir lógica nueva.

1. **Crea `data/contenido/<modo>.json`** siguiendo `docs/ESQUEMA_CONTENIDO.md`: cabecera
   (`modo`/`materia`/`px`/`titulo`/`icono`/`motor`) + `temas`, cada uno con su `tipo` y su contenido
   organizado en **3 niveles** `[ básico, intermedio, avanzado ]`. Usa `data/contenido/animales.json`
   como referencia.
2. **Crea `paginas/<modo>.html`** copiando `paginas/animales.html` y cambiando:
   - el `<title>`,
   - los prefijos de IDs `<px>-` (por ejemplo `ani-` → tu `px`),
   - el `<script src="data/contenido/<modo>.js">`,
   - la llamada `Contenido.montar("<modo>")` y `Datos.cargar(["contenido/<modo>"])`,
   - el destino de `MODO_VOLVER` (su materia: `index.html?materia=<materia>`).
   - Incluye `src/core/arrastrar.js` si la actividad usa arrastrar/emparejar/ordenar; usa
     `src/core/mc.js` (en vez de `actividad.js`) si el `motor` del JSON es `"mc"`.
3. **Registra el modo** en `src/core/menu.js` (mapa `PAGINA`) y en `data/materias.json` (dentro de
   las `actividades` de su materia).
4. Corre **`python herramientas/build.py`** para regenerar los `data/*.js`.

El menú, el submenú y el leaderboard se heredan solos.

## Cómo EDITAR el contenido de una actividad existente

1. Edita su `data/contenido/<modo>.json` (añadir/cambiar palabras, preguntas, niveles…).
2. Corre **`python herramientas/build.py`**.
3. Recarga en el navegador con **Ctrl + Shift + R**.

Los detalles de cada `tipo` de tema (`clasificar`, `emparejar`, `ordenar`, `vf`, `definir`, `mc`, …)
están en `docs/ESQUEMA_CONTENIDO.md`.

## Excepciones (no usan el runner de contenido)

Estas actividades se editan en su propio archivo, **no** en `data/contenido/`:

- **Ortografía y párrafos**: `data/ortografia.json` y `data/parrafos.json` → `python herramientas/build.py`.
- **Quiz, mapas** (provincias/cantones) y **generadores numéricos de Matemáticas** (aritmética,
  tablas, multiplicación, división, etc.): su lógica y datos viven en su propio `src/modos/<X>.js`.

## Verificación obligatoria

- Tras tocar **JS**: `bun build --no-bundle <archivo>.js` (silencio = OK; imprime el error de
  sintaxis si lo hay). Servir con 200 NO garantiza que el JS parsee.
- Tras tocar **`data/*.json`**: `python herramientas/build.py` para regenerar los `data/*.js`.
- Si existen **smoke tests headless** (happy-dom, p. ej. `scratchpad/test_*.js`), córrelos: montan la
  actividad vía `Contenido.montar` y "tocan" la ronda en básico y avanzado.
- Prueba en **Chrome, Edge o Firefox** y recarga con **Ctrl + Shift + R** (recarga forzada). No hay
  Node ni linters: valida también a ojo en el navegador.

## Convenciones

- **Módulos IIFE**: lo que va en `src/modos` expone un objeto global (`window.X`); sin imports/exports.
- Los **datos llegan como `<script src="data/<n>.js">`** (rellenan `window.__DATOS__`) y
  `src/core/datos.js` los coloca en los globales que la lógica espera.
- Nada de rutas absolutas. Commits claros y descriptivos.

## Lo que conviene evitar

- No edites a mano los `data/**/*.js` generados: se regeneran con `python herramientas/build.py`
  desde los `.json`.
- No incluyas recursos de terceros sin respetar su licencia (ver "Créditos" en el README).

¡Gracias por ayudar a que Nelson aprenda jugando! 🌙
