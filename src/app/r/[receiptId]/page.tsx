'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, Download, Printer, Zap, ExternalLink, ShieldCheck, Copy,
} from 'lucide-react';
import { ChainBadge } from '@/components/ui/chain-badge';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatDate, truncateAddress, getExplorerUrl } from '@/lib/utils';
import { mockReceipts, mockPayments, mockReceiptSettings } from '@/lib/mock-data';

export default function PublicReceiptPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = use(params);
  const { toast } = useToast();

  // Look up receipt by id; fall back to the first one so the demo link always renders.
  const receipt = mockReceipts.find(r => r.id === receiptId) ?? mockReceipts[0];
  const payment = mockPayments.find(p => p.id === receipt?.payment_intent_id);

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">Receipt not found</p>
          <p className="text-xs text-gray-500 mt-1">This receipt link may have expired.</p>
        </div>
      </div>
    );
  }

  const merchantName = mockReceiptSettings.from_name;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar — hidden when printing */}
      <div className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Chain Payments</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={() => toast('Receipt PDF downloaded')}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Paid banner */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-900">Payment received</p>
            <p className="text-xs text-green-700">
              Paid on {payment?.confirmed_at ? formatDate(payment.confirmed_at) : formatDate(receipt.created_at)}
            </p>
          </div>
        </div>

        {/* Receipt card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Receipt</p>
                <p className="text-lg font-bold text-gray-900 font-mono mt-1">{receipt.id}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{merchantName[0]}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">From</p>
                <p className="text-sm font-semibold text-gray-900">{merchantName}</p>
                <p className="text-xs text-gray-500">{mockReceiptSettings.reply_to}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Billed to</p>
                <p className="text-sm font-semibold text-gray-900">{receipt.customer_email}</p>
                {payment?.from_address && (
                  <p className="text-xs text-gray-500 font-mono">{truncateAddress(payment.from_address)}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Date paid</p>
                <p className="text-sm text-gray-900">
                  {payment?.confirmed_at ? formatDate(payment.confirmed_at) : formatDate(receipt.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Payment method</p>
                <p className="text-sm text-gray-900">USDC on {receipt.chain}</p>
              </div>
            </div>
          </div>

          {/* Line item */}
          <div className="px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-3 font-medium">Description</th>
                  <th className="text-right pb-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="py-3 text-gray-900">{payment?.description || 'Payment'}</td>
                  <td className="py-3 text-right font-medium text-gray-900">{formatUSDC(receipt.amount)}</td>
                </tr>
                {payment && payment.fee > 0 && (
                  <tr className="border-b border-gray-50">
                    <td className="py-3 text-gray-500">Network fee</td>
                    <td className="py-3 text-right text-gray-600">{formatUSDC(payment.fee)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-baseline">
              <div className="text-sm text-gray-500">Total paid</div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatUSDC(receipt.amount)}</div>
                <div className="text-xs text-gray-500 mt-0.5">USDC</div>
              </div>
            </div>
          </div>

          {/* On-chain proof */}
          {mockReceiptSettings.include_tx_link && receipt.tx_hash && (
            <div className="px-8 py-5 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-3">On-chain confirmation</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Network</span>
                  <ChainBadge chain={receipt.chain} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Transaction</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-gray-700">{truncateAddress(receipt.tx_hash)}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(receipt.tx_hash!); toast('Tx hash copied'); }}
                      className="text-gray-300 hover:text-gray-500 print:hidden"
                    >
                      <Copy size={12} />
                    </button>
                    <a
                      href={getExplorerUrl(receipt.chain, receipt.tx_hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-gray-500 print:hidden"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Payment ID</span>
                  <span className="font-mono text-xs text-gray-700">{receipt.payment_intent_id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer message */}
          {mockReceiptSettings.footer_message && (
            <div className="px-8 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-600">{mockReceiptSettings.footer_message}</p>
            </div>
          )}
        </div>

        <p className="text-center mt-6 print:hidden">
          <Link
            href="/security"
            className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
          >
            <ShieldCheck size={11} /> Secured by <span className="font-medium">Chain Payments</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
