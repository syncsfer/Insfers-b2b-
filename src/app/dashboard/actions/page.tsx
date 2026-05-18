'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, XCircle, Clock, Shield, CreditCard, FileText,
  Timer, Webhook, RefreshCw, UserCheck, ArrowRight, CheckCircle2,
  Eye, Ban, Users, Banknote, Filter,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime } from '@/lib/utils';
import { mockActionItems } from '@/lib/mock-data';
import type { ActionCategory, ActionPriority, ActionItem } from '@/types';

const categoryConfig: Record<ActionCategory, { label: string; icon: React.ElementType; color: string }> = {
  failed_transaction:    { label: 'Failed Transactions',   icon: XCircle,      color: 'text-red-600 bg-red-50 border-red-200' },
  kyc_review:            { label: 'KYC Review',            icon: UserCheck,    color: 'text-amber-600 bg-amber-50 border-amber-200' },
  flagged_activity:      { label: 'Flagged Activity',      icon: Shield,       color: 'text-red-600 bg-red-50 border-red-200' },
  dispute:               { label: 'Disputes & Refunds',    icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  payout_issue:          { label: 'Payout Issues',         icon: Banknote,     color: 'text-red-600 bg-red-50 border-red-200' },
  overdue_invoice:       { label: 'Overdue Invoices',      icon: FileText,     color: 'text-amber-600 bg-amber-50 border-amber-200' },
  expiring_hold:         { label: 'Expiring Holds',        icon: Timer,        color: 'text-amber-600 bg-amber-50 border-amber-200' },
  webhook_failure:       { label: 'Webhook Failures',      icon: Webhook,      color: 'text-purple-600 bg-purple-50 border-purple-200' },
  subscription_dunning:  { label: 'Subscription Dunning',  icon: RefreshCw,    color: 'text-blue-600 bg-blue-50 border-blue-200' },
  account_review:        { label: 'Account Review',        icon: Users,        color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

const priorityConfig: Record<ActionPriority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
  high:     { label: 'High',     color: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
  low:      { label: 'Low',      color: 'text-gray-600 bg-gray-50 border-gray-200', dot: 'bg-gray-400' },
};

const filterTabs: { label: string; value: 'all' | ActionPriority }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

function PriorityBadge({ priority }: { priority: ActionPriority }) {
  const config = priorityConfig[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function ActionCard({ item, onResolve }: { item: ActionItem; onResolve: (id: string) => void }) {
  const cat = categoryConfig[item.category];
  const Icon = cat.icon;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow ${item.resolved ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${cat.color}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h3>
            <PriorityBadge priority={item.priority} />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.description}</p>
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span>{formatRelativeTime(item.created_at)}</span>
            {item.amount && <span className="font-medium text-gray-600">{formatUSDC(item.amount)}</span>}
            <span className="font-mono">{item.entity_id.slice(0, 16)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!item.resolved && (
            <button
              onClick={() => onResolve(item.id)}
              className="p-1.5 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
              title="Mark as resolved"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          <Link
            href={item.href}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            View <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ActionsPage() {
  const { toast } = useToast();
  const [priorityFilter, setPriorityFilter] = useState<'all' | ActionPriority>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ActionCategory>('all');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [showResolved, setShowResolved] = useState(false);

  const items = useMemo(() => {
    let data = mockActionItems.map(item => ({
      ...item,
      resolved: resolvedIds.has(item.id),
    }));

    if (!showResolved) {
      data = data.filter(item => !item.resolved);
    }
    if (priorityFilter !== 'all') {
      data = data.filter(item => item.priority === priorityFilter);
    }
    if (categoryFilter !== 'all') {
      data = data.filter(item => item.category === categoryFilter);
    }
    return data;
  }, [priorityFilter, categoryFilter, resolvedIds, showResolved]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of mockActionItems) {
      if (!resolvedIds.has(item.id)) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    }
    return counts;
  }, [resolvedIds]);

  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const item of mockActionItems) {
      if (!resolvedIds.has(item.id)) {
        counts[item.priority] = (counts[item.priority] || 0) + 1;
        counts.all++;
      }
    }
    return counts;
  }, [resolvedIds]);

  const handleResolve = (id: string) => {
    setResolvedIds(prev => new Set([...prev, id]));
    toast('Marked as resolved');
  };

  const criticalCount = priorityCounts.critical || 0;
  const highCount = priorityCounts.high || 0;
  const totalOpen = priorityCounts.all || 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Action Center</h1>
          <p className="text-sm text-gray-500 mt-1">Items that need your attention, sorted by priority</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={e => setShowResolved(e.target.checked)}
              className="rounded"
            />
            Show resolved
          </label>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Open Items</span>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-gray-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalOpen}</div>
          <div className="text-[11px] text-gray-400 mt-1">Across all categories</div>
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-4 bg-red-50/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-red-600">Critical</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle size={16} className="text-red-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-700">{criticalCount}</div>
          <div className="text-[11px] text-red-400 mt-1">Immediate attention needed</div>
        </div>
        <div className="bg-white border border-orange-200 rounded-xl p-4 bg-orange-50/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-orange-600">High Priority</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock size={16} className="text-orange-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-700">{highCount}</div>
          <div className="text-[11px] text-orange-400 mt-1">Resolve within 24h</div>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-4 bg-green-50/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-green-600">Resolved Today</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-700">{resolvedIds.size}</div>
          <div className="text-[11px] text-green-400 mt-1">Items cleared this session</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        {/* Priority tabs */}
        <div className="flex items-center gap-0 border-b border-gray-200 flex-1">
          {filterTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setPriorityFilter(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-[3px] transition-colors ${
                priorityFilter === tab.value ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab.label} {priorityCounts[tab.value] ? `(${priorityCounts[tab.value]})` : ''}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as 'all' | ActionCategory)}
            className="appearance-none pl-8 pr-8 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All categories</option>
            {(Object.entries(categoryConfig) as [ActionCategory, typeof categoryConfig[ActionCategory]][]).map(([key, cfg]) => (
              categoryCounts[key] ? (
                <option key={key} value={key}>{cfg.label} ({categoryCounts[key]})</option>
              ) : null
            ))}
          </select>
          <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Action items list */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map(item => (
            <ActionCard key={item.id} item={item} onResolve={handleResolve} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={24} className="text-green-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {showResolved ? 'No items match filters' : 'All clear!'}
          </h3>
          <p className="text-sm text-gray-500">
            {showResolved
              ? 'Try adjusting your filters to see more items.'
              : 'No action items need your attention right now. Great job keeping things tidy.'}
          </p>
        </div>
      )}

      {/* Category breakdown */}
      {priorityFilter === 'all' && categoryFilter === 'all' && !showResolved && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">By Category</h2>
          <div className="grid grid-cols-5 gap-3">
            {(Object.entries(categoryConfig) as [ActionCategory, typeof categoryConfig[ActionCategory]][]).map(([key, cfg]) => {
              const count = categoryCounts[key] || 0;
              if (count === 0) return null;
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-sm hover:border-blue-200 transition-all"
                >
                  <Icon size={16} className={cfg.color.split(' ')[0]} />
                  <div className="text-lg font-bold text-gray-900 mt-2">{count}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{cfg.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
