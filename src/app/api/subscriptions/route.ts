import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils';
import type { Subscription, SubscriptionStatus } from '@/types';

const VALID_STATUSES: SubscriptionStatus[] = ['active', 'past_due', 'canceled', 'expired', 'trialing'];
const VALID_INTERVALS: Subscription['interval'][] = ['week', 'month', 'year'];

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

const planNames = [
  'Starter Plan', 'Pro Plan', 'Enterprise Plan', 'Growth Plan',
  'Basic Plan', 'Premium Plan', 'Team Plan', 'Business Plan',
  'Developer Plan', 'Scale Plan', 'Hobby Plan', 'Agency Plan',
];

const mockSubscriptions: Subscription[] = Array.from({ length: 15 }, (_, i) => {
  const statuses: SubscriptionStatus[] = ['active', 'active', 'active', 'past_due', 'canceled', 'trialing', 'expired'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const intervals: Subscription['interval'][] = ['month', 'month', 'month', 'year', 'week'];
  const interval = intervals[Math.floor(Math.random() * intervals.length)];
  const amount = [2900, 4900, 9900, 14900, 19900, 29900, 49900][Math.floor(Math.random() * 7)];
  const created = randomDate(60);
  const periodStart = randomDate(30);
  const periodDays = interval === 'week' ? 7 : interval === 'month' ? 30 : 365;
  const periodEnd = new Date(new Date(periodStart).getTime() + periodDays * 24 * 60 * 60 * 1000).toISOString();
  const nextBilling = new Date(new Date(periodEnd).getTime() + 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `sub_${String(i + 1).padStart(3, '0')}${Math.random().toString(36).slice(2, 8)}`,
    customer_id: `cus_${String((i % 10) + 1).padStart(3, '0')}`,
    plan_name: planNames[i % planNames.length],
    amount,
    interval,
    status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    next_billing_date: status === 'canceled' || status === 'expired' ? periodEnd : nextBilling,
    retry_count: status === 'past_due' ? Math.floor(Math.random() * 3) + 1 : 0,
    max_retries: 3,
    created_at: created,
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = [...mockSubscriptions];

  // Filter by status
  if (status) {
    if (!VALID_STATUSES.includes(status as SubscriptionStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    filtered = filtered.filter((s) => s.status === status);
  }

  // Search by plan name
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.plan_name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.customer_id.toLowerCase().includes(q)
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

  const { customer_id, plan_name, amount, interval } = body as {
    customer_id?: string;
    plan_name?: string;
    amount?: number;
    interval?: string;
  };

  // Validate required fields
  if (!customer_id) {
    return NextResponse.json(
      { error: 'customer_id is required' },
      { status: 400 }
    );
  }
  if (typeof customer_id !== 'string' || customer_id.trim().length === 0) {
    return NextResponse.json(
      { error: 'customer_id must be a non-empty string' },
      { status: 400 }
    );
  }

  if (!plan_name) {
    return NextResponse.json(
      { error: 'plan_name is required' },
      { status: 400 }
    );
  }
  if (typeof plan_name !== 'string' || plan_name.trim().length === 0) {
    return NextResponse.json(
      { error: 'plan_name must be a non-empty string' },
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

  if (!interval) {
    return NextResponse.json(
      { error: 'interval is required' },
      { status: 400 }
    );
  }
  if (!VALID_INTERVALS.includes(interval as Subscription['interval'])) {
    return NextResponse.json(
      { error: `Invalid interval. Must be one of: ${VALID_INTERVALS.join(', ')}` },
      { status: 400 }
    );
  }

  const id = generateId('sub');
  const now = new Date();
  const periodDays = interval === 'week' ? 7 : interval === 'month' ? 30 : 365;
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000).toISOString();
  const nextBilling = new Date(now.getTime() + (periodDays + 1) * 24 * 60 * 60 * 1000).toISOString();

  const subscription: Subscription = {
    id,
    customer_id,
    plan_name,
    amount,
    interval: interval as Subscription['interval'],
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: periodEnd,
    next_billing_date: nextBilling,
    retry_count: 0,
    max_retries: 3,
    created_at: now.toISOString(),
  };

  return NextResponse.json(subscription, { status: 201 });
}
