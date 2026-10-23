import { getCollection, type CollectionEntry } from 'astro:content';
import { normalize, type TrabajoItem } from './search';

export { slugify } from './search';

/** Construye una URL interna respetando el `base` del sitio (/patro-bloggers). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** Ruta de imagen: deja intactas las absolutas (ya incluyen /patro-bloggers) y las externas. */
export function imageUrl(src: string): string {
  return /^(https?:)?\/\//.test(src) || src.startsWith('/') ? src : url(src);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Todos los trabajos, del más reciente al más antiguo. */
export async function getTrabajos() {
  const trabajos = await getCollection('trabajos');
  return trabajos.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Quita la sintaxis Markdown más común para buscar sobre el texto plano. */
function markdownToText(markdown = ''): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ');
}

export function toTrabajoItem(trabajo: CollectionEntry<'trabajos'>): TrabajoItem {
  const { title, author, date, subject, image, tags } = trabajo.data;
  return {
    id: trabajo.id,
    href: url(`trabajos/${trabajo.id}`),
    title,
    author,
    date: date.toISOString(),
    dateLabel: formatDate(date),
    subject,
    image: image ? imageUrl(image) : undefined,
    tags,
    searchText: normalize([title, author, ...tags, markdownToText(trabajo.body)].join(' ')),
  };
}
