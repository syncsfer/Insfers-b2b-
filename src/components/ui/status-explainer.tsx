'use client';

import Link from 'next/link';
import {
  CheckCircle2, Clock, AlertTriangle, XCircle, Timer,
  ArrowRight, ExternalLink, RotateCcw, Eye, ShieldCheck,
  Send, Hourglass, Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusInfo {
  icon: React.ElementType;
  headline: string;
  description: string;
  nextStep: string;
  actionLabel?: string;
  actionHref?: string;
  accent: 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'purple';
}

const accents = {
  green:  { bg: 'bg-green-50',  border: 'border-green-200', icon: 'text-green-600', headline: 'text-green-900', text: 'text-green-700', action: 'bg-green-600 hover:bg-green-700 text-white' },
  yellow: { bg: 'bg-amber-50',  border: 'border-amber-200', icon: 'text-amber-600', headline: 'text-amber-900', text: 'text-amber-700', action: 'bg-amber-600 hover:bg-amber-700 text-white' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',   icon: 'text-red-600',   headline: 'text-red-900',   text: 'text-red-700',   action: 'bg-red-600 hover:bg-red-700 text-white' },
  gray:   { bg: 'bg-gray-50',   border: 'border-gray-200',  icon: 'text-gray-500',  headline: 'text-gray-900',  text: 'text-gray-600',  action: 'bg-gray-600 hover:bg-gray-700 text-white' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',  icon: 'text-blue-600',  headline: 'text-blue-900',  text: 'text-blue-700',  action: 'bg-blue-600 hover:bg-blue-700 text-white' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200',icon: 'text-purple-600',headline: 'text-purple-900',text: 'text-purple-700',action: 'bg-purple-600 hover:bg-purple-700 text-white' },
};

function getPaymentStatusInfo(status: string, extra?: { reason?: string }): StatusInfo {
  switch (status) {
    case 'succeeded':
      return {
        icon: CheckCircle2,
        headline: 'Payment completed',
        description: 'This payment has been confirmed on-chain and funds have settled to the merchant wallet.',
        nextStep: 'No action needed. You can issue a refund if the customer requests one.',
        actionLabel: 'Issue refund',
        accent: 'green',
      };
    case 'pending':
      return {
        icon: Clock,
        headline: 'Awaiting confirmation',
        description: 'The transaction has been submitted to the blockchain and is waiting for block confirmations.',
        nextStep: 'This usually resolves within seconds on L2s or a few minutes on Ethereum. Monitor the transaction on the block explorer.',
        accent: 'yellow',
      };
    case 'awaiting_payment':
      return {
        icon: Hourglass,
        headline: 'Waiting for customer',
        description: 'A checkout session has been created but the customer has not yet connected their wallet or submitted payment.',
        nextStep: 'Share the checkout link with the customer. The session will expire if not completed within the configured time window.',
        actionLabel: 'Copy checkout link',
        accent: 'blue',
      };
    case 'failed':
      return {
        icon: XCircle,
        headline: 'Payment failed',
        description: extra?.reason
          ? `The transaction was rejected: ${extra.reason}`
          : 'The on-chain transaction reverted. This can happen due to insufficient funds, revoked approval, or a contract error.',
        nextStep: 'No funds were moved. The customer can retry the payment from the checkout page.',
        actionLabel: 'View on explorer',
        accent: 'red',
      };
    case 'expired':
      return {
        icon: Ban,
        headline: 'Session expired',
        description: 'The checkout session timed out before the customer completed payment.',
        nextStep: 'Create a new payment link or invoice to collect this payment.',
        actionLabel: 'Create new link',
        actionHref: '/dashboard/payment-links',
        accent: 'gray',
      };
    default:
      return {
        icon: Eye,
        headline: status.replace(/_/g, ' '),
        description: 'Status information unavailable.',
        nextStep: 'Check the transaction details below.',
        accent: 'gray',
      };
  }
}

function getRefundStatusInfo(status: string, method?: string): StatusInfo {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle2,
        headline: 'Refund completed',
        description: method === 'claimable'
          ? 'The refund has been claimed by the customer and funds have been transferred to their chosen wallet.'
          : 'The refund has been sent directly back to the original payment wallet.',
        nextStep: 'No action needed.',
        accent: 'green',
      };
    case 'processing':
      return {
        icon: Clock,
        headline: 'Refund processing',
        description: 'The refund transaction has been submitted and is awaiting blockchain confirmation.',
        nextStep: 'The refund will complete once the transaction is confirmed. This usually takes a few seconds.',
        accent: 'yellow',
      };
    case 'awaiting_claim':
      return {
        icon: Timer,
        headline: 'Waiting for customer to claim',
        description: 'A claimable refund has been deposited into the refund contract. The customer needs to claim it using their secret link.',
        nextStep: 'Ensure the customer received the claim link. The refund will expire if not claimed within the time window.',
        actionLabel: 'Copy claim link',
        accent: 'purple',
      };
    case 'created':
      return {
        icon: Clock,
        headline: 'Refund created',
        description: 'The refund has been initiated but the on-chain transaction has not been submitted yet.',
        nextStep: 'The refund will be processed shortly.',
        accent: 'blue',
      };
    case 'failed':
      return {
        icon: XCircle,
        headline: 'Refund failed',
        description: 'The refund transaction reverted on-chain. The original funds were not moved.',
        nextStep: 'Retry the refund or contact support if the issue persists.',
        actionLabel: 'Retry refund',
        accent: 'red',
      };
    case 'expired':
      return {
        icon: Ban,
        headline: 'Refund expired',
        description: 'The claimable refund was not claimed within the allowed time window. Funds have been returned to the merchant.',
        nextStep: 'Create a new refund if the customer still needs to be refunded.',
        accent: 'gray',
      };
    default:
      return {
        icon: Eye,
        headline: status.replace(/_/g, ' '),
        description: 'Status information unavailable.',
        nextStep: 'Check the refund details.',
        accent: 'gray',
      };
  }
}

function getHoldStatusInfo(status: string): StatusInfo {
  switch (status) {
    case 'active':
      return {
        icon: ShieldCheck,
        headline: 'Funds held in escrow',
        description: 'The customer\'s funds are locked in the smart contract escrow. You can capture all or part of the amount, or release the hold.',
        nextStep: 'Capture the hold when you\'re ready to collect, or release it to return funds to the customer.',
        actionLabel: 'Capture hold',
        accent: 'green',
      };
    case 'captured':
      return {
        icon: CheckCircle2,
        headline: 'Hold captured',
        description: 'The escrowed funds have been captured and transferred to the merchant wallet.',
        nextStep: 'No action needed. Any uncaptured remainder was released back to the customer.',
        accent: 'blue',
      };
    case 'released':
      return {
        icon: RotateCcw,
        headline: 'Hold released',
        description: 'The escrowed funds have been released back to the customer\'s wallet. No charge was made.',
        nextStep: 'No action needed.',
        accent: 'gray',
      };
    case 'expired':
      return {
        icon: Ban,
        headline: 'Hold expired',
        description: 'The hold expired before it was captured. Funds were automatically released back to the customer.',
        nextStep: 'Create a new hold or payment if you still need to collect funds.',
        accent: 'gray',
      };
    default:
      return {
        icon: Eye,
        headline: status.replace(/_/g, ' '),
        description: 'Status information unavailable.',
        nextStep: 'Check the hold details.',
        accent: 'gray',
      };
  }
}

function getInvoiceStatusInfo(status: string): StatusInfo {
  switch (status) {
    case 'paid':
      return {
        icon: CheckCircle2,
        headline: 'Invoice paid',
        description: 'The customer has completed payment for this invoice.',
        nextStep: 'No action needed.',
        accent: 'green',
      };
    case 'sent':
      return {
        icon: Send,
        headline: 'Invoice sent',
        description: 'The invoice has been sent to the customer and is awaiting payment.',
        nextStep: 'The customer can pay using the invoice link. Follow up if payment is not received by the due date.',
        accent: 'blue',
      };
    case 'draft':
      return {
        icon: Eye,
        headline: 'Draft invoice',
        description: 'This invoice has been created but not yet sent to the customer.',
        nextStep: 'Review the invoice details and send it to the customer.',
        actionLabel: 'Send invoice',
        accent: 'gray',
      };
    case 'overdue':
      return {
        icon: AlertTriangle,
        headline: 'Invoice overdue',
        description: 'The due date has passed and the invoice has not been paid.',
        nextStep: 'Send a reminder to the customer or void the invoice if it is no longer needed.',
        actionLabel: 'Send reminder',
        accent: 'red',
      };
    case 'void':
      return {
        icon: Ban,
        headline: 'Invoice voided',
        description: 'This invoice has been canceled and can no longer be paid.',
        nextStep: 'Create a new invoice if payment is still required.',
        accent: 'gray',
      };
    default:
      return {
        icon: Eye,
        headline: status.replace(/_/g, ' '),
        description: 'Status information unavailable.',
        nextStep: 'Check the invoice details.',
        accent: 'gray',
      };
  }
}

export type StatusContext = 'payment' | 'refund' | 'hold' | 'invoice';

interface StatusExplainerProps {
  context: StatusContext;
  status: string;
  timestamp?: string;
  reason?: string;
  method?: string;
  onAction?: () => void;
  className?: string;
}

export function StatusExplainer({ context, status, timestamp, reason, method, onAction, className }: StatusExplainerProps) {
  const info = context === 'payment' ? getPaymentStatusInfo(status, { reason })
    : context === 'refund' ? getRefundStatusInfo(status, method)
    : context === 'hold' ? getHoldStatusInfo(status)
    : getInvoiceStatusInfo(status);

  const colors = accents[info.accent];
  const Icon = info.icon;

  return (
    <div className={cn('rounded-xl border p-4', colors.bg, colors.border, className)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Icon size={20} className={colors.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn('text-sm font-semibold', colors.headline)}>{info.headline}</h3>
            {timestamp && (
              <span className={cn('text-[11px]', colors.text)}>
                {new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </div>
          <p className={cn('text-sm leading-relaxed', colors.text)}>{info.description}</p>
          <div className="flex items-center gap-3 mt-2.5">
            <p className={cn('text-xs leading-relaxed flex-1', colors.text)}>
              <span className="font-semibold">Next step:</span> {info.nextStep}
            </p>
            {info.actionLabel && (info.actionHref ? (
              <Link
                href={info.actionHref}
                className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg shrink-0', colors.action)}
              >
                {info.actionLabel} <ArrowRight size={12} />
              </Link>
            ) : onAction ? (
              <button
                onClick={onAction}
                className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg shrink-0', colors.action)}
              >
                {info.actionLabel} <ArrowRight size={12} />
              </button>
            ) : null)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function getStatusSummary(context: StatusContext, status: string): string {
  if (context === 'payment') {
    switch (status) {
      case 'succeeded': return 'Confirmed and settled';
      case 'pending': return 'Awaiting block confirmation';
      case 'awaiting_payment': return 'Customer has not paid yet';
      case 'failed': return 'Transaction reverted — no funds moved';
      case 'expired': return 'Checkout session timed out';
      default: return '';
    }
  }
  if (context === 'refund') {
    switch (status) {
      case 'completed': return 'Refund delivered';
      case 'processing': return 'Awaiting confirmation';
      case 'awaiting_claim': return 'Customer needs to claim';
      case 'created': return 'Queued for processing';
      case 'failed': return 'Transaction reverted';
      case 'expired': return 'Claim window expired';
      default: return '';
    }
  }
  if (context === 'hold') {
    switch (status) {
      case 'active': return 'Funds locked — capture or release';
      case 'captured': return 'Funds collected';
      case 'released': return 'Funds returned to customer';
      case 'expired': return 'Auto-released after expiry';
      default: return '';
    }
  }
  if (context === 'invoice') {
    switch (status) {
      case 'paid': return 'Payment received';
      case 'sent': return 'Awaiting customer payment';
      case 'draft': return 'Not sent yet';
      case 'overdue': return 'Past due date — follow up';
      case 'void': return 'Canceled';
      default: return '';
    }
  }
  return '';
}
