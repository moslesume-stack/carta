/*
 * readme.js — Módulo de la página "Read Me" (icono 1).
 *
 * Toda la lógica que es exclusiva de esta página vive aquí, y en ningún
 * otro lugar: genera el borde festoneado (ondulado) que se dibuja detrás
 * del texto de la carta, ajustándose al tamaño real del contenedor.
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

export function init(pageEl) {
  // Primer render: se hace con un pequeño delay para asegurar que el
  // contenedor ya tiene su tamaño final (la página recién se está abriendo).
  window.setTimeout(function () {
    renderScallopBackgrounds(pageEl || document);
  }, 60);

  // Si la ventana cambia de tamaño con la carta abierta, se recalcula.
  if (!boundResizeHandler) {
    boundResizeHandler = function () {
      renderScallopBackgrounds(document);
    };
    window.addEventListener('resize', boundResizeHandler);
  }
}
