/* ============================================================
   MODELO 3D: FRACCIONES — src/efectos/modelos/fraccion.js
   Una PIZZA o una BARRA de chocolate partida en partes iguales.
   Cada parte se toca para "pintarla": la porción de pizza recibe su
   salsa, queso y pepperoni y se levanta; el pedazo de barra se vuelve
   de chocolate. Así "3/8" es algo que se arma con la mano.

   opts.forma: "pizza" | "barra"
   modelo.dividir(d)      vuelve a partir el entero en d partes (todas sin pintar)
   modelo.marcar(i, si)   pinta o despinta la parte i
   Cada parte es tocable con id "p0", "p1", …  Ver src/efectos/modelo3d.js.
   ============================================================ */
Modelo3D.registrar("fraccion", function (api, opts) {
  const T = api.THREE;
  const g = new T.Group();
  const esPizza = !opts || opts.forma !== "barra";
  const partes = [];                     // { grupo, lista, cruda, marcada, sube }
  const todas = new T.Group();
  g.add(todas);

  const MAT = {
    masa: api.mat("#f4e0b5", { roughness: 0.9 }),
    borde: api.mat("#d9a55c", { roughness: 0.85 }),
    salsa: api.mat("#d8482c", { roughness: 0.7 }),
    queso: api.mat("#ffd45c", { roughness: 0.6 }),
    peperoni: api.mat("#b5352a", { roughness: 0.6 }),
    tabla: api.mat("#c99f6b", { roughness: 0.8 }),
    blanco: api.mat("#f1dfb8", { roughness: 0.55 }),
    choco: api.mat("#7b4a2b", { roughness: 0.45 }),
    plato: api.mat("#6f86cf", { roughness: 0.7 })
  };

  /* ---------- La base fija: tabla de madera o plato ---------- */
  if (esPizza) {
    const tabla = new T.Mesh(new T.CylinderGeometry(1.22, 1.22, 0.07, 48), MAT.tabla);
    tabla.position.y = -0.035;
    g.add(tabla);
    const mango = new T.Mesh(new T.BoxGeometry(0.34, 0.07, 0.6), MAT.tabla);
    mango.position.set(0, -0.035, -1.42);
    g.add(mango);
  } else {
    const plato = new T.Mesh(new T.BoxGeometry(3.0, 0.06, 1.0), MAT.plato);
    plato.position.y = -0.03;
    g.add(plato);
  }

  // Sector circular (porción) entre dos ángulos y dos radios, de grosor h.
  function sector(a0, a1, r0, r1, h) {
    const s = new T.Shape(), n = Math.max(3, Math.ceil((a1 - a0) / 0.12));
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; if (i) s.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); else s.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); }
    if (r0 > 0.001) for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; s.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); }
    else s.lineTo(0, 0);
    s.closePath();
    const geo = new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 4 });
    geo.rotateX(-Math.PI / 2);            // de pie -> acostado sobre la mesa (el grosor queda hacia arriba)
    return geo;
  }

  function limpiar() {
    partes.splice(0).forEach((p, i) => {
      api.quitarParte("p" + i);
      todas.remove(p.grupo);
      p.grupo.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    });
  }

  function dividir(d) {
    limpiar();
    for (let i = 0; i < d; i++) {
      const grupo = new T.Group(), cruda = new T.Group(), lista = new T.Group();
      let dir = [0, 0];
      if (esPizza) {
        const paso = (Math.PI * 2) / d, sep = Math.min(0.03, paso * 0.08);
        const a0 = Math.PI / 2 - (i + 1) * paso + sep, a1 = Math.PI / 2 - i * paso - sep, am = (a0 + a1) / 2;
        dir = [Math.cos(am), -Math.sin(am)];
        grupo.add(new T.Mesh(sector(a0, a1, 0.86, 1.0, 0.15), MAT.borde));            // el borde tostado
        cruda.add(new T.Mesh(sector(a0, a1, 0, 0.87, 0.085), MAT.masa));               // masa sola
        lista.add(new T.Mesh(sector(a0, a1, 0, 0.87, 0.085), MAT.salsa));              // salsa…
        const queso = new T.Mesh(sector(a0 + sep, a1 - sep, d > 2 ? 0.05 : 0, 0.8, 0.02), MAT.queso);
        queso.position.y = 0.085; lista.add(queso);                                    // …queso…
        const n = d <= 4 ? 4 : d <= 8 ? 2 : 1;                                         // …y pepperoni
        for (let k = 0; k < n; k++) {
          const r = n === 1 ? 0.55 : 0.36 + (k % 2) * 0.32, a = am + (n > 2 ? (k < 2 ? -1 : 1) * paso * 0.22 : 0);
          const pp = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.025, 14), MAT.peperoni);
          pp.position.set(Math.cos(a) * r, 0.115, -Math.sin(a) * r);
          lista.add(pp);
        }
      } else {
        const largo = 2.7 / d, w = largo - 0.05, x = -1.35 + largo * (i + 0.5);
        const pieza = (mat) => {
          const gr = new T.Group();
          const base = new T.Mesh(new T.BoxGeometry(w, 0.12, 0.72), mat); base.position.y = 0.06;
          const tapa = new T.Mesh(new T.BoxGeometry(w * 0.72, 0.05, 0.5), mat); tapa.position.y = 0.145;
          gr.add(base); gr.add(tapa);
          return gr;
        };
        grupo.position.x = x;
        cruda.add(pieza(MAT.blanco));
        lista.add(pieza(MAT.choco));
      }
      lista.visible = false;
      grupo.add(cruda); grupo.add(lista);
      todas.add(grupo);
      api.parte(grupo, "p" + i);
      partes.push({ grupo: grupo, cruda: cruda, lista: lista, marcada: false, sube: 0, dir: dir, x0: grupo.position.x });
    }
  }
  function marcar(i, si) {
    const p = partes[i]; if (!p) return;
    p.marcada = !!si;
    p.lista.visible = p.marcada;
    p.cruda.visible = !p.marcada;
  }

  dividir((opts && opts.d) || 4);

  return {
    objeto: g,
    forma: esPizza ? "cuadrada" : "ancha",
    margen: esPizza ? 1.02 : 1.08,
    suelo: -0.075,
    sombra: { radio: esPizza ? 1.75 : 2.0 },
    limites: esPizza ? { pitch: [0.55, 1.2] } : { yaw: [-0.5, 0.5], pitch: [0.4, 1.0] },
    vista: esPizza ? { yaw: 0, pitch: 0.92 } : { yaw: -0.18, pitch: 0.7 },
    vaiven: 0.07,
    dividir: dividir,
    marcar: marcar,
    animar: function (t, dt) {
      // la parte pintada se levanta (y la porción de pizza se separa un poquito)
      partes.forEach((p) => {
        p.sube += ((p.marcada ? 1 : 0) - p.sube) * Math.min(1, dt * 9);
        p.grupo.position.y = p.sube * 0.11;
        if (esPizza) { p.grupo.position.x = p.dir[0] * p.sube * 0.06; p.grupo.position.z = p.dir[1] * p.sube * 0.06; }
      });
    }
  };
});
