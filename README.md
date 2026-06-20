# 🚀 La Aventura de Nelson

> Juego educativo de ortografía, matemáticas y estudios sociales para un niño de ~9 años, en español de Ecuador.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript&logoColor=black)
![three.js](https://img.shields.io/badge/three.js-r128-000000?logo=three.js&logoColor=white)
![Licencia MIT](https://img.shields.io/badge/Licencia-MIT-green)

---

## 📖 Descripción

**La Aventura de Nelson** es un juego educativo web hecho con **HTML + CSS + JavaScript vanilla**
y un toque de **three.js** para el 3D. No usa frameworks, ni bundlers, ni servidor obligatorio: se
puede jugar abriendo un archivo con doble clic o sirviéndolo desde GitHub Pages.

Está pensado con cariño para acompañar el aprendizaje de un niño de unos 9 años, con vocabulario y
ejemplos en **español de Ecuador**. Lo acompaña **Luna**, una mascota 3D arrastrable que salta cuando
acierta y se entristece cuando falla.

El progreso (estrellas, racha y nivel), la configuración y el contenido creado por los adultos se
guardan automáticamente en el navegador (`localStorage`).

---

## 📸 Capturas

![Menú principal por materias](docs/capturas/menu.png)
![Modo Ortografía](docs/capturas/ortografia.png)
![Mapa del Ecuador](docs/capturas/mapa.png)
![Luna, la mascota 3D](docs/capturas/luna.png)

---

## ✨ Características por materia

### 📖 Lengua
- **Ortografía** con 10 reglas y ejercicios generados al azar (casi nunca se repiten):
  B/V, C-S-Z, G/J, H muda, LL/Y, Tildes, Mayúsculas, M antes de P/B,
  Agudas-llanas-esdrújulas y Diptongo-triptongo-hiato.
  Tres tipos de ejercicio: completar la letra, elegir la palabra bien escrita y clasificar.
- **Copia y Dictado**: corregir errores marcados en rojo o copiar el texto igual cuidando
  tildes y mayúsculas.

### 🔢 Matemáticas
- **Secuencias numéricas**: patrones infinitos generados al azar (sumas, restas,
  multiplicaciones, tablas, cuadrados, Fibonacci, dobles/mitades y mezclas), con botón de pista 💡.

### 🗺️ Estudios Sociales
- **Mapa del Ecuador por provincias**: SVG interactivo, coloreado por las 4 regiones naturales
  (Costa, Sierra, Amazonía e Insular). Al tocar una provincia se muestra su región y su capital.
- **Ecuador por cantones**: mapa GeoJSON donde, al hacer clic en una provincia, se ve en **3D
  rotable con three.js** junto a sus cantones y la bandera provincial.

### 🌱 Ciencias Naturales
- ¡Próximamente! (partes de las plantas, animales, cuerpo humano…).

### ⚙️ Zona de adultos / Editor (protegida con clave)
- Crear secuencias y párrafos, administrar las palabras de ortografía por regla, y configurar
  el jugador, la mascota y el temporizador.

---

## 🛠️ Tecnologías

- **HTML5 + CSS3** (CSS modular, sin preprocesadores).
- **JavaScript vanilla** en módulos IIFE (sin imports/exports ES, sin npm).
- **three.js (r128)** para el fondo 3D, la mascota Luna y el relieve de cantones. Se carga del CDN
  con copia local en `lib/three.min.js` como respaldo, así el 3D también funciona **sin internet**.
- **WebAudio API** para el sonido de aciertos y errores.
- **localStorage** para toda la persistencia (progreso, configuración y contenido del editor).

---

## ▶️ Cómo ejecutar

Funciona de **dos formas**, sin instalar nada:

### 1) Doble clic (sin servidor)
Abre **`index.html`** con doble clic en Chrome, Edge o Firefox. Pantalla completa con **F11**.
Los datos están precompilados en `data/*.js`, así que no hace falta servidor.

### 2) Servido (desarrollo / GitHub Pages)
Desde la raíz del proyecto:

```bash
python -m http.server
```

y abre **http://localhost:8000**. También se puede publicar en **GitHub Pages**.

> Tras editar JS/CSS recarga con **Ctrl + Shift + R** (el navegador cachea fuerte). Si editas un
> `data/*.json`, regenera los datos con `python herramientas/build.py` (crea los `data/*.js` que
> incluyen las páginas).

---

## 📁 Estructura de carpetas

```
.
├── index.html              # menú principal (materias)
├── paginas/                # un HTML por módulo (ortografia, secuencias, copia, mapas, cantones, editor)
├── src/
│   ├── core/               # juego.js (API compartida), datos.js (cargador), menu.js
│   ├── modos/              # lógica de cada actividad
│   └── efectos/            # fondo 3D (escena3d.js) y mascota (luna.js)
├── data/                   # *.json canónicos (editables) + *.js generados por build.py
├── css/modulos/            # estilos modulares (base, menu, ejercicios, editor, mapas, cantones, efectos)
├── lib/                    # three.js r128 local (para que el 3D funcione offline)
├── recursos/               # SVG del mapa + banderas (recursos/banderas/EC-*.svg)
├── herramientas/build.py   # precompila data/*.json -> data/*.js
└── docs/                   # ARQUITECTURA.md y capturas/
```

> Los datos canónicos viven en `data/*.json`. `herramientas/build.py` genera junto a cada uno un
> `data/*.js` que rellena `window.__DATOS__`; las páginas lo incluyen con `<script>`. Así el **mismo
> código** funciona con doble clic (`file://`) y servido, sin carpeta `dist/`. Detalle técnico en
> [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

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
