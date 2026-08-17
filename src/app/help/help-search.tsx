'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import { searchArticles, getCategory } from '@/lib/help-content';

/** Search box plus inline results, replacing the browse view while active. */
export function HelpSearch({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchArticles(query), [query]);
  const searching = query.trim().length > 0;

  return (
    <>
      <div className="relative mx-auto max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for an answer…"
          aria-label="Search help articles"
          className="h-13 w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-11 text-[15px] shadow-sm transition-shadow placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
        />
        {searching && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {searching ? (
        <div className="mx-auto mt-10 max-w-3xl">
          <p className="mb-4 text-sm text-gray-500">
            {results.length === 0
              ? `No articles match “${query}”.`
              : `${results.length} article${results.length === 1 ? '' : 's'} for “${query}”`}
          </p>

          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center">
              <p className="text-sm text-gray-600">Try a different wording, or contact us directly.</p>
              <a
                href="#contact"
                onClick={() => setQuery('')}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Get in touch <ArrowRight size={14} />
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
              {results.map(a => (
                <li key={a.slug}>
                  <Link
                    href={`/help/${a.slug}`}
                    className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-gray-50"
                  >
                    <FileText size={16} className="mt-0.5 shrink-0 text-gray-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-gray-500">{a.summary}</p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {getCategory(a.category)?.name} · {a.readMinutes} min read
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        children
      )}
    </>
  );
}
