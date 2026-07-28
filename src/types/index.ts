// Core Data Models for Chain Payments Platform

export type PaymentStatus = 'awaiting_payment' | 'pending' | 'succeeded' | 'failed' | 'expired';
export type RefundMethod = 'direct' | 'claimable' | 'escrow_reversal';
export type RefundStatus = 'created' | 'processing' | 'completed' | 'failed' | 'awaiting_claim' | 'expired';
export type Chain = 'base' | 'ethereum' | 'polygon' | 'arbitrum' | 'optimism';
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
  method: RefundMethod;
  status: RefundStatus;
  claim_link: string | null;
  claim_expires_at: string | null;
  claimed_by: string | null;
  reason: string;
  tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
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
