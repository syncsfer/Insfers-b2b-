import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight, ArrowUpRight, Clock, Info, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
  DEV_PRODUCTS, getProduct, getCategory, endpointsForProduct,
  API_ENDPOINTS, eventsInCategory, WEBHOOK_EVENTS, type ProductStatus,
} from '@/lib/developer-content';
import { getGuide, type GuideSection } from '@/lib/developer-guides';
import { CodeBlock } from '../code-block';
import { EndpointCard } from '../endpoint-card';

export function generateStaticParams() {
  return DEV_PRODUCTS.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: 'Not found — Chain Payments docs' };
  return {
    title: `${product.name} — Chain Payments docs`,
    description: product.tagline,
  };
}

const STATUS_LABEL: Record<ProductStatus, { label: string; className: string } | null> = {
  ga: null,
  beta: { label: 'Beta', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  preview: { label: 'Preview', className: 'bg-violet-50 text-violet-700 border-violet-200' },
};

const NOTE_STYLE = {
  info: { wrap: 'bg-blue-50 border-blue-200', icon: 'text-blue-600', Icon: Info },
  warn: { wrap: 'bg-amber-50 border-amber-200', icon: 'text-amber-600', Icon: AlertTriangle },
  success: { wrap: 'bg-green-50 border-green-200', icon: 'text-green-600', Icon: CheckCircle2 },
} as const;

function Section({ section }: { section: GuideSection }) {
  const note = section.note ? NOTE_STYLE[section.note.tone] : null;

  return (
    <section className="mt-8 first:mt-0">
      {section.heading && (
        <h2 className="text-[17px] font-semibold text-gray-900 mb-3">{section.heading}</h2>
      )}

      {section.body?.map((p, i) => (
        <p key={i} className="text-[15px] leading-relaxed text-gray-600 mb-3 last:mb-0">
          {p}
        </p>
      ))}

      {section.steps && (
        <ol className="mt-3 space-y-2.5">
          {section.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-gray-600">
              <span className="shrink-0 w-5 h-5 mt-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      )}

      {section.bullets && (
        <ul className="mt-3 space-y-2">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-gray-600">
              <span className="shrink-0 w-1.5 h-1.5 mt-2.5 rounded-full bg-gray-300" />
              {b}
            </li>
          ))}
        </ul>
      )}

      {section.table && (
        <div className="mt-4 rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[420px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {section.table.headers.map(h => (
                  <th key={h} className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`px-3.5 py-2.5 text-[13px] ${
                        j === 0 ? 'font-mono font-medium text-gray-900 whitespace-nowrap' : 'text-gray-600'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.code && (
        <div className="mt-4">
          <CodeBlock source={section.code.source} label={section.code.label ?? section.code.language} />
        </div>
      )}

      {section.endpoints && (
        <div className="mt-4 space-y-4">
          {section.endpoints
            .map(id => API_ENDPOINTS.find(e => e.id === id))
            .filter((e): e is NonNullable<typeof e> => !!e)
            .map(e => <EndpointCard key={e.id} endpoint={e} />)}
        </div>
      )}

      {section.note && note && (
        <div className={`mt-4 flex gap-2.5 rounded-lg border p-3.5 ${note.wrap}`}>
          <note.Icon size={15} className={`shrink-0 mt-0.5 ${note.icon}`} />
          <p className="text-[13px] leading-relaxed text-gray-700">{section.note.text}</p>
        </div>
      )}
    </section>
  );
}

export default async function ProductDocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const guide = getGuide(slug);
  const category = getCategory(product.category);
  const status = STATUS_LABEL[product.status];
  const ownEndpoints = endpointsForProduct(slug);

  // The API reference page lists everything; product pages list only their own.
  const isReference = slug === 'api-reference';
  const relatedEvents = slug === 'webhooks'
    ? WEBHOOK_EVENTS
    : eventsInCategory(product.category).slice(0, 4);

  // Endpoints already shown inside a section shouldn't be repeated below it.
  const shownInSections = new Set(guide?.sections.flatMap(s => s.endpoints ?? []) ?? []);
  const remainingEndpoints = ownEndpoints.filter(e => !shownInSections.has(e.id));

  return (
    <article className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-3">
        <Link href="/developers" className="hover:text-gray-600">Docs</Link>
        <span>/</span>
        {category && (
          <>
            <Link href={`/developers#${category.id}`} className="hover:text-gray-600">
              {category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-600">{product.name}</span>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{product.name}</h1>
        {status && (
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${status.className}`}>
            {status.label}
          </span>
        )}
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
        {guide?.intro ?? product.tagline}
      </p>

      <div className="mt-4 flex items-center gap-4 flex-wrap pb-8 border-b border-gray-100">
        {guide && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={12} /> {guide.readMinutes} min read
          </span>
        )}
        {product.dashboardHref && (
          <Link
            href={product.dashboardHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Open in dashboard <ArrowUpRight size={12} />
          </Link>
        )}
      </div>

      {/* Body */}
      <div className="pt-2">
        {guide?.sections.map((s, i) => <Section key={i} section={s} />)}
      </div>

      {/* Endpoints */}
      {(isReference ? API_ENDPOINTS : remainingEndpoints).length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-100">
          <h2 className="text-[17px] font-semibold text-gray-900 mb-1">
            {isReference ? 'All endpoints' : 'Endpoints'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {isReference
              ? `${API_ENDPOINTS.length} endpoints across every product.`
              : `Reference for ${product.name.toLowerCase()}.`}
          </p>
          <div className="space-y-4">
            {(isReference ? API_ENDPOINTS : remainingEndpoints).map(e => (
              <EndpointCard key={e.id} endpoint={e} />
            ))}
          </div>
        </section>
      )}

      {/* Events */}
      {relatedEvents.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-100">
          <h2 className="text-[17px] font-semibold text-gray-900 mb-1">
            {slug === 'webhooks' ? 'Event catalogue' : 'Related events'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Subscribe to these on a webhook endpoint to react as things happen.
          </p>
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
            {relatedEvents.map(e => (
              <div key={e.type} className="px-4 py-3">
                <code className="text-[12.5px] font-mono font-medium text-gray-900">{e.type}</code>
                <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600">{e.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Next */}
      {guide?.next && guide.next.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-100">
          <h2 className="text-[17px] font-semibold text-gray-900 mb-3">Next</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {guide.next.map(s => {
              const p = getProduct(s);
              if (!p) return null;
              return (
                <Link
                  key={s}
                  href={`/developers/${s}`}
                  className="group rounded-xl border border-gray-200 p-3.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-gray-900">{p.name}</span>
                    <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-500" />
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-gray-500 line-clamp-2">{p.tagline}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
