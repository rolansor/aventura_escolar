/* ============================================================
   MODELO 3D: LA FLOR POR DENTRO — src/efectos/modelos/flor.js
   Una flor abierta para mirar dentro, con la anatomía en su sitio:
     · sépalos  — hojitas verdes DEBAJO de los pétalos (el cáliz)
     · pétalos  — la corola de colores
     · estambres — hilitos con una bolsita de polen (antera) en la punta
     · pistilo  — al centro: ovario abajo, estilo y estigma arriba
     · tallo y hoja
   Al aparecer, la flor se ABRE (los pétalos arrancan cerrados).
   Ver src/efectos/modelo3d.js.
   ============================================================ */
Modelo3D.registrar("flor", function (api) {
  const T = api.THREE;
  const g = new T.Group();
  const matVerde = api.mat("#3f9d4b", { roughness: 0.7 });

  /* ---------- Tallo (con el receptáculo donde se asienta la flor) ---------- */
  const tallo = new T.Group();
  tallo.add(new T.Mesh(api.tubo([[0.05, -1.5, 0], [0.08, -1.05, 0.03], [-0.03, -0.55, 0], [0, -0.1, 0]], 0.075, 0.06, 10), matVerde));
  const receptaculo = new T.Mesh(api.torno([[0.0, -0.16], [0.07, -0.14], [0.15, -0.05], [0.17, 0.03], [0.12, 0.07], [0, 0.08]], 24), matVerde);
  tallo.add(receptaculo);
  g.add(tallo);
  api.parte(tallo, "tallo");

  /* ---------- Hoja ---------- */
  const matHoja = api.mat("#ffffff", { vertexColors: true, side: T.DoubleSide, roughness: 0.75 });
  const matNervio = api.mat("#cdeeb0", { roughness: 0.8 });
  const hojas = [];
  function hoja(y, azimut, largo, caida) {
    const forma = { largo: largo, ancho: largo * 0.48, perfil: "hoja", arco: 0.9, copa: 0.22, onda: 0.04, c0: "#2a8a3c", c1: "#74d160", cexp: 0.8, nu: 18, nv: 8 };
    const A = new T.Group(); A.position.set(0.04, y, 0); A.rotation.y = azimut;
    const B = new T.Group(); B.rotation.z = -caida;
    const m = new T.Mesh(api.lamina(forma), matHoja); m.rotation.y = Math.PI / 2;
    const n = new T.Mesh(api.tubo(api.ejeLamina(forma, 8, 0.012), 0.024, 0.006, 6), matNervio); n.rotation.y = Math.PI / 2;
    B.add(m); B.add(n); A.add(B); g.add(A);
    api.parte(A, "hoja");
    hojas.push({ B: B, caida: caida, fase: y * 2 });
  }
  hoja(-1.1, 0.3, 0.95, 1.05);
  hoja(-0.8, Math.PI + 0.1, 0.78, 1.0);

  /* ---------- Sépalos: 5 hojitas verdes que salen por debajo de los pétalos ---------- */
  const sepalos = new T.Group();
  const geoSepalo = api.lamina({ largo: 0.7, ancho: 0.34, perfil: "sepalo", arco: 0.9, copa: 0.25, c0: "#2e7d32", c1: "#66c257", nu: 10, nv: 5 });
  const matSepalo = api.mat("#ffffff", { vertexColors: true, side: T.DoubleSide, roughness: 0.75 });
  for (let k = 0; k < 5; k++) {
    const G = new T.Group(); G.rotation.y = (k / 5) * Math.PI * 2 + 0.3; G.position.y = -0.02;
    const s = new T.Mesh(geoSepalo, matSepalo);
    s.position.z = 0.1; s.rotation.x = 1.5;          // casi horizontales y curvados hacia abajo
    G.add(s); sepalos.add(G);
  }
  g.add(sepalos);
  api.parte(sepalos, "sepalo");

  /* ---------- Pétalos: 6, en copa abierta ---------- */
  const petalos = new T.Group();
  const matPetalo = api.mat("#ffffff", { vertexColors: true, side: T.DoubleSide, roughness: 0.55 });
  const geoPetalo = api.lamina({ largo: 1.3, ancho: 1.0, perfil: "petalo", arco: 0.7, copa: 0.34, onda: 0.05,
                                 c0: "#fff3c4", c1: "#b24fe8", cexp: 0.55, nu: 18, nv: 10 });
  const bisagras = [];
  for (let k = 0; k < 6; k++) {
    const G = new T.Group(); G.rotation.y = (k / 6) * Math.PI * 2; G.position.y = 0.04;
    const p = new T.Mesh(geoPetalo, matPetalo);
    p.position.z = 0.09;
    G.add(p); petalos.add(G);
    bisagras.push(p);
  }
  g.add(petalos);
  api.parte(petalos, "petalo");

  /* ---------- Estambres: filamento + antera con polen ---------- */
  const estambres = new T.Group();
  const matFilamento = api.mat("#f6efc0", { roughness: 0.7 });
  const matAntera = api.mat("#f2a007", { roughness: 0.9 });
  for (let k = 0; k < 6; k++) {
    const G = new T.Group(); G.rotation.y = (k / 6) * Math.PI * 2 + Math.PI / 6;     // entre pétalo y pétalo
    G.add(new T.Mesh(api.tubo([[0, 0.08, 0.1], [0, 0.4, 0.2], [0, 0.66, 0.38], [0, 0.84, 0.5]], 0.024, 0.014, 6), matFilamento));
    const a = new T.Mesh(new T.SphereGeometry(0.075, 12, 10), matAntera);
    a.scale.set(0.8, 1.7, 0.8); a.position.set(0, 0.9, 0.53); a.rotation.x = 0.9;
    G.add(a); estambres.add(G);
  }
  g.add(estambres);
  api.parte(estambres, "estambre");

  /* ---------- Pistilo: ovario (abajo), estilo y estigma (arriba) ---------- */
  const pistilo = new T.Group();
  const matPistilo = api.mat("#9ccc55", { roughness: 0.6 });
  pistilo.add(new T.Mesh(api.torno([[0, 0.06], [0.1, 0.08], [0.17, 0.2], [0.16, 0.32], [0.08, 0.44], [0.045, 0.5]], 24), matPistilo));
  pistilo.add(new T.Mesh(api.tubo([[0, 0.48, 0], [0.01, 0.8, 0], [0, 1.12, 0]], 0.045, 0.034, 8), matPistilo));
  const matEstigma = api.mat("#ffe066", { roughness: 0.9 });
  const estigma = new T.Mesh(new T.SphereGeometry(0.085, 14, 10), matEstigma);
  estigma.position.y = 1.15; estigma.scale.set(1, 0.75, 1);
  pistilo.add(estigma);
  for (let k = 0; k < 3; k++) {            // los tres lóbulos pegajosos del estigma
    const l = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), matEstigma);
    const a = (k / 3) * Math.PI * 2;
    l.position.set(Math.cos(a) * 0.07, 1.19, Math.sin(a) * 0.07);
    pistilo.add(l);
  }
  g.add(pistilo);
  api.parte(pistilo, "pistilo");

  const ABIERTA = 0.92, CERRADA = 0.14;     // inclinación de cada pétalo respecto al centro
  function abrir(k) { bisagras.forEach((p) => { p.rotation.x = CERRADA + (ABIERTA - CERRADA) * k; }); }
  abrir(1);                                  // la caja de encuadre se calcula con la flor abierta

  return {
    objeto: g,
    forma: "cuadrada",
    margen: 0.93,
    sombra: { radio: 1.2 },
    limites: { pitch: [-0.3, 0.95] },        // se puede mirar desde abajo (sépalos) y desde arriba (centro)
    vista: { yaw: 0.35, pitch: 0.42 },
    vaiven: 0.16,
    anclas: {
      petalo: new T.Vector3(-1.05, 0.72, 0.5),
      sepalo: new T.Vector3(0.62, -0.3, 0.45),
      estambre: new T.Vector3(0.95, 1.2, 0.3),
      pistilo: new T.Vector3(-0.45, 1.42, 0),
      tallo: new T.Vector3(-0.35, -0.6, 0.2)
    },
    animar: function (t) {
      // se abre al aparecer (rebota un poquito) y luego "respira"
      const k = Math.min(1, t / 1.6);
      const suave = 1 - Math.pow(1 - k, 3);
      abrir(suave + Math.sin(t * 1.1) * 0.025 * suave);
      hojas.forEach((h) => { h.B.rotation.z = -h.caida + Math.sin(t * 1.5 + h.fase) * 0.05; });
      estambres.children.forEach((G, i) => { G.rotation.z = Math.sin(t * 1.8 + i) * 0.02; });
    }
  };
});
