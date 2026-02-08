import { NextRequest, NextResponse } from 'next/server';
import { mockPayments } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import type { Chain, PaymentStatus } from '@/types';

const VALID_CHAINS: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];
const VALID_STATUSES: PaymentStatus[] = ['awaiting_payment', 'pending', 'succeeded', 'failed', 'expired'];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const status = searchParams.get('status');
  const chain = searchParams.get('chain');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = [...mockPayments];

  // Filter by status
  if (status) {
    if (!VALID_STATUSES.includes(status as PaymentStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    filtered = filtered.filter((p) => p.status === status);
  }

  // Filter by chain
  if (chain) {
    if (!VALID_CHAINS.includes(chain as Chain)) {
      return NextResponse.json(
        { error: `Invalid chain. Must be one of: ${VALID_CHAINS.join(', ')}` },
        { status: 400 }
      );
    }
    filtered = filtered.filter((p) => p.chain === chain);
  }

  // Filter by date range
  if (fromDate) {
    const from = new Date(fromDate);
    if (isNaN(from.getTime())) {
      return NextResponse.json({ error: 'Invalid from date format' }, { status: 400 });
    }
    filtered = filtered.filter((p) => new Date(p.created_at) >= from);
  }

  if (toDate) {
    const to = new Date(toDate);
    if (isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Invalid to date format' }, { status: 400 });
    }
    filtered = filtered.filter((p) => new Date(p.created_at) <= to);
  }

  // Search by ID, description, customer email, or address
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.customer_email?.toLowerCase().includes(q) ||
        p.from_address.toLowerCase().includes(q) ||
        p.to_address.toLowerCase().includes(q)
    );
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

  const { amount, chain, merchant_address, description, customer_email, metadata } = body as {
    amount?: number;
    chain?: string;
    merchant_address?: string;
    description?: string;
    customer_email?: string;
    metadata?: Record<string, string>;
  };

  // Validate required fields
  if (amount === undefined || amount === null) {
    return NextResponse.json({ error: 'amount is required' }, { status: 400 });
  }
  if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
    return NextResponse.json(
      { error: 'amount must be a positive number' },
      { status: 400 }
    );
  }

  if (!chain) {
    return NextResponse.json({ error: 'chain is required' }, { status: 400 });
  }
  if (!VALID_CHAINS.includes(chain as Chain)) {
    return NextResponse.json(
      { error: `Invalid chain. Must be one of: ${VALID_CHAINS.join(', ')}` },
      { status: 400 }
    );
  }

  if (!merchant_address) {
    return NextResponse.json({ error: 'merchant_address is required' }, { status: 400 });
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(merchant_address as string)) {
    return NextResponse.json(
      { error: 'merchant_address must be a valid Ethereum address (0x followed by 40 hex characters)' },
      { status: 400 }
    );
  }

  if (metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata))) {
    return NextResponse.json({ error: 'metadata must be an object' }, { status: 400 });
  }

  const id = generateId('pi');
  const fee = Math.floor((amount as number) * 0.001);
  const now = new Date().toISOString();

  const paymentIntent = {
    id,
    amount: amount as number,
    status: 'awaiting_payment' as const,
    chain: chain as Chain,
    from_address: '',
    to_address: merchant_address as string,
    tx_hash: null,
    confirmations: 0,
    required_confirmations: 1,
    metadata: (metadata as Record<string, string>) || {},
    customer_id: null,
    customer_email: (customer_email as string) || null,
    fee,
    net_amount: (amount as number) - fee,
    created_at: now,
    confirmed_at: null,
    description: (description as string) || null,
    receipt_url: null,
  };

  return NextResponse.json(paymentIntent, { status: 201 });
}
