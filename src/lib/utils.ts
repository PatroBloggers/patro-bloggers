import { getCollection } from 'astro:content';

/** Construye una URL interna respetando el `base` del sitio (/patro-bloggers). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** Ruta de imagen: deja intactas las absolutas (ya incluyen /patro-bloggers) y las externas. */
export function imageUrl(src: string): string {
  return /^(https?:)?\/\//.test(src) || src.startsWith('/') ? src : url(src);
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Todos los trabajos, del más reciente al más antiguo. */
export async function getTrabajos() {
  const trabajos = await getCollection('trabajos');
  return trabajos.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
