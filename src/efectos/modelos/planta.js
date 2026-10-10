/* ============================================================
   MODELO 3D: LA PLANTA — src/efectos/modelos/planta.js
   Una planta completa con la tierra CORTADA al frente para que se
   vean las raíces (como en una maqueta de clase). Partes tocables:
   raiz · tallo · hoja · flor · fruto.
   Se mece suavemente con el "viento". Ver src/efectos/modelo3d.js.
   ============================================================ */
Modelo3D.registrar("planta", function (api) {
  const T = api.THREE;
  const g = new T.Group();
  const R = 1.35, H = 1.32;                 // radio y profundidad del bloque de tierra

  /* ---------- Tierra: medio cilindro al fondo y la cara cortada al frente ---------- */
  const tierra = new T.Group();
  const matTierra = api.mat("#7a5230", { roughness: 0.95 });
  const fondo = new T.Mesh(new T.CylinderGeometry(R, R * 0.9, H, 40, 1, false, Math.PI / 2, Math.PI), matTierra);
  fondo.position.y = -H / 2;
  tierra.add(fondo);
  const cara = new T.Shape();
  cara.moveTo(-R, 0); cara.lineTo(R, 0); cara.lineTo(R * 0.9, -H); cara.lineTo(-R * 0.9, -H); cara.closePath();
  const corte = new T.Mesh(new T.ShapeGeometry(cara), api.mat("#5d3c22", { roughness: 1 }));
  corte.userData.recibe = true;
  tierra.add(corte);
  const base = new T.Mesh(new T.CircleGeometry(R * 0.9, 40, Math.PI, Math.PI), matTierra);
  base.rotation.x = Math.PI / 2; base.position.y = -H;
  tierra.add(base);
  // capa oscura de tierra fértil arriba del corte
  const humus = new T.Mesh(new T.PlaneGeometry(R * 2, 0.16), api.mat("#3f2a17", { roughness: 1 }));
  humus.position.set(0, -0.08, 0.004);
  tierra.add(humus);
  // césped: medio disco arriba + un borde al frente
  const matPasto = api.mat("#63b946", { roughness: 0.9 });
  const pasto = new T.Mesh(new T.CircleGeometry(R * 1.02, 40, 0, Math.PI), matPasto);
  pasto.rotation.x = -Math.PI / 2; pasto.position.y = 0.012;
  pasto.userData.recibe = true;
  tierra.add(pasto);
  const borde = new T.Mesh(new T.BoxGeometry(R * 2.04, 0.07, 0.07), matPasto);
  borde.position.set(0, 0, 0.03);
  tierra.add(borde);
  // piedritas en el corte
  const matPiedra = api.mat("#a8a29a", { roughness: 0.9 });
  [[-0.95, -0.55, 0.09], [0.98, -0.82, 0.07], [-0.55, -1.12, 0.08], [0.42, -0.2, 0.05], [1.02, -0.3, 0.06], [-1.05, -1.0, 0.06]].forEach((p) => {
    const s = new T.Mesh(new T.SphereGeometry(p[2], 10, 8), matPiedra);
    s.position.set(p[0], p[1], 0.01); s.scale.set(1.25, 0.8, 0.5);
    tierra.add(s);
  });
  // matitas de hierba
  const matHierba = api.mat("#4fa83a", { side: T.DoubleSide, roughness: 0.9 });
  [[-0.95, -0.25], [-0.6, -0.75], [0.75, -0.55], [1.02, -0.15], [0.35, -0.95], [-0.2, -1.0]].forEach((p, i) => {
    for (let k = -1; k <= 1; k++) {
      const h = new T.Mesh(api.lamina({ largo: 0.22 + 0.05 * ((i + k + 3) % 3), ancho: 0.05, perfil: "lanza", arco: 0.7, nu: 6, nv: 2 }), matHierba);
      h.position.set(p[0] + k * 0.035, 0.01, p[1]);
      h.rotation.set(0.25, k * 1.3 + i, k * 0.35);
      tierra.add(h);
    }
  });
  g.add(tierra);

  /* ---------- Raíces (delante del corte) ---------- */
  const raices = new T.Group();
  raices.position.set(0, 0, 0.14);
  const matRaiz = api.mat("#ecd6a9", { roughness: 0.85 });
  const rz = (pts, r0, r1) => raices.add(new T.Mesh(api.tubo(pts, r0, r1, 8), matRaiz));
  rz([[0, 0.03, 0], [0.02, -0.35, 0.02], [-0.03, -0.75, 0.03], [0.01, -1.14, 0.02]], 0.095, 0.02);          // raíz principal
  rz([[0, -0.14, 0], [0.26, -0.27, 0.04], [0.58, -0.33, 0.06], [0.9, -0.5, 0.05]], 0.05, 0.013);
  rz([[0, -0.2, 0], [-0.28, -0.3, 0.04], [-0.62, -0.42, 0.06], [-0.94, -0.47, 0.04]], 0.05, 0.013);
  rz([[0, -0.44, 0], [0.3, -0.6, 0.05], [0.56, -0.86, 0.06], [0.72, -1.08, 0.04]], 0.045, 0.012);
  rz([[0, -0.52, 0], [-0.26, -0.68, 0.05], [-0.5, -0.9, 0.06], [-0.74, -1.12, 0.04]], 0.045, 0.012);
  rz([[0, -0.78, 0], [0.16, -0.96, 0.04], [0.3, -1.17, 0.03]], 0.035, 0.01);
  rz([[0, -0.84, 0], [-0.14, -1.02, 0.04], [-0.3, -1.2, 0.03]], 0.035, 0.01);
  // raicillas
  rz([[0.5, -0.32, 0.055], [0.6, -0.5, 0.06], [0.66, -0.66, 0.05]], 0.018, 0.006);
  rz([[-0.55, -0.4, 0.055], [-0.6, -0.58, 0.06], [-0.7, -0.72, 0.05]], 0.018, 0.006);
  rz([[0.45, -0.75, 0.055], [0.33, -0.9, 0.06], [0.3, -1.02, 0.05]], 0.016, 0.006);
  rz([[-0.42, -0.82, 0.055], [-0.3, -0.98, 0.06], [-0.26, -1.08, 0.05]], 0.016, 0.006);
  rz([[0.74, -0.42, 0.055], [0.92, -0.38, 0.05], [1.06, -0.44, 0.04]], 0.016, 0.006);
  rz([[-0.76, -0.44, 0.05], [-0.96, -0.6, 0.05], [-1.02, -0.74, 0.04]], 0.016, 0.006);
  g.add(raices);
  api.parte(raices, "raiz");

  /* ---------- Todo lo que está sobre la tierra se mece junto ---------- */
  const aire = new T.Group();
  g.add(aire);

  // Tallo
  const tallo = new T.Group();
  const matTallo = api.mat("#3f9d4b", { roughness: 0.7 });
  tallo.add(new T.Mesh(api.tubo([[0, -0.03, 0.14], [0.03, 0.6, 0.13], [-0.04, 1.3, 0.1], [0.02, 2.0, 0.08], [0, 2.44, 0.1]], 0.09, 0.05, 10), matTallo));
  aire.add(tallo);
  api.parte(tallo, "tallo");

  // Hojas: nacen del tallo, miran hacia arriba y caen en la punta
  const hojas = [];
  const matHoja = api.mat("#ffffff", { vertexColors: true, side: T.DoubleSide, roughness: 0.75 });
  const matNervio = api.mat("#cdeeb0", { roughness: 0.8 });
  // `giro`: cuánto se vuelve la cara de la hoja hacia quien mira (para que no se vea de canto).
  function hoja(y, azimut, largo, caida, giro) {
    const forma = { largo: largo, ancho: largo * 0.58, perfil: "hoja", arco: 0.8, copa: 0.2, onda: 0.04, c0: "#2a8a3c", c1: "#74d160", cexp: 0.8, nu: 18, nv: 8 };
    const A = new T.Group();                // gira alrededor del tallo
    A.position.set(0, y, 0.12); A.rotation.y = azimut;
    const B = new T.Group();                // se inclina hacia un lado
    B.rotation.z = -caida;
    const C = new T.Group();                // la cara de la hoja mira hacia arriba y un poco al frente
    C.rotation.y = Math.PI / 2 + giro;
    C.add(new T.Mesh(api.lamina(forma), matHoja));
    C.add(new T.Mesh(api.tubo(api.ejeLamina(forma, 8, 0.012), 0.028, 0.007, 6), matNervio));
    B.add(C); A.add(B); aire.add(A);
    api.parte(A, "hoja");
    hojas.push({ B: B, caida: caida, fase: y * 3 });
  }
  hoja(0.5, 0.1, 1.3, 1.02, -0.85);
  hoja(0.95, Math.PI - 0.15, 1.35, 1.08, 0.85);
  hoja(1.45, 0.35, 1.1, 0.92, -0.8);
  hoja(1.85, Math.PI + 0.3, 0.95, 0.88, 0.8);

  // Flor (arriba del tallo, mirando un poco al frente)
  const flor = new T.Group();
  flor.position.set(0, 2.44, 0.1);
  flor.rotation.x = 0.55;
  const matPetalo = api.mat("#ffffff", { vertexColors: true, side: T.DoubleSide, roughness: 0.6 });
  const formaPetalo = { largo: 0.78, ancho: 0.5, perfil: "petalo", arco: 0.85, copa: 0.3, c0: "#ffe1ee", c1: "#ff4f9a", cexp: 0.7, nu: 14, nv: 6 };
  const geoPetalo = api.lamina(formaPetalo);
  for (let k = 0; k < 8; k++) {
    const G = new T.Group(); G.rotation.y = (k / 8) * Math.PI * 2;
    const p = new T.Mesh(geoPetalo, matPetalo);
    p.position.set(0, 0.03, 0.1); p.rotation.x = 1.18;
    G.add(p); flor.add(G);
  }
  const boton = new T.Mesh(new T.SphereGeometry(0.23, 20, 14), api.mat("#ffc928", { roughness: 0.85 }));
  boton.scale.set(1, 0.55, 1); boton.position.y = 0.07;
  flor.add(boton);
  const caliz = new T.Mesh(new T.SphereGeometry(0.13, 14, 10), matTallo);
  caliz.scale.set(1, 0.8, 1); caliz.position.y = -0.04;
  flor.add(caliz);
  aire.add(flor);
  api.parte(flor, "flor");

  // Fruto: cuelga de una ramita
  const fruto = new T.Group();
  fruto.add(new T.Mesh(api.tubo([[0, 1.14, 0.13], [0.3, 1.3, 0.3], [0.55, 1.24, 0.42], [0.62, 1.03, 0.45]], 0.035, 0.022, 7), matTallo));
  const colgante = new T.Group();            // se balancea desde su tallito
  colgante.position.set(0.62, 1.03, 0.45);
  const bola = new T.Mesh(new T.SphereGeometry(0.28, 28, 20), api.mat("#e63b2e", { roughness: 0.32 }));
  bola.scale.set(1, 0.92, 1); bola.position.y = -0.25;
  colgante.add(bola);
  const geoSepalo = api.lamina({ largo: 0.19, ancho: 0.09, perfil: "lanza", arco: 1.5, nu: 6, nv: 2 });
  const matSepalo = api.mat("#2f8f3f", { side: T.DoubleSide });
  for (let k = 0; k < 5; k++) {
    const G = new T.Group(); G.rotation.y = (k / 5) * Math.PI * 2; G.position.y = -0.005;
    const s = new T.Mesh(geoSepalo, matSepalo); s.rotation.x = 1.25;
    G.add(s); colgante.add(G);
  }
  fruto.add(colgante);
  aire.add(fruto);
  api.parte(fruto, "fruto");

  return {
    objeto: g,
    suelo: -H,
    forma: "vertical",
    margen: 1.08,
    sombra: { radio: 2.0 },
    limites: { yaw: [-0.95, 0.95], pitch: [-0.02, 0.5] },   // el corte de la tierra siempre queda a la vista
    vista: { yaw: -0.3, pitch: 0.12 },
    vaiven: 0.13,
    anclas: {
      raiz: new T.Vector3(0.78, -0.86, 0.3),
      tallo: new T.Vector3(-0.42, 0.26, 0.3),
      flor: new T.Vector3(0.62, 2.72, 0.4),
      fruto: new T.Vector3(1.22, 0.74, 0.5)
    },
    animar: function (t) {
      aire.rotation.z = Math.sin(t * 1.05) * 0.028;          // el viento mece la planta
      hojas.forEach((h) => { h.B.rotation.z = -h.caida + Math.sin(t * 1.6 + h.fase) * 0.05; });
      flor.rotation.x = 0.55 + Math.sin(t * 1.3) * 0.045;
      colgante.rotation.z = Math.sin(t * 1.9) * 0.07;
    }
  };
});
