import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Zap, ArrowLeft, ArrowRight, Clock, Info, AlertTriangle, Check,
  MessageSquare,
} from 'lucide-react';
import {
  HELP_ARTICLES, getArticle, getCategory, relatedArticles,
} from '@/lib/help-content';

export function generateStaticParams() {
  return HELP_ARTICLES.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: 'Article not found — Chain Payments' };
  return {
    title: `${article.title} — Chain Payments Help`,
    description: article.summary,
  };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) notFound();

  const category = getCategory(article.category);
  const related = relatedArticles(article);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">Chain Payments</span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft size={15} /> Help &amp; Support
        </Link>

        {/* Title */}
        <div className="mt-6 border-b border-gray-100 pb-8">
          {category && (
            <Link
              href={`/help#${category.id}`}
              className="text-xs font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-700"
            >
              {category.name}
            </Link>
          )}
          <h1 className="mt-2 text-[2rem] font-bold leading-tight tracking-tight text-gray-900">
            {article.title}
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed text-gray-600">{article.summary}</p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-gray-400">
            <Clock size={12} /> {article.readMinutes} min read
          </p>
        </div>

        {/* Body */}
        <div className="mt-8 space-y-8">
          {article.sections.map((section, i) => (
            <section key={i}>
              {section.heading && (
                <h2 className="mb-3 text-[1.15rem] font-semibold tracking-tight text-gray-900">
                  {section.heading}
                </h2>
              )}

              {section.body?.map((p, j) => (
                <p key={j} className="mb-3 text-[15px] leading-[1.7] text-gray-700 last:mb-0">
                  {p}
                </p>
              ))}

              {section.steps && (
                <ol className="mt-3 space-y-3">
                  {section.steps.map((step, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                        {j + 1}
                      </span>
                      <span className="text-[15px] leading-[1.7] text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {section.bullets && (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2.5">
                      <Check size={15} className="mt-1 shrink-0 text-gray-400" />
                      <span className="text-[15px] leading-[1.7] text-gray-700">{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.note && (
                <div
                  className={`mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3.5 ${
                    section.note.tone === 'warn'
                      ? 'border-amber-200 bg-amber-50/70'
                      : 'border-blue-100 bg-blue-50/70'
                  }`}
                >
                  {section.note.tone === 'warn' ? (
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                  ) : (
                    <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  )}
                  <p
                    className={`text-[14px] leading-relaxed ${
                      section.note.tone === 'warn' ? 'text-amber-900' : 'text-blue-900'
                    }`}
                  >
                    {section.note.text}
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Still stuck */}
        <div className="mt-12 flex flex-col items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MessageSquare size={17} className="mt-0.5 shrink-0 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Did this answer your question?</p>
              <p className="mt-0.5 text-[13px] text-gray-500">
                If not, we would rather hear about it than have you guess.
              </p>
            </div>
          </div>
          <Link
            href="/help#contact"
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Contact support
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12 border-t border-gray-100 pt-8">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Related articles</h2>
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
              {related.map(r => (
                <li key={r.slug}>
                  <Link
                    href={`/help/${r.slug}`}
                    className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{r.title}</p>
                      <p className="mt-0.5 truncate text-[13px] text-gray-500">{r.summary}</p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
}
