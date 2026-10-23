import { useEffect, useMemo, useRef, useState } from 'react';
import { normalize, slugify, type TrabajoItem } from '../lib/search';

interface Props {
  items: TrabajoItem[];
  subjects: readonly string[];
}

interface Filters {
  query: string;
  /** slug de la asignatura, o null para todas */
  subject: string | null;
  /** slugs de las etiquetas seleccionadas (deben cumplirse todas) */
  tags: string[];
}

const EMPTY: Filters = { query: '', subject: null, tags: [] };

function readFiltersFromUrl(): Filters {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get('q') ?? '',
    subject: params.get('asignatura'),
    tags: params.getAll('tag'),
  };
}

function writeFiltersToUrl({ query, subject, tags }: Filters) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (subject) params.set('asignatura', subject);
  tags.forEach((tag) => params.append('tag', tag));
  const search = params.toString();
  window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
}

export default function TrabajosExplorer({ items, subjects }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  // Evita sobrescribir la URL con filtros vacíos antes de haberla leído
  const urlLoaded = useRef(false);

  useEffect(() => {
    setFilters(readFiltersFromUrl());
    urlLoaded.current = true;
  }, []);

  useEffect(() => {
    if (urlLoaded.current) writeFiltersToUrl(filters);
  }, [filters]);

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
      if (filters.subject && slugify(item.subject ?? '') !== filters.subject) return false;
      const itemTags = item.tags.map(slugify);
      if (!filters.tags.every((tag) => itemTags.includes(tag))) return false;
      return words.every((word) => item.searchText.includes(word));
    });
  }, [items, filters]);

  const hasFilters = filters.query.trim() !== '' || filters.subject !== null || filters.tags.length > 0;

  const toggleTag = (slug: string) =>
    setFilters((f) => ({
      ...f,
      tags: f.tags.includes(slug) ? f.tags.filter((t) => t !== slug) : [...f.tags, slug],
    }));

  return (
    <div className="explorer">
      <div className="filters">
        <input
          type="search"
          className="search"
          placeholder="Buscar por título, autor o texto…"
          aria-label="Buscar trabajos"
          value={filters.query}
          onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
        />

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
          {results.map((item) => (
            <TrabajoCard key={item.id} item={item} activeTags={filters.tags} onTagClick={toggleTag} />
          ))}
        </div>
      ) : (
        <p className="empty">
          {items.length === 0 ? 'Todavía no hay trabajos publicados.' : 'Ningún trabajo coincide con la búsqueda.'}
        </p>
      )}
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
      {item.image && <img className="card-image" src={item.image} alt="" loading="lazy" />}
      <div className="card-body">
        {item.subject && <p className="subject">{item.subject}</p>}
        <h2>
          <a href={item.href}>{item.title}</a>
        </h2>
        <p className="meta">
          {item.author} · <time dateTime={item.date}>{item.dateLabel}</time>
        </p>
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
      </div>
    </article>
  );
}
