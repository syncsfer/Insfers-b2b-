'use client';

import { cn } from '@/lib/utils';

type StatusVariant =
  | 'succeeded' | 'pending' | 'processing' | 'failed'
  | 'awaiting_payment' | 'expired' | 'awaiting_claim'
  | 'active' | 'captured' | 'released'
  | 'past_due' | 'canceled' | 'trialing'
  | 'draft' | 'sent' | 'paid' | 'void' | 'overdue'
  | 'onboarding' | 'suspended'
  | 'created' | 'completed'
  | 'review' | 'low' | 'medium' | 'high'
  | 'paused' | 'disabled'
  | 'confirming';

const variantStyles: Record<string, { bg: string; text: string; border: string }> = {
  succeeded:        { bg: 'bg-success-bg',  text: 'text-success-text',  border: 'border-success-border' },
  completed:        { bg: 'bg-success-bg',  text: 'text-success-text',  border: 'border-success-border' },
  paid:             { bg: 'bg-success-bg',  text: 'text-success-text',  border: 'border-success-border' },
  active:           { bg: 'bg-success-bg',  text: 'text-success-text',  border: 'border-success-border' },
  low:              { bg: 'bg-success-bg',  text: 'text-success-text',  border: 'border-success-border' },
  pending:          { bg: 'bg-warning-bg',  text: 'text-warning-text',  border: 'border-warning-border' },
  past_due:         { bg: 'bg-warning-bg',  text: 'text-warning-text',  border: 'border-warning-border' },
  overdue:          { bg: 'bg-warning-bg',  text: 'text-warning-text',  border: 'border-warning-border' },
  review:           { bg: 'bg-warning-bg',  text: 'text-warning-text',  border: 'border-warning-border' },
  medium:           { bg: 'bg-warning-bg',  text: 'text-warning-text',  border: 'border-warning-border' },
  trialing:         { bg: 'bg-warning-bg',  text: 'text-warning-text',  border: 'border-warning-border' },
  processing:       { bg: 'bg-info-bg',     text: 'text-info-text',     border: 'border-info-border' },
  sent:             { bg: 'bg-info-bg',     text: 'text-info-text',     border: 'border-info-border' },
  captured:         { bg: 'bg-info-bg',     text: 'text-info-text',     border: 'border-info-border' },
  onboarding:       { bg: 'bg-info-bg',     text: 'text-info-text',     border: 'border-info-border' },
  created:          { bg: 'bg-info-bg',     text: 'text-info-text',     border: 'border-info-border' },
  failed:           { bg: 'bg-danger-bg',   text: 'text-danger-text',   border: 'border-danger-border' },
  suspended:        { bg: 'bg-danger-bg',   text: 'text-danger-text',   border: 'border-danger-border' },
  high:             { bg: 'bg-danger-bg',   text: 'text-danger-text',   border: 'border-danger-border' },
  awaiting_payment: { bg: 'bg-neutral-bg',  text: 'text-neutral-text',  border: 'border-neutral-border' },
  draft:            { bg: 'bg-neutral-bg',  text: 'text-neutral-text',  border: 'border-neutral-border' },
  expired:          { bg: 'bg-neutral-bg',  text: 'text-[#6b7280]',     border: 'border-neutral-border' },
  released:         { bg: 'bg-neutral-bg',  text: 'text-[#6b7280]',     border: 'border-neutral-border' },
  canceled:         { bg: 'bg-neutral-bg',  text: 'text-[#6b7280]',     border: 'border-neutral-border' },
  void:             { bg: 'bg-neutral-bg',  text: 'text-[#6b7280]',     border: 'border-neutral-border' },
  awaiting_claim:   { bg: 'bg-claim-bg',    text: 'text-claim-text',    border: 'border-claim-border' },
  paused:           { bg: 'bg-warning-bg',  text: 'text-warning-text',  border: 'border-warning-border' },
  confirming:       { bg: 'bg-info-bg',     text: 'text-info-text',     border: 'border-info-border' },
  disabled:         { bg: 'bg-neutral-bg',  text: 'text-[#6b7280]',     border: 'border-neutral-border' },
};

const labels: Record<string, string> = {
  succeeded: 'Succeeded',
  pending: 'Pending',
  processing: 'Processing',
  failed: 'Failed',
  awaiting_payment: 'Awaiting Payment',
  expired: 'Expired',
  awaiting_claim: 'Awaiting Claim',
  active: 'Active',
  captured: 'Captured',
  released: 'Released',
  past_due: 'Past Due',
  canceled: 'Canceled',
  trialing: 'Trialing',
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  void: 'Void',
  overdue: 'Overdue',
  onboarding: 'Onboarding',
  suspended: 'Suspended',
  created: 'Created',
  completed: 'Completed',
  review: 'Review',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  paused: 'Paused',
  confirming: 'Confirming',
  disabled: 'Disabled',
};

interface StatusPillProps {
  status: StatusVariant;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusPill({ status, className, size = 'md' }: StatusPillProps) {
  const style = variantStyles[status] || variantStyles.pending;
  const label = labels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1.5 text-xs',
    lg: 'px-3 py-2 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border whitespace-nowrap',
        style.bg, style.text, style.border,
        sizeClasses[size],
        className,
      )}
    >
      {label}
    </span>
  );
}
