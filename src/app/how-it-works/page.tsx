'use client';

import Link from 'next/link';
import {
  Zap, ArrowRight, ArrowDown, CheckCircle2, ExternalLink, ShieldCheck,
  CreditCard, FileText, Link as LinkIcon, RefreshCw, Users, Code2,
  Wallet, Store, Globe, Building, Layers, Clock, Coins, CircleDollarSign,
  Banknote, ArrowLeftRight, Receipt, Send, Lock, Eye,
} from 'lucide-react';
import { ChainBadge } from '@/components/ui/chain-badge';
import type { Chain } from '@/types';

const chains: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];

function SectionHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 mb-4">
        {badge}
      </span>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-500 text-sm leading-relaxed">{subtitle}</p>
    </div>
  );
}

function FlowStep({ step, icon: Icon, title, description, color, isLast = false }: {
  step: number; icon: React.ElementType; title: string; description: string; color: string; isLast?: boolean;
}) {
  return (
    <div className="flex items-start gap-5">
      <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon size={22} />
        </div>
        {!isLast && <div className="w-px h-full min-h-[48px] bg-gray-200 my-2" />}
      </div>
      <div className={`pb-8 ${isLast ? '' : ''}`}>
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Step {step}</div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">Chain Payments</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#how-money-moves" className="text-sm text-gray-600 hover:text-gray-900 font-medium">How it works</a>
            <a href="#stablecoins" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Stablecoins</a>
            <a href="#for-you" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Who it&apos;s for</a>
            <a href="#products" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Products</a>
            <Link href="/security" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Security</Link>
            <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Help</Link>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              Dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 to-white" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight">
            The simplest way to accept<br />stablecoin payments
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
            Chain Payments replaces credit cards, wire transfers, and payment processors with instant,
            borderless USDC payments that settle directly to your wallet.
          </p>

          {/* Visual: before/after comparison */}
          <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6 mt-10">
            {/* Traditional */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-left relative">
              <div className="absolute -top-3 left-4">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold border border-gray-200">Traditional payments</span>
              </div>
              <div className="mt-3 space-y-3">
                {[
                  { label: 'Settlement', value: '2-5 business days', bad: true },
                  { label: 'Processing fee', value: '2.9% + $0.30', bad: true },
                  { label: 'International fee', value: '+ 1.5% cross-border', bad: true },
                  { label: 'Chargebacks', value: 'Merchant liable', bad: true },
                  { label: 'Intermediaries', value: '4-6 parties', bad: true },
                  { label: 'Availability', value: 'Business hours / banking days', bad: true },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    <span className="text-sm font-medium text-red-500">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chain Payments */}
            <div className="bg-white border-2 border-blue-200 rounded-xl p-6 text-left relative shadow-sm">
              <div className="absolute -top-3 left-4">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">Chain Payments</span>
              </div>
              <div className="mt-3 space-y-3">
                {[
                  { label: 'Settlement', value: 'Seconds (instant)' },
                  { label: 'Processing fee', value: '1.0% flat' },
                  { label: 'International fee', value: 'None — borderless' },
                  { label: 'Chargebacks', value: 'None — irreversible' },
                  { label: 'Intermediaries', value: '0 — peer to peer' },
                  { label: 'Availability', value: '24/7/365' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    <span className="text-sm font-semibold text-green-600">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Money Moves */}
      <section id="how-money-moves" className="max-w-6xl mx-auto px-6 py-20">
        <SectionHeader
          badge="How Money Moves"
          title="From customer wallet to your wallet — in seconds"
          subtitle="Every payment is a direct, on-chain transfer. No banks, no clearing houses, no waiting. Here's the complete flow."
        />

        <div className="grid grid-cols-2 gap-12 items-start">
          {/* Left: flow steps */}
          <div>
            <FlowStep
              step={1}
              icon={Store}
              title="Merchant creates a payment"
              description="Create a payment intent with an amount in USDC via the dashboard, API, payment link, or invoice. The customer receives a checkout URL."
              color="bg-blue-50 text-blue-600"
            />
            <FlowStep
              step={2}
              icon={Wallet}
              title="Customer connects wallet"
              description="The customer opens the checkout page and connects their crypto wallet (MetaMask, Coinbase Wallet, or any WalletConnect-compatible wallet)."
              color="bg-purple-50 text-purple-600"
            />
            <FlowStep
              step={3}
              icon={CheckCircle2}
              title="Customer approves USDC"
              description="The customer signs an ERC-20 approval transaction allowing the smart contract to transfer the exact payment amount — nothing more."
              color="bg-orange-50 text-orange-600"
            />
            <FlowStep
              step={4}
              icon={Send}
              title="Payment executes on-chain"
              description="The smart contract transfers USDC from the customer's wallet directly to the merchant's settlement wallet in a single atomic transaction."
              color="bg-green-50 text-green-600"
            />
            <FlowStep
              step={5}
              icon={Receipt}
              title="Instant confirmation"
              description="The payment is confirmed on the blockchain within seconds. Both parties get a permanent, verifiable receipt. Webhooks fire in real-time."
              color="bg-blue-50 text-blue-600"
              isLast
            />
          </div>

          {/* Right: visual diagram */}
          <div className="sticky top-24">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 text-center">Payment Flow</p>

              {/* Customer */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Wallet size={18} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Customer Wallet</div>
                  <div className="text-xs text-gray-400 font-mono">0xAb5...3f2</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm font-bold text-gray-900">$150.00</div>
                  <div className="text-[10px] text-gray-400">USDC Balance</div>
                </div>
              </div>

              <div className="flex flex-col items-center py-3">
                <ArrowDown size={18} className="text-gray-300" />
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1">ERC-20 Transfer</span>
              </div>

              {/* Smart contract */}
              <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Code2 size={18} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold">ChainPayments Contract</div>
                  <div className="text-xs text-gray-400 font-mono">Verifies amount, routes funds, records event</div>
                </div>
              </div>

              <div className="flex flex-col items-center py-3">
                <ArrowDown size={18} className="text-gray-300" />
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">-1% fee</span>
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">$1.00 → Platform</span>
                </div>
              </div>

              {/* Merchant */}
              <div className="bg-white border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Store size={18} className="text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Merchant Wallet</div>
                  <div className="text-xs text-gray-400 font-mono">0x777...777</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm font-bold text-green-600">+$99.00</div>
                  <div className="text-[10px] text-gray-400">Net received</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><Clock size={10} /> ~2 seconds</span>
                <span className="flex items-center gap-1"><Lock size={10} /> Non-custodial</span>
                <span className="flex items-center gap-1"><Eye size={10} /> On-chain verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What are Stablecoins */}
      <section id="stablecoins" className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <SectionHeader
            badge="Stablecoins 101"
            title="What is USDC and why does it matter?"
            subtitle="USDC is a digital dollar that lives on the blockchain. It combines the stability of the US dollar with the speed and programmability of crypto."
          />

          {/* Main explainer */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-gray-200">
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CircleDollarSign size={26} className="text-green-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">1 USDC = $1 USD</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Always. USDC is pegged 1:1 to the US dollar. No volatility, no conversion risk. The value you see is the value you get.
                  </p>
                </div>
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Banknote size={26} className="text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Fully backed by reserves</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Every USDC is backed by US Treasury securities and cash held at regulated financial institutions. Monthly audits by Grant Thornton.
                  </p>
                </div>
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                    <Building size={26} className="text-purple-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Issued by Circle</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Circle is a regulated US financial institution. USDC is the most widely-used regulated stablecoin with $30B+ in circulation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How it's different from crypto */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-bold text-gray-900 text-center mb-6">&quot;But isn&apos;t crypto volatile?&quot;</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">!</span>
                  <span className="text-sm font-semibold text-gray-900">Bitcoin / Ethereum (volatile)</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Cryptocurrencies like BTC and ETH fluctuate in value daily. If you accept 1 ETH worth $3,000 today, it might be worth $2,500 tomorrow.
                </p>
                <div className="bg-red-50 rounded-lg p-3 text-xs text-red-700 font-medium">
                  Not suitable for business payments — unpredictable value
                </div>
              </div>
              <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-green-600" />
                  </span>
                  <span className="text-sm font-semibold text-gray-900">USDC (stable)</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  USDC is always worth $1. It uses blockchain technology for speed and transparency, but without price risk. Accept $100 USDC, always have $100.
                </p>
                <div className="bg-green-50 rounded-lg p-3 text-xs text-green-700 font-medium">
                  Built for commerce — stable, predictable, dollar-denominated
                </div>
              </div>
            </div>
          </div>

          {/* Where it runs */}
          <div className="max-w-4xl mx-auto mt-12">
            <h3 className="text-sm font-bold text-gray-900 text-center mb-6">Runs on the fastest, cheapest networks</h3>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {chains.map(c => (
                  <div key={c} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <ChainBadge chain={c} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">
                All networks use the same native USDC issued by Circle — not wrapped or bridged tokens
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="for-you" className="max-w-6xl mx-auto px-6 py-20">
        <SectionHeader
          badge="Who It's For"
          title="Built for every side of the transaction"
          subtitle="Whether you're a consumer paying for a service, a business accepting payments, a platform managing marketplace splits, or a developer integrating via API."
        />

        <div className="grid grid-cols-2 gap-6">
          {/* Consumers */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-purple-50 border-b border-purple-100 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Wallet size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">For Consumers</h3>
                <p className="text-xs text-gray-500">Pay for anything with your wallet</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Pay any merchant that uses Chain Payments directly from your crypto wallet. No signup required — just connect, approve, and pay.
              </p>
              <div className="space-y-2.5">
                {[
                  'Pay with USDC from any supported wallet',
                  'Choose your preferred network (save on gas)',
                  'No account creation or personal data required',
                  'Permanent on-chain receipt for every payment',
                  'Claim refunds to any wallet you choose',
                  'Sub-cent transaction fees on L2 networks',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-purple-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-purple-50 rounded-lg p-3 mt-4">
                <p className="text-xs text-purple-800">
                  <strong>The problem we solve:</strong> Traditional online payments require credit cards, expose personal data, and charge hidden fees. Chain Payments lets you pay with digital dollars from your wallet — privately, instantly, and cheaply.
                </p>
              </div>
            </div>
          </div>

          {/* Businesses */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Store size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">For Businesses</h3>
                <p className="text-xs text-gray-500">Accept payments globally, settle instantly</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Replace your payment processor with direct USDC settlement. Lower fees, no chargebacks, no waiting days for your money.
              </p>
              <div className="space-y-2.5">
                {[
                  '1% flat fee — no hidden charges or monthly minimums',
                  'Instant settlement to your wallet (not T+2)',
                  'Zero chargebacks — blockchain payments are final',
                  'Accept payments from 190+ countries, no extra fees',
                  'Full dashboard: invoices, payment links, subscriptions',
                  'Customer management with risk scoring',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-800">
                  <strong>The problem we solve:</strong> Payment processors charge 2.9%+ fees, hold funds for days, and expose merchants to chargebacks. Chain Payments gives you instant settlement at 1% with no chargeback risk.
                </p>
              </div>
            </div>
          </div>

          {/* Platforms */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-green-50 border-b border-green-100 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">For Platforms & Marketplaces</h3>
                <p className="text-xs text-gray-500">Split payments, manage sellers, automate payouts</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Build a marketplace with built-in payment splits. Automatically distribute funds between sellers, your platform, and service providers in a single transaction.
              </p>
              <div className="space-y-2.5">
                {[
                  'ConnectSplits: atomic payment distribution via smart contract',
                  'Set split rules in basis points (e.g., 85% seller, 15% platform)',
                  'Onboard connected accounts with settlement wallets',
                  'Batch payouts to multiple recipients in one transaction',
                  'Platform fee collection happens automatically',
                  'Full audit trail — every split is on-chain',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-green-50 rounded-lg p-3 mt-4">
                <p className="text-xs text-green-800">
                  <strong>The problem we solve:</strong> Marketplace payment splits are complex — delayed settlements, reconciliation nightmares, and opaque fee structures. ConnectSplits distributes funds atomically in one transaction, with full transparency.
                </p>
              </div>
            </div>
          </div>

          {/* Developers */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-orange-50 border-b border-orange-100 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Code2 size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">For Developers</h3>
                <p className="text-xs text-gray-500">API-first, Stripe-like developer experience</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Integrate payments in minutes with our RESTful API. If you&apos;ve used Stripe, you&apos;ll feel at home. Create payments, manage invoices, and listen for events — all via API.
              </p>
              <div className="space-y-2.5">
                {[
                  '13 RESTful API endpoints for full platform access',
                  'Webhook events for real-time payment notifications',
                  'Test and live API keys with separate environments',
                  'React hooks (wagmi) for direct smart contract interaction',
                  'On-chain event indexing — no polling needed',
                  'Comprehensive error handling and idempotency',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-orange-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900 rounded-lg p-4 mt-4 font-mono text-xs text-green-400 leading-relaxed overflow-x-auto">
                <div className="text-gray-500">{'// Create a payment in one API call'}</div>
                <div>POST /api/payments</div>
                <div>{'{'} &quot;amount&quot;: 10000, &quot;chain&quot;: &quot;base&quot; {'}'}</div>
                <div className="text-gray-500 mt-1">{'// → { id: "pi_abc", checkout_url: "..." }'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Overview */}
      <section id="products" className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <SectionHeader
            badge="Product Suite"
            title="Everything you need to accept payments"
            subtitle="A complete payment platform — from one-time payments to recurring billing, invoices to marketplace splits."
          />

          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: CreditCard, title: 'Payments', desc: 'Accept one-time USDC payments via hosted checkout with multi-chain support.', href: '/dashboard/payments' },
              { icon: FileText, title: 'Invoices', desc: 'Create and send professional invoices with line items, due dates, and payment tracking.', href: '/dashboard/invoices' },
              { icon: LinkIcon, title: 'Payment Links', desc: 'Generate shareable payment links for products, services, or donations.', href: '/dashboard/payment-links' },
              { icon: RefreshCw, title: 'Subscriptions', desc: 'Recurring billing with plans, trials, dunning, and automated retry logic.', href: '/dashboard/subscriptions' },
              { icon: Lock, title: 'Holds & Captures', desc: 'Authorize funds in escrow, then capture the exact amount or release.', href: '/dashboard/holds' },
              { icon: ArrowLeftRight, title: 'Refunds', desc: 'Direct refunds or claimable refunds that customers redeem to any wallet.', href: '/dashboard/refunds' },
              { icon: Users, title: 'Connect & Splits', desc: 'Marketplace payment distribution with connected accounts and split rules.', href: '/dashboard/connect' },
              { icon: Coins, title: 'Payouts', desc: 'Batch payouts from your platform to merchants or service providers.', href: '/dashboard' },
              { icon: Globe, title: 'Multi-chain', desc: 'Accept payments on Base, Ethereum, Polygon, Arbitrum, and Optimism.', href: '/dashboard/settings' },
              { icon: ArrowLeftRight, title: 'Bridge', desc: 'Move USDC between chains using Circle CCTP native burn-and-mint.', href: '/dashboard/bridge' },
              { icon: Code2, title: 'API & Webhooks', desc: '13 RESTful endpoints plus real-time webhook notifications.', href: '/dashboard/developer' },
              { icon: ShieldCheck, title: 'Security', desc: 'Non-custodial, audited smart contracts, 2FA, and wallet-based auth.', href: '/security' },
            ].map(product => (
              <Link
                key={product.title}
                href={product.href}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <product.icon size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{product.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{product.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it compares */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <SectionHeader
          badge="Comparison"
          title="Chain Payments vs. traditional processors"
          subtitle="See how stablecoin payments compare to legacy payment infrastructure across every dimension that matters."
        />

        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs uppercase text-gray-500 font-medium w-[200px]">Feature</th>
                  <th className="text-center px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                      <Zap size={12} /> Chain Payments
                    </span>
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500">Stripe</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500">PayPal</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500">Wire Transfer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Processing fee', chain: '1%', stripe: '2.9% + $0.30', paypal: '3.49% + $0.49', wire: '$25-50' },
                  { feature: 'Settlement time', chain: 'Seconds', stripe: '2 days', paypal: '1-3 days', wire: '1-5 days' },
                  { feature: 'Chargebacks', chain: 'None', stripe: 'Yes ($15 fee)', paypal: 'Yes ($20 fee)', wire: 'None' },
                  { feature: 'International', chain: 'Free', stripe: '+1.5%', paypal: '+1.5%', wire: '+$15-45' },
                  { feature: 'Availability', chain: '24/7', stripe: 'Banking hours', paypal: 'Banking hours', wire: 'Banking hours' },
                  { feature: 'Intermediaries', chain: '0', stripe: '4+', paypal: '3+', wire: '2-4' },
                  { feature: 'Monthly fees', chain: '$0', stripe: '$0', paypal: '$0-30', wire: 'Account fees' },
                  { feature: 'KYC for payers', chain: 'Optional', stripe: 'Card info required', paypal: 'Account required', wire: 'Bank account' },
                ].map(row => (
                  <tr key={row.feature} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-900">{row.feature}</td>
                    <td className="px-6 py-3 text-center font-semibold text-green-600">{row.chain}</td>
                    <td className="px-6 py-3 text-center text-gray-500">{row.stripe}</td>
                    <td className="px-6 py-3 text-center text-gray-500">{row.paypal}</td>
                    <td className="px-6 py-3 text-center text-gray-500">{row.wire}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Simple 3-step getting started */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <SectionHeader
            badge="Get Started"
            title="Start accepting payments in 3 minutes"
            subtitle="No lengthy onboarding. No bank approvals. Connect a wallet and you're live."
          />

          <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '1',
                icon: Wallet,
                title: 'Connect your wallet',
                description: 'Add your settlement wallet address — this is where you receive payments. Supports any EVM-compatible wallet.',
                color: 'bg-blue-600',
              },
              {
                step: '2',
                icon: Layers,
                title: 'Create a payment',
                description: 'Use the dashboard to create a payment link, invoice, or API integration. Share the checkout URL with your customer.',
                color: 'bg-purple-600',
              },
              {
                step: '3',
                icon: CheckCircle2,
                title: 'Get paid instantly',
                description: 'USDC lands in your wallet the moment the customer pays. Track everything from your real-time dashboard.',
                color: 'bg-green-600',
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon size={24} className="text-white" />
                </div>
                <div className="text-xs font-bold text-gray-400 mb-2">STEP {item.step}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to get started?</h2>
          <p className="text-gray-500 mb-8">
            Join the next generation of payment infrastructure. Accept USDC payments with instant settlement, 1% fees, and zero chargebacks.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
              Go to Dashboard <ArrowRight size={14} />
            </Link>
            <Link href="/security" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">
              Trust & Security <ShieldCheck size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Chain Payments</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="/security" className="hover:text-gray-700">Trust & Security</Link>
            <Link href="/dashboard/developer" className="hover:text-gray-700">API Docs</Link>
            <span>Status: <span className="text-green-600 font-medium">All systems operational</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
