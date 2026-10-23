// Código compartido con el navegador: no importar nada de `astro:content` aquí
import type { Course } from './courses';

/** Datos mínimos de un trabajo para el listado con búsqueda (se serializan a la isla React). */
export interface TrabajoItem {
  id: string;
  href: string;
  title: string;
  author: string;
  date: string;
  dateLabel: string;
  subject?: string;
  /** Curso escolar, calculado a partir de la fecha */
  course: Course;
  image?: string;
  tags: string[];
  /** Comienzo del texto para la tarjeta */
  excerpt: string;
  /** Título, autor, etiquetas y texto, normalizados para buscar */
  searchText: string;
}

/** Minúsculas y sin tildes, para que "ingles" encuentre "Inglés". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function slugify(text: string): string {
  return normalize(text)
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
