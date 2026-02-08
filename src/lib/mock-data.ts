import type {
  PaymentIntent, Refund, Customer, PaymentLink, Invoice,
  WebhookEndpoint, ApiKey, WebhookLog, TimelineEvent, DashboardKPIs,
  Chain, Hold, Subscription, Plan, ConnectedAccount, Payout,
} from '@/types';

const chains: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];
const addresses = [
  '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
  '0x9876543210fedcba9876543210fedcba98765432',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  '0xdeadbeef12345678deadbeef12345678deadbeef',
  '0xcafe1234babe5678cafe1234babe5678cafe1234',
  '0xfeed9876face5432feed9876face5432feed9876',
];

const merchantAddress = '0x7777777777777777777777777777777777777777';

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

export const mockPayments: PaymentIntent[] = Array.from({ length: 50 }, (_, i) => {
  const amount = Math.floor(Math.random() * 100000) + 100;
  const fee = Math.floor(amount * 0.001);
  const statuses: PaymentIntent['status'][] = ['succeeded', 'succeeded', 'succeeded', 'pending', 'failed', 'expired', 'awaiting_payment'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const chain = chains[Math.floor(Math.random() * chains.length)];
  const created = randomDate(30);

  return {
    id: `pi_${String(i + 1).padStart(3, '0')}${Math.random().toString(36).slice(2, 10)}`,
    amount,
    status,
    chain,
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
    receipt_url: status === 'succeeded' ? `https://pay.chainpayments.com/receipt/r_${i}` : null,
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export const mockRefunds: Refund[] = Array.from({ length: 15 }, (_, i) => {
  const payment = mockPayments.filter(p => p.status === 'succeeded')[i % 10];
  const methods: Refund['method'][] = ['direct', 'claimable', 'claimable'];
  const method = methods[Math.floor(Math.random() * methods.length)];
  const statuses: Refund['status'][] = ['completed', 'processing', 'awaiting_claim', 'failed', 'expired'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    id: `ref_${String(i + 1).padStart(3, '0')}${Math.random().toString(36).slice(2, 8)}`,
    payment_intent_id: payment?.id || `pi_unknown`,
    amount: payment ? Math.floor(payment.amount * (Math.random() > 0.5 ? 1 : 0.5)) : 5000,
    method,
    status,
    claim_link: method === 'claimable' ? `https://pay.chainpayments.com/claim/ref_${i}` : null,
    claim_expires_at: method === 'claimable' ? new Date(Date.now() + 86400000).toISOString() : null,
    claimed_by: status === 'completed' && method === 'claimable' ? addresses[Math.floor(Math.random() * addresses.length)] : null,
    reason: ['Customer requested', 'Duplicate charge', 'Service not rendered', 'Other'][Math.floor(Math.random() * 4)],
    tx_hash: ['completed', 'processing'].includes(status) ? `0x${Math.random().toString(16).slice(2)}` : null,
    created_at: randomDate(14),
    completed_at: status === 'completed' ? randomDate(7) : null,
  };
}).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

export const mockPaymentLinks: PaymentLink[] = Array.from({ length: 8 }, (_, i) => ({
  id: `pl_${String(i + 1).padStart(3, '0')}`,
  name: ['Pro Plan', 'Starter Plan', 'Donation', 'Event Ticket', 'Consultation Fee', 'Workshop', 'Merch', 'Custom'][i],
  amount: [9900, 2900, null, 5000, 15000, 7500, 3500, null][i],
  currency: 'USDC',
  url: `https://pay.chainpayments.com/link/pl_${i + 1}`,
  active: Math.random() > 0.2,
  chains: ['base', 'ethereum'] as Chain[],
  payment_count: Math.floor(Math.random() * 100),
  total_collected: Math.floor(Math.random() * 1000000),
  created_at: randomDate(60),
}));

export const mockInvoices: Invoice[] = Array.from({ length: 12 }, (_, i) => {
  const statuses: Invoice['status'][] = ['paid', 'sent', 'draft', 'overdue', 'void'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const amount = Math.floor(Math.random() * 100000) + 1000;
  return {
    id: `inv_${String(i + 1).padStart(3, '0')}`,
    customer_id: `cus_${String((i % 10) + 1).padStart(3, '0')}`,
    customer_email: `user${(i % 10) + 1}@example.com`,
    amount,
    status,
    due_date: new Date(Date.now() + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 30) * 86400000).toISOString(),
    paid_at: status === 'paid' ? randomDate(7) : null,
    payment_intent_id: status === 'paid' ? mockPayments[i % mockPayments.length]?.id : null,
    items: [
      { description: 'Consulting Services', quantity: 1, unit_price: amount, amount },
    ],
    memo: Math.random() > 0.5 ? 'Thank you for your business' : null,
    created_at: randomDate(30),
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
  const amount = Math.floor(Math.random() * 50000) + 1000;
  const statuses: Hold['status'][] = ['active', 'active', 'captured', 'released', 'expired'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const capturedAmount = status === 'captured' ? amount : status === 'released' ? 0 : 0;
  const releasedAmount = status === 'released' ? amount : 0;
  return {
    id: `hold_${String(i + 1).padStart(3, '0')}`,
    amount,
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

export const mockVolumeChart = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toISOString().split('T')[0],
    volume: Math.floor(Math.random() * 50000) + 20000,
    count: Math.floor(Math.random() * 20) + 5,
  };
});
