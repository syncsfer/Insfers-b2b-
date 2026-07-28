'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { FileText, Download, CheckCircle2, Clock, AlertCircle, Zap, ExternalLink, ShieldCheck } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { ChainBadge } from '@/components/ui/chain-badge';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatDate } from '@/lib/utils';
import { mockInvoices, mockCustomers, mockReceipts } from '@/lib/mock-data';
import type { Chain } from '@/types';

export default function PublicInvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = use(params);
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState<Chain>('base');
  const [paying, setPaying] = useState(false);

  // Look up invoice by id; fall back to first invoice for demo if not found
  const invoice = mockInvoices.find(inv => inv.id === invoiceId) ?? mockInvoices[0];
  const customer = mockCustomers.find(c => c.id === invoice.customer_id);

  const isPaid = invoice.status === 'paid';
  const isVoid = invoice.status === 'void';
  // Paid invoices link through to the receipt for the payment that settled them.
  const receiptHref = invoice.payment_intent_id
    ? mockReceipts.find(r => r.payment_intent_id === invoice.payment_intent_id)?.receipt_url ?? null
    : null;
  const isOverdue = new Date(invoice.due_date) < new Date() && !isPaid && !isVoid;
  const chains: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];

  function handlePay() {
    setPaying(true);
    setTimeout(() => {
      window.location.href = `/checkout/sess_${invoice.id}`;
    }, 600);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Chain Payments</span>
          </div>
          <button onClick={() => toast('PDF downloaded')} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Status banner */}
        {isPaid && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">Invoice paid</p>
              <p className="text-xs text-green-700">Paid on {invoice.paid_at ? formatDate(invoice.paid_at) : 'recently'}</p>
            </div>
          </div>
        )}
        {isOverdue && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-900">Invoice overdue</p>
              <p className="text-xs text-red-700">Due {formatDate(invoice.due_date)}</p>
            </div>
          </div>
        )}
        {isVoid && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <FileText size={20} className="text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Invoice voided</p>
              <p className="text-xs text-gray-600">This invoice has been canceled</p>
            </div>
          </div>
        )}

        {/* Invoice card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Invoice</p>
                <p className="text-lg font-bold text-gray-900 font-mono mt-1">{invoice.id}</p>
              </div>
              <StatusPill status={invoice.status} />
            </div>
            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">From</p>
                <p className="text-sm font-semibold text-gray-900">Acme Corp</p>
                <p className="text-xs text-gray-500">billing@acme.com</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Billed to</p>
                <p className="text-sm font-semibold text-gray-900">{customer?.label || 'Customer'}</p>
                <p className="text-xs text-gray-500">{invoice.customer_email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Issued</p>
                <p className="text-sm text-gray-900">{formatDate(invoice.created_at)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Due date</p>
                <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                  {formatDate(invoice.due_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-3 font-medium">Description</th>
                  <th className="text-right pb-3 font-medium">Qty</th>
                  <th className="text-right pb-3 font-medium">Unit</th>
                  <th className="text-right pb-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-gray-900">{item.description}</td>
                    <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">{formatUSDC(item.unit_price)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatUSDC(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-baseline">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatUSDC(invoice.amount)}</div>
                <div className="text-xs text-gray-500 mt-0.5">USDC</div>
              </div>
            </div>
          </div>

          {/* Memo */}
          {invoice.memo && (
            <div className="px-8 py-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Memo</p>
              <p className="text-sm text-gray-700">{invoice.memo}</p>
            </div>
          )}
        </div>

        {/* Pay section */}
        {!isPaid && !isVoid && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Pay with USDC</h2>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Choose network</p>
              <div className="flex flex-wrap gap-2">
                {chains.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedChain(c)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedChain === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ChainBadge chain={c} />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full mt-5 h-12 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paying ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  Opening checkout...
                </>
              ) : (
                <>
                  Pay {formatUSDC(invoice.amount)}
                  <ExternalLink size={14} />
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center mt-3">
              You'll be redirected to a secure checkout to complete payment with your wallet.
            </p>
          </div>
        )}

        {isPaid && receiptHref && (
          <div className="mt-6 text-center">
            <Link href={receiptHref} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View receipt →
            </Link>
          </div>
        )}

        <p className="text-center mt-6">
          <Link href="/security" className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-500 transition-colors">
            <ShieldCheck size={11} /> Secured by <span className="font-medium">Chain Payments</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
