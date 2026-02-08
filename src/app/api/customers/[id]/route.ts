import { NextRequest, NextResponse } from 'next/server';
import { mockCustomers } from '@/lib/mock-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const customer = mockCustomers.find((c) => c.id === id);

  if (!customer) {
    return NextResponse.json(
      { error: `Customer with id '${id}' not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(customer);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const customer = mockCustomers.find((c) => c.id === id);

  if (!customer) {
    return NextResponse.json(
      { error: `Customer with id '${id}' not found` },
      { status: 404 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { label, is_blocked, email } = body as {
    label?: string | null;
    is_blocked?: boolean;
    email?: string | null;
  };

  // Validate label if provided
  if (label !== undefined && label !== null && typeof label !== 'string') {
    return NextResponse.json(
      { error: 'label must be a string or null' },
      { status: 400 }
    );
  }

  // Validate is_blocked if provided
  if (is_blocked !== undefined && typeof is_blocked !== 'boolean') {
    return NextResponse.json(
      { error: 'is_blocked must be a boolean' },
      { status: 400 }
    );
  }

  // Validate email if provided
  if (email !== undefined && email !== null) {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'email must be a valid email address or null' },
        { status: 400 }
      );
    }
  }

  const updatedCustomer = {
    ...customer,
    ...(label !== undefined && { label }),
    ...(is_blocked !== undefined && { is_blocked }),
    ...(email !== undefined && { email }),
  };

  return NextResponse.json(updatedCustomer);
}
