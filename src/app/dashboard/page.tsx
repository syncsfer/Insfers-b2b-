'use client';

import { TrendingUp, TrendingDown, CreditCard, Users, DollarSign, Activity } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { WalletChip } from '@/components/ui/wallet-chip';
import { ChainBadge } from '@/components/ui/chain-badge';
import { formatUSDC, formatRelativeTime } from '@/lib/utils';
import { mockDashboardKPIs, mockPayments, mockVolumeChart } from '@/lib/mock-data';

function KPICard({
  title, value, change, icon: Icon,
}: {
  title: string; value: string; change: number; icon: React.ElementType;
}) {
  const isPositive = change >= 0;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
          <Icon size={18} className="text-gray-400" />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="flex items-center gap-1 mt-1">
        {isPositive ? (
          <TrendingUp size={14} className="text-green-600" />
        ) : (
          <TrendingDown size={14} className="text-red-600" />
        )}
        <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{change}%
        </span>
        <span className="text-xs text-gray-400 ml-1">vs last period</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const kpis = mockDashboardKPIs;
  const recentPayments = mockPayments.slice(0, 8);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your payment activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KPICard
          title="Total Volume"
          value={formatUSDC(kpis.total_volume)}
          change={kpis.total_volume_change}
          icon={DollarSign}
        />
        <KPICard
          title="Successful Payments"
          value={kpis.successful_payments.toLocaleString()}
          change={kpis.successful_payments_change}
          icon={CreditCard}
        />
        <KPICard
          title="Average Payment"
          value={formatUSDC(kpis.average_payment)}
          change={kpis.average_payment_change}
          icon={Activity}
        />
        <KPICard
          title="Active Customers"
          value={kpis.active_customers.toLocaleString()}
          change={kpis.active_customers_change}
          icon={Users}
        />
      </div>

      {/* Volume Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Volume (30 days)</h2>
        <div className="h-48 flex items-end gap-1">
          {mockVolumeChart.map((d, i) => {
            const maxVol = Math.max(...mockVolumeChart.map(v => v.volume));
            const height = (d.volume / maxVol) * 100;
            return (
              <div
                key={i}
                className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer group relative"
                style={{ height: `${height}%` }}
                title={`${d.date}: ${formatUSDC(d.volume)} (${d.count} payments)`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-gray-400">{mockVolumeChart[0]?.date}</span>
          <span className="text-[10px] text-gray-400">{mockVolumeChart[mockVolumeChart.length - 1]?.date}</span>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Recent Payments</h2>
          <a href="/dashboard/payments" className="text-xs font-medium text-blue-600 hover:text-blue-700">
            View all
          </a>
        </div>
        <div className="divide-y divide-gray-100">
          {recentPayments.map((payment) => (
            <a
              key={payment.id}
              href={`/dashboard/payments/${payment.id}`}
              className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <StatusPill status={payment.status} size="sm" />
              <span className="font-semibold text-sm text-gray-900 w-24 text-right">
                {formatUSDC(payment.amount)}
              </span>
              <div className="flex-1 min-w-0">
                <WalletChip address={payment.from_address} chain={payment.chain} showExplorer={false} />
              </div>
              <ChainBadge chain={payment.chain} />
              <span className="text-xs text-gray-400 w-24 text-right">
                {formatRelativeTime(payment.created_at)}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
