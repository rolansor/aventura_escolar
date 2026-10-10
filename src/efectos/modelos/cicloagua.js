/* ============================================================
   MODELO 3D: EL CICLO DEL AGUA — src/efectos/modelos/cicloagua.js
   Una maqueta viva: el sol calienta el mar, el vapor SUBE, se junta
   en la nube, LLUEVE sobre la montaña y el agua baja por el río o se
   METE en la tierra (el corte del frente deja ver el agua subterránea).
   Todo se mueve desde el principio: el niño LEE la maqueta para saber
   qué etiqueta va en cada "?". Al acertar una etapa, esa parte se
   anima más fuerte (activar(id)).
   Etapas / anclas: evaporacion · condensacion · precipitacion · infiltracion.
   Ver src/efectos/modelo3d.js.
   ============================================================ */
Modelo3D.registrar("cicloagua", function (api) {
  const T = api.THREE;
  const g = new T.Group();
  const X0 = -3, X1 = 3, Z0 = -1.5, Z1 = 1.5, COSTA = -0.55, FONDO = -1.05, NIVEL = -0.03;

  /* ---------- Relieve: fondo del mar, playa, colinas y montaña ---------- */
  const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const loma = (x, z, cx, cz, alto, radio) => alto * Math.exp(-((x - cx) * (x - cx) + (z - cz) * (z - cz)) / (2 * radio * radio));
  function altura(x, z) {
    if (x < COSTA) return -0.5 * suave(0, 1.1, COSTA - x) - 0.02;                 // fondo del mar
    let h = 0.05 + 0.07 * suave(0, 2.5, x - COSTA);                               // llanura que sube un poco
    h += loma(x, z, 1.85, -0.45, 1.95, 0.5);                                      // la montaña
    h += loma(x, z, 0.55, -1.0, 0.5, 0.5) + loma(x, z, 2.65, 0.75, 0.38, 0.45);   // colinas
    return h * suave(0, 0.35, x - COSTA) + 0.02;
  }
  const NX = 72, NZ = 36;
  const geoSuelo = new T.PlaneGeometry(X1 - X0, Z1 - Z0, NX, NZ);
  geoSuelo.rotateX(-Math.PI / 2);
  const pos = geoSuelo.attributes.position, colores = [];
  const C = { arena: api.color("#ecd9a4"), pasto: api.color("#74c44f"), pasto2: api.color("#4d9c3b"), roca: api.color("#8f8678"), nieve: api.color("#ffffff"), fondo: api.color("#d9c48a") };
  const tmp = new T.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = altura(x, z);
    pos.setY(i, h);
    if (h < 0) tmp.copy(C.fondo);
    else if (h < 0.09) tmp.copy(C.arena).lerp(C.pasto, suave(0.05, 0.09, h));
    else if (h < 0.9) tmp.copy(C.pasto).lerp(C.pasto2, suave(0.1, 0.9, h));
    else if (h < 1.45) tmp.copy(C.pasto2).lerp(C.roca, suave(0.9, 1.2, h));
    else tmp.copy(C.roca).lerp(C.nieve, suave(1.45, 1.6, h));
    colores.push(tmp.r, tmp.g, tmp.b);
  }
  geoSuelo.setAttribute("color", new T.Float32BufferAttribute(colores, 3));
  geoSuelo.computeVertexNormals();
  g.add(new T.Mesh(geoSuelo, api.mat("#ffffff", { vertexColors: true, roughness: 0.9 })));

  /* ---------- Paredes de la maqueta: el frente deja ver la tierra por dentro ---------- */
  function pared(perfil, color, colocar) {       // perfil: [[u, y], …] por arriba; cierra por FONDO
    const s = new T.Shape();
    s.moveTo(perfil[0][0], FONDO);
    perfil.forEach((p) => s.lineTo(p[0], p[1]));
    s.lineTo(perfil[perfil.length - 1][0], FONDO);
    s.closePath();
    const m = new T.Mesh(new T.ShapeGeometry(s), api.mat(color, { roughness: 1, side: T.DoubleSide }));
    colocar(m); g.add(m); return m;
  }
  const muestras = (a, b, n, f) => { const r = []; for (let i = 0; i <= n; i++) { const u = a + (b - a) * i / n; r.push([u, f(u)]); } return r; };
  const TIERRA = "#7a5230";
  pared(muestras(X0, COSTA, 24, (x) => altura(x, Z1)), "#d9c48a", (m) => { m.position.z = Z1; });      // bajo el mar: arena
  pared(muestras(COSTA, X1, 44, (x) => altura(x, Z1)), TIERRA, (m) => { m.position.z = Z1; });         // tierra firme
  pared(muestras(Z0, Z1, 30, (z) => altura(X1, -z)), TIERRA, (m) => { m.rotation.y = Math.PI / 2; m.position.x = X1; });
  pared(muestras(Z0, Z1, 30, (z) => altura(X0, z)), "#d9c48a", (m) => { m.rotation.y = -Math.PI / 2; m.position.x = X0; });
  pared(muestras(X0, X1, 60, (x) => altura(-x, Z0)), TIERRA, (m) => { m.rotation.y = Math.PI; m.position.z = Z0; });
  // capas del corte frontal (solo bajo la tierra firme): agua subterránea y roca
  const franja = (y0, y1, color, opc) => {
    const m = new T.Mesh(new T.PlaneGeometry(X1 - COSTA, y1 - y0), api.mat(color, opc || { roughness: 1 }));
    m.position.set((X1 + COSTA) / 2, (y0 + y1) / 2, Z1 + 0.004); g.add(m); return m;
  };
  const acuifero = franja(-0.78, -0.5, "#5aa6e6", { roughness: 0.5 });   // agua subterránea
  franja(FONDO, -0.78, "#6b6259");                                       // roca
  // ondita del agua subterránea
  const onda = new T.Mesh(api.tubo(muestras(COSTA + 0.1, X1 - 0.05, 26, (x) => -0.5 + Math.sin(x * 7) * 0.025).map((p) => [p[0], p[1], Z1 + 0.01]), 0.018, 0.018, 5, 52), api.mat("#d6ecff", { roughness: 0.6 }));
  g.add(onda);
  const base = new T.Mesh(new T.BoxGeometry(X1 - X0 + 0.16, 0.12, Z1 - Z0 + 0.16), api.mat("#e9eef9", { roughness: 0.8 }));
  base.position.y = FONDO - 0.06; g.add(base);

  /* ---------- Mar ---------- */
  const matAgua = api.mat("#39a0ea", { roughness: 0.25, transparent: true, opacity: 0.86 });
  const geoMar = new T.PlaneGeometry(COSTA + 0.3 - X0, Z1 - Z0, 18, 12);
  geoMar.rotateX(-Math.PI / 2);
  const mar = new T.Mesh(geoMar, matAgua);
  mar.position.set((X0 + COSTA + 0.3) / 2, NIVEL, 0);
  g.add(mar);
  const marY0 = geoMar.attributes.position.array.slice();
  // el agua vista de frente y de lado (volumen del mar)
  const caraMar = new T.Mesh(new T.PlaneGeometry(COSTA + 0.3 - X0, NIVEL + 0.62), api.mat("#2f8fdc", { roughness: 0.3, transparent: true, opacity: 0.8 }));
  caraMar.position.set((X0 + COSTA + 0.3) / 2, (NIVEL - 0.62) / 2, Z1 + 0.008); g.add(caraMar);
  const ladoMar = new T.Mesh(new T.PlaneGeometry(Z1 - Z0, NIVEL + 0.62), api.mat("#2f8fdc", { roughness: 0.3, transparent: true, opacity: 0.8 }));
  ladoMar.rotation.y = -Math.PI / 2; ladoMar.position.set(X0 - 0.008, (NIVEL - 0.62) / 2, 0); g.add(ladoMar);

  /* ---------- Río: baja de la montaña al mar ---------- */
  const cauce = [[1.62, -0.05], [1.35, 0.3], [1.15, 0.62], [0.7, 0.86], [0.2, 1.0], [-0.25, 0.92], [-0.62, 0.82]];
  g.add(new T.Mesh(api.tubo(cauce.map((p) => [p[0], altura(p[0], p[1]) + 0.012, p[1]]), 0.05, 0.11, 7, 44),
                   api.mat("#3ba7f0", { roughness: 0.25 })));

  /* ---------- Arbolitos ---------- */
  const matCopa = api.mat("#2f8a3a", { roughness: 0.9 }), matTronco = api.mat("#7a5230", { roughness: 1 });
  [[0.15, 0.25, 1], [0.75, 0.35, 0.85], [0.0, -0.75, 0.9], [2.45, -0.15, 1], [2.75, 0.3, 0.8], [1.0, -1.15, 0.85], [0.45, -0.25, 0.75]].forEach((a) => {
    const y = altura(a[0], a[1]), k = a[2];
    const tr = new T.Mesh(new T.CylinderGeometry(0.03 * k, 0.04 * k, 0.16 * k, 6), matTronco);
    tr.position.set(a[0], y + 0.08 * k, a[1]); g.add(tr);
    const co = new T.Mesh(new T.ConeGeometry(0.16 * k, 0.42 * k, 9), matCopa);
    co.position.set(a[0], y + 0.36 * k, a[1]); g.add(co);
  });

  /* ---------- Sol ---------- */
  const sol = new T.Group();
  sol.position.set(-2.25, 2.72, -0.5);
  sol.add(new T.Mesh(new T.SphereGeometry(0.4, 24, 16), new T.MeshBasicMaterial({ color: api.color("#ffd23f") })));
  const rayos = new T.Group();
  const matRayo = new T.MeshBasicMaterial({ color: api.color("#ffb400") });
  for (let k = 0; k < 10; k++) {
    const r = new T.Mesh(new T.ConeGeometry(0.07, 0.26, 6), matRayo);
    const a = (k / 10) * Math.PI * 2;
    r.position.set(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0); r.rotation.z = a - Math.PI / 2;
    rayos.add(r);
  }
  sol.add(rayos); g.add(sol);

  /* ---------- Nube ---------- */
  const nube = new T.Group();
  nube.position.set(0.95, 2.62, -0.3);
  const matNube = api.mat("#ffffff", { roughness: 1 });
  [[-0.58, 0, 0, 0.36], [0, 0.14, 0.02, 0.5], [0.56, 0.02, 0, 0.4], [0.26, -0.1, 0.24, 0.34], [-0.26, -0.1, 0.2, 0.32], [0.05, -0.12, -0.2, 0.36]].forEach((b) => {
    const s = new T.Mesh(new T.SphereGeometry(b[3], 18, 12), matNube);
    s.position.set(b[0], b[1], b[2]); nube.add(s);
  });
  g.add(nube);

  /* ---------- Vapor que sube del mar (evaporación) ---------- */
  const N_VAPOR = 18;
  const vapor = new T.InstancedMesh(new T.SphereGeometry(1, 10, 8), api.mat("#f4fbff", { roughness: 1, transparent: true, opacity: 0.78 }), N_VAPOR);
  const dVapor = [];
  for (let i = 0; i < N_VAPOR; i++) dVapor.push({ s: i / N_VAPOR, x0: -2.55 + (i * 0.37) % 1.5, z0: -0.7 + (i * 0.53) % 1.6, f: i * 1.7 });
  vapor.frustumCulled = false;
  g.add(vapor);

  /* ---------- Lluvia (precipitación) ---------- */
  const N_GOTAS = 34;
  const lluvia = new T.InstancedMesh(new T.SphereGeometry(1, 6, 6), api.mat("#3d8ff0", { roughness: 0.3 }), N_GOTAS);
  const dGotas = [];
  for (let i = 0; i < N_GOTAS; i++) {
    const x = 0.45 + ((i * 0.618) % 1) * 1.1, z = -0.75 + ((i * 0.37) % 1) * 0.95;
    dGotas.push({ x: x, z: z, y: 2.2 - ((i * 0.29) % 1) * 2.0, suelo: Math.max(0, altura(x, z)) });
  }
  lluvia.frustumCulled = false;
  g.add(lluvia);

  /* ---------- Gotas que se meten en la tierra (infiltración), en el corte del frente ---------- */
  const N_INF = 12;
  const infil = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), api.mat("#4aa8ff", { roughness: 0.3 }), N_INF);
  const dInf = [];
  for (let i = 0; i < N_INF; i++) { const x = -0.2 + ((i * 0.618) % 1) * 2.9; dInf.push({ x: x, k: (i * 0.41) % 1, y0: altura(x, Z1) - 0.03 }); }
  infil.frustumCulled = false;
  g.add(infil);

  /* ---------- Flechas que muestran hacia dónde va el agua ---------- */
  const matFlecha = api.mat("#1f8ae6", { roughness: 1, transparent: true, opacity: 0.8 });
  function flecha(pts, r) {
    g.add(new T.Mesh(api.tubo(pts, r, r, 6), matFlecha));
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    const punta = new T.Mesh(new T.ConeGeometry(r * 2.6, r * 6, 8), matFlecha);
    punta.position.set(b[0], b[1], b[2]);
    punta.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize());
    g.add(punta);
  }
  flecha([[-1.25, 0.3, 0.75], [-1.2, 0.9, 0.7], [-0.95, 1.5, 0.55], [-0.6, 1.95, 0.4]], 0.035);     // sube del mar
  flecha([[2.3, 2.0, 0.35], [2.32, 1.5, 0.4], [2.3, 0.95, 0.45]], 0.035);                        // cae de la nube
  flecha([[2.45, -0.05, Z1 + 0.03], [2.45, -0.25, Z1 + 0.03], [2.45, -0.42, Z1 + 0.03]], 0.03);    // entra en la tierra

  /* ---------- Animación ---------- */
  const M = new T.Matrix4(), impulso = {};
  const fuerza = (id, t) => { const t0 = impulso[id]; return t0 == null ? 0 : Math.max(0, 1 - (t - t0) / 2.6); };
  let tAhora = 0;
  function animar(t, dt) {
    tAhora = t;
    // mar: olitas
    const p = geoMar.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, Math.sin(marY0[i * 3] * 3 + t * 1.6) * 0.018 + Math.cos(marY0[i * 3 + 2] * 4 + t * 1.2) * 0.012);
    p.needsUpdate = true;
    rayos.rotation.z = t * 0.35;
    sol.scale.setScalar(1 + Math.sin(t * 2) * 0.03);

    // vapor: sube en curva hasta la nube
    const fe = fuerza("evaporacion", t);
    for (let i = 0; i < N_VAPOR; i++) {
      const d = dVapor[i];
      d.s += dt * (0.13 + 0.25 * fe);
      if (d.s > 1) d.s -= 1;
      const s = d.s, e = s * s;
      const x = d.x0 + (0.55 - d.x0) * e + Math.sin(s * 9 + d.f) * 0.07;
      const y = 0.05 + 2.4 * s;
      const z = d.z0 * (1 - s) + -0.3 * s + Math.cos(s * 7 + d.f) * 0.06;
      const r = (0.06 + 0.065 * Math.sin(Math.PI * s)) * (1 + 0.5 * fe);
      M.makeScale(r, r, r).setPosition(x, y, z);
      vapor.setMatrixAt(i, M);
    }
    vapor.instanceMatrix.needsUpdate = true;

    // nube: flota y, al acertar, se hincha
    const fc = fuerza("condensacion", t);
    nube.position.y = 2.62 + Math.sin(t * 0.9) * 0.04;
    nube.scale.setScalar(1 + fc * 0.18 * (0.6 + 0.4 * Math.sin(t * 9)));

    // lluvia
    const fp = fuerza("precipitacion", t);
    for (let i = 0; i < N_GOTAS; i++) {
      const d = dGotas[i];
      d.y -= dt * (1.9 + 1.8 * fp);
      if (d.y < d.suelo) d.y = 2.2;
      const largo = 0.075 * (1 + 0.6 * fp);
      M.makeScale(0.024, largo, 0.024).setPosition(d.x, d.y, d.z);
      lluvia.setMatrixAt(i, M);
    }
    lluvia.instanceMatrix.needsUpdate = true;

    // infiltración: las gotas bajan por dentro de la tierra hasta el agua subterránea
    const fi = fuerza("infiltracion", t);
    for (let i = 0; i < N_INF; i++) {
      const d = dInf[i];
      d.k += dt * (0.22 + 0.5 * fi);
      if (d.k > 1) d.k -= 1;
      const y = d.y0 + (-0.5 - d.y0) * d.k;
      const r = 0.03 * (1 - 0.35 * d.k) * (1 + 0.5 * fi);
      M.makeScale(r, r * 1.3, r).setPosition(d.x, y, Z1 + 0.02);
      infil.setMatrixAt(i, M);
    }
    infil.instanceMatrix.needsUpdate = true;
    acuifero.material.emissive.setRGB(0.05 * fi, 0.18 * fi, 0.35 * fi);
  }

  return {
    objeto: g,
    forma: "ancha",
    margen: 1.06,
    suelo: FONDO - 0.12,
    sombra: { radio: 3.7 },
    limites: { yaw: [-0.42, 0.42], pitch: [0.12, 0.5] },
    vista: { yaw: -0.14, pitch: 0.27 },
    vaiven: 0.05,
    anclas: {
      evaporacion: new T.Vector3(-2.2, 1.05, 0.9),
      condensacion: new T.Vector3(-0.5, 3.0, -0.2),
      precipitacion: new T.Vector3(2.55, 1.9, 0.6),
      infiltracion: new T.Vector3(1.2, -0.27, Z1 + 0.05)
    },
    activar: function (id) { impulso[id] = tAhora; },
    animar: animar
  };
});
