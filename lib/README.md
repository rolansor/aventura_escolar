# `lib/` — three.js local

| | |
|---|---|
| **Archivo** | `three.min.js` |
| **Versión** | r128 (REVISION 128) |
| **Origen** | <https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js> |
| **Licencia** | MIT — [three.js](https://threejs.org) |

Todas las páginas cargan **esta copia local** (ya no se pide a internet): así el 3D —el fondo, la
mascota, el mapa de cantones y los modelos de las actividades— funciona igual **sin conexión** y con
doble clic (`file://`), y la página no se queda esperando a un CDN.

```html
<script src="lib/three.min.js"></script>
```

(Las páginas de `paginas/` usan `<base href="../">`, así que la ruta es la misma en todas.)

**¿Por qué r128 y no una versión nueva?** Desde r160 three.js ya no publica el archivo clásico
`three.min.js` (solo módulos ES), y los módulos ES no funcionan con `file://`. r128 tiene todo lo que
el juego usa (geometrías, materiales, instancias, raycasting).
