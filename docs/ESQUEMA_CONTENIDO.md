# Esquema de contenido en JSON — *La Aventura de Nelson*

> Arquitectura nueva: **todo el contenido de las actividades vive en `data/contenido/<modo>.json`** y lo
> consume un **runner genérico** (`src/core/contenido.js`). Cada actividad = un JSON. Esta guía define el
> esquema exacto y, al final, las **excepciones** (actividades con loader propio).

## Pipeline
```
data/contenido/<modo>.json   (canónico, lo editas tú o una IA)
        │  python herramientas/build.py   (recursivo; NO se toca)
        ▼
data/contenido/<modo>.js     ((window.__DATOS__||{})["contenido/<modo>"] = {...})
        │  <script src="data/contenido/<modo>.js"> en la página
        ▼
window.__DATOS__["contenido/<modo>"]
        │  Datos.cargar(["contenido/<modo>"])   (datos.js: prefijo "contenido/" → DATOS.contenido[<modo>])
        ▼
DATOS.contenido[<modo>]
        │  Contenido.montar("<modo>")   (src/core/contenido.js)
        ▼
Actividad(px, temas)  ó  MC(px, temas)   (motores existentes)
```
**Tras editar un JSON:** `python herramientas/build.py`. **Tras tocar JS:** `bun build --no-bundle`.

## Cabecera del archivo
```jsonc
{
  "modo": "animales",            // id (= nombre de archivo)
  "materia": "ciencias",         // lengua | matematicas | sociales | ciencias
  "px": "ani",                   // prefijo de los IDs en la página (<px>-selector, <px>-extra, …)
  "titulo": "Los animales",
  "icono": "🐾",
  "motor": "actividad",          // "actividad" (manipulativo) | "mc" (opción múltiple)
  "destrezas": ["CN.3.1.6"],     // opcional: códigos del currículo (categorización)
  "temas": [ … ]                 // ver tipos abajo
}
```

## Convención por nivel
Casi todo el contenido es un arreglo de **3 posiciones**: `[ básico, intermedio, avanzado ]`. Se puede
dejar `[]` en un nivel: el runner **baja** al inferior (`nivelArr`/`itemDe`). El nivel activo lo da el
perfil (`Juego.nivelIdx()` / `Juego.porNivel`).

## Tipos de tema (`tipo`) — motor "actividad"
Cada tema lleva `tipo`, `icono`, `nombre`, `desc`, `total?` (rondas, def. 6) y su contenido:

| `tipo` | Campos de contenido | Interacción |
|---|---|---|
| `clasificar` | `pregunta`, `cestas:[{id,nombre,emoji}]`, `cestasPorNivel:[[ids],…]?`, `items:{ id:[[b],[i],[a]] }` | arrastrar a cestas (1 ítem por cesta/ronda) |
| `emparejar` | `pregunta`, `pares:[ [ {a,b} ], [i], [a] ]` | unir izquierda↔derecha |
| `ordenar` | `pregunta`, `secuencias:[ [ ["a","b"] ], [i], [a] ]` | tocar en orden (elige 1 secuencia/ronda) |
| `silabas` | `items:[ [ ["ma","ri","po","sa"] ], [i], [a] ]` | ordenar las sílabas (muestra la palabra) |
| `alfabetico` | `pregunta?`, `grupos:[ [ ["pato","ave"] ], [i], [a] ]` | ordenar A→Z (orden calculado, sin tildes) |
| `vf` | `preguntas:[ [ {t,c,exp} ], [i], [a] ]` | ¿verdadero o falso? (`c`=bool, `exp` al fallar) |
| `definir` | `preguntas:[ [ {q,c,d:[…]} ], [i], [a] ]` | elige la definición correcta |
| `sujeto` | `pregunta?`, `items:[ [ {palabras:[…],corte} ], [i], [a] ]` | toca dónde empieza el predicado |
| `signos` | `pregunta?`, `items:[ [ {antes,despues,correcto,opciones:[…]} ], [i], [a] ]` | toca el signo del hueco ▢ |
| `formas` | `items:[ [ {base,instr,correcto,opciones:[…]} ], [i], [a] ]` | elige la forma correcta |
| `escena` | `escena?(svg)`, `slots:[{id,txt?,left?,top?}]`, `fichas:[{id,txt?,ficha?}]` | arrastrar fichas a zonas (sobre un SVG o en fila) |
| `senala` | `svg`, `partes:[{id,nombre}]` | tocar la región correcta sobre un SVG |
| `problema` | `ops:[…]` (filtra el `banco` del archivo, ítems `{t,op,a,b,u}`) | problema verbal: elige operación y escribe la respuesta |
| `terminos` | `suma:bool`, `rangos:[[b],[i],[a]]` | paramétrico: genera a±b y arrastra los nombres |

> `escena`/`senala`: el SVG va embebido como **una cadena JSON** (escapar las comillas). `problema` lee un
> campo **`banco`** a nivel de archivo (no por tema); cada tema `problema` lo filtra por sus `ops`.

## Tipos de tema — motor "mc"
| `tipo` | Campos | Notas |
|---|---|---|
| `mc` | `banco:[ {p,c,d:[…],pista?} ]` | quiz; el runner garantiza que `c` esté entre las opciones |
| `lectura` | `lecturas:[ [ {texto,preguntas:[{q,opciones,correcta}]} ], [i], [a] ]` | comprensión lectora |

## Reglas de oro (no romper nada)
- Edita **solo datos**; no toques `px`, ni los IDs de la página, ni el runner.
- Mantén `[ básico, intermedio, avanzado ]`. `[]` = cae al nivel inferior.
- En `clasificar`, un ítem va en **una sola cesta por tema**.
- En `definir`/`mc`, la **correcta** no se repite en los distractores.
- En `silabas`, separa a mano; en `clasificar` de ortografía, clasifica a mano (ejemplos claros).
- Español del Ecuador, ~9 años, textos cortos, datos correctos.

## Añadir una actividad nueva (con el runner)
1. Crea `data/contenido/<modo>.json` (este esquema) → `python herramientas/build.py`.
2. Crea `paginas/<modo>.html` copiando una página del runner (p. ej. `paginas/animales.html`): carga
   `data/contenido/<modo>.js`, `datos.js`, el motor (`actividad.js`/`mc.js`), `arrastrar.js`,
   `contenido.js`, y monta con `Datos.cargar(["contenido/<modo>"]).then(()=> Contenido.montar("<modo>").init())`.
3. Registra el modo en `src/core/menu.js` (`PAGINA`) y en `data/materias.json` → `build.py`.

## Excepciones — actividades con loader propio (NO usan el runner)
Estas guardan su contenido en JSON pero las consume su propio módulo (no `Contenido.montar`). Se editan
en su archivo y, tras editar, se corre `python herramientas/build.py`.

- **Ortografía** (`data/ortografia.json`, lo lee `src/modos/ortografia.js`). Array de categorías; según su
  campo `estrategia`:
  - `letra` (b_v, c_s_z, g_j, m_p_b), `hache` (h_muda), `lly` (ll_y): arreglo **`palabras`**.
  - `tilde` (tildes): arreglo **`conTilde`**. `mayus` (mayusculas): **`propios`** y **`comunes`**.
  - `clasificar` (acentuacion, diptongo_hiato): objeto **`banco`** con una lista por cada etiqueta de
    `clases`. **Clasifica a mano**, con ejemplos claros (evita palabras ambiguas).
- **Corregir/Dictado** (`data/parrafos.json`, lo lee `src/modos/copia.js`): `[{ id, nombre, nivel, texto,
  textoMal? }]`. `texto` = versión correcta; `textoMal` (opcional) = misma frase con errores del adulto.
- **Quiz del Ecuador** (`src/modos/quiz.js`): la geografía se genera de `DATOS.mapas`; los bancos de texto
  están en `data/contenido/quiz.json` → `bancos.aborigen` / `bancos.territorio` (`{p,c,d,pista?}`).
- **Mapas** (`data/mapas/*`): geografía (ver `data/README.md`). **Matemáticas** (aritmetica, tablas, etc.):
  **generan** los ejercicios; no hay banco de preguntas (su "config" son rangos por nivel en el módulo).

## Verificación
- `python -c "import json; json.load(open('data/contenido/<modo>.json',encoding='utf-8'))"`.
- `python herramientas/build.py` y `bun build --no-bundle src/core/contenido.js`.
- Smoke test headless (`scratchpad/test_*.js`): montan vía `Contenido.montar` y "tocan" la ronda en
  básico y avanzado.
