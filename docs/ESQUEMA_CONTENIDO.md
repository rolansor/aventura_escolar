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
**Tras editar un JSON:** `python herramientas/build.py` y luego `python herramientas/validar.py`
(revisa que el contenido no tenga trampas). **Tras tocar JS:** `python herramientas/humo.py` (abre el juego
en un navegador sin ventana y prueba todas las páginas).

### Archivos incrustados (`$archivo`)
Un dibujo SVG grande no se escribe como cadena escapada dentro del JSON: se guarda como un `.svg` normal y
el JSON lo referencia con `{ "$archivo": "ruta/desde/la/raíz.svg" }`. `build.py` sustituye ese objeto por
el texto del archivo al generar el `.js` (y `validar.py` lo resuelve igual). Ejemplo en `senala.json`:
`"svg": { "$archivo": "recursos/senala/cuerpo.svg" }`. Tras editar el `.svg` hay que correr `build.py`.

## Cabecera del archivo
```jsonc
{
  "modo": "animales",            // id (= nombre de archivo)
  "materia": "ciencias",         // lengua | matematicas | sociales | ciencias | ingles
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
| `clasificar` | `pregunta`, `cestas:[{id,nombre,emoji}]`, `cestasPorNivel:[[ids],…]?`, `items:{ id:[[b],[i],[a]] }`, `fichas:[b,i,a]?` (cuántas fichas por ronda; def. 4–6), `dibujo?:{ modelo?, svg }` | arrastrar a cestas. Salen **más fichas que cestas** y repartidas al azar (una cesta puede recibir dos o ninguna): no se resuelve por descarte. Con **`dibujo`**, las cestas son las **partes** de un dibujo SVG o de un modelo 3D (los `id` de las cestas = `data-parte` / partes del modelo) y la ficha se suelta sobre la parte |
| `emparejar` | `pregunta`, `pares:[ [ {a,b} ], [i], [a] ]`, `porRonda:[b,i,a]?` | unir izquierda↔derecha. La pareja se acepta por **texto**: dos `a` pueden compartir el mismo `b` (cóndor y oso → "Sierra"). En una misma ronda no salen dos parejas donde la respuesta de una es la palabra de la otra ("poblamiento → asentamiento" con "asentamiento → poblado") |
| `ordenar` | `pregunta`, `secuencias:[ [ ["a","b"] ], [i], [a] ]` | tocar en orden (elige 1 secuencia/ronda). Se compara el **texto**: dos fichas iguales son intercambiables |
| `silabas` | `items:[ [ ["ma","ri","po","sa"] ], [i], [a] ]` | ordenar las sílabas (muestra la palabra) |
| `alfabetico` | `pregunta?`, `grupos:[ [ ["pato","ave"] ], [i], [a] ]` | ordenar A→Z (orden calculado, sin tildes) |
| `vf` | `preguntas:[ [ {t,c,exp} ], [i], [a] ]` | ¿verdadero o falso? (`c`=bool, `exp` al fallar). El runner sortea **mitad verdaderas, mitad falsas**: pon al menos 3–4 falsas por nivel para que no se repitan |
| `definir` | `preguntas:[ [ {q,c,d:[…]} ], [i], [a] ]` | elige la definición correcta |
| `sujeto` | `pregunta?`, `items:[ [ {palabras:[…],corte} ], [i], [a] ]` | toca dónde empieza el predicado |
| `signos` | `pregunta?`, `pista?` (mensaje al fallar), `items:[ [ {antes,despues,correcto,opciones:[…]} ], [i], [a] ]` | toca lo que va en el hueco ▢ (un signo, o la letra/tilde que falta en una palabra) |
| `formas` | `pista?` (mensaje al fallar), `items:[ [ {base,instr,correcto,opciones:[…]} ], [i], [a] ]` | elige la forma correcta (también sirve para completar una igualdad: `base` = "6 × 8 = 8 × ▢") |
| `escena` | `escena?(svg)`, `modelo?`, `slots:[{id,txt?,left?,top?}]`, `fichas:[{id,txt?,ficha?}]` | arrastrar fichas a zonas (sobre un SVG o en fila). Con **`modelo`** (p. ej. `"cicloagua"`) las casillas "?" flotan sobre una maqueta 3D animada, ancladas al punto del modelo con el mismo `id`. **No pongas en `txt` la respuesta** (la casilla la regalaría) |
| `senala` | `svg`, `modelo?`, `partes:[{id,nombre}]` | tocar la parte correcta. Con **`modelo`** (p. ej. `"planta"`, `"flor"`) se usa el modelo 3D y el `svg` queda de respaldo sin WebGL. El `nombre` lleva su **artículo** ("la raíz", "los pétalos"): de ahí sale la concordancia ("¿Dónde **están** los pétalos?") |
| `problema` | `ops:[…]` (filtra el `banco` del archivo, ítems `{t,op,a,b,u}`) | problema verbal: elige operación y escribe la respuesta |
| `terminos` | `suma:bool` **o** `op:"mult"` (+ `rangosB?` para el 2.º factor y `factores?:bool`), `rangos:[[b],[i],[a]]` | paramétrico: genera a±b o a×b y arrastra los nombres (sumando/suma, minuendo/sustraendo/diferencia, multiplicando/multiplicador/producto o factor/factor/producto) |
| `ahorcado` | `palabras:[ [ {en,es,emoji} ], [i], [a] ]`, `vidas?` (def. 6), `pistas?:[b,i,a]` (letras regaladas), `mostrarEs?:[b,i,a]` | adivina la palabra en inglés letra por letra (teclado en pantalla **y** teclado real); el emoji + la traducción son la pista, y al terminar la voz del navegador la pronuncia en inglés |

> `escena`/`senala`/`dibujo`: el SVG puede ir como cadena o, mejor, como archivo aparte con `$archivo`
> (ver arriba). Cada parte tocable es un `<g data-parte="id">` (el mismo id puede repetirse en varios
> grupos). `problema` lee un campo **`banco`** a nivel de archivo (no por tema); cada tema `problema` lo
> filtra por sus `ops`.
>
> **Sin repeticiones:** el runner reparte cada banco como un mazo barajado; una pregunta no vuelve a salir
> hasta que pasaron todas las demás.

## Tipos de tema — motor "mc"
| `tipo` | Campos | Notas |
|---|---|---|
| `mc` | `banco:[ {p,c,d:[…],pista?} ]` | quiz; el runner garantiza que `c` esté entre las opciones |
| `lectura` | `lecturas:[ [ {texto,preguntas:[{q,opciones,correcta}]} ], [i], [a] ]` | comprensión lectora: se lee **un** texto y se responden seguidas todas sus preguntas |

## Reglas de oro (no romper nada)
- Edita **solo datos**; no toques `px`, ni los IDs de la página, ni el runner.
- Mantén `[ básico, intermedio, avanzado ]`. `[]` = cae al nivel inferior.
- En `clasificar`, un ítem va en **una sola cesta por tema** (ojo con palabras como "lo" o "rápido", que
  caben en dos grupos: `validar.py` las detecta).
- En `escena`, la casilla **no** debe traer escrita la respuesta.
- En `definir`/`mc`, la **correcta** no se repite en los distractores.
- En `silabas`, separa a mano; en `clasificar` de ortografía, clasifica a mano (ejemplos claros).
- Español del Ecuador, ~9 años, textos cortos, datos correctos.

## Añadir una actividad nueva (con el runner)
1. Crea `data/contenido/<modo>.json` (este esquema) → `python herramientas/build.py`.
2. Crea `paginas/<modo>.html` copiando una página del runner (p. ej. `paginas/animales.html`): carga
   `data/contenido/<modo>.js`, `datos.js`, el motor (`actividad.js`/`mc.js`), `arrastrar.js`,
   `contenido.js`, y monta con `Datos.cargar(["contenido/<modo>"]).then(()=> Contenido.montar("<modo>").init())`.
3. Registra el modo en `src/core/menu.js` (`PAGINA`) y en `data/materias.json`.
4. Ponlo en el plan de al menos un trimestre en `data/curriculo.json` (si no, no se puede abrir desde
   el menú y `validar.py` lo marca) → `build.py`.

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
  Igual la **geometría** (`src/modos/geometria.js`: rectas, ángulos, cuadriláteros y perímetro).
- **Grados y trimestres** (`data/curriculo.json`, lo lee `src/core/curriculo.js`): no es contenido de una
  actividad, sino el reparto de las actividades por trimestre (`plan[trimestre][materia] = [modos]`).

## Verificación
- `python herramientas/build.py` — regenera los `data/*.js`.
- `python herramientas/validar.py` — contenido sin trampas: respuestas que no están entre las opciones,
  palabras en dos cestas, casillas con la respuesta escrita, partes sin dibujo, ortografía sin la letra de
  su categoría, cantones mal escritos, `.js` sin regenerar. Sale con código 1 si hay errores.
- `python herramientas/humo.py [--todos] [página…]` — abre cada página en Chrome/Edge sin ventana, entra a
  cada tema varias veces y avisa de errores de JavaScript, rondas vacías o actividades que no caben en
  pantalla.
