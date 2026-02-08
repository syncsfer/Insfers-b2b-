import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils';
import type { ConnectedAccountStatus } from '@/types';

const VALID_STATUSES: ConnectedAccountStatus[] = ['onboarding', 'active', 'suspended'];

interface ConnectedAccount {
  id: string;
  wallet_address: string;
  settlement_wallet: string;
  label: string;
  status: ConnectedAccountStatus;
  split_percentage: number;
  total_volume: number;
  payout_count: number;
  created_at: string;
}

const addresses = [
  '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
  '0x9876543210fedcba9876543210fedcba98765432',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  '0xdeadbeef12345678deadbeef12345678deadbeef',
  '0xcafe1234babe5678cafe1234babe5678cafe1234',
  '0xfeed9876face5432feed9876face5432feed9876',
];

const settlementAddresses = [
  '0xaaaa111122223333aaaa111122223333aaaa1111',
  '0xbbbb444455556666bbbb444455556666bbbb4444',
  '0xcccc777788889999cccc777788889999cccc7777',
  '0xdddd000011112222dddd000011112222dddd0000',
  '0xeeee333344445555eeee333344445555eeee3333',
  '0xffff666677778888ffff666677778888ffff6666',
];

const labels = [
  'Acme Corp', 'Widget Inc', 'Marketplace Seller A', 'Partner Store',
  'SubMerchant Alpha', 'Vendor Beta', 'Agency Gamma', 'Reseller Delta',
  'Freelancer Hub', 'Service Provider X', 'Platform Y', 'Outlet Z',
];

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

const mockConnectedAccounts: ConnectedAccount[] = Array.from({ length: 12 }, (_, i) => {
  const statuses: ConnectedAccountStatus[] = ['active', 'active', 'active', 'onboarding', 'suspended'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    id: `acct_${String(i + 1).padStart(3, '0')}${Math.random().toString(36).slice(2, 8)}`,
    wallet_address: addresses[i % addresses.length],
    settlement_wallet: settlementAddresses[i % settlementAddresses.length],
    label: labels[i % labels.length],
    status,
    split_percentage: [5, 10, 15, 20, 25][Math.floor(Math.random() * 5)],
    total_volume: status === 'onboarding' ? 0 : Math.floor(Math.random() * 500000) + 1000,
    payout_count: status === 'onboarding' ? 0 : Math.floor(Math.random() * 30) + 1,
    created_at: randomDate(90),
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = [...mockConnectedAccounts];

  // Filter by status
  if (status) {
    if (!VALID_STATUSES.includes(status as ConnectedAccountStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    filtered = filtered.filter((a) => a.status === status);
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

  const { wallet_address, settlement_wallet, label } = body as {
    wallet_address?: string;
    settlement_wallet?: string;
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

  if (!settlement_wallet) {
    return NextResponse.json(
      { error: 'settlement_wallet is required' },
      { status: 400 }
    );
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(settlement_wallet as string)) {
    return NextResponse.json(
      { error: 'settlement_wallet must be a valid Ethereum address (0x followed by 40 hex characters)' },
      { status: 400 }
    );
  }

  if (!label) {
    return NextResponse.json(
      { error: 'label is required' },
      { status: 400 }
    );
  }
  if (typeof label !== 'string' || label.trim().length === 0) {
    return NextResponse.json(
      { error: 'label must be a non-empty string' },
      { status: 400 }
    );
  }

  const id = generateId('acct');
  const now = new Date().toISOString();

  const connectedAccount: ConnectedAccount = {
    id,
    wallet_address,
    settlement_wallet,
    label,
    status: 'onboarding',
    split_percentage: 0,
    total_volume: 0,
    payout_count: 0,
    created_at: now,
  };

  return NextResponse.json(connectedAccount, { status: 201 });
}
