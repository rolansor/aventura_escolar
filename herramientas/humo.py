#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
humo.py — prueba de humo del juego en un navegador de verdad (sin ventana).

Recorre el inicio (grado → trimestres → materias, y el mapa conceptual), abre
TODAS las páginas de paginas/ con un perfil de prueba, entra a cada tema
varias veces y comprueba que:
  - no haya errores de JavaScript ni rondas que fallen por dentro,
  - cada tema pinte algo (pregunta, material u opciones),
  - la actividad quepa en una pantalla de laptop (aviso si hay que bajar).

Usa Chrome o Edge ya instalados (ver herramientas/cdp.py). No toca el progreso
real: trabaja con un perfil temporal del navegador.

Uso:
  python herramientas/humo.py                 # nivel intermedio, todas las páginas
  python herramientas/humo.py --nivel avanzado
  python herramientas/humo.py --todos         # los tres niveles
  python herramientas/humo.py senala plantas  # solo esas páginas
Sale con código 1 si hay errores.
"""

import glob
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Chrome, URL_BASE, RAIZ, salida_utf8  # noqa: E402

ANCHO, ALTO = 1024, 768   # ventana de una laptop sencilla (el área útil queda en ~1008 x 673)
REPETICIONES = 3          # veces que se entra a cada tema (el contenido sale al azar)
SIN_TEMAS = {"mapas", "cantones", "donde"}   # páginas sin selector de temas

JS_CHIPS = "document.querySelectorAll('.selector-categorias .chip-categoria').length"
JS_ESTADO = """(function(){
  var j=document.querySelector('.caja-juego:not(.oculto)'); if(!j) return {sinCaja:true};
  var r=j.getBoundingClientRect(), ex=j.querySelector('.mc-extra'), pr=j.querySelector('.pregunta');
  return {bottom:Math.round(r.bottom), vh:innerHeight, sw:document.documentElement.scrollWidth, vw:innerWidth,
          contenido:(ex?ex.innerHTML.length:0)+(pr?pr.textContent.trim().length:0)+j.querySelectorAll('.opcion,input,textarea,.palabra').length};
})()"""
# Vuelve al selector de temas sin recargar (cada página define MODO_VOLVER).
JS_VOLVER = """(function(){
  var j=document.querySelector('.caja-juego:not(.oculto)');
  if(j && typeof window.MODO_VOLVER==='function'){ window.MODO_VOLVER(); return true; } return false; })()"""


# Recorre el inicio: grado -> cada trimestre -> cada materia, y abre el mapa conceptual.
JS_INICIO = """(function(){
  var e=[], q=function(s){return document.querySelectorAll(s);},
      act=function(){return (document.querySelector('.pantalla.activa')||{}).id;},
      volver=function(){document.getElementById('btn-volver-global').click();};
  if(act()!=='pantalla-curso') return {errores:['no abrió en la pantalla de grado y trimestre (está en '+act()+')'], sobra:0};
  var p=document.getElementById('pantalla-curso'), sobra=p.scrollHeight-p.clientHeight;
  if(!q('.curso-grado:not(.en-obra)').length) e.push('ningún grado disponible');
  document.getElementById('curso-ayuda').click();
  if(!q('#modal-mapa .cmapa-celda').length) e.push('el mapa conceptual salió vacío');
  var x=document.querySelector('#modal-mapa .cmapa-cerrar'); if(x) x.click();
  var n=q('#curso-trimestres .tarjeta:not(.en-obra)').length;
  if(!n) e.push('ningún trimestre disponible');
  for(var i=0;i<n;i++){
    q('#curso-trimestres .tarjeta:not(.en-obra)')[i].click();
    if(act()!=='pantalla-menu'){ e.push('el trimestre '+(i+1)+' no abrió sus materias'); continue; }
    var m=q('#tarjetas-menu .tarjeta').length-2;   // las dos últimas son la zona de adultos
    if(m<1) e.push('el trimestre '+(i+1)+' no tiene materias');
    for(var j=0;j<m;j++){
      q('#tarjetas-menu .tarjeta')[j].click();
      if(act()!=='pantalla-materia'){ e.push('trimestre '+(i+1)+', materia '+(j+1)+': no abrió'); continue; }
      if(!q('#materia-actividades .tarjeta').length) e.push('trimestre '+(i+1)+', materia '+(j+1)+': sin actividades');
      volver();
    }
    volver();
  }
  return {errores:e, sobra:sobra};
})()"""


def decir(*a):
    print(*a, flush=True)


def probar_inicio(c, errores, avisos):
    c.log = []
    c.go(URL_BASE + "index.html", 1.2)
    d = c.js(JS_INICIO)
    if not isinstance(d, dict):
        errores.append("inicio: %s" % d)
    else:
        errores.extend("inicio: " + x for x in d["errores"])
        if d["sobra"] > 0:
            avisos.append("inicio: grado y trimestre no caben sin bajar (sobran %d px)" % d["sobra"])
    errores.extend("inicio: %s" % e for e in c.log)
    decir("  %-16s (grado, trimestres y mapa)" % "inicio")


def probar_nivel(c, nivel, paginas):
    errores, avisos = [], []
    c.go(URL_BASE + "index.html", 1.2)
    c.js("localStorage.clear(); var p=Juego.crearPerfil({nombre:'Prueba',genero:'nina',nivel:'%s'});"
         "Juego.seleccionarPerfil(p.id); 1" % nivel)
    probar_inicio(c, errores, avisos)
    for pg in paginas:
        url = URL_BASE + "paginas/%s.html" % pg
        c.log = []
        c.go(url, 1.2)
        for e in c.log:
            errores.append("%s: al cargar: %s" % (pg, e))
        if pg in SIN_TEMAS:
            decir("  %-16s (sin temas)" % pg)
            continue
        n = c.js(JS_CHIPS) or 0
        if not n:
            errores.append("%s: no pintó ningún tema" % pg)
            continue
        for i in range(n):
            peor = 0
            for _ in range(REPETICIONES):
                c.log = []
                c.js("document.querySelectorAll('.selector-categorias .chip-categoria')[%d].click()" % i)
                c.pump(0.4)
                d = c.js(JS_ESTADO)
                for e in c.log:
                    errores.append("%s tema %d: %s" % (pg, i + 1, e))
                if not isinstance(d, dict) or d.get("sinCaja"):
                    errores.append("%s tema %d: no abrió la caja de juego" % (pg, i + 1))
                    c.go(url, 0.9)
                    break
                if d["contenido"] == 0:
                    errores.append("%s tema %d: la ronda salió vacía" % (pg, i + 1))
                if d["sw"] > d["vw"] + 2:
                    errores.append("%s tema %d: desborde horizontal de %d px" % (pg, i + 1, d["sw"] - d["vw"]))
                peor = max(peor, d["bottom"] - d["vh"])
                if not c.js(JS_VOLVER):      # por si la página no tiene MODO_VOLVER: recargar
                    c.go(url, 0.9)
                c.pump(0.05)
                for e in c.log:
                    errores.append("%s tema %d (al volver): %s" % (pg, i + 1, e))
            if peor > 0:
                avisos.append("%s tema %d: no cabe sin bajar (sobran %d px)" % (pg, i + 1, peor))
        decir("  %-16s %2d temas" % (pg, n))
    return errores, avisos


def main():
    salida_utf8()
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    niveles = ["basico", "intermedio", "avanzado"] if "--todos" in sys.argv else ["intermedio"]
    if "--nivel" in sys.argv:
        niveles = [sys.argv[sys.argv.index("--nivel") + 1]]
        args = [a for a in args if a != niveles[0]]
    paginas = args or sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(RAIZ, "paginas", "*.html")))
    paginas = [p for p in paginas if p not in ("editor", "contenido")]   # zona de adultos: rebotan al menú sin clave
    total_err, total_av = [], []
    c = Chrome(w=ANCHO, h=ALTO)
    try:
        for nivel in niveles:
            decir("Nivel %s:" % nivel)
            e, a = probar_nivel(c, nivel, paginas)
            total_err += ["[%s] %s" % (nivel, x) for x in e]
            total_av += ["[%s] %s" % (nivel, x) for x in a]
    finally:
        c.cerrar()
    if total_av:
        decir("AVISOS (%d):" % len(total_av)); decir("\n".join("  " + x for x in total_av))
    if total_err:
        decir("ERRORES (%d):" % len(total_err)); decir("\n".join("  " + x for x in total_err))
        sys.exit(1)
    decir("Prueba de humo correcta: %d páginas, 0 errores%s." % (len(paginas), ", %d avisos" % len(total_av) if total_av else ""))


if __name__ == "__main__":
    main()
