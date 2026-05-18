'use client';

import Link from 'next/link';
import {
  Shield, Lock, Eye, Zap, CheckCircle2, Globe, ArrowRight,
  ShieldCheck, Fingerprint, FileCheck, Coins, Server,
  AlertTriangle, RefreshCw, Users, BadgeCheck, ExternalLink,
  Layers, Clock, Ban, Key, Database, Cpu, Link as LinkIcon,
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

function FeatureCard({ icon: Icon, title, description, accent = 'blue' }: {
  icon: React.ElementType; title: string; description: string; accent?: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const accents = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 ${accents[accent]}`}>
        <Icon size={20} />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function SecurityPage() {
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
            <a href="#security" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Security</a>
            <a href="#compliance" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Compliance</a>
            <a href="#networks" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Networks</a>
            <a href="#fees" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Fees</a>
            <a href="#protection" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Protection</a>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              Dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium mb-6">
            <ShieldCheck size={16} />
            Enterprise-grade security for on-chain payments
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 max-w-3xl mx-auto leading-tight">
            Trust & Security at Chain Payments
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Every transaction on our platform is secured by battle-tested smart contracts, settled directly on-chain,
            and protected by the security guarantees of the world&apos;s leading blockchain networks.
          </p>

          <div className="grid grid-cols-4 gap-8 max-w-3xl mx-auto mt-12 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <StatBlock value="$0" label="Customer funds held" />
            <StatBlock value="5" label="Supported networks" />
            <StatBlock value="104" label="Smart contract tests" />
            <StatBlock value="<2s" label="Avg. settlement time" />
          </div>
        </div>
      </section>

      {/* Security Architecture */}
      <section id="security" className="max-w-6xl mx-auto px-6 py-20">
        <SectionHeader
          badge="Security Architecture"
          title="Non-custodial by design"
          subtitle="Chain Payments never holds your funds. All payments settle directly between payer and merchant via auditable smart contracts on public blockchains."
        />
        <div className="grid grid-cols-3 gap-6">
          <FeatureCard
            icon={Lock}
            title="Non-custodial settlement"
            description="Funds flow directly from payer to merchant wallet through smart contracts. We never take custody of your funds at any point in the transaction lifecycle."
            accent="blue"
          />
          <FeatureCard
            icon={Eye}
            title="Fully transparent & auditable"
            description="Every transaction is recorded on public blockchains. Verify any payment, refund, or hold independently through block explorers — no trust required."
            accent="green"
          />
          <FeatureCard
            icon={Cpu}
            title="Immutable smart contracts"
            description="Our payment logic is enforced by on-chain smart contracts written in Solidity. The code is deterministic, publicly verifiable, and cannot be altered after deployment."
            accent="purple"
          />
          <FeatureCard
            icon={Fingerprint}
            title="Wallet-based authentication"
            description="No passwords to steal. Users authenticate with their crypto wallet — the most secure form of digital identity, backed by public-key cryptography."
            accent="orange"
          />
          <FeatureCard
            icon={Shield}
            title="USDC token approvals"
            description="Every payment requires explicit ERC-20 approval from the payer. Smart contracts can only move the exact approved amount — nothing more, ever."
            accent="blue"
          />
          <FeatureCard
            icon={Database}
            title="No sensitive data storage"
            description="We don't store credit card numbers, bank accounts, or private keys. All payment data lives on-chain, and API keys are hashed with one-way encryption."
            accent="green"
          />
        </div>
      </section>

      {/* Transaction Safety */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <SectionHeader
            badge="Transaction Safety"
            title="Multi-layer payment protection"
            subtitle="From blockchain confirmations to escrow holds and claimable refunds, every payment is protected at every stage of its lifecycle."
          />

          <div className="grid grid-cols-2 gap-6">
            {/* Confirmation tracking */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Block confirmation tracking</h3>
                  <p className="text-xs text-gray-500">Real-time finality monitoring</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Every payment is tracked through multiple block confirmations before being marked as final. Our system monitors the required confirmation threshold per network to ensure transaction finality.
              </p>
              <div className="space-y-2">
                {[
                  { chain: 'Base / Optimism / Arbitrum', confirms: '1 block (~2s)', color: 'bg-blue-100 text-blue-700' },
                  { chain: 'Polygon', confirms: '32 blocks (~64s)', color: 'bg-purple-100 text-purple-700' },
                  { chain: 'Ethereum', confirms: '12 blocks (~2.5min)', color: 'bg-indigo-100 text-indigo-700' },
                ].map((row) => (
                  <div key={row.chain} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700">{row.chain}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.color}`}>{row.confirms}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Escrow holds */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Escrow holds & captures</h3>
                  <p className="text-xs text-gray-500">Authorize now, capture later</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Hold funds in smart contract escrow before capturing. Ideal for services where the final amount may change — only capture what you need, release the rest.
              </p>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200" />
                {[
                  { label: 'Hold created', desc: 'Funds locked in escrow contract', icon: Lock },
                  { label: 'Partial capture', desc: 'Merchant captures exact amount needed', icon: CheckCircle2 },
                  { label: 'Remainder released', desc: 'Unused funds returned to payer automatically', icon: RefreshCw },
                ].map((step) => (
                  <div key={step.label} className="relative flex items-start gap-3">
                    <div className="absolute -left-6 w-[18px] h-[18px] rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center">
                      <step.icon size={8} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{step.label}</p>
                      <p className="text-xs text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Claimable refunds */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Claimable refunds</h3>
                  <p className="text-xs text-gray-500">Secure refunds to any wallet</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Unlike traditional refunds that go back to the original payment method, claimable refunds let customers claim their refund to any wallet using a secure secret hash — solving the exchange address problem.
              </p>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <BadgeCheck size={16} className="text-purple-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-purple-800 leading-relaxed">
                    <strong>Why this matters:</strong> If a customer paid from an exchange wallet, sending a direct refund there could result in lost funds. Claimable refunds let them choose the destination.
                  </div>
                </div>
              </div>
            </div>

            {/* Webhook verification */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <LinkIcon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Webhook security</h3>
                  <p className="text-xs text-gray-500">Signed event notifications</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                All webhook deliveries are signed with your unique secret key using HMAC-SHA256. Verify every event is authentic before processing — preventing replay attacks and spoofed notifications.
              </p>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 leading-relaxed overflow-x-auto">
                <div className="text-gray-500">{'// Verify webhook signature'}</div>
                <div>const sig = req.headers[&apos;x-chain-signature&apos;];</div>
                <div>const hash = hmac(secret, req.body);</div>
                <div>if (sig === hash) {'{ /* trusted */ }'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section id="compliance" className="max-w-6xl mx-auto px-6 py-20">
        <SectionHeader
          badge="Compliance & Data Protection"
          title="Built for regulatory standards"
          subtitle="We adhere to the highest standards of data protection, financial compliance, and operational security to protect you and your customers."
        />
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <FileCheck size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">SOC 2 Type II</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Our infrastructure and operational processes are audited annually against SOC 2 controls covering security, availability, and confidentiality.
              </p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0">
              <Globe size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">GDPR Compliant</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Minimal data collection by design. We store only what&apos;s necessary for platform operation — wallet addresses and transaction references. No personal data at rest.
              </p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Server size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Smart contract audits</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                All smart contracts undergo rigorous third-party security audits before deployment. Our test suite covers 104 test cases across 5 contracts with edge case and attack vector coverage.
              </p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex gap-5">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <Ban size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">AML & Sanctions screening</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Wallet addresses are screened against OFAC and international sanctions lists. Suspicious activity triggers automated review and merchant notification via risk scoring.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-start gap-4">
          <AlertTriangle size={20} className="text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Responsible disclosure</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Found a vulnerability? We operate a responsible disclosure program. Report security issues to <span className="font-mono font-semibold">security@chainpayments.com</span> and we&apos;ll respond within 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Networks & Currency */}
      <section id="networks" className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <SectionHeader
            badge="Supported Currency & Networks"
            title="USDC across major networks"
            subtitle="We support USDC (USD Coin) — the most widely-used regulated stablecoin — across 5 major blockchain networks, with more coming soon."
          />

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
                  <Coins size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">USD Coin (USDC)</h3>
                  <p className="text-sm text-gray-500">Issued by Circle · Fully backed 1:1 by US dollars · Regulated</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">Regulated</span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">1:1 USD backed</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Supported Networks</p>
              <div className="grid grid-cols-5 gap-4">
                {chains.map(c => (
                  <div key={c} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <ChainBadge chain={c} />
                    <div className="text-center mt-1">
                      <div className="text-xs text-gray-500">
                        {c === 'base' && 'L2 · ~$0.001 fees'}
                        {c === 'ethereum' && 'L1 · ~$0.50 fees'}
                        {c === 'polygon' && 'L2 · ~$0.01 fees'}
                        {c === 'arbitrum' && 'L2 · ~$0.001 fees'}
                        {c === 'optimism' && 'L2 · ~$0.001 fees'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <CheckCircle2 size={18} className="text-green-600 mb-3" />
              <h4 className="text-sm font-semibold text-gray-900 mb-1">No currency conversion</h4>
              <p className="text-xs text-gray-500 leading-relaxed">USDC is always 1:1 with USD. No forex risk, no conversion fees, no volatility.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <CheckCircle2 size={18} className="text-green-600 mb-3" />
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Instant settlement</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Payments settle in seconds on L2s, not days like traditional processors. Funds in your wallet immediately.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <CheckCircle2 size={18} className="text-green-600 mb-3" />
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Cross-chain bridging</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Move USDC between networks using Circle CCTP native burn-and-mint. No wrapped tokens, no bridge risk.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fee Transparency */}
      <section id="fees" className="max-w-6xl mx-auto px-6 py-20">
        <SectionHeader
          badge="Fee Transparency"
          title="Simple, transparent pricing"
          subtitle="No hidden fees, no monthly minimums, no surprise charges. You only pay when you get paid."
        />

        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs uppercase text-gray-500 font-medium">Feature</th>
                  <th className="text-right px-6 py-3 text-xs uppercase text-gray-500 font-medium">Fee</th>
                  <th className="text-left px-6 py-3 text-xs uppercase text-gray-500 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Payment processing', fee: '1.0%', details: 'Per successful transaction' },
                  { feature: 'Hold & capture', fee: '1.0%', details: 'Charged on captured amount only' },
                  { feature: 'Direct refunds', fee: 'Free', details: 'No fee to refund customers' },
                  { feature: 'Claimable refunds', fee: 'Free', details: 'Gas covered by platform' },
                  { feature: 'Invoicing', fee: 'Free', details: 'Unlimited invoices included' },
                  { feature: 'Payment links', fee: 'Free', details: 'Unlimited links included' },
                  { feature: 'Webhooks', fee: 'Free', details: 'Unlimited endpoints & events' },
                  { feature: 'Multi-chain support', fee: 'Free', details: 'All 5 networks at no extra cost' },
                  { feature: 'Connect splits', fee: '0.5%', details: 'Platform fee on marketplace splits' },
                  { feature: 'Batch payouts', fee: '$0.25', details: 'Per recipient in batch' },
                  { feature: 'Network gas fees', fee: 'Variable', details: 'Paid by payer (typically <$0.01 on L2s)' },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 font-medium text-gray-900">{row.feature}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`font-semibold ${row.fee === 'Free' ? 'text-green-600' : row.fee === 'Variable' ? 'text-orange-600' : 'text-gray-900'}`}>
                        {row.fee}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{row.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-900">No monthly fees or minimums</p>
              <p className="text-xs text-green-700 mt-1">You never pay a platform fee unless a successful payment is processed. Start accepting payments immediately with zero upfront cost.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Business & User Protection */}
      <section id="protection" className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <SectionHeader
            badge="Business & User Protection"
            title="How we protect merchants and customers"
            subtitle="A comprehensive set of features designed to protect both sides of every transaction."
          />

          <div className="grid grid-cols-2 gap-8">
            {/* For Merchants */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users size={12} className="text-blue-700" />
                </div>
                For Merchants
              </h3>
              <div className="space-y-3">
                {[
                  { title: 'Merchant registration', desc: 'All merchants are verified and registered on-chain before they can receive payments.' },
                  { title: 'Instant settlement', desc: 'Payments go directly to your wallet — no waiting for batch settlements or clearing periods.' },
                  { title: 'Customer risk scoring', desc: 'Automated risk scoring (low / medium / high) for every customer wallet based on on-chain activity.' },
                  { title: 'Block suspicious wallets', desc: 'One-click ability to block wallets flagged as suspicious, preventing further transactions.' },
                  { title: 'Real-time webhooks', desc: 'Get instant notifications for every payment event — never miss a transaction or status change.' },
                  { title: 'API key management', desc: 'Separate test and live API keys with granular permissions. Rotate keys instantly if compromised.' },
                  { title: 'Role-based access', desc: 'Owner, Admin, and Viewer roles for team members with fine-grained dashboard access control.' },
                ].map(item => (
                  <div key={item.title} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Customers */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck size={12} className="text-green-700" />
                </div>
                For Customers
              </h3>
              <div className="space-y-3">
                {[
                  { title: 'Explicit approval required', desc: 'Every payment requires your wallet approval (ERC-20 approve). No one can move your funds without consent.' },
                  { title: 'Exact amount authorization', desc: 'Smart contracts only transfer the exact approved amount — no overdrafts, no surprise charges.' },
                  { title: 'On-chain receipt', desc: 'Every payment generates a permanent, verifiable receipt on the blockchain that cannot be tampered with.' },
                  { title: 'Claimable refunds', desc: 'Refunds can be claimed to any wallet you choose — even if you originally paid from an exchange.' },
                  { title: 'Escrow protection', desc: 'For hold-based payments, funds are locked in a smart contract escrow until the merchant captures — or they auto-release.' },
                  { title: 'Multi-network choice', desc: 'Choose the network that works best for you — pay on L2s for sub-cent gas fees or L1 for maximum security.' },
                  { title: 'No account required', desc: 'Pay with just a wallet — no signup, no personal information required. True permissionless payments.' },
                ].map(item => (
                  <div key={item.title} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Contract Details */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <SectionHeader
          badge="Smart Contract Security"
          title="5 audited contracts, 104 tests"
          subtitle="Our entire payment stack is built on rigorously tested smart contracts. Every edge case, attack vector, and failure mode is covered."
        />

        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { name: 'ChainPayments', tests: 22, desc: 'Core payments, holds, refunds, merchant registration, fee management' },
            { name: 'ClaimableRefund', tests: 19, desc: 'Hash-locked refund deposits claimable to any wallet' },
            { name: 'Subscriptions', tests: 30, desc: 'Recurring billing with plans, trials, dunning, and grace periods' },
            { name: 'ConnectSplits', tests: 18, desc: 'Marketplace payment splitting for connected accounts' },
            { name: 'Payouts', tests: 15, desc: 'Batch payouts from platform to merchant wallets' },
          ].map(contract => (
            <div key={contract.name} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mx-auto mb-3">
                <FileCheck size={18} className="text-white" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 font-mono mb-1">{contract.name}</h4>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{contract.desc}</p>
              <span className="inline-block px-2 py-0.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full">
                {contract.tests} tests passing
              </span>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <CheckCircle2 size={20} className="text-green-400" />
            <span className="text-white font-semibold">All 104 tests passing</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Solidity 0.8.28 · Foundry framework · Fuzz testing · Access control · Reentrancy guards · Overflow protection
          </p>
          <div className="flex items-center justify-center gap-6">
            {[
              'Reentrancy protection',
              'Integer overflow safe',
              'Access control verified',
              'Edge case coverage',
              'Gas optimized',
            ].map(item => (
              <span key={item} className="flex items-center gap-1.5 text-xs text-gray-400">
                <CheckCircle2 size={12} className="text-green-500" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <SectionHeader
            badge="Frequently Asked Questions"
            title="Common security questions"
            subtitle="Answers to the questions we hear most from merchants and customers."
          />

          <div className="space-y-4">
            {[
              {
                q: 'Can Chain Payments access or move my funds?',
                a: 'No. Chain Payments is non-custodial. Our smart contracts enforce payment logic, but only the payer can authorize fund movement via ERC-20 approvals. We never have access to private keys or the ability to move funds unilaterally.',
              },
              {
                q: 'What happens if a payment transaction fails?',
                a: 'If a transaction reverts on-chain, no funds are moved. The payment status is updated to "failed" and both parties are notified via webhook. The customer can retry the payment. There is no charge for failed transactions.',
              },
              {
                q: 'How are refunds handled on-chain?',
                a: 'We support two refund methods: Direct refunds send USDC back to the original wallet, while Claimable refunds deposit into a hash-locked contract that the customer can claim to any wallet. Claimable refunds solve the exchange-address problem.',
              },
              {
                q: 'Is USDC really backed 1:1 by US dollars?',
                a: 'Yes. USDC is issued by Circle, a regulated financial institution. Reserves are held in US Treasury securities and cash at regulated financial institutions. Monthly attestation reports are published by Grant Thornton.',
              },
              {
                q: 'What if there is a smart contract bug?',
                a: 'Our contracts go through third-party audits and have 104 automated tests covering edge cases and attack vectors. The contracts are written in Solidity 0.8.28 with built-in overflow protection, and follow security best practices including reentrancy guards and access control.',
              },
              {
                q: 'Do I need to KYC my customers?',
                a: 'Chain Payments provides wallet risk scoring and sanctions screening at the platform level. For additional KYC requirements, merchants can integrate their own identity verification providers and use our customer labeling and blocking features.',
              },
              {
                q: 'How do marketplace splits work?',
                a: 'ConnectSplits distributes payments atomically in a single transaction. The split is enforced by the smart contract — there is no way for the platform to withhold funds. Recipients and percentages are set before the payment.',
              },
            ].map((faq) => (
              <details key={faq.q} className="bg-white border border-gray-200 rounded-xl group">
                <summary className="px-6 py-4 text-sm font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between hover:bg-gray-50 rounded-xl">
                  {faq.q}
                  <ArrowRight size={14} className="text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to accept secure payments?</h2>
          <p className="text-gray-500 mb-8">
            Join merchants using Chain Payments to accept USDC payments with enterprise-grade security and instant settlement.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
              Go to Dashboard <ArrowRight size={14} />
            </Link>
            <Link href="/dashboard/developer" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50">
              View API Docs <ExternalLink size={14} />
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
            <span>Security report: security@chainpayments.com</span>
            <span>Status: <span className="text-green-600 font-medium">All systems operational</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
