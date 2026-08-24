/**
 * Developer documentation content.
 *
 * One source of truth for the docs site, the API reference, and the sandbox
 * explorer. The endpoint registry below mirrors the handlers in `src/app/api`,
 * so the sandbox can call the same endpoints the reference documents — if a
 * route changes, the docs and the explorer move together instead of drifting.
 */

import type { Chain } from '@/types';

// ---------------------------------------------------------------------------
// Product catalogue
// ---------------------------------------------------------------------------

export type DevCategoryId =
  | 'payments'
  | 'revenue'
  | 'platforms'
  | 'money-management'
  | 'resources';

export interface DevCategory {
  id: DevCategoryId;
  name: string;
  /** One line describing what this whole group is for. */
  tagline: string;
  /** lucide icon name, resolved in the page. */
  icon: string;
  accent: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export const DEV_CATEGORIES: DevCategory[] = [
  {
    id: 'payments',
    name: 'Payments',
    tagline: 'Take stablecoin payments online, in person, or from an agent.',
    icon: 'CreditCard',
    accent: 'blue',
  },
  {
    id: 'revenue',
    name: 'Revenue',
    tagline: 'Bill customers, collect recurring payments, and report on it.',
    icon: 'TrendingUp',
    accent: 'violet',
  },
  {
    id: 'platforms',
    name: 'Platforms and marketplaces',
    tagline: 'Onboard sellers, split payments, and pay them out.',
    icon: 'GitBranch',
    accent: 'emerald',
  },
  {
    id: 'money-management',
    name: 'Money management',
    tagline: 'Hold balances, move funds between chains, and send money out.',
    icon: 'Wallet',
    accent: 'amber',
  },
  {
    id: 'resources',
    name: 'Developer resources',
    tagline: 'The API, the sandbox, webhooks, and everything to build against.',
    icon: 'Code2',
    accent: 'slate',
  },
];

export type ProductStatus = 'ga' | 'beta' | 'preview';

export interface DevProduct {
  slug: string;
  name: string;
  category: DevCategoryId;
  /** One sentence, written for someone deciding whether they need this. */
  tagline: string;
  icon: string;
  status: ProductStatus;
  /** Where it lives in the dashboard, if it has a UI. */
  dashboardHref?: string;
}

export const DEV_PRODUCTS: DevProduct[] = [
  // Payments
  {
    slug: 'checkout',
    name: 'Checkout',
    category: 'payments',
    tagline: 'A hosted payment page that handles wallet connection, network switching, and confirmation.',
    icon: 'ShoppingCart',
    status: 'ga',
  },
  {
    slug: 'payment-links',
    name: 'Payment Links',
    category: 'payments',
    tagline: 'Shareable URLs that collect a fixed or customer-chosen amount, with no code at all.',
    icon: 'Link',
    status: 'ga',
    dashboardHref: '/dashboard/payment-links',
  },
  {
    slug: 'payment-intents',
    name: 'Payment Intents',
    category: 'payments',
    tagline: 'The API primitive behind every payment: one object tracking an amount from creation to confirmation.',
    icon: 'CreditCard',
    status: 'ga',
    dashboardHref: '/dashboard/payments',
  },
  {
    slug: 'holds',
    name: 'Holds',
    category: 'payments',
    tagline: 'Authorize an amount now and capture it later, for orders you cannot price up front.',
    icon: 'ShieldCheck',
    status: 'beta',
    dashboardHref: '/dashboard/holds',
  },
  {
    slug: 'refunds',
    name: 'Refunds and claim links',
    category: 'payments',
    tagline: 'Push funds back to the paying wallet, or send a claim link when the customer needs to choose an address.',
    icon: 'RotateCcw',
    status: 'ga',
    dashboardHref: '/dashboard/refunds',
  },
  {
    slug: 'agent-payments',
    name: 'Agent payments',
    category: 'payments',
    tagline: 'Accept payments initiated by AI agents, and tell them apart from wallet-initiated ones.',
    icon: 'Bot',
    status: 'preview',
    dashboardHref: '/dashboard/agents',
  },

  // Revenue
  {
    slug: 'invoicing',
    name: 'Invoicing',
    category: 'revenue',
    tagline: 'Issue invoices in any supported currency and get paid to a hosted invoice page.',
    icon: 'FileText',
    status: 'ga',
    dashboardHref: '/dashboard/invoices',
  },
  {
    slug: 'subscriptions',
    name: 'Subscriptions',
    category: 'revenue',
    tagline: 'Recurring billing with trials, retries, and dunning for on-chain payments.',
    icon: 'RefreshCw',
    status: 'ga',
    dashboardHref: '/dashboard/subscriptions',
  },
  {
    slug: 'catalog',
    name: 'Catalog',
    category: 'revenue',
    tagline: 'Products and services with prices and SKUs, so invoices are assembled rather than retyped.',
    icon: 'Package',
    status: 'ga',
    dashboardHref: '/dashboard/catalog',
  },
  {
    slug: 'receipts',
    name: 'Receipts',
    category: 'revenue',
    tagline: 'Email receipts with the transaction hash, sent automatically or on demand.',
    icon: 'Mail',
    status: 'ga',
  },
  {
    slug: 'reporting',
    name: 'Reporting',
    category: 'revenue',
    tagline: 'Volume, settlement, and fee data across every currency and chain you accept.',
    icon: 'BarChart3',
    status: 'ga',
    dashboardHref: '/dashboard/reporting',
  },

  // Platforms and marketplaces
  {
    slug: 'connect',
    name: 'Connect',
    category: 'platforms',
    tagline: 'Onboard connected accounts, route a share of each payment to them, and settle to their own wallets.',
    icon: 'GitBranch',
    status: 'ga',
    dashboardHref: '/dashboard/connect',
  },
  {
    slug: 'splits',
    name: 'Payment splits',
    category: 'platforms',
    tagline: 'Divide a single payment across recipients by basis points or flat amounts, on-chain and atomically.',
    icon: 'Split',
    status: 'ga',
  },
  {
    slug: 'payouts',
    name: 'Payouts',
    category: 'platforms',
    tagline: 'Pay connected accounts on your schedule, in the currency they hold.',
    icon: 'Banknote',
    status: 'ga',
  },

  // Money management
  {
    slug: 'wallets',
    name: 'Wallets',
    category: 'money-management',
    tagline: 'Managed MPC wallets or your own — where balances sit between settlement and payout.',
    icon: 'Wallet',
    status: 'ga',
    dashboardHref: '/dashboard/wallets',
  },
  {
    slug: 'transfers',
    name: 'Transfers',
    category: 'money-management',
    tagline: 'Send stablecoins to any address on any supported chain, like a wire that clears in seconds.',
    icon: 'Send',
    status: 'ga',
    dashboardHref: '/dashboard/send',
  },
  {
    slug: 'bridge',
    name: 'Bridge',
    category: 'money-management',
    tagline: 'Move a balance between chains without leaving the currency it is denominated in.',
    icon: 'ArrowLeftRight',
    status: 'beta',
    dashboardHref: '/dashboard/bridge',
  },
  {
    slug: 'multi-currency',
    name: 'Multi-currency',
    category: 'money-management',
    tagline: 'Hold and settle USDC, EURC, JPYC, and HTGC side by side, each in its own units.',
    icon: 'Coins',
    status: 'ga',
  },

  // Developer resources
  {
    slug: 'api-reference',
    name: 'API reference',
    category: 'resources',
    tagline: 'Every endpoint, parameter, and response shape, with runnable examples.',
    icon: 'Braces',
    status: 'ga',
  },
  {
    slug: 'sandbox',
    name: 'Sandbox',
    category: 'resources',
    tagline: 'A full test environment: test keys, funded test wallets, and simulated settlement.',
    icon: 'TestTube',
    status: 'ga',
    dashboardHref: '/dashboard/developer?tab=sandbox',
  },
  {
    slug: 'webhooks',
    name: 'Webhooks',
    category: 'resources',
    tagline: 'Get told when a payment settles, instead of polling for it.',
    icon: 'Webhook',
    status: 'ga',
    dashboardHref: '/dashboard/developer?tab=webhooks',
  },
  {
    slug: 'authentication',
    name: 'Authentication',
    category: 'resources',
    tagline: 'API keys, key modes, and how to keep the secret one secret.',
    icon: 'Key',
    status: 'ga',
    dashboardHref: '/dashboard/developer?tab=api-keys',
  },
  {
    slug: 'errors',
    name: 'Errors and idempotency',
    category: 'resources',
    tagline: 'What the API returns when something goes wrong, and how to retry without double-charging.',
    icon: 'AlertTriangle',
    status: 'ga',
  },
];

export function productsInCategory(id: DevCategoryId): DevProduct[] {
  return DEV_PRODUCTS.filter((p) => p.category === id);
}

export function getProduct(slug: string): DevProduct | undefined {
  return DEV_PRODUCTS.find((p) => p.slug === slug);
}

export function getCategory(id: DevCategoryId): DevCategory | undefined {
  return DEV_CATEGORIES.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// API endpoint registry
// ---------------------------------------------------------------------------

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface ApiParam {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  /** Allowed values, when the handler validates against a fixed set. */
  enum?: string[];
}

export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  /** Path as the API exposes it, e.g. /v1/payments. */
  path: string;
  /** Path on this app that actually serves it, for the sandbox explorer. */
  localPath: string;
  summary: string;
  category: DevCategoryId;
  /** Which product page this belongs to. */
  product: string;
  query?: ApiParam[];
  body?: ApiParam[];
  /** Illustrative response, shown in the reference. */
  sample?: Record<string, unknown>;
}

const PAGINATION: ApiParam[] = [
  { name: 'limit', type: 'integer', description: 'How many records to return. Defaults to 25.' },
  { name: 'offset', type: 'integer', description: 'How many records to skip, for paging. Defaults to 0.' },
];

export const CHAINS: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'list-payments',
    method: 'GET',
    path: '/v1/payments',
    localPath: '/api/payments',
    summary: 'List payments, newest first.',
    category: 'payments',
    product: 'payment-intents',
    query: [
      {
        name: 'status', type: 'string', description: 'Only payments in this state.',
        enum: ['awaiting_payment', 'pending', 'succeeded', 'failed', 'expired'],
      },
      { name: 'chain', type: 'string', description: 'Only payments settled on this network.', enum: CHAINS },
      { name: 'from', type: 'timestamp', description: 'Created at or after this ISO 8601 date.' },
      { name: 'to', type: 'timestamp', description: 'Created at or before this ISO 8601 date.' },
      { name: 'search', type: 'string', description: 'Matches id, description, customer email, or either address.' },
      ...PAGINATION,
    ],
  },
  {
    id: 'create-payment',
    method: 'POST',
    path: '/v1/payments',
    localPath: '/api/payments',
    summary: 'Create a payment intent for a customer to fulfil.',
    category: 'payments',
    product: 'payment-intents',
    body: [
      { name: 'amount', type: 'integer', required: true, description: 'Amount in the currency’s minor units. 5000 is $50.00 USDC; for JPYC it is ¥5,000.' },
      { name: 'chain', type: 'string', required: true, description: 'Network the payment settles on.', enum: CHAINS },
      { name: 'merchant_address', type: 'string', required: true, description: 'Where funds settle. A 0x-prefixed 40-character address.' },
      { name: 'description', type: 'string', description: 'Shown on checkout and the receipt.' },
      { name: 'customer_email', type: 'string', description: 'Sends a receipt here once the payment settles.' },
      { name: 'metadata', type: 'object', description: 'Up to 20 string key/value pairs, returned on every read.' },
    ],
  },
  {
    id: 'get-payment',
    method: 'GET',
    path: '/v1/payments/{id}',
    localPath: '/api/payments/{id}',
    summary: 'Retrieve one payment, including its confirmation progress.',
    category: 'payments',
    product: 'payment-intents',
  },
  {
    id: 'update-payment',
    method: 'PATCH',
    path: '/v1/payments/{id}',
    localPath: '/api/payments/{id}',
    summary: 'Update a payment’s metadata or description.',
    category: 'payments',
    product: 'payment-intents',
  },
  {
    id: 'list-payment-links',
    method: 'GET',
    path: '/v1/payment_links',
    localPath: '/api/payment-links',
    summary: 'List payment links.',
    category: 'payments',
    product: 'payment-links',
    query: [
      { name: 'active', type: 'boolean', description: 'Filter to enabled or disabled links.' },
      ...PAGINATION,
    ],
  },
  {
    id: 'create-payment-link',
    method: 'POST',
    path: '/v1/payment_links',
    localPath: '/api/payment-links',
    summary: 'Create a shareable payment link.',
    category: 'payments',
    product: 'payment-links',
    body: [
      { name: 'name', type: 'string', required: true, description: 'Shown to the customer as the reason for payment.' },
      { name: 'amount', type: 'integer', description: 'Minor units. Omit or pass null to let the customer choose.' },
      { name: 'currency', type: 'string', description: 'Defaults to USDC.', enum: ['USDC', 'EURC', 'JPYC', 'HTGC'] },
      { name: 'chains', type: 'array', description: 'Networks the customer may pay on. Must be networks the currency settles on.' },
    ],
  },
  {
    id: 'list-refunds',
    method: 'GET',
    path: '/v1/refunds',
    localPath: '/api/refunds',
    summary: 'List refunds, including unclaimed claim links.',
    category: 'payments',
    product: 'refunds',
    query: [
      {
        name: 'status', type: 'string', description: 'Only refunds in this state.',
        enum: ['created', 'processing', 'completed', 'failed', 'awaiting_claim', 'expired'],
      },
      { name: 'payment_intent_id', type: 'string', description: 'Refunds against one payment.' },
      ...PAGINATION,
    ],
  },
  {
    id: 'create-refund',
    method: 'POST',
    path: '/v1/refunds',
    localPath: '/api/refunds',
    summary: 'Refund a payment, in full or in part.',
    category: 'payments',
    product: 'refunds',
    body: [
      { name: 'payment_intent_id', type: 'string', required: true, description: 'The payment to refund.' },
      { name: 'amount', type: 'integer', required: true, description: 'Minor units to refund. Pass the payment’s full amount for a complete refund.' },
      {
        name: 'method', type: 'string', required: true,
        description: 'direct pushes funds back to the paying address; claimable issues a link the customer redeems to an address of their choosing.',
        enum: ['direct', 'claimable'],
      },
      { name: 'reason', type: 'string', required: true, description: 'Why the refund was issued. Stored on the refund and shown in the dashboard.' },
    ],
  },
  {
    id: 'list-holds',
    method: 'GET',
    path: '/v1/holds',
    localPath: '/api/holds',
    summary: 'List authorization holds.',
    category: 'payments',
    product: 'holds',
    query: [
      { name: 'status', type: 'string', description: 'Filter by hold state.', enum: ['active', 'captured', 'released', 'expired'] },
      ...PAGINATION,
    ],
  },
  {
    id: 'create-hold',
    method: 'POST',
    path: '/v1/holds',
    localPath: '/api/holds',
    summary: 'Place a hold against an authorized payment.',
    category: 'payments',
    product: 'holds',
    body: [
      { name: 'payment_id', type: 'string', required: true, description: 'The authorized payment to hold against.' },
      { name: 'amount', type: 'integer', required: true, description: 'Minor units to reserve.' },
      { name: 'duration', type: 'integer', required: true, description: 'Seconds until the hold expires and funds are released automatically.' },
    ],
  },

  {
    id: 'list-invoices',
    method: 'GET',
    path: '/v1/invoices',
    localPath: '/api/invoices',
    summary: 'List invoices.',
    category: 'revenue',
    product: 'invoicing',
    query: [
      { name: 'status', type: 'string', description: 'Filter by invoice state.', enum: ['draft', 'sent', 'paid', 'void', 'overdue'] },
      { name: 'customer_id', type: 'string', description: 'Invoices for one customer.' },
      ...PAGINATION,
    ],
  },
  {
    id: 'create-invoice',
    method: 'POST',
    path: '/v1/invoices',
    localPath: '/api/invoices',
    summary: 'Draft an invoice from line items.',
    category: 'revenue',
    product: 'invoicing',
    body: [
      { name: 'customer_email', type: 'string', description: 'Where the invoice is sent. Required only when the customer has no email on file.' },
      { name: 'customer_id', type: 'string', required: true, description: 'The customer being invoiced.' },
      { name: 'items', type: 'array', required: true, description: 'Line items of { description, quantity, unit_price, amount }, all in one currency.' },
      { name: 'due_date', type: 'timestamp', required: true, description: 'ISO 8601 date the invoice falls due.' },
      { name: 'memo', type: 'string', description: 'Free text shown on the invoice.' },
    ],
  },
  {
    id: 'list-subscriptions',
    method: 'GET',
    path: '/v1/subscriptions',
    localPath: '/api/subscriptions',
    summary: 'List subscriptions.',
    category: 'revenue',
    product: 'subscriptions',
    query: [
      { name: 'status', type: 'string', description: 'Filter by subscription state.', enum: ['active', 'past_due', 'canceled', 'expired', 'trialing'] },
      { name: 'search', type: 'string', description: 'Matches plan name or customer.' },
      ...PAGINATION,
    ],
  },
  {
    id: 'create-subscription',
    method: 'POST',
    path: '/v1/subscriptions',
    localPath: '/api/subscriptions',
    summary: 'Start a recurring charge against a customer.',
    category: 'revenue',
    product: 'subscriptions',
    body: [
      { name: 'customer_id', type: 'string', required: true, description: 'Who is being billed.' },
      { name: 'plan_name', type: 'string', required: true, description: 'Shown on invoices and receipts.' },
      { name: 'amount', type: 'integer', required: true, description: 'Minor units charged each interval.' },
      { name: 'interval', type: 'string', required: true, description: 'How often to bill.', enum: ['week', 'month', 'year'] },
    ],
  },
  {
    id: 'list-receipts',
    method: 'GET',
    path: '/v1/receipts',
    localPath: '/api/receipts',
    summary: 'List emailed receipts and their delivery state.',
    category: 'revenue',
    product: 'receipts',
    query: [
      { name: 'status', type: 'string', description: 'Filter by delivery state.', enum: ['sent', 'delivered', 'opened', 'pending', 'failed', 'bounced', 'not_sent'] },
      { name: 'payment_intent_id', type: 'string', description: 'Receipts for one payment.' },
      { name: 'email', type: 'string', description: 'Receipts sent to one address.' },
      ...PAGINATION,
    ],
  },
  {
    id: 'send-receipt',
    method: 'POST',
    path: '/v1/receipts',
    localPath: '/api/receipts',
    summary: 'Send — or preview — a receipt for a payment.',
    category: 'revenue',
    product: 'receipts',
    body: [
      { name: 'payment_intent_id', type: 'string', required: true, description: 'The settled payment to receipt.' },
      { name: 'email', type: 'string', description: 'Overrides the address on the payment.' },
      { name: 'preview', type: 'boolean', description: 'Render the email and return it without sending.' },
    ],
  },
  {
    id: 'list-customers',
    method: 'GET',
    path: '/v1/customers',
    localPath: '/api/customers',
    summary: 'List customers.',
    category: 'revenue',
    product: 'invoicing',
    query: [
      { name: 'search', type: 'string', description: 'Matches wallet address, email, or label.' },
      { name: 'risk_level', type: 'string', description: 'Filter by assessed risk.', enum: ['low', 'medium', 'high'] },
      { name: 'is_blocked', type: 'boolean', description: 'Only blocked, or only unblocked, customers.' },
      ...PAGINATION,
    ],
  },
  {
    id: 'create-customer',
    method: 'POST',
    path: '/v1/customers',
    localPath: '/api/customers',
    summary: 'Create a customer record keyed to a wallet address.',
    category: 'revenue',
    product: 'invoicing',
    body: [
      { name: 'wallet_address', type: 'string', required: true, description: 'The address that identifies this customer.' },
      { name: 'email', type: 'string', description: 'Used for receipts and invoices.' },
      { name: 'label', type: 'string', description: 'A human-readable name for your dashboard.' },
    ],
  },

  {
    id: 'list-connected-accounts',
    method: 'GET',
    path: '/v1/accounts',
    localPath: '/api/connect',
    summary: 'List connected accounts on your platform.',
    category: 'platforms',
    product: 'connect',
    query: [
      { name: 'status', type: 'string', description: 'Filter by onboarding state.', enum: ['onboarding', 'active', 'suspended'] },
      ...PAGINATION,
    ],
  },
  {
    id: 'create-connected-account',
    method: 'POST',
    path: '/v1/accounts',
    localPath: '/api/connect',
    summary: 'Onboard a seller onto your platform.',
    category: 'platforms',
    product: 'connect',
    body: [
      { name: 'wallet_address', type: 'string', required: true, description: 'The seller’s identifying address.' },
      { name: 'settlement_wallet', type: 'string', required: true, description: 'Where their share settles. May be the same as wallet_address.' },
      { name: 'label', type: 'string', required: true, description: 'Their display name on your platform.' },
    ],
  },
  {
    id: 'list-payouts',
    method: 'GET',
    path: '/v1/payouts',
    localPath: '/api/payouts',
    summary: 'List payouts to connected accounts.',
    category: 'platforms',
    product: 'payouts',
    query: [
      { name: 'status', type: 'string', description: 'Filter by payout state.', enum: ['pending', 'processing', 'completed', 'failed'] },
      ...PAGINATION,
    ],
  },
  {
    id: 'create-payout',
    method: 'POST',
    path: '/v1/payouts',
    localPath: '/api/payouts',
    summary: 'Pay a connected account.',
    category: 'platforms',
    product: 'payouts',
    body: [
      { name: 'recipient_address', type: 'string', required: true, description: 'Where the funds go.' },
      { name: 'amount', type: 'integer', required: true, description: 'Minor units to send.' },
      { name: 'chain', type: 'string', description: 'Network to send on. Defaults to base.', enum: CHAINS },
    ],
  },

  {
    id: 'list-webhooks',
    method: 'GET',
    path: '/v1/webhook_endpoints',
    localPath: '/api/webhooks',
    summary: 'List your webhook endpoints.',
    category: 'resources',
    product: 'webhooks',
    query: [{ name: 'active', type: 'boolean', description: 'Filter to enabled or disabled endpoints.' }],
  },
  {
    id: 'create-webhook',
    method: 'POST',
    path: '/v1/webhook_endpoints',
    localPath: '/api/webhooks',
    summary: 'Register an endpoint to receive events.',
    category: 'resources',
    product: 'webhooks',
    body: [
      { name: 'url', type: 'string', required: true, description: 'An HTTPS URL we POST events to.' },
      { name: 'events', type: 'array', required: true, description: 'Event types to subscribe to. See the event catalogue.' },
    ],
  },
];

export function endpointsForProduct(slug: string): ApiEndpoint[] {
  return API_ENDPOINTS.filter((e) => e.product === slug);
}

export function endpointsInCategory(id: DevCategoryId): ApiEndpoint[] {
  return API_ENDPOINTS.filter((e) => e.category === id);
}

// ---------------------------------------------------------------------------
// Webhook events
// ---------------------------------------------------------------------------

export interface WebhookEventType {
  type: string;
  description: string;
  category: DevCategoryId;
  /** The `data.object` we send for this event. */
  sample: Record<string, unknown>;
}

export const WEBHOOK_EVENTS: WebhookEventType[] = [
  {
    type: 'payment.succeeded',
    description: 'A payment reached the required number of confirmations. Fulfil the order here, not on checkout.opened.',
    category: 'payments',
    sample: {
      id: 'pi_3Nk2LmQ8',
      object: 'payment_intent',
      amount: 5000,
      currency: 'USDC',
      chain: 'base',
      status: 'succeeded',
      confirmations: 12,
      required_confirmations: 12,
      tx_hash: '0x8f2a…c41d',
      from_address: '0x71C7…976F',
      initiated_by: 'human',
    },
  },
  {
    type: 'payment.failed',
    description: 'The transaction reverted or never confirmed. The customer has not been charged.',
    category: 'payments',
    sample: {
      id: 'pi_3Nk2LmQ8',
      object: 'payment_intent',
      amount: 5000,
      currency: 'USDC',
      chain: 'base',
      status: 'failed',
      failure_reason: 'insufficient_balance',
    },
  },
  {
    type: 'payment.pending',
    description: 'The transaction is on-chain but has not reached the confirmation threshold yet.',
    category: 'payments',
    sample: {
      id: 'pi_3Nk2LmQ8',
      object: 'payment_intent',
      status: 'pending',
      confirmations: 3,
      required_confirmations: 12,
    },
  },
  {
    type: 'refund.created',
    description: 'A refund was initiated. For claimable refunds the funds have not moved yet.',
    category: 'payments',
    sample: {
      id: 're_1Kd9Xp',
      object: 'refund',
      payment_intent_id: 'pi_3Nk2LmQ8',
      amount: 5000,
      currency: 'USDC',
      method: 'claimable',
      status: 'awaiting_claim',
      claim_expires_at: '2026-09-07T12:00:00Z',
    },
  },
  {
    type: 'refund.completed',
    description: 'The customer has the money. For claim links, this fires when they redeem it.',
    category: 'payments',
    sample: {
      id: 're_1Kd9Xp',
      object: 'refund',
      status: 'completed',
      claimed_by: '0x71C7…976F',
      tx_hash: '0x44b1…9ae2',
    },
  },
  {
    type: 'hold.expiring',
    description: 'A hold is within an hour of expiry. Capture it or it releases automatically.',
    category: 'payments',
    sample: { id: 'hold_9Fj2', object: 'hold', status: 'active', amount: 12000, expires_at: '2026-08-24T18:00:00Z' },
  },
  {
    type: 'invoice.paid',
    description: 'An invoice was settled. Includes whether a wallet or an agent paid it.',
    category: 'revenue',
    sample: {
      id: 'inv_7Hs2Kd',
      object: 'invoice',
      amount: 320000,
      currency: 'EURC',
      status: 'paid',
      paid_by: 'agent',
      paid_by_agent_id: 'agt_2Bd8',
    },
  },
  {
    type: 'invoice.overdue',
    description: 'An invoice passed its due date unpaid.',
    category: 'revenue',
    sample: { id: 'inv_7Hs2Kd', object: 'invoice', status: 'overdue', due_date: '2026-08-20T00:00:00Z' },
  },
  {
    type: 'subscription.renewed',
    description: 'A billing period rolled over and the charge succeeded.',
    category: 'revenue',
    sample: {
      id: 'sub_5Gk1Zx',
      object: 'subscription',
      status: 'active',
      amount: 2900,
      interval: 'month',
      next_billing_date: '2026-09-24T00:00:00Z',
    },
  },
  {
    type: 'subscription.payment_failed',
    description: 'A renewal charge failed. Retries follow your dunning settings.',
    category: 'revenue',
    sample: { id: 'sub_5Gk1Zx', object: 'subscription', status: 'past_due', retry_count: 1, max_retries: 4 },
  },
  {
    type: 'account.updated',
    description: 'A connected account changed status — often onboarding completing.',
    category: 'platforms',
    sample: { id: 'acct_4Nm7', object: 'connected_account', status: 'active', settlement_wallet: '0x9dE2…113a' },
  },
  {
    type: 'payout.completed',
    description: 'A payout landed in the recipient’s wallet.',
    category: 'platforms',
    sample: { id: 'po_8Qw3', object: 'payout', status: 'completed', amount: 84000, tx_hash: '0x1c9f…07b4' },
  },
  {
    type: 'transfer.completed',
    description: 'An outbound transfer confirmed on-chain.',
    category: 'money-management',
    sample: { id: 'tr_2Vy6', object: 'transfer', status: 'completed', amount: 250000, currency: 'USDC', chain: 'base' },
  },
];

export function eventsInCategory(id: DevCategoryId): WebhookEventType[] {
  return WEBHOOK_EVENTS.filter((e) => e.category === id);
}

export function getEvent(type: string): WebhookEventType | undefined {
  return WEBHOOK_EVENTS.find((e) => e.type === type);
}

// ---------------------------------------------------------------------------
// Code samples
// ---------------------------------------------------------------------------

export type Language = 'curl' | 'node' | 'python';

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node' },
  { id: 'python', label: 'Python' },
];

export const API_BASE = 'https://api.chainpayments.com';

/** Renders a request in each language, so samples can't drift between tabs. */
export function codeSample(
  endpoint: Pick<ApiEndpoint, 'method' | 'path'>,
  params: Record<string, unknown> = {},
): Record<Language, string> {
  const path = endpoint.path.replace('{id}', 'pi_3Nk2LmQ8');
  const entries = Object.entries(params);
  const call = methodName(endpoint);

  // GET params go on the query string; everything else is a form body.
  const query = endpoint.method === 'GET' && entries.length
    ? '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
    : '';
  const curlLines = [`curl ${API_BASE}${path}${query}`];
  if (endpoint.method !== 'GET') curlLines.push(`  -X ${endpoint.method}`);
  curlLines.push('  -H "Authorization: Bearer $CHAIN_PAYMENTS_SECRET_KEY"');
  if (endpoint.method !== 'GET') {
    for (const [k, v] of entries) {
      curlLines.push(`  -d ${k}=${Array.isArray(v) ? `"${v.join(',')}"` : typeof v === 'string' ? `"${v}"` : v}`);
    }
  }
  const curl = curlLines.join(' \\\n');

  const jsArgs = entries.length
    ? `{\n${entries.map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`).join('\n')}\n}`
    : '';
  const node = `import ChainPayments from '@chainpayments/node';

const cp = new ChainPayments(process.env.CHAIN_PAYMENTS_SECRET_KEY);

const result = await cp.${call}(${jsArgs});
console.log(result.id);`;

  const pyArgs = entries.length
    ? entries.map(([k, v]) => `\n    ${k}=${typeof v === 'string' ? `"${v}"` : JSON.stringify(v)},`).join('') + '\n'
    : '';
  const python = `import os
import chainpayments

cp = chainpayments.Client(api_key=os.environ["CHAIN_PAYMENTS_SECRET_KEY"])

result = cp.${call}(${pyArgs})
print(result.id)`;

  return { curl, node, python };
}

/** Maps an endpoint to the SDK call that wraps it, e.g. `payments.create`. */
function methodName(endpoint: Pick<ApiEndpoint, 'method' | 'path'>): string {
  const resource = endpoint.path.split('/')[2] ?? 'resource';
  const hasId = endpoint.path.includes('{id}');
  const verb =
    endpoint.method === 'POST' ? 'create'
    : endpoint.method === 'PATCH' ? 'update'
    : hasId ? 'retrieve'
    : 'list';
  return `${resource}.${verb}`;
}

// ---------------------------------------------------------------------------
// Sandbox
// ---------------------------------------------------------------------------

/**
 * Test wallets seeded into every sandbox.
 *
 * These behave deterministically so integration tests can assert on outcomes:
 * the same address always produces the same result.
 */
export interface TestWallet {
  address: string;
  label: string;
  behaviour: string;
  outcome: 'succeeds' | 'fails' | 'delays';
}

export const TEST_WALLETS: TestWallet[] = [
  {
    address: '0x0000000000000000000000000000000000000001',
    label: 'Always succeeds',
    behaviour: 'Confirms immediately at the required confirmation count.',
    outcome: 'succeeds',
  },
  {
    address: '0x0000000000000000000000000000000000000002',
    label: 'Insufficient balance',
    behaviour: 'Fails with insufficient_balance before broadcasting.',
    outcome: 'fails',
  },
  {
    address: '0x0000000000000000000000000000000000000003',
    label: 'Slow confirmation',
    behaviour: 'Sits in pending for 60 seconds, then succeeds. Use it to test confirmation UI.',
    outcome: 'delays',
  },
  {
    address: '0x0000000000000000000000000000000000000004',
    label: 'Reverts on-chain',
    behaviour: 'Broadcasts, then the transaction reverts. Use it to test failure after submission.',
    outcome: 'fails',
  },
];

export interface SandboxFact {
  title: string;
  body: string;
}

export const SANDBOX_FACTS: SandboxFact[] = [
  {
    title: 'Nothing here touches mainnet',
    body: 'Sandbox keys only reach testnet contracts. A sandbox key cannot move real funds even if it leaks — though you should still rotate it.',
  },
  {
    title: 'Test funds are free',
    body: 'Sandbox wallets are topped up on request. There is no faucet queue and no rate limit on test balances.',
  },
  {
    title: 'Data is separate, shapes are identical',
    body: 'Sandbox and live data never mix, but every object, error, and webhook has the same shape in both — so code that works here works in production.',
  },
  {
    title: 'You can reset it',
    body: 'Resetting a sandbox clears its payments, customers, and events, and leaves your keys and webhook endpoints in place.',
  },
];
