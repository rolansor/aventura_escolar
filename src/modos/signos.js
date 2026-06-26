/* ============================================================
   PON EL SIGNO — Lengua (motor manipulativo: toque)
   Se muestra una oración con un hueco ▢ y el niño TOCA el signo
   de puntuación correcto entre varias opciones. El material se
   autocorrige: el signo correcto encaja en verde; el incorrecto
   pide reintentar. El catálogo escala con Juego.nivelIdx():
     · básico:     signo FINAL (. ? !)
     · intermedio: signos de APERTURA (¿ ¡) al inicio
     · avanzado:   COMA en enumeraciones o vocativo
   ============================================================ */
(function () {
  // Bancos por nivel [básico, intermedio, avanzado]. Español del Ecuador, ~9 años.
  // La frase mostrada es:  antes + "▢" + despues  y el niño elige el signo.
  const BANCO = [
    // ---- básico: signo final ----
    [
      { antes: "Hoy es un día muy bonito", despues: "", correcto: ".", opciones: [".", "?", "!"] },
      { antes: "Qué rico está el almuerzo", despues: "", correcto: "!", opciones: [".", "!", "?"] },
      { antes: "Cómo te llamas", despues: "", correcto: "?", opciones: ["?", ".", "!"] },
      { antes: "Mi perro se llama Toby", despues: "", correcto: ".", opciones: [".", "!", "?"] },
      { antes: "Cuántos años tienes", despues: "", correcto: "?", opciones: ["?", "!", "."] },
      { antes: "Qué lindo está el paisaje", despues: "", correcto: "!", opciones: ["!", "?", "."] },
      { antes: "En vacaciones fuimos a la playa", despues: "", correcto: ".", opciones: [".", "?", "!"] },
      { antes: "Me gusta jugar con mis amigos", despues: "", correcto: ".", opciones: [".", "?", "!"] },
      { antes: "Qué emoción ver el mar", despues: "", correcto: "!", opciones: ["!", "?", "."] },
      { antes: "Dónde está mi cuaderno", despues: "", correcto: "?", opciones: ["?", ".", "!"] },
      { antes: "Hoy comimos encebollado", despues: "", correcto: ".", opciones: [".", "!", "?"] },
      { antes: "Quieres un poco de jugo", despues: "", correcto: "?", opciones: ["?", "!", "."] },
      { antes: "Qué grande es ese árbol", despues: "", correcto: "!", opciones: ["!", "?", "."] },
      { antes: "La maestra revisó la tarea", despues: "", correcto: ".", opciones: [".", "?", "!"] }
    ],
    // ---- intermedio: signos de apertura ¿ ¡ ----
    [
      { antes: "", despues: "Cómo estás?", correcto: "¿", opciones: ["¿", "¡", "-"] },
      { antes: "", despues: "Qué linda mañana!", correcto: "¡", opciones: ["¡", "¿", "-"] },
      { antes: "", despues: "Dónde vives?", correcto: "¿", opciones: ["¿", "¡", "-"] },
      { antes: "", despues: "Qué rica está la fruta!", correcto: "¡", opciones: ["¡", "¿", "-"] },
      { antes: "", despues: "Quieres jugar conmigo?", correcto: "¿", opciones: ["¿", "¡", "-"] },
      { antes: "", despues: "Cuidado con el escalón!", correcto: "¡", opciones: ["¡", "¿", "-"] },
      { antes: "", despues: "A qué hora llegamos?", correcto: "¿", opciones: ["¿", "¡", "-"] },
      { antes: "", despues: "Te gusta el helado?", correcto: "¿", opciones: ["¿", "¡", "-"] },
      { antes: "", despues: "Qué día tan caluroso!", correcto: "¡", opciones: ["¡", "¿", "-"] },
      { antes: "", despues: "Cuándo es tu cumpleaños?", correcto: "¿", opciones: ["¿", "¡", "-"] },
      { antes: "", despues: "Qué susto me diste!", correcto: "¡", opciones: ["¡", "¿", "-"] },
      { antes: "", despues: "Has visto a mi gato?", correcto: "¿", opciones: ["¿", "¡", "-"] },
      { antes: "", despues: "Vamos a la cancha!", correcto: "¡", opciones: ["¡", "¿", "-"] },
      { antes: "", despues: "Por qué lloras?", correcto: "¿", opciones: ["¿", "¡", "-"] }
    ],
    // ---- avanzado: coma (enumeración o vocativo) ----
    [
      { antes: "Compré manzanas", despues: "peras y uvas", correcto: ",", opciones: [",", ".", ";"] },
      { antes: "Nelson", despues: "ven a comer", correcto: ",", opciones: [",", ".", "!"] },
      { antes: "En el zoológico vi monos", despues: "tigres y loros", correcto: ",", opciones: [",", ".", ";"] },
      { antes: "Mamá", despues: "ya terminé la tarea", correcto: ",", opciones: [",", ".", "?"] },
      { antes: "Necesito lápices", despues: "cuadernos y borradores", correcto: ",", opciones: [",", ";", "."] },
      { antes: "Profe", despues: "puedo pasar al baño", correcto: ",", opciones: [",", ".", "?"] },
      { antes: "Ecuador tiene costa", despues: "sierra y oriente", correcto: ",", opciones: [",", ".", ";"] },
      { antes: "Tengo cuadernos", despues: "lápices y reglas", correcto: ",", opciones: [",", ".", ";"] },
      { antes: "Abuelita", despues: "ya llegamos a casa", correcto: ",", opciones: [",", ".", "!"] },
      { antes: "En el mercado venden papas", despues: "choclos y habas", correcto: ",", opciones: [",", ".", ";"] },
      { antes: "Carlos", despues: "trae la pelota", correcto: ",", opciones: [",", ".", "?"] },
      { antes: "Vi gallinas", despues: "patos y chanchos", correcto: ",", opciones: [",", ".", ";"] },
      { antes: "Doctor", despues: "me duele la cabeza", correcto: ",", opciones: [",", ".", "?"] },
      { antes: "Comimos arroz", despues: "menestra y carne", correcto: ",", opciones: [",", ".", ";"] }
    ]
  ];

  function ronda(host, ctrl) {
    const niv = Juego.nivelIdx();
    const item = ctrl.azarEl(BANCO[niv]);

    ctrl.pregunta("¿Qué signo va en el ▢? Tócalo 👇");

    // Frase con el hueco resaltado.
    const frase = document.createElement("p");
    frase.className = "signo-frase";
    const antes = document.createTextNode(item.antes ? item.antes + " " : "");
    const hueco = document.createElement("span");
    hueco.className = "signo-hueco";
    hueco.textContent = "▢";
    const despues = document.createTextNode(item.despues ? " " + item.despues : "");
    frase.appendChild(antes);
    frase.appendChild(hueco);
    frase.appendChild(despues);
    host.appendChild(frase);

    // Botones de signos (reutilizan .ord-chip).
    const fila = document.createElement("div");
    fila.className = "signo-opciones";
    ctrl.mezclar(item.opciones.slice()).forEach((sig) => {
      const b = document.createElement("button");
      b.className = "ord-chip";
      b.textContent = sig;
      b.onclick = () => {
        if (sig === item.correcto) {
          hueco.textContent = sig;
          hueco.classList.add("signo-ok");
          b.classList.add("ok");
          fila.querySelectorAll(".ord-chip").forEach((x) => (x.disabled = true));
          ctrl.ganar();
        } else {
          b.classList.add("rojo");
          ctrl.reintento("Ese no; fíjate en la entonación 👀");
        }
      };
      fila.appendChild(b);
    });
    host.appendChild(fila);
  }

  window.Signos = Actividad("signo", [
    { icono: "❓", nombre: "Pon el signo", desc: "Signos de puntuación", total: 8, ronda: ronda }
  ]);
})();
