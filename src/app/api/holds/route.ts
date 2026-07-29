import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils';
import type { Currency, Hold, HoldStatus } from '@/types';

const VALID_STATUSES: HoldStatus[] = ['active', 'captured', 'released', 'expired'];

const addresses = [
  '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
  '0x9876543210fedcba9876543210fedcba98765432',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  '0xdeadbeef12345678deadbeef12345678deadbeef',
  '0xcafe1234babe5678cafe1234babe5678cafe1234',
  '0xfeed9876face5432feed9876face5432feed9876',
];

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

const mockHolds: Hold[] = Array.from({ length: 12 }, (_, i) => {
  const statuses: HoldStatus[] = ['active', 'active', 'captured', 'released', 'expired'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const amount = Math.floor(Math.random() * 50000) + 500;
  const currency: Currency = 'USDC';
  const created = randomDate(14);
  const expiresAt = new Date(new Date(created).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `hold_${String(i + 1).padStart(3, '0')}${Math.random().toString(36).slice(2, 8)}`,
    amount,
    currency,
    captured_amount: status === 'captured' ? amount : 0,
    released_amount: status === 'released' ? amount : 0,
    status,
    customer_id: `cus_${String((i % 10) + 1).padStart(3, '0')}`,
    from_address: addresses[Math.floor(Math.random() * addresses.length)],
    expires_at: expiresAt,
    created_at: created,
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = [...mockHolds];

  // Filter by status
  if (status) {
    if (!VALID_STATUSES.includes(status as HoldStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    filtered = filtered.filter((h) => h.status === status);
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

  const { payment_id, amount, duration } = body as {
    payment_id?: string;
    amount?: number;
    duration?: number;
  };

  // Validate required fields
  if (!payment_id) {
    return NextResponse.json(
      { error: 'payment_id is required' },
      { status: 400 }
    );
  }
  if (typeof payment_id !== 'string' || payment_id.trim().length === 0) {
    return NextResponse.json(
      { error: 'payment_id must be a non-empty string' },
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

  if (duration === undefined || duration === null) {
    return NextResponse.json({ error: 'duration is required' }, { status: 400 });
  }
  if (typeof duration !== 'number' || duration <= 0 || !Number.isFinite(duration)) {
    return NextResponse.json(
      { error: 'duration must be a positive number (seconds)' },
      { status: 400 }
    );
  }

  const id = generateId('hold');
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + duration * 1000).toISOString();

  const hold: Hold = {
    id,
    amount,
    currency: 'USDC',
    captured_amount: 0,
    released_amount: 0,
    status: 'active',
    customer_id: '',
    from_address: '',
    expires_at: expiresAt,
    created_at: now,
  };

  return NextResponse.json(hold, { status: 201 });
}
