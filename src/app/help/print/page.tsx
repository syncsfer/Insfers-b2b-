import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';
import { PrintButton } from './print-button';
import {
  HELP_CATEGORIES, HELP_ARTICLES, HELP_FAQS, articlesInCategory,
} from '@/lib/help-content';

export const metadata = {
  title: 'Chain Payments — Help & Support Handbook',
  description: 'Complete help documentation for Chain Payments, formatted for print and PDF export.',
};

/**
 * Every help article in one printable document.
 *
 * Screen chrome is hidden at print time via `print:hidden`, and each article
 * starts on a fresh page so the PDF reads like a handbook rather than a dump.
 */
export default function HelpPrintPage() {
  const generated = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Screen-only toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={15} /> Back to Help
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12 print:max-w-none print:px-0 print:py-0">
        {/* Cover */}
        <header className="border-b-2 border-gray-900 pb-8 print:break-after-page">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 print:bg-blue-600">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-[17px] font-bold text-gray-900">Chain Payments</span>
          </div>

          <h1 className="mt-10 text-[2.75rem] font-bold leading-[1.1] tracking-tight text-gray-900">
            Help &amp; Support
            <br />
            Handbook
          </h1>
          <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-gray-600">
            Every guide and answer for accepting and sending stablecoin payments — how money
            moves, how refunds and claim links work, and how to keep an account secure.
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-gray-200 pt-6 text-[13px]">
            <div>
              <dt className="text-gray-400">Articles</dt>
              <dd className="mt-0.5 font-semibold text-gray-900">{HELP_ARTICLES.length}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Topics</dt>
              <dd className="mt-0.5 font-semibold text-gray-900">{HELP_CATEGORIES.length}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Generated</dt>
              <dd className="mt-0.5 font-semibold text-gray-900">{generated}</dd>
            </div>
          </dl>
        </header>

        {/* Contents */}
        <section className="mt-12 print:mt-0 print:break-after-page">
          <h2 className="text-[1.5rem] font-bold tracking-tight text-gray-900">Contents</h2>

          <div className="mt-6 space-y-6">
            {HELP_CATEGORIES.map((cat, ci) => {
              const articles = articlesInCategory(cat.id);
              if (articles.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">
                    {ci + 1}. {cat.name}
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {articles.map((a, ai) => (
                      <li key={a.slug} className="flex items-baseline gap-2 text-[14px]">
                        <span className="text-gray-400">{ci + 1}.{ai + 1}</span>
                        <span className="text-gray-800">{a.title}</span>
                        <span className="flex-1 border-b border-dotted border-gray-300" />
                        <span className="text-[12px] text-gray-400">{a.readMinutes} min</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">
                Appendix
              </h3>
              <ul className="mt-2 space-y-1.5">
                <li className="flex items-baseline gap-2 text-[14px]">
                  <span className="text-gray-400">A</span>
                  <span className="text-gray-800">Frequently asked questions</span>
                  <span className="flex-1 border-b border-dotted border-gray-300" />
                  <span className="text-[12px] text-gray-400">{HELP_FAQS.length} answers</span>
                </li>
                <li className="flex items-baseline gap-2 text-[14px]">
                  <span className="text-gray-400">B</span>
                  <span className="text-gray-800">Contacting support</span>
                  <span className="flex-1 border-b border-dotted border-gray-300" />
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Articles */}
        {HELP_CATEGORIES.map((cat, ci) => {
          const articles = articlesInCategory(cat.id);
          if (articles.length === 0) return null;

          return articles.map((article, ai) => (
            <article key={article.slug} className="mt-12 print:mt-0 print:break-before-page">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                {ci + 1}.{ai + 1} · {cat.name}
              </p>
              <h2 className="mt-1.5 text-[1.75rem] font-bold leading-tight tracking-tight text-gray-900">
                {article.title}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{article.summary}</p>

              <div className="mt-6 space-y-6">
                {article.sections.map((section, i) => (
                  <section key={i} className="print:break-inside-avoid">
                    {section.heading && (
                      <h3 className="mb-2 text-[1.05rem] font-semibold tracking-tight text-gray-900">
                        {section.heading}
                      </h3>
                    )}

                    {section.body?.map((p, j) => (
                      <p key={j} className="mb-2.5 text-[14px] leading-[1.65] text-gray-700 last:mb-0">
                        {p}
                      </p>
                    ))}

                    {section.steps && (
                      <ol className="mt-2 space-y-2">
                        {section.steps.map((step, j) => (
                          <li key={j} className="flex gap-2.5">
                            <span className="text-[14px] font-semibold text-gray-400">{j + 1}.</span>
                            <span className="text-[14px] leading-[1.65] text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {section.bullets && (
                      <ul className="mt-2 space-y-1.5">
                        {section.bullets.map((b, j) => (
                          <li key={j} className="flex gap-2.5">
                            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                            <span className="text-[14px] leading-[1.65] text-gray-700">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.note && (
                      <div
                        className={`mt-3 border-l-[3px] py-1.5 pl-4 ${
                          section.note.tone === 'warn' ? 'border-amber-400' : 'border-blue-400'
                        }`}
                      >
                        <p className="text-[13px] font-semibold uppercase tracking-wide text-gray-400">
                          {section.note.tone === 'warn' ? 'Important' : 'Note'}
                        </p>
                        <p className="mt-0.5 text-[14px] leading-relaxed text-gray-700">
                          {section.note.text}
                        </p>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </article>
          ));
        })}

        {/* Appendix A — FAQ */}
        <section className="mt-12 print:mt-0 print:break-before-page">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Appendix A
          </p>
          <h2 className="mt-1.5 text-[1.75rem] font-bold tracking-tight text-gray-900">
            Frequently asked questions
          </h2>

          <dl className="mt-6 space-y-5">
            {HELP_FAQS.map(faq => (
              <div key={faq.question} className="print:break-inside-avoid">
                <dt className="text-[15px] font-semibold text-gray-900">{faq.question}</dt>
                <dd className="mt-1 text-[14px] leading-[1.65] text-gray-700">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Appendix B — contact */}
        <section className="mt-12 print:mt-0 print:break-before-page">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Appendix B
          </p>
          <h2 className="mt-1.5 text-[1.75rem] font-bold tracking-tight text-gray-900">
            Contacting support
          </h2>

          <dl className="mt-6 space-y-4 text-[14px]">
            <div className="print:break-inside-avoid">
              <dt className="font-semibold text-gray-900">Live chat</dt>
              <dd className="mt-0.5 leading-relaxed text-gray-700">
                Fastest for anything urgent. Monday to Friday, 9am–7pm UTC. Typically replies in
                minutes.
              </dd>
            </div>
            <div className="print:break-inside-avoid">
              <dt className="font-semibold text-gray-900">Email — support@chainpayments.com</dt>
              <dd className="mt-0.5 leading-relaxed text-gray-700">
                Best for account questions or anything needing a paper trail. Replies within one
                business day.
              </dd>
            </div>
            <div className="print:break-inside-avoid">
              <dt className="font-semibold text-gray-900">Security — security@chainpayments.com</dt>
              <dd className="mt-0.5 leading-relaxed text-gray-700">
                Suspected fraud, a compromised key, or a security vulnerability. Monitored around
                the clock.
              </dd>
            </div>
          </dl>

          <p className="mt-10 border-t border-gray-200 pt-6 text-[12px] text-gray-400">
            Chain Payments — Help &amp; Support Handbook. Generated {generated}. The most current
            version is always at chainpayments.com/help.
          </p>
        </section>
      </div>
    </div>
  );
}
