// Core Data Models for Chain Payments Platform

export type PaymentStatus = 'awaiting_payment' | 'pending' | 'succeeded' | 'failed' | 'expired';
export type RefundMethod = 'direct' | 'claimable' | 'escrow_reversal';
export type RefundStatus = 'created' | 'processing' | 'completed' | 'failed' | 'awaiting_claim' | 'expired';
export type Chain = 'base' | 'ethereum' | 'polygon' | 'arbitrum' | 'optimism';
/** Ticker of a supported stablecoin. See `src/lib/currencies.ts` for the registry. */
export type Currency = 'USDC' | 'EURC' | 'JPYC' | 'HTGC';
export type HoldStatus = 'active' | 'captured' | 'released' | 'expired';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'expired' | 'trialing';
export type ConnectedAccountStatus = 'onboarding' | 'active' | 'suspended';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TransferStatus = 'draft' | 'pending' | 'confirming' | 'completed' | 'failed';

export interface Transfer {
  id: string;
  recipient_address: string;
  recipient_label: string | null;
  amount: number;
  fee: number;
  net_amount: number;
  chain: Chain;
  currency: Currency;
  status: TransferStatus;
  tx_hash: string | null;
  memo: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface SavedRecipient {
  id: string;
  label: string;
  full_name: string;
  email: string | null;
  address: string;
  chain: Chain;
  total_sent: number;
  transfer_count: number;
  last_sent_at: string | null;
  created_at: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  status: PaymentStatus;
  chain: Chain;
  currency: Currency;
  from_address: string;
  to_address: string;
  tx_hash: string | null;
  confirmations: number;
  required_confirmations: number;
  metadata: Record<string, string>;
  customer_id: string | null;
  customer_email: string | null;
  fee: number;
  net_amount: number;
  created_at: string;
  confirmed_at: string | null;
  description: string | null;
  receipt_url: string | null;
  initiated_by: 'human' | 'agent';
  agent_id: string | null;
}

export interface Refund {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency: Currency;
  chain: Chain;
  method: RefundMethod;
  status: RefundStatus;
  reason: string;
  tx_hash: string | null;
  created_at: string;
  completed_at: string | null;

  // Claimable-refund lifecycle. A claim link lets the customer pull funds to
  // any address they control, rather than us pushing to the paying address.
  claim_link: string | null;
  claim_expires_at: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  /** Where we sent the claim link, if we have an address on file. */
  recipient_email: string | null;
  claim_notified_at: string | null;
  claim_reminders_sent: number;
  /** Set when the merchant cancels an unclaimed link and pulls the funds back. */
  claim_revoked_at: string | null;
}

/** A step in the claim lifecycle, for the merchant-facing timeline. */
export interface ClaimEvent {
  id: string;
  refund_id: string;
  type: 'created' | 'notified' | 'reminded' | 'opened' | 'claimed' | 'expired' | 'revoked' | 'failed';
  detail: string;
  actor: string | null;
  timestamp: string;
}

export interface Customer {
  id: string;
  wallet_address: string;
  email: string | null;
  label: string | null;
  lifetime_value: number;
  payment_count: number;
  first_payment_at: string;
  last_payment_at: string;
  is_blocked: boolean;
  risk_level: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface PaymentLink {
  id: string;
  name: string;
  amount: number | null;
  currency: string;
  url: string;
  active: boolean;
  chains: Chain[];
  payment_count: number;
  total_collected: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  customer_email: string;
  amount: number;
  currency: Currency;
  status: 'draft' | 'sent' | 'paid' | 'void' | 'overdue';
  due_date: string;
  paid_at: string | null;
  payment_intent_id: string | null;
  items: InvoiceItem[];
  memo: string | null;
  created_at: string;
  created_by: 'human' | 'agent';
  agent_id: string | null;
  paid_by: 'human' | 'agent' | null;
  paid_by_agent_id: string | null;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  created_at: string;
  last_delivery_at: string | null;
  success_rate: number;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  mode: 'test' | 'live';
  created_at: string;
  last_used_at: string | null;
}

export interface WebhookLog {
  id: string;
  endpoint_id: string;
  event_type: string;
  status_code: number;
  response_time_ms: number;
  success: boolean;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  type: 'payment_created' | 'checkout_opened' | 'wallet_connected' | 'approval_granted' |
        'transaction_sent' | 'confirmation_progress' | 'payment_succeeded' | 'payment_failed' |
        'webhook_sent' | 'refund_initiated' | 'refund_completed';
  title: string;
  description: string;
  tx_hash: string | null;
  timestamp: string;
}

export interface Hold {
  id: string;
  amount: number;
  currency: Currency;
  captured_amount: number;
  released_amount: number;
  status: HoldStatus;
  customer_id: string;
  from_address: string;
  expires_at: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_name: string;
  amount: number;
  interval: 'week' | 'month' | 'year';
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
}

export interface Plan {
  id: string;
  merchant_address: string;
  name: string;
  amount: number;
  interval: 'week' | 'month' | 'year';
  interval_seconds: number;
  trial_days: number;
  grace_period: number;
  max_retries: number;
  active: boolean;
  subscriber_count: number;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  wallet_address: string;
  settlement_wallet: string;
  label: string;
  status: ConnectedAccountStatus;
  total_received: number;
  split_count: number;
  created_at: string;
}

export interface SplitRule {
  recipient: string;
  bps: number;
  flat: number;
}

export interface Payout {
  id: string;
  recipient_address: string;
  amount: number;
  status: PayoutStatus;
  tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
}

// Email Receipts

export type ReceiptStatus = 'sent' | 'delivered' | 'opened' | 'pending' | 'failed' | 'bounced' | 'not_sent';

export interface Receipt {
  id: string;
  payment_intent_id: string;
  customer_email: string;
  status: ReceiptStatus;
  amount: number;
  chain: Chain;
  currency: Currency;
  tx_hash: string | null;
  receipt_url: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  attempts: number;
  error_message: string | null;
  created_at: string;
}

export interface ReceiptSettings {
  auto_send: boolean;
  from_name: string;
  reply_to: string;
  bcc_email: string | null;
  subject_template: string;
  footer_message: string;
  include_tx_link: boolean;
  attach_pdf: boolean;
}

// Team & Access

export type TeamRole = 'owner' | 'admin' | 'finance' | 'developer' | 'viewer';
export type MemberStatus = 'active' | 'invited' | 'suspended';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: MemberStatus;
  /** Two-factor enrolment — material here because these people can move money. */
  two_factor_enabled: boolean;
  last_active_at: string | null;
  invited_by: string | null;
  /** Set while status is 'invited'; the invite lapses after this. */
  invite_expires_at: string | null;
  created_at: string;
}

// Product Catalog

export type CatalogItemType = 'product' | 'service';

/** Accent used to keep a category visually consistent everywhere it appears. */
export type CategoryAccent = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate';

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  accent: CategoryAccent;
  created_at: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  sku: string;
  type: CatalogItemType;
  category_id: string;
  /** Unit price in the currency's minor units. */
  price: number;
  currency: Currency;
  /** What one unit is, e.g. "each", "hour", "seat / month". */
  unit: string;
  active: boolean;
  // Performance
  units_sold: number;
  /** Lifetime revenue in this item's currency, minor units. */
  revenue: number;
  /** Percent change in units sold vs the previous 30 days. */
  trend_30d: number;
  last_sold_at: string | null;
  created_at: string;
}

export type ActionCategory = 'failed_transaction' | 'kyc_review' | 'flagged_activity' | 'dispute' | 'payout_issue' | 'overdue_invoice' | 'expiring_hold' | 'webhook_failure' | 'subscription_dunning' | 'account_review';
export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ActionItem {
  id: string;
  category: ActionCategory;
  priority: ActionPriority;
  title: string;
  description: string;
  entity_id: string;
  entity_type: 'payment' | 'refund' | 'customer' | 'invoice' | 'hold' | 'payout' | 'subscription' | 'webhook' | 'account';
  href: string;
  amount?: number;
  created_at: string;
  resolved: boolean;
}

export interface DashboardKPIs {
  total_volume: number;
  total_volume_change: number;
  successful_payments: number;
  successful_payments_change: number;
  average_payment: number;
  average_payment_change: number;
  active_customers: number;
  active_customers_change: number;
}

export type CheckoutState =
  | 'not_connected'
  | 'connecting'
  | 'wrong_chain'
  | 'checking_balance'
  | 'insufficient_usdc'
  | 'insufficient_gas'
  | 'ready_for_approval'
  | 'approval_pending'
  | 'approval_failed'
  | 'ready_to_pay'
  | 'payment_pending'
  | 'payment_succeeded'
  | 'payment_failed';

// AI Agent System

export type AgentStatus = 'active' | 'paused' | 'disabled';
export type AgentCapability =
  | 'create_invoice'
  | 'send_payment'
  | 'collect_payment'
  | 'generate_report'
  | 'manage_subscriptions'
  | 'issue_refund'
  | 'monitor_activity';

export type AgentActionType =
  | 'invoice_created'
  | 'payment_sent'
  | 'payment_collected'
  | 'report_generated'
  | 'subscription_renewed'
  | 'refund_issued'
  | 'anomaly_detected'
  | 'reminder_sent';

export type AgentActionStatus = 'completed' | 'pending' | 'failed';

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  wallet_address: string;
  wallet_balance: number;
  chain: Chain;
  capabilities: AgentCapability[];
  spending_limit_daily: number;
  spending_limit_per_tx: number;
  spent_today: number;
  actions_today: number;
  total_actions: number;
  total_volume: number;
  created_at: string;
  last_active_at: string;
}

export interface AgentAction {
  id: string;
  agent_id: string;
  agent_name: string;
  type: AgentActionType;
  status: AgentActionStatus;
  title: string;
  description: string;
  entity_id: string | null;
  entity_type: 'invoice' | 'payment' | 'refund' | 'subscription' | 'report' | null;
  amount: number | null;
  tx_hash: string | null;
  created_at: string;
}

export type InitiatedBy = 'human' | 'agent';

export interface AgentDetection {
  initiated_by: InitiatedBy;
  agent_id: string | null;
  agent_name: string | null;
  confidence: number;
}
