/* ============================================================
   MODELO 3D: BLOQUES BASE 10 — src/efectos/modelos/bloques.js
   El material de valor posicional, con sus tamaños DE VERDAD:
     unidad  = cubito (1)
     decena  = barra de 10 cubitos
     centena = placa de 10 barras (100)
     millar  = cubo de 10 placas (1000)
   Así se VE que una decena son diez unidades y que un millar es enorme
   al lado de una unidad (antes eran emojis del mismo tamaño).

   opts.columnas: de izquierda a derecha, p. ej. ["um","c","d","u"].
   modelo.poner({ um, c, d, u }): deja en la mesa esa cantidad de cada pieza;
   las piezas nuevas caen rebotando y las que sobran se encogen y se van.
   Anclas (para colgar controles sobre cada columna): "um", "c", "d", "u".
   Ver src/efectos/modelo3d.js.
   ============================================================ */
Modelo3D.registrar("bloques", function (api, opts) {
  const T = api.THREE;
  const g = new T.Group();
  const columnas = (opts && opts.columnas) || ["c", "d", "u"];
  // Mismos colores que la tabla de valor posicional (U azul, D rojo, C verde, UM morado).
  const COLOR = { u: "#2e6cf6", d: "#ef5350", c: "#25c281", um: "#8a5cf6" };
  const ANCHO = { um: 2.3, c: 1.3, d: 1.8, u: 0.9 };
  const U = 0.1, HUECO = 0.3;

  /* ---------- Texturas con la cuadrícula de cubitos ---------- */
  function rejilla(nx, ny, hex) {
    const c = document.createElement("canvas");
    c.width = Math.min(256, nx * 26); c.height = Math.min(256, ny * 26);
    const x = c.getContext("2d");
    x.fillStyle = hex; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = "rgba(255,255,255,0.55)"; x.lineWidth = Math.max(1.5, c.width / nx * 0.09);
    for (let i = 0; i <= nx; i++) { const px = (i / nx) * c.width; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, c.height); x.stroke(); }
    for (let j = 0; j <= ny; j++) { const py = (j / ny) * c.height; x.beginPath(); x.moveTo(0, py); x.lineTo(c.width, py); x.stroke(); }
    x.strokeStyle = "rgba(0,0,0,0.28)"; x.lineWidth = 3; x.strokeRect(0, 0, c.width, c.height);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  }
  const cara = (nx, ny, hex) => new T.MeshStandardMaterial({ map: rejilla(nx, ny, hex), roughness: 0.55 });
  // BoxGeometry ordena sus caras así: +x, -x, +y, -y, +z, -z
  const MAT = {
    u: cara(1, 1, COLOR.u),
    d: (function () { const l = cara(1, 10, COLOR.d), t = cara(1, 1, COLOR.d); return [l, l, t, t, l, l]; })(),          // barra de pie
    c: (function () { const a = cara(10, 10, COLOR.c), l = cara(10, 1, COLOR.c); return [l, l, a, a, l, l]; })(),        // placa acostada
    um: cara(10, 10, COLOR.um)
  };
  const GEO = {
    u: new T.BoxGeometry(U, U, U),
    d: new T.BoxGeometry(U, U * 10, U),
    c: new T.BoxGeometry(U * 10, U, U * 10),
    um: new T.BoxGeometry(U * 10, U * 10, U * 10)
  };
  // Dónde va la pieza número i de cada tipo (relativo al centro de su columna, sobre la mesa).
  const LUGAR = {
    u: (i) => [((i % 3) - 1) * 0.2, U / 2, (1 - Math.floor(i / 3)) * 0.2],
    d: (i) => [(i - 4) * 0.175, U * 5, 0],
    c: (i) => [0, U / 2 + i * (U + 0.012), 0],
    um: (i) => [i < 3 ? -0.56 : 0.56, U * 5 + (i % 3) * (U * 10 + 0.02), 0]
  };
  const MAXIMO = { u: 9, d: 9, c: 9, um: 5 };

  /* ---------- Mesa y columnas ---------- */
  let total = 0;
  columnas.forEach((k) => { total += ANCHO[k]; });
  total += HUECO * (columnas.length - 1);
  const centroX = {}, grupos = {}, anclas = {};
  let x = -total / 2;
  const FONDO_Z = 1.25;
  columnas.forEach((k) => {
    centroX[k] = x + ANCHO[k] / 2;
    const tapete = new T.Mesh(new T.BoxGeometry(ANCHO[k], 0.05, FONDO_Z), api.mat("#ffffff", { roughness: 0.9 }));
    tapete.position.set(centroX[k], -0.025, 0);
    g.add(tapete);
    const franja = new T.Mesh(new T.BoxGeometry(ANCHO[k], 0.052, 0.09), api.mat(COLOR[k], { roughness: 0.7 }));
    franja.position.set(centroX[k], -0.024, FONDO_Z / 2 - 0.045);
    g.add(franja);
    const col = new T.Group();
    col.position.set(centroX[k], 0, 0);
    g.add(col);
    grupos[k] = col;
    anclas[k] = new T.Vector3(centroX[k], 0, FONDO_Z / 2);
    x += ANCHO[k] + HUECO;
  });
  // Caja invisible con el tamaño MÁXIMO: la cámara no salta cuando se añaden piezas.
  const alto = columnas.indexOf("um") >= 0 ? 3.15 : 1.05;
  const limite = new T.Mesh(new T.BoxGeometry(total + 0.1, alto + 0.1, FONDO_Z + 0.1), new T.MeshBasicMaterial());
  limite.position.set(0, (alto + 0.1) / 2 - 0.05, 0);
  limite.visible = false; limite.userData.fantasma = true;
  g.add(limite);

  /* ---------- Poner y quitar piezas ---------- */
  const piezas = { u: [], d: [], c: [], um: [] }, saliendo = [];
  let ahora = 0;
  function poner(cuentas) {
    columnas.forEach((k) => {
      const quiero = Math.max(0, Math.min(MAXIMO[k], (cuentas && cuentas[k]) || 0));
      const lista = piezas[k];
      while (lista.length < quiero) {
        const m = new T.Mesh(GEO[k], MAT[k]);
        const p = LUGAR[k](lista.length);
        m.userData = { destino: p, nace: ahora + lista.length * 0.02, alto: k === "um" ? 1.1 : 0.9 };
        m.position.set(p[0], p[1] + 2.2, p[2]);
        m.scale.setScalar(0.001);
        grupos[k].add(m); lista.push(m);
      }
      while (lista.length > quiero) {
        const m = lista.pop();
        m.userData.muere = ahora;
        saliendo.push(m);
      }
    });
  }
  function animar(t) {
    ahora = t;
    columnas.forEach((k) => {
      piezas[k].forEach((m) => {
        const d = m.userData, e = t - d.nace;
        if (e < 0) return;
        if (e > 0.75) { m.position.set(d.destino[0], d.destino[1], d.destino[2]); m.scale.setScalar(1); return; }
        // cae y rebota un poquito
        const k1 = Math.min(1, e / 0.42);
        const cae = (1 - k1) * (1 - k1) * d.alto;
        const rebote = e > 0.42 ? Math.sin(((e - 0.42) / 0.33) * Math.PI) * 0.07 * (1 - (e - 0.42) / 0.33) : 0;
        m.position.set(d.destino[0], d.destino[1] + cae + rebote, d.destino[2]);
        m.scale.setScalar(Math.min(1, 0.3 + k1));
      });
    });
    for (let i = saliendo.length - 1; i >= 0; i--) {
      const m = saliendo[i], e = t - m.userData.muere;
      if (e > 0.25) { m.parent.remove(m); saliendo.splice(i, 1); }
      else { m.scale.setScalar(Math.max(0.001, 1 - e / 0.25)); m.position.y += 0.02; }
    }
  }

  return {
    objeto: g,
    forma: "ancha",
    margen: 1.04,
    suelo: -0.06,
    sombra: { radio: total * 0.62 },
    limites: { yaw: [-0.6, 0.35], pitch: [0.22, 0.85] },
    vista: { yaw: -0.2, pitch: 0.4 },
    vaiven: 0.035,
    anclas: anclas,
    poner: poner,
    animar: animar
  };
});
