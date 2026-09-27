/*
 * countdown.js — Módulo de la página "Cuenta regresiva" (icono 4).
 *
 * Lee data/countdown.json (días/horas/minutos/segundos) al abrir la
 * página, y desde ese momento hace una cuenta regresiva en vivo, en el
 * navegador, mostrando días:horas:minutos:segundos.
 *
 * Cómo se "actualiza desde Discord": no hay conexión en vivo a Discord.
 * El flujo real es manual: la persona cambia los números en
 * data/countdown.json en GitHub (o localmente + git push) y hace commit.
 * La próxima vez que alguien abra la página, el contador arranca desde
 * ese nuevo valor y sigue bajando en tiempo real desde ahí.
 *
 * Al llegar a 0, se muestra un popup centrado (con animación de entrada
 * y salida) y el contador se queda fijo en 00:00:00:00.
 */

var DATA_URL = 'data/countdown.json';

function pad2(n) {
  n = Math.max(0, Math.floor(n));
  return n < 10 ? '0' + n : String(n);
}

export function init(pageEl) {
  if (!pageEl) return;

  var elDays = pageEl.querySelector('#cdDays');
  var elHours = pageEl.querySelector('#cdHours');
  var elMinutes = pageEl.querySelector('#cdMinutes');
  var elSeconds = pageEl.querySelector('#cdSeconds');
  var display = pageEl.querySelector('#countdownDisplay');

  var overlay = pageEl.querySelector('#countdownPopupOverlay');
  var popup = pageEl.querySelector('#countdownPopup');
  var closeBtn = pageEl.querySelector('#countdownPopupClose');

  var timerId = null;
  var popupShown = false;
  var closeTimer = null;

  function renderRemaining(msRemaining) {
    if (!elDays || !elHours || !elMinutes || !elSeconds) return;

    if (msRemaining <= 0) {
      elDays.textContent = '00';
      elHours.textContent = '00';
      elMinutes.textContent = '00';
      elSeconds.textContent = '00';
      return;
    }

    var totalSeconds = Math.floor(msRemaining / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    elDays.textContent = pad2(days);
    elHours.textContent = pad2(hours);
    elMinutes.textContent = pad2(minutes);
    elSeconds.textContent = pad2(seconds);
  }

  function openPopup() {
    if (popupShown || !overlay || !popup) return;
    popupShown = true;
    overlay.classList.add('is-visible');
    // Fuerza reflow para que la animación de entrada del popup siempre
    // arranque desde su estado inicial, incluso si se reabre rápido.
    void popup.offsetWidth;
    popup.classList.remove('is-leaving');
    popup.classList.add('is-entering');
    document.body.style.overflow = 'hidden';
  }

  function closePopup() {
    if (!popupShown || !overlay || !popup) return;
    popup.classList.remove('is-entering');
    popup.classList.add('is-leaving');
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(function () {
      overlay.classList.remove('is-visible');
      popup.classList.remove('is-leaving');
      document.body.style.overflow = '';
    }, 320);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closePopup);
  }
  if (overlay) {
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closePopup();
    });
  }

  function tick(targetTime) {
    var remaining = targetTime - Date.now();
    renderRemaining(remaining);

    if (remaining <= 0) {
      window.clearInterval(timerId);
      timerId = null;
      if (display) display.classList.add('is-finished');
      openPopup();
    }
  }

  fetch(DATA_URL)
    .then(function (response) {
      if (!response.ok) throw new Error('No se pudo cargar ' + DATA_URL);
      return response.json();
    })
    .then(function (data) {
      var days = Number(data.days) || 0;
      var hours = Number(data.hours) || 0;
      var minutes = Number(data.minutes) || 0;
      var seconds = Number(data.seconds) || 0;

      var totalMs = (
        days * 86400 +
        hours * 3600 +
        minutes * 60 +
        seconds
      ) * 1000;

      var targetTime = Date.now() + totalMs;

      tick(targetTime);
      if (totalMs > 0) {
        timerId = window.setInterval(function () {
          tick(targetTime);
        }, 1000);
      }
    })
    .catch(function (err) {
      console.error(err);
      renderRemaining(0);
    });
}
