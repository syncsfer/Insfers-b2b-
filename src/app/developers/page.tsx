import Link from 'next/link';
import {
  CreditCard, TrendingUp, GitBranch, Wallet, Code2, ShoppingCart, Link as LinkIcon,
  ShieldCheck, RotateCcw, Bot, FileText, RefreshCw, Package, Mail, BarChart3,
  Split, Banknote, Send, ArrowLeftRight, Coins, Braces, TestTube, Webhook, Key,
  AlertTriangle, ArrowRight, Terminal, Rocket,
} from 'lucide-react';
import {
  DEV_CATEGORIES, DEV_PRODUCTS, productsInCategory, type ProductStatus,
} from '@/lib/developer-content';

export const metadata = {
  title: 'Get started — Chain Payments docs',
  description:
    'Everything you need to build with Chain Payments: accept stablecoin payments, bill customers, run a marketplace, and manage money across chains.',
};

const ICONS: Record<string, React.ElementType> = {
  CreditCard, TrendingUp, GitBranch, Wallet, Code2, ShoppingCart, Link: LinkIcon,
  ShieldCheck, RotateCcw, Bot, FileText, RefreshCw, Package, Mail, BarChart3,
  Split, Banknote, Send, ArrowLeftRight, Coins, Braces, TestTube, Webhook, Key,
  AlertTriangle,
};

const CATEGORY_ACCENT: Record<string, { icon: string; ring: string }> = {
  blue: { icon: 'bg-blue-50 text-blue-600', ring: 'group-hover:border-blue-300' },
  violet: { icon: 'bg-violet-50 text-violet-600', ring: 'group-hover:border-violet-300' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', ring: 'group-hover:border-emerald-300' },
  amber: { icon: 'bg-amber-50 text-amber-600', ring: 'group-hover:border-amber-300' },
  rose: { icon: 'bg-rose-50 text-rose-600', ring: 'group-hover:border-rose-300' },
  slate: { icon: 'bg-slate-100 text-slate-600', ring: 'group-hover:border-slate-300' },
};

const STATUS_LABEL: Record<ProductStatus, { label: string; className: string } | null> = {
  ga: null,
  beta: { label: 'Beta', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  preview: { label: 'Preview', className: 'bg-violet-50 text-violet-700 border-violet-200' },
};

const QUICKSTART = `# 1. Get a sandbox key from your dashboard
export CHAIN_PAYMENTS_SECRET_KEY=sk_test_...

# 2. Create a payment for $50.00 USDC on Base
curl https://api.chainpayments.com/v1/payments \\
  -X POST \\
  -H "Authorization: Bearer $CHAIN_PAYMENTS_SECRET_KEY" \\
  -d amount=5000 \\
  -d currency=USDC \\
  -d chain=base \\
  -d merchant_address=0x9dE24F2c5A1b7E3f8C0a4B6d2E9f1A3c5B7d113a

# 3. Open the checkout_url it returns and pay with a test wallet`;

export default function DevelopersPage() {
  return (
    <div className="max-w-3xl">
      {/* Hero */}
      <div className="pb-10 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Documentation</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Build stablecoin payments
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          Chain Payments moves money in USDC, EURC, JPYC, and HTGC across five networks. The API is
          the same shape whether you are taking one payment or running a marketplace — start with a
          sandbox key and a single request.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/developer?tab=sandbox"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <Rocket size={15} /> Open the sandbox
          </Link>
          <Link
            href="/developers/api-reference"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Braces size={15} /> API reference
          </Link>
        </div>
      </div>

      {/* Quickstart */}
      <section className="py-10 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Terminal size={16} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Your first payment</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Three steps, no integration. Nothing here touches real money.
        </p>
        <pre className="rounded-xl bg-gray-900 p-5 overflow-x-auto">
          <code className="text-[12.5px] leading-relaxed font-mono text-gray-300 whitespace-pre">
            {QUICKSTART}
          </code>
        </pre>
        <p className="mt-3 text-xs text-gray-500">
          Amounts are integers in the currency&rsquo;s minor units.{' '}
          <Link href="/developers/multi-currency" className="text-blue-600 hover:underline">
            JPYC has no subunit
          </Link>
          , so 5000 there means ¥5,000.
        </p>
      </section>

      {/* Categories */}
      {DEV_CATEGORIES.map(cat => {
        const CatIcon = ICONS[cat.icon] ?? Code2;
        const accent = CATEGORY_ACCENT[cat.accent];
        return (
          <section key={cat.id} id={cat.id} className="py-10 border-b border-gray-100 last:border-0">
            <div className="flex items-start gap-3 mb-5">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent.icon}`}>
                <CatIcon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{cat.name}</h2>
                <p className="text-sm text-gray-500">{cat.tagline}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {productsInCategory(cat.id).map(p => {
                const Icon = ICONS[p.icon] ?? Code2;
                const status = STATUS_LABEL[p.status];
                return (
                  <Link
                    key={p.slug}
                    href={`/developers/${p.slug}`}
                    className={`group rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 ${accent.ring}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={15} className="text-gray-400 shrink-0" />
                      <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                      {status && (
                        <span className={`px-1.5 py-px rounded text-[10px] font-semibold border ${status.className}`}>
                          {status.label}
                        </span>
                      )}
                      <ArrowRight
                        size={13}
                        className="ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <p className="text-[13px] leading-relaxed text-gray-500">{p.tagline}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="pt-8 text-sm text-gray-500">
        {DEV_PRODUCTS.length} products documented.{' '}
        <Link href="/help" className="text-blue-600 hover:underline">
          Talk to developer support
        </Link>{' '}
        if something here is wrong or missing.
      </p>
    </div>
  );
}
