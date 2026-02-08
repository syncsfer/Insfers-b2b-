import { NextRequest, NextResponse } from 'next/server';
import { mockInvoices, mockCustomers } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import type { Invoice } from '@/types';

const VALID_STATUSES: Invoice['status'][] = ['draft', 'sent', 'paid', 'void', 'overdue'];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const status = searchParams.get('status');
  const customerId = searchParams.get('customer_id');
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let filtered = [...mockInvoices];

  // Filter by status
  if (status) {
    if (!VALID_STATUSES.includes(status as Invoice['status'])) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    filtered = filtered.filter((inv) => inv.status === status);
  }

  // Filter by customer
  if (customerId) {
    filtered = filtered.filter((inv) => inv.customer_id === customerId);
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

  const { customer_id, customer_email, items, due_date, memo } = body as {
    customer_id?: string;
    customer_email?: string;
    items?: Array<{ description: string; quantity: number; unit_price: number }>;
    due_date?: string;
    memo?: string;
  };

  // Validate customer_id
  if (!customer_id) {
    return NextResponse.json(
      { error: 'customer_id is required' },
      { status: 400 }
    );
  }
  if (typeof customer_id !== 'string') {
    return NextResponse.json(
      { error: 'customer_id must be a string' },
      { status: 400 }
    );
  }

  // Check if customer exists
  const customer = mockCustomers.find((c) => c.id === customer_id);
  if (!customer) {
    return NextResponse.json(
      { error: `Customer '${customer_id}' not found` },
      { status: 404 }
    );
  }

  // Validate customer_email
  const email = customer_email || customer.email;
  if (!email) {
    return NextResponse.json(
      { error: 'customer_email is required when the customer has no email on file' },
      { status: 400 }
    );
  }

  // Validate items
  if (!items) {
    return NextResponse.json(
      { error: 'items is required' },
      { status: 400 }
    );
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'items must be a non-empty array' },
      { status: 400 }
    );
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.description || typeof item.description !== 'string') {
      return NextResponse.json(
        { error: `items[${i}].description is required and must be a string` },
        { status: 400 }
      );
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      return NextResponse.json(
        { error: `items[${i}].quantity must be a positive number` },
        { status: 400 }
      );
    }
    if (typeof item.unit_price !== 'number' || item.unit_price <= 0) {
      return NextResponse.json(
        { error: `items[${i}].unit_price must be a positive number` },
        { status: 400 }
      );
    }
  }

  // Validate due_date
  if (!due_date) {
    return NextResponse.json(
      { error: 'due_date is required' },
      { status: 400 }
    );
  }
  const parsedDueDate = new Date(due_date as string);
  if (isNaN(parsedDueDate.getTime())) {
    return NextResponse.json(
      { error: 'due_date must be a valid date string' },
      { status: 400 }
    );
  }

  // Build invoice items with computed amounts
  const invoiceItems = items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.quantity * item.unit_price,
  }));

  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

  const id = generateId('inv');
  const now = new Date().toISOString();

  const invoice = {
    id,
    customer_id: customer_id as string,
    customer_email: email as string,
    amount: totalAmount,
    status: 'draft' as const,
    due_date: parsedDueDate.toISOString(),
    paid_at: null,
    payment_intent_id: null,
    items: invoiceItems,
    memo: (memo as string) || null,
    created_at: now,
  };

  return NextResponse.json(invoice, { status: 201 });
}
