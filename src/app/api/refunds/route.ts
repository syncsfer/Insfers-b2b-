import { NextRequest, NextResponse } from 'next/server';
import { mockRefunds, mockPayments } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import type { RefundMethod, RefundStatus } from '@/types';

const VALID_STATUSES: RefundStatus[] = ['created', 'processing', 'completed', 'failed', 'awaiting_claim', 'expired'];
const VALID_METHODS: RefundMethod[] = ['direct', 'claimable'];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const status = searchParams.get('status');
  const paymentIntentId = searchParams.get('payment_intent_id');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = [...mockRefunds];

  // Filter by status
  if (status) {
    if (!VALID_STATUSES.includes(status as RefundStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    filtered = filtered.filter((r) => r.status === status);
  }

  // Filter by payment intent ID
  if (paymentIntentId) {
    filtered = filtered.filter((r) => r.payment_intent_id === paymentIntentId);
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

  const { payment_intent_id, amount, method, reason } = body as {
    payment_intent_id?: string;
    amount?: number;
    method?: string;
    reason?: string;
  };

  // Validate required fields
  if (!payment_intent_id) {
    return NextResponse.json(
      { error: 'payment_intent_id is required' },
      { status: 400 }
    );
  }

  // Validate the payment exists
  const payment = mockPayments.find((p) => p.id === payment_intent_id);
  if (!payment) {
    return NextResponse.json(
      { error: `Payment '${payment_intent_id}' not found` },
      { status: 404 }
    );
  }

  // Validate the payment has succeeded
  if (payment.status !== 'succeeded') {
    return NextResponse.json(
      { error: `Payment '${payment_intent_id}' has status '${payment.status}'. Only succeeded payments can be refunded.` },
      { status: 400 }
    );
  }

  // Validate amount
  if (amount === undefined || amount === null) {
    return NextResponse.json({ error: 'amount is required' }, { status: 400 });
  }
  if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
    return NextResponse.json(
      { error: 'amount must be a positive number' },
      { status: 400 }
    );
  }
  if (amount > payment.amount) {
    return NextResponse.json(
      { error: `Refund amount ($${(amount / 100).toFixed(2)}) cannot exceed original payment amount ($${(payment.amount / 100).toFixed(2)})` },
      { status: 400 }
    );
  }

  // Validate method
  if (!method) {
    return NextResponse.json({ error: 'method is required' }, { status: 400 });
  }
  if (!VALID_METHODS.includes(method as RefundMethod)) {
    return NextResponse.json(
      { error: `Invalid method. Must be one of: ${VALID_METHODS.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate reason
  if (!reason) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return NextResponse.json(
      { error: 'reason must be a non-empty string' },
      { status: 400 }
    );
  }

  const id = generateId('ref');
  const now = new Date().toISOString();
  const isClaimable = method === 'claimable';

  const refund = {
    id,
    payment_intent_id: payment_intent_id as string,
    amount: amount as number,
    method: method as RefundMethod,
    status: isClaimable ? ('awaiting_claim' as const) : ('processing' as const),
    claim_link: isClaimable ? `https://pay.chainpayments.com/claim/${id}` : null,
    claim_expires_at: isClaimable
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null,
    claimed_by: null,
    reason: reason as string,
    tx_hash: null,
    created_at: now,
    completed_at: null,
  };

  return NextResponse.json(refund, { status: 201 });
}
