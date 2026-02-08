'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Plus, MoreHorizontal, Copy, ExternalLink } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { WalletChip } from '@/components/ui/wallet-chip';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime, truncateAddress } from '@/lib/utils';
import { mockRefunds, mockPayments } from '@/lib/mock-data';
import type { Refund, RefundStatus } from '@/types';

const tabs: { label: string; value: RefundStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Awaiting Claim', value: 'awaiting_claim' },
];

export default function RefundsPage() {
  const { toast } = useToast();
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
    { key: 'status', header: 'Status', width: '120px', render: (r) => <StatusPill status={r.status} size="sm" /> },
    { key: 'amount', header: 'Amount', width: '90px', align: 'right', render: (r) => <span className="font-semibold text-gray-900">{formatUSDC(r.amount)}</span> },
    { key: 'payment', header: 'Original Payment', width: '130px', render: (r) => <a href={`/dashboard/payments/${r.payment_intent_id}`} className="text-sm text-blue-600 font-mono hover:text-blue-700">{truncateAddress(r.payment_intent_id)}</a> },
    { key: 'method', header: 'Method', width: '110px', render: (r) => <span className="text-sm capitalize text-gray-600">{r.method === 'claimable' ? 'Claimable' : r.method === 'direct' ? 'Direct' : 'Escrow'}</span> },
    {
      key: 'tx_link', header: 'Tx Hash / Link', width: '160px',
      render: (r) => r.tx_hash ? (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-gray-500">{truncateAddress(r.tx_hash)}</span>
          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(r.tx_hash!); toast('Copied'); }} className="text-gray-300 hover:text-gray-500"><Copy size={11} /></button>
        </div>
      ) : r.claim_link ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-blue-600">Claim link</span>
          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(r.claim_link!); toast('Claim link copied'); }} className="text-gray-300 hover:text-gray-500"><Copy size={11} /></button>
        </div>
      ) : <span className="text-gray-300">-</span>,
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
    </div>
  );
}
