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

/** Todos los trabajos, del más reciente al más antiguo (mismo día: por nombre de fichero, para un orden estable). */
export async function getTrabajos() {
  const trabajos = await getCollection('trabajos');
  return trabajos.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || b.id.localeCompare(a.id));
}

/** Quita la sintaxis Markdown más común para buscar sobre el texto plano. */
export function markdownToText(markdown = ''): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Comienzo del texto (sin subtítulos) para descripciones y vistas previas, cortado en una palabra. */
export function excerpt(markdown = '', maxLength = 160): string {
  const text = markdownToText(markdown.replace(/^#{1,6} .*$/gm, '')).trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, text.lastIndexOf(' ', maxLength)).replace(/[\s,;:.]+$/, '') + '…';
}

/** Minutos de lectura (unas 200 palabras por minuto), como mínimo 1. */
export function readingMinutes(markdown = ''): number {
  const words = markdownToText(markdown).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
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
