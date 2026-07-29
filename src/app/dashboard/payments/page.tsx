'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MoreHorizontal, Copy, ExternalLink, Download, Link as LinkIcon, Bot, Wallet, Mail, AlertTriangle } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { getStatusSummary } from '@/components/ui/status-explainer';
import { WalletChip } from '@/components/ui/wallet-chip';
import { ChainBadge } from '@/components/ui/chain-badge';
import { CoinBadge, Money } from '@/components/ui/coin-badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { useToast } from '@/components/ui/toast';
import { formatRelativeTime, truncateAddress, getExplorerUrl } from '@/lib/utils';
import { mockPayments, mockAgents, mockReceipts } from '@/lib/mock-data';
import type { PaymentIntent, PaymentStatus } from '@/types';

const tabs: { label: string; value: PaymentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Succeeded', value: 'succeeded' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Expired', value: 'expired' },
];

export default function PaymentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<PaymentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let data = mockPayments;
    if (activeTab !== 'all') {
      data = data.filter(p => p.status === activeTab);
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.from_address.toLowerCase().includes(q) ||
        p.tx_hash?.toLowerCase().includes(q) ||
        p.customer_email?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [activeTab, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mockPayments.length };
    for (const p of mockPayments) {
      counts[p.status] = (counts[p.status] || 0) + 1;
    }
    return counts;
  }, []);

  const columns: Column<PaymentIntent>[] = [
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (p) => (
        <div>
          <StatusPill status={p.status} size="sm" />
          <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{getStatusSummary('payment', p.status)}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '110px',
      align: 'right',
      sortable: true,
      render: (p) => <span className="font-semibold text-gray-900"><Money minor={p.amount} currency={p.currency} showTicker={false} /></span>,
    },
    {
      key: 'fee',
      header: 'Fee',
      width: '70px',
      align: 'right',
      render: (p) => <span className="text-gray-400"><Money minor={p.fee} currency={p.currency} showTicker={false} /></span>,
    },
    {
      key: 'net',
      header: 'Net',
      width: '110px',
      align: 'right',
      render: (p) => <span className="font-semibold text-gray-900"><Money minor={p.net_amount} currency={p.currency} showTicker={false} /></span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      width: '180px',
      render: (p) => p.customer_email ? (
        <span className="text-sm text-gray-600">{p.customer_email}</span>
      ) : (
        <WalletChip address={p.from_address} chain={p.chain} showExplorer={false} />
      ),
    },
    {
      key: 'source',
      header: 'Source',
      width: '70px',
      render: (p) => p.initiated_by === 'agent' ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200" title={p.agent_id ? mockAgents.find(a => a.id === p.agent_id)?.name : 'Agent'}>
          <Bot size={9} /> Agent
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
          <Wallet size={9} /> Wallet
        </span>
      ),
    },
    {
      key: 'receipt',
      header: 'Receipt',
      width: '90px',
      render: (p) => {
        if (p.status !== 'succeeded') return <span className="text-gray-300">-</span>;
        const receipt = mockReceipts.find(r => r.payment_intent_id === p.id);
        if (!receipt) {
          return <span className="text-[10px] text-gray-400">Not sent</span>;
        }
        const failed = receipt.status === 'failed' || receipt.status === 'bounced';
        const landed = receipt.status === 'delivered' || receipt.status === 'opened';
        return (
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
              failed ? 'bg-red-50 text-red-700 border-red-200'
                : landed ? 'bg-green-50 text-green-700 border-green-200'
                : receipt.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
            title={receipt.error_message ?? `Sent to ${receipt.customer_email}`}
          >
            {failed ? <AlertTriangle size={9} /> : <Mail size={9} />} {receipt.status}
          </span>
        );
      },
    },
    {
      key: 'currency',
      header: 'Currency',
      width: '90px',
      render: (p) => <CoinBadge currency={p.currency} size="sm" />,
    },
    {
      key: 'network',
      header: 'Network',
      width: '90px',
      render: (p) => <ChainBadge chain={p.chain} />,
    },
    {
      key: 'tx_hash',
      header: 'Tx Hash',
      width: '140px',
      render: (p) => p.tx_hash ? (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-gray-500">{truncateAddress(p.tx_hash)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.tx_hash!); toast('Tx hash copied'); }}
            className="text-gray-300 hover:text-gray-500"
          >
            <Copy size={11} />
          </button>
          <a
            href={getExplorerUrl(p.chain, p.tx_hash)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-gray-300 hover:text-gray-500"
          >
            <ExternalLink size={11} />
          </a>
        </div>
      ) : (
        <span className="text-gray-300">-</span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      width: '130px',
      sortable: true,
      render: (p) => <span className="text-xs text-gray-500">{formatRelativeTime(p.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      align: 'center',
      render: (p) => (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === p.id ? null : p.id); }}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
          >
            <MoreHorizontal size={16} />
          </button>
          {openMenu === p.id && (
            <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/payments/${p.id}`); setOpenMenu(null); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                View details
              </button>
              {p.status === 'succeeded' && (
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/refunds?payment=${p.id}`); setOpenMenu(null); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Refund payment
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.id); toast('Payment ID copied'); setOpenMenu(null); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2"><Copy size={13} /> Copy payment ID</span>
              </button>
              {p.receipt_url && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.receipt_url!); toast('Receipt link copied'); setOpenMenu(null); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2"><LinkIcon size={13} /> Copy receipt link</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast(p.customer_email ? `Receipt sent to ${p.customer_email}` : 'No email on file for this customer');
                      setOpenMenu(null);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2"><Mail size={13} /> Resend receipt</span>
                  </button>
                </>
              )}
              {p.tx_hash && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <a
                    href={getExplorerUrl(p.chain, p.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2"><ExternalLink size={13} /> View on explorer</span>
                  </a>
                </>
              )}
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={(e) => { e.stopPropagation(); toast('Exported to CSV'); setOpenMenu(null); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2"><Download size={13} /> Export to CSV</span>
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Payments</h1>
        <a
          href="/dashboard/payment-links"
          className="inline-flex items-center gap-2 px-4 h-10 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create payment link
        </a>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-4 sticky top-0 bg-white z-10">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-5 py-3 text-sm font-medium border-b-[3px] transition-colors ${
              activeTab === tab.value
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label} ({tabCounts[tab.value] || 0})
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by tx hash, wallet, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              x
            </button>
          )}
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
          <Filter size={14} /> Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(p) => router.push(`/dashboard/payments/${p.id}`)}
          keyExtractor={(p) => p.id}
          emptyMessage="No payments found"
          emptyAction={
            <a href="/dashboard/payment-links" className="text-sm text-blue-600 font-medium hover:text-blue-700">
              Create your first payment link
            </a>
          }
        />
      </div>
    </div>
  );
}
