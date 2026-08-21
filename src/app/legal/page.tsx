import Link from 'next/link';
import {
  Zap, FileText, ShieldCheck, AlertTriangle, ArrowRight, Scale, Gavel,
} from 'lucide-react';
import { LEGAL_DOCUMENTS, LEGAL_REVIEW_NOTES } from '@/lib/legal-content';

export const metadata = {
  title: 'Legal — Chain Payments',
  description: 'Privacy Policy, Terms of Service, and outstanding legal review items.',
};

export default function LegalIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">Chain Payments</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/help" className="hidden transition-colors hover:text-gray-900 sm:inline">Help</Link>
            <Link href="/security" className="hidden transition-colors hover:text-gray-900 sm:inline">Security</Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-14">
        <div className="flex items-center gap-2.5">
          <Scale size={18} className="text-gray-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Legal</p>
        </div>
        <h1 className="mt-3 text-[2.5rem] font-bold leading-tight tracking-tight text-gray-900">
          Legal documents
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-gray-600">
          The agreements governing use of Chain Payments, and the items still outstanding before
          they can take effect.
        </p>

        {/* Status */}
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              These documents are drafts and are not in force
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-amber-800">
              They were prepared as a starting point for qualified counsel, not as finished
              agreements. Publishing them without review would present users with terms that have
              not been checked against the licensing, financial-crime, consumer-protection, and
              data-protection rules of the jurisdictions you operate in — and a payments business
              handling stablecoins sits squarely inside all four. Unresolved values appear
              highlighted throughout.
            </p>
          </div>
        </div>

        {/* Documents */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {LEGAL_DOCUMENTS.map(doc => (
            <Link
              key={doc.slug}
              href={`/legal/${doc.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-sm"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                {doc.slug === 'privacy'
                  ? <ShieldCheck size={17} className="text-blue-600" />
                  : <FileText size={17} className="text-blue-600" />}
              </div>
              <h2 className="text-base font-semibold text-gray-900">{doc.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">{doc.subtitle}</p>
              <p className="mt-3 text-[11px] font-medium text-gray-400">
                {doc.sections.length} sections ·{' '}
                {doc.sections.reduce((n, s) => n + s.clauses.length, 0)} clauses
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-600">
                Read
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        {/* Review checklist */}
        <section className="mt-14">
          <div className="flex items-center gap-2.5">
            <Gavel size={17} className="text-gray-400" />
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              Outstanding review items
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-600">
            Each of these requires a decision that depends on your operating entity, jurisdiction,
            and regulatory posture. None can be resolved from the product alone.
          </p>

          <ol className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
            {LEGAL_REVIEW_NOTES.map((note, i) => (
              <li key={note.area} className="flex gap-4 px-5 py-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{note.area}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-gray-600">{note.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-12 border-t border-gray-200 pt-6 text-[12px] leading-relaxed text-gray-400">
          These documents were drafted as product work product and do not constitute legal advice.
          No solicitor–client or attorney–client relationship is created by their provision. Obtain
          advice from a qualified lawyer in each relevant jurisdiction before relying on them.
        </p>
      </div>
    </div>
  );
}
