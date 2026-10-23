// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import { satteri } from '@astrojs/markdown-satteri';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { imageSize } from 'image-size';

const base = '/patro-bloggers';

/**
 * Las fotos del texto de un trabajo se muestran como mucho al ancho de la columna de lectura (700px).
 * Con ese ancho, Astro genera versiones de hasta el doble (pantallas de alta densidad) y nunca
 * sirve la original, que puede pesar varios MB si viene de un móvil. Las imágenes más estrechas
 * conservan su ancho, para no verse estiradas.
 */
const CONTENT_IMAGE_MAX_WIDTH = 700;
// Las rutas de las imágenes son relativas a los trabajos, que están todos en esta carpeta
const TRABAJOS_DIR = resolve('src/content/trabajos');

const limitContentImageWidth = {
  name: 'limit-content-image-width',
  element: {
    filter: ['img'],
    /** @param {any} node @param {any} ctx */
    visit(node, ctx) {
      const src = node.properties?.src;
      if (node.properties?.width || typeof src !== 'string' || /^(https?:)?\/\//.test(src)) return;
      let width = CONTENT_IMAGE_MAX_WIDTH;
      try {
        const natural = imageSize(readFileSync(resolve(TRABAJOS_DIR, decodeURI(src)))).width;
        if (natural) width = Math.min(natural, CONTENT_IMAGE_MAX_WIDTH);
      } catch {
        // Si no se puede leer, el build fallará igualmente al procesar la imagen, con un error más claro
      }
      ctx.setProperty(node, 'width', width);
    },
  },
};

/**
 * En `astro dev`, Astro responde a las páginas fuera de `base` con su propio aviso de 404.
 * Con esto, "/" lleva a la portada y el resto muestra nuestra 404.
 * (`astro preview` ignora los plugins de Vite del proyecto, así que ahí no aplica.
 * En GitHub Pages, lo que queda fuera de /patro-bloggers/ lo sirve el sitio de la organización.)
 */
function serveOutsideBase() {
  /** @type {import('vite').Connect.NextHandleFunction} */
  const middleware = (req, res, next) => {
    const url = req.url ?? '/';
    const path = url.split('?')[0];
    if (path === base || path.startsWith(`${base}/`)) return next();
    if (path === '/' || path === '/index.html') {
      res.writeHead(302, { Location: `${base}/` });
      res.end();
      return;
    }
    // Solo páginas: las peticiones internas de Vite (/@vite/client, /node_modules/...) siguen su curso
    if (req.headers.accept?.includes('text/html')) req.url = `${base}${url}`;
    next();
  };
  // Astro mete sus middlewares al principio de la pila desde un post hook; este va después y queda delante
  /** @param {{ middlewares: import('vite').Connect.Server }} server */
  const putFirst = (server) => () => {
    server.middlewares.stack.unshift({ route: '', handle: middleware });
  };
  return {
    name: 'serve-outside-base',
    enforce: /** @type {const} */ ('post'),
    configureServer: putFirst,
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://patrobloggers.github.io',
  base,
  trailingSlash: 'ignore',
  integrations: [react()],
  markdown: {
    processor: satteri({
      hastPlugins: [limitContentImageWidth],
      features: {
        gfm: { footnotes: { label: 'Notas', backLabel: 'Volver a la referencia {reference}' } },
      },
    }),
  },
  image: {
    // Imágenes adaptables por defecto (también las del texto de los trabajos): varias versiones
    // hasta 1400px, el doble de la columna de lectura, para no servir nunca la foto original
    layout: 'constrained',
    breakpoints: [400, 700, 1000, 1400],
    responsiveStyles: true,
  },
  vite: {
    plugins: [serveOutsideBase()],
  },
});
