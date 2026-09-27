/*
 * registry.js — registro mínimo de qué módulos de página ya fueron
 * inicializados. No hace falta para que el sitio funcione; existe para
 * que, si en el futuro un módulo necesita saber si otro ya cargó (por
 * ejemplo para compartir un tema visual), tenga un único lugar de dónde
 * consultarlo en vez de tocar variables globales sueltas.
 */

var loadedModules = Object.create(null);

export function registerPageModule(pageId, mod) {
  loadedModules[pageId] = mod || true;
}

export function getPageModule(pageId) {
  return loadedModules[pageId] || null;
}
