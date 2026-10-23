# Patro Blogs

Web estática con los trabajos del alumnado, publicada en GitHub Pages:
https://patrobloggers.github.io/patro-blogs/

- **Astro** genera una página HTML por cada trabajo.
- **Pages CMS** (https://pagescms.org) permite crear y editar trabajos desde el navegador; su configuración está en `.pages.yml`.
- Cada trabajo es un fichero Markdown en `src/content/trabajos/`, validado por el esquema de `src/content.config.ts`.

## Campos de un trabajo

| Campo     | Obligatorio | Notas                                  |
| --------- | ----------- | -------------------------------------- |
| `title`   | sí          |                                        |
| `author`  | sí          | Siempre un **pseudónimo**, nunca el nombre real |
| `date`    | sí          | Se usa para ordenar                    |
| `subject` | no          | Asignatura                             |
| `image`   | no          | Se sube a `public/images/`             |
| `tags`    | no          | Lista de etiquetas                     |
| texto     | sí          | Cuerpo del Markdown                    |

## Desarrollo

Requiere Node 24 (`nvm use`).

| Comando           | Acción                                        |
| ----------------- | --------------------------------------------- |
| `npm install`     | Instala dependencias                          |
| `npm run dev`     | Servidor local en `http://localhost:4321/patro-blogs/` |
| `npm run build`   | Genera la web en `./dist/`                    |
| `npm run preview` | Sirve el build localmente                     |

## Publicación

Cada push a `main` despliega con `.github/workflows/deploy.yml`.
En el repo: *Settings → Pages → Source: GitHub Actions*.
