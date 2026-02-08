'use client';

import { Copy, ExternalLink } from 'lucide-react';
import { formatRelativeTime, truncateAddress, cn } from '@/lib/utils';
import type { TimelineEvent } from '@/types';

const dotColors: Record<TimelineEvent['type'], string> = {
  payment_created: 'bg-gray-400',
  checkout_opened: 'bg-blue-500',
  wallet_connected: 'bg-blue-500',
  approval_granted: 'bg-blue-500',
  transaction_sent: 'bg-yellow-500',
  confirmation_progress: 'bg-yellow-500',
  payment_succeeded: 'bg-green-500',
  payment_failed: 'bg-red-500',
  webhook_sent: 'bg-gray-400',
  refund_initiated: 'bg-blue-500',
  refund_completed: 'bg-green-500',
};

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative flex gap-3">
            <div
              className={cn(
                'absolute left-[-17px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white',
                dotColors[event.type] || 'bg-gray-400',
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-gray-900">{event.title}</span>
                <span className="text-[11px] text-gray-400" title={new Date(event.timestamp).toLocaleString()}>
                  {formatRelativeTime(event.timestamp)}
                </span>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">{event.description}</p>
              {event.tx_hash && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] font-mono text-gray-400">
                    {truncateAddress(event.tx_hash)}
                  </span>
                  <button className="text-gray-300 hover:text-gray-500">
                    <Copy size={10} />
                  </button>
                  <a href="#" className="text-gray-300 hover:text-gray-500">
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
