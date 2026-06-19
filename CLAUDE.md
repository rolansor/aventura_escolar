# CLAUDE.md — La Aventura de Nelson

Juego educativo (ortografía + matemáticas) en **HTML/CSS/JavaScript vanilla + three.js**.
Pensado para un niño de ~9 años, en **español de Ecuador**. Sin framework, sin build, sin
servidor: se abre con **doble clic en `index.html`** (protocolo `file://`).

## Cómo ejecutar / probar
- Abrir `index.html` en el navegador (Chrome/Edge/Firefox). No hay `npm`, ni bundler, ni tests.
- Tras editar JS/CSS, recargar con **Ctrl + Shift + R** (recarga forzada; el navegador cachea fuerte).
- **No hay Node instalado** en este equipo: no se puede usar `node --check` ni linters. Validar a ojo.
- three.js se carga por **CDN (r128)**. Sin internet el juego sigue funcionando con fondo plano y
  Luna en modo emoji (degradación elegante en `escena3d.js` / `luna.js`).
- Persistencia: **todo se guarda en `localStorage`** del navegador (progreso, config, contenido del editor).

## Arquitectura
Cada archivo es un **módulo IIFE** que expone un objeto global (`window.X`). Se cargan en orden en
`index.html` y se inicializan desde `app.js`. No hay imports/exports ES modules.

| Archivo | Global | Rol |
|---|---|---|
| `js/datos.js` | `DATOS`, `NINO` | **Datos puros**: `DATOS.materias` (navegación), bancos de palabras y definiciones de actividades. Sin lógica. |
| `js/app.js` | `Juego` | Núcleo: navegación entre pantallas, marcador (estrellas/racha/nivel), sonido, `localStorage`, temporizador, utilidades (`azar`, `azarEl`, `mezclar`, `cargar`, `guardar`, `frasePositiva`, `construirSecuencia`). Llama a `*.init()`. |
| `js/ortografia.js` | `Ortografia` | Modo Ortografía: genera ejercicios al azar desde `DATOS.ortografia`. |
| `js/secuencias.js` | `Secuencias` | Modo Secuencias numéricas (patrones infinitos). |
| `js/copia.js` | `Copia` | Modo Copia y Dictado (corregir errores / copiar igual). |
| `js/editor.js` | `Editor` | Zona de adultos (clave **24861793**): crear secuencias, párrafos, pares de palabras, config jugador/timer. |
| `js/mapas.js` | `Mapas` | Modo Mapas (Sociales): mapa interactivo del Ecuador por provincias. |
| `js/mapadata.js` | `window.ECUADOR_SVG` | El SVG del mapa como texto. Hoy es `"PLACEHOLDER"` hasta integrar el real. |
| `js/escena3d.js` | — | Fondo 3D con three.js. |
| `js/luna.js` | `Luna` | Mascota 3D arrastrable que reacciona a aciertos/fallos. |
| `css/styles.css` | — | Todos los estilos. |

`Juego` (en `app.js`) es la API compartida. Utilidades clave usadas por los modos:
`Juego.azarEl(arr)`, `Juego.mezclar(arr)`, `Juego.cargar(clave, defecto)`, `Juego.guardar(clave, valor)`,
`Juego.acierto()`, `Juego.error()`, `Juego.granPremio()`, `Juego.cronIniciar/cronDetener`, `Juego.jugador()`.

## Navegación por materias
El menú está organizado en **materias** (asignaturas). Definidas en `DATOS.materias` (`datos.js`):
```js
{ id, icono, nombre, desc,
  actividades: [ { modo, icono, nombre, desc }, ... ],   // modo = pantalla existente
  proximamente: "texto" }                                 // solo si actividades está vacío
```
Materias actuales: **Lengua** (ortografia, copia), **Matemáticas** (secuencias),
**Estudios Sociales** (placeholder — futuro: mapas del Ecuador), **Ciencias Naturales**
(placeholder — futuro: partes de plantas, cuerpo humano).

Flujo de pantallas (todo en `app.js`):
`pantalla-menu` (materias, render dinámico con `pintarMenu`) → `irAMateria(id)` →
`pantalla-materia` (submenú de actividades, o aviso "próximamente" si está vacía) →
`irAModo(modo)` → pantalla del modo (`pantalla-ortografia`/`-secuencias`/`-copia`) → ejercicio.
La tarjeta **⚙️ Crear y Configurar** vive en el menú raíz (no es materia) y abre `pantalla-editor`
con clave. `volverAtras` sube un nivel: ejercicio → selector → submenú materia → menú.
`materiaActual` recuerda la materia de origen para el botón Volver.

**Para añadir una actividad nueva**: crea su modo (pantalla + módulo JS estilo `ortografia.js`),
regístralo en el `mapa` de `irAModo`, inícialo en `iniciar()`, y añádelo a las `actividades` de su
materia en `DATOS.materias`. El menú y el submenú se pintan solos desde los datos.

## Modo Mapas — mapa del Ecuador (Estudios Sociales)
Mapa interactivo SVG de las 24 provincias, coloreadas por las 4 regiones naturales
(Costa, Sierra, Amazonía, Región Insular/Galápagos). Al tocar una provincia se muestra su
región y su capital. Es **explorable** (sin puntaje todavía); el quiz vendría después.

- **Geometría intercambiable**: `mapas.js` NO contiene coordenadas. Inyecta `window.ECUADOR_SVG`
  (de `mapadata.js`) y, sobre el SVG resultante, recorre `path/polygon`, identifica cada provincia
  por su nombre o código ISO (`provinciaDe` busca de forma tolerante en `id/name/data-name/class/
  <title>` del elemento y su `<g>` padre, normalizando con `norm()` — sin tildes, espacios ni guiones),
  la colorea por región y le agrega el clic.
- **Metadatos** (las 24 provincias con ISO `EC-*`, región y capital) viven en `PROVINCIAS` dentro de
  `mapas.js`. Galápagos = `EC-W`, región `insular`.
- **Integración del SVG real (PENDIENTE)**: el usuario descarga un SVG de provincias (p. ej.
  simplemaps.com/svg/country/ec) como `ecuador.svg` en la raíz. Para embeberlo SIN romper el offline
  (`file://` no permite `fetch`), se envuelve su contenido como texto en `mapadata.js`. Forma rápida en
  PowerShell, escapando `` ` ``, `\` y `${`:
  ```pwsh
  $svg = Get-Content -Raw ecuador.svg
  $svg = $svg -replace '\\','\\' -replace '`','``' -replace '\$','`$'
  Set-Content js/mapadata.js ('window.ECUADOR_SVG = `' + $svg + '`;') -Encoding utf8
  ```
  Luego conviene **leer un fragmento** del SVG para confirmar con qué atributo nombra las provincias y,
  si hace falta, ajustar `provinciaDe`/`indice` (alias) en `mapas.js`. Si simplemaps NO incluye
  Galápagos, habrá que añadir esa isla/recuadro aparte.
- Navegación: modo `mapas` → `pantalla-mapas`; registrado en `irAModo`, en `PANTALLAS_MODO` (Volver
  regresa al submenú de Sociales) y arrancado en `iniciar()` con `Mapas.init()`.

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

### Editor universal de ortografía (`editor.js`)
La sección "🔤 Palabras de ortografía" administra **cualquier** categoría según su `estrategia`:
- **Selector de categoría** → muestra todas las de `DATOS.ortografia`.
- **Selector de grupo** (`ed-orto-grupo`) → aparece solo en `mayus` (propios/comunes) y `clasificar`
  (las `clases`). Determina a qué lista apuntan las acciones.
- **Agregar palabra** → guarda en `claveBancoCustom(cat, grupo)` (las mismas claves que lee el generador).
- **Ocultar 🚫 / Mostrar ↩️** → alterna en `claveOcultasOrto(cat, grupo)`; el generador respeta esto vía
  `quitarOcultas` (si se ocultan TODAS, se ignora el filtro para no dejar la categoría vacía).
- **Borrar 🗑️** → solo en palabras propias (las del juego no se borran, solo se ocultan).
- **Pares ✅/❌** → zona `ed-orto-pares-zona`, oculta para `clasificar` (allí no aplica).

Las funciones clave de mapeo cat→clave (`claveBancoCustom`, `claveOcultasOrto`, `bancoDefaultOrto`)
están en `editor.js` y **deben permanecer alineadas** con las claves que lee `ortografia.js`.

## Convenciones del proyecto
- **Idioma**: todo en español (UI, comentarios, nombres de variables y funciones). Mantener tildes/ñ.
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
  - `secuencias_propias`, `parrafos_propios`, `config`, `jugador`, `avatar`, `genero`, `estado`.
- **Importante**: las claves de "custom" y "ocultas" están duplicadas entre `editor.js` (escribe) y
  `ortografia.js` (`quitarOcultas`, `extras`, generadores; lee). Si cambias una convención de clave,
  cámbiala en AMBOS archivos.
- Al cambiar categorías/contenido, recordar que `Ortografia.pintarSelector()` y `Editor` re-leen `DATOS`.

## Git
- **El directorio NO es un repositorio git** (no hay `.git`). No hay historial ni remoto.

## Estado / próximos pasos posibles
- Hecho recientemente:
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
  - **Ciencias Naturales**: partes de las plantas, animales, cuerpo humano.
  - **Ciencias Naturales**: partes de las plantas, animales, cuerpo humano.
