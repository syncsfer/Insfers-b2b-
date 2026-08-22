'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Copy, ExternalLink, Eye, CheckCircle2 } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { ChainBadge } from '@/components/ui/chain-badge';
import { CoinBadge, Money } from '@/components/ui/coin-badge';
import { CurrencySelect, CurrencyHint } from '@/components/ui/currency-select';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { mockPaymentLinks } from '@/lib/mock-data';
import { useCollection, newId } from '@/lib/use-collection';
import { STABLECOINS, getCoin } from '@/lib/currencies';
import type { PaymentLink, Chain, Currency } from '@/types';

export default function PaymentLinksPage() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USDC');
  const [selectedChains, setSelectedChains] = useState<Chain[]>(['base']);
  const [createdLink, setCreatedLink] = useState<{ id: string; url: string } | null>(null);

  const { items: links, add: addLink } = useCollection<PaymentLink>('payment-links', mockPaymentLinks);

  const coin = getCoin(currency);

  /**
   * A coin only exists on some networks, so switching currency has to prune any
   * chain that no longer applies — and fall back to the coin's primary network
   * rather than leaving the link with nowhere to settle.
   */
  const changeCurrency = (next: Currency) => {
    setCurrency(next);
    setSelectedChains(prev => {
      const kept = prev.filter(c => STABLECOINS[next].networks.includes(c));
      return kept.length > 0 ? kept : [STABLECOINS[next].networks[0]];
    });
  };

  const handleCreate = () => {
    const id = newId('pl');
    const url = `/l/${id}`;
    // Amounts are stored in the currency's minor units — cents for USDC, whole
    // yen for JPYC — so the multiplier comes from the coin, not a fixed 100.
    const parsed = amount.trim() === '' ? null : Math.round(parseFloat(amount) * coin.minorUnits);

    addLink({
      id,
      name,
      amount: parsed !== null && Number.isFinite(parsed) ? parsed : null,
      currency,
      url,
      active: true,
      chains: selectedChains,
      payment_count: 0,
      total_collected: 0,
      created_at: new Date().toISOString(),
    });

    setCreatedLink({
      id,
      url: `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`,
    });
    toast('Payment link created');
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreatedLink(null);
    setName('');
    setAmount('');
    setCurrency('USDC');
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
      key: 'amount', header: 'Amount', width: '110px', align: 'right',
      render: (l) => l.amount !== null ? (
        <span className="font-semibold text-gray-900">
          <Money minor={l.amount} currency={l.currency} showTicker={false} />
        </span>
      ) : (
        <span className="text-gray-400 text-sm">Customer chooses</span>
      ),
    },
    {
      key: 'currency', header: 'Currency', width: '90px',
      render: (l) => <CoinBadge currency={l.currency} size="sm" />,
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
      key: 'collected', header: 'Collected', width: '110px', align: 'right',
      render: (l) => (
        <span className="font-semibold text-gray-900">
          <Money minor={l.total_collected} currency={l.currency} showTicker={false} />
        </span>
      ),
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
          data={links}
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
                disabled={!name || selectedChains.length === 0}
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
              <label className="text-sm font-medium text-gray-700">Currency</label>
              <CurrencySelect value={currency} onChange={changeCurrency} className="mt-1.5" />
              <CurrencyHint currency={currency} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Amount in {coin.symbol} — leave blank to let the customer choose
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                  {coin.sign}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  step={coin.precision === 0 ? '1' : '0.01'}
                  min="0"
                  placeholder={coin.precision === 0 ? '0' : '0.00'}
                  className="w-full pl-7 pr-16 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                  {coin.symbol}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Accepted Networks</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {coin.networks.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedChains(prev =>
                      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${selectedChains.includes(c) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <ChainBadge chain={c} />
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">
                Only networks {coin.symbol} settles on are shown.
                {selectedChains.length === 0 && ' Pick at least one.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
