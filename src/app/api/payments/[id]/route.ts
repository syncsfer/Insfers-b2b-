import { NextRequest, NextResponse } from 'next/server';
import { mockPayments } from '@/lib/mock-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const payment = mockPayments.find((p) => p.id === id);

  if (!payment) {
    return NextResponse.json(
      { error: `Payment with id '${id}' not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(payment);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const payment = mockPayments.find((p) => p.id === id);

  if (!payment) {
    return NextResponse.json(
      { error: `Payment with id '${id}' not found` },
      { status: 404 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { metadata, description } = body as {
    metadata?: Record<string, string>;
    description?: string;
  };

  if (metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata) || metadata === null)) {
    return NextResponse.json(
      { error: 'metadata must be a non-null object' },
      { status: 400 }
    );
  }

  if (description !== undefined && typeof description !== 'string') {
    return NextResponse.json(
      { error: 'description must be a string' },
      { status: 400 }
    );
  }

  // Return the payment with updated fields applied
  const updatedPayment = {
    ...payment,
    ...(metadata !== undefined && { metadata: { ...payment.metadata, ...metadata } }),
    ...(description !== undefined && { description }),
  };

  return NextResponse.json(updatedPayment);
}
