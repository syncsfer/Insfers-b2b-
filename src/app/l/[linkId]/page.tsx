'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { Zap, Clock, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { ChainBadge } from '@/components/ui/chain-badge';
import { useToast } from '@/components/ui/toast';
import { getCoin, formatAmount } from '@/lib/currencies';
import { mockPaymentLinks } from '@/lib/mock-data';
import { useCollection } from '@/lib/use-collection';
import type { Chain, PaymentLink } from '@/types';

export default function PublicPaymentLinkPage({ params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = use(params);
  const { toast } = useToast();

  // Same store the dashboard writes to, so a link the merchant just created
  // actually resolves here.
  const { items: links } = useCollection<PaymentLink>('payment-links', mockPaymentLinks);
  const link = links.find(l => l.id === linkId) ?? null;

  const [selectedChain, setSelectedChain] = useState<Chain>('base');
  const [customAmount, setCustomAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const coin = getCoin(link?.currency);
  // The payer's typed amount is in whole units; storage is minor units, and the
  // divisor differs per coin (yen has no subunit).
  const effectiveAmount = link?.amount ?? (customAmount ? Math.round(parseFloat(customAmount) * coin.minorUnits) : 0);
  const isInactive = !!link && !link.active;
  // Falls back to the link's first network until the payer picks one, which
  // also keeps the selection valid if the merchant changes the coin.
  const activeChain = link && link.chains.includes(selectedChain)
    ? selectedChain
    : link?.chains[0] ?? 'base';

  function handlePay() {
    if (!link) return;
    if (!effectiveAmount || effectiveAmount <= 0) {
      toast('Please enter an amount');
      return;
    }
    setPaying(true);
    setTimeout(() => {
      window.location.href = `/checkout/sess_${link.id}_${effectiveAmount}`;
    }, 600);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-6 h-14 flex items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Chain Payments</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pt-10 pb-10">
        <div className="w-full max-w-md">
          {!link || isInactive ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={20} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Link unavailable</h2>
              <p className="text-sm text-gray-500 mt-2">
                {link
                  ? 'This payment link has been disabled by the merchant.'
                  : 'We couldn’t find a payment link at this address. Check the URL with whoever sent it.'}
              </p>
            </div>
          ) : (
            <>
              {/* Merchant header */}
              <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3 text-blue-700 font-bold text-lg">
                  AC
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Acme Corp</p>
                <h1 className="text-xl font-bold text-gray-900 mt-1">{link.name}</h1>
              </div>

              {/* Amount */}
              <div className="bg-white border border-gray-200 border-t-0 p-6">
                {link.amount !== null ? (
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-gray-900">
                      {formatAmount(link.amount, coin.symbol)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{coin.symbol} · {coin.name}</div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Amount in {coin.symbol}
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-semibold">{coin.sign}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        placeholder={coin.precision === 0 ? '0' : '0.00'}
                        className="w-full pl-8 pr-16 py-3 text-2xl font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">{coin.symbol}</span>
                    </div>
                  </div>
                )}

                {/* Network selector */}
                <div className="mb-5">
                  <p className="text-xs font-medium text-gray-500 mb-2">Choose network</p>
                  <div className="flex flex-wrap gap-2">
                    {link.chains.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedChain(c)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          activeChain === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <ChainBadge chain={c} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pay button */}
                <button
                  onClick={handlePay}
                  disabled={paying || (link.amount === null && !customAmount)}
                  className="w-full h-12 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paying ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Opening checkout...
                    </>
                  ) : (
                    <>
                      {effectiveAmount > 0 ? `Pay ${formatAmount(effectiveAmount, coin.symbol)}` : 'Continue'}
                      <ExternalLink size={14} />
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                  <ShieldCheck size={11} />
                  Secured by on-chain {coin.symbol} payments
                </div>
              </div>
            </>
          )}

          <p className="text-center mt-5">
            <Link href="/security" className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-500 transition-colors">
              <ShieldCheck size={11} /> Secured by <span className="font-medium">Chain Payments</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
