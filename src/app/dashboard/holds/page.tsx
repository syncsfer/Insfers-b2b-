'use client';

import { useState, useMemo } from 'react';
import { Search, Timer, DollarSign, ArrowRight } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { getStatusSummary } from '@/components/ui/status-explainer';
import { WalletChip } from '@/components/ui/wallet-chip';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime } from '@/lib/utils';
import { mockHolds } from '@/lib/mock-data';
import type { HoldStatus, Hold } from '@/types';

const tabs: { label: string; value: HoldStatus | 'all' }[] = [
  { label: 'All', value: 'all' as HoldStatus | 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Captured', value: 'captured' },
  { label: 'Released', value: 'released' },
  { label: 'Expired', value: 'expired' },
];

export default function HoldsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<HoldStatus | 'all'>('all');
  const [captureModal, setCaptureModal] = useState<Hold | null>(null);
  const [releaseModal, setReleaseModal] = useState<Hold | null>(null);
  const [captureAmount, setCaptureAmount] = useState('');
  const [releaseConfirm, setReleaseConfirm] = useState(false);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return mockHolds;
    return mockHolds.filter(h => h.status === activeTab);
  }, [activeTab]);

  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: mockHolds.length };
    for (const h of mockHolds) c[h.status] = (c[h.status] || 0) + 1;
    return c;
  }, []);

  const getRemaining = (h: Hold) => h.amount - h.captured_amount - h.released_amount;

  const getTimeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${mins}m`;
  };

  const columns: Column<Hold>[] = [
    { key: 'status', header: 'Status', width: '140px', render: (h) => (
      <div>
        <StatusPill status={h.status} size="sm" />
        <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{getStatusSummary('hold', h.status)}</div>
      </div>
    ) },
    { key: 'amount', header: 'Amount', width: '100px', align: 'right', render: (h) => <span className="font-semibold text-gray-900">{formatUSDC(h.amount)}</span> },
    { key: 'captured', header: 'Captured', width: '100px', align: 'right', render: (h) => <span className="text-sm text-gray-600">{formatUSDC(h.captured_amount)}</span> },
    { key: 'remaining', header: 'Remaining', width: '100px', align: 'right', render: (h) => <span className="text-sm font-medium text-gray-900">{formatUSDC(getRemaining(h))}</span> },
    { key: 'customer', header: 'Customer', width: '160px', render: (h) => <WalletChip address={h.from_address} showExplorer={false} /> },
    {
      key: 'expires', header: 'Expires In', width: '110px',
      render: (h) => {
        const left = getTimeLeft(h.expires_at);
        const isUrgent = new Date(h.expires_at).getTime() - Date.now() < 86400000 && h.status === 'active';
        return (
          <span className={`text-sm font-medium ${isUrgent ? 'text-amber-600' : h.status === 'expired' ? 'text-gray-400' : 'text-gray-600'}`}>
            {h.status === 'active' ? left : '-'}
          </span>
        );
      },
    },
    { key: 'created', header: 'Created', width: '110px', render: (h) => <span className="text-xs text-gray-500">{formatRelativeTime(h.created_at)}</span> },
    {
      key: 'actions', header: '', width: '160px', align: 'right',
      render: (h) => h.status === 'active' ? (
        <div className="flex gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); setCaptureAmount(String(getRemaining(h) / 100)); setCaptureModal(h); }}
            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 border border-blue-200"
          >
            Capture
          </button>
          <button
            onClick={e => { e.stopPropagation(); setReleaseConfirm(false); setReleaseModal(h); }}
            className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 border border-gray-200"
          >
            Release
          </button>
        </div>
      ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Holds & Captures</h1>
          <p className="text-sm text-gray-500 mt-1">Manage escrowed funds before final settlement</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1"><DollarSign size={14} /> Total held: {formatUSDC(mockHolds.filter(h => h.status === 'active').reduce((s, h) => s + getRemaining(h), 0))}</span>
        </div>
      </div>

      <div className="flex items-center gap-0 border-b border-gray-200 mb-4">
        {tabs.map(tab => (
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

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={filtered} keyExtractor={h => h.id} emptyMessage="No holds found" />
      </div>

      {/* Capture Modal */}
      <Modal
        open={!!captureModal}
        onClose={() => setCaptureModal(null)}
        title="Capture Funds"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setCaptureModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => { toast('Funds captured successfully'); setCaptureModal(null); }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Capture {captureAmount ? `$${captureAmount}` : ''}
            </button>
          </div>
        }
      >
        {captureModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Hold ID</span><span className="font-mono text-gray-900">{captureModal.id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Original amount</span><span className="font-semibold">{formatUSDC(captureModal.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Already captured</span><span>{formatUSDC(captureModal.captured_amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Remaining</span><span className="font-semibold">{formatUSDC(getRemaining(captureModal))}</span></div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Capture amount (USDC)</label>
              <input type="number" value={captureAmount} onChange={e => setCaptureAmount(e.target.value)} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Funds will be sent to your settlement wallet</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Release Modal */}
      <Modal
        open={!!releaseModal}
        onClose={() => setReleaseModal(null)}
        title="Release Funds"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setReleaseModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => { toast('Funds released to customer'); setReleaseModal(null); }} disabled={!releaseConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
              Release {releaseModal ? formatUSDC(getRemaining(releaseModal)) : ''}
            </button>
          </div>
        }
      >
        {releaseModal && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">Funds will be returned to customer <span className="font-mono">{releaseModal.from_address.slice(0, 10)}...</span></p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Amount to release</span><span className="font-semibold">{formatUSDC(getRemaining(releaseModal))}</span></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={releaseConfirm} onChange={e => setReleaseConfirm(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">I confirm this release</span>
            </label>
          </div>
        )}
      </Modal>
    </div>
  );
}
