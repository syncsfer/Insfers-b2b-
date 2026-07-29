import type { Chain } from '@/types';

/**
 * Stablecoins the platform can accept, send, and settle.
 *
 * Every visual treatment for money in the product derives from this registry —
 * colour, monogram, symbol placement, and decimal precision. Adding a coin here
 * is enough to make it render correctly everywhere.
 */
export type StablecoinSymbol = 'USDC' | 'EURC' | 'JPYC' | 'HTGC';

export interface Stablecoin {
  symbol: StablecoinSymbol;
  /** Product-facing name, e.g. "Digital Euro". */
  name: string;
  /** The fiat currency it tracks. */
  fiat: string;
  /** ISO 4217 code of the tracked fiat. */
  fiatCode: string;
  /** Currency sign used in formatted amounts. */
  sign: string;
  /**
   * How many minor units make one whole unit. 100 for cent-based currencies,
   * 1 for yen — which has no subunit in practice.
   */
  minorUnits: 1 | 100;
  /** Decimal places to show. Yen is conventionally written without them. */
  precision: 0 | 2;
  /** Raw accent colour, for charts and inline styles. */
  accent: string;
  /** Tailwind classes for the coin chip. */
  chip: { bg: string; text: string; border: string };
  /** Tailwind classes for a solid, high-contrast token. */
  solid: string;
  /** Networks this coin settles on. */
  networks: Chain[];
  issuer: string;
  /** One line a non-crypto user can understand. */
  blurb: string;
}

export const STABLECOINS: Record<StablecoinSymbol, Stablecoin> = {
  USDC: {
    symbol: 'USDC',
    name: 'Digital Dollar',
    fiat: 'US Dollar',
    fiatCode: 'USD',
    sign: '$',
    minorUnits: 100,
    precision: 2,
    accent: '#2775CA',
    chip: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    solid: 'bg-[#2775CA] text-white',
    networks: ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'],
    issuer: 'Circle',
    blurb: 'Backed 1:1 by US dollars held in regulated financial institutions.',
  },
  EURC: {
    symbol: 'EURC',
    name: 'Digital Euro',
    fiat: 'Euro',
    fiatCode: 'EUR',
    sign: '€',
    minorUnits: 100,
    precision: 2,
    accent: '#4F46E5',
    chip: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    solid: 'bg-[#4F46E5] text-white',
    networks: ['base', 'ethereum'],
    issuer: 'Circle',
    blurb: 'Backed 1:1 by euros, issued under the EU’s MiCA framework.',
  },
  JPYC: {
    symbol: 'JPYC',
    name: 'Digital Yen',
    fiat: 'Japanese Yen',
    fiatCode: 'JPY',
    sign: '¥',
    minorUnits: 1,
    precision: 0,
    accent: '#E11D48',
    chip: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    solid: 'bg-[#E11D48] text-white',
    networks: ['ethereum', 'polygon'],
    issuer: 'JPYC Inc.',
    blurb: 'Backed 1:1 by Japanese yen. Written without decimals, as yen normally is.',
  },
  HTGC: {
    symbol: 'HTGC',
    name: 'Digital Gourde',
    fiat: 'Haitian Gourde',
    fiatCode: 'HTG',
    sign: 'G',
    minorUnits: 100,
    precision: 2,
    accent: '#0D9488',
    chip: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    solid: 'bg-[#0D9488] text-white',
    networks: ['base', 'polygon'],
    issuer: 'Chain Payments',
    blurb: 'Backed 1:1 by Haitian gourdes, built for remittances and local commerce.',
  },
};

export const STABLECOIN_LIST: Stablecoin[] = Object.values(STABLECOINS);

export const DEFAULT_CURRENCY: StablecoinSymbol = 'USDC';

export function getCoin(symbol: StablecoinSymbol | string | null | undefined): Stablecoin {
  if (symbol && symbol in STABLECOINS) {
    return STABLECOINS[symbol as StablecoinSymbol];
  }
  return STABLECOINS[DEFAULT_CURRENCY];
}

/** Coins that can settle on a given chain. */
export function coinsOnChain(chain: Chain): Stablecoin[] {
  return STABLECOIN_LIST.filter((c) => c.networks.includes(chain));
}

/**
 * Formats an integer amount in minor units as a display string.
 *
 * Amounts are stored in each currency's smallest unit — cents for USDC/EURC/HTGC,
 * whole yen for JPYC — so the conversion is per-currency, not a fixed /100.
 */
export function formatAmount(
  minor: number,
  symbol: StablecoinSymbol | string = DEFAULT_CURRENCY,
  opts: { withCode?: boolean; withSign?: boolean } = {},
): string {
  const coin = getCoin(symbol);
  const { withCode = false, withSign = true } = opts;

  const value = minor / coin.minorUnits;
  const body = value.toLocaleString('en-US', {
    minimumFractionDigits: coin.precision,
    maximumFractionDigits: coin.precision,
  });

  const prefix = withSign ? coin.sign : '';
  return withCode ? `${prefix}${body} ${coin.symbol}` : `${prefix}${body}`;
}

/**
 * Indicative reference rates against USD, used only to show an approximate
 * combined total. Real balances are never converted — each coin settles as
 * itself.
 */
const USD_REFERENCE: Record<StablecoinSymbol, number> = {
  USDC: 1,
  EURC: 1.08,
  JPYC: 0.0064,
  HTGC: 0.0076,
};

/** Approximate USD-equivalent, in cents, for cross-currency totals. */
export function toUsdCents(minor: number, symbol: StablecoinSymbol | string): number {
  const coin = getCoin(symbol);
  const whole = minor / coin.minorUnits;
  return Math.round(whole * USD_REFERENCE[coin.symbol] * 100);
}
