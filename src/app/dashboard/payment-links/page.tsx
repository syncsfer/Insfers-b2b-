'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Copy, ExternalLink, MoreHorizontal, Eye, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { ChainBadge } from '@/components/ui/chain-badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC } from '@/lib/utils';
import { mockPaymentLinks } from '@/lib/mock-data';
import type { PaymentLink, Chain } from '@/types';

export default function PaymentLinksPage() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedChains, setSelectedChains] = useState<Chain[]>(['base']);
  const [createdLink, setCreatedLink] = useState<{ id: string; url: string } | null>(null);

  const handleCreate = () => {
    const newId = `pl_${Math.random().toString(36).slice(2, 8)}`;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/l/${newId}`;
    setCreatedLink({ id: newId, url });
    toast('Payment link created');
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreatedLink(null);
    setName('');
    setAmount('');
    setSelectedChains(['base']);
  };

  const getPublicUrl = (l: PaymentLink) => {
    if (l.url.startsWith('http')) return l.url;
    return typeof window !== 'undefined' ? `${window.location.origin}${l.url}` : l.url;
  };

  const columns: Column<PaymentLink>[] = [
    {
      key: 'name', header: 'Name', width: '200px',
      render: (l) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">{l.name}</div>
          <div className="text-[11px] text-gray-400 font-mono">{l.id}</div>
        </div>
      ),
    },
    {
      key: 'amount', header: 'Amount', width: '100px', align: 'right',
      render: (l) => l.amount ? (
        <span className="font-semibold text-gray-900">{formatUSDC(l.amount)}</span>
      ) : (
        <span className="text-gray-400 text-sm">Custom</span>
      ),
    },
    {
      key: 'status', header: 'Status', width: '90px',
      render: (l) => <StatusPill status={l.active ? 'active' : 'expired'} size="sm" />,
    },
    {
      key: 'networks', header: 'Networks', width: '140px',
      render: (l) => (
        <div className="flex gap-1 flex-wrap">
          {l.chains.map(c => <ChainBadge key={c} chain={c} showLabel={false} />)}
        </div>
      ),
    },
    {
      key: 'payments', header: 'Payments', width: '90px', align: 'right',
      render: (l) => <span className="text-sm text-gray-600">{l.payment_count}</span>,
    },
    {
      key: 'collected', header: 'Collected', width: '100px', align: 'right',
      render: (l) => <span className="font-semibold text-gray-900">{formatUSDC(l.total_collected)}</span>,
    },
    {
      key: 'actions', header: '', width: '110px', align: 'right',
      render: (l) => (
        <div className="flex items-center gap-1 justify-end">
          <Link href={l.url} target="_blank" onClick={e => e.stopPropagation()} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400" title="Open link">
            <Eye size={14} />
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(getPublicUrl(l)); toast('Link copied'); }}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
            title="Copy link"
          >
            <Copy size={14} />
          </button>
        </div>
      ),
    },
  ];

  const allChains: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Payment Links</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 h-10 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Create link
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={mockPaymentLinks}
          keyExtractor={(l) => l.id}
          emptyMessage="No payment links yet"
          emptyAction={
            <button onClick={() => setCreateOpen(true)} className="text-sm text-blue-600 font-medium hover:text-blue-700">
              Create your first payment link
            </button>
          }
        />
      </div>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title={createdLink ? 'Payment link created' : 'Create Payment Link'}
        footer={
          createdLink ? (
            <div className="flex gap-3">
              <button onClick={closeCreate} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Done</button>
              <Link href={`/l/${createdLink.id}`} target="_blank" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 inline-flex items-center gap-1.5">
                Open link <ExternalLink size={14} />
              </Link>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={closeCreate} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={!name}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create link
              </button>
            </div>
          )
        }
      >
        {createdLink ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center text-center pt-2">
              <div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={22} className="text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Link {createdLink.id} created</p>
                <p className="text-xs text-gray-500 mt-1">Share this URL with your customers:</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
              <span className="text-xs font-mono text-gray-700 flex-1 truncate">{createdLink.url}</span>
              <button onClick={() => { navigator.clipboard.writeText(createdLink.url); toast('Link copied'); }} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500" title="Copy link">
                <Copy size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Pro Plan" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Amount (USDC) - leave blank for custom</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Accepted Networks</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {allChains.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedChains(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${selectedChains.includes(c) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <ChainBadge chain={c} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
