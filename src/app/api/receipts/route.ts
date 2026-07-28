import { NextRequest, NextResponse } from 'next/server';
import { mockReceipts, mockPayments, mockReceiptSettings, receiptIdForPayment } from '@/lib/mock-data';
import { renderReceiptEmail } from '@/lib/receipt-email';
import type { Receipt, ReceiptStatus } from '@/types';

const VALID_STATUSES: ReceiptStatus[] = [
  'sent', 'delivered', 'opened', 'pending', 'failed', 'bounced', 'not_sent',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const status = searchParams.get('status');
  const paymentId = searchParams.get('payment_intent_id');
  const email = searchParams.get('email');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = [...mockReceipts];

  if (status) {
    if (!VALID_STATUSES.includes(status as ReceiptStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }
    filtered = filtered.filter((r) => r.status === status);
  }

  if (paymentId) {
    filtered = filtered.filter((r) => r.payment_intent_id === paymentId);
  }

  if (email) {
    const q = email.toLowerCase();
    filtered = filtered.filter((r) => r.customer_email.toLowerCase().includes(q));
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

/**
 * Sends (or resends) a receipt email for a payment.
 * Body: { payment_intent_id: string, email?: string, preview?: boolean }
 * With `preview: true` the rendered email is returned without being "sent".
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { payment_intent_id, email, preview } = body as {
    payment_intent_id?: string;
    email?: string;
    preview?: boolean;
  };

  if (!payment_intent_id) {
    return NextResponse.json({ error: 'payment_intent_id is required' }, { status: 400 });
  }

  const payment = mockPayments.find((p) => p.id === payment_intent_id);
  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  if (payment.status !== 'succeeded') {
    return NextResponse.json(
      { error: 'Receipts can only be sent for succeeded payments' },
      { status: 409 },
    );
  }

  const recipient = (email as string) || payment.customer_email;
  if (!recipient) {
    return NextResponse.json(
      { error: 'No recipient email. Pass `email` or set customer_email on the payment.' },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(recipient)) {
    return NextResponse.json({ error: 'email must be a valid email address' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const existing = mockReceipts.find((r) => r.payment_intent_id === payment_intent_id);
  const id = existing?.id ?? receiptIdForPayment(payment.id);

  const receipt: Receipt = {
    id,
    payment_intent_id: payment.id,
    customer_email: recipient,
    status: 'sent',
    amount: payment.amount,
    chain: payment.chain,
    tx_hash: payment.tx_hash,
    receipt_url: `/r/${id}`,
    sent_at: now,
    delivered_at: null,
    opened_at: null,
    attempts: (existing?.attempts ?? 0) + 1,
    error_message: null,
    created_at: existing?.created_at ?? now,
  };

  const origin = request.nextUrl.origin;
  const rendered = renderReceiptEmail(receipt, mockReceiptSettings, payment, origin);

  if (preview) {
    return NextResponse.json({ preview: true, email: rendered, receipt });
  }

  // No mail provider is wired up yet — the rendered message is returned so the
  // caller can see exactly what would be delivered.
  return NextResponse.json(
    { receipt, email: { to: rendered.to, subject: rendered.subject } },
    { status: 201 },
  );
}
