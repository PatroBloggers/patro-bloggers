// Curso escolar en España: de septiembre a junio. Código compartido con el navegador.

export interface Course {
  /** Para la URL: `2026-2027` */
  slug: string;
  /** Para mostrar: `Curso 2026/2027` */
  label: string;
}

/**
 * Curso al que pertenece una fecha. De septiembre a diciembre, el curso empieza ese año;
 * de enero a agosto, empezó el anterior (julio y agosto cuentan para el curso que acaba de terminar).
 * Se usan los métodos UTC porque las fechas del frontmatter (`2026-10-23`) se leen a medianoche UTC.
 */
export function courseOf(date: Date): Course {
  const SEPTEMBER = 8; // getUTCMonth() empieza en 0 = enero
  const start = date.getUTCMonth() >= SEPTEMBER ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  return { slug: `${start}-${start + 1}`, label: `Curso ${start}/${start + 1}` };
}
