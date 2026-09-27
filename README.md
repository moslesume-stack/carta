# Para ti — sitio web

Página de sobre interactivo con 3 secciones (Read Me / Us / Playlist),
organizada en módulos para que sea fácil de mantener y de desplegar.

## Estructura del proyecto

```
site/
├── index.html                 → página principal: sobre + 3 botones + contenedores vacíos de cada página
├── css/
│   ├── base.css                → compartido: fondo, partículas, sobre, iconos, layout genérico de páginas
│   ├── readme-page.css         → SOLO estilos del icono 1 (Read Me / la carta)
│   ├── us-page.css             → SOLO estilos del icono 2 (Us)
│   └── playlist-page.css       → SOLO estilos del icono 3 (Playlist)
├── js/
│   ├── main.js                  → orquestador: partículas, abrir/cerrar sobre y páginas, carga cada módulo bajo demanda
│   └── modules/
│       ├── registry.js          → registro interno de qué módulo de página ya se inicializó
│       ├── readme.js            → lógica exclusiva del icono 1 (dibuja el borde festoneado de la carta)
│       ├── us.js                → lógica exclusiva del icono 2 (vacío por ahora, listo para ampliar)
│       └── playlist.js          → lógica exclusiva del icono 3 (vacío por ahora, listo para ampliar)
├── pages/
│   ├── readme.html              → HTML interno del icono 1
│   ├── us.html                  → HTML interno del icono 2
│   └── playlist.html            → HTML interno del icono 3
└── assets/
    └── img/                     → todas las imágenes (antes iban embebidas en base64 dentro del HTML)
```

### Cómo funciona la carga de cada página

`index.html` solo trae el sobre, los 3 botones, y 3 `<section>` **vacíos**
(uno por página). Cuando el usuario hace click en un icono, `main.js`:

1. Descarga (`fetch`) el HTML de `pages/<icono>.html` y lo inyecta dentro
   de su `<section>` correspondiente — solo la primera vez; queda en
   memoria para no volver a pedirlo si se abre de nuevo.
2. Si esa página tiene lógica propia (por ahora solo Read Me, para el
   borde festoneado), carga su módulo (`js/modules/<icono>.js`) e invoca
   su función `init()`.

Así cada icono solo carga su propio contenido — nada se duplica ni se
mezcla entre páginas.

## Ver el sitio en tu computadora

Como el sitio usa `fetch()` para cargar cada página, **no funciona
abriendo `index.html` directamente con doble click** (los navegadores
bloquean `fetch` sobre `file://`). Hay que servirlo por HTTP local:

```bash
cd site
python3 -m http.server 8000
```

Y abrir `http://localhost:8000/` en el navegador.

(Si no tienes Python, cualquier servidor estático sirve: `npx serve site`,
la extensión "Live Server" de VS Code, etc.)

## Subir a GitHub

```bash
cd site
git init
git add .
git commit -m "Sitio inicial"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

## Desplegar en Render (con link propio)

1. Entra a [render.com](https://render.com) e inicia sesión (puedes usar tu cuenta de GitHub).
2. **New +** → **Static Site**.
3. Conecta el repositorio que acabas de subir.
4. Configuración de build:
   - **Build Command:** (déjalo vacío — no hay nada que compilar)
   - **Publish directory:** `.` (si conectaste la carpeta `site` como raíz del repo) o `site` (si subiste todo el proyecto con `site/` como subcarpeta)
5. Click en **Create Static Site**.

Render te dará un link tipo `https://tu-sitio.onrender.com`. Desde el
panel de Render puedes:
- Cambiarle el nombre (lo que cambia la parte `tu-sitio` del link).
- Conectar un dominio propio si tienes uno, en **Settings → Custom Domains**.

Cada vez que hagas `git push` a la rama `main`, Render vuelve a
desplegar el sitio automáticamente.

## Modificar contenido más adelante

- **Cambiar el texto de la carta:** editar `pages/readme.html`.
- **Cambiar fotos:** reemplazar el archivo correspondiente dentro de
  `assets/img/` (mismo nombre) o cambiar la ruta `src="assets/img/..."`
  en el `pages/*.html` que corresponda.
- **Cambiar estilos de una sola página:** su archivo CSS dedicado
  (`css/readme-page.css`, `css/us-page.css` o `css/playlist-page.css`)
  — nunca hace falta tocar `base.css` para eso.
- **Agregar comportamiento nuevo a una página** (por ejemplo, reproducir
  una canción al hacer click en Playlist): agregar el código dentro de
  su `init()` en `js/modules/playlist.js`. No hace falta tocar `main.js`.
