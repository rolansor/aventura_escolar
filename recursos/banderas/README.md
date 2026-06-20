# `recursos/banderas/` — banderas de las provincias

Cada provincia tiene su bandera como imagen. El mapa la muestra centrada en la provincia al hacer
1 clic. Mientras una provincia no tenga su archivo, se usa la bandera del Ecuador como _placeholder_
(y se reemplaza sola al añadir la real).

## Formato
- **SVG** (recomendado, mejor calidad) o **PNG** (fondo transparente o blanco).
- El nombre del archivo debe ser el **código ISO** de la provincia. Se prueba primero `<ISO>.svg`
  y luego `<ISO>.png`.
- Dónde conseguirlas: Wikipedia / [Wikimedia Commons](https://commons.wikimedia.org/wiki/List_of_Ecuadorian_flags),
  buscando _"Bandera de la Provincia de &lt;nombre&gt;"_.

## Nombres de archivo (uno por provincia)

| Archivo | Provincia | Archivo | Provincia |
|---|---|---|---|
| `EC-A.svg` | Azuay | `EC-N.svg` | Napo |
| `EC-B.svg` | Bolívar | `EC-O.svg` | El Oro |
| `EC-C.svg` | Carchi | `EC-P.svg` | Pichincha |
| `EC-D.svg` | Orellana | `EC-R.svg` | Los Ríos |
| `EC-E.svg` | Esmeraldas | `EC-S.svg` | Morona Santiago |
| `EC-F.svg` | Cañar | `EC-SD.svg` | Santo Domingo de los Tsáchilas |
| `EC-G.svg` | Guayas | `EC-SE.svg` | Santa Elena |
| `EC-H.svg` | Chimborazo | `EC-T.svg` | Tungurahua |
| `EC-I.svg` | Imbabura | `EC-U.svg` | Sucumbíos |
| `EC-L.svg` | Loja | `EC-W.svg` | Galápagos |
| `EC-M.svg` | Manabí | `EC-X.svg` | Cotopaxi |
| | | `EC-Y.svg` | Pastaza |
| | | `EC-Z.svg` | Zamora Chinchipe |

> Si usas PNG, cambia `.svg` por `.png` en el nombre (ej. `EC-G.png`).
