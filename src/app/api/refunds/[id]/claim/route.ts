import { NextRequest, NextResponse } from 'next/server';
import { mockRefunds, mockPayments, claimEventsFor } from '@/lib/mock-data';
import { getCoin } from '@/lib/currencies';
import type { Refund } from '@/types';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/** Why a claim link can't be used right now. `null` means it can. */
export type ClaimBlocker =
  | 'not_claimable'
  | 'already_claimed'
  | 'expired'
  | 'revoked'
  | 'failed';

function blockerFor(refund: Refund, now = Date.now()): ClaimBlocker | null {
  if (refund.method !== 'claimable' || !refund.claim_link) return 'not_claimable';
  if (refund.claim_revoked_at) return 'revoked';
  if (refund.claimed_at || refund.claimed_by) return 'already_claimed';
  if (refund.status === 'failed') return 'failed';
  if (refund.claim_expires_at && new Date(refund.claim_expires_at).getTime() <= now) {
    return 'expired';
  }
  return null;
}

/**
 * Public claim details for the customer-facing page.
 *
 * Deliberately narrow: it exposes only what the claim page needs to render, not
 * the full refund record — the link is a bearer token, so anyone holding it
 * would see whatever we return here.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const refund = mockRefunds.find(r => r.id === id);

  if (!refund) {
    return NextResponse.json({ error: 'Claim link not found' }, { status: 404 });
  }

  const blocker = blockerFor(refund);
  const coin = getCoin(refund.currency);
  const payment = mockPayments.find(p => p.id === refund.payment_intent_id);

  return NextResponse.json({
    id: refund.id,
    amount: refund.amount,
    currency: refund.currency,
    currency_name: coin.name,
    chain: refund.chain,
    reason: refund.reason,
    merchant_name: 'Acme Corp',
    expires_at: refund.claim_expires_at,
    claimable: blocker === null,
    blocker,
    claimed_by: refund.claimed_by,
    claimed_at: refund.claimed_at,
    tx_hash: refund.tx_hash,
    // Suggested destination — the address that originally paid.
    suggested_address: payment?.from_address ?? null,
  });
}

/**
 * Executes a claim.
 * Body: { address: string }
 *
 * Validates the link is still usable and the destination is a well-formed
 * address before moving funds. Returns 409 with the specific blocker so the
 * claim page can explain what happened rather than showing a generic error.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const address = body.address as string | undefined;

  const refund = mockRefunds.find(r => r.id === id);
  if (!refund) {
    return NextResponse.json({ error: 'Claim link not found' }, { status: 404 });
  }

  const blocker = blockerFor(refund);
  if (blocker) {
    const messages: Record<ClaimBlocker, string> = {
      not_claimable: 'This refund is not claimable',
      already_claimed: 'This refund has already been claimed',
      expired: 'This claim link has expired',
      revoked: 'This claim link was cancelled by the merchant',
      failed: 'This refund failed and cannot be claimed',
    };
    return NextResponse.json({ error: messages[blocker], blocker }, { status: 409 });
  }

  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 });
  }
  if (!ADDRESS_RE.test(address)) {
    return NextResponse.json(
      { error: 'address must be a valid Ethereum address (0x followed by 40 hex characters)' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

  const claimed: Refund = {
    ...refund,
    status: 'completed',
    claimed_by: address,
    claimed_at: now,
    completed_at: now,
    tx_hash: txHash,
  };

  return NextResponse.json(
    {
      refund: claimed,
      tx_hash: txHash,
      chain: refund.chain,
      events: claimEventsFor(claimed),
    },
    { status: 201 },
  );
}
