import type {
  PaymentIntent, Refund, Customer, PaymentLink, Invoice,
  WebhookEndpoint, ApiKey, WebhookLog, TimelineEvent, DashboardKPIs,
  Chain, Hold, Subscription, Plan, ConnectedAccount, Payout,
  ActionItem, AIAgent, AgentAction, Transfer, SavedRecipient,
  Receipt, ReceiptSettings, Currency, CatalogCategory, CatalogItem, ClaimEvent,
  TeamMember,
} from '@/types';
import { STABLECOINS } from '@/lib/currencies';

const chains: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];

// Multi-currency helpers. USDC still dominates volume; the others are weighted
// to appear often enough that every surface gets exercised.
const currencyWeights: Currency[] = [
  'USDC', 'USDC', 'USDC', 'USDC', 'USDC',
  'EURC', 'EURC', 'EURC',
  'JPYC', 'JPYC',
  'HTGC', 'HTGC',
];

function pickCurrency(): Currency {
  return currencyWeights[Math.floor(Math.random() * currencyWeights.length)];
}

/** Only return a chain the coin actually settles on. */
function chainFor(currency: Currency): Chain {
  const nets = STABLECOINS[currency].networks;
  return nets[Math.floor(Math.random() * nets.length)];
}

/**
 * A plausible transaction size in the currency's minor units. Yen has no
 * subunit, so its numbers are ~100x smaller than a naive cents conversion,
 * and the gourde is a low-value currency so amounts run large.
 */
function amountFor(currency: Currency, scale = 1): number {
  const ranges: Record<Currency, [number, number]> = {
    USDC: [500, 250_000],
    EURC: [500, 220_000],
    JPYC: [800, 400_000],
    HTGC: [10_000, 3_000_000],
  };
  const [min, max] = ranges[currency];
  return Math.floor((Math.random() * (max - min) + min) * scale);
}
const addresses = [
  '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
  '0x9876543210fedcba9876543210fedcba98765432',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  '0xdeadbeef12345678deadbeef12345678deadbeef',
  '0xcafe1234babe5678cafe1234babe5678cafe1234',
  '0xfeed9876face5432feed9876face5432feed9876',
];

const merchantAddress = '0x7777777777777777777777777777777777777777';

/** Receipt ids are derived from the payment id so links stay stable across renders. */
export function receiptIdForPayment(paymentId: string): string {
  return `rcpt_${paymentId.replace(/^pi_/, '')}`;
}

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  // Randomising the hour can push the date past now; clamp so nothing is
  // "created" in the future and relative times never read negative.
  return new Date(Math.min(d.getTime(), Date.now() - 1000)).toISOString();
}

export const mockPayments: PaymentIntent[] = Array.from({ length: 50 }, (_, i) => {
  const currency = pickCurrency();
  const amount = amountFor(currency);
  const fee = Math.max(1, Math.floor(amount * 0.001));
  const statuses: PaymentIntent['status'][] = ['succeeded', 'succeeded', 'succeeded', 'pending', 'failed', 'expired', 'awaiting_payment'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const chain = chainFor(currency);
  const created = randomDate(30);
  const isAgent = Math.random() > 0.75;
  const id = `pi_${String(i + 1).padStart(3, '0')}${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    amount,
    status,
    chain,
    currency,
    from_address: addresses[Math.floor(Math.random() * addresses.length)],
    to_address: merchantAddress,
    tx_hash: status !== 'awaiting_payment' ? `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}` : null,
    confirmations: status === 'succeeded' ? 1 : status === 'pending' ? 0 : 0,
    required_confirmations: 1,
    metadata: {},
    customer_id: `cus_${String(i + 1).padStart(3, '0')}`,
    customer_email: Math.random() > 0.3 ? `user${i + 1}@example.com` : null,
    fee,
    net_amount: amount - fee,
    created_at: created,
    confirmed_at: status === 'succeeded' ? new Date(new Date(created).getTime() + 3000).toISOString() : null,
    description: ['Monthly subscription', 'One-time purchase', 'Invoice payment', 'Service fee', null][Math.floor(Math.random() * 5)],
    receipt_url: status === 'succeeded' ? `/r/${receiptIdForPayment(id)}` : null,
    initiated_by: (isAgent ? 'agent' : 'human') as PaymentIntent['initiated_by'],
    agent_id: isAgent ? ['agent_001', 'agent_002', 'agent_003'][Math.floor(Math.random() * 3)] : null,
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export const mockRefunds: Refund[] = Array.from({ length: 15 }, (_, i) => {
  const payment = mockPayments.filter(p => p.status === 'succeeded')[i % 10];
  const currency = payment?.currency ?? 'USDC';
  const chain = payment?.chain ?? 'base';
  const methods: Refund['method'][] = ['direct', 'claimable', 'claimable'];
  const method = methods[Math.floor(Math.random() * methods.length)];

  // Direct refunds never enter the claim lifecycle.
  const statuses: Refund['status'][] = method === 'direct'
    ? ['completed', 'completed', 'processing', 'failed']
    : ['awaiting_claim', 'awaiting_claim', 'completed', 'expired', 'failed'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  const id = `ref_${String(i + 1).padStart(3, '0')}${Math.random().toString(36).slice(2, 8)}`;
  const created = randomDate(14);
  const createdMs = new Date(created).getTime();
  const isClaimable = method === 'claimable';

  // Links awaiting a claim must still be live, so their window is measured from
  // now rather than from creation; some land close to the wire so the countdown
  // has something to show. Expired ones sit deliberately in the past.
  const expiresMs = status === 'awaiting_claim'
    ? Date.now() + (Math.random() > 0.35 ? 6 + Math.random() * 40 : Math.random() * 5) * 3600_000
    : createdMs + 24 * 3600_000;
  const claimed = isClaimable && status === 'completed';
  const claimedAtMs = claimed ? createdMs + Math.random() * 20 * 3600_000 : null;

  const email = payment?.customer_email ?? null;
  const notified = isClaimable && email ? new Date(createdMs + 60_000).toISOString() : null;

  return {
    id,
    payment_intent_id: payment?.id || 'pi_unknown',
    amount: payment ? Math.floor(payment.amount * (Math.random() > 0.5 ? 1 : 0.5)) : 5000,
    currency,
    chain,
    method,
    status,
    reason: ['Customer requested', 'Duplicate charge', 'Service not rendered', 'Other'][Math.floor(Math.random() * 4)],
    tx_hash: ['completed', 'processing'].includes(status) ? `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}` : null,
    created_at: created,
    completed_at: status === 'completed' ? new Date(claimedAtMs ?? createdMs + 3600_000).toISOString() : null,

    claim_link: isClaimable ? `/claim/${id}` : null,
    claim_expires_at: isClaimable ? new Date(expiresMs).toISOString() : null,
    claimed_by: claimed ? addresses[Math.floor(Math.random() * addresses.length)] : null,
    claimed_at: claimedAtMs ? new Date(claimedAtMs).toISOString() : null,
    recipient_email: isClaimable ? email : null,
    claim_notified_at: notified,
    claim_reminders_sent: isClaimable && status === 'awaiting_claim' ? Math.floor(Math.random() * 3) : 0,
    claim_revoked_at: null,
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

/** Reconstructs the claim trail for a refund, newest last. */
export function claimEventsFor(refund: Refund): ClaimEvent[] {
  if (refund.method !== 'claimable') return [];
  const events: ClaimEvent[] = [];
  let n = 0;
  const push = (type: ClaimEvent['type'], detail: string, timestamp: string, actor: string | null = null) => {
    events.push({ id: `${refund.id}_ev_${++n}`, refund_id: refund.id, type, detail, actor, timestamp });
  };

  push('created', `Claim link created for ${refund.id}`, refund.created_at, 'Acme Corp');

  if (refund.claim_notified_at) {
    push('notified', `Claim link emailed to ${refund.recipient_email}`, refund.claim_notified_at);
  }
  for (let r = 0; r < refund.claim_reminders_sent; r++) {
    push(
      'reminded',
      `Reminder ${r + 1} sent to ${refund.recipient_email}`,
      new Date(new Date(refund.created_at).getTime() + (r + 1) * 6 * 3600_000).toISOString(),
    );
  }
  if (refund.claimed_at) {
    push('opened', 'Customer opened the claim page', new Date(new Date(refund.claimed_at).getTime() - 120_000).toISOString());
    push('claimed', `Claimed to ${refund.claimed_by}`, refund.claimed_at, refund.claimed_by);
  }
  if (refund.status === 'expired' && refund.claim_expires_at) {
    push('expired', 'Link expired unclaimed — funds returned to your treasury', refund.claim_expires_at);
  }
  if (refund.claim_revoked_at) {
    push('revoked', 'Link revoked by merchant — funds returned', refund.claim_revoked_at, 'Acme Corp');
  }
  if (refund.status === 'failed') {
    push('failed', 'Claim transaction reverted on-chain', refund.created_at);
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export const mockCustomers: Customer[] = Array.from({ length: 20 }, (_, i) => ({
  id: `cus_${String(i + 1).padStart(3, '0')}`,
  wallet_address: addresses[i % addresses.length],
  email: Math.random() > 0.2 ? `user${i + 1}@example.com` : null,
  label: ['VIP Customer', 'Enterprise', 'Frequent Buyer', null, null][Math.floor(Math.random() * 5)],
  lifetime_value: Math.floor(Math.random() * 500000) + 1000,
  payment_count: Math.floor(Math.random() * 50) + 1,
  first_payment_at: randomDate(180),
  last_payment_at: randomDate(7),
  is_blocked: Math.random() > 0.95,
  risk_level: (['low', 'low', 'low', 'medium', 'high'] as const)[Math.floor(Math.random() * 5)],
  created_at: randomDate(180),
}));

export const mockPaymentLinks: PaymentLink[] = Array.from({ length: 8 }, (_, i) => {
  const names = ['Pro Plan', 'Starter Plan', 'Donation', 'Event Ticket', 'Consultation Fee', 'Workshop', 'Merch', 'Custom'];
  // Amounts are in each currency's own minor units, so they differ in magnitude.
  const seeds: [number | null, Currency][] = [
    [9_900, 'USDC'],
    [2_900, 'USDC'],
    [null, 'USDC'],
    [5_000, 'EURC'],
    [15_000, 'EURC'],
    [12_000, 'JPYC'],
    [3_500, 'USDC'],
    [null, 'HTGC'],
  ];
  const [amount, currency] = seeds[i];
  return {
    id: `pl_${String(i + 1).padStart(3, '0')}`,
    name: names[i],
    amount,
    currency,
    url: `/l/pl_${String(i + 1).padStart(3, '0')}`,
    active: Math.random() > 0.2,
    // Only offer networks the chosen coin actually settles on.
    chains: STABLECOINS[currency].networks.slice(0, 2),
    payment_count: Math.floor(Math.random() * 100),
    total_collected: Math.floor(Math.random() * 1000000),
    created_at: randomDate(60),
  };
});

export const mockInvoices: Invoice[] = Array.from({ length: 12 }, (_, i) => {
  const statuses: Invoice['status'][] = ['paid', 'sent', 'draft', 'overdue', 'void'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const currency = pickCurrency();
  const amount = amountFor(currency);
  const createdByAgent = Math.random() > 0.7;
  const paidByAgent = status === 'paid' && Math.random() > 0.6;
  return {
    id: `inv_${String(i + 1).padStart(3, '0')}`,
    customer_id: `cus_${String((i % 10) + 1).padStart(3, '0')}`,
    customer_email: `user${(i % 10) + 1}@example.com`,
    amount,
    currency,
    status,
    due_date: new Date(Date.now() + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 30) * 86400000).toISOString(),
    paid_at: status === 'paid' ? randomDate(7) : null,
    payment_intent_id: status === 'paid' ? mockPayments[i % mockPayments.length]?.id : null,
    items: [
      { description: 'Consulting Services', quantity: 1, unit_price: amount, amount },
    ],
    memo: Math.random() > 0.5 ? 'Thank you for your business' : null,
    created_at: randomDate(30),
    created_by: (createdByAgent ? 'agent' : 'human') as 'agent' | 'human',
    agent_id: createdByAgent ? 'agent_001' : null,
    paid_by: (status === 'paid' ? (paidByAgent ? 'agent' : 'human') : null) as 'agent' | 'human' | null,
    paid_by_agent_id: paidByAgent ? ['agent_002', 'agent_003'][Math.floor(Math.random() * 2)] : null,
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export const mockWebhooks: WebhookEndpoint[] = [
  {
    id: 'we_001',
    url: 'https://api.example.com/webhooks/payments',
    events: ['payment.succeeded', 'payment.failed', 'refund.created'],
    active: true,
    secret: 'whsec_xxxxxxxxxxxxxxxxxxxxx',
    created_at: randomDate(60),
    last_delivery_at: randomDate(1),
    success_rate: 98.5,
  },
  {
    id: 'we_002',
    url: 'https://hooks.example.com/chain-payments',
    events: ['payment.succeeded'],
    active: true,
    secret: 'whsec_yyyyyyyyyyyyyyyyyyyyy',
    created_at: randomDate(30),
    last_delivery_at: randomDate(1),
    success_rate: 100,
  },
];

export const mockApiKeys: ApiKey[] = [
  {
    id: 'key_001',
    name: 'Production Key',
    key_prefix: 'sk_live_xxxx...xxxx',
    mode: 'live',
    created_at: randomDate(90),
    last_used_at: randomDate(1),
  },
  {
    id: 'key_002',
    name: 'Test Key',
    key_prefix: 'sk_test_yyyy...yyyy',
    mode: 'test',
    created_at: randomDate(90),
    last_used_at: randomDate(1),
  },
];

export const mockWebhookLogs: WebhookLog[] = Array.from({ length: 30 }, (_, i) => ({
  id: `wl_${i + 1}`,
  endpoint_id: i % 2 === 0 ? 'we_001' : 'we_002',
  event_type: ['payment.succeeded', 'payment.failed', 'refund.created'][Math.floor(Math.random() * 3)],
  status_code: Math.random() > 0.1 ? 200 : 500,
  response_time_ms: Math.floor(Math.random() * 500) + 50,
  success: Math.random() > 0.1,
  created_at: randomDate(7),
})).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export const mockTimeline: TimelineEvent[] = [
  { id: 'ev_1', type: 'payment_created', title: 'Payment created', description: 'Payment intent pi_001 created for $50.00', tx_hash: null, timestamp: '2026-02-08T14:30:00Z' },
  { id: 'ev_2', type: 'checkout_opened', title: 'Checkout opened', description: 'Customer opened checkout page', tx_hash: null, timestamp: '2026-02-08T14:31:00Z' },
  { id: 'ev_3', type: 'wallet_connected', title: 'Wallet connected', description: '0x1a2b...ef12 connected via MetaMask', tx_hash: null, timestamp: '2026-02-08T14:31:30Z' },
  { id: 'ev_4', type: 'approval_granted', title: 'USDC approval granted', description: 'Approved 50.02 USDC spending', tx_hash: '0xaaa111222333', timestamp: '2026-02-08T14:32:00Z' },
  { id: 'ev_5', type: 'transaction_sent', title: 'Transaction sent', description: 'Payment transaction broadcast to Base', tx_hash: '0xbbb444555666', timestamp: '2026-02-08T14:32:30Z' },
  { id: 'ev_6', type: 'confirmation_progress', title: 'Confirmation received', description: '1 of 1 confirmations on Base', tx_hash: '0xbbb444555666', timestamp: '2026-02-08T14:32:32Z' },
  { id: 'ev_7', type: 'payment_succeeded', title: 'Payment succeeded', description: '$50.00 USDC received successfully', tx_hash: '0xbbb444555666', timestamp: '2026-02-08T14:32:33Z' },
  { id: 'ev_8', type: 'webhook_sent', title: 'Webhook delivered', description: 'payment.succeeded webhook sent to api.example.com', tx_hash: null, timestamp: '2026-02-08T14:32:35Z' },
];

export const mockDashboardKPIs: DashboardKPIs = {
  total_volume: 12543200,
  total_volume_change: 12.5,
  successful_payments: 342,
  successful_payments_change: 8.3,
  average_payment: 3668,
  average_payment_change: -2.1,
  active_customers: 89,
  active_customers_change: 15.2,
};

export const mockHolds: Hold[] = Array.from({ length: 12 }, (_, i) => {
  const currency = pickCurrency();
  const amount = amountFor(currency);
  const statuses: Hold['status'][] = ['active', 'active', 'captured', 'released', 'expired'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const capturedAmount = status === 'captured' ? amount : status === 'released' ? 0 : 0;
  const releasedAmount = status === 'released' ? amount : 0;
  return {
    id: `hold_${String(i + 1).padStart(3, '0')}`,
    amount,
    currency,
    captured_amount: capturedAmount,
    released_amount: releasedAmount,
    status,
    customer_id: `cus_${String((i % 10) + 1).padStart(3, '0')}`,
    from_address: addresses[i % addresses.length],
    expires_at: new Date(Date.now() + (status === 'active' ? Math.floor(Math.random() * 7) * 86400000 : -86400000)).toISOString(),
    created_at: randomDate(14),
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export const mockPlans: Plan[] = [
  { id: 'plan_001', merchant_address: merchantAddress, name: 'Starter', amount: 2900, interval: 'month', interval_seconds: 2592000, trial_days: 14, grace_period: 259200, max_retries: 3, active: true, subscriber_count: 45, created_at: randomDate(90) },
  { id: 'plan_002', merchant_address: merchantAddress, name: 'Professional', amount: 9900, interval: 'month', interval_seconds: 2592000, trial_days: 7, grace_period: 259200, max_retries: 3, active: true, subscriber_count: 28, created_at: randomDate(90) },
  { id: 'plan_003', merchant_address: merchantAddress, name: 'Enterprise', amount: 29900, interval: 'month', interval_seconds: 2592000, trial_days: 30, grace_period: 432000, max_retries: 5, active: true, subscriber_count: 12, created_at: randomDate(60) },
  { id: 'plan_004', merchant_address: merchantAddress, name: 'Annual Pro', amount: 99900, interval: 'year', interval_seconds: 31536000, trial_days: 14, grace_period: 604800, max_retries: 5, active: true, subscriber_count: 8, created_at: randomDate(30) },
  { id: 'plan_005', merchant_address: merchantAddress, name: 'Legacy Basic', amount: 1900, interval: 'month', interval_seconds: 2592000, trial_days: 0, grace_period: 172800, max_retries: 2, active: false, subscriber_count: 3, created_at: randomDate(180) },
];

export const mockSubscriptions: Subscription[] = Array.from({ length: 15 }, (_, i) => {
  const statuses: Subscription['status'][] = ['active', 'active', 'active', 'trialing', 'past_due', 'canceled'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const plan = mockPlans[i % mockPlans.length];
  const periodStart = randomDate(30);
  const periodEnd = new Date(new Date(periodStart).getTime() + (plan.interval === 'year' ? 31536000000 : 2592000000)).toISOString();
  return {
    id: `sub_${String(i + 1).padStart(3, '0')}`,
    customer_id: `cus_${String((i % 10) + 1).padStart(3, '0')}`,
    plan_name: plan.name,
    amount: plan.amount,
    interval: plan.interval,
    status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    next_billing_date: periodEnd,
    retry_count: status === 'past_due' ? Math.floor(Math.random() * 3) + 1 : 0,
    max_retries: plan.max_retries,
    created_at: randomDate(90),
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export const mockConnectedAccounts: ConnectedAccount[] = Array.from({ length: 8 }, (_, i) => {
  const statuses: ConnectedAccount['status'][] = ['active', 'active', 'active', 'onboarding', 'suspended'];
  return {
    id: `ca_${String(i + 1).padStart(3, '0')}`,
    wallet_address: addresses[i % addresses.length],
    settlement_wallet: addresses[(i + 1) % addresses.length],
    label: ['Vendor A', 'Vendor B', 'Partner Co', 'Freelancer X', 'Agency Y', 'Studio Z', 'Contractor M', 'Service Co'][i],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    total_received: Math.floor(Math.random() * 500000) + 5000,
    split_count: Math.floor(Math.random() * 50) + 1,
    created_at: randomDate(60),
  };
});

export const mockPayouts: Payout[] = Array.from({ length: 10 }, (_, i) => {
  const statuses: Payout['status'][] = ['completed', 'completed', 'completed', 'pending', 'processing', 'failed'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  return {
    id: `po_${String(i + 1).padStart(3, '0')}`,
    recipient_address: addresses[i % addresses.length],
    amount: Math.floor(Math.random() * 100000) + 5000,
    status,
    tx_hash: ['completed', 'processing'].includes(status) ? `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}` : null,
    created_at: randomDate(14),
    completed_at: status === 'completed' ? randomDate(7) : null,
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

// AI Agents

const agentWallets = [
  '0xA1B0T000000000000000000000000000000000a1',
  '0xA1B0T000000000000000000000000000000000a2',
  '0xA1B0T000000000000000000000000000000000a3',
  '0xA1B0T000000000000000000000000000000000a4',
];

export const mockAgents: AIAgent[] = [
  {
    id: 'agent_001',
    name: 'Invoice Autopilot',
    description: 'Automatically creates and sends invoices for recurring services, follows up on overdue payments, and generates collection reports.',
    status: 'active',
    wallet_address: agentWallets[0],
    wallet_balance: 245000,
    chain: 'base',
    capabilities: ['create_invoice', 'collect_payment', 'generate_report', 'monitor_activity'],
    spending_limit_daily: 500000,
    spending_limit_per_tx: 100000,
    spent_today: 87500,
    actions_today: 12,
    total_actions: 342,
    total_volume: 4250000,
    created_at: randomDate(60),
    last_active_at: randomDate(0),
  },
  {
    id: 'agent_002',
    name: 'Payment Bot',
    description: 'Executes scheduled outbound payments to vendors, handles subscription renewals, and processes approved refunds automatically.',
    status: 'active',
    wallet_address: agentWallets[1],
    wallet_balance: 1820000,
    chain: 'base',
    capabilities: ['send_payment', 'issue_refund', 'manage_subscriptions'],
    spending_limit_daily: 2000000,
    spending_limit_per_tx: 500000,
    spent_today: 320000,
    actions_today: 5,
    total_actions: 189,
    total_volume: 8920000,
    created_at: randomDate(45),
    last_active_at: randomDate(0),
  },
  {
    id: 'agent_003',
    name: 'Finance Reporter',
    description: 'Generates daily revenue summaries, weekly P&L reports, and monitors transaction anomalies across all networks.',
    status: 'active',
    wallet_address: agentWallets[2],
    wallet_balance: 50000,
    chain: 'base',
    capabilities: ['generate_report', 'monitor_activity'],
    spending_limit_daily: 10000,
    spending_limit_per_tx: 5000,
    spent_today: 0,
    actions_today: 3,
    total_actions: 156,
    total_volume: 0,
    created_at: randomDate(30),
    last_active_at: randomDate(0),
  },
  {
    id: 'agent_004',
    name: 'Vendor Payer',
    description: 'Handles batch vendor payments on a weekly schedule. Currently paused for wallet top-up.',
    status: 'paused',
    wallet_address: agentWallets[3],
    wallet_balance: 1200,
    chain: 'ethereum',
    capabilities: ['send_payment'],
    spending_limit_daily: 1000000,
    spending_limit_per_tx: 250000,
    spent_today: 0,
    actions_today: 0,
    total_actions: 67,
    total_volume: 3400000,
    created_at: randomDate(90),
    last_active_at: randomDate(3),
  },
];

export const mockAgentActions = ([
  { id: 'aa_001', agent_id: 'agent_001', agent_name: 'Invoice Autopilot', type: 'invoice_created', status: 'completed', title: 'Created invoice for Acme Inc', description: 'Auto-generated monthly consulting invoice for $2,500.00 USDC', entity_id: 'inv_001', entity_type: 'invoice', amount: 250000, tx_hash: null, created_at: randomDate(0) },
  { id: 'aa_002', agent_id: 'agent_002', agent_name: 'Payment Bot', type: 'payment_sent', status: 'completed', title: 'Vendor payment to Studio Z', description: 'Scheduled weekly payment of $1,200.00 USDC to connected account ca_006', entity_id: 'pi_008', entity_type: 'payment', amount: 120000, tx_hash: `0x${Math.random().toString(16).slice(2)}`, created_at: randomDate(0) },
  { id: 'aa_003', agent_id: 'agent_003', agent_name: 'Finance Reporter', type: 'report_generated', status: 'completed', title: 'Daily revenue report generated', description: 'Summary: $12,543.20 total volume, 342 payments, 89 active customers', entity_id: null, entity_type: 'report', amount: null, tx_hash: null, created_at: randomDate(0) },
  { id: 'aa_004', agent_id: 'agent_001', agent_name: 'Invoice Autopilot', type: 'reminder_sent', status: 'completed', title: 'Payment reminder sent', description: 'Sent overdue reminder to user3@example.com for invoice inv_003 ($890.00)', entity_id: 'inv_003', entity_type: 'invoice', amount: 89000, tx_hash: null, created_at: randomDate(0) },
  { id: 'aa_005', agent_id: 'agent_002', agent_name: 'Payment Bot', type: 'refund_issued', status: 'completed', title: 'Auto-refund processed', description: 'Approved refund of $45.00 USDC for duplicate charge on pi_012', entity_id: 'ref_005', entity_type: 'refund', amount: 4500, tx_hash: `0x${Math.random().toString(16).slice(2)}`, created_at: randomDate(1) },
  { id: 'aa_006', agent_id: 'agent_003', agent_name: 'Finance Reporter', type: 'anomaly_detected', status: 'completed', title: 'Unusual activity flagged', description: 'Detected 3x spike in failed transactions from 0xdead...beef. Flagged for review.', entity_id: 'cus_004', entity_type: null, amount: null, tx_hash: null, created_at: randomDate(1) },
  { id: 'aa_007', agent_id: 'agent_002', agent_name: 'Payment Bot', type: 'subscription_renewed', status: 'completed', title: 'Subscription billing collected', description: 'Collected $99.00 USDC for Professional plan renewal (sub_002)', entity_id: 'sub_002', entity_type: 'subscription', amount: 9900, tx_hash: `0x${Math.random().toString(16).slice(2)}`, created_at: randomDate(1) },
  { id: 'aa_008', agent_id: 'agent_001', agent_name: 'Invoice Autopilot', type: 'invoice_created', status: 'completed', title: 'Batch invoices created', description: 'Auto-generated 4 invoices for end-of-month billing cycle totaling $8,200.00', entity_id: 'inv_005', entity_type: 'invoice', amount: 820000, tx_hash: null, created_at: randomDate(2) },
  { id: 'aa_009', agent_id: 'agent_002', agent_name: 'Payment Bot', type: 'payment_sent', status: 'failed', title: 'Payment failed — insufficient balance', description: 'Attempted $5,000.00 USDC payment to vendor but agent wallet balance too low', entity_id: null, entity_type: 'payment', amount: 500000, tx_hash: null, created_at: randomDate(2) },
  { id: 'aa_010', agent_id: 'agent_001', agent_name: 'Invoice Autopilot', type: 'payment_collected', status: 'completed', title: 'Invoice payment received', description: 'Invoice inv_007 paid by customer wallet — $3,500.00 USDC collected', entity_id: 'inv_007', entity_type: 'invoice', amount: 350000, tx_hash: `0x${Math.random().toString(16).slice(2)}`, created_at: randomDate(3) },
  { id: 'aa_011', agent_id: 'agent_003', agent_name: 'Finance Reporter', type: 'report_generated', status: 'completed', title: 'Weekly P&L report', description: 'Revenue: $34,210.00 | Refunds: $1,240.00 | Net: $32,970.00 | Fees collected: $329.70', entity_id: null, entity_type: 'report', amount: null, tx_hash: null, created_at: randomDate(4) },
  { id: 'aa_012', agent_id: 'agent_002', agent_name: 'Payment Bot', type: 'payment_sent', status: 'pending', title: 'Scheduled payment queued', description: 'Weekly vendor payment of $2,800.00 USDC queued for execution at next block', entity_id: null, entity_type: 'payment', amount: 280000, tx_hash: null, created_at: randomDate(0) },
] as AgentAction[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

// Transfers (Send Money)

export const mockSavedRecipients: SavedRecipient[] = [
  { id: 'rcpt_001', label: 'Vendor A — Studio Z', full_name: 'Sarah Chen', email: 'sarah@studioz.com', address: '0xfeed9876face5432feed9876face5432feed9876', chain: 'base', total_sent: 1250000, transfer_count: 8, last_sent_at: randomDate(2), created_at: randomDate(60) },
  { id: 'rcpt_002', label: 'Freelancer — Jake M.', full_name: 'Jake Morrison', email: 'jake.m@gmail.com', address: '0xcafe1234babe5678cafe1234babe5678cafe1234', chain: 'base', total_sent: 480000, transfer_count: 4, last_sent_at: randomDate(5), created_at: randomDate(45) },
  { id: 'rcpt_003', label: 'Partner Co Treasury', full_name: 'Lisa Park', email: 'treasury@partnerco.io', address: '0xabcdef1234567890abcdef1234567890abcdef12', chain: 'ethereum', total_sent: 5000000, transfer_count: 12, last_sent_at: randomDate(1), created_at: randomDate(90) },
  { id: 'rcpt_004', label: 'Marketing Agency', full_name: 'David Okonkwo', email: 'billing@adagency.co', address: '0xdeadbeef12345678deadbeef12345678deadbeef', chain: 'polygon', total_sent: 750000, transfer_count: 3, last_sent_at: randomDate(14), created_at: randomDate(30) },
  { id: 'rcpt_005', label: 'Employee Payroll Wallet', full_name: 'Maria Rodriguez', email: 'payroll@acme.com', address: '0x9876543210fedcba9876543210fedcba98765432', chain: 'arbitrum', total_sent: 3200000, transfer_count: 16, last_sent_at: randomDate(0), created_at: randomDate(120) },
  { id: 'rcpt_006', label: 'AWS Cloud Credits', full_name: 'Tom Nguyen', email: null, address: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12', chain: 'optimism', total_sent: 190000, transfer_count: 2, last_sent_at: randomDate(20), created_at: randomDate(40) },
];

export const mockTransfers: Transfer[] = Array.from({ length: 20 }, (_, i) => {
  const currency = pickCurrency();
  const amount = amountFor(currency);
  const fee = Math.max(1, Math.floor(amount * 0.001));
  const statuses: Transfer['status'][] = ['completed', 'completed', 'completed', 'completed', 'pending', 'confirming', 'failed'];
  const status = statuses[Math.floor(Math.random() * statuses.length)] as Transfer['status'];
  const chain = chainFor(currency);
  const created = randomDate(30);
  const recipient = mockSavedRecipients[Math.floor(Math.random() * mockSavedRecipients.length)];

  return {
    id: `txfr_${String(i + 1).padStart(3, '0')}${Math.random().toString(36).slice(2, 8)}`,
    recipient_address: recipient.address,
    recipient_label: Math.random() > 0.3 ? recipient.label : null,
    amount,
    fee,
    net_amount: amount + fee,
    chain,
    currency,
    status,
    tx_hash: ['completed', 'confirming'].includes(status) ? `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}` : null,
    memo: ['Vendor payment', 'Monthly retainer', 'Invoice settlement', 'Payroll', null, null][Math.floor(Math.random() * 6)],
    created_at: created,
    confirmed_at: status === 'completed' ? new Date(new Date(created).getTime() + 5000).toISOString() : null,
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

// Email Receipts

export const mockReceiptSettings: ReceiptSettings = {
  auto_send: true,
  from_name: 'Acme Corp',
  reply_to: 'support@acme.com',
  bcc_email: 'receipts@acme.com',
  subject_template: 'Your receipt from {{merchant}} — {{amount}}',
  footer_message: 'Thank you for your business. Questions? Reply to this email.',
  include_tx_link: true,
  attach_pdf: true,
};

export const mockReceipts: Receipt[] = mockPayments
  .filter(p => p.status === 'succeeded' && p.customer_email)
  .map((p) => {
    // Most receipts land; a few fail or bounce so the UI shows real states.
    const roll = Math.random();
    const status: Receipt['status'] =
      roll > 0.88 ? 'bounced' : roll > 0.82 ? 'failed' : roll > 0.72 ? 'pending' :
      roll > 0.45 ? 'opened' : roll > 0.2 ? 'delivered' : 'sent';

    const failed = status === 'failed' || status === 'bounced';
    const sentAt = status === 'pending' ? null : new Date(new Date(p.created_at).getTime() + 4000).toISOString();

    const id = receiptIdForPayment(p.id);

    return {
      id,
      payment_intent_id: p.id,
      customer_email: p.customer_email!,
      status,
      amount: p.amount,
      chain: p.chain,
      currency: p.currency,
      tx_hash: p.tx_hash,
      receipt_url: `/r/${id}`,
      sent_at: sentAt,
      delivered_at: ['delivered', 'opened'].includes(status) && sentAt
        ? new Date(new Date(sentAt).getTime() + 2000).toISOString() : null,
      opened_at: status === 'opened' && sentAt
        ? new Date(new Date(sentAt).getTime() + 900000).toISOString() : null,
      attempts: failed ? 3 : status === 'pending' ? 0 : 1,
      error_message: status === 'bounced'
        ? 'Recipient mailbox does not exist (SMTP 550)'
        : status === 'failed'
          ? 'Delivery timed out after 3 attempts'
          : null,
      created_at: p.created_at,
    };
  })
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

// Team

export const mockTeamMembers: TeamMember[] = [
  { id: 'tm_001', name: 'Alex Chen', email: 'admin@acme.com', role: 'owner', status: 'active', two_factor_enabled: true, last_active_at: randomDate(0), invited_by: null, invite_expires_at: null, created_at: randomDate(400) },
  { id: 'tm_002', name: 'Priya Raman', email: 'finance@acme.com', role: 'finance', status: 'active', two_factor_enabled: true, last_active_at: randomDate(1), invited_by: 'Alex Chen', invite_expires_at: null, created_at: randomDate(220) },
  { id: 'tm_003', name: 'Marcus Webb', email: 'dev@acme.com', role: 'developer', status: 'active', two_factor_enabled: false, last_active_at: randomDate(2), invited_by: 'Alex Chen', invite_expires_at: null, created_at: randomDate(150) },
  { id: 'tm_004', name: 'Sofia Almeida', email: 'support@acme.com', role: 'viewer', status: 'active', two_factor_enabled: false, last_active_at: randomDate(6), invited_by: 'Priya Raman', invite_expires_at: null, created_at: randomDate(90) },
  { id: 'tm_005', name: 'Daniel Okafor', email: 'ops@acme.com', role: 'admin', status: 'active', two_factor_enabled: true, last_active_at: randomDate(0), invited_by: 'Alex Chen', invite_expires_at: null, created_at: randomDate(60) },
  { id: 'tm_006', name: 'Yuki Tanaka', email: 'yuki@acme.com', role: 'finance', status: 'invited', two_factor_enabled: false, last_active_at: null, invited_by: 'Alex Chen', invite_expires_at: new Date(Date.now() + 46 * 3600_000).toISOString(), created_at: randomDate(2) },
  { id: 'tm_007', name: 'Tom Baptiste', email: 'tom.b@acme.com', role: 'viewer', status: 'invited', two_factor_enabled: false, last_active_at: null, invited_by: 'Daniel Okafor', invite_expires_at: new Date(Date.now() + 5 * 3600_000).toISOString(), created_at: randomDate(3) },
  { id: 'tm_008', name: 'Rachel Stone', email: 'rachel@acme.com', role: 'admin', status: 'suspended', two_factor_enabled: true, last_active_at: randomDate(45), invited_by: 'Alex Chen', invite_expires_at: null, created_at: randomDate(300) },
];

// Product Catalog

export const mockCatalogCategories: CatalogCategory[] = [
  { id: 'cat_001', name: 'Software & Licences', description: 'Recurring plans, seats, and licence keys', accent: 'blue', created_at: randomDate(180) },
  { id: 'cat_002', name: 'Professional Services', description: 'Consulting, implementation, and support hours', accent: 'violet', created_at: randomDate(180) },
  { id: 'cat_003', name: 'Hardware', description: 'Physical devices and accessories', accent: 'emerald', created_at: randomDate(150) },
  { id: 'cat_004', name: 'Training', description: 'Workshops, courses, and certification', accent: 'amber', created_at: randomDate(120) },
  { id: 'cat_005', name: 'Add-ons', description: 'Optional extras billed on top of a plan', accent: 'rose', created_at: randomDate(90) },
];

type SeedItem = [string, string, string, CatalogItem['type'], string, number, Currency, string];

const catalogSeed: SeedItem[] = [
  // name, description, sku, type, category, price, currency, unit
  ['Starter Plan', 'Up to 1,000 monthly transactions with standard support.', 'SW-START', 'product', 'cat_001', 2_900, 'USDC', 'per month'],
  ['Professional Plan', 'Up to 25,000 monthly transactions, priority support, and custom branding.', 'SW-PRO', 'product', 'cat_001', 9_900, 'USDC', 'per month'],
  ['Enterprise Plan', 'Unlimited volume, dedicated infrastructure, and an account manager.', 'SW-ENT', 'product', 'cat_001', 29_900, 'USDC', 'per month'],
  ['Additional Seat', 'One extra dashboard user beyond your plan allowance.', 'SW-SEAT', 'product', 'cat_005', 1_200, 'USDC', 'per seat / month'],
  ['EU Data Residency', 'Store and process all payment data within the EU.', 'AD-EUDR', 'product', 'cat_005', 15_000, 'EURC', 'per month'],

  ['Integration Consulting', 'Hands-on help wiring Chain Payments into your stack.', 'PS-INTEG', 'service', 'cat_002', 18_000, 'USDC', 'per hour'],
  ['Migration Service', 'Move existing customers and subscriptions from another processor.', 'PS-MIGR', 'service', 'cat_002', 450_000, 'USDC', 'fixed fee'],
  ['Smart Contract Review', 'Security review of your payment contracts by our engineers.', 'PS-AUDIT', 'service', 'cat_002', 320_000, 'EURC', 'per engagement'],
  ['Priority Support Retainer', 'Guaranteed 2-hour response, 24/7, with a named engineer.', 'PS-RETAIN', 'service', 'cat_002', 75_000, 'USDC', 'per month'],

  ['Point-of-Sale Terminal', 'Countertop terminal with QR checkout and receipt printer.', 'HW-POS1', 'product', 'cat_003', 34_900, 'USDC', 'each'],
  ['Card Reader (Bluetooth)', 'Portable reader that pairs with the mobile app.', 'HW-READ', 'product', 'cat_003', 7_900, 'USDC', 'each'],
  ['Terminal Stand', 'Weighted stand with cable routing for the POS terminal.', 'HW-STAND', 'product', 'cat_003', 4_500, 'USDC', 'each'],

  ['Onboarding Workshop', 'Half-day session getting your team live on the platform.', 'TR-ONBRD', 'service', 'cat_004', 120_000, 'USDC', 'per session'],
  ['Developer Certification', 'Two-day course plus certification exam for your engineers.', 'TR-CERT', 'service', 'cat_004', 98_000, 'JPYC', 'per attendee'],
  ['Remittance Partner Training', 'Field training for agents handling gourde settlements.', 'TR-REMIT', 'service', 'cat_004', 1_450_000, 'HTGC', 'per session'],
];

export const mockCatalogItems: CatalogItem[] = catalogSeed.map(
  ([name, description, sku, type, category_id, price, currency, unit], i) => {
    const unitsSold = Math.floor(Math.random() * 220) + (i < 5 ? 40 : 2);
    return {
      id: `item_${String(i + 1).padStart(3, '0')}`,
      name,
      description,
      sku,
      type,
      category_id,
      price,
      currency,
      unit,
      active: Math.random() > 0.12,
      units_sold: unitsSold,
      revenue: unitsSold * price,
      trend_30d: Math.round((Math.random() * 70 - 25) * 10) / 10,
      last_sold_at: unitsSold > 0 ? randomDate(21) : null,
      created_at: randomDate(160),
    };
  },
);

export const mockVolumeChart = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toISOString().split('T')[0],
    volume: Math.floor(Math.random() * 50000) + 20000,
    count: Math.floor(Math.random() * 20) + 5,
  };
});

function buildActionItems(): ActionItem[] {
  const items: ActionItem[] = [];
  let idx = 0;

  for (const p of mockPayments.filter(p => p.status === 'failed')) {
    items.push({
      id: `act_${++idx}`,
      category: 'failed_transaction',
      priority: 'high',
      title: `Failed payment ${p.id}`,
      description: `Transaction of ${(p.amount / 100).toFixed(2)} USDC on ${p.chain} reverted. Customer may need assistance retrying.`,
      entity_id: p.id,
      entity_type: 'payment',
      href: `/dashboard/payments/${p.id}`,
      amount: p.amount,
      created_at: p.created_at,
      resolved: false,
    });
  }

  for (const c of mockCustomers.filter(c => c.risk_level === 'high')) {
    items.push({
      id: `act_${++idx}`,
      category: 'flagged_activity',
      priority: 'critical',
      title: `High-risk wallet: ${c.wallet_address.slice(0, 10)}...`,
      description: `Customer ${c.id} flagged as high risk with ${c.payment_count} payments and $${(c.lifetime_value / 100).toFixed(2)} lifetime value. Review activity.`,
      entity_id: c.id,
      entity_type: 'customer',
      href: `/dashboard/customers/${c.id}`,
      amount: c.lifetime_value,
      created_at: c.last_payment_at,
      resolved: false,
    });
  }

  for (const c of mockCustomers.filter(c => !c.email && c.payment_count > 5)) {
    items.push({
      id: `act_${++idx}`,
      category: 'kyc_review',
      priority: 'medium',
      title: `Unverified high-volume wallet`,
      description: `Customer ${c.id} has ${c.payment_count} payments but no email on file. Consider requesting identity verification.`,
      entity_id: c.id,
      entity_type: 'customer',
      href: `/dashboard/customers/${c.id}`,
      created_at: c.last_payment_at,
      resolved: false,
    });
  }

  for (const inv of mockInvoices.filter(inv => inv.status === 'overdue')) {
    items.push({
      id: `act_${++idx}`,
      category: 'overdue_invoice',
      priority: 'high',
      title: `Invoice ${inv.id} overdue`,
      description: `${inv.customer_email} owes ${(inv.amount / 100).toFixed(2)} USDC. Due date has passed — send a reminder or void.`,
      entity_id: inv.id,
      entity_type: 'invoice',
      href: `/dashboard/invoices`,
      amount: inv.amount,
      created_at: inv.due_date,
      resolved: false,
    });
  }

  for (const r of mockRefunds.filter(r => r.status === 'failed')) {
    items.push({
      id: `act_${++idx}`,
      category: 'dispute',
      priority: 'critical',
      title: `Refund ${r.id} failed`,
      description: `Refund of ${(r.amount / 100).toFixed(2)} USDC for payment ${r.payment_intent_id} could not be processed. Customer is waiting.`,
      entity_id: r.id,
      entity_type: 'refund',
      href: `/dashboard/refunds`,
      amount: r.amount,
      created_at: r.created_at,
      resolved: false,
    });
  }

  for (const r of mockRefunds.filter(r => r.status === 'awaiting_claim' && r.claim_expires_at)) {
    const hoursLeft = (new Date(r.claim_expires_at!).getTime() - Date.now()) / 3600000;
    if (hoursLeft < 12 && hoursLeft > 0) {
      items.push({
        id: `act_${++idx}`,
        category: 'dispute',
        priority: 'high',
        title: `Refund claim expiring soon`,
        description: `Refund ${r.id} claim link expires in ${Math.floor(hoursLeft)}h. Notify the customer before funds return to you.`,
        entity_id: r.id,
        entity_type: 'refund',
        href: `/dashboard/refunds`,
        amount: r.amount,
        created_at: r.created_at,
        resolved: false,
      });
    }
  }

  for (const po of mockPayouts.filter(po => po.status === 'failed')) {
    items.push({
      id: `act_${++idx}`,
      category: 'payout_issue',
      priority: 'critical',
      title: `Payout ${po.id} failed`,
      description: `Payout of ${(po.amount / 100).toFixed(2)} USDC to ${po.recipient_address.slice(0, 10)}... did not complete. Retry or investigate.`,
      entity_id: po.id,
      entity_type: 'payout',
      href: `/dashboard`,
      amount: po.amount,
      created_at: po.created_at,
      resolved: false,
    });
  }

  for (const h of mockHolds.filter(h => h.status === 'active')) {
    const hoursLeft = (new Date(h.expires_at).getTime() - Date.now()) / 3600000;
    if (hoursLeft < 24 && hoursLeft > 0) {
      items.push({
        id: `act_${++idx}`,
        category: 'expiring_hold',
        priority: 'high',
        title: `Hold ${h.id} expiring soon`,
        description: `Hold of ${(h.amount / 100).toFixed(2)} USDC expires in ${Math.floor(hoursLeft)}h. Capture or release before auto-expiry.`,
        entity_id: h.id,
        entity_type: 'hold',
        href: `/dashboard/holds`,
        amount: h.amount,
        created_at: h.created_at,
        resolved: false,
      });
    }
  }

  for (const sub of mockSubscriptions.filter(s => s.status === 'past_due')) {
    items.push({
      id: `act_${++idx}`,
      category: 'subscription_dunning',
      priority: 'medium',
      title: `Subscription ${sub.id} past due`,
      description: `${sub.plan_name} plan for customer ${sub.customer_id} — retry ${sub.retry_count}/${sub.max_retries}. May cancel if not resolved.`,
      entity_id: sub.id,
      entity_type: 'subscription',
      href: `/dashboard/subscriptions`,
      amount: sub.amount,
      created_at: sub.current_period_end,
      resolved: false,
    });
  }

  for (const wl of mockWebhookLogs.filter(w => !w.success).slice(0, 3)) {
    items.push({
      id: `act_${++idx}`,
      category: 'webhook_failure',
      priority: 'medium',
      title: `Webhook delivery failed (${wl.event_type})`,
      description: `Endpoint ${wl.endpoint_id} returned HTTP ${wl.status_code} for ${wl.event_type}. Events may not be processed by your backend.`,
      entity_id: wl.id,
      entity_type: 'webhook',
      href: `/dashboard/developer`,
      created_at: wl.created_at,
      resolved: false,
    });
  }

  for (const ca of mockConnectedAccounts.filter(a => a.status === 'onboarding')) {
    items.push({
      id: `act_${++idx}`,
      category: 'account_review',
      priority: 'low',
      title: `${ca.label} onboarding incomplete`,
      description: `Connected account ${ca.id} has not completed onboarding. Review and assist or remove.`,
      entity_id: ca.id,
      entity_type: 'account',
      href: `/dashboard/connect`,
      created_at: ca.created_at,
      resolved: false,
    });
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return items;
}

export const mockActionItems: ActionItem[] = buildActionItems();
