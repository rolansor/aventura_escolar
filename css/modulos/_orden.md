# Módulos CSS — orden de carga

Estos archivos reparten los estilos por sección (sustituyen al antiguo
`css/styles.css`, ya retirado). Cárgalos con `<link>` en este ORDEN
(base **siempre primero**, porque define las variables `:root` que todos usan):

```html
<link rel="stylesheet" href="css/modulos/base.css">
<link rel="stylesheet" href="css/modulos/menu.css">
<link rel="stylesheet" href="css/modulos/ejercicios.css">
<link rel="stylesheet" href="css/modulos/editor.css">
<link rel="stylesheet" href="css/modulos/mapas.css">
<link rel="stylesheet" href="css/modulos/cantones.css">
<link rel="stylesheet" href="css/modulos/efectos.css">
```

## Por qué este orden
- **base.css va primero**: define `:root` (variables `--azul`, `--sombra`, `--radio`,
  `--fuente`, etc.). Sin él, el resto pierde colores, sombras y tipografía.
- El resto son módulos por sección con selectores independientes; entre ellos
  el orden no genera conflictos de especificidad (no hay reglas que se pisen).
  Se listan en un orden lógico de "general → específico" por legibilidad.

## Qué contiene cada módulo

| Archivo | Sección | Selectores principales |
|---|---|---|
| `base.css` | Variables, reset, layout raíz, barra/marcador, pantallas, botones genéricos, animaciones y responsive global | `:root`, `*`, `html, body`, `#lienzo3d`, `#interfaz`, `#barra-superior`, `.grupo-barra`, `.grupo-der`, `.boton-icono`, `#marcador`, `.pantalla`, `.pantalla.activa`, `.oculto`, `.boton-grande`, `.boton-secundario`, `.btn-volver`, `@keyframes latido/temblor/caer`, `@media (max-width:520px)` (marcador/caja-juego/boton-icono) |
| `menu.css` | Título del juego y menú de materias (tarjetas) | `.titulo-juego`, `.subtitulo`, `.tarjetas-menu`, `.tarjeta`, `.emoji-grande`, `.titulo-tarjeta`, `.desc-tarjeta` |
| `ejercicios.css` | Estilos compartidos de ortografía/secuencias/copia | `.selector-categorias`, `.chip-categoria`, `.caja-juego`, `.titulo-seccion`, `.aviso-adulto`, `.regla-ayuda`, `.fila-timer`, `.timer`, `.progreso`, `.progreso-barra`, `.pregunta`, `.secuencia-numeros`, `.pista`, `.opciones`, `.opcion`, `.zona-respuesta-libre`, `.entrada-texto`, `.entrada-area`, `.retro`, `.texto-modelo`, `.resultado-copia`, `.toggle-modo`, `.opcion-modo`, `#copia-pista` |
| `editor.css` | Zona de adultos (crear/configurar) | `.acordeon`, `.campos-grid`, `.bloque`, `.vista-previa`, `.fila-botones`, `.lista-guardados`, `.item-guardado`, `.borrar` |
| `mapas.css` | Mapa SVG de provincias del Ecuador (Sociales) | `.mapa-svg-cont`, `.mapa-ec` (`.prov`, `.sel`, `.pop`, `.atenuada`, `.region-on`), `.mapa-zona`, `.mapa-col-mapa`, `.mapa-detalle`, `@keyframes detalleEntra`, `.mapa-det-cab`, `.mapa-cerrar`, `.mapa-slide`, `.mapa-slider-nav`, `.mapa-nav-btn`, `.mapa-dots`, `.mapa-tooltip`, `.mapa-leyenda`, `.mapa-chip`, `.mapa-info`, `.mapa-falta` |
| `cantones.css` | Mapa por cantones (GeoJSON) y vista "foco" 3D | `.mapac` (`.prov`), `.mapac-foco`, `.foco-3d`, `#mapac-canvas`, `.foco-svg`, `.foco-hint`, `.foco-canton`, `.foco-bandera`, `#mapac-datos h4` |
| `efectos.css` | Mascota Luna y celebración/confeti | `#luna`, `#luna-canvas`, `#luna-emoji`, `.luna-nombre`, `.luna-globo`, `@keyframes flotar`, `@media (max-width:520px)` (Luna), `#celebracion`, `.confeti` |

## Notas
- `@keyframes caer` está en `base.css` (junto a `latido`/`temblor`), pero su consumidor
  `.confeti` está en `efectos.css`. Como `base.css` carga primero, la animación existe
  cuando `.confeti` la referencia. No mover sin tener en cuenta esto.
- `#lienzo3d` (canvas de fondo 3D) está en `base.css` por ser layout raíz; la mascota
  `#luna` y los efectos festivos están en `efectos.css`.
- Hay **dos** bloques `@media (max-width: 520px)`: uno en `base.css` (marcador, caja-juego,
  boton-icono) y otro en `efectos.css` (Luna). Es intencional: cada módulo lleva su propio
  responsive.
