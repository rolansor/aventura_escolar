# CLAUDE.md — La Aventura de Nelson

Juego educativo (Lengua, Matemáticas, Estudios Sociales, Ciencias Naturales e Inglés) en **HTML/CSS/JavaScript
vanilla + three.js**, para un niño de ~9 años (Quinto de básica), en **español de Ecuador**. Sin framework ni
npm. **Estructura modular** (ver `docs/ARQUITECTURA.md`): un HTML por actividad en `paginas/`, lógica en
`src/`, datos en `data/`, CSS en `css/modulos/`. Funciona **con doble clic** (`index.html`) **y servido**.

**Lo primero que hay que saber:**
- **Grado y trimestre.** Al entrar se elige el grado y el trimestre; qué actividades tocan en cada uno lo
  decide el **plan** de `data/curriculo.json` (ver "Grado y trimestre"). Las actividades se definen una sola
  vez en el **catálogo** `data/materias.json`.
- **Contenido en JSON + runner.** El contenido de casi todas las actividades vive en
  **`data/contenido/<modo>.json`** y lo consume un **runner genérico**, `src/core/contenido.js`
  (`Contenido.montar("<modo>")` arma las rondas según el `tipo` de cada tema). **No hay un
  `src/modos/<modo>.js` por actividad de banco.** Cada `paginas/<modo>.html` carga su `.js` de datos +
  `datos.js` + el motor + `contenido.js` y arranca con
  `Datos.cargar(["contenido/<modo>"]).then(() => Contenido.montar("<modo>").init())`.
  Esquema, tipos y excepciones: **`docs/ESQUEMA_CONTENIDO.md`**. Organización de `data/`: **`data/README.md`**.
- **Con lógica propia** (en `src/modos/`): **ortografia** y **copia** (`data/ortografia.json` /
  `data/parrafos.json`), **quiz** (geografía desde `DATOS.mapas` + bancos de texto en
  `data/contenido/quiz.json`), **mapas / cantones / donde** (geometría en `data/mapas/*`), **Matemáticas**
  (generan los ejercicios) y **geometría** (`geometria.js`: rectas, ángulos, cuadriláteros y perímetro).

## Filosofía de diseño (LEER ANTES DE CREAR CUALQUIER ACTIVIDAD)
**Principio rector**: las actividades deben ser lo **más interactivas y manipulativas posible**, NO
simples baterías de "pregunta y respuesta". Diseña como lo harían **Piaget** y **Montessori**: el niño
de ~9 años está en la etapa de **operaciones concretas** — aprende **manipulando objetos**, no leyendo
enunciados abstractos. Antes de elegir el tipo de actividad, pregúntate: *"¿qué objeto manipularía el
niño en una clase Montessori para entender esto?"* y recréalo en pantalla.

Reglas concretas (en orden de preferencia):
1. **Manipular > elegir > teclear.** Prefiere **arrastrar, tocar, construir, ordenar, emparejar,
   verter, dibujar** sobre seleccionar una opción; y seleccionar sobre teclear. El opción-múltiple es
   el **último recurso**, no el primero. Ej.: para valor posicional, que **arme el número con bloques
   base-10**; para fracciones, que **parta y pinte la pizza**; para la hora, que **mueva las agujas**.
2. **Representación concreta siempre visible.** Toda idea abstracta necesita un **objeto en pantalla**:
   SVG dibujado a mano, **bloques/fichas/regletas** (estilo material Montessori), emojis grandes,
   diagramas clicables, o **three.js** cuando dé volumen/relieve real (no decoración vacía).
3. **Retroalimentación inmediata y autocorrectiva.** El material debe "responder" al instante (se
   ilumina verde/rojo, encaja o no, se anima). El error es información, no castigo — frases amables
   (`Juego.frasePositiva`), nunca regaños. El "control del error" lo lleva el propio material (Montessori).
4. **Manos primero, símbolo después.** Introduce la cantidad/idea con el objeto y **luego** conecta con
   el número o la palabra. Aprender haciendo y descubriendo, no memorizando reglas.
5. **Juego con propósito y contexto del Ecuador.** Enmarca con micro-narrativas, metas y celebración
   (`Juego.acierto/granPremio`), y usa contextos locales reales (mercado, regiones, fauna, monedas USD).
6. **Accesible para 9 años, sin lectura pesada.** Enunciados muy cortos, íconos que guían, objetivo
   obvio de un vistazo. Si necesita un párrafo de instrucciones, rediséñalo.

Patrones de referencia ya en el repo: **"Señala la parte"** (tipo `senala` del runner: la planta y la flor
son **modelos 3D** que se giran y se tocan; cuerpo, cara y órganos son ilustraciones SVG animadas),
**Valor posicional** (`src/modos/valorposicional.js`: bloques base 10 en 3D con sus tamaños reales, que se
ponen, se quitan y se canjean) y **El ciclo del agua** (maqueta 3D animada). Al crear un modo nuevo,
**parte de la interacción física**, no del cuestionario. Si caes en opción-múltiple, deja un comentario `// TODO:
volver manipulativo` explicando qué objeto faltaría. El motor `MC` (`src/core/mc.js`) sirve para
*cerrar* repasos rápidos, pero **no debe ser el molde por defecto** de las actividades nuevas.

## Cómo ejecutar / probar
- **Doble clic**: abrir `index.html` (los datos están precompilados en `data/*.js`).
- **Servido**: `python -m http.server` y abrir http://localhost:8000.
- Tras editar JS/CSS recargar con **Ctrl + Shift + R**. Tras editar un `data/*.json`, ejecutar
  `python herramientas/build.py` para regenerar los `data/*.js`.
- **Pruebas (sin Node ni instalar nada; ver "Pruebas y validación" más abajo):**
  `python herramientas/validar.py` (contenido sin trampas) y `python herramientas/humo.py --todos`
  (abre TODAS las páginas en Chrome/Edge sin ventana y prueba cada tema). **Correr las dos antes de dar
  algo por terminado.** No asumas que hay `bun` ni `node`: en la máquina del usuario no están.
- Sí hay **Python** (con `shapely`, `json5` y `PIL` instalados).
- three.js r128, **siempre la copia local** `lib/three.min.js` (ya no se carga del CDN; ver `lib/README.md`).
- Persistencia: **todo en `localStorage`** (progreso, config, contenido del editor).

## Arquitectura
Módulos **IIFE** que exponen globales (`window.X`). **Sin** imports/exports ES, **sin** `fetch`. Los
datos llegan como `<script src="data/<n>.js">` (rellenan `window.__DATOS__`) y `src/core/datos.js`
los coloca en los globales que la lógica espera. Navegación **multipágina**: cada actividad es una
página en `paginas/` que el menú enlaza. Las páginas de `paginas/` usan `<base href="../">`.

| Archivo | Global | Rol |
|---|---|---|
| `data/**/*.json` (+ `*.js` generados por `build.py`) | `DATOS.*`, `NINO`, `ECUADOR_SVG`, `ECUADOR_CANTONES` | **Datos** (ver `data/README.md`): **`data/contenido/<modo>.json`** (contenido de actividades, lo usa el runner), **`data/mapas/*`** (geografía: provincias, regiones, detalle, cantones, mapa-ec), y de sistema o con lógica propia (**curriculo**, materias, nino, ortografia, parrafos, generador-parrafos, secuencias). Editar el `.json` y correr `herramientas/build.py`. |
| `src/core/juego.js` | `Juego` | Núcleo: marcador, sonido, `localStorage`, temporizador, utilidades (`azar/azarEl/mezclar/cargar/guardar/frasePositiva/construirSecuencia`, `acierto/error/granPremio`, `cron*`, `jugador`, `aplicarIdentidad`) e `iniciarBase()`. **Perfiles** (`perfiles/perfilActivo/crearPerfil/seleccionarPerfil/actualizarPerfil/borrarPerfil`), **nivel de dificultad** (`nivel/nivelIdx/porNivel`), **curso** (`curso/fijarCurso`: grado y trimestre recordados en el perfil) y **leaderboard** (`registrarResultado/mejores/fmtTiempo/tablaMejoresHTML`). Ver "Perfiles, Niveles y Leaderboard". |
| `src/core/perfiles.js` | `Perfiles` | **Selector de perfiles** (solo en `index.html`): pantalla `pantalla-perfiles` con una tarjeta por niño (botones **✏️ editar** y **🗑️ borrar**) + "➕ Nuevo perfil". El modal `abrirForm(perfil?)` sirve para **crear y editar** (nombre del niño, **sexo del niño** = `genero` —emoji 👧/👦 de su tarjeta—, **nombre de la mascota** = `avatar` —por defecto "Perchita"—, **sexo de la mascota** = `generoMascota` —construye a la mascota niña/niño— y nivel; precarga al editar y guarda con `Juego.actualizarPerfil`, que aplica la identidad en vivo a la mascota). **Valida** ambos nombres con `validarNombre` (solo letras, sin números/símbolos/groserías; listas `SOECES_PALABRA`/`SOECES_FUERTE`). Chip de perfil en la barra para cambiar. `Perfiles.init/abrir/actualizarChip`. |
| `src/core/datos.js` | `Datos` | `Datos.cargar([...])` lee `window.__DATOS__` y rellena los globales. |
| `src/core/curriculo.js` | `Curriculo` | **Grados, trimestres y plan** (solo en `index.html`): lee `DATOS.curriculo` (`data/curriculo.json`). `grados()/trimestres()/grado(id)/trimestre(id)/disponible(g)/porDefecto()`, `materias(gradoId, triId)` (las materias del catálogo, cada una SOLO con las actividades de su plan) y `abrirMapa(gradoId, alIr)` (la "ayudita": mapa conceptual grado → trimestres → materias → actividades). Ver "Grado y trimestre". |
| `src/core/menu.js` | `Menu` | Menú del índice en 3 sub-pantallas: **grado + trimestre** (`pantalla-curso`), **materias** del trimestre (`pantalla-menu`) y **actividades** (`pantalla-materia`); las tarjetas salen de `Curriculo.materias(...)` y enlazan a `paginas/<modo>.html`. **Modal de clave** (`pedirClave(destino)`) que se abre ANTES de ir a la zona de adultos; sin clave válida no se navega. Dos tarjetas de adultos: **⚙️ Ajustes** (`editor.html`) y **📚 Banco de contenido** (`contenido.html`). |
| `src/core/mc.js` | `MC` | Motor de **opción múltiple** (repasos rápidos). Fábrica `MC(px, temas)`; ronda de 10. Al terminar registra el resultado en el leaderboard (`Juego.registrarResultado(px,…)`). **No es el patrón por defecto** (ver Filosofía de diseño). |
| `src/core/actividad.js` | `Actividad` | Motor de **actividades manipulativas** (hermano de `MC`). Fábrica `Actividad(px, temas, opts)`; cada tema tiene `ronda(host, ctrl)` que arma la interacción en `#<px>-extra` y resuelve con `ctrl.ganar()/fallar()/reintento()`. Sin temporizador (autocorrectivo). Al terminar registra el leaderboard. Reutiliza la misma estructura de página por prefijo que `MC`. |
| `src/core/arrastrar.js` | `Arrastrar` | Arrastrar-y-soltar con eventos de **puntero** (mouse + dedo). `Arrastrar.hacer(item, zonas, alSoltar)` (marca `.zona-hover`, devuelve la zona destino o null) y `Arrastrar.clasificar(host, ctrl, {pregunta, cestas, items})` (actividad "clasifica en cestas"). Además dos ayudantes de **toque** para `ronda()` de `Actividad`: `Arrastrar.emparejar(host, ctrl, {pregunta, pares:[{a,b}]})` (une parejas: toca izquierda→derecha; CSS `.emp-*`) y `Arrastrar.ordenar(host, ctrl, {pregunta, correcto:[...]})` (toca fichas en orden; CSS `.ord-*`). |
| `src/core/contenido.js` | `Contenido` | **Runner genérico de contenido**. `Contenido.montar("<modo>")` lee `DATOS.contenido[<modo>]` (de `data/contenido/<modo>.json`) y arma las rondas según el `tipo` de cada tema (clasificar/emparejar/ordenar/silabas/alfabetico/vf/definir/sujeto/signos/formas/escena/senala/problema/terminos/**ahorcado**; motor `mc`: mc/lectura), devolviendo un `Actividad`/`MC`. Incluye el helper de **voz en inglés** (`hablarEn`, Web Speech API) que usa el ahorcado. Centraliza la lógica que antes estaba en cada `src/modos/*.js`. Ver `docs/ESQUEMA_CONTENIDO.md`. |
| `data/contenido/<modo>.json` | `DATOS.contenido[<modo>]` | **Contenido de las 30 actividades del runner** (Lengua: clases, familia, sinonimos, refranes, ordena, alfabetico, silabas, sujeto, signos, formas, lectura, vocabulario; Ciencias: animales, invertebrados, cuidafauna, plantas, vidaplantas, cuerpo, materia, ambiente, cicloagua, senala; Sociales: epoca, regiones, incas, riosygente; Mate: problemas, terminos, propmult; Inglés: ahorcado) + `quiz.json` (bancos de texto del Quiz). **No tienen `src/modos/*.js`** (su lógica vive en el runner). Editar el JSON + `build.py`. |
| `src/modos/ortografia.js` | `Ortografia` | Ejercicios desde `DATOS.ortografia` (loader propio). |
| `src/modos/secuencias.js` | `Secuencias` | Secuencias numéricas. |
| `src/modos/copia.js` | `Copia` | **Corregir / Dictado** (dos sub-modos manipulativos). *Corregir*: el texto sale con errores y el niño **toca la palabra mala** → mini-modal con opciones (dificultad por `Juego.nivelIdx()`: básico = errores marcados y opciones obvias; intermedio = marcados, opciones más parecidas; avanzado = sin marcar, el niño los **busca** y al final pulsa Comprobar). *Dictado*: la voz del navegador (**Web Speech API**, sin librerías; degrada a mostrar el texto si no hay voz) lee y el niño escribe. Puntaje = palabras correctas/total → leaderboard `"copia"`. Conserva `generarErrores` (lo usa `banco.js`). |
| `src/modos/editor.js` | `Editor` | Zona de adultos — **⚙️ Ajustes** (clave **24861793**): solo temporizador y reinicio de progreso. La identidad y el nivel viven en el perfil; el contenido, en `banco.js`. |
| `src/modos/banco.js` | `BancoContenido` | Zona de adultos — **📚 Banco de contenido** (misma clave): administra palabras de ortografía (editor universal), secuencias propias y párrafos. Mantiene `claveBancoCustom/claveOcultasOrto/bancoDefaultOrto` alineadas con `ortografia.js`. **Global `BancoContenido`** (distinto del runner `Contenido` de `src/core/contenido.js`). |
| `src/modos/{aritmetica,tablas,multiplicacion,division,comparar,redondeo,numeros,valorposicional,dinero,medidas,hora,fracciones,secuencias}.js` | varios | **Matemáticas** (generadores numéricos): producen los ejercicios por nivel; no usan el runner (no hay banco de texto). **`valorposicional`** usa el motor `Actividad` con el modelo 3D `bloques` (armar el número, leer los bloques y repaso con la tabla); **`fracciones`** usa el modelo 3D `fraccion` (pizza/barra); **`dinero`** dibuja billetes y monedas con CSS (`.usd-*`). |
| `src/modos/geometria.js` | `Rectas`, `Cuadri` | **Geometría del 2.º trimestre** (motor `Actividad`, SVG + eventos de puntero): un archivo, dos actividades — `paginas/rectas.html` (rectas, ángulos y graduador) y `paginas/cuadrilateros.html` (familias de cuadriláteros y perímetro). Ver "Segundo trimestre de Quinto". Estilos `.geo-*` / `.grad-*` en `ejercicios.css`. |
| `src/modos/{mapas,mapacantones,donde}.js` + `quiz.js` | `Mapas`/`MapaCantones`/`Donde`/`Quiz` | **Mapas** (SVG/GeoJSON desde `data/mapas/*`) y **Quiz** (geografía de `DATOS.mapas` + bancos de texto en `data/contenido/quiz.json`). Loader propio. |
| `src/efectos/escena3d.js` / `luna.js` | `ESCENA` / `Luna` | Fondo 3D y mascota. `ESCENA.ahorro(bool)` baja el ritmo del fondo mientras una actividad muestra su modelo. `Luna` (niño/niña según `generoMascota`) respira, parpadea, **sigue el cursor con la mirada**, tiene gestos espontáneos (saludo/pensar), reacciones (feliz/triste/fiesta) y **`Luna.tip(texto)` / `Luna.decir(texto)`** para hablar por su globo. Por defecto vive **abajo a la derecha** (no tapa el ejercicio); solo guarda su posición si el niño la ARRASTRA (clave `luna_pos2`). **Si NO hay perfil creado** saluda en genérico y omite el nombre (`hayPerfil()`). |
| `src/efectos/modelo3d.js` + `src/efectos/modelos/*.js` | `Modelo3D` | **Escenario 3D de las actividades** (ver "Modelos 3D y dibujos"). `Modelo3D.registrar(nombre, fn)` / `disponible(nombre)` / `crear(host, nombre, opts)`. Modelos: `planta`, `flor`, `cicloagua`, `bloques`, `fraccion`. |
| `herramientas/*.py` | — | `build.py` (genera los `data/*.js`; incrusta `{"$archivo": …}`), `validar.py` (contenido), `humo.py` + `cdp.py` (prueba de humo en navegador sin ventana), `corregir_cantones.py` (nombres de cantones). |
| `css/modulos/*.css` | — | Estilos modulares (orden en `css/modulos/_orden.md`). |
| `recursos/` | — | `ecuador_1.0.svg` / `ecuador_2.0.svg` (mapa original y horneado), `gadm41_ECU_2.json` (fuente de los cantones), `banderas/EC-*.svg` (banderas provinciales) y `senala/*.svg` (dibujos de "Señala la parte"). |
| `paginas/*.html` | — | Una por módulo; incluye sus `data/*.js`, core, su modo, y arranca con `Datos.cargar(...).then(() => { Juego.iniciarBase(); Modo.init(); })`. |

`Juego` (en `src/core/juego.js`) es la API compartida por todas las páginas. Las secciones de abajo
describen la lógica de cada parte.

## Navegación: grado → trimestre → materia → actividad
Todo ocurre en `index.html` (`src/core/menu.js`), con sub-pantallas que se alternan:
`pantalla-perfiles` (si no hay perfil activo) → `pantalla-curso` (grado + trimestre, en una sola pantalla) →
`pantalla-menu` (materias de ese trimestre + las dos tarjetas de adultos) → `pantalla-materia`
(actividades) → `paginas/<modo>.html`. El botón ↩️ sube un nivel y 🏠 vuelve a `pantalla-curso`. Al regresar
de una actividad (`index.html?materia=<id>`) se abre esa materia en el curso recordado.

**Catálogo** (`data/materias.json` → `DATOS.materias`): cada actividad se define UNA sola vez.
```js
{ id, icono, nombre, desc,
  actividades: [ { modo, icono, nombre, desc }, ... ] }  // modo = clave del mapa PAGINA de menu.js
```
Las 51 actividades del catálogo:
- **Lengua** (14): ortografia, copia, clases, familia, sinonimos, formas, silabas, ordena, sujeto, signos,
  alfabetico, lectura, refranes, vocabulario.
- **Matemáticas** (18): secuencias, tablas, aritmetica, terminos, problemas, valor (su página es
  `valorposicional.html`), multiplicacion, division, comparar, redondeo, numeros, dinero, medidas, hora,
  fracciones, rectas, cuadrilateros, propmult.
- **Estudios Sociales** (8): epoca, regiones, mapas, cantones, quiz, donde, incas, riosygente.
- **Ciencias Naturales** (10): senala, plantas, cuerpo, animales, invertebrados, cuidafauna, cicloagua,
  materia, ambiente, vidaplantas.
- **Inglés** (1): ahorcado.

**Para añadir una actividad nueva:**
1. **Con el runner (lo normal):** crea `data/contenido/<modo>.json` y `paginas/<modo>.html` copiando una
   página del runner (p. ej. `paginas/animales.html`: cambia el título, los ids `<px>-…`, el `<script>` de
   datos, `Datos.cargar`, `Contenido.montar` y la materia de `MODO_VOLVER`). **Con lógica propia:** además un
   `src/modos/<modo>.js` sobre el motor `Actividad` (copia `paginas/hora.html`).
2. Añade el modo al mapa `PAGINA` de `src/core/menu.js` y a las `actividades` de su materia en
   `data/materias.json`.
3. **Ponlo en el plan de al menos un trimestre** en `data/curriculo.json` (si no, `validar.py` falla: no se
   podría abrir desde el menú).
4. `python herramientas/build.py`, `validar.py` y `humo.py <modo>`.

El menú, el mapa conceptual y el leaderboard se heredan solos.

## Grado y trimestre (`data/curriculo.json` + `src/core/curriculo.js`)
Lo primero que se elige al entrar, en una sola pantalla (`pantalla-curso`). `data/curriculo.json` tiene:
```js
{ trimestres: [ { id: 1, icono, nombre, corto }, ... ],
  grados: [ { id: "5", numero: "5.º", nombre: "Quinto de básica",
              plan: { "1": { lengua: ["ortografia", ...], matematicas: [...], ... }, "2": {...} } },
            { id: "1", numero: "1.º", nombre: "Primero de básica" }, ... ] }   // sin `plan` = en construcción
```
- **Grados** 1.º a 7.º de básica; solo **5.º** tiene `plan`. Los demás salen con el cartel
  "🚧 En construcción" (se pueden tocar: muestran el aviso en vez de los trimestres).
- **Plan** = por trimestre y por materia, la lista de `modo` del catálogo, en el orden en que se muestran.
  Una actividad puede estar en **varios** trimestres (se repite) o en **uno** solo; una materia que no
  aparece en un trimestre no sale en su menú (en el mapa sale con 💤). **Para mover o repetir algo: editar
  el plan + `build.py`.**
- **Hoy, en 5.º:** `"1"` = todo lo que existía antes de los trimestres (44 actividades; decisión del usuario:
  "todo lo anterior es primer trimestre"), `"2"` = 15 actividades (ver "Segundo trimestre de Quinto") y
  `"3"` todavía no existe. Un trimestre sin plan sale "🚧 En construcción" (tarjeta y columna del mapa) y no
  se puede entrar.
- **Curso recordado**: `Juego.curso()` → `{grado, trimestre}` y `Juego.fijarCurso(g, t)`; se guarda en el
  propio perfil (campos `grado`/`trimestre`), y sin perfil en la clave suelta `curso`. La tarjeta del
  trimestre donde se quedó el niño lleva "📌 Estabas aquí".
- **Ayudita** (`Curriculo.abrirMapa`, botón "🗺️ ¿Qué hay en cada trimestre?" en `pantalla-curso` y
  `pantalla-menu`): **mapa conceptual** con el grado arriba, una columna por trimestre y una fila por
  materia (alineadas entre columnas, un color por materia). Tocar una materia abre sus actividades en los
  tres trimestres a la vez (🔁 = se repite en otro trimestre, ⭐ = solo en ese, 💤 = la materia no toca);
  "👁️ Ver todo" abre todas. Tocar un trimestre entra a él; tocar una actividad la abre. CSS `.curso-*`
  y `.cmapa-*` en `menu.css`.
- `validar.py` (`revisar_curriculo`) falla si el plan nombra una materia o actividad que no existe, o si una
  actividad del catálogo **no está en ningún trimestre**.

## Contenido por materia (qué hay y cómo está hecho)
Salvo que se diga otra cosa, cada actividad es un JSON del runner (`data/contenido/<modo>.json`) con contenido
por 3 niveles `[básico, intermedio, avanzado]`; hereda leaderboard y niveles.

### Lengua
- **ortografia** y **copia** — lógica propia (ver "Modo Ortografía" y la fila de `copia.js` en la tabla).
- **clases** — clases de palabras (`clasificar`: sustantivo/adjetivo/verbo, +artículo, +pronombre/adverbio
  según el nivel). **familia** — familias de palabras (`clasificar`: derivadas a su raíz).
- **sinonimos** — sinónimos y antónimos (`emparejar`). **refranes** — refranes y adivinanzas (`emparejar`).
- **ordena** — ordena la oración (`ordenar`). **alfabetico** — orden alfabético (tipo `alfabetico`: orden
  calculado, tolerante a tildes). **silabas** — separa en sílabas (tipo `silabas`, separadas a mano).
- **sujeto** — sujeto y predicado: toca dónde empieza el predicado (`corte` puesto a mano).
- **signos** — pon el signo en el hueco ▢ (CSS `.signo-*`). **formas** — diminutivos, aumentativos, género y
  número (elige la forma).
- **lectura** — comprensión lectora (motor `MC`, tipo `lectura`: se lee un texto y se responden seguidas
  todas sus preguntas).
- **vocabulario** — ver "Segundo trimestre de Quinto".

### Matemáticas
Casi todo son generadores con lógica propia en `src/modos/` (ver su fila en la tabla). Del runner:
**terminos** (nombres de la suma y la resta), **problemas** (problemas verbales paso a paso: elegir la
operación y resolver) y **propmult**. La geometría (`rectas`, `cuadrilateros`) está en "Segundo trimestre
de Quinto".

### Ciencias Naturales (Taller 1 de Quinto: "Animales")
- **animales** (px `ani`, 7 temas) — vertebrado/invertebrado, grupos de vertebrados, qué comen, cómo nacen
  (ovíparo/vivíparo/ovovivíparo) y cómo respiran (`clasificar`) + conceptos.
- **invertebrados** (px `inv`, 13 temas) — los 6 grupos y sus subclasificaciones (artrópodos→insecto/
  arácnido/crustáceo/miriápodo; moluscos→gasterópodo/bivalvo/cefalópodo; gusanos→anélido/platelminto/
  nemátodo), con/sin patas, respiración, hábitat y reproducción + conceptos.
- **cuidafauna** (px `fauna`) — animales en peligro (animal amenazado ↔ región del Ecuador) y ¿ayuda o daña?
  (acciones según su huella ecológica).
- **plantas, cuerpo, materia, ambiente, cicloagua** — dos temas de clasificar + conceptos. En `plantas`
  ("Partes y su trabajo") y `cuerpo` ("¿Para qué sirve?") la ficha se suelta **sobre la parte** (planta 3D /
  dibujo de órganos). `cicloagua` → "Arma el ciclo" es una **maqueta 3D animada** con casillas "?".
- **senala** — "Señala la parte": planta y flor en **3D**; cuerpo, cara y órganos como ilustraciones SVG.
- **vidaplantas** — ver "Segundo trimestre de Quinto".
- **Regla de la materia: no solo clasificar.** Todas llevan además los temas de CONCEPTO **🤔 ¿Verdadero o
  falso?** (`vf`) y **📖 ¿Qué es cada cosa?** (`definir`), para estudiar *qué es* cada cosa.
- Destrezas: CN.3.1.1 (invertebrados), CN.3.1.4 (diversidad y amenazas por región), CN.3.1.6 y CN.3.1.7
  (reproducción de vertebrados e invertebrados), CS.3.3.18 (huella ecológica).

### Estudios Sociales (Taller 1 de Quinto: "Época Aborigen" + territorio)
- **epoca** (8 temas) — ¿cómo llegaron? (teorías del poblamiento de América: Bering/Hrdlička,
  Polinésica/Rivet, Australiana/Méndez Correa, Autóctona/Ameghino — `emparejar`), línea de tiempo
  (Paleoindio→Formativo→Desarrollo Regional→Integración — `ordenar`), sociedades agrícolas
  (Incipientes→Superiores→Supracomunales→Señoríos étnicos: **cuatro etapas separadas**, igual que en el
  Taller 2 del colegio; los señoríos entran desde intermedio — `ordenar`), pueblos y culturas (`emparejar`),
  los primeros pobladores (`clasificar`), del nómada al sedentario (`ordenar`) + conceptos.
- **regiones** — regiones naturales y relieves (`clasificar`) y organización territorial
  (País→Región→Provincia→Cantón→Parroquia — `ordenar`).
- **mapas, cantones, donde, quiz** — lógica propia (ver "Mapas del Ecuador").
- **incas, riosygente** — ver "Segundo trimestre de Quinto".

### Inglés (materia `ingles`)
**El ahorcado** (`ahorcado`, px `ahor`, tipo `ahorcado` del runner). Dos temas: **🍎 Fruits** (frutas comunes)
y **🇪🇨 Fruits of Ecuador** (guineo, verde, uvilla, tomate de árbol, guanábana, pitahaya…). El niño adivina la
palabra **en inglés** tocando letras (o con el teclado real); la pista es el **emoji grande + la traducción
al español de Ecuador** (en avanzado del tema 1 se oculta la traducción). Cada fallo dibuja una parte del
monigote y quita un ❤️ (6 vidas); en básico se regalan 2 letras, 1 en intermedio y 0 en avanzado (`pistas`).
Al terminar, la **voz del navegador pronuncia la palabra en inglés** (Web Speech API, `en-US`, con botón 🔊
para repetir; si no hay voz, no pasa nada). Estilos `.ahor-*` en `ejercicios.css`.

### Segundo trimestre de Quinto (sacado del Classroom del colegio)
El 2.º trimestre fue del 20-jul a mediados de octubre de 2026. Su plan (`"2"` en `data/curriculo.json`)
**repite** actividades que ya existían y calzan (Lengua: clases, sinonimos, lectura; Mate: tablas,
multiplicacion; Ciencias: plantas, senala, ambiente) y añade estas:
- **rectas** — "Rectas y ángulos" (`src/modos/geometria.js`, global `Rectas`, px `rec`; motor `Actividad`,
  todo SVG con eventos de puntero): **Gira la recta** (se gira la recta roja hasta que sea paralela /
  secante perpendicular / secante oblicua a la azul y se pulsa "¡Listo!"; el material responde con la
  esquina recta, las rayitas de paralelas o el punto de cruce), **El plano del barrio** (tocar la calle
  que es paralela/perpendicular/oblicua a la roja), **Abre el ángulo** (se gira un lado: en básico se pide
  la clase —agudo, recto, obtuso—; en intermedio/avanzado, los grados, con un graduador fijo) y **Mide
  con el graduador** (el graduador se ARRASTRA hasta la punta del ángulo, encaja y entonces se elige la
  medida; en avanzado el ángulo puede abrirse desde la izquierda y hay que usar la escala interior).
- **cuadrilateros** — "Cuadriláteros y perímetro" (mismo archivo, global `Cuadri`, px `cua`): **Familias**
  (arrastrar cada figura a paralelogramos / trapecios / trapezoides; catálogo `FIGURAS`, giradas según el
  nivel), **¿Cómo se llama?** (tocar el rombo, el romboide…), **Camina el contorno** (se toca cada lado
  para sumarlo: P = l + l + l + l, y se elige o escribe el total) y **Problemas de perímetro** (cercar,
  hallar el lado que falta, costo, vueltas; generados, con su dibujo).
- **propmult** — "Propiedades de la multiplicación" (runner, px `pmul`): términos (tipo `terminos` con
  `op:"mult"`), ¿qué propiedad es? (`clasificar`: conmutativa, asociativa, distributiva, elemento neutro
  y elemento absorbente), completa la igualdad (`formas`), V/F y definiciones. `multiplicacion` llega a
  3 cifras en el multiplicador en todos los niveles.
- **vocabulario** — "Concurso de vocabulario" (Lengua, runner, px `voc`): las **40 palabras del banco del
  colegio** (10 por materia) con su significado (`definir`), sinónimo y antónimo (`emparejar`) y escritura
  (`signos`: la letra o tilde que falta). Si el colegio cambia el banco, se edita
  `data/contenido/vocabulario.json`.
- **vidaplantas** — "La vida de las plantas" (Ciencias, runner, px `vpl`, 13 temas): plantas con y sin
  semilla, musgo y helecho, fotosíntesis/respiración/nutrición, de la flor al fruto, polinizadores, partes
  de la hoja, ecosistemas (productores/consumidores/descomponedores, clases) y adaptaciones.
- **incas** — "Señoríos, Incas y Conquista" (px `inca`) y **riosygente** — "Ríos y gente del Ecuador"
  (px `ryg`) (Sociales, runner, 8 temas cada una): épocas aborígenes, señoríos étnicos y su territorio,
  trueque, Imperio Inca, línea de tiempo hasta 1534 y personajes; vertientes y ríos, usos del agua, pueblos
  por región, fiestas, comidas y vestimenta.

Inglés aún no tiene nada del 2.º trimestre (verbos regulares en pasado): en el mapa sale con 💤.
Lo que falta está en "Estado y pendientes".

## Perfiles, Niveles y Leaderboard
**Perfiles** (`src/core/perfiles.js` + API en `juego.js`): cada niño tiene su perfil
`{ id, nombre, genero, avatar, generoMascota, nivel, grado, trimestre }` en `localStorage` (`perfiles` = lista,
`perfil_activo` = id). **`genero`** es el sexo del PARTICIPANTE (decide su emoji 👧/👦) y **`generoMascota`**
el de la MASCOTA (decide la figura de Perchita); en perfiles antiguos `generoMascota` cae a `genero`. El
formulario **valida** ambos nombres (niño y mascota) con `validarNombre` (solo letras/tildes/ñ, sin números,
símbolos ni groserías). La **identidad** (`jugador/avatarNombre/genero/generoMascota`) y el **nivel** se leen
SIEMPRE del perfil activo (con fallback a `NINO`/"Perchita"/"nina"/"basico" si no hay perfil, para no romper
el doble-clic en páginas sueltas). El **progreso** (`estado`: estrellas/racha/nivel) es por perfil, en clave `estado__<id>`. El
selector vive solo en `index.html`; un chip en la barra permite cambiar de perfil. `grado` y `trimestre`
son el último curso que eligió el niño (ver "Grado y trimestre"). **El contenido
(palabras/secuencias/párrafos) NO es por perfil**: es un banco compartido que cura el adulto.

**Niveles de dificultad** (propiedad del perfil): `basico | intermedio | avanzado`. Un modo consulta
`Juego.nivel()`/`Juego.nivelIdx()` o, lo más común, `Juego.porNivel([valBasico, valInter, valAvanzado])`
para escoger su rango. Aplicado en Matemática: `aritmetica` (cifras), `tablas`, `multiplicacion`,
`division` (magnitud) y `comparar` (hasta 6 cifras en avanzado, alineado al temario de Quinto). Modos
con rangos incrustados (`numeros`, `medidas`) se adaptan de forma incremental con la misma convención.

**Leaderboard** (por juego y por perfil): `Juego.registrarResultado(juego, {aciertos, total, ms})`
guarda en `lb_<juego>__<perfilId>` las 5 mejores, ordenadas por aciertos (desc) y, a igualdad, por
tiempo (asc). `juego` es el prefijo del modo (`px`). Los motores `MC`/`Actividad` lo llaman solos al
`terminar()` (miden el tiempo total con `tInicio`), igual que los loops propios (`aritmetica/tablas/
multiplicacion/division`). `Juego.tablaMejoresHTML(juego)` pinta el panel "🏆 Mejores de \<nombre\>"
(estilos `.leaderboard` en `ejercicios.css`), que se muestra en la pantalla de fin de ronda **y en el
selector de cada actividad** vía `Juego.pintarMejores(contenedor, juego)` (lo llaman los motores
`MC`/`Actividad` y los loops propios al pintar su selector; el panel ocupa toda la fila del grid con
`.leaderboard-wrap`). Así cada tipo de actividad muestra su propio leaderboard antes de jugar.

## Mapas del Ecuador (Estudios Sociales)
Cuatro actividades con lógica propia. La geografía vive en `data/mapas/*.json`: `mapa-ec` (el SVG de
provincias como texto → `ECUADOR_SVG`), `cantones` (geometría por cantón → `ECUADOR_CANTONES`) y
`provincias` / `regiones` / `detalle` (→ `DATOS.mapas`).

### `mapas` — mapa de provincias (`src/modos/mapas.js`, global `Mapas`)
Mapa SVG de las 24 provincias, coloreadas por las 4 regiones naturales (Costa, Sierra, Amazonía y Región
Insular). Es **explorable** (sin puntaje).
- **Hover** sobre una provincia → tooltip flotante con la **bandera** (`recursos/banderas/<ISO>.svg`, clase
  `.tt-bandera`) + nombre, región y capital. Hover sobre un chip de la leyenda → resalta esa región y atenúa
  las demás (`elemReg`).
- **Clic simple** → la provincia "salta" (CSS `.pop`). **Doble clic** → zoom animado del `viewBox` a esa
  provincia y panel lateral `#mapa-detalle` con un **slider** de información igual para todas (identidad,
  cantones, dato curioso; datos en `DET`, por código ISO).
- **Geometría intercambiable**: `mapas.js` no contiene coordenadas. Inyecta `ECUADOR_SVG` y reconoce cada
  provincia por su nombre o código ISO (`provinciaDe` busca de forma tolerante en `id/name/data-name/class/
  <title>` del elemento y de su `<g>` padre, normalizando con `norm()`).
- **Galápagos junto al continente y `viewBox` recortado** están **horneados** en `recursos/ecuador_2.0.svg`
  (el original de simplemaps es `recursos/ecuador_1.0.svg`), no se ajustan al mostrar. Si se cambia el SVG
  hay que volcarlo otra vez como texto JSON en `data/mapas/mapa-ec.json` y correr `build.py`.
- **Banderas**: las 24 están en `recursos/banderas/<ISO>.svg` (Wikimedia, "List of Ecuadorian flags"; Guayas
  usa la de Guayaquil). Detalle en `recursos/banderas/README.md`.

### `cantones` — provincia en 3D (`src/modos/mapacantones.js`, global `MapaCantones`)
- **Datos**: `data/mapas/cantones.json` =
  `{ viewBox, provincias:[{iso,nombre,region,capital,nCantones,borde,cantones:[{nombre,d}]}] }`, generado
  desde **GADM nivel 2** (`recursos/gadm41_ECU_2.json`): 24 provincias y **221 cantones**, con los nombres
  corregidos por `herramientas/corregir_cantones.py`. El preproceso (Python + shapely) proyecta lng/lat a
  SVG (equirectangular), mueve Galápagos junto al continente, **disuelve** los cantones de cada provincia
  (`unary_union`) para su borde y simplifica la geometría.
- **Vista 2D**: cada provincia es UN `<path class="prov">` (su contorno disuelto, color por región), sin
  cantones ni leyenda. Hover la resalta; clic abre el "foco".
- **Foco (provincia en 3D)**: `#mapac-foco` = canvas three.js + panel de datos (bandera, capital, región,
  provincialización, gentilicio y lista de cantones). Cada cantón se extruye por separado
  (`THREE.Shape` → `ExtrudeGeometry`) con su línea de borde; **gira solo y se arrastra para rotar**. Hover
  sobre un cantón → raycasting que muestra su nombre (`#mapac-canton-label`). Sin `THREE`, degrada a SVG
  plano (`fallback2D`). El botón Volver cierra el foco antes de salir (`cerrarFoco` / `enFoco`).

### `donde` y `quiz`
- **donde** (`src/modos/donde.js`, global `Donde`): "Toca la provincia de X" sobre el mapa SVG; ronda de 10
  con leaderboard. Usa `ECUADOR_SVG` y `DATOS.mapas.provincias`.
- **quiz** (`src/modos/quiz.js`, global `Quiz`): opción múltiple sobre capitales, regiones, cantones,
  gentilicios y banderas, generada desde `DATOS.mapas` y `ECUADOR_CANTONES` (3 opciones en básico, 4 en los
  demás), más los temas **🏺 Época Aborigen** y **🧭 Territorio y relieves**, cuyos bancos de texto están en
  `data/contenido/quiz.json` (`bancos.aborigen` / `bancos.territorio`).
- Pendiente menor: `mapas.js` y `mapacantones.js` todavía llevan sus propias tablas `PROVINCIAS` / `DET`;
  `data/mapas/provincias.json` y `detalle.json` ya existen (los usan `donde` y `quiz`) para de-duplicarlas.

## Modo Ortografía — cómo se generan los ejercicios
`DATOS.ortografia` es un array de **categorías**. Cada categoría tiene un campo `estrategia` que
determina su generador en `ortografia.js` (función `generar(cat)`):

| `estrategia` | Generador | Categorías | Tipo de ejercicio producido |
|---|---|---|---|
| `letra` | `genLetra` | `b_v`, `c_s_z`, `g_j`, `m_p_b` | `elige_letra` o `elige_palabra` |
| `hache` | `genHache` | `h_muda` | `elige_letra` o `elige_palabra` |
| `lly` | `genLLY` | `ll_y` | `elige_palabra` |
| `tilde` | `genTilde` | `tildes` | `elige_palabra` |
| `mayus` | `genMayus` | `mayusculas` | `elige_palabra` |
| `clasificar` | `genClasificar` | `acentuacion`, `diptongo_hiato` | `clasificar` |

**Tipos de ejercicio** (objeto devuelto por los generadores y renderizado en `mostrar()`):
- `elige_letra`: `{ tipo, palabra (con "_"), correcta, opciones, palabraCompleta, pista }` → muestra la palabra con hueco `▢`.
- `elige_palabra`: `{ tipo, correcta, opciones:[bien,mal], pista }` → pregunta "¿Cuál está bien escrita?".
- `clasificar`: `{ tipo, palabra, correcta (etiqueta), opciones (las etiquetas), pista }` → muestra la palabra y se elige su grupo.

El flujo (`empezar` → arma cola de `TOTAL_RONDA`=10 → `mostrar` → `responder` → `avanzar` → `terminar`)
es común a todos los tipos. `responder`/`tiempoAgotado` usan `ej.palabraCompleta || ej.correcta` para
la retroalimentación, lo cual ya funciona para `clasificar` (muestra la etiqueta correcta).

### Actividades de clasificación (añadidas)
Dos categorías con `estrategia: "clasificar"` en `data/ortografia.json`:
- **`acentuacion`** — "Agudas, llanas y esdrújulas". `clases: ["Aguda","Llana","Esdrújula","Sobresdrújula"]`.
- **`diptongo_hiato`** — "Diptongo, triptongo e hiato". `clases: ["Diptongo","Triptongo","Hiato"]`.

Estructura de una categoría de clasificación:
```js
{
  id, icono, nombre, estrategia: "clasificar",
  regla,        // banner explicativo (se muestra arriba en "💡 ...")
  pistaGen,     // pista mostrada bajo la palabra
  clases: [...],          // etiquetas = opciones de respuesta
  banco: { "Etiqueta": ["palabra1", ...], ... }   // palabras YA clasificadas a mano
}
```
`genClasificar(cat)`: elige una etiqueta al azar, luego una palabra al azar de su banco (concatena
extras del adulto si existieran en `orto_clas_<id>_<etiqueta>`), y devuelve un ejercicio `clasificar`.
`poolDe` suma todas las palabras del `banco`. `mostrar()` tiene una rama `else if (ej.tipo === "clasificar")`
que pinta la palabra y baraja las etiquetas como opciones.

**Importante sobre la clasificación**: la corrección **no se calcula**, se basa en bancos de palabras
**etiquetados a mano** (un silabeador automático en español sería frágil con diptongos/hiatos). Por eso,
al añadir palabras hay que poner cada una en el grupo correcto. Cuidado con palabras ambiguas (que tienen
a la vez diptongo e hiato): elegir solo ejemplos claros del rasgo que se quiere enseñar.

### Editor universal de ortografía (`banco.js`)
> Movido del editor al **📚 Banco de contenido** (`src/modos/banco.js`, global `BancoContenido`, + `paginas/contenido.html`).
La sección "🔤 Palabras de ortografía" administra **cualquier** categoría según su `estrategia`:
- **Selector de categoría** → muestra todas las de `DATOS.ortografia`.
- **Selector de grupo** (`ed-orto-grupo`) → aparece solo en `mayus` (propios/comunes) y `clasificar`
  (las `clases`). Determina a qué lista apuntan las acciones.
- **Agregar palabra** → guarda en `claveBancoCustom(cat, grupo)` (las mismas claves que lee el generador).
- **Ocultar 🚫 / Mostrar ↩️** → alterna en `claveOcultasOrto(cat, grupo)`; el generador respeta esto vía
  `quitarOcultas` (si se ocultan TODAS, se ignora el filtro para no dejar la categoría vacía).
- **Borrar 🗑️** → solo en palabras propias (las del juego no se borran, solo se ocultan).
- **Buscador dinámico** (`ed-orto-buscar`) → la lista **no vuelca el banco entero** (puede ser enorme):
  con el buscador vacío muestra solo un resumen + **tus** palabras; al escribir filtra entre tuyas y las
  del juego de forma tolerante a tildes/mayúsculas (`norm()`), con tope de 60 resultados. El filtro se
  limpia al cambiar de categoría y al agregar una palabra.
- **Pares ✅/❌** → zona `ed-orto-pares-zona`, oculta para `clasificar` (allí no aplica).

Las funciones clave de mapeo cat→clave (`claveBancoCustom`, `claveOcultasOrto`, `bancoDefaultOrto`)
están en `banco.js` y **deben permanecer alineadas** con las claves que lee `ortografia.js`.

## Convenciones del proyecto
- **Idioma**: todo en español (UI, comentarios, nombres de variables y funciones). Mantener tildes/ñ.
- **Tips/pistas**: NO se muestran como banner sobre el ejercicio; se enrutan a la mascota con
  `Juego.tip(texto)` (→ `Luna.tip`), que los "sugiere" en su globo. Los modos dejan vacíos los
  elementos de regla/pista (`#…-tema`, `#orto-regla`, `#orto-pista`), que el CSS oculta con `:empty`.
- **Zona de adultos**: la clave (**24861793**) se pide en un **modal del menú** (`Menu.pedirClave(destino)`);
  `editor.html` (⚙️ Ajustes) y `contenido.html` (📚 Banco de contenido) solo entran con el permiso de
  sesión (`sessionStorage ads_editor_ok`) y, sin él, rebotan al menú sin mostrar nada. No usar `window.prompt`.
- **Sin dependencias** salvo three.js (copia local en `lib/`). No introducir build tools ni paquetes npm.
- **Marcador honesto**: en el motor `Actividad` una ronda cuenta como acierto solo si salió **a la primera**
  (sin `ctrl.reintento`). Al terminar una ronda NO se vuelve solo al selector: `Juego.botonesFin(...)` deja
  "🔁 Otra ronda" y "↩️ Elegir otra". El temporizador se pide con `Juego.tiempo(factor)` (las operaciones
  escritas reciben más tiempo que una opción múltiple).
- **Aceptar por texto, no por posición**: `Arrastrar.emparejar` y `Arrastrar.ordenar` comparan textos (dos
  fichas iguales son intercambiables; dos izquierdas pueden compartir la misma derecha).
- **Compatibilidad `file://`**: nada de `fetch` a archivos locales, módulos ES, ni rutas absolutas.
- **Bancos de palabras**: español de Ecuador, vocabulario apropiado para ~9 años. Nombre del niño: Nelson.
- Claves de `localStorage` (todas con prefijo real `ads_` que añade `Juego.guardar/cargar`):
  - `orto_pal_<id>` — palabras propias para categorías de letra/hache/lly.
  - `orto_pal_tildes` — palabras propias con tilde (categoría `tildes`).
  - `orto_prop_mayusculas` / `orto_com_mayusculas` — propias para mayúsculas (propios/comunes).
  - `orto_clas_<id>_<clase>` — palabras propias de categorías de clasificación.
  - `orto_pares_<id>` — pares ✅/❌ definidos por el adulto.
  - `orto_ocultas_<id>` (y `_<grupo>` en mayúsculas/clasificar) — palabras del juego ocultadas.
  - `secuencias_propias`, `parrafos_propios`, `config` — banco/ajustes **compartidos** (no por perfil).
  - **Perfiles**: `perfiles` (lista `[{id,nombre,genero,avatar,generoMascota,nivel,grado,trimestre}]`), `perfil_activo` (id).
  - **Por perfil**: `estado__<id>` (estrellas/racha/nivel) y `lb_<juego>__<id>` (leaderboard, top-5).
  - Heredadas (un solo perfil, fallback): `jugador`, `avatar`, `genero`, `estado`.
- **Importante**: las claves de "custom" y "ocultas" están duplicadas entre `banco.js` (escribe) y
  `ortografia.js` (`quitarOcultas`, `extras`, generadores; lee). Si cambias una convención de clave,
  cámbiala en AMBOS archivos.
- Al cambiar categorías/contenido, recordar que `Ortografia.pintarSelector()` y `BancoContenido` re-leen `DATOS`.

## Git
- Remoto `origin`: https://github.com/rolansor/aventura_escolar.git — rama principal `main`. Identidad local:
  rolansor / rolansor@hotmail.com.
- Se trabaja directo sobre `main` (un solo desarrollador). **Commit y push solo cuando el usuario lo pida.**
- Los `data/**/*.js` generados SÍ se versionan (para que el doble clic funcione sin pasos). Las fuentes de
  los mapas están en `recursos/` (`ecuador_1.0.svg`, `ecuador_2.0.svg`, `gadm41_ECU_2.json`).

## Modelos 3D y dibujos (leer antes de tocar gráficos)
- **Escenario** `src/efectos/modelo3d.js` (`Modelo3D`): canvas three.js dentro de la caja de juego. Da luces,
  sombra de contacto, **encuadre automático** (proyecta la caja del modelo en los giros permitidos),
  giro con el dedo, `alTocar(id, cerca)` con **tolerancia** para dedos pequeños, `resaltar(id, "ok"|"mal")`,
  `etiquetar(id, texto)`, `anclar(el, id, {abajo})` (elementos DOM que siguen a un punto del modelo),
  `parteEn(x, y)` (para soltar fichas encima) y `destruir()`.
- **Modelos** en `src/efectos/modelos/<nombre>.js`, construidos **por código** (nada de `.glb`: `file://` no
  deja cargarlos) con los ayudantes `api.tubo` (tallos, raíces), `api.lamina` (hojas/pétalos curvos),
  `api.torno`, `api.mat` y `api.parte(obj, id)`. Devuelven `{ objeto, animar(t,dt), limites, vista, anclas,
  forma: "vertical"|"ancha"|"cuadrada", … }`. El escenario solo toca la **escala** de la raíz de cada parte.
- **Uso desde una actividad**: se crea una vez por tema y se reutiliza entre rondas con `ctrl.memo`;
  `ctrl.alTerminar(() => m.destruir())` lo libera. **Siempre con respaldo**: si `Modelo3D.disponible(n)` es
  falso (sin WebGL) se usa el SVG / el dibujo 2D.
- **Dónde se usa**: `senala` (planta y flor), `clasificar` con `dibujo` (plantas: soltar el trabajo sobre la
  parte), `escena` con `modelo` (ciclo del agua), `valorposicional` (bloques) y `fracciones` (pizza/barra).
- **Dibujos SVG** de "Señala la parte" en `recursos/senala/*.svg` (planta, flor, cuerpo, cara, órganos),
  incrustados con `{"$archivo": …}`. Partes = `<g data-parte="id">`. Animaciones por clase CSS: `late`
  (corazón), `respira` (pulmones), `parpadea` (ojos). El de órganos también es destino de fichas en
  `cuerpo` → "¿Para qué sirve?".
- **Páginas**: la que use un modelo carga `src/efectos/modelo3d.js` y su `src/efectos/modelos/<n>.js`
  después de `luna.js` (ver `paginas/senala.html`).

## Pruebas y validación
- `python herramientas/validar.py` — contenido: respuestas fuera de las opciones, palabras en dos cestas,
  casillas que regalan la respuesta, partes sin dibujo, ortografía sin la letra de su categoría, cantones
  mal escritos, plan de trimestres incoherente (`revisar_curriculo`), `.js` sin regenerar. **Debe dar
  0 errores.**
- `python herramientas/humo.py [--todos] [--nivel X] [página…]` — abre cada página en Chrome/Edge sin
  ventana (perfil temporal: no toca el progreso real), entra varias veces a cada tema y reporta errores de
  JavaScript, rondas vacías y actividades que no caben en pantalla. Antes recorre el inicio (grado →
  trimestres → materias, y el mapa conceptual). **Debe dar 0 errores.** No corras dos `humo.py` a la
  vez: con la máquina cargada aparecen falsos "no pintó ningún tema".
- `herramientas/cdp.py` — cliente mínimo de DevTools (solo librería estándar) para escribir más pruebas:
  `c.js(...)`, `c.shot(...)`, `c.clic(x, y)`, `c.arrastrar(a, b)`, `c.movil()`.
- Ojo: `Actividad.ronda()` atrapa los errores de una ronda para no trabar el juego, pero los escribe con
  `console.error` (así `humo.py` los ve).
- **Ortografía**: el generador no propone como "mal escrita" una palabra que también existe (casa/caza,
  vaca/baca, hola/ola, pollo/poyo…): ver `HOMOFONAS` y `huecos()` en `ortografia.js`. El Banco de contenido
  valida con `Ortografia.sirve(cat, palabra)` antes de guardar una palabra propia.

## Estado y pendientes
**Hecho (lo más reciente primero):**
- **Segundo trimestre de Quinto (oct-2026)**, según el Classroom del colegio: geometría (rectas, ángulos con
  graduador, cuadriláteros, perímetro), multiplicación (hasta 3 cifras, términos y propiedades), concurso de
  vocabulario, la vida de las plantas, señoríos/Incas/Conquista y ríos/gente. Ver "Segundo trimestre de
  Quinto".
- **Grado y trimestre (oct-2026)**: al entrar se elige el grado (1.º–7.º; solo 5.º está listo) y el
  trimestre; el plan de `data/curriculo.json` filtra materias y actividades. Ayudita con mapa conceptual.
- **Revisión general (oct-2026): errores + gráficos.** *Errores:* parejas y órdenes aceptados por texto,
  concordancia "¿Dónde están…?", casillas del ciclo del agua sin la respuesta escrita, ortografía sin
  homófonos, nombres de cantones corregidos (221), mascota que ya no tapa el ejercicio, todo cabe en una
  laptop de 768 px, división que avisa si falta el residuo, marcador "a la primera", verdadero/falso
  equilibrado, leaderboard en todas las actividades, temporizador por tipo de pregunta, fin de ronda con
  botones, dictado alineado palabra por palabra, three.js local. *Gráficos:* escenario `Modelo3D` con planta,
  flor, ciclo del agua, bloques base 10 y pizza/barra; ilustraciones SVG animadas de cuerpo, cara y órganos;
  mascota nueva; dinero dibujado. *Herramientas:* `validar.py`, `humo.py` y `cdp.py`.
- **Antes:** Inglés (El ahorcado), Ciencias y Sociales del Taller 1 de Quinto, 11 actividades de Lengua,
  términos y problemas de Matemática, perfiles + niveles + leaderboard, "Corregir y Dictado", editor
  universal de ortografía, y los mapas de provincias y cantones. Todo eso migró del código a los JSON del
  runner.

**Pendiente:**
- **2.º trimestre:** Lengua (sustantivos concretos/abstractos y contables/incontables, artículos, adjetivos,
  tipos de texto, paratextos), Inglés (pasado con -ed) y un tangram. Confirmar con el cuaderno cómo llama la
  profesora a las propiedades de la multiplicación (se usó "elemento neutro" y "elemento absorbente"; podrían
  ser "modulativa" y "anulativa") y unificar la grafía "Cápac Ñan" (`epoca`, `quiz`) / "Qhapaq Ñan" (`incas`).
- **3.er trimestre:** armarlo cuando el colegio publique sus talleres (volver a leer el Classroom).
- **Otros grados** (1.º–4.º, 6.º y 7.º): en construcción; hoy no tienen plan ni contenido.
- Sin nivel de dificultad propio: Ortografía y La hora (esta se gradúa por temas).
- En celular, el modelo 3D de bloques con 4 columnas se ve pequeño.
- **Mapas:** de-duplicar las tablas `PROVINCIAS` / `DET`. Ideas del usuario para más adelante: capas de
  hidrografía y orografía, historia, platos típicos, y cambios históricos del mapa.
