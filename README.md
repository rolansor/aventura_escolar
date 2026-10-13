# 🚀 La Aventura de Nelson

> Juego educativo de Lengua, Matemáticas, Estudios Sociales, Ciencias Naturales e Inglés para un niño
> de ~9 años (Quinto de básica), en **español del Ecuador**, organizado por **grado y trimestre**.
> Sin instalar nada: se juega con doble clic o servido.

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
control del error inmediato. Lo acompaña **Perchita**, una mascota 3D arrastrable (cada niño le pone
nombre) que salta cuando acierta, se entristece cuando falla y **sugiere las pistas** desde su globo.

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

Al entrar se elige el **grado** (1.º a 7.º de básica; por ahora solo **5.º** está listo y los demás
salen "en construcción") y el **trimestre**. Cada trimestre muestra sus **materias**, y cada materia
agrupa las actividades que tocan en ese trimestre (algunas se repiten de un trimestre a otro). El botón
**🗺️ ¿Qué hay en cada trimestre?** abre un mapa conceptual con todo el reparto, que se edita en
`data/curriculo.json`.

El **segundo trimestre** de 5.º sigue lo que el colegio publica en su Classroom: rectas y ángulos (con un
graduador que se arrastra), cuadriláteros y perímetro, multiplicación hasta 3 cifras con sus términos y
propiedades, el concurso de vocabulario (40 palabras con significado, sinónimo, antónimo y escritura), la
vida de las plantas y cómo se reproducen (la flor en corte, estolones, tubérculos, bulbos y esquejes),
señoríos étnicos, Incas y Conquista, y los ríos y la gente del Ecuador. Los cuestionarios de repaso del
colegio se guardan en `temarios/` (carpeta que **no** se sube al repositorio) y sus ejercicios están dentro
de las actividades: por ejemplo, la multiplicación tiene el botón **📝 Como en el examen**.

### 📖 Lengua
Ortografía (10 reglas: B/V, C-S-Z, G/J, H muda, LL/Y, tildes, mayúsculas, M antes de P/B,
agudas-llanas-esdrújulas, diptongo-triptongo-hiato), Corregir y Dictado, clases de palabras, familias de
palabras, sinónimos y antónimos, diminutivos y aumentativos, sílabas, ordenar oraciones, sujeto y
predicado, signos de puntuación, orden alfabético, comprensión lectora, refranes y adivinanzas, y el
concurso de vocabulario.

### 🔢 Matemáticas
Secuencias, tablas, sumas y restas, multiplicación (hasta 3 cifras en el multiplicador) y división paso a
paso, términos de la suma y la resta, términos y propiedades de la multiplicación, problemas verbales,
valor posicional con **bloques base 10 en 3D**, comparar (balanza), redondeo (recta numérica), números,
dinero (armar el monto con billetes y monedas), medidas, la hora (reloj con manecillas), fracciones
(pizza y barra en 3D), **rectas y ángulos** (con un graduador que se arrastra) y **cuadriláteros y
perímetro**.

### 🗺️ Estudios Sociales
Época Aborigen, regiones y relieves, mapa del Ecuador por **provincias** (SVG coloreado por las 4
regiones naturales), mapa por **cantones** con la provincia en **3D rotable** (three.js), quiz del
Ecuador, "¿Dónde está?", señoríos étnicos, Incas y Conquista, y ríos y gente del Ecuador.

### 🌱 Ciencias Naturales
"Señala la parte" (planta y flor en **3D**; cuerpo, cara y órganos en ilustraciones animadas), las
plantas, la vida de las plantas, cómo se reproducen las plantas, el cuerpo humano, los animales, los invertebrados, el cuidado de la
fauna, el ciclo del agua (maqueta 3D), la materia, y ecosistemas y ambiente.

### 🗣️ Inglés
Todo se oye (la voz del navegador pronuncia cada palabra y un 🔊 la repite) y casi todo se arma con las manos:
- **Vocabulario:** *My house* (se rotula una casa dibujada en corte y se lleva cada cosa a su cuarto),
  *My school* (el aula, los útiles y lo que se dice en clase), *More words* (cuerpo, animales, comida,
  colores, familia, números, días y meses) y *El ahorcado* (frutas, casa y escuela).
- **Verbos:** *Regular verbs* (la máquina que arma el pasado: play + ed = played, study → studied) e
  *Irregular verbs* (go → went, con parejas y memoria).
- **Tiempos:** *Present simple* (I play, she plays; don't y doesn't; la rutina del día; adverbios con
  -ly), *Present continuous* (am/is/are + -ing) y *Past simple* (did, didn't, was, were).

---

## 👤 Perfiles, niveles y marcador

- **Perfiles por niño**: cada uno tiene nombre, mascota, género y nivel. Al abrir `index.html`
  aparece el selector de perfiles; un chip en la barra permite cambiar de perfil. El progreso
  (estrellas, racha) es **independiente por perfil**, y cada perfil recuerda el **grado y trimestre**
  en que se quedó.
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
`escena`, `senala`, `problema`, `terminos`, `lectura`, `memoria` y los de Inglés (`ahorcado`,
`escucha`, `frase`, `terminacion`) y `completa` (llevar la ficha al hueco: en Inglés con voz y, con
`idioma:"es"`, en cualquier materia y con varios huecos), todos del motor *actividad*, más `mc` (motor *mc*).
El esquema completo y los campos de cada tipo están en **[`docs/ESQUEMA_CONTENIDO.md`](docs/ESQUEMA_CONTENIDO.md)**.

**Excepciones** con lógica propia (no usan el runner): **ortografía** (`data/ortografia.json`),
**Corregir/Dictado** (`data/parrafos.json`), **quiz**, los **mapas** (`data/mapas/*`), los
**generadores numéricos** de Matemáticas (crean los ejercicios al vuelo en vez de leerlos de un banco)
y la **geometría** (`src/modos/geometria.js`: rectas, ángulos, cuadriláteros y perímetro en SVG).

Qué se ve en cada **grado y trimestre** lo decide el plan de **`data/curriculo.json`**; el catálogo
de materias y actividades está en `data/materias.json`.

> Todos los datos canónicos viven en `data/**/*.json`; `herramientas/build.py` genera junto a cada
> uno un `.js` que rellena `window.__DATOS__`, y `src/core/datos.js` los coloca en los globales que
> espera la lógica. Así el **mismo código** funciona con doble clic (`file://`) y servido, sin
> carpeta `dist/`. Detalle técnico en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

---

## 🗂️ Estructura de carpetas

```
.
├── index.html                  # perfiles → grado y trimestre → materias → actividades
├── paginas/                    # un HTML por actividad (+ editor.html y contenido.html, zona de adultos)
├── src/
│   ├── core/                   # motores y API compartida:
│   │   ├── juego.js            #   marcador, sonido, localStorage, perfiles, niveles, curso, leaderboard
│   │   ├── actividad.js        #   motor de actividades manipulativas
│   │   ├── mc.js               #   motor de opción múltiple (repasos rápidos)
│   │   ├── arrastrar.js        #   arrastrar y soltar (mouse + dedo)
│   │   ├── contenido.js        #   RUNNER genérico: monta cada modo desde su JSON
│   │   ├── datos.js            #   cargador (window.__DATOS__ → globales)
│   │   ├── curriculo.js        #   grados, trimestres, plan y mapa conceptual de ayuda
│   │   ├── menu.js             #   pantallas del índice + modal de clave (zona de adultos)
│   │   └── perfiles.js         #   selector de perfiles
│   ├── modos/                  # lo que NO usa el runner:
│   │   ├── (Matemáticas)       #   generadores: aritmetica, tablas, multiplicacion, division,
│   │   │                       #   secuencias, comparar, redondeo, numeros, medidas, hora,
│   │   │                       #   dinero, valorposicional, fracciones
│   │   ├── geometria.js        #   rectas y ángulos + cuadriláteros y perímetro (SVG)
│   │   ├── ortografia.js, copia.js
│   │   ├── quiz.js, mapas.js, mapacantones.js, donde.js
│   │   ├── banco.js            #   banco de contenido (zona de adultos)
│   │   └── editor.js           #   ajustes (zona de adultos)
│   └── efectos/                # escena3d.js (fondo 3D), luna.js (mascota),
│                               # modelo3d.js + modelos/ (planta, flor, cicloagua, bloques, fraccion)
├── data/
│   ├── curriculo.json          # grados, trimestres y plan (qué actividad va en qué trimestre)
│   ├── materias.json           # catálogo de materias y actividades
│   ├── contenido/<modo>.json   # contenido de las actividades del runner (+ .js generado)
│   ├── mapas/                  # geografía: provincias, regiones, detalle, cantones, mapa-ec
│   └── *.json (+ *.js)         # ortografia, parrafos, secuencias, nino, generador-parrafos
├── css/modulos/                # estilos modulares
├── lib/three.min.js            # three.js r128 local (3D offline)
├── recursos/                   # SVG del mapa, banderas, dibujos ("Señala la parte", casa y aula), cantones
├── herramientas/               # Python, sin instalar nada:
│   ├── build.py                #   precompila data/**/*.json → data/**/*.js
│   ├── validar.py              #   revisa que el contenido no tenga trampas
│   └── humo.py + cdp.py        #   prueba de humo en Chrome/Edge sin ventana
└── docs/                       # ARQUITECTURA.md, ESQUEMA_CONTENIDO.md
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
3. Regístrala en `src/core/menu.js` (`PAGINA`) y en `data/materias.json`.
4. Ponla en el plan de al menos un trimestre en `data/curriculo.json` → `build.py` y `validar.py`.

**Para mover una actividad de trimestre, o repetirla en otro:** edita el plan en
`data/curriculo.json` → `build.py`.

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
- **Contenido sin trampas**: `python herramientas/validar.py` (respuestas que no están entre las
  opciones, palabras en dos grupos, casillas con la respuesta escrita, actividades fuera de todo
  trimestre, `.js` sin regenerar…).
- **Prueba de humo en un navegador real**: `python herramientas/humo.py --todos` abre todas las páginas
  en Chrome/Edge **sin ventana**, entra a cada tema en los tres niveles y avisa de errores de
  JavaScript, rondas vacías o actividades que no caben en pantalla. No necesita Node ni instalar nada.

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
