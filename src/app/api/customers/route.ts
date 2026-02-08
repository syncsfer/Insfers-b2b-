import { NextRequest, NextResponse } from 'next/server';
import { mockCustomers } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const search = searchParams.get('search');
  const isBlocked = searchParams.get('is_blocked');
  const riskLevel = searchParams.get('risk_level');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = [...mockCustomers];

  // Search by wallet address, email, label, or ID
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.wallet_address.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.label?.toLowerCase().includes(q)
    );
  }

  // Filter by blocked status
  if (isBlocked !== null && isBlocked !== undefined && isBlocked !== '') {
    const blocked = isBlocked === 'true';
    filtered = filtered.filter((c) => c.is_blocked === blocked);
  }

  // Filter by risk level
  if (riskLevel) {
    const validRiskLevels = ['low', 'medium', 'high'];
    if (!validRiskLevels.includes(riskLevel)) {
      return NextResponse.json(
        { error: `Invalid risk_level. Must be one of: ${validRiskLevels.join(', ')}` },
        { status: 400 }
      );
    }
    filtered = filtered.filter((c) => c.risk_level === riskLevel);
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

  const { wallet_address, email, label } = body as {
    wallet_address?: string;
    email?: string;
    label?: string;
  };

  // Validate required fields
  if (!wallet_address) {
    return NextResponse.json(
      { error: 'wallet_address is required' },
      { status: 400 }
    );
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address as string)) {
    return NextResponse.json(
      { error: 'wallet_address must be a valid Ethereum address (0x followed by 40 hex characters)' },
      { status: 400 }
    );
  }

  // Validate email format if provided
  if (email !== undefined && email !== null) {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'email must be a valid email address' },
        { status: 400 }
      );
    }
  }

  // Check if customer already exists by wallet address
  const existing = mockCustomers.find(
    (c) => c.wallet_address.toLowerCase() === (wallet_address as string).toLowerCase()
  );

  if (existing) {
    // Update existing customer
    const updated = {
      ...existing,
      ...(email !== undefined && { email }),
      ...(label !== undefined && { label }),
    };
    return NextResponse.json(updated);
  }

  // Create new customer
  const id = generateId('cus');
  const now = new Date().toISOString();

  const customer = {
    id,
    wallet_address: wallet_address as string,
    email: (email as string) || null,
    label: (label as string) || null,
    lifetime_value: 0,
    payment_count: 0,
    first_payment_at: now,
    last_payment_at: now,
    is_blocked: false,
    risk_level: 'low' as const,
    created_at: now,
  };

  return NextResponse.json(customer, { status: 201 });
}
