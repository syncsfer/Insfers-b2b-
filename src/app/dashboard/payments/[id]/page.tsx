'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Copy, ExternalLink, RotateCcw, Check, Bot, Wallet,
  Mail, Send, AlertTriangle, Clock, Eye,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { StatusExplainer } from '@/components/ui/status-explainer';
import { WalletChip } from '@/components/ui/wallet-chip';
import { ChainBadge } from '@/components/ui/chain-badge';
import { Timeline } from '@/components/ui/timeline';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatDate, formatRelativeTime, getExplorerUrl, truncateAddress } from '@/lib/utils';
import { mockPayments, mockTimeline, mockAgents, mockReceipts } from '@/lib/mock-data';
import type { ReceiptStatus } from '@/types';

const receiptStatusMeta: Record<ReceiptStatus, { label: string; icon: React.ElementType; className: string }> = {
  sent:      { label: 'Sent',        icon: Send,          className: 'text-blue-700 bg-blue-50 border-blue-200' },
  delivered: { label: 'Delivered',   icon: Check,         className: 'text-green-700 bg-green-50 border-green-200' },
  opened:    { label: 'Opened',      icon: Eye,           className: 'text-green-700 bg-green-50 border-green-200' },
  pending:   { label: 'Queued',      icon: Clock,         className: 'text-amber-700 bg-amber-50 border-amber-200' },
  failed:    { label: 'Failed',      icon: AlertTriangle, className: 'text-red-700 bg-red-50 border-red-200' },
  bounced:   { label: 'Bounced',     icon: AlertTriangle, className: 'text-red-700 bg-red-50 border-red-200' },
  not_sent:  { label: 'Not sent',    icon: Mail,          className: 'text-gray-600 bg-gray-50 border-gray-200' },
};

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'customer'>('details');
  const [sendReceiptOpen, setSendReceiptOpen] = useState(false);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [sending, setSending] = useState(false);

  const payment = mockPayments.find(p => p.id === params.id) || mockPayments[0];
  const receipt = mockReceipts.find(r => r.payment_intent_id === payment.id);
  const receiptStatus: ReceiptStatus = receipt?.status ?? 'not_sent';
  const receiptMeta = receiptStatusMeta[receiptStatus];
  const canSendReceipt = payment.status === 'succeeded';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiptEmail);

  const openSendReceipt = () => {
    setReceiptEmail(receipt?.customer_email ?? payment.customer_email ?? '');
    setSendReceiptOpen(true);
  };

  const handleSendReceipt = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSendReceiptOpen(false);
      toast(`Receipt sent to ${receiptEmail}`);
    }, 1200);
  };

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

      {/* Status explainer */}
      <StatusExplainer
        context="payment"
        status={payment.status}
        timestamp={payment.status === 'succeeded' ? payment.confirmed_at ?? undefined : payment.created_at}
        className="mb-6"
        onAction={
          payment.status === 'succeeded'
            ? () => router.push(`/dashboard/refunds?payment=${payment.id}`)
            : payment.status === 'failed' && payment.tx_hash
              ? () => window.open(getExplorerUrl(payment.chain, payment.tx_hash!), '_blank')
              : undefined
        }
      />

      {/* Two column layout */}
      <div className="flex gap-6">
        {/* Left: Receipt + Timeline */}
        <div className="w-[35%] self-start sticky top-6 space-y-4">
          {/* Email receipt */}
          {canSendReceipt && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Email Receipt</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${receiptMeta.className}`}>
                  <receiptMeta.icon size={10} /> {receiptMeta.label}
                </span>
              </div>

              {receipt ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Recipient</span>
                    <span className="text-gray-900 font-medium truncate ml-2">{receipt.customer_email}</span>
                  </div>
                  {receipt.sent_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Sent</span>
                      <span className="text-gray-700">{formatRelativeTime(receipt.sent_at)}</span>
                    </div>
                  )}
                  {receipt.opened_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Opened</span>
                      <span className="text-gray-700">{formatRelativeTime(receipt.opened_at)}</span>
                    </div>
                  )}
                  {receipt.attempts > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Attempts</span>
                      <span className="text-gray-700">{receipt.attempts}</span>
                    </div>
                  )}
                  {receipt.error_message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mt-2 flex items-start gap-2">
                      <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-red-700">{receipt.error_message}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  {payment.customer_email
                    ? 'No receipt has been sent for this payment yet.'
                    : 'No email on file for this customer. Add one to send a receipt.'}
                </p>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={openSendReceipt}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Send size={12} /> {receipt ? 'Resend' : 'Send receipt'}
                </button>
                {payment.receipt_url && (
                  <a
                    href={payment.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ExternalLink size={12} /> View
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity</h3>
            <Timeline events={mockTimeline} />
          </div>
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
                  <span className="text-sm text-gray-500">Source</span>
                  <div className="flex items-center gap-2">
                    {payment.initiated_by === 'agent' ? (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <Bot size={11} /> Agent
                        </span>
                        {payment.agent_id && (
                          <a
                            href="/dashboard/agents"
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                          >
                            {mockAgents.find(a => a.id === payment.agent_id)?.name || payment.agent_id}
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                        <Wallet size={11} /> Wallet
                      </span>
                    )}
                  </div>
                </div>

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
                      <a
                        href={payment.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 font-medium hover:text-blue-700"
                      >
                        View receipt
                      </a>
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

      {/* Send receipt modal */}
      <Modal
        open={sendReceiptOpen}
        onClose={() => setSendReceiptOpen(false)}
        title={receipt ? 'Resend Receipt' : 'Send Receipt'}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setSendReceiptOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendReceipt}
              disabled={!emailValid || sending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={14} /> {sending ? 'Sending...' : 'Send receipt'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Payment</span>
              <span className="font-mono text-xs text-gray-900">{payment.id}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-semibold text-gray-900">{formatUSDC(payment.amount)} USDC</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Network</span>
              <ChainBadge chain={payment.chain} />
            </div>
          </div>

          <div>
            <label htmlFor="send-receipt-email" className="text-sm font-medium text-gray-700">
              Send to
            </label>
            <div className="relative mt-1">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="send-receipt-email"
                type="email"
                value={receiptEmail}
                onChange={e => setReceiptEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {receiptEmail && !emailValid && (
              <p className="text-xs text-red-500 mt-1">Enter a valid email address</p>
            )}
          </div>

          {receipt && receipt.sent_at && (
            <p className="text-xs text-gray-500">
              Last sent {formatRelativeTime(receipt.sent_at)} &middot; {receipt.attempts} attempt{receipt.attempts === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
