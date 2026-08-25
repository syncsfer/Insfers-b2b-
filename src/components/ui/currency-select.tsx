'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CoinMark } from '@/components/ui/coin-badge';
import { STABLECOIN_LIST, getCoin, type StablecoinSymbol } from '@/lib/currencies';
import { useCurrencySettings } from '@/lib/currency-settings';
import type { Currency } from '@/types';

/**
 * Picks the currency a thing is denominated in.
 *
 * Currency is a decision the merchant makes up front, not something inferred
 * from whatever they happen to add first — an invoice or a link settles in one
 * coin, and that coin also decides which networks are available.
 *
 * Only currencies the merchant accepts are offered. That filtering lives here
 * rather than at each call site so a new form cannot accidentally offer a
 * currency the merchant switched off in settings.
 */
export function CurrencySelect({
  value,
  onChange,
  /** Disable coins that can't be used here, with a reason shown on hover. */
  isDisabled,
  /** Show every currency regardless of settings. For settings UI itself. */
  showAll = false,
  className,
}: {
  value: Currency;
  onChange: (next: Currency) => void;
  isDisabled?: (symbol: StablecoinSymbol) => string | null;
  showAll?: boolean;
  className?: string;
}) {
  const { settings } = useCurrencySettings();
  const options = showAll
    ? STABLECOIN_LIST
    : STABLECOIN_LIST.filter(c => settings.enabled.includes(c.symbol));
  const hidden = STABLECOIN_LIST.length - options.length;

  return (
    <>
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {options.map((coin) => {
        const reason = isDisabled?.(coin.symbol) ?? null;
        const selected = value === coin.symbol;
        return (
          <button
            key={coin.symbol}
            type="button"
            disabled={!!reason}
            title={reason ?? `${coin.name} · ${coin.fiat}`}
            onClick={() => onChange(coin.symbol)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
              selected
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                : 'border-gray-200 hover:bg-gray-50',
              reason && 'opacity-40 cursor-not-allowed hover:bg-transparent',
            )}
          >
            <CoinMark currency={coin.symbol} size="lg" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">{coin.symbol}</div>
              <div className="text-[11px] text-gray-500 truncate">{coin.name}</div>
            </div>
          </button>
        );
      })}
    </div>
    {hidden > 0 && (
      <p className="mt-1.5 text-[11px] text-gray-400">
        {hidden} more {hidden === 1 ? 'currency is' : 'currencies are'} available.{' '}
        <Link href="/dashboard/settings?tab=currencies" className="text-blue-600 hover:underline">
          Change what you accept
        </Link>
      </p>
    )}
    </>
  );
}

/**
 * One line explaining what the selected coin is and where it settles, so the
 * choice isn't just four tickers with no context.
 */
export function CurrencyHint({ currency }: { currency: Currency }) {
  const coin = getCoin(currency);
  return (
    <p className="mt-1.5 text-[11px] text-gray-500">
      {coin.blurb} Settles on{' '}
      {coin.networks.map(n => n[0].toUpperCase() + n.slice(1)).join(', ')}.
    </p>
  );
}
