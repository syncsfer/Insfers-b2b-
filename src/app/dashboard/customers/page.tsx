'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { WalletChip } from '@/components/ui/wallet-chip';
import { DataTable, type Column } from '@/components/ui/data-table';
import { formatUSDC, formatRelativeTime } from '@/lib/utils';
import { mockCustomers } from '@/lib/mock-data';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return mockCustomers;
    const q = search.toLowerCase();
    return mockCustomers.filter(c =>
      c.wallet_address.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.label?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  }, [search]);

  const columns: Column<Customer>[] = [
    {
      key: 'customer', header: 'Customer', width: '240px',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
            {c.email ? c.email[0].toUpperCase() : c.wallet_address.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{c.email || 'Anonymous'}</div>
            {c.label && <span className="text-[11px] text-gray-400">{c.label}</span>}
          </div>
        </div>
      ),
    },
    { key: 'wallet', header: 'Wallet', width: '180px', render: (c) => <WalletChip address={c.wallet_address} showExplorer={false} /> },
    { key: 'risk', header: 'Risk', width: '80px', render: (c) => <StatusPill status={c.risk_level} size="sm" /> },
    { key: 'ltv', header: 'Lifetime Value', width: '120px', align: 'right', sortable: true, render: (c) => <span className="font-semibold text-gray-900">{formatUSDC(c.lifetime_value)}</span> },
    { key: 'payments', header: 'Payments', width: '90px', align: 'right', render: (c) => <span className="text-sm text-gray-600">{c.payment_count}</span> },
    { key: 'last_payment', header: 'Last Payment', width: '120px', render: (c) => <span className="text-xs text-gray-500">{formatRelativeTime(c.last_payment_at)}</span> },
    {
      key: 'status', header: 'Status', width: '90px',
      render: (c) => c.is_blocked ? (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-red-700 bg-red-50 rounded-full border border-red-200">Blocked</span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-green-700 bg-green-50 rounded-full border border-green-200">Active</span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Customers</h1>
        <span className="text-sm text-gray-500">{mockCustomers.length} total customers</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by wallet, email, label..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(c) => router.push(`/dashboard/customers/${c.id}`)}
          keyExtractor={(c) => c.id}
          emptyMessage="No customers yet"
          emptyAction={
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users size={14} />
              Customers appear when payments are made
            </div>
          }
        />
      </div>
    </div>
  );
}
