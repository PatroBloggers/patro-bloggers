import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SUBJECTS } from './lib/subjects';

// Esquema de cada trabajo. Debe coincidir con los campos definidos en .pages.yml
const trabajos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/trabajos' }),
  // `image()` comprueba que la imagen existe y permite optimizarla al hacer el build
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      // Pseudónimo del alumno/a: nunca nombres reales
      author: z.string().min(1),
      date: z.coerce.date(),
      subject: z.enum(SUBJECTS).optional(),
      // El CMS puede dejar el campo vacío al quitar una imagen
      image: z.preprocess((value) => (value === '' || value === null ? undefined : value), image().optional()),
      tags: z.array(z.string()).default([]),
    }),
});

export const collections = { trabajos };
