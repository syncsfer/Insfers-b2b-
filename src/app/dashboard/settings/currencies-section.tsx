'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, AlertTriangle, Info, Star, Coins } from 'lucide-react';
import { CoinMark } from '@/components/ui/coin-badge';
import { ChainBadge } from '@/components/ui/chain-badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { STABLECOIN_LIST, STABLECOINS } from '@/lib/currencies';
import { useCurrencySettings, networksFor } from '@/lib/currency-settings';
import { useCollection } from '@/lib/use-collection';
import { mockPaymentLinks, mockInvoices, mockCatalogItems } from '@/lib/mock-data';
import type { Chain, Currency, PaymentLink, Invoice, CatalogItem } from '@/types';

/** What a merchant would break by turning a currency off. */
interface Usage {
  links: number;
  invoices: number;
  items: number;
}

export function CurrenciesSection() {
  const { toast } = useToast();
  const { settings, patch, toggleCurrency } = useCurrencySettings();
  const { items: links } = useCollection<PaymentLink>('payment-links', mockPaymentLinks);
  const { items: invoices } = useCollection<Invoice>('invoices', mockInvoices);
  const { items: catalogItems } = useCollection<CatalogItem>('catalog-items', mockCatalogItems);

  const [confirmOff, setConfirmOff] = useState<Currency | null>(null);

  /** Live things that would stop being creatable, per currency. */
  const usage = useMemo(() => {
    const map = {} as Record<Currency, Usage>;
    for (const coin of STABLECOIN_LIST) {
      map[coin.symbol] = {
        links: links.filter(l => l.currency === coin.symbol && l.active).length,
        invoices: invoices.filter(i => i.currency === coin.symbol && (i.status === 'sent' || i.status === 'overdue')).length,
        items: catalogItems.filter(i => i.currency === coin.symbol && i.active).length,
      };
    }
    return map;
  }, [links, invoices, catalogItems]);

  const availableNetworks = networksFor(settings.enabled);
  const isLastEnabled = settings.enabled.length === 1;

  const requestToggle = (c: Currency) => {
    const turningOff = settings.enabled.includes(c);
    if (!turningOff) {
      toggleCurrency(c);
      toast(`Now accepting ${c}`);
      return;
    }
    if (isLastEnabled) {
      toast('You must accept at least one currency');
      return;
    }
    const u = usage[c];
    // Only interrupt when there is something live to lose.
    if (u.links + u.invoices + u.items > 0) {
      setConfirmOff(c);
      return;
    }
    toggleCurrency(c);
    toast(`No longer accepting ${c}`);
  };

  const confirmDisable = () => {
    if (!confirmOff) return;
    toggleCurrency(confirmOff);
    toast(`No longer accepting ${confirmOff}`);
    setConfirmOff(null);
  };

  const toggleNetwork = (n: Chain) => {
    const next = settings.networks.includes(n)
      ? settings.networks.filter(x => x !== n)
      : [...settings.networks, n];
    if (next.length === 0) {
      toast('At least one network must stay on');
      return;
    }
    // A currency whose every network is off can never be paid — block that
    // rather than leaving a currency enabled but unpayable.
    const stranded = settings.enabled.filter(
      c => !STABLECOINS[c].networks.some(x => next.includes(x)));
    if (stranded.length > 0) {
      toast(`${stranded.join(', ')} would have no network left`);
      return;
    }
    patch({ networks: next });
  };

  const confirmUsage = confirmOff ? usage[confirmOff] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Accepted currencies</h2>
        <p className="text-sm text-gray-500">
          Choose which stablecoins customers can pay you in. Turning one off removes it from new
          payment links, invoices, and catalog prices.
        </p>
      </div>

      <div className="flex gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-3.5">
        <Info size={15} className="shrink-0 mt-0.5 text-blue-600" />
        <p className="text-[13px] leading-relaxed text-gray-700">
          This only affects what you can <strong>accept</strong>. Anything already priced in a
          currency keeps its currency, and you can always send, bridge, and withdraw a balance you
          already hold — even in a currency you have turned off.
        </p>
      </div>

      {/* Currencies */}
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
        {STABLECOIN_LIST.map(coin => {
          const on = settings.enabled.includes(coin.symbol);
          const isDefault = settings.defaultCurrency === coin.symbol;
          const u = usage[coin.symbol];
          return (
            <div key={coin.symbol} className="flex items-start gap-3 p-4">
              <CoinMark currency={coin.symbol} size="lg" className="mt-0.5" />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{coin.symbol}</span>
                  <span className="text-[13px] text-gray-500">{coin.name}</span>
                  {isDefault && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-px rounded border border-blue-200 bg-blue-50 text-[10px] font-semibold text-blue-700">
                      <Star size={9} /> Default
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-gray-500">{coin.blurb}</p>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {coin.networks.map(n => <ChainBadge key={n} chain={n} />)}
                </div>
                {on && (u.links > 0 || u.invoices > 0 || u.items > 0) && (
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    In use by {[
                      u.links && `${u.links} active link${u.links === 1 ? '' : 's'}`,
                      u.invoices && `${u.invoices} open invoice${u.invoices === 1 ? '' : 's'}`,
                      u.items && `${u.items} catalog item${u.items === 1 ? '' : 's'}`,
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  role="switch"
                  aria-checked={on}
                  aria-label={`Accept ${coin.symbol}`}
                  onClick={() => requestToggle(coin.symbol)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    on ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      on ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                {on && !isDefault && (
                  <button
                    onClick={() => { patch({ defaultCurrency: coin.symbol }); toast(`${coin.symbol} is now the default`); }}
                    className="text-[11px] font-medium text-gray-400 hover:text-blue-600"
                  >
                    Make default
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Networks */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Networks at checkout</h3>
        <p className="text-[13px] text-gray-500 mb-3">
          Which of your currencies&rsquo; networks customers may pay on. Fewer networks means fewer
          balances to reconcile; more means cheaper options for the customer.
        </p>
        <div className="flex flex-wrap gap-2">
          {availableNetworks.map(n => {
            const on = settings.networks.includes(n);
            const coins = STABLECOIN_LIST.filter(
              c => settings.enabled.includes(c.symbol) && c.networks.includes(n));
            return (
              <button
                key={n}
                onClick={() => toggleNetwork(n)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  on ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center border ${
                  on ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {on && <Check size={11} className="text-white" />}
                </span>
                <ChainBadge chain={n} />
                <span className="text-[11px] text-gray-400">{coins.map(c => c.symbol).join(', ')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Coins size={15} className="text-gray-400" />
          <p className="text-[13px] font-semibold text-gray-900">What customers will see</p>
        </div>
        <p className="text-[13px] leading-relaxed text-gray-600">
          Checkout will offer{' '}
          <strong>{settings.enabled.join(', ')}</strong>{' '}
          on <strong>{settings.networks.join(', ')}</strong>, defaulting to{' '}
          <strong>{settings.defaultCurrency}</strong>.
        </p>
        <p className="mt-2 text-[12px] text-gray-400">
          See how each currency behaves in the{' '}
          <Link href="/developers/multi-currency" className="text-blue-600 hover:underline">
            multi-currency guide
          </Link>.
        </p>
      </div>

      {/* Disable confirmation */}
      <Modal
        open={!!confirmOff}
        onClose={() => setConfirmOff(null)}
        title={`Stop accepting ${confirmOff ?? ''}?`}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmOff(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Keep accepting it
            </button>
            <button
              onClick={confirmDisable}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Stop accepting {confirmOff}
            </button>
          </div>
        }
      >
        {confirmOff && confirmUsage && (
          <div className="space-y-3">
            <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <p className="text-[13px] leading-relaxed text-gray-700">
                You have live {confirmOff} activity. Turning it off does not cancel any of it, but
                customers will no longer be able to pay with it.
              </p>
            </div>
            <ul className="space-y-1.5">
              {confirmUsage.links > 0 && (
                <li className="text-[13px] text-gray-600">
                  <strong>{confirmUsage.links}</strong> active payment link
                  {confirmUsage.links === 1 ? '' : 's'} will stop taking payment.
                </li>
              )}
              {confirmUsage.invoices > 0 && (
                <li className="text-[13px] text-gray-600">
                  <strong>{confirmUsage.invoices}</strong> unpaid invoice
                  {confirmUsage.invoices === 1 ? '' : 's'} cannot be settled until you accept{' '}
                  {confirmOff} again.
                </li>
              )}
              {confirmUsage.items > 0 && (
                <li className="text-[13px] text-gray-600">
                  <strong>{confirmUsage.items}</strong> catalog item
                  {confirmUsage.items === 1 ? '' : 's'} priced in {confirmOff} can no longer be added
                  to invoices.
                </li>
              )}
            </ul>
            <p className="text-[12.5px] text-gray-500">
              Any {confirmOff} you already hold stays in your wallet and can still be sent or
              withdrawn.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
