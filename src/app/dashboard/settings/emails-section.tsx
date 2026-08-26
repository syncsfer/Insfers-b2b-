'use client';

import { useMemo, useState } from 'react';
import {
  Monitor, Smartphone, Code2, Eye, Mail, Copy, Check, AlertCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { CoinBadge } from '@/components/ui/coin-badge';
import {
  renderReceiptEmail, renderInvoiceEmail, renderClaimLinkEmail, renderPaymentLinkEmail,
  DEFAULT_BRAND, type RenderedEmail, type EmailBrand,
} from '@/lib/email';
import {
  mockReceipts, mockReceiptSettings, mockPayments, mockInvoices, mockRefunds,
  mockPaymentLinks,
} from '@/lib/mock-data';
import type { Currency } from '@/types';

/**
 * A gallery of every email a customer can receive, rendered live.
 *
 * Merchants cannot otherwise see these — they are sent to other people. Being
 * able to read them before they go out is the difference between a considered
 * message and one nobody has ever looked at.
 */

interface Sample {
  id: string;
  group: 'Payments' | 'Invoices' | 'Refunds';
  label: string;
  description: string;
  /** Rendered against the merchant's current branding. */
  render: (brand: EmailBrand, currency: Currency) => RenderedEmail;
}

/** Re-denominates a sample record so previews can be checked in any currency. */
function withCurrency<T extends { currency: Currency }>(record: T, currency: Currency): T {
  return { ...record, currency };
}

const BASE = typeof window !== 'undefined' ? window.location.origin : '';

const SAMPLES: Sample[] = [
  {
    id: 'receipt',
    group: 'Payments',
    label: 'Payment receipt',
    description: 'Sent when a payment settles on-chain.',
    render: (brand, currency) =>
      renderReceiptEmail(
        withCurrency(mockReceipts[0], currency),
        mockReceiptSettings,
        mockPayments.find(p => p.id === mockReceipts[0].payment_intent_id),
        BASE,
        brand,
      ),
  },
  {
    id: 'payment-request',
    group: 'Payments',
    label: 'Payment request',
    description: 'Sent when a merchant shares a payment link by email.',
    render: (brand, currency) =>
      renderPaymentLinkEmail(
        { ...withCurrency(mockPaymentLinks[0], currency), amount: 9900 },
        'customer@example.com',
        { note: 'Thanks for the call today — here is the link for the deposit we discussed.', baseUrl: BASE, brand },
      ),
  },
  {
    id: 'payment-request-open',
    group: 'Payments',
    label: 'Payment request — open amount',
    description: 'The variant where the customer chooses what to pay.',
    render: (brand, currency) =>
      renderPaymentLinkEmail(
        { ...withCurrency(mockPaymentLinks[0], currency), amount: null, name: 'Support our work' },
        'customer@example.com',
        { baseUrl: BASE, brand },
      ),
  },
  {
    id: 'invoice-sent',
    group: 'Invoices',
    label: 'Invoice issued',
    description: 'The first email a customer gets about a new invoice.',
    render: (brand, currency) =>
      renderInvoiceEmail(withCurrency(mockInvoices[0], currency), 'sent', BASE, brand),
  },
  {
    id: 'invoice-reminder',
    group: 'Invoices',
    label: 'Invoice reminder',
    description: 'A nudge as the due date approaches.',
    render: (brand, currency) =>
      renderInvoiceEmail(
        { ...withCurrency(mockInvoices[0], currency), due_date: new Date(Date.now() + 2 * 86400_000).toISOString() },
        'reminder', BASE, brand,
      ),
  },
  {
    id: 'invoice-overdue',
    group: 'Invoices',
    label: 'Invoice overdue',
    description: 'Sent once the due date has passed.',
    render: (brand, currency) =>
      renderInvoiceEmail(
        { ...withCurrency(mockInvoices[0], currency), due_date: new Date(Date.now() - 6 * 86400_000).toISOString() },
        'overdue', BASE, brand,
      ),
  },
  {
    id: 'invoice-paid',
    group: 'Invoices',
    label: 'Invoice paid',
    description: 'Confirmation once an invoice settles.',
    render: (brand, currency) =>
      renderInvoiceEmail(
        { ...withCurrency(mockInvoices[0], currency), status: 'paid', paid_at: new Date().toISOString() },
        'paid', BASE, brand,
      ),
  },
  {
    id: 'claim-ready',
    group: 'Refunds',
    label: 'Claim link ready',
    description: 'Tells a customer a refund is waiting and how to receive it.',
    render: (brand, currency) => renderClaimLinkEmail(claimSample(currency, 9), 'ready', BASE, brand),
  },
  {
    id: 'claim-reminder',
    group: 'Refunds',
    label: 'Claim reminder',
    description: 'Sent when a claim link has gone unopened.',
    render: (brand, currency) => renderClaimLinkEmail(claimSample(currency, 5), 'reminder', BASE, brand),
  },
  {
    id: 'claim-expiring',
    group: 'Refunds',
    label: 'Claim expiring',
    description: 'Final warning before the link lapses and funds return.',
    render: (brand, currency) => renderClaimLinkEmail(claimSample(currency, 1), 'expiring', BASE, brand),
  },
  {
    id: 'claim-claimed',
    group: 'Refunds',
    label: 'Refund complete',
    description: 'Confirmation once the customer has pulled the funds.',
    render: (brand, currency) => {
      const base = claimSample(currency, 0);
      return renderClaimLinkEmail(
        {
          ...base,
          status: 'completed',
          claimed_at: new Date().toISOString(),
          claimed_by: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          tx_hash: '0x8f2a44b1c9e07b41d3a6f5e2b8c07d19a4e6f3b2c1d09a8e7f6b5c4d3e2a1c41d',
        },
        'claimed', BASE, brand,
      );
    },
  },
];

/** A claimable refund expiring in `days`, for the claim-link previews. */
function claimSample(currency: Currency, days: number) {
  const source = mockRefunds.find(r => r.method === 'claimable') ?? mockRefunds[0];
  return {
    ...source,
    currency,
    method: 'claimable' as const,
    status: 'awaiting_claim' as const,
    reason: 'Order cancelled before dispatch',
    recipient_email: 'customer@example.com',
    claim_link: `/r/${source.id}`,
    claim_expires_at: new Date(Date.now() + days * 86400_000).toISOString(),
    claimed_at: null,
    claimed_by: null,
    tx_hash: null,
  };
}

const GROUPS = ['Payments', 'Invoices', 'Refunds'] as const;
const CURRENCIES: Currency[] = ['USDC', 'EURC', 'JPYC', 'HTGC'];

export function EmailsSection({ brand }: { brand: EmailBrand }) {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState(SAMPLES[0].id);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [view, setView] = useState<'html' | 'text'>('html');
  const [currency, setCurrency] = useState<Currency>('USDC');
  const [copied, setCopied] = useState(false);

  const sample = SAMPLES.find(s => s.id === activeId) ?? SAMPLES[0];

  const email = useMemo(() => {
    try {
      return sample.render(brand, currency);
    } catch {
      return null;
    }
  }, [sample, brand, currency]);

  const copySubject = () => {
    if (!email) return;
    navigator.clipboard.writeText(email.subject);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    toast('Subject copied');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Customer emails</h2>
        <p className="text-sm text-gray-500">
          Every message a customer can receive, rendered with your branding. These use your business
          name, colour, and support address from the Business tab.
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-5">
        {/* Template list */}
        <div className="space-y-4">
          {GROUPS.map(group => (
            <div key={group}>
              <p className="px-1 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {group}
              </p>
              <div className="space-y-0.5">
                {SAMPLES.filter(s => s.group === group).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      s.id === activeId ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block text-[13px] font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="min-w-0">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{sample.label}</p>
                <p className="text-[12px] text-gray-500">{sample.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as Currency)}
                  aria-label="Preview currency"
                  className="px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white"
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex items-center gap-0.5 p-0.5 bg-gray-200 rounded-md">
                  <button
                    onClick={() => setView('html')}
                    aria-label="HTML preview"
                    className={`p-1.5 rounded ${view === 'html' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => setView('text')}
                    aria-label="Plain text preview"
                    className={`p-1.5 rounded ${view === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                  >
                    <Code2 size={13} />
                  </button>
                </div>
                {view === 'html' && (
                  <div className="flex items-center gap-0.5 p-0.5 bg-gray-200 rounded-md">
                    <button
                      onClick={() => setDevice('desktop')}
                      aria-label="Desktop width"
                      className={`p-1.5 rounded ${device === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                    >
                      <Monitor size={13} />
                    </button>
                    <button
                      onClick={() => setDevice('mobile')}
                      aria-label="Mobile width"
                      className={`p-1.5 rounded ${device === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                    >
                      <Smartphone size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Inbox line */}
            {email && (
              <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-start gap-2.5">
                  <Mail size={14} className="mt-0.5 text-gray-300 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{email.subject}</p>
                      <button
                        onClick={copySubject}
                        className="shrink-0 text-gray-300 hover:text-gray-600"
                        aria-label="Copy subject"
                      >
                        {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <p className="text-[12px] text-gray-400 truncate">{email.preheader}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">To {email.to || '—'}</p>
                  </div>
                  <CoinBadge currency={currency} size="sm" />
                </div>
              </div>
            )}

            {/* Body */}
            <div className="bg-gray-100 p-4">
              {!email ? (
                <div className="flex items-center gap-2 justify-center py-12 text-sm text-gray-400">
                  <AlertCircle size={15} /> Could not render this template
                </div>
              ) : view === 'html' ? (
                <iframe
                  key={`${sample.id}-${device}-${currency}-${brand.brandColor}`}
                  title={`${sample.label} preview`}
                  srcDoc={email.html}
                  sandbox=""
                  className="mx-auto block bg-white rounded-lg border border-gray-200"
                  style={{ width: device === 'mobile' ? 380 : '100%', maxWidth: '100%', height: 680 }}
                />
              ) : (
                <pre className="bg-white rounded-lg border border-gray-200 p-4 overflow-auto max-h-[680px]">
                  <code className="text-[12px] leading-relaxed font-mono text-gray-700 whitespace-pre-wrap">
                    {email.text}
                  </code>
                </pre>
              )}
            </div>
          </div>

          <p className="mt-2.5 text-[11px] text-gray-400">
            Previews render the real templates, including the plain-text alternative that text-only
            clients and screen readers receive.
          </p>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_BRAND };
