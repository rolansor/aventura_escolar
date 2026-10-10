#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build.py — precompila los datos para que la app funcione TANTO servida
COMO con doble clic (file://).

Los datos canónicos viven en data/*.json (editables). Como file:// no
permite fetch, este script genera, junto a cada .json, un .js gemelo que
rellena window.__DATOS__ (lo incluye cada página con <script>). El
cargador src/core/datos.js lee de window.__DATOS__ en ambos casos.

Archivos incrustados: dentro de un .json, el objeto {"$archivo": "ruta"}
se sustituye por el TEXTO de ese archivo (ruta relativa a la raíz del
proyecto). Así los dibujos SVG grandes se editan como .svg normales
(p. ej. recursos/senala/cuerpo.svg) y no como una cadena escapada.

Ejecuta esto cada vez que edites un data/*.json (o un archivo incrustado).
Uso:  python herramientas/build.py
"""

import json
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RAIZ, "data")


def compactar(txt):
    """Quita comentarios y espacios sobrantes de un SVG/HTML para incrustarlo."""
    txt = re.sub(r"<!--.*?-->", "", txt, flags=re.S)
    txt = re.sub(r"<\?xml.*?\?>", "", txt, flags=re.S)
    txt = re.sub(r"\s+", " ", txt)
    txt = re.sub(r">\s+<", "><", txt)
    return txt.strip()


def resolver(valor):
    """Sustituye cada {"$archivo": "ruta"} por el contenido de ese archivo."""
    if isinstance(valor, dict):
        if list(valor.keys()) == ["$archivo"]:
            with open(os.path.join(RAIZ, valor["$archivo"]), "r", encoding="utf-8") as fh:
                return compactar(fh.read())
        return {k: resolver(v) for k, v in valor.items()}
    if isinstance(valor, list):
        return [resolver(v) for v in valor]
    return valor


def cargar(ruta):
    """Lee un data/*.json ya con sus archivos incrustados resueltos."""
    with open(ruta, "r", encoding="utf-8") as fh:
        return resolver(json.load(fh))


def nombre_de(ruta):
    """data/contenido/x.json -> 'contenido/x' (la clave en window.__DATOS__)."""
    return os.path.relpath(ruta, DATA).replace("\\", "/")[:-5]


def js_de(ruta):
    """Texto exacto del .js gemelo que corresponde a un .json."""
    return ("(window.__DATOS__=window.__DATOS__||{})[%s]=%s;\n"
            % (json.dumps(nombre_de(ruta)),
               json.dumps(cargar(ruta), ensure_ascii=False, separators=(",", ":"))))


def jsons():
    """Todas las rutas data/**/*.json, en orden estable."""
    rutas = []
    for dirpath, _dirs, files in os.walk(DATA):
        for f in files:
            if f.endswith(".json"):
                rutas.append(os.path.join(dirpath, f))
    return sorted(rutas)


def main():
    n = 0
    for ruta in jsons():
        with open(ruta[:-5] + ".js", "w", encoding="utf-8") as fh:
            fh.write(js_de(ruta))
        print("  data/%s.js" % nombre_de(ruta))
        n += 1
    print("Listo: %d archivos data/*.js generados desde data/*.json." % n)


if __name__ == "__main__":
    main()
