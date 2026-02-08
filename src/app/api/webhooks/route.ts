import { NextRequest, NextResponse } from 'next/server';
import { mockWebhooks } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';

const VALID_EVENTS = [
  'payment.created',
  'payment.succeeded',
  'payment.failed',
  'payment.expired',
  'refund.created',
  'refund.completed',
  'refund.failed',
  'customer.created',
  'customer.updated',
  'invoice.created',
  'invoice.paid',
  'invoice.overdue',
  'payment_link.created',
  'payment_link.payment',
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const active = searchParams.get('active');
  let filtered = [...mockWebhooks];

  // Filter by active status
  if (active !== null && active !== undefined && active !== '') {
    const isActive = active === 'true';
    filtered = filtered.filter((w) => w.active === isActive);
  }

  return NextResponse.json({
    data: filtered,
    total: filtered.length,
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { url, events } = body as {
    url?: string;
    events?: string[];
  };

  // Validate URL
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }
  if (typeof url !== 'string') {
    return NextResponse.json({ error: 'url must be a string' }, { status: 400 });
  }

  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url as string);
  } catch {
    return NextResponse.json(
      { error: 'url must be a valid URL (e.g., https://example.com/webhook)' },
      { status: 400 }
    );
  }

  // Require HTTPS
  if (parsedUrl.protocol !== 'https:') {
    return NextResponse.json(
      { error: 'url must use HTTPS protocol' },
      { status: 400 }
    );
  }

  // Validate events
  if (!events) {
    return NextResponse.json({ error: 'events is required' }, { status: 400 });
  }
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json(
      { error: 'events must be a non-empty array of event types' },
      { status: 400 }
    );
  }

  const invalidEvents = (events as string[]).filter((e) => !VALID_EVENTS.includes(e));
  if (invalidEvents.length > 0) {
    return NextResponse.json(
      {
        error: `Invalid event types: ${invalidEvents.join(', ')}. Valid events are: ${VALID_EVENTS.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const id = generateId('we');
  const now = new Date().toISOString();

  // Generate a webhook signing secret
  const secretChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let secret = 'whsec_';
  for (let i = 0; i < 24; i++) {
    secret += secretChars.charAt(Math.floor(Math.random() * secretChars.length));
  }

  const webhook = {
    id,
    url: url as string,
    events: events as string[],
    active: true,
    secret,
    created_at: now,
    last_delivery_at: null,
    success_rate: 100,
  };

  return NextResponse.json(webhook, { status: 201 });
}
