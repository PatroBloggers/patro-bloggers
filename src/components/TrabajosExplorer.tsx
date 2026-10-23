import { useEffect, useMemo, useRef, useState } from 'react';
import { normalize, slugify, type TrabajoItem } from '../lib/search';
import { SHARE_ICON, shareTrabajo } from '../lib/share';

interface Props {
  items: TrabajoItem[];
  subjects: readonly string[];
}

interface Filters {
  query: string;
  /** slug del curso (`2026-2027`), o null para todos */
  course: string | null;
  /** slug de la asignatura, o null para todas */
  subject: string | null;
  /** slugs de las etiquetas seleccionadas (deben cumplirse todas) */
  tags: string[];
}

const EMPTY: Filters = { query: '', course: null, subject: null, tags: [] };

/** A partir de este ancho, los cursos se ven en el lateral y no hace falta el botón de menú */
const DESKTOP_QUERY = '(min-width: 900px)';

/** Trabajos que se muestran de entrada y que añade cada clic en "Ver más" */
const PAGE_SIZE = 12;

function readFiltersFromUrl(): Filters {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get('q') ?? '',
    course: params.get('curso'),
    subject: params.get('asignatura'),
    tags: params.getAll('tag'),
  };
}

function writeFiltersToUrl({ query, course, subject, tags }: Filters) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (course) params.set('curso', course);
  if (subject) params.set('asignatura', subject);
  tags.forEach((tag) => params.append('tag', tag));
  const search = params.toString();
  window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
}

export default function TrabajosExplorer({ items, subjects }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  // Evita sobrescribir la URL con filtros vacíos antes de haberla leído
  const urlLoaded = useRef(false);

  useEffect(() => {
    setFilters(readFiltersFromUrl());
    urlLoaded.current = true;
  }, []);

  useEffect(() => {
    if (urlLoaded.current) writeFiltersToUrl(filters);
    // Con otros filtros, volver a mostrar solo la primera tanda
    setVisible(PAGE_SIZE);
  }, [filters]);

  // Panel de cursos en móvil: Escape lo cierra, la página no se desplaza por detrás
  // y el foco entra en el panel al abrirlo y vuelve al botón al cerrarlo. Mientras está abierto,
  // el resto de la página (salvo el fondo oscuro, que lo cierra) es inerte: ni foco ni clics
  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const close = () => setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    desktop.addEventListener('change', close);
    document.body.style.overflow = 'hidden';
    const inerted: HTMLElement[] = [];
    for (let el = sidebar.current; el?.parentElement && el !== document.body; el = el.parentElement) {
      for (const sibling of el.parentElement.children) {
        if (sibling === el || !(sibling instanceof HTMLElement) || sibling.inert) continue;
        if (sibling.classList.contains('sidebar-backdrop')) continue;
        sibling.inert = true;
        inerted.push(sibling);
      }
    }
    sidebar.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', close);
      document.body.style.overflow = '';
      inerted.forEach((el) => (el.inert = false));
      if (!desktop.matches) menuButton.current?.focus();
    };
  }, [menuOpen]);

  // Cursos con trabajos, del más reciente al más antiguo
  const courses = useMemo(() => {
    const bySlug = new Map<string, { label: string; count: number }>();
    for (const { course } of items) {
      const entry = bySlug.get(course.slug) ?? { label: course.label, count: 0 };
      entry.count++;
      bySlug.set(course.slug, entry);
    }
    return [...bySlug]
      .map(([slug, { label, count }]) => ({ slug, label, count }))
      .sort((a, b) => b.slug.localeCompare(a.slug));
  }, [items]);

  // Etiquetas de todos los trabajos, de más a menos usadas
  const allTags = useMemo(() => {
    const bySlug = new Map<string, { label: string; count: number }>();
    for (const item of items) {
      for (const tag of item.tags) {
        const slug = slugify(tag);
        const entry = bySlug.get(slug) ?? { label: tag, count: 0 };
        entry.count++;
        bySlug.set(slug, entry);
      }
    }
    return [...bySlug]
      .map(([slug, { label, count }]) => ({ slug, label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'));
  }, [items]);

  const results = useMemo(() => {
    const words = normalize(filters.query).split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      if (filters.course && item.course.slug !== filters.course) return false;
      if (filters.subject && slugify(item.subject ?? '') !== filters.subject) return false;
      const itemTags = item.tags.map(slugify);
      if (!filters.tags.every((tag) => itemTags.includes(tag))) return false;
      return words.every((word) => item.searchText.includes(word));
    });
  }, [items, filters]);

  const hasFilters =
    filters.query.trim() !== '' || filters.course !== null || filters.subject !== null || filters.tags.length > 0;

  const selectCourse = (slug: string | null) => {
    setFilters((f) => ({ ...f, course: slug }));
    setMenuOpen(false);
  };

  const selectedCourse = courses.find((c) => c.slug === filters.course);

  const toggleTag = (slug: string) =>
    setFilters((f) => ({
      ...f,
      tags: f.tags.includes(slug) ? f.tags.filter((t) => t !== slug) : [...f.tags, slug],
    }));

  return (
    <div className="explorer">
      <aside id="cursos" ref={sidebar} className={menuOpen ? 'sidebar sidebar-open' : 'sidebar'} aria-label="Cursos">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Cursos</h2>
          <button type="button" className="sidebar-close" aria-label="Cerrar" onClick={() => setMenuOpen(false)}>
            ×
          </button>
        </div>
        <ul className="course-list">
          <li>
            <button
              type="button"
              className="course-button"
              aria-pressed={filters.course === null}
              onClick={() => selectCourse(null)}
            >
              Todos los cursos <span className="course-count">{items.length}</span>
            </button>
          </li>
          {courses.map(({ slug, label, count }) => (
            <li key={slug}>
              <button
                type="button"
                className="course-button"
                aria-pressed={filters.course === slug}
                onClick={() => selectCourse(slug)}
              >
                {label} <span className="course-count">{count}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="explorer-main">
        <div className="filters">
          <div className="search-row">
            <button
              type="button"
              ref={menuButton}
              className="menu-button"
              aria-expanded={menuOpen}
              aria-controls="cursos"
              onClick={() => setMenuOpen(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              <span>{selectedCourse?.label ?? 'Cursos'}</span>
            </button>
            <input
              type="search"
              className="search"
              placeholder="Buscar por título, autor o texto…"
              aria-label="Buscar trabajos"
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            />
          </div>

          <div className="filter-group" role="group" aria-label="Asignatura">
            <span className="filter-label">Asignatura</span>
            <button
              type="button"
              className="chip"
              aria-pressed={filters.subject === null}
              onClick={() => setFilters((f) => ({ ...f, subject: null }))}
            >
              Todas
            </button>
            {subjects.map((subject) => {
              const slug = slugify(subject);
              return (
                <button
                  key={slug}
                  type="button"
                  className="chip"
                  aria-pressed={filters.subject === slug}
                  onClick={() => setFilters((f) => ({ ...f, subject: f.subject === slug ? null : slug }))}
                >
                  {subject}
                </button>
              );
            })}
          </div>

          {allTags.length > 0 && (
            <div className="filter-group" role="group" aria-label="Etiquetas">
              <span className="filter-label">Etiquetas</span>
              {allTags.map(({ slug, label }) => (
                <button
                  key={slug}
                  type="button"
                  className="chip"
                  aria-pressed={filters.tags.includes(slug)}
                  onClick={() => toggleTag(slug)}
                >
                  #{label}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="results-count" aria-live="polite">
          {results.length === 1 ? '1 trabajo' : `${results.length} trabajos`}
          {hasFilters && (
            <button type="button" className="link-button" onClick={() => setFilters(EMPTY)}>
              Quitar filtros
            </button>
          )}
        </p>

        {results.length > 0 ? (
          <div className="grid">
            {results.slice(0, visible).map((item) => (
              <TrabajoCard key={item.id} item={item} activeTags={filters.tags} onTagClick={toggleTag} />
            ))}
          </div>
        ) : (
          <p className="empty">
            {items.length === 0 ? 'Todavía no hay trabajos publicados.' : 'Ningún trabajo coincide con la búsqueda.'}
          </p>
        )}

        {results.length > visible && (
          <div className="load-more">
            <button type="button" className="chip" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
              Ver más trabajos ({results.length - visible} más)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CardProps {
  item: TrabajoItem;
  activeTags: string[];
  onTagClick: (slug: string) => void;
}

function TrabajoCard({ item, activeTags, onTagClick }: CardProps) {
  return (
    <article className="card">
      {item.image && (
        <img
          className="card-image"
          src={item.image.src}
          srcSet={item.image.srcset}
          sizes="(max-width: 600px) 100vw, 340px"
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="card-body">
        <p className="kicker">
          {item.subject ? (
            <>
              <span className="subject">{item.subject}</span> · {item.course.years}
            </>
          ) : (
            item.course.label
          )}
        </p>
        <h2>
          <a href={item.href}>{item.title}</a>
        </h2>
        <p className="meta">
          {item.author} · <time dateTime={item.date}>{item.dateLabel}</time>
        </p>
        {item.excerpt && <p className="card-excerpt">{item.excerpt}</p>}
        <div className="card-footer">
          {item.tags.length > 0 && (
            <ul className="tags">
              {item.tags.map((tag) => {
                const slug = slugify(tag);
                return (
                  <li key={slug}>
                    <button
                      type="button"
                      className="tag"
                      aria-pressed={activeTags.includes(slug)}
                      onClick={() => onTagClick(slug)}
                    >
                      #{tag}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            className="icon-button"
            aria-label={`Compartir «${item.title}»`}
            title="Compartir"
            onClick={() => shareTrabajo({ title: item.title, author: item.author, href: item.href })}
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              {SHARE_ICON.circles.map(({ cx, cy }) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />
              ))}
              <path d={SHARE_ICON.lines} />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
