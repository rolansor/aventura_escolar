#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cdp.py — cliente MÍNIMO del protocolo DevTools de Chrome (solo librería estándar).

Sirve para probar el juego de verdad, sin instalar nada: lanza un Chrome/Edge
SIN ventana con un perfil temporal (así no toca los perfiles ni el progreso
reales del niño), abre las páginas por file:// y permite:
  - leer errores de consola (c.log),
  - ejecutar JavaScript en la página (c.js("...")),
  - hacer capturas (c.shot("ruta.png")),
  - simular el ratón (c.arrastrar(a, b), c.clic(x, y)).

Lo usan herramientas/humo.py (prueba de humo) y cualquier script de prueba.

Ejemplo:
    from cdp import Chrome, URL_BASE
    c = Chrome()
    try:
        c.go(URL_BASE + "paginas/senala.html")
        print(c.js("document.title"), c.log)
    finally:
        c.cerrar()
"""

import base64
import json
import os
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL_BASE = "file:///" + RAIZ.replace("\\", "/").lstrip("/") + "/"

CANDIDATOS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
]


def encontrar_navegador():
    """Ruta de Chrome/Edge. Se puede forzar con la variable de entorno NAVEGADOR."""
    forzado = os.environ.get("NAVEGADOR")
    if forzado and os.path.exists(forzado):
        return forzado
    for ruta in CANDIDATOS:
        if os.path.exists(ruta):
            return ruta
    for nombre in ("chrome", "google-chrome", "chromium", "msedge"):
        ruta = shutil.which(nombre)
        if ruta:
            return ruta
    raise RuntimeError("No encontré Chrome ni Edge. Define la variable NAVEGADOR con la ruta del ejecutable.")


def salida_utf8():
    """La consola de Windows suele ser cp1252 y los emojis rompen print()."""
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


class _WS:
    """WebSocket de cliente, lo justo para hablar con DevTools."""

    def __init__(self, url):
        assert url.startswith("ws://")
        hostport, ruta = url[5:].split("/", 1)
        host, puerto = hostport.split(":")
        self.s = socket.create_connection((host, int(puerto)))
        clave = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall(("GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
                        "Sec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n" % (ruta, hostport, clave)).encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)
        self.buf = buf.split(b"\r\n\r\n", 1)[1]

    def _leer(self, n):
        while len(self.buf) < n:
            trozo = self.s.recv(1 << 16)
            if not trozo:
                raise EOFError
            self.buf += trozo
        d, self.buf = self.buf[:n], self.buf[n:]
        return d

    def enviar(self, txt):
        d = txt.encode()
        cab = bytearray([0x81])
        n = len(d)
        if n < 126:
            cab.append(0x80 | n)
        elif n < 65536:
            cab.append(0x80 | 126); cab += struct.pack(">H", n)
        else:
            cab.append(0x80 | 127); cab += struct.pack(">Q", n)
        m = os.urandom(4)
        cab += m
        self.s.sendall(bytes(cab) + bytes(b ^ m[i % 4] for i, b in enumerate(d)))

    def recibir(self):
        out = b""
        while True:
            b1, b2 = self._leer(2)
            fin, op, n = b1 & 0x80, b1 & 0x0F, b2 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._leer(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._leer(8))[0]
            d = self._leer(n)
            if op == 9:      # ping
                continue
            if op == 8:      # cierre
                raise EOFError
            out += d
            if fin:
                return out.decode("utf-8", "replace")


class Chrome:
    def __init__(self, w=1280, h=860, puerto=None):
        self.dir = tempfile.mkdtemp(prefix="aventura_cdp_")
        self.puerto = puerto or (9300 + os.getpid() % 500)
        self.p = subprocess.Popen(
            [encontrar_navegador(), "--headless=new", "--remote-debugging-port=%d" % self.puerto,
             "--user-data-dir=" + self.dir, "--window-size=%d,%d" % (w, h), "--no-first-run",
             "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
             "--mute-audio", "--allow-file-access-from-files", "about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        pestanas = None
        for _ in range(80):
            try:
                pestanas = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json" % self.puerto))
                break
            except Exception:
                time.sleep(0.25)
        if not pestanas:
            self.p.kill()
            raise RuntimeError("El navegador no respondió en el puerto %d." % self.puerto)
        pagina = [t for t in pestanas if t["type"] == "page"][0]
        self.ws = _WS(pagina["webSocketDebuggerUrl"])
        self.id = 0
        self.log = []          # errores y avisos de consola acumulados
        for m in ("Page.enable", "Runtime.enable", "Log.enable"):
            self.cmd(m)

    # ---- protocolo ----
    def cmd(self, metodo, **params):
        self.id += 1
        mid = self.id
        self.ws.enviar(json.dumps({"id": mid, "method": metodo, "params": params}))
        while True:
            m = json.loads(self.ws.recibir())
            if m.get("id") == mid:
                return m.get("result", m)
            self._evento(m)

    def _evento(self, m):
        me = m.get("method")
        if me == "Runtime.exceptionThrown":
            d = m["params"]["exceptionDetails"]
            self.log.append("EXCEPCIÓN: " + (d.get("exception", {}).get("description") or d.get("text", ""))[:400])
        elif me == "Runtime.consoleAPICalled" and m["params"]["type"] in ("error", "warning"):
            txt = " ".join(str(a.get("value", a.get("description", ""))) for a in m["params"]["args"])
            self.log.append(m["params"]["type"].upper() + ": " + txt[:400])
        elif me == "Log.entryAdded" and m["params"]["entry"]["level"] == "error":
            e = m["params"]["entry"]
            self.log.append("LOG: " + e["text"][:300] + " " + e.get("url", ""))

    def pump(self, segs):
        """Deja pasar el tiempo atendiendo eventos (errores de consola, etc.)."""
        self.ws.s.settimeout(0.2)
        fin = time.time() + segs
        while time.time() < fin:
            try:
                self._evento(json.loads(self.ws.recibir()))
            except (socket.timeout, TimeoutError):
                pass
        self.ws.s.settimeout(None)

    # ---- atajos ----
    def go(self, url, espera=1.5):
        self.cmd("Page.navigate", url=url)
        self.pump(espera)

    def js(self, expr):
        r = self.cmd("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
        if "exceptionDetails" in r:
            det = r["exceptionDetails"]
            return "JSERR: " + str(det.get("exception", {}).get("description", det))[:400]
        return r.get("result", {}).get("value")

    def shot(self, ruta, clip=None):
        kw = {"format": "png"}
        if clip:
            kw["clip"] = dict(clip, scale=1)
        r = self.cmd("Page.captureScreenshot", **kw)
        with open(ruta, "wb") as fh:
            fh.write(base64.b64decode(r["data"]))

    def caja(self, selector):
        """Rectángulo {x,y,width,height} del primer elemento que cumple el selector."""
        return self.js("(function(){var e=document.querySelector(%s); if(!e) return null;"
                       "var r=e.getBoundingClientRect(); return {x:r.left,y:r.top,width:r.width,height:r.height};})()"
                       % json.dumps(selector))

    def centro(self, expr):
        """Centro {x,y} del elemento que devuelve la expresión JS `expr`."""
        return self.js("(function(){var e=%s; if(!e) return null; var r=e.getBoundingClientRect();"
                       "return {x:r.left+r.width/2,y:r.top+r.height/2};})()" % expr)

    def clic(self, x, y):
        self.cmd("Input.dispatchMouseEvent", type="mouseMoved", x=x, y=y)
        self.cmd("Input.dispatchMouseEvent", type="mousePressed", x=x, y=y, button="left", clickCount=1)
        self.cmd("Input.dispatchMouseEvent", type="mouseReleased", x=x, y=y, button="left", clickCount=1)

    def arrastrar(self, a, b, pasos=8):
        """Arrastra con el ratón desde el punto a hasta el punto b ({x,y})."""
        self.cmd("Input.dispatchMouseEvent", type="mousePressed", x=a["x"], y=a["y"], button="left", clickCount=1)
        for k in range(1, pasos + 1):
            self.cmd("Input.dispatchMouseEvent", type="mouseMoved", button="left", buttons=1,
                     x=a["x"] + (b["x"] - a["x"]) * k / pasos, y=a["y"] + (b["y"] - a["y"]) * k / pasos)
        self.cmd("Input.dispatchMouseEvent", type="mouseReleased", x=b["x"], y=b["y"], button="left", clickCount=1)

    def movil(self, w=390, h=844):
        """Emula un celular (pantalla táctil)."""
        self.cmd("Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=2, mobile=True)
        self.cmd("Emulation.setTouchEmulationEnabled", enabled=True)

    def cerrar(self):
        try:
            self.cmd("Browser.close")
        except Exception:
            pass
        try:
            self.p.wait(5)
        except Exception:
            self.p.kill()
        shutil.rmtree(self.dir, ignore_errors=True)
