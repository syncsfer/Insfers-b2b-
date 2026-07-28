import Link from 'next/link';
import { Zap, Zap as ZapIcon, ShieldCheck, Layers, Gauge } from 'lucide-react';

const proofPoints = [
  {
    icon: Gauge,
    title: 'Settles in ~2 seconds',
    body: 'Payments finalize on Base in about the time it takes to read this line.',
  },
  {
    icon: Layers,
    title: 'Five networks, one balance',
    body: 'Base, Ethereum, Polygon, Arbitrum, and Optimism — settled to wallets you control.',
  },
  {
    icon: ShieldCheck,
    title: 'Non-custodial by design',
    body: 'Funds move wallet to wallet on-chain. We never hold your money.',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-950 px-12 py-14 text-white">
        {/* Ambient glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/25 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-16 h-[26rem] w-[26rem] rounded-full bg-indigo-500/20 blur-[120px]"
        />
        {/* Hairline grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0 auth-grid opacity-[0.07]" />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <ZapIcon size={18} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Chain Payments</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-[2rem] font-semibold leading-[1.15] tracking-tight">
            Stablecoin payments,
            <br />
            <span className="text-blue-400">without the wait.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
            Accept USDC, pay vendors, and settle across chains — from one dashboard.
          </p>

          <ul className="mt-10 space-y-6">
            {proofPoints.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Icon size={15} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-slate-400">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-5 text-[11px] text-slate-500">
          <span>&copy; {new Date().getFullYear()} Chain Payments</span>
          <Link href="/security" className="transition-colors hover:text-slate-300">
            Security
          </Link>
          <Link href="/how-it-works" className="transition-colors hover:text-slate-300">
            How it works
          </Link>
        </div>
      </aside>

      {/* Auth panel */}
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-white px-5 py-12 sm:px-8">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-gray-900">
            Chain Payments
          </span>
        </Link>

        <div className="w-full max-w-[27rem] animate-fade-in">{children}</div>

        <p className="mt-10 text-center text-[11px] text-gray-400 lg:hidden">
          <Link href="/security" className="transition-colors hover:text-gray-600">
            Security
          </Link>
          <span className="mx-2">&middot;</span>
          <Link href="/how-it-works" className="transition-colors hover:text-gray-600">
            How it works
          </Link>
        </p>
      </main>
    </div>
  );
}
