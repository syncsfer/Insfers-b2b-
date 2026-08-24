import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils';
import type { Chain } from '@/types';

type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

const VALID_STATUSES: PayoutStatus[] = ['pending', 'processing', 'completed', 'failed'];
const VALID_CHAINS: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];

interface Payout {
  id: string;
  recipient_address: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: PayoutStatus;
  chain: Chain;
  tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
}

const recipientAddresses = [
  '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
  '0x9876543210fedcba9876543210fedcba98765432',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  '0xdeadbeef12345678deadbeef12345678deadbeef',
  '0xcafe1234babe5678cafe1234babe5678cafe1234',
  '0xfeed9876face5432feed9876face5432feed9876',
  '0xaaaa111122223333aaaa111122223333aaaa1111',
  '0xbbbb444455556666bbbb444455556666bbbb4444',
];

const chains: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

const mockPayouts: Payout[] = Array.from({ length: 14 }, (_, i) => {
  const statuses: PayoutStatus[] = ['completed', 'completed', 'completed', 'processing', 'pending', 'failed'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const amount = Math.floor(Math.random() * 200000) + 1000;
  const fee = Math.floor(amount * 0.001);
  const created = randomDate(30);
  const chain = chains[Math.floor(Math.random() * chains.length)];

  return {
    id: `po_${String(i + 1).padStart(3, '0')}${Math.random().toString(36).slice(2, 8)}`,
    recipient_address: recipientAddresses[Math.floor(Math.random() * recipientAddresses.length)],
    amount,
    fee,
    net_amount: amount - fee,
    status,
    chain,
    tx_hash: ['completed', 'processing'].includes(status)
      ? `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`
      : null,
    created_at: created,
    completed_at: status === 'completed' ? randomDate(7) : null,
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = [...mockPayouts];

  // Filter by status
  if (status) {
    if (!VALID_STATUSES.includes(status as PayoutStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    filtered = filtered.filter((p) => p.status === status);
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

  const { recipient_address, amount, chain } = body as {
    recipient_address?: string;
    amount?: number;
    chain?: string;
  };

  // Validate required fields
  if (!recipient_address) {
    return NextResponse.json(
      { error: 'recipient_address is required' },
      { status: 400 }
    );
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(recipient_address as string)) {
    return NextResponse.json(
      { error: 'recipient_address must be a valid Ethereum address (0x followed by 40 hex characters)' },
      { status: 400 }
    );
  }

  if (amount === undefined || amount === null) {
    return NextResponse.json({ error: 'amount is required' }, { status: 400 });
  }
  if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
    return NextResponse.json(
      { error: 'amount must be a positive number' },
      { status: 400 }
    );
  }

  // Optional, but validated when supplied — an unrecognised network would
  // otherwise be stored verbatim and the payout could never settle.
  if (chain !== undefined && chain !== null && !VALID_CHAINS.includes(chain as Chain)) {
    return NextResponse.json(
      { error: `Invalid chain. Must be one of: ${VALID_CHAINS.join(', ')}` },
      { status: 400 }
    );
  }

  const selectedChain = (chain as Chain) || 'base';
  const fee = Math.floor(amount * 0.001);
  const id = generateId('po');
  const now = new Date().toISOString();

  const payout: Payout = {
    id,
    recipient_address,
    amount,
    fee,
    net_amount: amount - fee,
    status: 'pending',
    chain: selectedChain,
    tx_hash: null,
    created_at: now,
    completed_at: null,
  };

  return NextResponse.json(payout, { status: 201 });
}
