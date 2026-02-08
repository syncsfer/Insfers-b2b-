'use client';

import { useState } from 'react';
import { Plus, Copy, Search, ExternalLink, Users, DollarSign, ArrowRight, Trash2 } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { WalletChip } from '@/components/ui/wallet-chip';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime, truncateAddress } from '@/lib/utils';
import type { ConnectedAccountStatus } from '@/types';

interface ConnectedAccount {
  id: string;
  business_name: string;
  settlement_wallet: string;
  status: ConnectedAccountStatus;
  total_volume: number;
  platform_fees: number;
  compliance: 'verified' | 'pending' | 'required';
  created_at: string;
}

interface SplitRule {
  id: string;
  recipient: string;
  label: string;
  bps: number;
}

const mockAccounts: ConnectedAccount[] = Array.from({ length: 8 }, (_, i) => {
  const statuses: ConnectedAccountStatus[] = ['active', 'active', 'active', 'onboarding', 'suspended'];
  return {
    id: `acct_${String(i + 1).padStart(3, '0')}`,
    business_name: ['Seller A', 'Merchant X', 'Shop Pro', 'Digital Goods', 'Service Co', 'Freelancer', 'Agency', 'Studio'][i],
    settlement_wallet: `0x${Math.random().toString(16).slice(2, 42).padEnd(40, 'a')}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    total_volume: Math.floor(Math.random() * 5000000) + 10000,
    platform_fees: Math.floor(Math.random() * 100000) + 1000,
    compliance: (['verified', 'verified', 'pending', 'required'] as const)[Math.floor(Math.random() * 4)],
    created_at: new Date(Date.now() - Math.random() * 180 * 86400000).toISOString(),
  };
});

export default function ConnectPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<'accounts' | 'splits'>('accounts');
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [splitRules, setSplitRules] = useState<SplitRule[]>([
    { id: '1', recipient: 'Platform', label: 'Platform fee', bps: 250 },
    { id: '2', recipient: 'Merchant', label: 'Connected account', bps: 9750 },
  ]);
  const [testAmount, setTestAmount] = useState('100');

  const totalBps = splitRules.reduce((s, r) => s + r.bps, 0);
  const isValidSplit = totalBps === 10000;

  const accountColumns: Column<ConnectedAccount>[] = [
    {
      key: 'account', header: 'Account', width: '200px',
      render: (a) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{a.business_name}</div>
          <div className="text-[11px] font-mono text-gray-400">{a.id}</div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', width: '110px', render: (a) => <StatusPill status={a.status} size="sm" /> },
    { key: 'wallet', header: 'Settlement Wallet', width: '170px', render: (a) => <WalletChip address={a.settlement_wallet} showExplorer={false} /> },
    { key: 'volume', header: 'Total Volume', width: '120px', align: 'right', render: (a) => <span className="font-semibold text-gray-900">{formatUSDC(a.total_volume)}</span> },
    { key: 'fees', header: 'Platform Fees', width: '110px', align: 'right', render: (a) => <span className="text-sm text-gray-600">{formatUSDC(a.platform_fees)}</span> },
    {
      key: 'compliance', header: 'Compliance', width: '100px',
      render: (a) => (
        <span className={`text-xs font-medium ${a.compliance === 'verified' ? 'text-green-700' : a.compliance === 'pending' ? 'text-amber-600' : 'text-red-600'}`}>
          {a.compliance.charAt(0).toUpperCase() + a.compliance.slice(1)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Connect (Marketplace)</h1>
          <p className="text-sm text-gray-500 mt-1">Manage connected accounts and payment splits</p>
        </div>
        <button
          onClick={() => setCreateAccountOpen(true)}
          className="inline-flex items-center gap-2 px-4 h-10 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Add account
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6">
        {[
          { key: 'accounts', label: 'Connected Accounts', icon: Users },
          { key: 'splits', label: 'Splits & Fees', icon: DollarSign },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as 'accounts' | 'splits')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === tab.key ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeSection === 'accounts' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <DataTable columns={accountColumns} data={mockAccounts} keyExtractor={a => a.id} emptyMessage="No connected accounts" />
        </div>
      )}

      {activeSection === 'splits' && (
        <div className="space-y-6">
          {/* Visual flow */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Payment Split Flow</h2>
            <div className="flex items-center gap-3 justify-center py-4">
              <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700">Payer</div>
              <ArrowRight size={16} className="text-gray-400" />
              <div className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700">Escrow</div>
              <ArrowRight size={16} className="text-gray-400" />
              <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-700">Split Logic</div>
              <ArrowRight size={16} className="text-gray-400" />
              <div className="flex flex-col gap-2">
                {splitRules.map(r => (
                  <div key={r.id} className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-700">
                    {r.label}: {(r.bps / 100).toFixed(1)}%
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Split rules config */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Split Rules</h2>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${isValidSplit ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                Total: {(totalBps / 100).toFixed(1)}% {isValidSplit ? '(Valid)' : '(Must equal 100%)'}
              </span>
            </div>
            <div className="space-y-3">
              {splitRules.map((rule, i) => (
                <div key={rule.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <input value={rule.label} onChange={e => { const n = [...splitRules]; n[i].label = e.target.value; setSplitRules(n); }}
                      className="text-sm font-medium text-gray-900 border-none p-0 focus:outline-none w-full" />
                  </div>
                  <div className="w-32">
                    <div className="flex items-center gap-1">
                      <input type="number" value={(rule.bps / 100).toFixed(1)} onChange={e => { const n = [...splitRules]; n[i].bps = Math.round(parseFloat(e.target.value) * 100); setSplitRules(n); }}
                        className="w-20 px-2 py-1 text-sm text-right border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  </div>
                  {splitRules.length > 1 && (
                    <button onClick={() => setSplitRules(splitRules.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setSplitRules([...splitRules, { id: String(Date.now()), recipient: '', label: 'New recipient', bps: 0 }])}
              className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              + Add recipient
            </button>
          </div>

          {/* Test rule */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Test Split Rule</h2>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500">Input amount</label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm text-gray-500">$</span>
                  <input type="number" value={testAmount} onChange={e => setTestAmount(e.target.value)}
                    className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            {isValidSplit && testAmount && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                {splitRules.map(r => (
                  <div key={r.id} className="flex justify-between">
                    <span className="text-gray-500">{r.label} ({(r.bps / 100).toFixed(1)}%)</span>
                    <span className="font-semibold text-gray-900">${(parseFloat(testAmount) * r.bps / 10000).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${parseFloat(testAmount).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      <Modal
        open={createAccountOpen}
        onClose={() => setCreateAccountOpen(false)}
        title="Add Connected Account"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setCreateAccountOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => { toast('Connected account created'); setCreateAccountOpen(false); }} disabled={!businessName || !walletAddress}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">Add account</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Business name</label>
            <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Seller Corp" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Settlement wallet address</label>
            <input value={walletAddress} onChange={e => setWalletAddress(e.target.value)} placeholder="0x..." className="w-full mt-1 px-3 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">Or send an onboarding link: the merchant will connect their own wallet and complete verification.</p>
            <button onClick={() => { navigator.clipboard.writeText('https://connect.chainpayments.com/onboard/abc123'); toast('Onboarding link copied'); }}
              className="mt-2 text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"><Copy size={11} /> Copy onboarding link</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
