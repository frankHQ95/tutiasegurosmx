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
