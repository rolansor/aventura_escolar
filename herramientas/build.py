#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build.py — precompila los datos para que la app funcione TANTO servida
COMO con doble clic (file://).

Los datos canónicos viven en data/*.json (editables). Como file:// no
permite fetch, este script genera, junto a cada .json, un .js gemelo que
rellena window.__DATOS__ (lo incluye cada página con <script>). El
cargador src/core/datos.js lee de window.__DATOS__ en ambos casos.

Ejecuta esto cada vez que edites un data/*.json.
Uso:  python herramientas/build.py
"""

import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(RAIZ, "data")


def main():
    n = 0
    for dirpath, _dirs, files in os.walk(DATA):
        for f in files:
            if not f.endswith(".json"):
                continue
            ruta = os.path.join(dirpath, f)
            nombre = os.path.relpath(ruta, DATA).replace("\\", "/")[:-5]  # sin .json
            with open(ruta, "r", encoding="utf-8") as fh:
                valor = json.load(fh)
            destino = ruta[:-5] + ".js"  # data/<n>.json -> data/<n>.js
            js = ("(window.__DATOS__=window.__DATOS__||{})[%s]=%s;\n"
                  % (json.dumps(nombre),
                     json.dumps(valor, ensure_ascii=False, separators=(",", ":"))))
            with open(destino, "w", encoding="utf-8") as fh:
                fh.write(js)
            print("  data/%s.js" % nombre)
            n += 1
    print("Listo: %d archivos data/*.js generados desde data/*.json." % n)


if __name__ == "__main__":
    main()
