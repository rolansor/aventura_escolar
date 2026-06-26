# CLAUDE.md — La Aventura de Nelson

Juego educativo (Lengua, Matemáticas, Estudios Sociales) en **HTML/CSS/JavaScript vanilla + three.js**.
Para un niño de ~9 años, en **español de Ecuador**. Sin framework ni npm. **Estructura modular**
(ver `docs/ARQUITECTURA.md`): un HTML por módulo en `paginas/`, lógica en `src/`, datos en `data/`,
CSS en `css/modulos/`. Funciona **con doble clic** (`index.html`) **y servido**.

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

Patrón de referencia ya en el repo: el modo **"Señala la parte"** (`src/modos/senala.js`, SVG clicable)
y **Valor posicional** (bloques base-10) encarnan esto. Al crear un modo nuevo, **parte de la
interacción física**, no del cuestionario. Si caes en opción-múltiple, deja un comentario `// TODO:
volver manipulativo` explicando qué objeto faltaría. El motor `MC` (`src/core/mc.js`) sirve para
*cerrar* repasos rápidos, pero **no debe ser el molde por defecto** de las actividades nuevas.

## Cómo ejecutar / probar
- **Doble clic**: abrir `index.html` (los datos están precompilados en `data/*.js`).
- **Servido**: `python -m http.server` y abrir http://localhost:8000.
- Tras editar JS/CSS recargar con **Ctrl + Shift + R**. Tras editar un `data/*.json`, ejecutar
  `python herramientas/build.py` para regenerar los `data/*.js`.
- **No hay Node** (no `node --check`), pero **sí hay `bun`**: para parse-checkear un módulo sin
  ejecutarlo usar `bun build --no-bundle <archivo.js>` (silencio = OK; imprime el error de sintaxis si
  lo hay). Útil porque servir con 200 NO garantiza que el JS parsee (p. ej. comillas mal anidadas).
- Sí hay **Python** (con `shapely` y `json5` instalados, usados para generar los datos de mapas).
- three.js r128 con copia local en `lib/three.min.js` (el 3D funciona offline).
- Persistencia: **todo en `localStorage`** (progreso, config, contenido del editor).

## Arquitectura
Módulos **IIFE** que exponen globales (`window.X`). **Sin** imports/exports ES, **sin** `fetch`. Los
datos llegan como `<script src="data/<n>.js">` (rellenan `window.__DATOS__`) y `src/core/datos.js`
los coloca en los globales que la lógica espera. Navegación **multipágina**: cada actividad es una
página en `paginas/` que el menú enlaza. Las páginas de `paginas/` usan `<base href="../">`.

| Archivo | Global | Rol |
|---|---|---|
| `data/*.json` (+ `*.js` generados por `build.py`) | `DATOS.*`, `NINO`, `ECUADOR_SVG`, `ECUADOR_CANTONES` | **Datos puros**: ortografia, secuencias, parrafos, generador-parrafos, materias, nino, mapa-ec, cantones, mapas/*. Editar el `.json` y correr `herramientas/build.py`. |
| `src/core/juego.js` | `Juego` | Núcleo: marcador, sonido, `localStorage`, temporizador, utilidades (`azar/azarEl/mezclar/cargar/guardar/frasePositiva/construirSecuencia`, `acierto/error/granPremio`, `cron*`, `jugador`, `aplicarIdentidad`) e `iniciarBase()`. **Perfiles** (`perfiles/perfilActivo/crearPerfil/seleccionarPerfil/actualizarPerfil/borrarPerfil`), **nivel de dificultad** (`nivel/nivelIdx/porNivel`) y **leaderboard** (`registrarResultado/mejores/fmtTiempo/tablaMejoresHTML`). Ver "Perfiles, Niveles y Leaderboard". |
| `src/core/perfiles.js` | `Perfiles` | **Selector de perfiles** (solo en `index.html`): pantalla `pantalla-perfiles` con una tarjeta por niño (botones **✏️ editar** y **🗑️ borrar**) + "➕ Nuevo perfil". El modal `abrirForm(perfil?)` sirve para **crear y editar** (precarga nombre/género/nivel; guarda con `Juego.actualizarPerfil`). Chip de perfil en la barra para cambiar. `Perfiles.init/abrir/actualizarChip`. |
| `src/core/datos.js` | `Datos` | `Datos.cargar([...])` lee `window.__DATOS__` y rellena los globales. |
| `src/core/menu.js` | `Menu` | Menú de materias (tarjetas desde `DATOS.materias`, enlaza a `paginas/<modo>.html`). **Modal de clave** (`pedirClave(destino)`) que se abre ANTES de ir a la zona de adultos; sin clave válida no se navega. Dos tarjetas de adultos: **⚙️ Ajustes** (`editor.html`) y **📚 Banco de contenido** (`contenido.html`). |
| `src/core/mc.js` | `MC` | Motor de **opción múltiple** (repasos rápidos). Fábrica `MC(px, temas)`; ronda de 10. Al terminar registra el resultado en el leaderboard (`Juego.registrarResultado(px,…)`). **No es el patrón por defecto** (ver Filosofía de diseño). |
| `src/core/actividad.js` | `Actividad` | Motor de **actividades manipulativas** (hermano de `MC`). Fábrica `Actividad(px, temas, opts)`; cada tema tiene `ronda(host, ctrl)` que arma la interacción en `#<px>-extra` y resuelve con `ctrl.ganar()/fallar()/reintento()`. Sin temporizador (autocorrectivo). Al terminar registra el leaderboard. Reutiliza la misma estructura de página por prefijo que `MC`. |
| `src/core/arrastrar.js` | `Arrastrar` | Arrastrar-y-soltar con eventos de **puntero** (mouse + dedo). `Arrastrar.hacer(item, zonas, alSoltar)` (marca `.zona-hover`, devuelve la zona destino o null) y `Arrastrar.clasificar(host, ctrl, {pregunta, cestas, items})` (actividad "clasifica en cestas"). Además dos ayudantes de **toque** para `ronda()` de `Actividad`: `Arrastrar.emparejar(host, ctrl, {pregunta, pares:[{a,b}]})` (une parejas: toca izquierda→derecha; CSS `.emp-*`) y `Arrastrar.ordenar(host, ctrl, {pregunta, correcto:[...]})` (toca fichas en orden; CSS `.ord-*`). |
| `src/modos/ortografia.js` | `Ortografia` | Ejercicios desde `DATOS.ortografia`. |
| `src/modos/secuencias.js` | `Secuencias` | Secuencias numéricas. |
| `src/modos/copia.js` | `Copia` | **Corregir / Dictado** (dos sub-modos manipulativos). *Corregir*: el texto sale con errores y el niño **toca la palabra mala** → mini-modal con opciones (dificultad por `Juego.nivelIdx()`: básico = errores marcados y opciones obvias; intermedio = marcados, opciones más parecidas; avanzado = sin marcar, el niño los **busca** y al final pulsa Comprobar). *Dictado*: la voz del navegador (**Web Speech API**, sin librerías; degrada a mostrar el texto si no hay voz) lee y el niño escribe. Puntaje = palabras correctas/total → leaderboard `"copia"`. Conserva `generarErrores` (lo usa `contenido.js`). |
| `src/modos/invertebrados.js` | `Invertebrados` | Ciencias: clasificar invertebrados en sus 6 grupos (`Arrastrar.clasificar` sobre `Actividad`). Contenido del *Manual de invertebrados*. |
| `src/modos/editor.js` | `Editor` | Zona de adultos — **⚙️ Ajustes** (clave **24861793**): solo temporizador y reinicio de progreso. La identidad y el nivel viven en el perfil; el contenido, en `contenido.js`. |
| `src/modos/contenido.js` | `Contenido` | Zona de adultos — **📚 Banco de contenido** (misma clave): administra palabras de ortografía (editor universal), secuencias propias y párrafos. Mantiene `claveBancoCustom/claveOcultasOrto/bancoDefaultOrto` alineadas con `ortografia.js`. |
| `src/modos/mapas.js` | `Mapas` | Mapa SVG por provincias (usa `ECUADOR_SVG`). |
| `src/modos/mapacantones.js` | `MapaCantones` | Mapa GeoJSON por cantones + provincia en 3D (usa `ECUADOR_CANTONES`). |
| `src/efectos/escena3d.js` / `luna.js` | `ESCENA` / `Luna` | Fondo 3D y mascota. `Luna` (niño/niña según `genero`) tiene gestos espontáneos (saludo/pensar), reacciones (feliz/triste/fiesta) y **`Luna.tip(texto)` / `Luna.decir(texto)`** para hablar por su globo. **Si NO hay perfil creado** saluda en genérico ("¡Hola! Soy Luna") y omite el nombre en sus frases (`hayPerfil()` consulta `Juego.perfilActivo()`), para no decir "Nelson" en el selector. |
| `css/modulos/*.css` | — | Estilos modulares (orden en `css/modulos/_orden.md`). |
| `recursos/ecuador_1.0/2.0.svg`, `recursos/banderas/EC-*.svg` | — | SVG original/horneado + banderas provinciales. |
| `paginas/*.html` | — | Una por módulo; incluye sus `data/*.js`, core, su modo, y arranca con `Datos.cargar(...).then(() => { Juego.iniciarBase(); Modo.init(); })`. |

`Juego` (en `src/core/juego.js`) es la API compartida. **Las secciones de abajo describen la LÓGICA de
cada modo** (sigue igual; solo cambió la ubicación: `js/X.js` → `src/modos/X.js`, y los datos a `data/`).

## Navegación por materias
El menú está organizado en **materias** (asignaturas). Definidas en `DATOS.materias` (`datos.js`):
```js
{ id, icono, nombre, desc,
  actividades: [ { modo, icono, nombre, desc }, ... ],   // modo = pantalla existente
  proximamente: "texto" }                                 // solo si actividades está vacío
```
Materias actuales: **Lengua** (ortografia, copia, **clases, familia, sinonimos, formas, silabas,
ordena, sujeto, signos, alfabetico, lectura, refranes**), **Matemáticas** (secuencias, aritmetica/tablas/
multiplicacion/division/comparar/redondeo/numeros/valorposicional/dinero/medidas/hora/fracciones),
**Estudios Sociales** (`mapas`, `cantones`, `donde`), **Ciencias Naturales** (senala, plantas, cuerpo,
animales, **invertebrados**, cicloagua, materia, ambiente).

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

Flujo de pantallas (todo en `app.js`):
`pantalla-menu` (materias, render dinámico con `pintarMenu`) → `irAMateria(id)` →
`pantalla-materia` (submenú de actividades, o aviso "próximamente" si está vacía) →
`irAModo(modo)` → pantalla del modo (`pantalla-ortografia`/`-secuencias`/`-copia`) → ejercicio.
La tarjeta **⚙️ Crear y Configurar** vive en el menú raíz (no es materia) y abre `pantalla-editor`
con clave. `volverAtras` sube un nivel: ejercicio → selector → submenú materia → menú.
`materiaActual` recuerda la materia de origen para el botón Volver.

**Para añadir una actividad nueva** (modelo multipágina): crea `paginas/<modo>.html` (copiando una
página del mismo motor, p.ej. `animales.html` para `Actividad`) y `src/modos/<modo>.js`; añade el modo
al mapa `PAGINA` de `src/core/menu.js`; y regístralo en las `actividades` de su materia en
`data/materias.json` y corre `python herramientas/build.py`. El menú y el submenú se pintan solos.
Ejemplo reciente: **`invertebrados`** (ver fila en la tabla). El leaderboard se hereda gratis si el
modo usa los motores `MC`/`Actividad`.

## Perfiles, Niveles y Leaderboard
**Perfiles** (`src/core/perfiles.js` + API en `juego.js`): cada niño tiene su perfil
`{ id, nombre, avatar, genero, nivel }` en `localStorage` (`perfiles` = lista, `perfil_activo` = id).
La **identidad** (`jugador/avatarNombre/genero`) y el **nivel** se leen SIEMPRE del perfil activo (con
fallback a `NINO`/"Luna"/"nina"/"basico" si no hay perfil, para no romper el doble-clic en páginas
sueltas). El **progreso** (`estado`: estrellas/racha/nivel) es por perfil, en clave `estado__<id>`. El
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

### Editor universal de ortografía (`contenido.js`)
> Movido del editor al **📚 Banco de contenido** (`src/modos/contenido.js` + `paginas/contenido.html`).
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
están en `contenido.js` y **deben permanecer alineadas** con las claves que lee `ortografia.js`.

## Convenciones del proyecto
- **Idioma**: todo en español (UI, comentarios, nombres de variables y funciones). Mantener tildes/ñ.
- **Tips/pistas**: NO se muestran como banner sobre el ejercicio; se enrutan a la mascota con
  `Juego.tip(texto)` (→ `Luna.tip`), que los "sugiere" en su globo. Los modos dejan vacíos los
  elementos de regla/pista (`#…-tema`, `#orto-regla`, `#orto-pista`), que el CSS oculta con `:empty`.
- **Zona de adultos**: la clave (**24861793**) se pide en un **modal del menú** (`Menu.pedirClave(destino)`);
  `editor.html` (⚙️ Ajustes) y `contenido.html` (📚 Banco de contenido) solo entran con el permiso de
  sesión (`sessionStorage ads_editor_ok`) y, sin él, rebotan al menú sin mostrar nada. No usar `window.prompt`.
- **Sin dependencias** salvo three.js por CDN. No introducir build tools ni paquetes npm.
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
  - **Perfiles**: `perfiles` (lista `[{id,nombre,avatar,genero,nivel}]`), `perfil_activo` (id).
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

## Estado / próximos pasos posibles
- Hecho recientemente:
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
    (`editor.js`) + 📚 Banco de contenido (`contenido.js`). Ver "Perfiles, Niveles y Leaderboard".
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
