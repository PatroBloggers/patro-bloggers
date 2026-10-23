import { getImage } from 'astro:assets';
import { getCollection, type CollectionEntry } from 'astro:content';
import { courseOf } from './courses';
import { normalize, type TrabajoItem } from './search';

export { slugify } from './search';

/** Construye una URL interna respetando el `base` del sitio (/patro-bloggers). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
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
  return (
    markdown
      // Enlaces e imágenes: solo el texto
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Notas al pie: la llamada [^1] y el marcador de la definición
      .replace(/\[\^[^\]]+\]:?/g, '')
      .replace(/<[^>]+>/g, ' ')
      // Marcas al principio de línea: títulos, citas, viñetas, casillas, separadores y vallas de código
      .replace(/^\s*(#{1,6}|>|[-+*](\s+\[[ xX]\])?|\d+\.|-{3,}|\`{3}.*)(?=\s|$)/gm, ' ')
      // Filas separadoras y barras de las tablas
      .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, ' ')
      .replace(/\|/g, ' ')
      // Negrita, cursiva, tachado y código: se quita la marca, no se deja hueco
      .replace(/[*_~`]/g, '')
      .replace(/\s+/g, ' ')
  );
}

/** Comienzo del texto (sin subtítulos) para descripciones y vistas previas, cortado en una palabra. */
export function excerpt(markdown = '', maxLength = 160): string {
  const text = markdownToText(markdown.replace(/^#{1,6} .*$/gm, '')).trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, text.lastIndexOf(' ', maxLength)).replace(/[\s,;:.]+$/, '') + '…';
}

/** Imagen de tarjeta: WebP adaptable a partir de 400px (las tarjetas miden unos 270-340px) */
async function cardImage(src: ImageMetadata) {
  const { src: optimized, srcSet } = await getImage({ src, width: 400, format: 'webp', layout: 'constrained' });
  return { src: optimized, srcset: srcSet.attribute };
}

/** Imagen para compartir: JPG de 1200px, el formato que mejor aceptan WhatsApp, Teams, etc. */
export async function shareImage(src: ImageMetadata): Promise<string> {
  return (await getImage({ src, width: 1200, format: 'jpg', layout: 'none' })).src;
}

/** Minutos de lectura (unas 200 palabras por minuto), como mínimo 1. */
export function readingMinutes(markdown = ''): number {
  const words = markdownToText(markdown).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function toTrabajoItem(trabajo: CollectionEntry<'trabajos'>): Promise<TrabajoItem> {
  const { title, author, date, subject, image, tags } = trabajo.data;
  return {
    id: trabajo.id,
    href: url(`trabajos/${trabajo.id}`),
    title,
    author,
    date: date.toISOString(),
    dateLabel: formatDate(date),
    subject,
    course: courseOf(date),
    image: image ? await cardImage(image) : undefined,
    tags,
    excerpt: excerpt(trabajo.body, 140),
    searchText: normalize([title, author, ...tags, markdownToText(trabajo.body)].join(' ')),
  };
}
