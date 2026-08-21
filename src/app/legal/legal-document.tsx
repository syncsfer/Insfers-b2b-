import Link from 'next/link';
import { Zap, Info, AlertTriangle, Printer, FileText, ShieldCheck } from 'lucide-react';
import type { LegalDocument } from '@/lib/legal-content';

/** Highlights unresolved template values so they cannot ship unnoticed. */
function withPlaceholders(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) =>
    part.startsWith('[') && part.endsWith(']') ? (
      <mark
        key={i}
        className="rounded bg-amber-100 px-1 py-px font-medium text-amber-900 print:bg-transparent print:underline"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function LegalDocumentPage({ doc }: { doc: LegalDocument }) {
  const other = doc.slug === 'privacy'
    ? { href: '/legal/terms', label: 'Terms of Service' }
    : { href: '/legal/privacy', label: 'Privacy Policy' };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-200 print:hidden">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">Chain Payments</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href={other.href} className="hidden transition-colors hover:text-gray-900 sm:inline">
              {other.label}
            </Link>
            <Link href="/help" className="hidden transition-colors hover:text-gray-900 sm:inline">Help</Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Draft banner — deliberately hard to miss */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 print:border-black">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Draft for legal review — not yet in force
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
              This document is a template prepared for review by qualified counsel. Highlighted
              values are unresolved and every clause requires verification against the laws of each
              jurisdiction in which the Services are offered. It does not constitute legal advice
              and must not be presented to users as binding until reviewed and completed.
            </p>
            <Link
              href="/legal"
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-900 underline underline-offset-2"
            >
              See outstanding review items
            </Link>
          </div>
        </div>

        {/* Title */}
        <header className="border-b border-gray-200 pb-8">
          <h1 className="text-[2.5rem] font-bold leading-tight tracking-tight text-gray-900">
            {doc.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-gray-600">{doc.subtitle}</p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-2 text-[13px]">
            <div className="flex gap-2">
              <dt className="text-gray-400">Last updated</dt>
              <dd className="font-medium text-gray-900">{withPlaceholders(doc.lastUpdated)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-400">Effective</dt>
              <dd className="font-medium text-gray-900">{withPlaceholders(doc.effectiveDate)}</dd>
            </div>
          </dl>
        </header>

        {/* Preamble */}
        <div className="mt-8 space-y-4">
          {doc.preamble.map((p, i) => (
            <p key={i} className="text-[15px] leading-[1.75] text-gray-700">
              {withPlaceholders(p)}
            </p>
          ))}
        </div>

        {/* Table of contents */}
        <nav className="mt-10 rounded-xl border border-gray-200 bg-gray-50/70 p-5 print:hidden">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-gray-500">
            Contents
          </h2>
          <ol className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
            {doc.sections.map(s => (
              <li key={s.number} className="text-[13px]">
                <a
                  href={`#s-${s.number}`}
                  className="text-gray-700 transition-colors hover:text-blue-600"
                >
                  <span className="text-gray-400">{s.number}.</span> {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Body */}
        <div className="mt-12 space-y-12">
          {doc.sections.map(section => (
            <section key={section.number} id={`s-${section.number}`} className="scroll-mt-8">
              <h2 className="border-b border-gray-100 pb-2 text-[1.4rem] font-bold tracking-tight text-gray-900">
                <span className="text-gray-400">{section.number}.</span> {section.heading}
              </h2>

              <div className="mt-5 space-y-6">
                {section.clauses.map(clause => (
                  <div key={clause.number}>
                    <h3 className="text-[15px] font-semibold text-gray-900">
                      <span className="text-gray-400">{clause.number}</span> {clause.heading}
                    </h3>

                    {clause.body?.map((p, i) => (
                      <p key={i} className="mt-2 text-[15px] leading-[1.75] text-gray-700">
                        {withPlaceholders(p)}
                      </p>
                    ))}

                    {clause.bullets && (
                      <ul className="mt-3 space-y-2">
                        {clause.bullets.map((b, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                            <span className="text-[15px] leading-[1.75] text-gray-700">
                              {withPlaceholders(b)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {clause.callout && (
                      <div
                        className={`mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3.5 ${
                          clause.callout.tone === 'warn'
                            ? 'border-amber-200 bg-amber-50/70'
                            : 'border-blue-100 bg-blue-50/70'
                        }`}
                      >
                        {clause.callout.tone === 'warn' ? (
                          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                        ) : (
                          <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
                        )}
                        <p
                          className={`text-[14px] font-medium leading-relaxed ${
                            clause.callout.tone === 'warn' ? 'text-amber-900' : 'text-blue-900'
                          }`}
                        >
                          {withPlaceholders(clause.callout.text)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer links */}
        <footer className="mt-14 border-t border-gray-200 pt-8 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
              <Link href={other.href} className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-blue-600">
                <FileText size={13} /> {other.label}
              </Link>
              <Link href="/security" className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-blue-600">
                <ShieldCheck size={13} /> Trust &amp; Security
              </Link>
              <Link href="/help" className="text-gray-500 transition-colors hover:text-blue-600">
                Help &amp; Support
              </Link>
            </div>
            <p className="inline-flex items-center gap-1.5 text-[12px] text-gray-400">
              <Printer size={12} /> Use your browser&apos;s print function to save a PDF
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
