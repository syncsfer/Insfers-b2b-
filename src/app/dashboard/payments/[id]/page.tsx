'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, RotateCcw, Check } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { WalletChip } from '@/components/ui/wallet-chip';
import { ChainBadge } from '@/components/ui/chain-badge';
import { Timeline } from '@/components/ui/timeline';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatDate, getExplorerUrl, truncateAddress } from '@/lib/utils';
import { mockPayments, mockTimeline } from '@/lib/mock-data';

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'customer'>('details');

  const payment = mockPayments.find(p => p.id === params.id) || mockPayments[0];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied`);
  };

  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'customer', label: 'Customer' },
  ] as const;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard/payments')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={16} /> Payments
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-base font-semibold text-gray-600">{payment.id}</span>
            <StatusPill status={payment.status} size="lg" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatUSDC(payment.amount)}</div>
          {payment.status === 'succeeded' && (
            <div className="flex items-center gap-1.5 mt-2">
              <Check size={14} className="text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                {payment.confirmations} of {payment.required_confirmations} confirmations - Finalized
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {payment.status === 'succeeded' && (
            <button
              onClick={() => router.push(`/dashboard/refunds?payment=${payment.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <RotateCcw size={14} /> Refund
            </button>
          )}
          {payment.tx_hash && (
            <a
              href={getExplorerUrl(payment.chain, payment.tx_hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <ExternalLink size={14} /> Explorer
            </a>
          )}
        </div>
      </div>

      {/* Two column layout */}
      <div className="flex gap-6">
        {/* Left: Timeline */}
        <div className="w-[35%] bg-white border border-gray-200 rounded-xl p-5 self-start sticky top-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity</h3>
          <Timeline events={mockTimeline} />
        </div>

        {/* Right: Tabbed content */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'details' && (
              <div className="space-y-4">
                {[
                  { label: 'Payment ID', value: payment.id, copy: true },
                  { label: 'Amount', value: `${formatUSDC(payment.amount)} USDC` },
                  { label: 'Fee', value: formatUSDC(payment.fee), tooltip: 'Network gas fee' },
                  { label: 'Net Amount', value: formatUSDC(payment.net_amount) },
                  { label: 'Status', value: <StatusPill status={payment.status} /> },
                  { label: 'Network', value: <ChainBadge chain={payment.chain} /> },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-500">{row.label}</span>
                    <div className="flex items-center gap-2">
                      {typeof row.value === 'string' ? (
                        <span className="text-sm font-medium text-gray-900">{row.value}</span>
                      ) : row.value}
                      {row.copy && (
                        <button
                          onClick={() => copyToClipboard(payment.id, 'Payment ID')}
                          className="text-gray-300 hover:text-gray-500"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">From Address</span>
                  <WalletChip address={payment.from_address} chain={payment.chain} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">To Address</span>
                  <WalletChip address={payment.to_address} chain={payment.chain} />
                </div>

                {payment.tx_hash && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Transaction Hash</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-900">{truncateAddress(payment.tx_hash)}</span>
                      <button
                        onClick={() => copyToClipboard(payment.tx_hash!, 'Tx hash')}
                        className="text-gray-300 hover:text-gray-500"
                      >
                        <Copy size={13} />
                      </button>
                      <a
                        href={getExplorerUrl(payment.chain, payment.tx_hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-gray-500"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Confirmations</span>
                  <span className="text-sm font-medium text-gray-900">
                    {payment.confirmations} of {payment.required_confirmations} {payment.status === 'succeeded' ? '(Finalized)' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Created At</span>
                  <span className="text-sm text-gray-900">{formatDate(payment.created_at)}</span>
                </div>
                {payment.confirmed_at && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Confirmed At</span>
                    <span className="text-sm text-gray-900">{formatDate(payment.confirmed_at)}</span>
                  </div>
                )}
                {payment.receipt_url && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">Receipt Link</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-600 font-medium">View receipt</span>
                      <button
                        onClick={() => copyToClipboard(payment.receipt_url!, 'Receipt link')}
                        className="text-gray-300 hover:text-gray-500"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'customer' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Customer ID</span>
                  <a href={`/dashboard/customers/${payment.customer_id}`} className="text-sm text-blue-600 font-medium hover:text-blue-700">
                    {payment.customer_id}
                  </a>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Wallet</span>
                  <WalletChip address={payment.from_address} chain={payment.chain} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm text-gray-900">{payment.customer_email || '-'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Lifetime Value</span>
                  <span className="text-sm font-medium text-gray-900">$1,250.00</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Payment Count</span>
                  <span className="text-sm text-gray-900">12 successful payments</span>
                </div>
                <div className="pt-4 flex gap-3">
                  <a
                    href={`/dashboard/customers/${payment.customer_id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    View customer profile
                  </a>
                  <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                    Block wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
