'use client';

import { useState } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, CreditCard, RotateCcw, Users } from 'lucide-react';
import { formatUSDC } from '@/lib/utils';
import { mockVolumeChart, mockPayments, mockRefunds } from '@/lib/mock-data';

const periods = ['7d', '30d', '90d', '12m'] as const;

export default function ReportingPage() {
  const [period, setPeriod] = useState<typeof periods[number]>('30d');

  const totalVolume = mockPayments.filter(p => p.status === 'succeeded').reduce((s, p) => s + p.amount, 0);
  const totalRefunds = mockRefunds.filter(r => r.status === 'completed').reduce((s, r) => s + r.amount, 0);
  const netVolume = totalVolume - totalRefunds;
  const successRate = Math.round(mockPayments.filter(p => p.status === 'succeeded').length / mockPayments.length * 100);

  const chainBreakdown = mockPayments.reduce<Record<string, { count: number; volume: number }>>((acc, p) => {
    if (p.status !== 'succeeded') return acc;
    if (!acc[p.chain]) acc[p.chain] = { count: 0, volume: 0 };
    acc[p.chain].count++;
    acc[p.chain].volume += p.amount;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reporting</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {periods.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Gross Volume', value: formatUSDC(totalVolume), icon: DollarSign, color: 'text-green-600' },
          { label: 'Net Volume', value: formatUSDC(netVolume), icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Total Refunds', value: formatUSDC(totalRefunds), icon: RotateCcw, color: 'text-amber-600' },
          { label: 'Success Rate', value: `${successRate}%`, icon: CreditCard, color: 'text-purple-600' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 font-medium">{card.label}</span>
              <card.icon size={18} className={card.color} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Volume Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Daily Volume</h2>
        <div className="h-48 flex items-end gap-1">
          {mockVolumeChart.map((d, i) => {
            const maxVol = Math.max(...mockVolumeChart.map(v => v.volume));
            const height = (d.volume / maxVol) * 100;
            return (
              <div
                key={i}
                className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                style={{ height: `${height}%` }}
                title={`${d.date}: ${formatUSDC(d.volume)}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-gray-400">{mockVolumeChart[0]?.date}</span>
          <span className="text-[10px] text-gray-400">{mockVolumeChart[mockVolumeChart.length - 1]?.date}</span>
        </div>
      </div>

      {/* Chain Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Volume by Network</h2>
        <div className="space-y-3">
          {Object.entries(chainBreakdown).sort((a, b) => b[1].volume - a[1].volume).map(([chain, data]) => {
            const pct = Math.round(data.volume / totalVolume * 100);
            return (
              <div key={chain} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-20 capitalize">{chain}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-semibold text-gray-900 w-28 text-right">{formatUSDC(data.volume)}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                <span className="text-xs text-gray-400 w-20 text-right">{data.count} txns</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
