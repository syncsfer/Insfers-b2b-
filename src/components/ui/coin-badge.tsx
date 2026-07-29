'use client';

import { cn } from '@/lib/utils';
import { getCoin, formatAmount, type StablecoinSymbol } from '@/lib/currencies';

type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, { chip: string; dot: string; dotText: string; gap: string }> = {
  sm: { chip: 'h-5 px-1.5 text-[10px]', dot: 'w-3.5 h-3.5', dotText: 'text-[7px]', gap: 'gap-1' },
  md: { chip: 'h-6 px-2 text-[11px]', dot: 'w-4 h-4', dotText: 'text-[8px]', gap: 'gap-1.5' },
  lg: { chip: 'h-7 px-2.5 text-xs', dot: 'w-5 h-5', dotText: 'text-[9px]', gap: 'gap-2' },
};

/**
 * The coin's monogram — first letter of the fiat sign region, drawn in the
 * coin's accent colour. Gives each currency a consistent, glanceable mark.
 */
export function CoinMark({
  currency,
  size = 'md',
  className,
}: {
  currency: StablecoinSymbol | string;
  size?: Size;
  className?: string;
}) {
  const coin = getCoin(currency);
  const s = sizes[size];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none',
        coin.solid,
        s.dot,
        s.dotText,
        className,
      )}
      aria-hidden
    >
      {coin.sign}
    </span>
  );
}

/**
 * Currency chip: mark + ticker. The default way to label which stablecoin
 * something is denominated in.
 */
export function CoinBadge({
  currency,
  size = 'md',
  showName = false,
  className,
}: {
  currency: StablecoinSymbol | string;
  size?: Size;
  /** Append the plain-language name, e.g. "EURC · Digital Euro". */
  showName?: boolean;
  className?: string;
}) {
  const coin = getCoin(currency);
  const s = sizes[size];

  return (
    <span
      title={`${coin.symbol} — ${coin.name} (${coin.fiat})`}
      className={cn(
        'inline-flex items-center rounded-full border font-semibold whitespace-nowrap',
        coin.chip.bg,
        coin.chip.text,
        coin.chip.border,
        s.chip,
        s.gap,
        className,
      )}
    >
      <CoinMark currency={currency} size={size} />
      {coin.symbol}
      {showName && <span className="font-normal opacity-70">· {coin.name}</span>}
    </span>
  );
}

/**
 * A formatted money value with its currency made explicit.
 *
 * Amounts across four currencies are easy to misread, so the ticker is shown
 * alongside the number by default rather than relying on the sign alone.
 */
export function Money({
  minor,
  currency,
  size = 'md',
  showTicker = true,
  className,
}: {
  minor: number;
  currency: StablecoinSymbol | string;
  size?: Size;
  showTicker?: boolean;
  className?: string;
}) {
  const coin = getCoin(currency);
  const tickerSize = size === 'lg' ? 'text-xs' : size === 'md' ? 'text-[11px]' : 'text-[10px]';

  return (
    <span className={cn('inline-flex items-baseline gap-1 whitespace-nowrap', className)}>
      <span className="tabular-nums">{formatAmount(minor, coin.symbol)}</span>
      {showTicker && (
        <span className={cn('font-medium', tickerSize)} style={{ color: coin.accent }}>
          {coin.symbol}
        </span>
      )}
    </span>
  );
}
