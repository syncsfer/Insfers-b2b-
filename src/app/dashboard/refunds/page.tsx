'use client';

import { useState, useMemo } from 'react';
import {
  Search, Plus, Copy, ExternalLink, Link2, Mail, Ban, Clock,
  Check, AlertTriangle, Send, Eye,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { getStatusSummary } from '@/components/ui/status-explainer';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime, formatDate, truncateAddress, getExplorerUrl } from '@/lib/utils';
import { formatAmount } from '@/lib/currencies';
import { CoinBadge, Money } from '@/components/ui/coin-badge';
import { ChainBadge } from '@/components/ui/chain-badge';
import { mockRefunds, mockPayments, claimEventsFor } from '@/lib/mock-data';
import type { Refund, RefundStatus, ClaimEvent } from '@/types';

const tabs: { label: string; value: RefundStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Awaiting Claim', value: 'awaiting_claim' },
];

/** Time until a claim link lapses, or null once it has. */
function claimTimeLeft(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

const EVENT_STYLE: Record<ClaimEvent['type'], { icon: React.ElementType; tone: string }> = {
  created:  { icon: Link2,         tone: 'bg-blue-50 text-blue-600' },
  notified: { icon: Mail,          tone: 'bg-blue-50 text-blue-600' },
  reminded: { icon: Send,          tone: 'bg-amber-50 text-amber-600' },
  opened:   { icon: Eye,           tone: 'bg-gray-100 text-gray-500' },
  claimed:  { icon: Check,         tone: 'bg-green-50 text-green-600' },
  expired:  { icon: Clock,         tone: 'bg-gray-100 text-gray-500' },
  revoked:  { icon: Ban,           tone: 'bg-gray-100 text-gray-500' },
  failed:   { icon: AlertTriangle, tone: 'bg-red-50 text-red-600' },
};

export default function RefundsPage() {
  const { toast } = useToast();
  const [claimRefund, setClaimRefund] = useState<Refund | null>(null);
  const [revoked, setRevoked] = useState<Set<string>>(new Set());

  const absoluteClaimUrl = (r: Refund) =>
    `${typeof window !== 'undefined' ? window.location.origin : ''}${r.claim_link ?? ''}`;
  const [activeTab, setActiveTab] = useState<RefundStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [refundMethod, setRefundMethod] = useState<'direct' | 'claimable'>('claimable');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Customer requested');
  const [confirmChecked, setConfirmChecked] = useState(false);

  const filtered = useMemo(() => {
    let data = mockRefunds;
    if (activeTab !== 'all') data = data.filter(r => r.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r => r.id.includes(q) || r.payment_intent_id.includes(q));
    }
    return data;
  }, [activeTab, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mockRefunds.length };
    for (const r of mockRefunds) counts[r.status] = (counts[r.status] || 0) + 1;
    return counts;
  }, []);

  const succeededPayments = mockPayments.filter(p => p.status === 'succeeded');
  const selectedPaymentObj = succeededPayments.find(p => p.id === selectedPayment);

  const columns: Column<Refund>[] = [
    { key: 'status', header: 'Status', width: '140px', render: (r) => (
      <div>
        <StatusPill status={r.status} size="sm" />
        <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{getStatusSummary('refund', r.status)}</div>
      </div>
    ) },
    { key: 'amount', header: 'Amount', width: '120px', align: 'right', render: (r) => <span className="font-semibold text-gray-900"><Money minor={r.amount} currency={r.currency} showTicker={false} /></span> },
    { key: 'currency', header: 'Currency', width: '90px', render: (r) => <CoinBadge currency={r.currency} size="sm" /> },
    { key: 'payment', header: 'Original Payment', width: '130px', render: (r) => <a href={`/dashboard/payments/${r.payment_intent_id}`} className="text-sm text-blue-600 font-mono hover:text-blue-700">{truncateAddress(r.payment_intent_id)}</a> },
    { key: 'method', header: 'Method', width: '110px', render: (r) => <span className="text-sm capitalize text-gray-600">{r.method === 'claimable' ? 'Claimable' : r.method === 'direct' ? 'Direct' : 'Escrow'}</span> },
    {
      key: 'claim', header: 'Claim', width: '170px',
      render: (r) => {
        if (r.method !== 'claimable') {
          return <span className="text-xs text-gray-300">Direct — no link</span>;
        }
        if (revoked.has(r.id) || r.claim_revoked_at) {
          return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500"><Ban size={11} /> Revoked</span>;
        }
        if (r.claimed_at) {
          return (
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600">
                <Check size={11} /> Claimed
              </span>
              <div className="font-mono text-[10px] text-gray-400">{truncateAddress(r.claimed_by ?? '')}</div>
            </div>
          );
        }
        if (r.status === 'failed') {
          return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600"><AlertTriangle size={11} /> Failed</span>;
        }
        const left = claimTimeLeft(r.claim_expires_at);
        if (!left) {
          return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500"><Clock size={11} /> Expired</span>;
        }
        const urgent = new Date(r.claim_expires_at!).getTime() - Date.now() < 6 * 3600_000;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${urgent ? 'text-orange-600' : 'text-blue-600'}`}>
              <Clock size={11} /> {left} left
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(absoluteClaimUrl(r)); toast('Claim link copied'); }}
              title="Copy claim link"
              className="text-gray-300 hover:text-gray-500"
            >
              <Copy size={11} />
            </button>
          </div>
        );
      },
    },
    {
      key: 'manage', header: '', width: '80px', align: 'right',
      render: (r) => r.method === 'claimable' ? (
        <button
          onClick={(e) => { e.stopPropagation(); setClaimRefund(r); }}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50"
        >
          Manage
        </button>
      ) : null,
    },
    { key: 'created', header: 'Created', width: '110px', render: (r) => <span className="text-xs text-gray-500">{formatRelativeTime(r.created_at)}</span> },
  ];

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedPayment(null);
    setRefundMethod('claimable');
    setRefundAmount('');
    setRefundReason('Customer requested');
    setConfirmChecked(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Refunds</h1>
        <button
          onClick={() => { resetWizard(); setWizardOpen(true); }}
          className="inline-flex items-center gap-2 px-4 h-10 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Issue refund
        </button>
      </div>

      <div className="flex items-center gap-0 border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-5 py-3 text-sm font-medium border-b-[3px] transition-colors ${
              activeTab === tab.value ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label} ({tabCounts[tab.value] || 0})
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by refund ID or payment ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
          emptyMessage="No refunds found"
        />
      </div>

      {/* Refund Wizard Modal */}
      <Modal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={`Issue Refund - Step ${wizardStep} of 3`}
        size="lg"
        footer={
          <div className="flex gap-3">
            {wizardStep > 1 && (
              <button onClick={() => setWizardStep(s => s - 1)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                Back
              </button>
            )}
            <button onClick={() => setWizardOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            {wizardStep < 3 ? (
              <button
                onClick={() => setWizardStep(s => s + 1)}
                disabled={wizardStep === 1 && !selectedPayment}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={() => { toast('Refund issued successfully'); setWizardOpen(false); }}
                disabled={!confirmChecked}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Issue Refund
              </button>
            )}
          </div>
        }
      >
        {/* Step 1: Select Payment */}
        {wizardStep === 1 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Select the payment to refund</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {succeededPayments.slice(0, 10).map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPayment(p.id); setRefundAmount(String(p.amount / 100)); }}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg border text-left ${
                    selectedPayment === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-mono text-gray-500">{p.id.slice(0, 16)}...</span>
                  <span className="text-sm font-semibold text-gray-900">{formatUSDC(p.amount)}</span>
                  <span className="text-xs text-gray-400 ml-auto">{formatRelativeTime(p.created_at)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose Method */}
        {wizardStep === 2 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Choose refund method</p>
            <div className="space-y-3 mb-6">
              <label
                className={`flex gap-3 p-4 rounded-lg border cursor-pointer ${
                  refundMethod === 'direct' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input type="radio" name="method" checked={refundMethod === 'direct'} onChange={() => setRefundMethod('direct')} className="mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">Direct Refund</div>
                  <p className="text-xs text-gray-500 mt-1">Send USDC directly to the original payment address. Only use if customer controls the address.</p>
                  <p className="text-xs text-amber-600 mt-1 font-medium">Warning: Exchange deposits cannot receive refunds.</p>
                </div>
              </label>
              <label
                className={`flex gap-3 p-4 rounded-lg border cursor-pointer ${
                  refundMethod === 'claimable' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input type="radio" name="method" checked={refundMethod === 'claimable'} onChange={() => setRefundMethod('claimable')} className="mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">Claimable Refund <span className="text-blue-600">(Recommended)</span></div>
                  <p className="text-xs text-gray-500 mt-1">Create a claim link. Customer connects wallet and claims to any address they control.</p>
                  <p className="text-xs text-green-700 mt-1 font-medium">Safest for exchange deposits.</p>
                </div>
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Refund amount (USDC)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <select
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Customer requested</option>
                  <option>Duplicate charge</option>
                  <option>Service not rendered</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {wizardStep === 3 && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Review and confirm the refund</p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Original payment</span><span className="text-gray-900 font-medium">{selectedPayment}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Refund amount</span><span className="text-gray-900 font-semibold">${refundAmount} USDC</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Method</span><span className="text-gray-900 capitalize">{refundMethod} refund{refundMethod === 'claimable' ? ' (expires in 24h)' : ''}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Reason</span><span className="text-gray-900">{refundReason}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Gas estimate</span><span className="text-gray-900">{refundMethod === 'direct' ? '~$0.02' : 'Customer pays gas'}</span></div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-semibold">This action cannot be undone. Funds will be sent to customer.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={confirmChecked} onChange={e => setConfirmChecked(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">I confirm this refund is accurate</span>
            </label>
          </div>
        )}
      </Modal>

      {/* Claim link management */}
      <Modal
        open={Boolean(claimRefund)}
        onClose={() => setClaimRefund(null)}
        title="Claim link"
        size="lg"
        footer={
          claimRefund && !claimRefund.claimed_at && claimRefund.status !== 'failed' && !revoked.has(claimRefund.id) && claimTimeLeft(claimRefund.claim_expires_at) ? (
            <div className="flex w-full items-center justify-between gap-3">
              <button
                onClick={() => {
                  setRevoked(prev => new Set(prev).add(claimRefund.id));
                  toast('Claim link revoked — funds returned to your treasury');
                  setClaimRefund(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Ban size={14} /> Revoke link
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => toast(`Reminder sent to ${claimRefund.recipient_email ?? 'the customer'}`)}
                  disabled={!claimRefund.recipient_email}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Send size={14} /> Send reminder
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(absoluteClaimUrl(claimRefund)); toast('Claim link copied'); }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Copy size={14} /> Copy link
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setClaimRefund(null)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          )
        }
      >
        {claimRefund && (() => {
          const isRevoked = revoked.has(claimRefund.id) || Boolean(claimRefund.claim_revoked_at);
          const left = claimTimeLeft(claimRefund.claim_expires_at);
          const events = claimEventsFor(
            isRevoked && !claimRefund.claim_revoked_at
              ? { ...claimRefund, claim_revoked_at: new Date().toISOString() }
              : claimRefund,
          );

          return (
            <div className="space-y-5">
              {/* Summary */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatAmount(claimRefund.amount, claimRefund.currency)}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <CoinBadge currency={claimRefund.currency} size="sm" />
                      <ChainBadge chain={claimRefund.chain} />
                    </div>
                  </div>
                  <StatusPill status={claimRefund.status} />
                </div>
              </div>

              {/* Current state */}
              {isRevoked ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <Ban size={15} className="mt-0.5 shrink-0 text-gray-500" />
                  <p className="text-[13px] text-gray-700">
                    This link was revoked. The funds returned to your treasury and the link no
                    longer works.
                  </p>
                </div>
              ) : claimRefund.claimed_at ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50/70 px-4 py-3">
                  <Check size={15} className="mt-0.5 shrink-0 text-green-600" />
                  <div className="text-[13px] text-green-900">
                    <p>Claimed {formatRelativeTime(claimRefund.claimed_at)} to</p>
                    <p className="mt-0.5 font-mono text-xs">{claimRefund.claimed_by}</p>
                  </div>
                </div>
              ) : claimRefund.status === 'failed' ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-600" />
                  <p className="text-[13px] text-red-900">
                    The claim transaction reverted on-chain. No funds left your treasury — issue a
                    new refund to try again.
                  </p>
                </div>
              ) : left ? (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                  <Clock size={15} className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-[13px] text-amber-900">
                    Awaiting claim — <span className="font-semibold">{left}</span> remaining.
                    Unclaimed funds return to your treasury on{' '}
                    {claimRefund.claim_expires_at ? formatDate(claimRefund.claim_expires_at) : '—'}.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <Clock size={15} className="mt-0.5 shrink-0 text-gray-500" />
                  <p className="text-[13px] text-gray-700">
                    This link expired unclaimed. The funds returned to your treasury — issue a new
                    refund if the customer still needs it.
                  </p>
                </div>
              )}

              {/* The link itself */}
              {claimRefund.claim_link && !isRevoked && !claimRefund.claimed_at && left && (
                <div>
                  <p className="mb-1.5 text-[13px] font-medium text-gray-700">Claim link</p>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                    <span className="flex-1 truncate font-mono text-xs text-gray-700">
                      {absoluteClaimUrl(claimRefund)}
                    </span>
                    <a
                      href={claimRefund.claim_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open claim page"
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    Anyone with this link can claim the refund to any address, so share it only
                    with the customer.
                  </p>
                </div>
              )}

              {/* Delivery */}
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div className="rounded-lg border border-gray-100 p-3">
                  <div className="text-[11px] text-gray-400">Sent to</div>
                  <div className="mt-0.5 truncate font-medium text-gray-900">
                    {claimRefund.recipient_email ?? 'No email on file'}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <div className="text-[11px] text-gray-400">Reminders sent</div>
                  <div className="mt-0.5 font-medium text-gray-900">
                    {claimRefund.claim_reminders_sent}
                  </div>
                </div>
              </div>

              {/* Lifecycle */}
              <div>
                <p className="mb-3 text-[13px] font-medium text-gray-700">Timeline</p>
                <ol className="space-y-3">
                  {events.map(ev => {
                    const st = EVENT_STYLE[ev.type];
                    return (
                      <li key={ev.id} className="flex gap-3">
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${st.tone}`}>
                          <st.icon size={12} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] text-gray-900">{ev.detail}</p>
                          <p className="text-[11px] text-gray-400">
                            {formatDate(ev.timestamp)}
                            {ev.actor ? ` · ${ev.actor.startsWith('0x') ? truncateAddress(ev.actor) : ev.actor}` : ''}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {claimRefund.tx_hash && (
                <a
                  href={getExplorerUrl(claimRefund.chain, claimRefund.tx_hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View settlement on explorer <ExternalLink size={13} />
                </a>
              )}
            </div>
          );
        })()}
      </Modal>

    </div>
  );
}
