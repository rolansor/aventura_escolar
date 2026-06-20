/* Valor posicional (gráfico) — Matemáticas (motor MC)
   Tabla de valor posicional con columnas y colores, y bloques base-10
   para componer números. */
(function () {
  const az = (a, b) => Juego.azar(a, b);
  const POS = ["unidades", "decenas", "centenas", "unidades de mil", "decenas de mil", "centenas de mil"];
  const ABREV = ["U", "D", "C", "UM", "DM", "CM"];
  const COL = ["col-u", "col-d", "col-c", "col-m", "col-dm", "col-cm"];
  const digitoEn = (num, p) => Math.floor(num / Math.pow(10, p)) % 10;
  const numDeCifras = (n) => az(Math.pow(10, n - 1), Math.pow(10, n) - 1);

  // Tabla de valor posicional (columnas con etiqueta y dígito coloreado).
  function tabla(num, hl) {
    const s = String(num), N = s.length;
    let cab = "", fil = "";
    for (let i = 0; i < N; i++) {
      const pos = N - 1 - i, cls = COL[pos] || "col-u";
      const sel = (hl != null && pos === hl) ? " vp-hl" : "";
      cab += '<div class="vp-cab ' + cls + '">' + (ABREV[pos] || "") + "</div>";
      fil += '<div class="vp-cel ' + cls + sel + '">' + s[i] + "</div>";
    }
    return '<div class="vp-tabla" style="grid-template-columns:repeat(' + N + ',1fr)">' + cab + fil + "</div>";
  }
  // Bloques base-10 (millares 🟪, centenas 🟩, decenas 🟦, unidades 🟡).
  function bloques(m, c, d, u) {
    const fila = (e, n, etq) => n ? '<div class="blk-fila"><span class="blk-e">' + e.repeat(n) + '</span> <span class="blk-etq">' + etq + "</span></div>" : "";
    return '<div class="bloques">' + fila("🟪", m, "millar") + fila("🟩", c, "centenas") + fila("🟦", d, "decenas") + fila("🟡", u, "unidades") + "</div>";
  }
  function opciones(correcta, pool) {
    const set = {}; set[correcta] = 1; const dist = [];
    Juego.mezclar(pool.slice()).forEach((x) => { x = String(x); if (!set[x]) { set[x] = 1; dist.push(x); } });
    while (dist.length < 3) { const r = String(az(0, 9)); if (!set[r]) { set[r] = 1; dist.push(r); } }
    return [String(correcta)].concat(dist.slice(0, 3));
  }

  function gDigito(cifras) {
    const num = numDeCifras(cifras), p = az(0, cifras - 1), d = digitoEn(num, p);
    const otras = []; for (let i = 0; i < cifras; i++) if (i !== p) otras.push(digitoEn(num, i));
    return { tema: "🔢 ¿Qué dígito?", html: tabla(num, p), pregunta: "¿Qué dígito está en las <b>" + POS[p] + "</b>?",
      opciones: opciones(d, otras), correcta: String(d) };
  }
  function gValor(cifras) {
    const num = numDeCifras(cifras); let p = az(0, cifras - 1), d = digitoEn(num, p);
    if (d === 0) { p = cifras - 1; d = digitoEn(num, p); }
    const valor = d * Math.pow(10, p);
    const pool = [d, Math.pow(10, p), d * Math.pow(10, Math.max(0, p - 1)), d * Math.pow(10, p + 1)];
    return { tema: "💰 ¿Cuánto vale?", html: tabla(num, p), pregunta: "¿Cuánto vale el dígito de las <b>" + POS[p] + "</b> (el " + d + ")?",
      opciones: opciones(valor, pool), correcta: String(valor) };
  }
  function gCompone(cifras) {
    const c4 = Math.min(cifras, 4);
    const u = az(0, 9), d = az(0, 9), c = az(0, 9), m = c4 >= 4 ? az(1, 9) : 0;
    const num = m * 1000 + c * 100 + d * 10 + u;
    const pool = [num + 1, num - 1, num + 10, num - 10, c * 1000 + m * 100 + d * 10 + u].filter((x) => x > 0);
    return { tema: "🧱 Componer", html: bloques(m, c, d, u), pregunta: "¿Qué número representan estos bloques?",
      opciones: opciones(num, pool), correcta: String(num) };
  }

  const N = [
    { id: 3, icono: "🔢", nombre: "Hasta centenas", desc: "3 cifras" },
    { id: 4, icono: "🔢", nombre: "Hasta miles", desc: "4 cifras" },
    { id: 5, icono: "🔢", nombre: "Hasta decenas de mil", desc: "5 cifras" },
    { id: 0, icono: "🎲", nombre: "Mixto", desc: "de 3 a 6 cifras" }
  ];
  const conNivel = (g, lvl) => () => g(lvl === 0 ? az(3, 6) : lvl);
  const temas = N.map((nv) => ({ icono: nv.icono, nombre: nv.nombre, desc: nv.desc,
    gens: [conNivel(gDigito, nv.id), conNivel(gValor, nv.id), conNivel(gCompone, nv.id)] }));

  window.ValorPosicional = MC("vp", temas);
})();
