/*
 * readme.js — Módulo de la página "Read Me" (icono 1).
 *
 * Toda la lógica que es exclusiva de esta página vive aquí, y en ningún
 * otro lugar:
 *   - genera el borde festoneado (ondulado) que se dibuja detrás del
 *     texto de la carta, ajustándose al tamaño real del contenedor.
 *   - inclina la foto en 3D según la posición del mouse/dedo (tilt).
 *   - hace estallar corazoncitos donde se toque la página.
 *   - muestra un mensaje sorpresa al encontrar el corazón escondido.
 *
 * main.js llama a init(pageEl) una sola vez, justo después de inyectar el
 * HTML de esta página (ver pages/readme.html) por primera vez.
 */

// Genera un path SVG con borde ondulado (festoneado) según el tamaño real
// del contenedor .readme-copy-frame.
function scallopPath(w, h, bump, n) {
  var nx = Math.max(4, Math.round(n));
  var ny = Math.max(4, Math.round(n * h / w));
  var stepX = w / nx;
  var stepY = h / ny;
  var d = 'M 0 0 ';
  var i, x0, x1, xm, y0, y1, ym;
  for (i = 0; i < nx; i++) {
    x0 = i * stepX; x1 = x0 + stepX; xm = (x0 + x1) / 2;
    d += 'Q ' + xm + ' ' + (-bump) + ', ' + x1 + ' 0 ';
  }
  for (i = 0; i < ny; i++) {
    y0 = i * stepY; y1 = y0 + stepY; ym = (y0 + y1) / 2;
    d += 'Q ' + (w + bump) + ' ' + ym + ', ' + w + ' ' + y1 + ' ';
  }
  for (i = nx; i > 0; i--) {
    x0 = i * stepX; x1 = x0 - stepX; xm = (x0 + x1) / 2;
    d += 'Q ' + xm + ' ' + (h + bump) + ', ' + x1 + ' ' + h + ' ';
  }
  for (i = ny; i > 0; i--) {
    y0 = i * stepY; y1 = y0 - stepY; ym = (y0 + y1) / 2;
    d += 'Q ' + (-bump) + ' ' + ym + ', 0 ' + y1 + ' ';
  }
  return d + 'Z';
}

function renderScallopBackgrounds(scope) {
  var root = scope || document;
  var boxes = root.querySelectorAll('.readme-copy-frame .scallop-bg');
  boxes.forEach(function (bgDiv) {
    var svg = bgDiv.querySelector('svg');
    if (!svg) return;
    var w = bgDiv.clientWidth;
    var h = bgDiv.clientHeight;
    if (!w || !h) return;
    var bump = Math.max(8, Math.min(w, h) * 0.035);
    var n = Math.max(6, Math.round(w / 34));
    var d = scallopPath(w, h, bump, n);
    svg.setAttribute('viewBox', (-bump) + ' ' + (-bump) + ' ' + (w + bump * 2) + ' ' + (h + bump * 2));
    svg.innerHTML = '<path d="' + d + '" fill="#fffaf7" stroke="#e0aabb" stroke-width="2"/>';
  });
}

var boundResizeHandler = null;

/* -------------------------------------------------------------------
 * Tilt 3D: la tarjeta de la foto se inclina levemente siguiendo el
 * mouse (o el dedo, en móvil se ignora para no interferir con el
 * scroll de la página).
 * ----------------------------------------------------------------- */
function initTilt(pageEl) {
  var card = pageEl.querySelector('#readmeTiltCard');
  if (!card) return;
  var isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (isCoarsePointer) return; // en móvil/táctil no se activa el tilt

  var maxTilt = 10; // grados

  card.addEventListener('mousemove', function (event) {
    var rect = card.getBoundingClientRect();
    var x = (event.clientX - rect.left) / rect.width;  // 0..1
    var y = (event.clientY - rect.top) / rect.height;  // 0..1
    var rotY = (x - 0.5) * maxTilt * 2;
    var rotX = (0.5 - y) * maxTilt * 2;
    card.style.transform = 'rotate(-2deg) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
  });

  card.addEventListener('mouseleave', function () {
    card.style.transform = 'rotate(-2deg) rotateX(0deg) rotateY(0deg)';
  });
}

/* -------------------------------------------------------------------
 * Corazones que estallan al tocar/hacer click en cualquier parte de
 * la página (menos sobre botones, para no estorbar).
 * ----------------------------------------------------------------- */
function spawnHeartBurst(layer, x, y) {
  var count = 6;
  var colors = ['#e87b98', '#f2a7bb', '#e0577a', '#f6b8cc'];
  for (var i = 0; i < count; i++) {
    var heart = document.createElement('span');
    heart.className = 'readme-burst-heart';
    heart.textContent = '♡';
    var angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    var distance = 50 + Math.random() * 50;
    var endX = Math.cos(angle) * distance;
    var endY = Math.sin(angle) * distance - 40; // ligera tendencia hacia arriba
    heart.style.left = x + 'px';
    heart.style.top = y + 'px';
    heart.style.color = colors[i % colors.length];
    heart.style.setProperty('--burst-end', 'translate(' + endX + 'px, ' + endY + 'px)');
    heart.style.setProperty('--burst-rot', (Math.random() * 60 - 30) + 'deg');
    layer.appendChild(heart);
    // Limpieza tras la animación (1.1s definidos en el CSS).
    window.setTimeout(function (el) {
      return function () { el.remove(); };
    }(heart), 1200);
  }
}

function initHeartBurst(pageEl) {
  var layer = pageEl.querySelector('#readmeBurstLayer');
  if (!layer) return;

  pageEl.addEventListener('click', function (event) {
    // No generar corazones si el click fue sobre un botón o link (para no
    // estorbar "volver" ni el corazón secreto, que ya tiene su propio efecto).
    if (event.target.closest('button, a')) return;
    spawnHeartBurst(layer, event.clientX, event.clientY);
  });
}

/* -------------------------------------------------------------------
 * Corazón secreto escondido en la foto: al tocarlo aparece un mensaje.
 * ----------------------------------------------------------------- */
function initSecretMessage(pageEl) {
  var btn = pageEl.querySelector('#readmeSecretBtn');
  var message = pageEl.querySelector('#readmeSecretMessage');
  var closeBtn = pageEl.querySelector('#readmeSecretClose');
  if (!btn || !message) return;

  function show() {
    message.classList.add('is-visible');
    message.setAttribute('aria-hidden', 'false');
  }
  function hide() {
    message.classList.remove('is-visible');
    message.setAttribute('aria-hidden', 'true');
  }

  btn.addEventListener('click', function (event) {
    event.stopPropagation(); // que no dispare también el burst de corazones
    show();
  });
  if (closeBtn) {
    closeBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      hide();
    });
  }
  message.addEventListener('click', function (event) {
    if (event.target === message) hide(); // click fuera de la tarjeta cierra
  });
}

export function init(pageEl) {
  pageEl = pageEl || document;

  // Primer render del festoneado: se hace con un pequeño delay para
  // asegurar que el contenedor ya tiene su tamaño final (la página recién
  // se está abriendo).
  window.setTimeout(function () {
    renderScallopBackgrounds(pageEl);
  }, 60);

  // Si la ventana cambia de tamaño con la carta abierta, se recalcula.
  if (!boundResizeHandler) {
    boundResizeHandler = function () {
      renderScallopBackgrounds(document);
    };
    window.addEventListener('resize', boundResizeHandler);
  }

  initTilt(pageEl);
  initHeartBurst(pageEl);
  initSecretMessage(pageEl);
}
