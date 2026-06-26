# 🚀 La Aventura de Nelson

> Juego educativo de Lengua, Matemáticas, Estudios Sociales y Ciencias Naturales para un niño
> de ~9 años, en **español del Ecuador**. Sin instalar nada: se juega con doble clic o servido.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript&logoColor=black)
![three.js](https://img.shields.io/badge/three.js-r128-000000?logo=three.js&logoColor=white)
![Licencia MIT](https://img.shields.io/badge/Licencia-MIT-green)

---

## 📖 ¿Qué es?

**La Aventura de Nelson** es un juego educativo web hecho con **HTML + CSS + JavaScript vanilla**
y un toque de **three.js** para el 3D. **No usa frameworks, ni bundlers, ni npm, ni servidor
obligatorio**: se puede jugar abriendo un archivo con doble clic o publicándolo en GitHub Pages.

Está pensado para acompañar el aprendizaje de un niño de unos 9 años, con vocabulario y ejemplos
del **Ecuador** (mercado, regiones, fauna, monedas en USD). Las actividades buscan ser
**manipulativas** —arrastrar, tocar, construir, ordenar, emparejar— más que de "pregunta y
respuesta", inspiradas en **Piaget y Montessori**: aprender haciendo, con material concreto y
control del error inmediato. Lo acompaña **Luna**, una mascota 3D arrastrable que salta cuando
acierta, se entristece cuando falla y **sugiere las pistas** desde su globo.

Todo el progreso, los perfiles y el contenido creado por los adultos se guardan automáticamente
en el navegador (`localStorage`).

---

## ▶️ Cómo jugar

Funciona de **dos formas**, sin instalar nada:

### 1) Doble clic (sin servidor)
Abre **`index.html`** con doble clic en Chrome, Edge o Firefox. Pantalla completa con **F11**.
Los datos están precompilados en `data/**/*.js`, así que no hace falta servidor.

### 2) Servido (desarrollo / GitHub Pages)
Desde la raíz del proyecto:

```bash
python -m http.server
```

y abre **http://localhost:8000**. También se puede publicar tal cual en **GitHub Pages**
(hay un `.nojekyll` para que sirva los archivos estáticos sin procesarlos).

> Tras editar JS/CSS recarga con **Ctrl + Shift + R** (el navegador cachea fuerte).

---

## 📚 Materias y actividades

El menú está organizado por **materias**; cada una agrupa varias actividades.

### 📖 Lengua
Ortografía (10 reglas: B/V, C-S-Z, G/J, H muda, LL/Y, tildes, mayúsculas, M antes de P/B,
agudas-llanas-esdrújulas, diptongo-triptongo-hiato), Copia y Dictado, sinónimos, refranes,
sujeto y predicado, signos de puntuación, formas verbales, orden alfabético, sílabas, ordenar
oraciones y comprensión lectora.

### 🔢 Matemáticas
Secuencias, tablas, sumas y restas, multiplicación y división paso a paso, valor posicional con
**bloques base-10**, comparar (balanza), dinero (armar el monto con billetes y monedas), la hora
(reloj con manecillas), redondeo, números, medidas, fracciones, problemas verbales y términos de
la suma/resta.

### 🗺️ Estudios Sociales
Mapa del Ecuador por **provincias** (SVG coloreado por las 4 regiones naturales), mapa por
**cantones** con la provincia en **3D rotable** (three.js), quiz del Ecuador, "¿Dónde está?",
regiones, épocas históricas y familia.

### 🌱 Ciencias Naturales
"Señala la parte" (diagramas SVG interactivos), las plantas, el cuerpo humano, los animales,
**los invertebrados** (clasificar en sus grupos), el ciclo del agua, la materia, ecosistemas y
ambiente, y el cuidado de la fauna.

---

## 👤 Perfiles, niveles y marcador

- **Perfiles por niño**: cada uno tiene nombre, mascota, género y nivel. Al abrir `index.html`
  aparece el selector de perfiles; un chip en la barra permite cambiar de perfil. El progreso
  (estrellas, racha) es **independiente por perfil**.
- **3 niveles de dificultad**: **básico**, **intermedio** y **avanzado**. Cada actividad ajusta
  su rango o sus contenidos según el nivel del perfil activo.
- **Leaderboard** por **actividad y perfil**: guarda las 5 mejores marcas (aciertos y tiempo) y
  las muestra al terminar cada ronda.

> El **contenido** (palabras, secuencias, párrafos, bancos) es un recurso **compartido** que cura
> el adulto; no es por perfil.

---

## 🧩 Cómo está hecho

**Stack**: HTML5 + CSS3 modular, **JavaScript vanilla** en módulos IIFE que exponen globales
(`window.X`) — **sin imports/exports ES y sin `fetch`** —, **three.js r128** (con copia local en
`lib/three.min.js` para que el 3D funcione offline), **WebAudio** para los sonidos y
**localStorage** para toda la persistencia.

### La arquitectura de contenido (lo importante para editar)

El contenido de **casi todas** las actividades vive en **`data/contenido/<modo>.json`** (un JSON
por actividad), categorizado por **materia**, **tipo de juego** y **nivel** (la mayoría de los
campos son un arreglo de 3 posiciones: `[básico, intermedio, avanzado]`). Un **runner genérico**,
`src/core/contenido.js`, arma la actividad con `Contenido.montar("<modo>")`, sin necesidad de
escribir código nuevo por actividad.

El flujo es:

```
data/contenido/<modo>.json   (editas esto)
        │  python herramientas/build.py        (genera el .js, no se toca)
        ▼
data/contenido/<modo>.js     (rellena window.__DATOS__)
        │  <script> en paginas/<modo>.html  +  Datos.cargar([...])
        ▼
Contenido.montar("<modo>")   →   motor Actividad (manipulativo) ó MC (opción múltiple)
```

Los **tipos de juego** que entiende el runner incluyen `clasificar`, `emparejar`, `ordenar`,
`silabas`, `alfabetico`, `vf` (verdadero/falso), `definir`, `sujeto`, `signos`, `formas`,
`escena`, `senala`, `problema` y `terminos` (motor *actividad*), más `mc` y `lectura` (motor *mc*).
El esquema completo y los campos de cada tipo están en **[`docs/ESQUEMA_CONTENIDO.md`](docs/ESQUEMA_CONTENIDO.md)**.

**Excepciones** que conservan su propio loader (no usan el runner): **ortografía**
(`data/ortografia.json`), **Copia/Dictado** (`data/parrafos.json`), **quiz**, los **mapas**
(`data/mapas/*`, `data/cantones.js`) y los **generadores numéricos** de Matemáticas (que crean los
problemas al vuelo en vez de leerlos de un banco).

> Todos los datos canónicos viven en `data/**/*.json`; `herramientas/build.py` genera junto a cada
> uno un `.js` que rellena `window.__DATOS__`, y `src/core/datos.js` los coloca en los globales que
> espera la lógica. Así el **mismo código** funciona con doble clic (`file://`) y servido, sin
> carpeta `dist/`. Detalle técnico en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

---

## 🗂️ Estructura de carpetas

```
.
├── index.html                  # menú principal + selector de perfiles
├── paginas/                    # un HTML por actividad
├── src/
│   ├── core/                   # motores y API compartida:
│   │   ├── juego.js            #   marcador, sonido, localStorage, perfiles, niveles, leaderboard
│   │   ├── actividad.js        #   motor de actividades manipulativas
│   │   ├── mc.js               #   motor de opción múltiple (repasos rápidos)
│   │   ├── arrastrar.js        #   arrastrar y soltar (mouse + dedo)
│   │   ├── contenido.js        #   RUNNER genérico: monta cada modo desde su JSON
│   │   ├── datos.js            #   cargador (window.__DATOS__ → globales)
│   │   ├── menu.js             #   menú de materias + modal de clave (zona de adultos)
│   │   └── perfiles.js         #   selector de perfiles
│   ├── modos/                  # lo que NO usa el runner:
│   │   ├── (Matemáticas)       #   generadores: aritmetica, tablas, multiplicacion, division,
│   │   │                       #   secuencias, comparar, redondeo, numeros, medidas, hora,
│   │   │                       #   dinero, valorposicional, fracciones
│   │   ├── ortografia.js, copia.js
│   │   ├── quiz.js, mapas.js, mapacantones.js, donde.js
│   │   ├── banco.js            #   banco de contenido (zona de adultos)
│   │   └── editor.js           #   ajustes (zona de adultos)
│   └── efectos/                # escena3d.js (fondo 3D) y luna.js (mascota)
├── data/
│   ├── contenido/<modo>.json   # contenido de las actividades del runner (+ .js generado)
│   ├── mapas/                  # geometría de mapas
│   └── *.json (+ *.js)         # ortografia, parrafos, materias, cantones, etc.
├── css/modulos/                # estilos modulares
├── lib/three.min.js            # three.js r128 local (3D offline)
├── recursos/                   # SVG del mapa + banderas (recursos/banderas/EC-*.svg)
├── herramientas/build.py       # precompila data/**/*.json → data/**/*.js
└── docs/                        # ARQUITECTURA.md, ESQUEMA_CONTENIDO.md
```

---

## ✏️ Cómo editar o añadir contenido

**Para cambiar el contenido de una actividad del runner** (lo más común):

1. Edita su archivo en **`data/contenido/<modo>.json`** (respeta el esquema y el orden
   `[básico, intermedio, avanzado]`).
2. Ejecuta **`python herramientas/build.py`** para regenerar el `data/contenido/<modo>.js`.
3. Recarga el navegador con **Ctrl + Shift + R**.

**Para añadir una actividad nueva** con el runner:

1. Crea `data/contenido/<modo>.json` siguiendo el esquema → `python herramientas/build.py`.
2. Crea `paginas/<modo>.html` copiando una página del mismo motor (p. ej. `paginas/animales.html`).
3. Regístrala en `src/core/menu.js` (`PAGINA`) y en `data/materias.json` → `build.py`.

Guías detalladas: el esquema y los tipos (y las excepciones con loader propio) en
**[`docs/ESQUEMA_CONTENIDO.md`](docs/ESQUEMA_CONTENIDO.md)**, la organización de los datos en
**[`data/README.md`](data/README.md)**, y las pautas de
contribución en **[`CONTRIBUTING.md`](CONTRIBUTING.md)**.

> El contenido para adultos también se puede administrar desde el juego, en la **zona de adultos**
> (protegida con clave): ⚙️ Ajustes y 📚 Banco de contenido.

---

## ✅ Cómo verificar

- **JSON válido**:
  `python -c "import json; json.load(open('data/contenido/<modo>.json', encoding='utf-8'))"`
- **Regenerar los datos**: `python herramientas/build.py`.
- **Parse-check de un JS** (no hay Node, sí hay `bun`): `bun build --no-bundle <archivo>.js`
  (silencio = OK; imprime el error de sintaxis si lo hay). Útil porque servir con 200 no garantiza
  que el JS parsee.
- **Smoke tests headless** con happy-dom: montan una actividad vía `Contenido.montar` y "tocan" la
  ronda en básico y avanzado.

---

## 🙏 Créditos y atribuciones

Este proyecto usa recursos abiertos de terceros; gracias a sus autores:

- **Mapa de provincias (SVG)**: [simplemaps.com](https://simplemaps.com/svg/country/ec).
- **Geometría de cantones (GeoJSON)**: [GADM](https://gadm.org/) (nivel 2). Uso **no comercial**
  según sus condiciones de licencia.
- **Banderas provinciales**: [Wikimedia Commons — "List of Ecuadorian flags"](https://commons.wikimedia.org/wiki/List_of_Ecuadorian_flags).
- **three.js**: [threejs.org](https://threejs.org/) — licencia MIT.

Las banderas y los mapas pertenecen a sus respectivos autores y se incluyen con fines educativos,
respetando sus licencias.

---

## 📄 Licencia

El código de este proyecto se distribuye bajo la licencia **MIT** — ver [LICENSE](LICENSE).
Los recursos de terceros (mapas, banderas) conservan sus propias licencias (ver Créditos).

---

## 👤 Autor

Hecho con cariño por **rolansor**.
Repositorio: <https://github.com/rolansor/aventura_escolar>
