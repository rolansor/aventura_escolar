# CLAUDE.md — La Aventura de Nelson

Juego educativo (Lengua, Matemáticas, Estudios Sociales) en **HTML/CSS/JavaScript vanilla + three.js**.
Para un niño de ~9 años, en **español de Ecuador**. Sin framework ni npm. **Estructura modular**
(ver `docs/ARQUITECTURA.md`): un HTML por módulo en `paginas/`, lógica en `src/`, datos en `data/`,
CSS en `css/modulos/`. Funciona **con doble clic** (`index.html`) **y servido**.
**Arquitectura de contenido (NUEVA — leer antes de tocar actividades).** El contenido de casi todas las
actividades vive ahora en **`data/contenido/<modo>.json`** y lo consume un **runner genérico**
`src/core/contenido.js` (`Contenido.montar("<modo>")` lee `DATOS.contenido[<modo>]` y arma las rondas según
el `tipo` de cada tema: clasificar/emparejar/ordenar/silabas/alfabetico/vf/definir/sujeto/signos/formas/
escena/senala, y motor `mc`: mc/lectura). **Ya NO hay un `src/modos/<modo>.js` por actividad de banco** (se
eliminaron; su lógica está en el runner). Cada `paginas/<modo>.html` carga su JSON + `datos.js` + el motor +
`contenido.js` y arranca con `Datos.cargar(["contenido/<modo>"]).then(() => Contenido.montar("<modo>").init())`.
Esquema completo, tipos y excepciones: **`docs/ESQUEMA_CONTENIDO.md`**. Organización de `data/`: **`data/README.md`**.
Excepciones que conservan su loader propio: **ortografia** y **copia** (`data/ortografia.json`/`parrafos.json`),
**quiz** (geografía desde `DATOS.mapas` + bancos de texto en `data/contenido/quiz.json`), **mapas/cantones/
donde** (geometría en `data/mapas/*` y `data/cantones.js`) y **Matemáticas** (generan los problemas).

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
| `data/*.json` (+ `*.js` generados por `build.py`) | `DATOS.*`, `NINO`, `ECUADOR_SVG`, `ECUADOR_CANTONES` | **Datos** (ver `data/README.md`): **`data/contenido/<modo>.json`** (contenido de actividades, lo usa el runner), **`data/mapas/*`** (geografía: provincias, regiones, detalle, cantones, mapa-ec), y de sistema/loader propio (materias, nino, ortografia, parrafos, generador-parrafos, secuencias). Editar el `.json` y correr `herramientas/build.py`. |
| `src/core/juego.js` | `Juego` | Núcleo: marcador, sonido, `localStorage`, temporizador, utilidades (`azar/azarEl/mezclar/cargar/guardar/frasePositiva/construirSecuencia`, `acierto/error/granPremio`, `cron*`, `jugador`, `aplicarIdentidad`) e `iniciarBase()`. **Perfiles** (`perfiles/perfilActivo/crearPerfil/seleccionarPerfil/actualizarPerfil/borrarPerfil`), **nivel de dificultad** (`nivel/nivelIdx/porNivel`), **curso** (`curso/fijarCurso`: grado y trimestre recordados en el perfil) y **leaderboard** (`registrarResultado/mejores/fmtTiempo/tablaMejoresHTML`). Ver "Perfiles, Niveles y Leaderboard". |
| `src/core/perfiles.js` | `Perfiles` | **Selector de perfiles** (solo en `index.html`): pantalla `pantalla-perfiles` con una tarjeta por niño (botones **✏️ editar** y **🗑️ borrar**) + "➕ Nuevo perfil". El modal `abrirForm(perfil?)` sirve para **crear y editar** (nombre del niño, **sexo del niño** = `genero` —emoji 👧/👦 de su tarjeta—, **nombre de la mascota** = `avatar` —por defecto "Perchita"—, **sexo de la mascota** = `generoMascota` —construye a la mascota niña/niño— y nivel; precarga al editar y guarda con `Juego.actualizarPerfil`, que aplica la identidad en vivo a la mascota). **Valida** ambos nombres con `validarNombre` (solo letras, sin números/símbolos/groserías; listas `SOECES_PALABRA`/`SOECES_FUERTE`). Chip de perfil en la barra para cambiar. `Perfiles.init/abrir/actualizarChip`. |
| `src/core/datos.js` | `Datos` | `Datos.cargar([...])` lee `window.__DATOS__` y rellena los globales. |
| `src/core/curriculo.js` | `Curriculo` | **Grados, trimestres y plan** (solo en `index.html`): lee `DATOS.curriculo` (`data/curriculo.json`). `grados()/trimestres()/grado(id)/trimestre(id)/disponible(g)/porDefecto()`, `materias(gradoId, triId)` (las materias del catálogo, cada una SOLO con las actividades de su plan) y `abrirMapa(gradoId, alIr)` (la "ayudita": mapa conceptual grado → trimestres → materias → actividades). Ver "Grado y trimestre". |
| `src/core/menu.js` | `Menu` | Menú del índice en 3 sub-pantallas: **grado + trimestre** (`pantalla-curso`), **materias** del trimestre (`pantalla-menu`) y **actividades** (`pantalla-materia`); las tarjetas salen de `Curriculo.materias(...)` y enlazan a `paginas/<modo>.html`. **Modal de clave** (`pedirClave(destino)`) que se abre ANTES de ir a la zona de adultos; sin clave válida no se navega. Dos tarjetas de adultos: **⚙️ Ajustes** (`editor.html`) y **📚 Banco de contenido** (`contenido.html`). |
| `src/core/mc.js` | `MC` | Motor de **opción múltiple** (repasos rápidos). Fábrica `MC(px, temas)`; ronda de 10. Al terminar registra el resultado en el leaderboard (`Juego.registrarResultado(px,…)`). **No es el patrón por defecto** (ver Filosofía de diseño). |
| `src/core/actividad.js` | `Actividad` | Motor de **actividades manipulativas** (hermano de `MC`). Fábrica `Actividad(px, temas, opts)`; cada tema tiene `ronda(host, ctrl)` que arma la interacción en `#<px>-extra` y resuelve con `ctrl.ganar()/fallar()/reintento()`. Sin temporizador (autocorrectivo). Al terminar registra el leaderboard. Reutiliza la misma estructura de página por prefijo que `MC`. |
| `src/core/arrastrar.js` | `Arrastrar` | Arrastrar-y-soltar con eventos de **puntero** (mouse + dedo). `Arrastrar.hacer(item, zonas, alSoltar)` (marca `.zona-hover`, devuelve la zona destino o null) y `Arrastrar.clasificar(host, ctrl, {pregunta, cestas, items})` (actividad "clasifica en cestas"). Además dos ayudantes de **toque** para `ronda()` de `Actividad`: `Arrastrar.emparejar(host, ctrl, {pregunta, pares:[{a,b}]})` (une parejas: toca izquierda→derecha; CSS `.emp-*`) y `Arrastrar.ordenar(host, ctrl, {pregunta, correcto:[...]})` (toca fichas en orden; CSS `.ord-*`). |
| `src/core/contenido.js` | `Contenido` | **Runner genérico de contenido**. `Contenido.montar("<modo>")` lee `DATOS.contenido[<modo>]` (de `data/contenido/<modo>.json`) y arma las rondas según el `tipo` de cada tema (clasificar/emparejar/ordenar/silabas/alfabetico/vf/definir/sujeto/signos/formas/escena/senala/problema/terminos/**ahorcado**; motor `mc`: mc/lectura), devolviendo un `Actividad`/`MC`. Incluye el helper de **voz en inglés** (`hablarEn`, Web Speech API) que usa el ahorcado. Centraliza la lógica que antes estaba en cada `src/modos/*.js`. Ver `docs/ESQUEMA_CONTENIDO.md`. |
| `data/contenido/<modo>.json` | `DATOS.contenido[<modo>]` | **Contenido de ~25 actividades migradas** (Lengua: clases, familia, sinonimos, refranes, ordena, alfabetico, silabas, sujeto, signos, formas, lectura; Ciencias: animales, invertebrados, cuidafauna, plantas, cuerpo, materia, ambiente, cicloagua, senala; Sociales: epoca, regiones; Mate: problemas, terminos; Inglés: ahorcado). **Ya NO tienen `src/modos/*.js`** (su lógica vive en el runner). Editar el JSON + `build.py`. |
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
| `recursos/ecuador_1.0/2.0.svg`, `recursos/banderas/EC-*.svg` | — | SVG original/horneado + banderas provinciales. |
| `paginas/*.html` | — | Una por módulo; incluye sus `data/*.js`, core, su modo, y arranca con `Datos.cargar(...).then(() => { Juego.iniciarBase(); Modo.init(); })`. |

`Juego` (en `src/core/juego.js`) es la API compartida. **Las secciones de abajo describen la LÓGICA de
cada modo** (sigue igual; solo cambió la ubicación: `js/X.js` → `src/modos/X.js`, y los datos a `data/`).

## Navegación por materias
El menú está organizado en **materias** (asignaturas). Definidas en `DATOS.materias` (`datos.js`):
```js
{ id, icono, nombre, desc,
  actividades: [ { modo, icono, nombre, desc }, ... ] }  // modo = pantalla existente
```
`DATOS.materias` es el **catálogo** (cada actividad se define UNA vez). Qué se ve en cada grado y
trimestre lo decide el **plan** de `data/curriculo.json` (ver "Grado y trimestre").
Del **segundo trimestre** (ver "Segundo trimestre de Quinto"): Lengua `vocabulario`; Matemáticas `rectas`,
`cuadrilateros`, `propmult`; Sociales `incas`, `riosygente`; Ciencias `vidaplantas`.
Materias actuales: **Lengua** (ortografia, copia, **clases, familia, sinonimos, formas, silabas,
ordena, sujeto, signos, alfabetico, lectura, refranes**), **Matemáticas** (secuencias, aritmetica/tablas/
multiplicacion/division/comparar/redondeo/numeros/valorposicional/dinero/medidas/hora/fracciones),
**Estudios Sociales** (**epoca, regiones**, `mapas`, `cantones`, `quiz`, `donde`), **Ciencias Naturales**
(senala, plantas, cuerpo, **animales, invertebrados, cuidafauna**, cicloagua, materia, ambiente),
**Inglés** (**ahorcado**).

### Segundo trimestre de Quinto (NUEVO — sacado del Classroom del colegio)
El 2.º trimestre va del 20-jul a mediados de octubre. Su plan (`"2"` en `data/curriculo.json`) **repite**
actividades que ya existían y calzan (Lengua: clases, sinonimos, lectura; Mate: tablas, multiplicacion;
Ciencias: plantas, senala, ambiente) y añade estas nuevas:
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
  y absorbente), completa la igualdad (`formas`), V/F y definiciones. `multiplicacion` ahora llega a
  3 cifras en el multiplicador en todos los niveles.
- **vocabulario** — "Concurso de vocabulario" (Lengua, runner, px `voc`): las **40 palabras del banco del
  colegio** (10 por materia) con su significado (`definir`), sinónimo y antónimo (`emparejar`) y escritura
  (`signos`: la letra o tilde que falta). El JSON se generó desde una tabla; si el colegio cambia el
  banco, se edita `data/contenido/vocabulario.json`.
- **vidaplantas** — "La vida de las plantas" (Ciencias, runner, px `vpl`): plantas con y sin semilla,
  musgo y helecho, fotosíntesis/respiración/nutrición, de la flor al fruto, polinizadores, partes de la
  hoja, ecosistemas (productores/consumidores/descomponedores, clases) y adaptaciones.
- **incas** — "Señoríos, Incas y Conquista" y **riosygente** — "Ríos y gente del Ecuador" (Sociales,
  runner, px `inca` / `ryg`): periodización aborigen, señoríos étnicos, trueque, Imperio Inca, Atahualpa
  y Huáscar, Conquista; vertientes y ríos, usos del agua y diversidad de la población.
Inglés aún no tiene nada del 2.º trimestre (verbos regulares en pasado): en el mapa sale con 💤.

### Inglés — módulo nuevo (materia `ingles`)
Primera actividad: **El ahorcado** (`ahorcado`, px `ahor`, `data/contenido/ahorcado.json`, tipo nuevo
`ahorcado` en el runner). Dos temas: **🍎 Fruits** (frutas comunes) y **🇪🇨 Fruits of Ecuador** (guineo,
verde, uvilla, tomate de árbol, guanábana, pitahaya…). El niño adivina la palabra **en inglés** tocando
letras (o con el teclado real de la compu); la pista es el **emoji grande + la traducción al español de
Ecuador** (en avanzado del tema 1 se oculta la traducción). Cada fallo dibuja una parte del monigote y
quita un ❤️ (6 vidas); en básico se regalan 2 letras, 1 en intermedio y 0 en avanzado (`pistas`). Al
terminar la ronda, la **voz del navegador pronuncia la palabra en inglés** (Web Speech API, `en-US`,
con botón 🔊 para repetir; si no hay voz, no pasa nada). Estilos `.ahor-*` en `ejercicios.css`.
Para añadir frutas/temas: editar el JSON + `python herramientas/build.py`.

### Ciencias Naturales — adaptación al Taller 1 de Quinto ("Animales")
Todo manipulativo (`Actividad`+`Arrastrar`), catálogo INLINE por 3 niveles (`Juego.nivelIdx()`/`porNivel`):
- **animales** (`Animales`, px "ani") — temas de clasificar (vertebrado/invertebrado, grupos de vertebrados,
  alimentación, cómo nacen ovíparo/vivíparo/ovovivíparo, respiración) **+ temas de CONCEPTO**: **🤔 ¿Verdadero
  o falso?** y **📖 ¿Qué es cada cosa?** (definición con opciones). Así no es solo categorizar: también se
  estudia *qué es* cada cosa (p. ej. "los vivíparos nacen del vientre, no de huevos").
- **invertebrados** (`Invertebrados`, px "inv") — reescrito según el *Manual*: clasificar los 6 grupos y sus
  **subclasificaciones** (artrópodos→insecto/arácnido/crustáceo/miriápodo; moluscos→gasterópodo/bivalvo/
  cefalópodo; gusanos→anélido/platelminto/nemátodo), **con/sin patas**, **respiración**, **hábitat** y
  **reproducción** — **+ temas de CONCEPTO** (¿verdadero o falso? y ¿qué es cada cosa?). Las rondas de
  concepto (`rondaVF`/`rondaDef`) se construyen en la propia `ronda()` con botones `.ord-chip`.
- **cuidafauna** (`CuidaFauna`, px "fauna") — NUEVO: **Animales en peligro** (empareja animal amenazado↔región
  del Ecuador) y **¿Ayuda o daña?** (clasifica acciones por su huella ecológica). → CN.3.1.4, CS.3.3.18.

Mapeo de destrezas: características/clasificación de invertebrados (CN.3.1.1), diversidad y amenazas por
región (CN.3.1.4), reproducción de vertebrados (CN.3.1.6) e invertebrados (CN.3.1.7), huella ecológica (CS.3.3.18).

**Conceptos en TODO Ciencias** (no solo clasificar — ver [[mezclar-conceptos-no-solo-clasificar]]): los módulos
del motor `Actividad` (**plantas, cuerpo, materia, ambiente, cicloagua**, además de animales/invertebrados)
incorporan los temas **🤔 ¿Verdadero o falso?** y **📖 ¿Qué es cada cosa?** (definición con opciones), por 3
niveles (tipos `vf`/`definir` del runner). `senala` es "señalar la parte": planta y flor en **3D**, y
cuerpo, cara y órganos como ilustraciones SVG. En `plantas` y `cuerpo`, el tema de "trabajos" se juega
soltando la ficha **sobre la parte** (planta 3D / dibujo de órganos). `cicloagua` → "Arma el ciclo" es una
**maqueta 3D animada** con casillas "?", y "Estados del agua" es un `clasificar` con contenido por nivel.

### Estudios Sociales — adaptación al Taller 1 de Quinto ("Época Aborigen" + territorio)
Dos módulos nuevos manipulativos (`Actividad` + `Arrastrar`, catálogo INLINE por 3 niveles, página copia
de `epoca.html`, `MODO_VOLVER`→`materia=sociales`) y la ampliación del Quiz:
- **epoca** (`Epoca`) — Historia "Época Aborigen", 4 temas: **¿Cómo llegaron?** (teorías del poblamiento de
  América: Bering/Hrdlička, Polinésica/Rivet, Australiana/Méndez Correa, Autóctona/Ameghino — `emparejar`),
  **Línea de tiempo** (Paleoindio→Formativo→Desarrollo Regional→Integración — `ordenar`), **Sociedades
  agrícolas** (Incipientes→Superiores→Supracomunales→Señoríos étnicos, como cuatro etapas separadas igual
  que en el Taller 2 del colegio; los señoríos entran desde intermedio — `ordenar`), **Pueblos y culturas** (Valdivia, Las
  Vegas, La Tolita, Cañari, Manteño-Huancavilca… — `emparejar`).
- **regiones** (`Regiones`) — Geografía, 3 temas: **Regiones naturales** (Costa/Sierra/Amazonía/Insular —
  `clasificar`), **Relieves** (volcán/río/cordillera/llanura — `clasificar`), **Organización territorial**
  (País→Región→Provincia→Cantón→Parroquia — `ordenar`).
- **quiz** (`src/modos/quiz.js`) — ampliado con 2 temas: **🏺 Época Aborigen** y **🧭 Territorio y relieves**
  (bancos inline `ABORIGEN`/`TERRITORIO`, gens `gAborigen`/`gTerritorio` vía el helper `pregunta()` que
  garantiza `correcta ∈ opciones`; registrados en `GEN`, `GEN.mixto` y `TEMAS`).

### Lengua — actividades manipulativas (todas con catálogo INLINE por 3 niveles vía `Juego.nivelIdx()`)
Cada una es un `Actividad("px", …)` (o `MC` para lectura) con su `paginas/<modo>.html` (copia del patrón
de `clases.html`) y su contenido en el propio módulo (sin `data/*.json`). Heredan leaderboard y niveles.
- **clases** (`Clases`) — Clases de palabras: arrastra a su grupo gramatical (sustantivo/adjetivo/verbo,
  +artículo, +pronombre/adverbio según nivel). `Arrastrar.clasificar`.
- **familia** (`Familia`) — Familias de palabras (derivadas a su raíz). `Arrastrar.clasificar`.
- **sinonimos** (`Sinonimos`) — Sinónimos y antónimos (2 temas). `Arrastrar.emparejar`.
- **refranes** (`Refranes`) — Refranes y adivinanzas (2 temas, une mitades). `Arrastrar.emparejar`.
- **ordena** (`Ordena`) — Ordena la oración. `Arrastrar.ordenar`.
- **alfabetico** (`Alfabetico`) — Orden alfabético (sort tolerante a tildes). `Arrastrar.ordenar`.
- **silabas** (`Silabas`) — Separa en sílabas (banco separado a mano). `Arrastrar.ordenar`.
- **sujeto** (`Sujeto`) — Sujeto y predicado: toca dónde empieza el predicado (`corte` etiquetado a mano).
- **signos** (`Signos`) — Pon el signo: toca el signo del hueco ▢ (CSS `.signo-*`).
- **formas** (`Formas`) — Cambia la palabra: diminutivos/aumentativos/género-número (3 temas, toca la forma).
- **lectura** (`Lectura`) — Comprensión lectora: texto + preguntas (motor `MC`; `html`=texto, banco por nivel).

**Antes del menú va el selector de perfiles** (`index.html`): al abrir, si no hay perfil activo se
muestra `pantalla-perfiles`; al elegir uno se entra al menú. Ver "Perfiles, Niveles y Leaderboard".

Flujo de pantallas del índice (`src/core/menu.js`): `pantalla-perfiles` (si no hay perfil) →
`pantalla-curso` (grado + trimestre) → `pantalla-menu` (materias de ese trimestre + las dos tarjetas de
adultos) → `pantalla-materia` (actividades) → `paginas/<modo>.html`. El botón ↩️ sube un nivel y 🏠
vuelve a `pantalla-curso`. Al regresar de una actividad (`index.html?materia=<id>`) se abre esa materia
en el curso recordado.

### Grado y trimestre (NUEVO — `data/curriculo.json` + `src/core/curriculo.js`)
Lo primero que se elige al entrar. `data/curriculo.json` tiene:
```js
{ trimestres: [ { id: 1, icono, nombre, corto }, ... ],
  grados: [ { id: "5", numero: "5.º", nombre: "Quinto de básica",
              plan: { "1": { lengua: ["ortografia", ...], matematicas: [...], ... }, "2": {...}, "3": {...} } },
            { id: "1", numero: "1.º", nombre: "Primero de básica" }, ... ] }   // sin `plan` = en construcción
```
- **Grados** 1.º a 7.º de básica; solo **5.º** tiene `plan`. Los demás salen con el cartel
  "🚧 En construcción" (se pueden tocar: muestran el aviso en vez de los trimestres).
- **Plan** = por trimestre y por materia, la lista de `modo` del catálogo, en el orden en que se muestran.
  Una actividad puede estar en **varios** trimestres (se repite) o en **uno** solo; una materia que no
  aparece en un trimestre no sale en su menú. **Para mover/repetir algo: editar el plan + `build.py`.**
  **Hoy TODO el contenido de 5.º es del primer trimestre** (decisión del usuario): el plan solo tiene `"1"`.
  Un trimestre sin plan sale "🚧 En construcción" (tarjeta y columna del mapa) y no se puede entrar.
- **Curso recordado**: `Juego.curso()` → `{grado, trimestre}` y `Juego.fijarCurso(g, t)`; se guarda en el
  propio perfil (campos `grado`/`trimestre`), y sin perfil en la clave suelta `curso`. La tarjeta del
  trimestre donde se quedó el niño lleva "📌 Estabas aquí".
- **Ayudita** (`Curriculo.abrirMapa`, botón "🗺️ ¿Qué hay en cada trimestre?" en `pantalla-curso` y
  `pantalla-menu`): **mapa conceptual** con el grado arriba, una columna por trimestre y una fila por
  materia (alineadas entre columnas, un color por materia). Tocar una materia abre sus actividades en los
  tres trimestres a la vez (🔁 = se repite en otro trimestre, ⭐ = solo en ese, 💤 = la materia no toca);
  "👁️ Ver todo" abre todas. Tocar un trimestre entra a él; tocar una actividad la abre. CSS `.curso-*`
  y `.cmapa-*` en `menu.css`.
- `validar.py` (`revisar_curriculo`) falla si el plan nombra una materia/actividad que no existe o si una
  actividad del catálogo **no está en ningún trimestre** (no se podría abrir desde el menú).

**Para añadir una actividad nueva** (modelo multipágina): crea `paginas/<modo>.html` (copiando una
página del mismo motor, p.ej. `animales.html` para `Actividad`) y `src/modos/<modo>.js`; añade el modo
al mapa `PAGINA` de `src/core/menu.js`; regístralo en las `actividades` de su materia en
`data/materias.json`, **ponlo en el plan de al menos un trimestre en `data/curriculo.json`** y corre
`python herramientas/build.py`. El menú y el submenú se pintan solos.
Ejemplo reciente: **`invertebrados`** (ver fila en la tabla). El leaderboard se hereda gratis si el
modo usa los motores `MC`/`Actividad`.

## Perfiles, Niveles y Leaderboard
**Perfiles** (`src/core/perfiles.js` + API en `juego.js`): cada niño tiene su perfil
`{ id, nombre, genero, avatar, generoMascota, nivel }` en `localStorage` (`perfiles` = lista,
`perfil_activo` = id). **`genero`** es el sexo del PARTICIPANTE (decide su emoji 👧/👦) y **`generoMascota`**
el de la MASCOTA (decide la figura de Perchita); en perfiles antiguos `generoMascota` cae a `genero`. El
formulario **valida** ambos nombres (niño y mascota) con `validarNombre` (solo letras/tildes/ñ, sin números,
símbolos ni groserías). La **identidad** (`jugador/avatarNombre/genero/generoMascota`) y el **nivel** se leen
SIEMPRE del perfil activo (con fallback a `NINO`/"Perchita"/"nina"/"basico" si no hay perfil, para no romper
el doble-clic en páginas sueltas). El **progreso** (`estado`: estrellas/racha/nivel) es por perfil, en clave `estado__<id>`. El
selector vive solo en `index.html`; un chip en la barra permite cambiar de perfil. **El contenido
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

## Modo Mapas — mapa del Ecuador (Estudios Sociales)
Mapa interactivo SVG de las 24 provincias, coloreadas por las 4 regiones naturales
(Costa, Sierra, Amazonía, Región Insular/Galápagos). Es **explorable** (sin puntaje aún).
- **Hover** sobre una provincia → tooltip flotante (tarjeta blanca) con la **bandera** de la provincia
  (`<img src="recursos/banderas/<ISO>.svg">`, clase `.tt-bandera`) + nombre/región/capital.
  Hover sobre un chip de la leyenda → resalta esa región y atenúa las demás (`elemReg`).
- **Clic simple** → la provincia "salta" en 3D (CSS `.pop`: scale 1.16 + drop-shadow).
- **Banderas**: las 24 SVG están en `recursos/banderas/<ISO>.svg`, descargadas de Wikimedia
  (List of Ecuadorian flags) con `Invoke-WebRequest`. Guayas usa la de Guayaquil. Para re-bajar:
  parsear los `upload.wikimedia.org/...Bandera_Provincia_*.svg` de la página y quitar `/thumb/`.
  Nombres en `recursos/banderas/README.md`.
- **Doble clic** → zoom animado del `viewBox` (tween rAF, `easeInOut`) a esa provincia y panel
  lateral `#mapa-detalle` con un **slider** de info estructurada IGUAL para todas (Identidad:
  capital/región/provincialización/gentilicio · Cantones · Dato curioso). Datos en `DET` (clave ISO).
- **Galápagos junto al continente + viewBox recortado**: están **horneados en el SVG**
  (`recursos/ecuador_2.0.svg`), no en runtime. Se generó con un script Python que parsea los `path`
  (solo usan `M`/`m`/`l`/`z`, sin curvas), calcula bbox exactas, mueve Galápagos cambiando **solo su
  `M` inicial** (el resto es relativo, así se traslada toda la isla) y fija el `viewBox` al contenido.
  Por eso `mapas.js` ya no ajusta nada al mostrar y el zoom usa `getBBox()` directo.

- **Geometría intercambiable**: `mapas.js` NO contiene coordenadas. Inyecta `window.ECUADOR_SVG`
  (de `mapadata.js`) y, sobre el SVG resultante, recorre `path/polygon`, identifica cada provincia
  por su nombre o código ISO (`provinciaDe` busca de forma tolerante en `id/name/data-name/class/
  <title>` del elemento y su `<g>` padre, normalizando con `norm()` — sin tildes, espacios ni guiones),
  la colorea por región y le agrega el clic.
- **Metadatos** (las 24 provincias con ISO `EC-*`, región y capital) viven en `PROVINCIAS` dentro de
  `mapas.js`. Galápagos = `EC-W`, región `insular`.
- **Origen del SVG (ya integrado)**: descargado de simplemaps.com/svg/country/ec, guardado como
  `recursos/ecuador_1.0.svg` (original). La versión horneada es `recursos/ecuador_2.0.svg`. Para
  embeberlo SIN romper el offline (`file://` no permite `fetch`), se envuelve como texto en
  `mapadata.js` con `ConvertTo-Json` (escapa comillas/saltos/backslashes):
  ```pwsh
  $svg = Get-Content -Raw .\recursos\ecuador_2.0.svg
  Set-Content .\js\mapadata.js ("window.ECUADOR_SVG = " + ($svg | ConvertTo-Json) + ";") -Encoding utf8
  ```
  Para re-posicionar Galápagos / re-recortar: hay un script Python (en el historial del chat) que
  parsea `recursos/ecuador_1.0.svg`, mueve Galápagos y reescribe `recursos/ecuador_2.0.svg`.
- Navegación: modo `mapas` → `pantalla-mapas`; registrado en `irAModo`, en `PANTALLAS_MODO` (Volver
  regresa al submenú de Sociales) y arrancado en `iniciar()` con `Mapas.init()`.

### Mapa nuevo (en construcción): base GeoJSON de cantones
Decisión con el usuario: el mapa SVG actual **se queda como está** (extra que funciona), y el mapa
"bueno" se rehace sobre **GeoJSON de cantones** (GADM nivel 2, `gadm41_ECU_2.json`: `NAME_1`=provincia,
`NAME_2`=cantón). Plan: procesar en Python (simplificar geometría, agrupar cantón→provincia→región),
generar `js/cantonesdata.js` compacto, y un módulo nuevo que proyecte a SVG (equirectangular) con
capas regiones/provincias/cantones. Provincias = fusión de cantones por `NAME_1`. Interacciones
deseadas: hover = tarjeta de info, clic = provincia "salta" en 3D, doble clic = panel a la derecha
con slider, mapa más grande. Reutiliza la lógica de `mapas.js`.

## Modo Cantones — mapa GeoJSON (Estudios Sociales, 2ª versión)
Mapa interactivo construido desde **GADM nivel 2** (`gadm41_ECU_2.json`, 223 cantones, 24 provincias).
- **Preproceso (Python + shapely)**: proyecta lng/lat a SVG (equirectangular, `cos(midlat)`), mueve
  Galápagos junto al continente, **disuelve** los cantones de cada provincia (`unary_union`) para el
  borde provincial, simplifica (`simplify`, ~0.4–0.5) y escribe `js/cantonesdata.js`
  (`window.ECUADOR_CANTONES = { viewBox, provincias:[{iso,nombre,region,capital,nCantones,borde,
  cantones:[{nombre,d}]}] }`, ~340 KB). El script vive en el historial del chat (re-ejecutable).
- **Render 2D (`js/mapacantones.js`, global `MapaCantones`)**: cada provincia es **UN** `<path class="prov">`
  (su contorno disuelto `borde`, color por región). SIN cantones ni leyenda (evita líneas raras/slivers).
  **Hover** resalta la provincia (CSS `.mapac .prov:hover`). **Clic** abre el "foco".
- **Foco (vista provincia en 3D)**: oculta el mapa y muestra `#mapac-foco` = canvas 3D (izq) + panel de
  datos (der: bandera, capital, región, provincialización, gentilicio y **lista de cantones**). El 3D usa
  **three.js**: extruye **cada cantón** por separado (`THREE.Shape`→`ExtrudeGeometry`) con su línea de
  borde, agrupados en un `THREE.Group`; color por región, **autogiro + arrastrar para rotar**. **Hover sobre
  un cantón** → raycasting (`R3.ray`/`R3.meshes`, `userData.nombre`) muestra su nombre (`#mapac-canton-label`);
  el autogiro se pausa con el cursor encima. Sin `THREE` (offline), degrada a SVG plano (`fallback2D`).
  `cerrarFoco`/`enFoco` se exponen; el botón Volver global cierra el foco antes de salir.
- Navegación: modo `cantones` → `pantalla-cantones` (IDs `mapac-*`, reutiliza clases `.mapa-*`).
  Registrado en `irAModo`, `PANTALLAS_MODO`, `iniciar()` (`MapaCantones.init()`).
- `gadm41_ECU_2.json` se mantiene en la raíz como fuente (regenerar el data file desde ahí).

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
Dos categorías nuevas con `estrategia: "clasificar"` en `datos.js`:
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
- **Importante**: las claves de "custom" y "ocultas" están duplicadas entre `contenido.js` (escribe) y
  `ortografia.js` (`quitarOcultas`, `extras`, generadores; lee). Si cambias una convención de clave,
  cámbiala en AMBOS archivos.
- Al cambiar categorías/contenido, recordar que `Ortografia.pintarSelector()` y `Contenido` re-leen `DATOS`.

## Git
- Repositorio git activo. Remoto `origin`: https://github.com/rolansor/aventura_escolar.git
- Rama principal: `main`. Identidad local: rolansor / rolansor@hotmail.com.
- El archivo fuente `ec.svg` (mapa de simplemaps) está versionado; `js/mapadata.js` se genera de él.

## Modelos 3D y dibujos (NUEVO — leer antes de tocar gráficos)
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

## Pruebas y validación (NUEVO)
- `python herramientas/validar.py` — contenido: respuestas fuera de las opciones, palabras en dos cestas,
  casillas que regalan la respuesta, partes sin dibujo, ortografía sin la letra de su categoría, cantones
  mal escritos, `.js` sin regenerar. **Debe dar 0 errores.**
- `python herramientas/humo.py [--todos] [--nivel X] [página…]` — abre cada página en Chrome/Edge sin
  ventana (perfil temporal: no toca el progreso real), entra varias veces a cada tema y reporta errores de
  JavaScript, rondas vacías y actividades que no caben en pantalla. **Debe dar 0 errores.**
- `herramientas/cdp.py` — cliente mínimo de DevTools (solo librería estándar) para escribir más pruebas:
  `c.js(...)`, `c.shot(...)`, `c.clic(x, y)`, `c.arrastrar(a, b)`, `c.movil()`.
- Ojo: `Actividad.ronda()` atrapa los errores de una ronda para no trabar el juego, pero los escribe con
  `console.error` (así `humo.py` los ve).
- **Ortografía**: el generador no propone como "mal escrita" una palabra que también existe (casa/caza,
  vaca/baca, hola/ola, pollo/poyo…): ver `HOMOFONAS` y `huecos()` en `ortografia.js`. El Banco de contenido
  valida con `Ortografia.sirve(cat, palabra)` antes de guardar una palabra propia.

## Estado / próximos pasos posibles
- Hecho recientemente:
  - **Grado y trimestre (oct-2026).** Al entrar se elige el grado (1.º–7.º de básica; solo 5.º está listo,
    el resto "en construcción") y el trimestre; las materias y actividades se filtran por el plan de
    `data/curriculo.json`. Ayudita con mapa conceptual. Todo lo que existe hoy está en el **primer
    trimestre** y el tercero está "en construcción". **Segundo trimestre armado** con lo que se vio en el
    Classroom del colegio (ver "Segundo trimestre de Quinto"): geometría (rectas, ángulos con graduador,
    cuadriláteros, perímetro), multiplicación (hasta 3 cifras, términos y propiedades), concurso de
    vocabulario, plantas y ecosistemas, señoríos/Incas/Conquista y ríos/gente. Pendiente del 2.º: Lengua
    (sustantivos concretos/abstractos y contables, artículos, adjetivos, tipos de texto, paratextos),
    Inglés (pasado con -ed), un tangram y confirmar con el cuaderno los nombres de las propiedades.
  - **Revisión general (oct-2026): errores + gráficos.** *Errores:* parejas y órdenes aceptados por texto
    (antes se rechazaban respuestas correctas), concordancia "¿Dónde están…?", casillas del ciclo del agua
    sin la respuesta escrita, ortografía sin homófonos ni ejercicios rotos, nombres de cantones corregidos
    (221), mascota que ya no tapa el ejercicio, todo cabe en una laptop de 768 px, división que avisa si
    falta el residuo, marcador "a la primera", verdadero/falso equilibrado, leaderboard en Ortografía, Quiz,
    Secuencias y ¿Dónde está?, temporizador por tipo de pregunta, fin de ronda con botones, dictado alineado
    palabra por palabra, three.js local. *Gráficos:* escenario `Modelo3D` con planta, flor, ciclo del agua,
    bloques base 10 y pizza/barra; ilustraciones SVG animadas de cuerpo, cara y órganos; mascota nueva;
    dinero dibujado; mapa 3D de provincias en relieve. *Herramientas:* `validar.py` y `humo.py`.
  - Siguen sin nivel de dificultad propio: Ortografía y La hora (esta se gradúa por temas).
  - **Materia nueva: Inglés** con su primer juego, **El ahorcado de las frutas** (tipo `ahorcado` en el
    runner + `data/contenido/ahorcado.json`, temas *Fruits* y *Fruits of Ecuador*, vocabulario español
    del Ecuador: guineo, verde, uvilla, limón sutil, tomate riñón…). Incluye pronunciación en inglés por
    voz del navegador. (Smoke test happy-dom en el scratchpad del job: monta y juega los 3 niveles.)
  - **Ciencias Naturales alineado al Taller 1 de Quinto (Animales)**: `animales` reescrito (vertebrado/
    invertebrado, grupos, alimentación, reproducción, respiración), `invertebrados` ampliado (reproducción
    sexual/asexual, tipos de artrópodos) y módulo nuevo `cuidafauna` (animales en peligro + huella ecológica).
    (Smoke test happy-dom: `scratchpad/test_ciencias.js`.)
  - **Estudios Sociales alineado al Taller 1 de Quinto (Época Aborigen)**: módulos nuevos `epoca`
    (historia: poblamiento de América y teorías, periodización, sociedades agrícolas, culturas) y
    `regiones` (regiones naturales, relieves, organización territorial), + `quiz` ampliado con temas de
    historia y territorio. (Smoke test happy-dom: `scratchpad/test_sociales.js`.)
  - **11 actividades nuevas de Lengua** (clases, familia, sinónimos, formas, sílabas, ordena, sujeto,
    signos, alfabético, lectura, refranes), todas manipulativas y con catálogo por 3 niveles. Se añadieron
    dos ayudantes reutilizables `Arrastrar.emparejar` y `Arrastrar.ordenar`. (Smoke test real con happy-dom:
    `scratchpad/test_lengua.js` — arrancan y corren sin errores en básico y avanzado.)
  - **Editar perfiles** (✏️ en cada tarjeta del selector), **leaderboard en el selector de cada
    actividad** (`Juego.pintarMejores`), y **rehecho "Copia y Dictado" → "Corregir y Dictado"**: sub-modo
    *Corregir* manipulativo (tocar la palabra mala → mini-modal, dificultad por nivel) y *Dictado* por voz
    (Web Speech API). La mascota ya no saluda con "Nelson" si no hay perfil; buscador dinámico en el banco
    de palabras de ortografía. (Probado headless: `scratchpad/test_copia.js`.)
  - **Perfiles + Niveles + Leaderboard + separación de configuración** (4 fases): selector de perfiles
    al abrir, progreso/identidad/nivel por perfil, dificultad básico/intermedio/avanzado en Matemática,
    marcador por juego y perfil (tiempo + aciertos), y división de la zona de adultos en ⚙️ Ajustes
    (`editor.js`) + 📚 Banco de contenido (`banco.js`). Ver "Perfiles, Niveles y Leaderboard".
  - **Ciencias: "Los invertebrados"** (`invertebrados.js`) — clasificar en los 6 grupos del *Manual*.
  - Pendiente alinear con el temario de **Quinto C** (examen 1-jul): faltan actividades de **"términos
    de la adición y la sustracción"** (sumando/minuendo/sustraendo) y **"problemas de 4 pasos"**.
  - Actividades de **acentuación** (agudas/llanas/esdrújulas/sobresdrújulas) y
    **diptongo/triptongo/hiato** como categorías de Ortografía (tipo `clasificar`).
  - **Reorganización del menú por materias** (Lengua, Matemáticas, Estudios Sociales, Ciencias
    Naturales) con submenú por materia y placeholders "próximamente" para Sociales y Ciencias.
  - **Editor universal de ortografía**: agregar/ocultar/borrar palabras en cualquier categoría y grupo,
    con filtrado real en el generador (`quitarOcultas`). Ver sección "Editor universal" arriba.
  - **Modo Mapas (Sociales)**: andamiaje del mapa interactivo del Ecuador por provincias/regiones/
    capitales (módulo, pantalla, navegación, leyenda, panel de info, CSS). Falta SOLO embeber el SVG
    real (ver "Integración del SVG real"). Decisión tomada: SVG interactivo (no three.js) por ser el
    tool correcto para un mapa político clicable; three.js queda para un futuro relieve 3D.
- Pedido por el usuario para más adelante (sobre el mapa):
  - Integrar el SVG real y verificar Galápagos/Región Insular.
  - Capas y temas: cantones, capitales (quiz "¿dónde está…?"), hidrografía, orografía, historia,
    platos típicos, mapa político vs. cambios históricos del mapa.
  - **Ciencias Naturales**: más sobre invertebrados (subgrupos), plantas y cuerpo humano.
