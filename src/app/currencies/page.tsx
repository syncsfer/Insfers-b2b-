import Link from 'next/link';
import { Zap, ShieldCheck, ArrowRight, Check, Info } from 'lucide-react';
import { ChainBadge } from '@/components/ui/chain-badge';
import { STABLECOIN_LIST, formatAmount } from '@/lib/currencies';

export const metadata = {
  title: 'Supported currencies — Chain Payments',
  description:
    'Accept, send, and settle in digital dollars, euros, yen, and gourdes — each backed 1:1 by the currency it tracks.',
};

/** A worked example per coin, so the numbers feel concrete. */
const examples: Record<string, { minor: number; caption: string }> = {
  USDC: { minor: 4_999, caption: 'A $49.99 subscription' },
  EURC: { minor: 12_500, caption: 'A €125.00 invoice' },
  JPYC: { minor: 8_400, caption: 'An ¥8,400 order' },
  HTGC: { minor: 650_000, caption: 'A G6,500.00 remittance' },
};

export default function CurrenciesPage() {
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
            <Link href="/how-it-works" className="transition-colors hover:text-gray-900">How it works</Link>
            <Link href="/security" className="transition-colors hover:text-gray-900">Security</Link>
            <Link href="/help" className="transition-colors hover:text-gray-900">Help</Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Currencies</p>
          <h1 className="mt-3 text-[2.5rem] font-bold leading-tight tracking-tight text-gray-900">
            One platform. Four currencies.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-relaxed text-gray-600">
            Every currency below is a <strong className="font-semibold text-gray-900">stablecoin</strong> —
            digital money that holds the value of a real-world currency, one for one. Send a
            digital euro and your recipient gets a euro, not something that moves in price.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {STABLECOIN_LIST.map((c) => (
              <span
                key={c.symbol}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${c.chip.bg} ${c.chip.text} ${c.chip.border}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${c.solid}`}
                >
                  {c.sign}
                </span>
                {c.symbol}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {STABLECOIN_LIST.map((c) => {
            const ex = examples[c.symbol];
            return (
              <article
                key={c.symbol}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
              >
                {/* Accent header */}
                <div className="h-1" style={{ backgroundColor: c.accent }} />

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${c.solid}`}
                    >
                      {c.sign}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                        {c.symbol}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {c.name} &middot; tracks the {c.fiat}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-[14px] leading-relaxed text-gray-600">{c.blurb}</p>

                  {/* Worked example */}
                  {ex && (
                    <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        Looks like
                      </p>
                      <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">
                        {formatAmount(ex.minor, c.symbol)}{' '}
                        <span className="text-sm font-medium" style={{ color: c.accent }}>
                          {c.symbol}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[12px] text-gray-500">{ex.caption}</p>
                    </div>
                  )}

                  <dl className="mt-5 space-y-2.5 border-t border-gray-100 pt-4 text-[13px]">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-gray-500">Issued by</dt>
                      <dd className="font-medium text-gray-900">{c.issuer}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-gray-500">Written as</dt>
                      <dd className="font-medium text-gray-900">
                        {c.sign}
                        {c.precision === 0 ? '1,000' : '1,000.00'}
                        <span className="ml-1.5 font-normal text-gray-400">
                          {c.precision === 0 ? 'no decimals' : '2 decimals'}
                        </span>
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 pt-0.5 text-gray-500">Settles on</dt>
                      <dd className="flex flex-wrap justify-end gap-1">
                        {c.networks.map((n) => (
                          <ChainBadge key={n} chain={n} />
                        ))}
                      </dd>
                    </div>
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* How it works together */}
      <section className="border-t border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            How multiple currencies work together
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-600">
            Each currency stays itself, end to end. We never silently convert your money.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              {
                title: 'Charge in any of them',
                body: 'Pick the currency when you create a payment link, invoice, or checkout session. Your customer pays in that currency.',
              },
              {
                title: 'Hold them separately',
                body: 'Your treasury keeps a distinct balance per currency. A euro balance stays in euros until you decide otherwise.',
              },
              {
                title: 'Settle to your wallets',
                body: 'Each currency settles on the networks that support it, to wallets you control. Nothing is converted without you asking.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <Check size={15} className="text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <Info size={17} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                About cross-currency totals
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
                Where the dashboard shows a single combined figure — total treasury value, or
                volume across every currency — it is an approximate US-dollar equivalent, marked
                with &ldquo;≈&rdquo;. Individual balances and transactions are always shown exactly, in
                their own currency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Start accepting all four
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-gray-600">
            No extra integration per currency — the same checkout, invoices, and payouts work
            across every one.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/send"
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              Send a payment
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-6 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              How it works
            </Link>
          </div>
          <p className="mt-8">
            <Link
              href="/security"
              className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 transition-colors hover:text-blue-600"
            >
              <ShieldCheck size={12} /> How we keep funds safe
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
