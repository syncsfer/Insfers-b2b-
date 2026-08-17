import Link from 'next/link';
import {
  Zap, Rocket, CreditCard, RotateCcw, Wallet, FileText, Coins, Code2,
  ShieldCheck, ArrowRight, Mail, MessageSquare, BookOpen, Activity,
  CheckCircle2, Clock, Download,
} from 'lucide-react';
import { HELP_CATEGORIES, HELP_ARTICLES, HELP_FAQS, articlesInCategory } from '@/lib/help-content';
import { HelpSearch } from './help-search';
import { FaqAccordion } from './faq-accordion';

export const metadata = {
  title: 'Help & Support — Chain Payments',
  description:
    'Guides, answers, and support for accepting and sending stablecoin payments with Chain Payments.',
};

const ICONS: Record<string, React.ElementType> = {
  Rocket, CreditCard, RotateCcw, Wallet, FileText, Coins, Code2, ShieldCheck,
};

const ACCENTS: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};

const CHANNELS = [
  {
    icon: MessageSquare,
    title: 'Live chat',
    body: 'Fastest for anything urgent. Available Monday to Friday, 9am–7pm UTC.',
    action: 'Start a chat',
    href: '#contact',
    meta: 'Typically replies in minutes',
  },
  {
    icon: Mail,
    title: 'Email support',
    body: 'Best for account questions or anything needing a paper trail.',
    action: 'support@chainpayments.com',
    href: 'mailto:support@chainpayments.com',
    meta: 'Replies within one business day',
  },
  {
    icon: Code2,
    title: 'Developer support',
    body: 'Integration problems, webhook debugging, and API behaviour.',
    action: 'Open developer docs',
    href: '/dashboard/developer',
    meta: 'For technical issues',
  },
];

export default function HelpPage() {
  const popular = HELP_ARTICLES.filter(a => a.popular);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">Chain Payments</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/how-it-works" className="hidden transition-colors hover:text-gray-900 sm:inline">How it works</Link>
            <Link href="/currencies" className="hidden transition-colors hover:text-gray-900 sm:inline">Currencies</Link>
            <Link href="/security" className="hidden transition-colors hover:text-gray-900 sm:inline">Security</Link>
            <Link
              href="/help/print"
              className="hidden items-center gap-1.5 transition-colors hover:text-gray-900 sm:inline-flex"
            >
              <Download size={14} /> PDF
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero + search */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Help &amp; Support</p>
            <h1 className="mt-3 text-[2.5rem] font-bold leading-tight tracking-tight text-gray-900">
              How can we help?
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[16px] leading-relaxed text-gray-600">
              Search the guides below, or get in touch — a real person will answer.
            </p>
          </div>

          {/* Search takes over the view while a query is active */}
          <HelpSearch>
            <>
              {/* Popular */}
              <div className="mx-auto mt-12 max-w-3xl">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">Popular articles</h2>
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {popular.map(a => (
                    <li key={a.slug}>
                      <Link
                        href={`/help/${a.slug}`}
                        className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{a.title}</p>
                          <p className="mt-0.5 truncate text-[13px] text-gray-500">{a.summary}</p>
                        </div>
                        <span className="flex shrink-0 items-center gap-2 text-[11px] text-gray-400">
                          <Clock size={11} /> {a.readMinutes} min
                          <ArrowRight
                            size={14}
                            className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          </HelpSearch>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Browse by topic</h2>
        <p className="mt-1.5 text-[15px] text-gray-600">
          {HELP_ARTICLES.length} articles across {HELP_CATEGORIES.length} topics.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HELP_CATEGORIES.map(cat => {
            const Icon = ICONS[cat.icon] ?? BookOpen;
            const count = articlesInCategory(cat.id).length;
            return (
              <Link
                key={cat.id}
                href={`/help#${cat.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${ACCENTS[cat.accent]}`}>
                  <Icon size={17} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{cat.name}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{cat.description}</p>
                <p className="mt-2.5 text-[11px] font-medium text-gray-400">
                  {count} article{count === 1 ? '' : 's'}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* All articles, grouped */}
      <section className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-gray-900">All articles</h2>

          <div className="space-y-10">
            {HELP_CATEGORIES.map(cat => {
              const articles = articlesInCategory(cat.id);
              if (articles.length === 0) return null;
              const Icon = ICONS[cat.icon] ?? BookOpen;

              return (
                <div key={cat.id} id={cat.id} className="scroll-mt-8">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${ACCENTS[cat.accent]}`}>
                      <Icon size={14} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{cat.name}</h3>
                  </div>
                  <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {articles.map(a => (
                      <li key={a.slug}>
                        <Link
                          href={`/help/${a.slug}`}
                          className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">{a.title}</p>
                            <p className="mt-0.5 text-[13px] leading-relaxed text-gray-500">{a.summary}</p>
                          </div>
                          <span className="flex shrink-0 items-center gap-2 text-[11px] text-gray-400">
                            <Clock size={11} /> {a.readMinutes} min
                            <ArrowRight
                              size={14}
                              className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
                            />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Frequently asked</h2>
        <p className="mt-1.5 text-[15px] text-gray-600">Quick answers to the things people ask most.</p>
        <div className="mt-8">
          <FaqAccordion items={HELP_FAQS} />
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-8 border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Still need help?</h2>
          <p className="mt-1.5 text-[15px] text-gray-600">
            Reach us however suits you. We do not use bots for first-line support.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {CHANNELS.map(ch => (
              <div key={ch.title} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <ch.icon size={17} className="text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{ch.title}</h3>
                <p className="mt-1 flex-1 text-[13px] leading-relaxed text-gray-500">{ch.body}</p>
                <a
                  href={ch.href}
                  className="mt-3 inline-flex items-center gap-1.5 break-all text-[13px] font-medium text-blue-600 hover:text-blue-700"
                >
                  {ch.action} <ArrowRight size={13} className="shrink-0" />
                </a>
                <p className="mt-2 text-[11px] text-gray-400">{ch.meta}</p>
              </div>
            ))}
          </div>

          {/* Status + escalation */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50/70 p-5">
              <Activity size={17} className="mt-0.5 shrink-0 text-green-600" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-green-900">All systems operational</h3>
                  <CheckCircle2 size={14} className="text-green-600" />
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-green-800">
                  Payments, settlement, and webhooks are running normally across all five networks.
                </p>
                <a href="#" className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-green-700 hover:text-green-900">
                  View status page <ArrowRight size={13} />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-5">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Reporting something urgent</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                  For suspected fraud, a compromised key, or a security vulnerability, email{' '}
                  <a href="mailto:security@chainpayments.com" className="font-medium text-blue-600 hover:text-blue-700">
                    security@chainpayments.com
                  </a>{' '}
                  — monitored around the clock.
                </p>
              </div>
            </div>
          </div>

          {/* Offline copy */}
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Download size={17} className="mt-0.5 shrink-0 text-gray-400" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Take the docs with you</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                  Every article and answer in one document — useful for onboarding a team or
                  keeping a copy offline.
                </p>
              </div>
            </div>
            <Link
              href="/help/print"
              className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Export as PDF
            </Link>
          </div>

          {/* Cross-links */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-gray-200 pt-8 text-[13px]">
            <Link href="/how-it-works" className="text-gray-500 transition-colors hover:text-blue-600">How it works</Link>
            <Link href="/currencies" className="text-gray-500 transition-colors hover:text-blue-600">Supported currencies</Link>
            <Link href="/security" className="text-gray-500 transition-colors hover:text-blue-600">Trust &amp; security</Link>
            <Link href="/dashboard/developer" className="text-gray-500 transition-colors hover:text-blue-600">Developer docs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
