import { NextRequest, NextResponse } from 'next/server';
import { mockPaymentLinks } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import { STABLECOINS, DEFAULT_CURRENCY, type StablecoinSymbol } from '@/lib/currencies';
import type { Chain, Currency } from '@/types';

const VALID_CHAINS: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];
const VALID_CURRENCIES = Object.keys(STABLECOINS) as StablecoinSymbol[];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const active = searchParams.get('active');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = [...mockPaymentLinks];

  // Filter by active status
  if (active !== null && active !== undefined && active !== '') {
    const isActive = active === 'true';
    filtered = filtered.filter((pl) => pl.active === isActive);
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    data: paginated,
    total,
    limit,
    offset,
    has_more: offset + limit < total,
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, amount, currency, chains } = body as {
    name?: string;
    amount?: number | null;
    currency?: string;
    chains?: string[];
  };

  // Validate name
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      { error: 'name must be a non-empty string' },
      { status: 400 }
    );
  }

  // Validate amount (optional - null means customer chooses amount)
  if (amount !== undefined && amount !== null) {
    if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
      return NextResponse.json(
        { error: 'amount must be a positive number or null' },
        { status: 400 }
      );
    }
  }

  // Validate currency
  if (currency !== undefined && currency !== null) {
    if (typeof currency !== 'string' || !VALID_CURRENCIES.includes(currency as StablecoinSymbol)) {
      return NextResponse.json(
        { error: `currency must be one of: ${VALID_CURRENCIES.join(', ')}` },
        { status: 400 }
      );
    }
  }

  const resolvedCurrency = ((currency as Currency) || DEFAULT_CURRENCY) as StablecoinSymbol;
  const coin = STABLECOINS[resolvedCurrency];

  // Validate chains
  if (chains !== undefined) {
    if (!Array.isArray(chains) || chains.length === 0) {
      return NextResponse.json(
        { error: 'chains must be a non-empty array' },
        { status: 400 }
      );
    }
    const invalidChains = (chains as string[]).filter((c) => !VALID_CHAINS.includes(c as Chain));
    if (invalidChains.length > 0) {
      return NextResponse.json(
        { error: `Invalid chains: ${invalidChains.join(', ')}. Must be one of: ${VALID_CHAINS.join(', ')}` },
        { status: 400 }
      );
    }
    // A link can only settle where its coin actually exists.
    const unsupported = (chains as Chain[]).filter((c) => !coin.networks.includes(c));
    if (unsupported.length > 0) {
      return NextResponse.json(
        { error: `${resolvedCurrency} does not settle on: ${unsupported.join(', ')}. Supported networks: ${coin.networks.join(', ')}` },
        { status: 400 }
      );
    }
  }

  const id = generateId('pl');
  const now = new Date().toISOString();

  const paymentLink = {
    id,
    name: (name as string).trim(),
    amount: (amount as number | null) ?? null,
    currency: resolvedCurrency,
    url: `https://pay.chainpayments.com/link/${id}`,
    active: true,
    chains: ((chains as Chain[]) || coin.networks.slice(0, 2)) as Chain[],
    payment_count: 0,
    total_collected: 0,
    created_at: now,
  };

  return NextResponse.json(paymentLink, { status: 201 });
}
