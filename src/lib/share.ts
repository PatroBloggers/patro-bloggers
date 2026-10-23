// Compartir un trabajo. Lo usan la tarjeta (React) y la página del trabajo (script de Astro).

/** Trazos del icono de compartir (tres nodos unidos), en un viewBox de 24x24 */
export const SHARE_ICON = {
  circles: [
    { cx: 18, cy: 5 },
    { cx: 6, cy: 12 },
    { cx: 18, cy: 19 },
  ],
  lines: 'M8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
};

interface ShareData {
  title: string;
  author: string;
  /** Ruta del sitio o URL absoluta */
  href: string;
}

/**
 * En móvil abre el menú de compartir del sistema; en ordenador copia el enlace,
 * que suele ser más rápido que el menú de compartir de Windows o macOS.
 */
export async function shareTrabajo({ title, author, href }: ShareData): Promise<void> {
  const url = new URL(href, window.location.href).href;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  if (isTouch && navigator.share) {
    try {
      await navigator.share({ title, text: `«${title}», de ${author}, en Patro Bloggers`, url });
      return;
    } catch (error) {
      // Cerrar el menú sin compartir no es un error
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast('Enlace copiado');
  } catch {
    // Sin permiso para el portapapeles: dejar que lo copie a mano
    window.prompt('Copia el enlace:', url);
  }
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

/** Aviso breve en la parte inferior de la pantalla, también anunciado a lectores de pantalla */
function showToast(message: string) {
  let toast = document.querySelector<HTMLDivElement>('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add('toast-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast-visible'), 2000);
}
