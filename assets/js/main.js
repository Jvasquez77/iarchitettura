/* ══════════════════════════════════════════════════════════════
   iarchitettura — main.js
   Interactividad del cliente: nav, animaciones, formulario
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIGURACIÓN DE EMAIL — contact@iarchitettura.com
   ─────────────────────────────────────────────────────────────

   PASO ÚNICO — FORMSPREE (sin backend, gratis):
     1. Abre https://formspree.io y crea una cuenta
     2. Nuevo form → pon contact@iarchitettura.com como destino
     3. Copia el Form ID que te dan (ej. "xpzbkwlr")
     4. Reemplaza null por tu ID: formspreeId: 'xpzbkwlr'
     Cada mensaje del formulario llegará directo al correo.

   ─────────────────────────────────────────────────────────────
*/
const CONFIG = {
  /* ← ACTIVAR: reemplazar null con el Form ID de Formspree */
  formspreeId:      'mrevpogj',

  /* EmailJS (alternativa) */
  emailServiceId:   null,
  emailTemplateId:  null,
  emailPublicKey:   null,

  /* API propia (alternativa) */
  apiEndpoint:      null,

  navScrollOffset:  80,
};

/* ─────────────────────────────────────────────────────────────
   Utilidades DOM
   ───────────────────────────────────────────────────────────── */
const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

/* ─────────────────────────────────────────────────────────────
   NAVEGACIÓN
   ───────────────────────────────────────────────────────────── */
function initNav() {
  const nav        = $('#nav');
  const hamburger  = $('#js-hamburger');
  const mobileMenu = $('#js-mobile-menu');
  if (!nav) return;

  /* ── Scroll state ─────────────────────────────────────────── */
  const updateNav = () =>
    nav.classList.toggle('is-scrolled', window.scrollY > CONFIG.navScrollOffset);

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── Mobile menu ──────────────────────────────────────────── */
  if (!hamburger || !mobileMenu) return;

  const overlay = document.createElement('div');
  overlay.className = 'nav__overlay';
  overlay.id = 'js-nav-overlay';
  document.body.appendChild(overlay);

  const openMenu  = () => setMenuState(true);
  const closeMenu = () => setMenuState(false);

  function setMenuState(open) {
    hamburger.setAttribute('aria-expanded', open);
    mobileMenu.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });
  overlay.addEventListener('click', closeMenu);
  $$('.nav__mobile-link').forEach(l => l.addEventListener('click', closeMenu));

  /* Escape key closes menu */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
}

/* ─────────────────────────────────────────────────────────────
   SMOOTH SCROLL — anclas internas
   ───────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
    ) || 76;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - navH,
      behavior: 'smooth',
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   ANIMACIONES DE SCROLL — IntersectionObserver
   ───────────────────────────────────────────────────────────── */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        /* Stagger siblings inside the same parent */
        const siblings = $$('.reveal, .reveal-up, .reveal-left, .reveal-right',
                            entry.target.parentElement || document);
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${idx * 0.10}s`;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
  );

  $$('.reveal, .reveal-up, .reveal-left, .reveal-right')
    .forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────────────────────
   FORMULARIO DE CONTACTO
   ───────────────────────────────────────────────────────────── */
function initContactForm() {
  const form      = $('#contact-form');
  if (!form) return;

  const submitBtn = $('#js-form-submit');
  const statusEl  = $('#js-form-status');

  /* Validation rules per field */
  const validators = {
    'form-name':    v => (v.trim().length >= 2 ? '' : 'Ingresa tu nombre completo.'),
    'form-email':   v => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
                           ? '' : 'Ingresa un correo electrónico válido.'),
    'form-subject': v => (v.trim().length >= 3 ? '' : 'El asunto es requerido.'),
    'form-message': v => (v.trim().length >= 10
                           ? '' : 'El mensaje debe tener al menos 10 caracteres.'),
  };

  /* Live validation on blur / input */
  Object.keys(validators).forEach(id => {
    const input = document.getElementById(id);
    const errEl = document.getElementById(`${id}-error`);
    if (!input || !errEl) return;

    const validate = () => {
      const err = validators[id](input.value);
      errEl.textContent = err;
      input.classList.toggle('is-error', !!err);
      return !err;
    };

    input.addEventListener('blur', validate);
    input.addEventListener('input', () => {
      if (input.classList.contains('is-error')) validate();
    });
  });

  /* Submit */
  form.addEventListener('submit', async e => {
    e.preventDefault();

    /* Honeypot check */
    const honey = form.querySelector('[name="_honeypot"]');
    if (honey?.value) return;

    /* Validate all fields */
    let valid = true;
    Object.keys(validators).forEach(id => {
      const input = document.getElementById(id);
      const errEl = document.getElementById(`${id}-error`);
      if (!input || !errEl) return;
      const err = validators[id](input.value);
      errEl.textContent = err;
      input.classList.toggle('is-error', !!err);
      if (err) valid = false;
    });
    if (!valid) return;

    /* UI: loading */
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    try {
      await sendFormData(new FormData(form));
      statusEl.textContent = '✓ Mensaje enviado. Te respondemos en menos de 48 h.';
      statusEl.className = 'form-status form-status--success';
      form.reset();
    } catch (err) {
      console.error('[Form] Error:', err);
      statusEl.textContent =
        'No se pudo enviar el mensaje. Intenta de nuevo o escríbenos directamente.';
      statusEl.className = 'form-status form-status--error';
    } finally {
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  });
}

/**
 * Sends form data to the configured email service.
 * Edit CONFIG at the top to activate your chosen service.
 *
 * @param {FormData} formData
 */
async function sendFormData(formData) {

  /* ── OPCIÓN 1: FORMSPREE ─────────────────────────────────── */
  if (CONFIG.formspreeId) {
    const res = await fetch(`https://formspree.io/f/${CONFIG.formspreeId}`, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Formspree: HTTP ${res.status}`);
    return;
  }

  /* ── OPCIÓN 2: API PROPIA ────────────────────────────────── */
  if (CONFIG.apiEndpoint) {
    const body = Object.fromEntries(formData.entries());
    const res = await fetch(CONFIG.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API: HTTP ${res.status}`);
    return;
  }

  /* ── OPCIÓN 3: EMAILJS ───────────────────────────────────────
     Requiere el SDK de EmailJS en index.html.
     Descomenta las líneas siguientes cuando tengas las credenciales.

  if (CONFIG.emailServiceId && typeof emailjs !== 'undefined') {
    emailjs.init(CONFIG.emailPublicKey);
    await emailjs.send(CONFIG.emailServiceId, CONFIG.emailTemplateId, {
      from_name:  formData.get('name'),
      from_email: formData.get('email'),
      subject:    formData.get('subject'),
      message:    formData.get('message'),
    });
    return;
  }
  ─────────────────────────────────────────────────────────────── */

  /* ── SIN SERVICIO — modo desarrollo ─────────────────────── */
  console.warn(
    '[iarchitettura] No hay servicio de email configurado.\n' +
    'Edita CONFIG en assets/js/main.js.\n' +
    'Datos del form:', Object.fromEntries(formData.entries())
  );
  await new Promise(r => setTimeout(r, 900)); /* simula latencia */
}

/* ─────────────────────────────────────────────────────────────
   INICIALIZACIÓN
   ───────────────────────────────────────────────────────────── */
function init() {
  initNav();
  initSmoothScroll();
  initScrollAnimations();
  initContactForm();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
