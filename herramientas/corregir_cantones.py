#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
corregir_cantones.py — arregla los NOMBRES de cantones en data/mapas/cantones.json.

La geometría viene de GADM (recursos/gadm41_ECU_2.json), que trae los nombres
pegados ("SevilladeOro") y con algunos errores. Al separarlos quedaron cosas
como "Sevillade Oro" o "24De Mayo". Este script los deja como se escriben de
verdad y corrige dos fallos de la propia fuente:
  - Cotopaxi traía "Saquisili" y "Saquisilí": son el mismo cantón (se unen).
  - Pastaza traía un cantón "Mejía" que no existe: ese polígono es parte de Mera.

Es IDEMPOTENTE (se puede correr varias veces). Si algún día se regenera
cantones.json desde GADM, hay que volver a ejecutarlo y luego build.py:

    python herramientas/corregir_cantones.py
    python herramientas/build.py
"""

import json
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA = os.path.join(RAIZ, "data", "mapas", "cantones.json")

# nombre tal como quedó -> nombre correcto
NOMBRES = {
    "Camilo Ponce Enriquez": "Camilo Ponce Enríquez",
    "Sevillade Oro": "Sevilla de Oro",
    "San Pedrode Huaca": "San Pedro de Huaca",
    "Cumanda": "Cumandá",
    "Saquisili": "Saquisilí",
    "Lomasde Sargentillo": "Lomas de Sargentillo",
    "San Jacintode Yaguachi": "San Jacinto de Yaguachi",
    "Santa Lucia": "Santa Lucía",
    "Simon Bolivar": "Simón Bolívar",
    "Urbina Jado": "Salitre",
    "San Miguelde Urcuquí": "San Miguel de Urcuquí",
    "Buena Fé": "Buena Fe",
    "Pueblo Viejo": "Puebloviejo",
    "24De Mayo": "24 de Mayo",
    "La Joyadelos Sachas": "La Joya de los Sachas",
    "San Migueldelos Bancos": "San Miguel de los Bancos",
    "Bañosde Agua Santa": "Baños de Agua Santa",
    "San Pedrode Pelileo": "San Pedro de Pelileo",
    "Santiagode Pillaro": "Santiago de Píllaro",
    "Centineladel Cóndor": "Centinela del Cóndor",
    "Río Verde": "Rioverde",
}
# (provincia ISO, cantón que sobra) -> cantón real al que pertenece ese polígono
UNIR = {
    ("EC-Y", "Mejía"): "Mera",          # en Pastaza no existe "Mejía" (es de Pichincha)
}


def anillos(d):
    """'M x yL x y…Z' * n  ->  lista de anillos [(x, y), …]."""
    res = []
    for seg in d.split("Z"):
        nums = [float(n) for n in re.findall(r"-?\d+\.?\d*", seg)]
        pts = list(zip(nums[0::2], nums[1::2]))
        if len(pts) >= 3:
            res.append(pts)
    return res


def camino(rings):
    return "".join("M" + "L".join("%s %s" % (round(x, 1), round(y, 1)) for x, y in r) + "Z" for r in rings)


def unir(d1, d2):
    """Une dos contornos. Con shapely queda una sola forma limpia; sin shapely se concatenan."""
    try:
        from shapely.geometry import Polygon
        from shapely.ops import unary_union
        polis = [Polygon(r).buffer(0) for r in anillos(d1) + anillos(d2)]
        u = unary_union(polis)
        partes = list(u.geoms) if hasattr(u, "geoms") else [u]
        rings = []
        for p in partes:
            rings.append(list(p.exterior.coords)[:-1])
        return camino(rings)
    except Exception:
        return d1 + d2


def main():
    with open(RUTA, "r", encoding="utf-8") as fh:
        datos = json.load(fh)
    cambios = 0
    for prov in datos["provincias"]:
        # 1) nombres
        for c in prov["cantones"]:
            nuevo = NOMBRES.get(c["nombre"])
            if nuevo:
                print("  %-22s %s  ->  %s" % (prov["nombre"], c["nombre"], nuevo))
                c["nombre"] = nuevo
                cambios += 1
        # 2) polígonos mal etiquetados que pertenecen a otro cantón
        for (iso, sobra), real in UNIR.items():
            if prov["iso"] != iso:
                continue
            extra = [c for c in prov["cantones"] if c["nombre"] == sobra]
            destino = [c for c in prov["cantones"] if c["nombre"] == real]
            if extra and destino:
                destino[0]["d"] = unir(destino[0]["d"], extra[0]["d"])
                prov["cantones"].remove(extra[0])
                print("  %-22s «%s» no existe: su polígono se unió a %s" % (prov["nombre"], sobra, real))
                cambios += 1
        # 3) cantones repetidos tras corregir nombres (Saquisili + Saquisilí)
        vistos = {}
        for c in list(prov["cantones"]):
            if c["nombre"] in vistos:
                vistos[c["nombre"]]["d"] = unir(vistos[c["nombre"]]["d"], c["d"])
                prov["cantones"].remove(c)
                print("  %-22s «%s» estaba dos veces: se unieron" % (prov["nombre"], c["nombre"]))
                cambios += 1
            else:
                vistos[c["nombre"]] = c
        prov["cantones"].sort(key=lambda c: c["nombre"])
        prov["nCantones"] = len(prov["cantones"])
    with open(RUTA, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(json.dumps(datos, ensure_ascii=False, separators=(",", ":")))
    total = sum(p["nCantones"] for p in datos["provincias"])
    print("Listo: %d cambios. El mapa tiene %d cantones (el Ecuador tiene 221)." % (cambios, total))


if __name__ == "__main__":
    main()
