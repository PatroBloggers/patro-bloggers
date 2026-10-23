// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

const base = '/patro-bloggers';

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
  vite: {
    plugins: [serveOutsideBase()],
  },
});
