/* =========================================================
   Dulce Suspiro · interacciones
   - Escala de los lienzos (1920 escritorio / 430 móvil)
   - Navegación con desplazamiento suave
   - Carrusel infinito con parallax de limones
   - Tarjetas de ocasión especial que se deslizan al abrir
   - Formulario por pasos: 1 → 2 → 3 → enviado
   ========================================================= */

const escritorio = document.getElementById('escritorio');
const movil = document.getElementById('movil');
const PUNTO_DE_CORTE = 768;

/* ---------- Escala: el diseño se ve igual en cualquier pantalla ---------- */
function ajustarEscala() {
  const ancho = document.documentElement.clientWidth;
  if (ancho >= PUNTO_DE_CORTE) {
    escritorio.style.zoom = ancho / 1920;
    movil.style.zoom = '';
  } else {
    movil.style.zoom = ancho / 430;
    escritorio.style.zoom = '';
  }
}
ajustarEscala();
window.addEventListener('resize', ajustarEscala);

function lienzoActivo() {
  return document.documentElement.clientWidth >= PUNTO_DE_CORTE ? escritorio : movil;
}

/* ---------- Navegación: header, botón principal y pie de página ---------- */
document.querySelectorAll('[data-destino]').forEach((enlace) => {
  enlace.addEventListener('click', (evento) => {
    evento.preventDefault();
    const destino = lienzoActivo().querySelector(`[data-ancla="${enlace.dataset.destino}"]`);
    if (destino) destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---------- Carrusel de pasteles de temporada ---------- */
// Escritorio: 4 posiciones como en Figma. La 1 y la 4 son copias,
// así al llegar a ellas se salta sin animación y el bucle es infinito.
(function carruselEscritorio() {
  const carrusel = escritorio.querySelector('[data-carrusel="escritorio"]');
  const pista = carrusel.querySelector('.pista');
  const limones = carrusel.querySelector('.limones');
  const PASO_PISTA = 1505.67;   // 4 tarjetas
  const PASO_LIMONES = 501;     // parallax: los limones se mueven un tercio
  let posicion = 2;             // la página muestra la posición 2 (tarjetas 1-4)
  let ocupado = false;

  function pintar(animar) {
    const transicion = animar ? '' : 'none';
    pista.style.transition = transicion;
    limones.style.transition = transicion;
    pista.style.transform = `translateX(${-PASO_PISTA * (posicion - 1)}px)`;
    limones.style.transform = `translateX(${-1002 - PASO_LIMONES * (posicion - 1)}px)`;
  }

  function mover(direccion) {
    if (ocupado) return;
    ocupado = true;
    posicion += direccion;
    pintar(true);
    setTimeout(() => {
      if (posicion === 4) { posicion = 2; pintar(false); }
      if (posicion === 1) { posicion = 3; pintar(false); }
      // forzar el repintado antes de reactivar la transición
      void pista.offsetWidth;
      ocupado = false;
    }, 620);
  }

  carrusel.querySelector('.flecha-derecha').addEventListener('click', () => mover(1));
  carrusel.querySelector('.flecha-izquierda').addEventListener('click', () => mover(-1));
  pintar(false);
})();

// Móvil: una tarjeta por vista, 8 posiciones; al final vuelve al inicio.
(function carruselMovil() {
  const carrusel = movil.querySelector('[data-carrusel="movil"]');
  const pista = carrusel.querySelector('.pista');
  const limones = carrusel.querySelector('.limones');
  const total = pista.children.length;
  let indice = 0;

  function pintar() {
    pista.style.transform = `translateX(${-320 * indice}px)`;
    limones.style.transform = `translateX(${-80 - 90 * indice}px)`;
  }
  carrusel.querySelector('.flecha-derecha').addEventListener('click', () => {
    indice = (indice + 1) % total; pintar();
  });
  carrusel.querySelector('.flecha-izquierda').addEventListener('click', () => {
    indice = (indice - 1 + total) % total; pintar();
  });
  pintar();
})();

/* ---------- Ocasión especial (escritorio): la flecha abre la tarjeta ---------- */
escritorio.querySelectorAll('.tarjeta-ocasion').forEach((tarjeta) => {
  tarjeta.querySelector('.flecha-ocasion').addEventListener('click', () => {
    tarjeta.classList.remove('cerrada');
    tarjeta.classList.add('abierta');
  });
});

/* ---------- Formulario por pasos ---------- */
document.querySelectorAll('.formulario').forEach((formulario) => {
  const eleccion = { tamano: null, sabor: null, relleno: null, decoracion: null };

  // selección única por grupo (tarjetas de tamaño y chips)
  formulario.querySelectorAll('[data-grupo]').forEach((opcion) => {
    opcion.addEventListener('click', () => {
      const grupo = opcion.dataset.grupo;
      formulario.querySelectorAll(`[data-grupo="${grupo}"]`).forEach((o) => o.classList.remove('seleccionado'));
      opcion.classList.add('seleccionado');
      eleccion[grupo] = opcion.dataset.valor || opcion.textContent.trim();
      actualizarResumen();
    });
  });

  // campos: estado "completado" cuando tienen texto
  formulario.querySelectorAll('.campo input').forEach((campo) => {
    campo.addEventListener('input', () => {
      campo.closest('.campo').classList.toggle('completado', campo.value.trim() !== '');
    });
  });

  function actualizarResumen() {
    const partes = [eleccion.tamano, eleccion.sabor, eleccion.relleno, eleccion.decoracion].filter(Boolean);
    if (partes.length) formulario.querySelector('.detalle-resumen').textContent = partes.join(' · ');
  }

  function irA(paso) {
    formulario.dataset.paso = paso;
    // en móvil, llevar la vista al inicio del formulario
    if (formulario.classList.contains('formulario-mov')) {
      formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  formulario.addEventListener('click', (evento) => {
    const boton = evento.target.closest('.boton-paso');
    if (!boton) return;
    const actual = formulario.dataset.paso;
    if (boton.classList.contains('siguiente')) irA(String(Number(actual) + 1));
    if (boton.classList.contains('atras')) irA(String(Number(actual) - 1));
    if (boton.classList.contains('enviar')) irA('enviado');
    if (boton.classList.contains('otro-pedido')) {
      formulario.querySelectorAll('.seleccionado').forEach((o) => o.classList.remove('seleccionado'));
      formulario.querySelectorAll('.campo').forEach((c) => c.classList.remove('completado'));
      formulario.querySelectorAll('input').forEach((i) => { i.value = ''; });
      Object.keys(eleccion).forEach((k) => { eleccion[k] = null; });
      formulario.querySelector('.detalle-resumen').textContent =
        'Grande (25 porciones) · Vainilla · Arequipe · Flores naturales';
      irA('1');
    }
  });
});
