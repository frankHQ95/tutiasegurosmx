/* tutiasegurosmx — interacciones de la landing */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Header: sombra al hacer scroll ----------
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  header.classList.toggle('is-scrolled', window.scrollY > 10);
}, { passive: true });

// ---------- Navegación móvil ----------
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  const abierto = nav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(abierto));
});

nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// ---------- Animaciones de aparición al hacer scroll ----------
// El hero se anima solo al cargar (CSS); aquí va todo lo demás.
const revelables = document.querySelectorAll(
  '.section__kicker, .section__title, .card, .paso, .stat, .testimonio, ' +
  '.faq details, .sobre__media, .sobre__content, .form, .contacto__content, ' +
  '.section__note, .section__center'
);

if ('IntersectionObserver' in window && !reduceMotion) {
  // Escalonar elementos hermanos (cards, pasos, stats…) dentro de su contenedor
  const porPadre = new Map();
  revelables.forEach((el) => {
    el.classList.add('reveal');
    const hermanos = porPadre.get(el.parentElement) || [];
    el.style.transitionDelay = `${Math.min(hermanos.length * 90, 450)}ms`;
    hermanos.push(el);
    porPadre.set(el.parentElement, hermanos);
  });

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('is-visible');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revelables.forEach((el) => observador.observe(el));
}

// ---------- Contadores animados en la barra de cifras ----------
function animarContador(el) {
  const fin = Number(el.dataset.count);
  const prefijo = el.dataset.prefix || '';
  const sufijo = el.dataset.suffix || '';
  const duracion = 1400;
  const inicio = performance.now();

  function paso(ahora) {
    const progreso = Math.min((ahora - inicio) / duracion, 1);
    const valor = Math.round(fin * (1 - Math.pow(1 - progreso, 3)));
    el.textContent = prefijo + valor + sufijo;
    if (progreso < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
}

const contadores = document.querySelectorAll('.stat strong[data-count]');

if ('IntersectionObserver' in window && !reduceMotion && contadores.length) {
  const observadorStats = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        animarContador(entrada.target);
        observadorStats.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.6 });

  contadores.forEach((el) => observadorStats.observe(el));
}

// ---------- Meta Pixel: eventos en CTAs ----------
function trackEvent(nombre) {
  if (typeof fbq === 'function') fbq('track', nombre);
}

document.querySelectorAll('[data-track]').forEach((el) => {
  el.addEventListener('click', () => trackEvent(el.dataset.track));
});

// ---------- Cards de producto → preseleccionar en el formulario ----------
const selectProducto = document.getElementById('producto');

document.querySelectorAll('[data-producto]').forEach((link) => {
  link.addEventListener('click', () => {
    selectProducto.value = link.dataset.producto;
  });
});

// ---------- Formulario de leads ----------
const form = document.getElementById('leadForm');
const successMsg = document.getElementById('formSuccess');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const nombre = form.nombre.value.trim();
  const email = form.email.value.trim();
  const whatsapp = form.whatsapp.value.replace(/\D/g, '');
  const producto = form.producto.value;

  // Validación simple
  let valido = true;
  [form.nombre, form.email, form.whatsapp].forEach((campo) => campo.classList.remove('error'));

  if (nombre.length < 2) { form.nombre.classList.add('error'); valido = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { form.email.classList.add('error'); valido = false; }
  if (whatsapp.length !== 10) { form.whatsapp.classList.add('error'); valido = false; }

  if (!valido) return;

  // TODO: pendiente — conectar a un endpoint real (Formspree, Google Sheets,
  // CRM o webhook) para almacenar el lead. Por ahora el lead llega a Flor
  // vía WhatsApp con los datos prellenados.
  const mensaje = `Hola Flor, soy ${nombre} y quiero agendar mi asesoría gratuita.%0A%0A` +
    `📧 Correo: ${email}%0A` +
    `📱 WhatsApp: ${whatsapp}%0A` +
    `💡 Me interesa: ${producto}`;

  trackEvent('Lead');

  successMsg.hidden = false;
  form.querySelector('button[type="submit"]').disabled = true;

  window.open(`https://wa.me/526441140495?text=${mensaje}`, '_blank', 'noopener');
});

// ---------- Calendly (pop-up dentro de la página) ----------
const CALENDLY_URL = 'https://calendly.com/florsegurosmonterrey/asesoria-gratuita';

function abrirCalendly() {
  trackEvent('Schedule');
  if (window.Calendly && typeof Calendly.initPopupWidget === 'function') {
    Calendly.initPopupWidget({ url: CALENDLY_URL });
    return false;
  }
  // Fallback: si el widget no cargó, abrir en pestaña nueva.
  window.open(CALENDLY_URL, '_blank', 'noopener');
  return false;
}

document.querySelectorAll('[data-calendly]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    abrirCalendly();
  });
});

// ---------- Disponibilidad de agenda ----------
// ⚠️ IMPORTANTE: este número debe reflejar la capacidad REAL de Flor.
// Es publicidad de un servicio financiero regulado (PROFECO / CONDUSEF):
// anunciar una escasez que no existe es publicidad engañosa.
// Flor actualiza `lugares` cada semana con los espacios que de verdad
// le quedan libres en Calendly. Si no quiere mantenerlo, poner `mostrar: false`
// y los bloques de disponibilidad desaparecen solos de todas las páginas.
const AGENDA = {
  mostrar: true,
  lugares: 6,          // TODO: pendiente clienta — confirmar capacidad real semanal
  periodo: 'esta semana'
};

const bloquesDisponibilidad = document.querySelectorAll('[data-disponibilidad]');

if (bloquesDisponibilidad.length) {
  if (!AGENDA.mostrar || !AGENDA.lugares || AGENDA.lugares < 1) {
    // Sin dato confiable no se muestra nada: mejor sin urgencia que con una cifra falsa.
    bloquesDisponibilidad.forEach((el) => el.remove());
  } else {
    const plural = AGENDA.lugares === 1 ? 'lugar disponible' : 'lugares disponibles';
    bloquesDisponibilidad.forEach((el) => {
      const destino = el.querySelector('[data-disponibilidad-texto]') || el;
      destino.innerHTML =
        `Agenda de ${AGENDA.periodo}: <strong>${AGENDA.lugares} ${plural}</strong>`;
    });
  }
}

// ---------- Notificaciones flotantes (prueba social) ----------
// ⚠️ REGLA DE ESTE BLOQUE: aquí solo entra contenido VERIFICABLE.
// Flor es asesora con cédula ante la CNSF; simular actividad que no
// ocurrió (nombres, ciudades o agendas inventadas) es publicidad
// engañosa (art. 32 LFPC) y la expone a ella, no a la agencia.
//
// Qué sí puede ir:
//   · testimonios reales de clientas que dieron su permiso (los mismos
//     que aparecen en la sección de reseñas, recortados)
//   · datos ciertos del servicio (primera asesoría sin costo, topes de
//     edad del producto, disponibilidad real de agenda)
//
// Para sumar una clienta nueva: pedir su autorización, agregarla abajo
// con su cita textual y listo. Si algún día hay datos reales de agendas
// (API de Calendly o registro que Flor lleve), se pueden inyectar aquí
// con el mismo formato y las notificaciones pasan a ser en vivo.

const TESTIMONIOS_NOTIF = [
  {
    iniciales: 'LF',
    nombre: 'Lupita Félix',
    texto: '“Ya casi cumplo 3 años con mi plan de retiro y me da mucha tranquilidad.”',
    meta: 'Clienta · Plan de Retiro'
  },
  {
    iniciales: 'AH',
    nombre: 'Ana Lucía Hurtado',
    texto: '“Hace dos años contraté mi seguro con ella y ha sido una excelente decisión.”',
    meta: 'Clienta · Seguro de Vida'
  },
  {
    iniciales: 'NV',
    nombre: 'Nuvia Valdez',
    texto: '“Me siento más tranquila gracias a ti y tu asesoría.”',
    meta: 'Clienta'
  }
];

const DATOS_NOTIF = [
  {
    dato: true,
    icono: '✓',
    nombre: 'Primera asesoría sin costo',
    texto: 'Es una plática para darte claridad. Decidas lo que decidas, no se te cobra.'
  }
];

// Cada página puede sumar sus propias notificaciones definiendo
// window.NOTIF_PAGINA antes de cargar este script.
const NOTIFICACIONES = []
  .concat(TESTIMONIOS_NOTIF, DATOS_NOTIF, window.NOTIF_PAGINA || []);

// La disponibilidad solo se anuncia si hay una cifra real configurada.
if (AGENDA.mostrar && AGENDA.lugares > 0) {
  NOTIFICACIONES.push({
    dato: true,
    icono: '📅',
    nombre: `Quedan ${AGENDA.lugares} ${AGENDA.lugares === 1 ? 'lugar' : 'lugares'} ${AGENDA.periodo}`,
    texto: 'Puedes elegir tu día y tu hora directo en el calendario de Flor.'
  });
}

(function iniciarNotificaciones() {
  if (!NOTIFICACIONES.length) return;

  const zona = document.createElement('div');
  zona.className = 'notif-zona';
  zona.setAttribute('aria-live', 'polite');
  zona.setAttribute('aria-label', 'Testimonios de clientas');
  document.body.appendChild(zona);

  let indice = Math.floor(Math.random() * NOTIFICACIONES.length);
  let activa = null;

  function ocultar(toast) {
    if (!toast) return;
    toast.classList.remove('is-visible');
    toast.classList.add('is-hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      if (activa === toast) activa = null;
    }, 380);
  }

  function mostrar() {
    if (document.hidden) return;

    const dato = NOTIFICACIONES[indice % NOTIFICACIONES.length];
    indice++;

    if (activa) ocultar(activa);

    const toast = document.createElement('div');
    toast.className = 'notif';
    toast.setAttribute('role', 'status');

    const avatar = document.createElement('div');
    avatar.className = 'notif__avatar' + (dato.dato ? ' notif__avatar--dato' : '');
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = dato.dato ? dato.icono : dato.iniciales;

    const cuerpo = document.createElement('div');
    cuerpo.className = 'notif__cuerpo';

    const nombre = document.createElement('p');
    nombre.className = 'notif__nombre';
    nombre.textContent = dato.nombre;

    const texto = document.createElement('p');
    texto.className = 'notif__texto';
    texto.textContent = dato.texto;

    cuerpo.append(nombre, texto);

    if (dato.meta) {
      const meta = document.createElement('span');
      meta.className = 'notif__meta';
      meta.textContent = dato.meta;
      cuerpo.appendChild(meta);
    }

    const cerrar = document.createElement('button');
    cerrar.className = 'notif__cerrar';
    cerrar.type = 'button';
    cerrar.setAttribute('aria-label', 'Cerrar notificación');
    cerrar.innerHTML = '&#x2715;';
    cerrar.addEventListener('click', () => ocultar(toast));

    toast.append(avatar, cuerpo, cerrar);
    zona.appendChild(toast);
    activa = toast;

    // Doble RAF para que el navegador pinte el estado inicial antes de animar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('is-visible'));
    });

    // Se va sola a los 6 s
    setTimeout(() => { if (activa === toast) ocultar(toast); }, 6000);
  }

  // Primera a los 10 s, después cada 20-28 s
  setTimeout(function ciclo() {
    mostrar();
    setTimeout(ciclo, 20000 + Math.floor(Math.random() * 8000));
  }, 10000);
}());
