'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, Pause, Play, X as XIcon, RotateCcw, MoreHorizontal } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { WalletChip } from '@/components/ui/wallet-chip';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime } from '@/lib/utils';
import { mockSubscriptions, mockPlans, mockCustomers } from '@/lib/mock-data';
import type { SubscriptionStatus, Subscription } from '@/types';

const subTabs: { label: string; value: SubscriptionStatus | 'all' }[] = [
  { label: 'All', value: 'all' as SubscriptionStatus | 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Trialing', value: 'trialing' },
  { label: 'Past Due', value: 'past_due' },
  { label: 'Canceled', value: 'canceled' },
];

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SubscriptionStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planAmount, setPlanAmount] = useState('');
  const [planInterval, setPlanInterval] = useState<'week' | 'month' | 'year'>('month');
  const [planTrial, setPlanTrial] = useState('0');

  const filtered = useMemo(() => {
    let data = mockSubscriptions;
    if (activeTab !== 'all') data = data.filter(s => s.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s => s.id.includes(q) || s.plan_name.toLowerCase().includes(q) || s.customer_id.includes(q));
    }
    return data;
  }, [activeTab, search]);

  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: mockSubscriptions.length };
    for (const s of mockSubscriptions) c[s.status] = (c[s.status] || 0) + 1;
    return c;
  }, []);

  const getMRR = (s: Subscription) => s.interval === 'year' ? Math.floor(s.amount / 12) : s.amount;
  const totalMRR = mockSubscriptions.filter(s => s.status === 'active' || s.status === 'trialing').reduce((sum, s) => sum + getMRR(s), 0);

  const columns: Column<Subscription>[] = [
    { key: 'status', header: 'Status', width: '100px', render: (s) => <StatusPill status={s.status} size="sm" /> },
    {
      key: 'customer', header: 'Customer', width: '200px',
      render: (s) => {
        const cust = mockCustomers.find(c => c.id === s.customer_id);
        return (
          <div>
            <div className="text-sm text-gray-900">{cust?.email || 'Anonymous'}</div>
            <div className="text-[11px] font-mono text-gray-400">{cust?.wallet_address.slice(0, 10) || s.customer_id}...</div>
          </div>
        );
      },
    },
    {
      key: 'plan', header: 'Plan', width: '160px',
      render: (s) => (
        <div>
          <span className="text-sm font-medium text-gray-900">{s.plan_name}</span>
          <span className="text-xs text-gray-500 ml-1">({formatUSDC(s.amount)}/{s.interval})</span>
        </div>
      ),
    },
    {
      key: 'next_billing', header: 'Next Billing', width: '130px',
      render: (s) => {
        if (s.status === 'canceled') return <span className="text-gray-300">-</span>;
        const daysUntil = Math.ceil((new Date(s.next_billing_date).getTime() - Date.now()) / 86400000);
        return <span className={`text-sm ${daysUntil <= 3 ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>{daysUntil > 0 ? `${daysUntil} days` : 'Today'}</span>;
      },
    },
    { key: 'mrr', header: 'MRR', width: '90px', align: 'right', render: (s) => <span className="text-sm font-semibold text-gray-900">{formatUSDC(getMRR(s))}</span> },
    {
      key: 'retry', header: 'Retries', width: '80px', align: 'center',
      render: (s) => s.status === 'past_due' ? (
        <span className="text-xs font-medium text-amber-600">{s.retry_count}/{s.max_retries}</span>
      ) : <span className="text-gray-300">-</span>,
    },
    {
      key: 'actions', header: '', width: '120px', align: 'right',
      render: (s) => s.status === 'active' || s.status === 'trialing' ? (
        <div className="flex gap-1">
          <button onClick={e => { e.stopPropagation(); toast('Subscription paused'); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400" title="Pause"><Pause size={14} /></button>
          <button onClick={e => { e.stopPropagation(); toast('Subscription canceled'); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-500" title="Cancel"><XIcon size={14} /></button>
        </div>
      ) : s.status === 'past_due' ? (
        <button onClick={e => { e.stopPropagation(); toast('Retry billing initiated'); }} className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 border border-blue-200">
          <span className="flex items-center gap-1"><RotateCcw size={11} /> Retry</span>
        </button>
      ) : null,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">MRR: <span className="font-semibold text-gray-900">{formatUSDC(totalMRR)}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPlans(!showPlans)} className="inline-flex items-center gap-2 px-4 h-10 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
            {showPlans ? 'Subscriptions' : 'View Plans'}
          </button>
          <button onClick={() => setCreatePlanOpen(true)} className="inline-flex items-center gap-2 px-4 h-10 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Create plan
          </button>
        </div>
      </div>

      {showPlans ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mockPlans.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
                {!p.active && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Inactive</span>}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-900">{formatUSDC(p.amount)}</span>
                <span className="text-sm text-gray-500">/{p.interval}</span>
              </div>
              {p.trial_days > 0 && <p className="text-xs text-blue-600 mt-1">{p.trial_days}-day free trial</p>}
              <div className="mt-3 text-xs text-gray-500">
                {p.subscriber_count} active subscribers
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-0 border-b border-gray-200 mb-4">
            {subTabs.map(tab => (
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
              <input type="text" placeholder="Search by email, wallet, subscription ID..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <DataTable columns={columns} data={filtered} keyExtractor={s => s.id} emptyMessage="No subscriptions found" />
          </div>
        </>
      )}

      {/* Create Plan Modal */}
      <Modal
        open={createPlanOpen}
        onClose={() => setCreatePlanOpen(false)}
        title="Create Subscription Plan"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setCreatePlanOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => { toast('Plan created'); setCreatePlanOpen(false); }} disabled={!planName || !planAmount} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">Create plan</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Plan name</label>
            <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Pro Monthly" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Amount (USDC)</label>
              <input type="number" value={planAmount} onChange={e => setPlanAmount(e.target.value)} placeholder="99.00" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Interval</label>
              <select value={planInterval} onChange={e => setPlanInterval(e.target.value as 'week' | 'month' | 'year')} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Trial period (days)</label>
            <input type="number" value={planTrial} onChange={e => setPlanTrial(e.target.value)} placeholder="0" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
