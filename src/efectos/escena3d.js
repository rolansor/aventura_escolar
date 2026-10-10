/* ============================================================
   ESCENA 3D de fondo — src/efectos/escena3d.js  (global: ESCENA)
   Fondo animado detrás de toda la interfaz: cielo, burbujas que
   flotan y un planeta con anillo. Incluye la celebración 3D.
   Expone: ESCENA.iniciar(), ESCENA.celebrar(), ESCENA.ahorro(bool)

   Es decoración: nunca debe competir con la actividad. Por eso
   - las burbujas son UNA sola malla instanciada (un dibujo por cuadro),
   - el detalle se limita a lo que una tablet sencilla mueve sin esfuerzo,
   - y cuando una actividad muestra su propio modelo 3D (Modelo3D) el
     fondo baja a un tercio de su ritmo con ESCENA.ahorro(true).
   ============================================================ */

const ESCENA = (function () {
  let renderer, scene, camera, reloj;
  let burbujas, datosBurbujas = [], planeta, anillo;
  let particulasFiesta = null, tiempoFiesta = 0;
  let enAhorro = false, cuadros = 0;
  const N_BURBUJAS = 90;

  function iniciar() {
    const canvas = document.getElementById("lienzo3d");
    if (!canvas) return;
    let hayGL = !!window.THREE;
    if (hayGL) {
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      } catch (e) { hayGL = false; renderer = null; }
    }
    if (!hayGL) {
      // Sin three.js o sin WebGL: un degradado bonito de respaldo.
      document.body.style.background = "linear-gradient(160deg, #2e6cf6 0%, #8a5cf6 60%, #ef5ba1 100%)";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x2e6cf6, 0.02);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 18);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const luz = new THREE.DirectionalLight(0xffffff, 0.9);
    luz.position.set(5, 8, 10);
    scene.add(luz);

    // Cielo: un gran domo de color
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(90, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0x1b3a8a, side: THREE.BackSide })
    ));

    // Planeta con anillo (decorativo)
    planeta = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4, 1),
      new THREE.MeshStandardMaterial({ color: 0x25c281, flatShading: true, roughness: 0.6 })
    );
    planeta.position.set(-9, -6, -6);
    scene.add(planeta);

    anillo = new THREE.Mesh(
      new THREE.TorusGeometry(6, 0.35, 12, 60),
      new THREE.MeshStandardMaterial({ color: 0xffc934, roughness: 0.4 })
    );
    anillo.position.copy(planeta.position);
    anillo.rotation.x = Math.PI / 2.4;
    scene.add(anillo);

    // Burbujas flotantes: una sola malla instanciada (antes eran 90 mallas sueltas).
    const colores = [0xffffff, 0xffc934, 0x8a5cf6, 0x7ef0bb, 0xef5ba1];
    burbujas = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333, roughness: 0.5 }),
      N_BURBUJAS
    );
    const c = new THREE.Color();
    for (let i = 0; i < N_BURBUJAS; i++) {
      datosBurbujas.push({
        x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 44, z: (Math.random() - 0.5) * 30 - 5,
        r: 0.18 + Math.random() * 0.35, vel: 0.4 + Math.random() * 0.8
      });
      burbujas.setColorAt(i, c.setHex(colores[i % colores.length]));
    }
    scene.add(burbujas);

    reloj = new THREE.Clock();
    window.addEventListener("resize", redimensionar);
    animar();
  }

  function redimensionar() {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  const M = window.THREE ? new THREE.Matrix4() : null;
  function animar() {
    requestAnimationFrame(animar);
    if (!renderer) return;
    // En modo ahorro solo se dibuja 1 de cada 3 cuadros (el reloj compensa el salto).
    if (enAhorro && (cuadros++ % 3)) return;
    const dt = Math.min(0.1, reloj.getDelta());
    const t = reloj.getElapsedTime();

    planeta.rotation.y += dt * 0.3;
    planeta.rotation.x += dt * 0.1;
    anillo.rotation.z += dt * 0.4;

    for (let i = 0; i < N_BURBUJAS; i++) {
      const b = datosBurbujas[i];
      b.y += b.vel * dt;
      if (b.y > 22) b.y = -22;                 // reaparece abajo
      M.makeScale(b.r, b.r, b.r).setPosition(b.x, b.y, b.z);
      burbujas.setMatrixAt(i, M);
    }
    burbujas.instanceMatrix.needsUpdate = true;
    burbujas.rotation.y = Math.sin(t * 0.05) * 0.2;

    camera.position.x = Math.sin(t * 0.1) * 1.5;
    camera.lookAt(0, 0, 0);

    actualizarFiesta(dt);
    renderer.render(scene, camera);
  }

  // true mientras una actividad muestra su propio modelo 3D (lo llama Modelo3D).
  function ahorro(si) { enAhorro = !!si; }

  /* --------- Celebración 3D: explosión de partículas --------- */
  function celebrar() {
    if (!renderer) return;
    if (particulasFiesta) { scene.remove(particulasFiesta); particulasFiesta.geometry.dispose(); particulasFiesta.material.dispose(); }

    const cantidad = 220;
    const geo = new THREE.BufferGeometry();
    const posiciones = new Float32Array(cantidad * 3);
    const velocidades = [];
    const coloresArr = new Float32Array(cantidad * 3);
    const paleta = [
      [1, 0.79, 0.2], [0.49, 0.94, 0.73], [0.54, 0.36, 0.96],
      [0.94, 0.36, 0.63], [0.18, 0.42, 0.96]
    ];

    for (let i = 0; i < cantidad; i++) {
      posiciones[i * 3] = 0;
      posiciones[i * 3 + 1] = 2;
      posiciones[i * 3 + 2] = 6;
      velocidades.push(new THREE.Vector3(
        (Math.random() - 0.5) * 18,
        Math.random() * 14 + 4,
        (Math.random() - 0.5) * 10
      ));
      const c = paleta[i % paleta.length];
      coloresArr[i * 3] = c[0];
      coloresArr[i * 3 + 1] = c[1];
      coloresArr[i * 3 + 2] = c[2];
    }
    geo.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(coloresArr, 3));
    const mat = new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true });
    particulasFiesta = new THREE.Points(geo, mat);
    particulasFiesta.userData.velocidades = velocidades;
    scene.add(particulasFiesta);
    tiempoFiesta = 2.2;
  }

  function actualizarFiesta(dt) {
    if (!particulasFiesta || tiempoFiesta <= 0) return;
    tiempoFiesta -= dt;
    const pos = particulasFiesta.geometry.attributes.position.array;
    const vel = particulasFiesta.userData.velocidades;
    for (let i = 0; i < vel.length; i++) {
      vel[i].y -= 18 * dt; // gravedad
      pos[i * 3] += vel[i].x * dt;
      pos[i * 3 + 1] += vel[i].y * dt;
      pos[i * 3 + 2] += vel[i].z * dt;
    }
    particulasFiesta.geometry.attributes.position.needsUpdate = true;
    particulasFiesta.material.opacity = Math.max(0, tiempoFiesta / 2.2);
    if (tiempoFiesta <= 0) {
      scene.remove(particulasFiesta);
      particulasFiesta.geometry.dispose(); particulasFiesta.material.dispose();
      particulasFiesta = null;
    }
  }

  return { iniciar, celebrar, ahorro };
})();
window.ESCENA = ESCENA;
