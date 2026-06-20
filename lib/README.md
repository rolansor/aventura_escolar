# `lib/` — three.js local

| | |
|---|---|
| **Archivo** | `three.min.js` |
| **Versión** | r128 (REVISION 128) |
| **Origen** | <https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js> |
| **Licencia** | MIT — [three.js](https://threejs.org) |

Esta copia local **reemplaza la carga por CDN** para que el 3D (fondo, la mascota Luna y el
mapa de cantones en 3D) funcione **también sin internet** (offline / `file://`).

Cada página lo carga antes de los scripts del juego, con un respaldo automático al CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>window.THREE || document.write('<scr'+'ipt src="lib/three.min.js"></scr'+'ipt>');</script>
```

(Ajusta la ruta relativa según la ubicación de cada HTML.)
