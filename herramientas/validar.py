#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validar.py — revisa que el CONTENIDO del juego no tenga trampas para el niño.

No abre el navegador: solo lee data/ y las páginas. Busca los errores que más
daño hacen porque el juego marcaría mal una respuesta correcta (o regalaría la
respuesta): parejas ambiguas, palabras repetidas en dos grupos, respuestas que
no están entre las opciones, palabras de ortografía que no tienen la letra de
su categoría, nombres de cantones mal escritos, .js sin regenerar, etc.

Uso:  python herramientas/validar.py
Sale con código 1 si hay ERRORES (los AVISOS no hacen fallar).
"""

import collections
import glob
import json
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build  # noqa: E402  (mismo cargador que usa el build: resuelve {"$archivo": ...})

RAIZ = build.RAIZ
os.chdir(RAIZ)
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

NIV = ["básico", "intermedio", "avanzado"]
ERRORES, AVISOS = [], []


def norm(s):
    """minúsculas sin tildes (igual que norm() del runner)."""
    return "".join(ch for ch in unicodedata.normalize("NFD", str(s).lower()) if unicodedata.category(ch) != "Mn")


def error(donde, tema, msg):
    ERRORES.append("%-16s [%s] %s" % (donde, tema, msg))


def aviso(donde, tema, msg):
    AVISOS.append("%-16s [%s] %s" % (donde, tema, msg))


# ------------------------------------------------------------------ contenido
def oraciones(p):
    """Parte un párrafo en oraciones igual que oraciones() de src/core/contenido.js."""
    out, ini = [], 0
    for m in re.finditer(r'[.!?…]+["»”)]*\s+', p):
        out.append(p[ini:m.end()])
        ini = m.end()
    if ini < len(p):
        out.append(p[ini:])
    return out


def tres_niveles(f, t, clave):
    v = t.get(clave)
    if not isinstance(v, list) or len(v) != 3:
        error(f, t.get("nombre"), "«%s» debe tener 3 niveles [básico, intermedio, avanzado]" % clave)
        return [[], [], []]
    return v


def nivel_real(niveles, n):
    """El arreglo que de verdad se usa en el nivel n: si está vacío, el runner baja al inferior."""
    arr = niveles[n]
    while n > 0 and not arr:
        n -= 1
        arr = niveles[n]
    return arr


def revisar_tema(f, t, C):
    tp, nom = t.get("tipo"), t.get("nombre")

    if tp == "clasificar":
        ids = [c["id"] for c in t["cestas"]]
        por_nivel = t.get("cestasPorNivel")
        if por_nivel:
            for lista in por_nivel:
                for i in lista:
                    if i not in ids:
                        error(f, nom, "cestasPorNivel usa una cesta que no existe: " + i)
        for k in t["items"]:
            if k not in ids:
                error(f, nom, "hay items para una cesta que no existe: " + k)
        for n in range(3):
            activas = por_nivel[n] if por_nivel else ids
            # El runner baja al nivel inferior si un nivel está vacío: se valida lo que realmente se usa.
            dueno = {}
            for cid in activas:
                niveles = t["items"].get(cid)
                if not niveles:
                    error(f, nom, "la cesta «%s» no tiene items" % cid); continue
                arr, k = niveles[n], n
                while k > 0 and not arr:
                    k -= 1; arr = niveles[k]
                if not arr:
                    error(f, nom, "la cesta «%s» no tiene items en %s" % (cid, NIV[n]))
                if len(arr) != len(set(x.lower() for x in arr)):
                    aviso(f, nom, "items repetidos en %s/%s" % (cid, NIV[n]))
                for x in arr:      # con tildes: «el» (artículo) y «él» (pronombre) son palabras distintas
                    dueno.setdefault(x.lower(), set()).add(cid)
            for x, cs in dueno.items():
                if len(cs) > 1:
                    error(f, nom, "«%s» está en dos cestas a la vez en %s: %s" % (x, NIV[n], sorted(cs)))

    elif tp == "emparejar":
        por_ronda = t.get("porRonda", [3, 4, 5])
        for n, arr in enumerate(tres_niveles(f, t, "pares")):
            a = [norm(p["a"]) for p in arr]
            if len(a) != len(set(a)):
                error(f, nom, "lado izquierdo repetido en %s: %s" % (NIV[n], sorted(x for x in set(a) if a.count(x) > 1)))
            # Un mismo texto a la derecha es válido (dos animales de la Sierra): el motor acepta por texto.
            if len(arr) < por_ronda[n]:
                aviso(f, nom, "%s tiene %d parejas y la ronda pide %d" % (NIV[n], len(arr), por_ronda[n]))

    elif tp == "ordenar":
        for n, arr in enumerate(tres_niveles(f, t, "secuencias")):
            if not arr and n == 0:
                error(f, nom, "sin secuencias en básico")
            for s in arr:
                if len(s) < 3:
                    aviso(f, nom, "secuencia muy corta: %s" % s)

    elif tp == "silabas":
        for n, arr in enumerate(tres_niveles(f, t, "items")):
            for s in arr:
                if len(s) < 2:
                    error(f, nom, "monosílabo (no hay nada que ordenar): %s" % s)

    elif tp == "alfabetico":
        for n, arr in enumerate(tres_niveles(f, t, "grupos")):
            for g in arr:
                ng = [norm(x) for x in g]
                if len(ng) != len(set(ng)):
                    error(f, nom, "grupo con dos palabras iguales (orden ambiguo): %s" % g)

    elif tp == "vf":
        for n, arr in enumerate(tres_niveles(f, t, "preguntas")):
            if not arr:
                if n == 0:
                    error(f, nom, "sin preguntas en básico")
                continue
            v = sum(1 for q in arr if q["c"] is True)
            fa = sum(1 for q in arr if q["c"] is False)
            if v + fa != len(arr):
                error(f, nom, "«c» debe ser true o false (%s)" % NIV[n])
            if v == 0 or fa == 0:
                error(f, nom, "todas las afirmaciones son %s en %s" % ("verdaderas" if v else "falsas", NIV[n]))
            elif min(v, fa) < 3:
                aviso(f, nom, "pocas %s en %s (%dV/%dF): se repetirán mucho" % ("falsas" if fa < v else "verdaderas", NIV[n], v, fa))
            for q in arr:
                if q["c"] is False and not q.get("exp"):
                    aviso(f, nom, "afirmación falsa sin explicación: " + q["t"][:50])

    elif tp == "definir":
        for n, arr in enumerate(tres_niveles(f, t, "preguntas")):
            for q in arr:
                if q["c"] in q["d"]:
                    error(f, nom, "la respuesta correcta también está entre los distractores: " + q["q"][:50])
                if len(set(q["d"])) != len(q["d"]) or len(q["d"]) < 2:
                    error(f, nom, "distractores repetidos o insuficientes: " + q["q"][:50])

    elif tp == "sujeto":
        for n, arr in enumerate(tres_niveles(f, t, "items")):
            for q in arr:
                if not (0 < q["corte"] < len(q["palabras"])):
                    error(f, nom, "«corte» fuera de rango: %s" % " ".join(q["palabras"]))

    elif tp in ("signos", "formas"):
        for n, arr in enumerate(tres_niveles(f, t, "items")):
            for q in arr:
                if q["correcto"] not in q["opciones"]:
                    error(f, nom, "la respuesta correcta no está entre las opciones: %s" % q)
                if len(set(q["opciones"])) != len(q["opciones"]):
                    error(f, nom, "opciones repetidas: %s" % q)

    elif tp == "escena":
        sid = [s["id"] for s in t["slots"]]
        fid = [x["id"] for x in t["fichas"]]
        if sorted(sid) != sorted(fid):
            error(f, nom, "las casillas y las fichas no coinciden")
        for s in t["slots"]:
            for x in t["fichas"]:
                if s["id"] == x["id"] and s.get("txt") and norm(s["txt"]) == norm(x.get("ficha") or x.get("txt")):
                    error(f, nom, "la casilla ya muestra la respuesta: «%s»" % s["txt"])

    elif tp == "senala":
        ids = {p["id"] for p in t["partes"]}
        if t.get("svg"):
            en_svg = set(re.findall(r'data-parte="([^"]+)"', t["svg"]))
            if en_svg != ids:
                error(f, nom, "las partes y el dibujo no coinciden: %s" % sorted(en_svg ^ ids))
        elif not t.get("modelo"):
            error(f, nom, "el tema no tiene ni «svg» ni «modelo»")
        for p in t["partes"]:
            if t.get("idioma") == "en":      # consigna en inglés: "Touch the kitchen" + su traducción
                if not re.match(r"(the|my|a|an)\s", p["nombre"]):
                    aviso(f, nom, "el nombre debe empezar con su artículo (the…): «%s»" % p["nombre"])
                if not p.get("es"):
                    error(f, nom, "falta la traducción («es») de «%s»" % p["nombre"])
            elif not re.match(r"(el|la|los|las)\s", p["nombre"]):
                aviso(f, nom, "el nombre debe empezar con su artículo (el/la/los/las): «%s»" % p["nombre"])

    elif tp == "ahorcado":
        for n, arr in enumerate(tres_niveles(f, t, "palabras")):
            en = [w["en"].upper() for w in arr]
            if len(en) != len(set(en)):
                aviso(f, nom, "palabras repetidas en " + NIV[n])
            for w in arr:
                if not re.fullmatch(r"[A-Za-z \-]+", w["en"]):
                    error(f, nom, "la palabra tiene caracteres que no están en el teclado: " + w["en"])

    elif tp == "escucha":
        cartas = t.get("opciones", [3, 4, 6])
        for n in range(3):
            arr = nivel_real(tres_niveles(f, t, "palabras"), n)
            if not arr:
                error(f, nom, "sin palabras en " + NIV[n]); continue
            en = [norm(w["en"]) for w in arr]
            if len(en) != len(set(en)):
                error(f, nom, "palabras repetidas en %s: %s" % (NIV[n], sorted(x for x in set(en) if en.count(x) > 1)))
            for w in arr:
                if not w.get("emoji"):
                    error(f, nom, "«%s» no tiene dibujo (emoji): no habría qué tocar" % w["en"])
            # Las cartas de una ronda llevan dibujos distintos: hacen falta tantos como cartas.
            if len({w.get("emoji") for w in arr}) < cartas[n]:
                aviso(f, nom, "%s tiene %d dibujos distintos y la ronda pide %d cartas"
                      % (NIV[n], len({w.get("emoji") for w in arr}), cartas[n]))

    elif tp == "frase":
        for n, arr in enumerate(tres_niveles(f, t, "frases")):
            if not arr and n == 0:
                error(f, nom, "sin oraciones en básico")
            for q in arr:
                palabras = q["en"].split()
                if len(palabras) < 3:
                    error(f, nom, "oración demasiado corta para ordenar: " + q["en"])
                if not q.get("es"):
                    aviso(f, nom, "oración sin traducción (el niño no sabría qué armar): " + q["en"])
                for x in q.get("sobra", []):
                    if x in palabras:
                        error(f, nom, "la ficha que sobra «%s» también está en la oración: %s" % (x, q["en"]))

    elif tp == "completa":
        for n, arr in enumerate(tres_niveles(f, t, "items")):
            if not arr and n == 0:
                error(f, nom, "sin oraciones en básico")
            for q in arr:
                if q["f"].count("___") != 1:
                    error(f, nom, "la oración debe tener UN hueco «___»: " + q["f"])
                if q["c"] in q["d"]:
                    error(f, nom, "la respuesta correcta también está entre las otras fichas: " + q["f"])
                if not q["d"] or len(set(q["d"])) != len(q["d"]):
                    error(f, nom, "fichas repetidas o insuficientes: " + q["f"])

    elif tp == "terminacion":
        ids = [r["id"] for r in t["reglas"]]
        if len(ids) != len(set(ids)):
            error(f, nom, "reglas con el mismo id")
        por_nivel = t.get("reglasPorNivel") or [ids, ids, ids]
        for lista in por_nivel:
            for i in lista:
                if i not in ids:
                    error(f, nom, "reglasPorNivel usa una regla que no existe: " + i)
        for n in range(3):
            if len(por_nivel[n]) < 2:
                error(f, nom, "%s solo tiene una terminación: no habría nada que elegir" % NIV[n])
            arr = nivel_real(tres_niveles(f, t, "items"), n)
            if not arr:
                error(f, nom, "sin palabras en " + NIV[n])
            for q in arr:
                if q["regla"] not in ids:
                    error(f, nom, "«%s» usa una regla que no existe: %s" % (q["base"], q["regla"]))
                elif q["regla"] not in por_nivel[n]:
                    aviso(f, nom, "«%s» usa la regla «%s», que no sale en %s" % (q["base"], q["regla"], NIV[n]))
                if not q.get("res"):
                    error(f, nom, "«%s» no tiene resultado («res»)" % q["base"])
                # Una terminación cambia, como mucho, la última letra (study → studied, dance → dancing).
                elif len(os.path.commonprefix([q["base"], q["res"]])) < len(q["base"]) - 1:
                    aviso(f, nom, "¿está bien escrito? «%s» → «%s»" % (q["base"], q["res"]))
            for i in por_nivel[n]:
                if arr and not any(q["regla"] == i for q in arr):
                    aviso(f, nom, "en %s ninguna palabra usa la terminación «%s»" % (NIV[n], i))

    elif tp == "memoria":
        parejas = t.get("parejas", [4, 5, 6])
        for n in range(3):
            arr = nivel_real(tres_niveles(f, t, "pares"), n)
            if not arr:
                error(f, nom, "sin parejas en " + NIV[n]); continue
            caras = [norm(p["a"]) for p in arr] + [norm(p["b"]) for p in arr]
            # Dos cartas iguales que NO son pareja confundirían (el niño no sabría por qué no vale).
            if len(caras) != len(set(caras)):
                error(f, nom, "cartas repetidas en %s: %s" % (NIV[n], sorted(x for x in set(caras) if caras.count(x) > 1)))
            if len(arr) < parejas[n]:
                aviso(f, nom, "%s tiene %d parejas y la ronda pide %d" % (NIV[n], len(arr), parejas[n]))

    elif tp == "lectura":
        total = t.get("total", 6)
        for n, arr in enumerate(tres_niveles(f, t, "lecturas")):
            for lec in arr:
                tit = "%s, «%s»" % (NIV[n], lec.get("titulo", "sin título"))
                parrafos = lec["texto"] if isinstance(lec["texto"], list) else [lec["texto"]]
                ors = [norm(o) for p in parrafos for o in oraciones(p)]
                if len(lec["preguntas"]) != total:
                    error(f, nom, "%s tiene %d preguntas y la ronda es de %d (una sesión = un texto)"
                          % (tit, len(lec["preguntas"]), total))
                for q in lec["preguntas"]:
                    clases = [k for k in ("c", "toca", "ordena") if k in q]
                    if len(clases) != 1:
                        error(f, nom, "%s: la pregunta debe ser de UNA clase (c+d, toca u ordena): %s" % (tit, q.get("q")))
                    if "c" in q:
                        if q["c"] in q.get("d", []):
                            error(f, nom, "%s: la correcta también está entre los distractores: %s" % (tit, q["q"]))
                        if len(q.get("d", [])) < 2:
                            error(f, nom, "%s: faltan distractores en: %s" % (tit, q["q"]))
                    # La pista y la oración que se toca deben estar en el texto, dentro de UNA oración.
                    for campo in ("pista", "toca"):
                        if campo in q:
                            hay = [o for o in ors if norm(q[campo]) in o]
                            if not hay:
                                error(f, nom, "%s: «%s» no está dentro de una sola oración del texto" % (tit, q[campo]))
                            elif campo == "toca" and len(hay) > 1:
                                error(f, nom, "%s: «%s» está en más de una oración (no se sabría cuál tocar)" % (tit, q[campo]))
                    if "ordena" in q and (len(q["ordena"]) < 3 or len(set(q["ordena"])) != len(q["ordena"])):
                        error(f, nom, "%s: «ordena» necesita 3 o más hechos distintos" % tit)

    elif tp == "mc":
        for x in t.get("banco", []):
            if x["c"] in x["d"]:
                error(f, nom, "la respuesta correcta también está entre los distractores: " + x["p"][:50])

    elif tp in ("problema", "terminos", "bloques", "fraccion", "partes"):
        pass

    else:
        error(f, nom, "tipo de tema desconocido: %s" % tp)


def revisar_contenido():
    for ruta in sorted(glob.glob("data/contenido/*.json")):
        f = os.path.basename(ruta)[:-5]
        C = build.cargar(ruta)
        for t in C.get("temas", []):
            try:
                revisar_tema(f, t, C)
            except (KeyError, TypeError, IndexError) as e:
                error(f, t.get("nombre"), "estructura inesperada (%s: %s)" % (type(e).__name__, e))
        for p in C.get("banco", []) if isinstance(C.get("banco"), list) else []:
            op = p.get("op")
            if op not in ("+", "−", "×", "÷"):
                error(f, "banco", "operación desconocida: %s" % p); continue
            r = {"+": p["a"] + p["b"], "−": p["a"] - p["b"], "×": p["a"] * p["b"]}.get(op)
            if op == "÷":
                r = p["a"] / p["b"] if p["b"] else None
            if r is None or r < 0 or r != int(r):
                error(f, "banco", "el resultado no es un entero positivo: %s" % p["t"][:60])
        for k, arr in (C.get("bancos") or {}).items():
            for x in arr:
                if x["c"] in x["d"]:
                    error(f, k, "la respuesta correcta también está entre los distractores: " + x["p"][:50])


# ----------------------------------------------------------------- ortografía
def candidatos(cid, palabra):
    """Mismas reglas que candidatos() de src/modos/ortografia.js."""
    idx, w = [], palabra.lower()
    for i, ch in enumerate(w):
        sig = w[i + 1] if i + 1 < len(w) else ""
        ant = w[i - 1] if i > 0 else ""
        if cid == "b_v" and ch in "bv": idx.append(i)
        elif cid == "c_s_z" and ((ch == "c" and sig != "h") or ch in "sz"): idx.append(i)
        elif cid == "g_j" and (ch == "j" or (ch == "g" and sig in "eiéí" and sig)): idx.append(i)
        elif cid == "m_p_b" and ch == "m" and sig in "pb" and sig: idx.append(i)
        elif cid == "h_muda" and ch == "h" and ant != "c": idx.append(i)
    return idx


def revisar_ortografia():
    cats = build.cargar("data/ortografia.json")
    for cat in cats:
        cid, est = cat["id"], cat["estrategia"]
        if est in ("letra", "hache"):
            pal = cat["palabras"]
            for w, n in collections.Counter(pal).items():
                if n > 1:
                    aviso("ortografia", cid, "palabra repetida: " + w)
            for w in pal:
                if not candidatos(cid, w):
                    error("ortografia", cid, "«%s» no tiene la letra de esta categoría (nunca saldría)" % w)
        elif est == "lly":
            for w in cat["palabras"]:
                if "ll" not in w.lower() and not re.search(r"y[aeiouáéíóú]", w.lower()):
                    error("ortografia", cid, "«%s» no tiene LL ni Y consonante" % w)
        elif est == "tilde":
            for w in cat["conTilde"]:
                if not re.search(r"[áéíóúÁÉÍÓÚ]", w):
                    error("ortografia", cid, "«%s» está en la lista de tildes y no lleva tilde" % w)
        elif est == "mayus":
            for w in cat["propios"]:
                if w == w.lower():
                    error("ortografia", cid, "nombre propio en minúscula: " + w)
            for w in cat["comunes"]:
                if w != w.lower():
                    error("ortografia", cid, "palabra común con mayúscula: " + w)
        elif est == "clasificar":
            dueno = collections.defaultdict(list)
            for clase, arr in cat["banco"].items():
                if clase not in cat["clases"]:
                    error("ortografia", cid, "el banco tiene un grupo que no está en «clases»: " + clase)
                for w in arr:
                    dueno[w.lower()].append(clase)
            for w, cs in dueno.items():
                if len(cs) > 1:
                    error("ortografia", cid, "«%s» está en dos grupos: %s" % (w, cs))


# -------------------------------------------------------------------- mapas
def revisar_mapas():
    cant = build.cargar("data/mapas/cantones.json")
    det = build.cargar("data/mapas/detalle.json")
    for p in cant["provincias"]:
        nombres = [c["nombre"] for c in p["cantones"]]
        for n in nombres:
            if re.search(r"[a-záéíóúñ](de|del|delos|dela)\s", n) or re.search(r"\d[A-Za-z]", n) or n != n.strip():
                error("mapas/cantones", p["nombre"], "nombre de cantón mal separado: «%s»" % n)
        planos = [norm(n) for n in nombres]
        for n in set(planos):
            if planos.count(n) > 1:
                error("mapas/cantones", p["nombre"], "cantón repetido: " + n)
        if p.get("nCantones") != len(nombres):
            error("mapas/cantones", p["nombre"], "nCantones=%s pero hay %d cantones" % (p.get("nCantones"), len(nombres)))
        d = det.get(p["iso"], {})
        if d.get("cantones") not in (None, len(nombres)):
            error("mapas/detalle", p["nombre"], "detalle dice %s cantones y la geometría tiene %d" % (d.get("cantones"), len(nombres)))


# ------------------------------------------------------------------ currículo
def revisar_curriculo():
    """Grados, trimestres y plan: nada que apunte a algo inexistente ni actividades sin trimestre."""
    cur = build.cargar("data/curriculo.json")
    modos = {m["id"]: [a["modo"] for a in m.get("actividades", [])] for m in build.cargar("data/materias.json")}
    tris = [str(t["id"]) for t in cur.get("trimestres", [])]
    grados = cur.get("grados", [])
    ids = [str(g.get("id")) for g in grados]
    for i in sorted(set(ids)):
        if ids.count(i) > 1:
            error("currículo", "grado " + i, "id de grado repetido")
    if not any(g.get("plan") for g in grados):
        error("currículo", "grados", "ningún grado tiene plan: no habría nada que jugar")
    usados = set()
    for g in grados:
        for tri, plan in (g.get("plan") or {}).items():
            donde = "%s, trimestre %s" % (g.get("nombre"), tri)
            if tri not in tris:
                error("currículo", donde, "ese trimestre no está en la lista «trimestres»")
            for mat, lista in plan.items():
                if mat not in modos:
                    error("currículo", donde, "la materia «%s» no existe en data/materias.json" % mat)
                    continue
                for modo in sorted(set(lista)):
                    if modo not in modos[mat]:
                        error("currículo", donde, "«%s» no es una actividad de «%s» en data/materias.json" % (modo, mat))
                    if lista.count(modo) > 1:
                        error("currículo", donde, "«%s» está repetida en «%s»" % (modo, mat))
                    usados.add((mat, modo))
    for mat, lista in modos.items():
        for modo in lista:
            if (mat, modo) not in usados:
                error("currículo", mat, "la actividad «%s» no está en ningún trimestre: no se podría abrir desde el menú" % modo)


# ---------------------------------------------------- páginas, menú y build
def revisar_paginas():
    materias = build.cargar("data/materias.json")
    menu = open("src/core/menu.js", encoding="utf-8").read()
    pagina = dict(re.findall(r'(\w+):\s*"(paginas/[\w-]+\.html)"', menu))
    for m in materias:
        for a in m.get("actividades", []):
            destino = pagina.get(a["modo"])
            if not destino:
                error("menú", m["id"], "el modo «%s» no está en el mapa PAGINA de menu.js" % a["modo"])
            elif not os.path.exists(destino):
                error("menú", m["id"], "no existe la página " + destino)
    for h in ["index.html"] + sorted(glob.glob("paginas/*.html")):
        s = open(h, encoding="utf-8").read()
        base = "." if (h == "index.html" or '<base href="../"' in s) else os.path.dirname(h)
        if h != "index.html" and '<base href="../"' not in s:
            error("páginas", h, 'falta <base href="../">')
        for m in re.finditer(r'(?:src|href)="([^"#]+)"', s):
            u = m.group(1)
            if u.startswith(("http", "data:", "mailto:", "javascript:")) or u == "../":
                continue
            if not os.path.exists(os.path.normpath(os.path.join(base, u.split("?")[0]))):
                error("páginas", h, "referencia rota: " + u)
        if "cdnjs.cloudflare.com" in s:
            aviso("páginas", h, "carga three.js desde internet (debe usar lib/three.min.js)")


def revisar_build():
    for ruta in build.jsons():
        gemelo = ruta[:-5] + ".js"
        nombre = build.nombre_de(ruta)
        if not os.path.exists(gemelo):
            error("build", nombre, "falta el .js gemelo: ejecuta python herramientas/build.py")
        elif open(gemelo, encoding="utf-8").read() != build.js_de(ruta):
            error("build", nombre, "el .js no coincide con el .json: ejecuta python herramientas/build.py")


def main():
    for paso in (revisar_contenido, revisar_ortografia, revisar_mapas, revisar_curriculo, revisar_paginas, revisar_build):
        try:
            paso()
        except Exception as e:  # un fallo del validador no debe ocultar el resto
            error("validador", paso.__name__, "%s: %s" % (type(e).__name__, e))
    if AVISOS:
        print("AVISOS (%d):" % len(AVISOS))
        print("\n".join("  " + a for a in AVISOS))
    if ERRORES:
        print("ERRORES (%d):" % len(ERRORES))
        print("\n".join("  " + e for e in ERRORES))
        sys.exit(1)
    print("Contenido correcto: 0 errores" + (", %d avisos." % len(AVISOS) if AVISOS else "."))


if __name__ == "__main__":
    main()
