'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Ban, Edit2, Check, X } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { WalletChip } from '@/components/ui/wallet-chip';
import { ChainBadge } from '@/components/ui/chain-badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime, formatDate } from '@/lib/utils';
import { mockCustomers, mockPayments } from '@/lib/mock-data';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState('');

  const customer = mockCustomers.find(c => c.id === params.id) || mockCustomers[0];
  const customerPayments = mockPayments.filter(p => p.from_address === customer.wallet_address).slice(0, 10);

  return (
    <div>
      <button onClick={() => router.push('/dashboard/customers')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} /> Customers
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-lg font-bold">
              {customer.email ? customer.email[0].toUpperCase() : 'A'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{customer.email || 'Anonymous Customer'}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-gray-500">{customer.id}</span>
                {customer.is_blocked && <StatusPill status="failed" size="sm" />}
                <StatusPill status={customer.risk_level} size="sm" />
                {editingLabel ? (
                  <div className="flex items-center gap-1">
                    <input value={labelValue} onChange={e => setLabelValue(e.target.value)} className="px-2 py-0.5 text-xs border rounded" autoFocus />
                    <button onClick={() => { setEditingLabel(false); toast('Label updated'); }} className="text-green-600"><Check size={14} /></button>
                    <button onClick={() => setEditingLabel(false)} className="text-gray-400"><X size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => { setLabelValue(customer.label || ''); setEditingLabel(true); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                    {customer.label || 'Add label'} <Edit2 size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setBlockModalOpen(true)}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${
            customer.is_blocked
              ? 'text-gray-700 border border-gray-200 hover:bg-gray-50'
              : 'text-red-600 border border-red-200 hover:bg-red-50'
          }`}
        >
          {customer.is_blocked ? <Shield size={14} /> : <Ban size={14} />}
          {customer.is_blocked ? 'Unblock wallet' : 'Block wallet'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Lifetime Value', value: formatUSDC(customer.lifetime_value) },
          { label: 'Total Payments', value: customer.payment_count.toString() },
          { label: 'First Payment', value: formatDate(customer.first_payment_at).split(',')[0] },
          { label: 'Last Payment', value: formatRelativeTime(customer.last_payment_at) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Details</h3>
          <div className="space-y-3">
            <div><p className="text-xs text-gray-500">Wallet</p><WalletChip address={customer.wallet_address} /></div>
            <div><p className="text-xs text-gray-500">Email</p><p className="text-sm text-gray-900">{customer.email || '-'}</p></div>
            <div><p className="text-xs text-gray-500">Risk Level</p><StatusPill status={customer.risk_level} size="sm" /></div>
            <div><p className="text-xs text-gray-500">Created</p><p className="text-sm text-gray-900">{formatDate(customer.created_at)}</p></div>
          </div>
        </div>
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Payment History</h3></div>
          <div className="divide-y divide-gray-100">
            {customerPayments.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No payments found</div>
            ) : customerPayments.map(p => (
              <a key={p.id} href={`/dashboard/payments/${p.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                <StatusPill status={p.status} size="sm" />
                <span className="font-semibold text-sm text-gray-900">{formatUSDC(p.amount)}</span>
                <ChainBadge chain={p.chain} />
                <span className="text-xs text-gray-400 ml-auto">{formatRelativeTime(p.created_at)}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title={customer.is_blocked ? 'Unblock Wallet' : 'Block Wallet'}
        footer={
          <div className="flex gap-3">
            <button onClick={() => setBlockModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => { toast(customer.is_blocked ? 'Wallet unblocked' : 'Wallet blocked'); setBlockModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
              {customer.is_blocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {customer.is_blocked
              ? 'This will allow this wallet to make payments again.'
              : 'This will prevent this wallet from making any future payments. Existing payments are not affected.'}
          </p>
          <div className="bg-gray-50 rounded-lg p-3">
            <WalletChip address={customer.wallet_address} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
