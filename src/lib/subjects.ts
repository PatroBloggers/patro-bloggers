// Asignaturas permitidas. Si se añade una, añadirla también a las opciones del campo `subject` en .pages.yml
export const SUBJECTS = ['Lengua', 'Inglés'] as const;

export type Subject = (typeof SUBJECTS)[number];
