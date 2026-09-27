/*
 * main.js — Orquestador general del sitio.
 *
 * Responsabilidades:
 *  - Generar el fondo de corazones (partículas).
 *  - Manejar el click/apertura del sobre inicial.
 *  - Manejar la apertura/cierre de las 3 páginas (Read Me / Us / Playlist).
 *  - Cargar bajo demanda el contenido de cada página (fetch de su HTML en
 *    /pages/*.html) SOLO la primera vez que su icono es presionado, y
 *    delegar cualquier lógica extra de esa página a su propio módulo
 *    (import dinámico de /js/modules/<pagina>.js).
 *
 * Nada de lo específico de una página (por ejemplo el borde festoneado de
 * la carta) vive aquí: este archivo solo sabe abrir/cerrar/cachear.
 */

import { registerPageModule } from './modules/registry.js';

(function () {
  'use strict';

  /* ---------------------------------------------------------------------
   * 1) Partículas de corazones flotando en el fondo
   * ------------------------------------------------------------------- */
  function initParticles() {
    var container = document.getElementById('particles');
    if (!container) return { setColorTheme: function () {} };

    var heartSVG = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-7.5-4.6-10.2-9.3C.2 8.9 1.4 5.5 4.7 4.6c2-.5 3.9.3 5.3 2.1C11.4 4.9 13.3 4.1 15.3 4.6c3.3.9 4.5 4.3 2.9 7.1C15.5 16.4 12 21 12 21z"/></svg>';
    var themeParticles = [];

    var count = window.innerWidth < 500 ? 15 : 24;
    var slot = 96 / count; // reparte el ancho en franjas iguales
    for (var i = 0; i < count; i++) {
      var el = document.createElement('div');
      el.className = 'heart-particle';
      el.innerHTML = heartSVG;
      var size = 10 + Math.random() * 24;
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      // posición aleatoria pero dentro de su propia franja,
      // así se reparten parejo por todo el ancho (sin huecos ni amontonarse)
      el.style.left = (i * slot + Math.random() * slot) + 'vw';
      el.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
      var duration = 16 + Math.random() * 14;
      el.style.animationDuration = duration + 's';
      el.style.animationDelay = (-Math.random() * duration) + 's';
      container.appendChild(el);
      themeParticles.push(el);
    }

    function setColorTheme(theme) {
      document.body.classList.remove('theme-pink', 'theme-yellow', 'theme-black', 'theme-amber');
      if (theme) document.body.classList.add(theme);
      themeParticles.forEach(function (particle) {
        particle.style.color = theme ? '#fff' : '';
      });
    }

    return { setColorTheme: setColorTheme };
  }

  /* ---------------------------------------------------------------------
   * 2) Sobre inicial: click para abrir y revelar los 3 iconos
   * ------------------------------------------------------------------- */
  function initEnvelope(wrap, iconButtons) {
    var envelope = document.querySelector('.envelope-photo');
    if (!envelope) return;

    // En Android el long-press dispara "contextmenu" (el CSS de iOS no
    // alcanza ahí); lo bloqueamos para que no aparezca "Descargar imagen".
    envelope.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    });

    envelope.addEventListener('click', function () {
      // Reinicia la animación incluso si se pulsa varias veces rápidamente.
      envelope.classList.remove('is-clicked');
      void envelope.offsetWidth;
      envelope.classList.add('is-clicked');

      // Primero termina la animación de click del sobre. Después se cierra
      // inmediatamente y aparecen los 3 iconos sincronizados.
      if (wrap && !wrap.classList.contains('is-opened')) {
        envelope.dataset.pendingOpen = '1';
      }
    });

    envelope.addEventListener('animationend', function (event) {
      if (event.animationName === 'envelope-click') {
        envelope.classList.remove('is-clicked');
        if (envelope.dataset.pendingOpen === '1' && wrap && !wrap.classList.contains('is-opened')) {
          delete envelope.dataset.pendingOpen;
          wrap.classList.add('is-opened');
          iconButtons.forEach(function (btn) {
            btn.style.animationDelay = '0ms';
            btn.classList.add('show');
          });
        }
      }
    });
  }

  /* ---------------------------------------------------------------------
   * 3) Carga diferida de cada página por su propio módulo
   * ------------------------------------------------------------------- */
  // Un "page module" describe, por cada botón de icono, dónde vive su
  // fragmento HTML y (opcionalmente) su archivo JS de comportamiento propio.
  var PAGE_MODULES = {
    firstPage: { html: 'pages/readme.html', script: './modules/readme.js' },
    usPage: { html: 'pages/us.html', script: './modules/us.js' },
    playlistPage: { html: 'pages/playlist.html', script: './modules/playlist.js' },
    countdownPage: { html: 'pages/countdown.html', script: './modules/countdown.js' }
  };

  var loadedPages = Object.create(null); // pageId -> Promise<void>

  function loadPageContent(pageId) {
    if (loadedPages[pageId]) return loadedPages[pageId];

    var pageEl = document.getElementById(pageId);
    var config = PAGE_MODULES[pageId];
    if (!pageEl || !config) {
      loadedPages[pageId] = Promise.resolve();
      return loadedPages[pageId];
    }

    loadedPages[pageId] = fetch(config.html)
      .then(function (response) {
        if (!response.ok) throw new Error('No se pudo cargar ' + config.html);
        return response.text();
      })
      .then(function (html) {
        pageEl.innerHTML = html;
        // El modulo especifico de la pagina (si existe) recibe su elemento
        // ya poblado, para inicializar lo que le corresponda (por ejemplo,
        // el festoneado de la carta en Read Me).
        if (config.script) {
          return import(config.script).then(function (mod) {
            if (mod && typeof mod.init === 'function') {
              mod.init(pageEl);
            }
            registerPageModule(pageId, mod);
          });
        }
      })
      .catch(function (err) {
        pageEl.innerHTML = '<p style="padding:40px;text-align:center;">No se pudo cargar el contenido.</p>';
        console.error(err);
      });

    return loadedPages[pageId];
  }

  /* ---------------------------------------------------------------------
   * 4) Apertura / cierre de páginas + iconos
   * ------------------------------------------------------------------- */
  function initPages(wrap, iconsRow, iconButtons, setColorTheme) {
    // OJO: las 3 páginas empiezan vacías (su contenido se inyecta por
    // fetch() al abrirlas por primera vez), así que NO se puede buscar
    // ".page-back" una sola vez aquí arriba: en ese momento todavía no
    // existe dentro del DOM. Por eso el botón "volver" se maneja con
    // delegación de eventos sobre document (ver más abajo), y así
    // funciona sin importar cuándo se haya inyectado cada página.
    var iconPages = Array.prototype.slice.call(document.querySelectorAll('.icon-page'));
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var iconExitTimer = 0;
    var iconExitDuration = prefersReducedMotion ? 0 : 430;

    function closeIconPages() {
      iconPages.forEach(function (page) {
        page.classList.remove('open');
        page.setAttribute('aria-hidden', 'true');
      });
      document.body.style.overflow = '';
    }

    function restoreIcons() {
      window.clearTimeout(iconExitTimer);
      if (iconsRow) {
        iconsRow.classList.remove('is-busy');
      }
      iconButtons.forEach(function (button) {
        button.classList.remove('is-leaving');
        if (button.classList.contains('show')) {
          button.classList.add('ready');
        }
      });
    }

    function openIconPage(pageId) {
      var page = document.getElementById(pageId);
      if (!page) {
        restoreIcons();
        return;
      }

      loadPageContent(pageId).then(function () {
        closeIconPages();
        if (wrap) {
          wrap.classList.add('icons-page-open');
        }
        page.classList.add('open');
        page.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    }

    // Los 3 iconos: cada uno abre (y, la primera vez, carga) su propia
    // página. Al hacer click, se bloquea el hover, se encogen/desaparecen
    // los iconos y luego entra la página.
    iconButtons.forEach(function (btn) {
      var img = btn.querySelector('img');
      if (!img) return;

      btn.addEventListener('contextmenu', function (event) {
        event.preventDefault();
      });

      btn.addEventListener('animationend', function (event) {
        if (event.animationName === 'icon-appear') {
          btn.classList.add('ready');
        }
      });

      btn.addEventListener('click', function () {
        var pageId = btn.getAttribute('data-page-target');
        if (!btn.classList.contains('ready') || !pageId || (iconsRow && iconsRow.classList.contains('is-busy'))) return;

        if (iconsRow) {
          iconsRow.classList.add('is-busy');
        }
        if (wrap) {
          wrap.classList.add('icons-page-open');
        }

        iconButtons.forEach(function (button) {
          button.classList.remove('ready');
          button.classList.add('is-leaving');
          button.blur();
        });

        var theme = null;
        if (btn.id === 'iconMessage') theme = 'theme-pink';
        else if (btn.id === 'iconMemories') theme = 'theme-yellow';
        else if (btn.id === 'iconMusic') theme = 'theme-black';
        else if (btn.id === 'iconCountdown') theme = 'theme-amber';
        setColorTheme(theme);

        window.clearTimeout(iconExitTimer);
        iconExitTimer = window.setTimeout(function () {
          openIconPage(pageId);
        }, iconExitDuration);
      });
    });

    // Delegación de eventos: escucha en document en vez de en cada botón
    // ".page-back" directamente, porque esos botones no existen todavía al
    // arrancar (llegan luego, dentro del HTML inyectado por fetch()).
    document.addEventListener('click', function (event) {
      var button = event.target.closest ? event.target.closest('.page-back') : null;
      if (!button) return;
      closeIconPages();
      setColorTheme(null);
      if (wrap) {
        wrap.classList.remove('icons-page-open');
      }
      restoreIcons();
    });
  }

  /* ---------------------------------------------------------------------
   * Arranque
   * ------------------------------------------------------------------- */
  function init() {
    var particles = initParticles();
    var wrap = document.querySelector('.envelope-wrap');
    var iconsRow = document.getElementById('iconsRow');
    var iconButtons = iconsRow ? Array.prototype.slice.call(iconsRow.querySelectorAll('.icon-btn')) : [];

    initEnvelope(wrap, iconButtons);
    initPages(wrap, iconsRow, iconButtons, particles.setColorTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
