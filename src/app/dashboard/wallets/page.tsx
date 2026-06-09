'use client';

import { useState } from 'react';
import {
  Wallet, Plus, Copy, ExternalLink, ArrowDownToLine, ArrowUpFromLine,
  ShieldCheck, Check, Settings2, Eye, EyeOff, TrendingUp, TrendingDown,
  AlertTriangle, RefreshCw, QrCode,
} from 'lucide-react';
import { ChainBadge } from '@/components/ui/chain-badge';
import { WalletChip } from '@/components/ui/wallet-chip';
import { StatusPill } from '@/components/ui/status-pill';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, truncateAddress, getExplorerAddressUrl } from '@/lib/utils';
import type { Chain } from '@/types';

interface WalletAccount {
  id: string;
  label: string;
  address: string;
  chain: Chain;
  balance: number;
  pending_in: number;
  pending_out: number;
  is_settlement: boolean;
  is_primary: boolean;
  status: 'active' | 'inactive';
  created_at: string;
}

interface NetworkConfig {
  chain: Chain;
  enabled: boolean;
  auto_settle: boolean;
  min_payout: number;
}

const mockWallets: WalletAccount[] = [
  { id: 'w_001', label: 'Primary Treasury', address: '0x7777777777777777777777777777777777777777', chain: 'base', balance: 8_542_100, pending_in: 234_500, pending_out: 120_000, is_settlement: true, is_primary: true, status: 'active', created_at: '2025-06-15T10:00:00Z' },
  { id: 'w_002', label: 'Ethereum Settlement', address: '0x7777777777777777777777777777777777777777', chain: 'ethereum', balance: 2_156_300, pending_in: 89_000, pending_out: 0, is_settlement: true, is_primary: false, status: 'active', created_at: '2025-07-01T10:00:00Z' },
  { id: 'w_003', label: 'Polygon Settlement', address: '0x7777777777777777777777777777777777777777', chain: 'polygon', balance: 1_023_400, pending_in: 45_200, pending_out: 50_000, is_settlement: true, is_primary: false, status: 'active', created_at: '2025-07-15T10:00:00Z' },
  { id: 'w_004', label: 'Arbitrum Wallet', address: '0x8888888888888888888888888888888888888888', chain: 'arbitrum', balance: 456_700, pending_in: 0, pending_out: 0, is_settlement: false, is_primary: false, status: 'active', created_at: '2025-09-01T10:00:00Z' },
  { id: 'w_005', label: 'Optimism Reserve', address: '0x9999999999999999999999999999999999999999', chain: 'optimism', balance: 312_500, pending_in: 12_300, pending_out: 0, is_settlement: false, is_primary: false, status: 'inactive', created_at: '2025-10-01T10:00:00Z' },
];

const mockNetworkConfigs: NetworkConfig[] = [
  { chain: 'base', enabled: true, auto_settle: true, min_payout: 10000 },
  { chain: 'ethereum', enabled: true, auto_settle: true, min_payout: 100000 },
  { chain: 'polygon', enabled: true, auto_settle: false, min_payout: 5000 },
  { chain: 'arbitrum', enabled: true, auto_settle: false, min_payout: 10000 },
  { chain: 'optimism', enabled: false, auto_settle: false, min_payout: 10000 },
];

const recentActivity = [
  { id: 'wa_1', type: 'deposit' as const, amount: 125000, chain: 'base' as Chain, from: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12', time: '2 hours ago' },
  { id: 'wa_2', type: 'withdrawal' as const, amount: 50000, chain: 'base' as Chain, to: '0xfeed9876face5432feed9876face5432feed9876', time: '5 hours ago' },
  { id: 'wa_3', type: 'deposit' as const, amount: 89000, chain: 'ethereum' as Chain, from: '0xabcdef1234567890abcdef1234567890abcdef12', time: '8 hours ago' },
  { id: 'wa_4', type: 'settlement' as const, amount: 200000, chain: 'polygon' as Chain, to: '0x7777777777777777777777777777777777777777', time: '1 day ago' },
  { id: 'wa_5', type: 'deposit' as const, amount: 45200, chain: 'polygon' as Chain, from: '0xcafe1234babe5678cafe1234babe5678cafe1234', time: '1 day ago' },
  { id: 'wa_6', type: 'withdrawal' as const, amount: 75000, chain: 'ethereum' as Chain, to: '0xdeadbeef12345678deadbeef12345678deadbeef', time: '2 days ago' },
];

export default function WalletsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'wallets' | 'networks'>('overview');
  const [showBalances, setShowBalances] = useState(true);
  const [addWalletOpen, setAddWalletOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletAccount | null>(null);

  // Add wallet form
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newChain, setNewChain] = useState<Chain>('base');
  const [newIsSettlement, setNewIsSettlement] = useState(false);

  // Withdraw form
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawChain, setWithdrawChain] = useState<Chain>('base');

  // Network configs
  const [networkConfigs, setNetworkConfigs] = useState(mockNetworkConfigs);

  const totalBalance = mockWallets.reduce((sum, w) => sum + w.balance, 0);
  const totalPendingIn = mockWallets.reduce((sum, w) => sum + w.pending_in, 0);
  const totalPendingOut = mockWallets.reduce((sum, w) => sum + w.pending_out, 0);
  const settlementWallets = mockWallets.filter(w => w.is_settlement);
  const activeWallets = mockWallets.filter(w => w.status === 'active');

  const toggleNetwork = (chain: Chain, field: 'enabled' | 'auto_settle') => {
    setNetworkConfigs(prev => prev.map(c =>
      c.chain === chain ? { ...c, [field]: !c[field] } : c
    ));
    toast(`${chain} ${field === 'enabled' ? 'toggled' : 'auto-settle updated'}`);
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'wallets' as const, label: 'Wallets' },
    { key: 'networks' as const, label: 'Networks' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Wallets & Treasury</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your settlement wallets, balances, and network configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            {showBalances ? <EyeOff size={14} /> : <Eye size={14} />}
            {showBalances ? 'Hide' : 'Show'} Balances
          </button>
          <button
            onClick={() => setAddWalletOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={15} /> Add Wallet
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Total Balance</span>
            <Wallet size={14} className="text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {showBalances ? formatUSDC(totalBalance) : '******'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Across {activeWallets.length} active wallets</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Pending Inbound</span>
            <TrendingUp size={14} className="text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-700">
            {showBalances ? `+${formatUSDC(totalPendingIn)}` : '******'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Awaiting confirmation</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Pending Outbound</span>
            <TrendingDown size={14} className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {showBalances ? `-${formatUSDC(totalPendingOut)}` : '******'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Processing withdrawals</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Settlement Wallets</span>
            <ShieldCheck size={14} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{settlementWallets.length}</div>
          <div className="text-xs text-gray-400 mt-1">{networkConfigs.filter(n => n.enabled).length} of 5 networks active</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-[3px] transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Wallets breakdown */}
          <div className="col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Balance by Network</h3>
            {mockWallets.filter(w => w.status === 'active').map(w => {
              const pct = totalBalance > 0 ? (w.balance / totalBalance) * 100 : 0;
              return (
                <div key={w.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <ChainBadge chain={w.chain} />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{w.label}</span>
                        {w.is_primary && (
                          <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">Primary</span>
                        )}
                        {w.is_settlement && !w.is_primary && (
                          <span className="ml-2 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">Settlement</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {showBalances ? formatUSDC(w.balance) : '****'}
                      </div>
                      <div className="text-[10px] text-gray-400">{pct.toFixed(1)}% of total</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                      {w.pending_in > 0 && (
                        <span className="text-green-600">+{formatUSDC(w.pending_in)} pending</span>
                      )}
                      {w.pending_out > 0 && (
                        <span className="text-orange-500">-{formatUSDC(w.pending_out)} outgoing</span>
                      )}
                      {w.pending_in === 0 && w.pending_out === 0 && (
                        <span>No pending transfers</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedWallet(w); setDepositOpen(true); }}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title="Deposit"
                      >
                        <ArrowDownToLine size={13} />
                      </button>
                      <button
                        onClick={() => { setSelectedWallet(w); setWithdrawChain(w.chain); setWithdrawOpen(true); }}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title="Withdraw"
                      >
                        <ArrowUpFromLine size={13} />
                      </button>
                      <a
                        href={getExplorerAddressUrl(w.chain, w.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title="View on explorer"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent activity */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {recentActivity.map(a => (
                <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    a.type === 'deposit' ? 'bg-green-50 text-green-600'
                      : a.type === 'withdrawal' ? 'bg-orange-50 text-orange-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {a.type === 'deposit' ? <ArrowDownToLine size={14} />
                      : a.type === 'withdrawal' ? <ArrowUpFromLine size={14} />
                      : <RefreshCw size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 capitalize">{a.type}</span>
                      <ChainBadge chain={a.chain} showLabel={false} />
                    </div>
                    <div className="text-xs text-gray-400">{a.time}</div>
                  </div>
                  <span className={`text-sm font-semibold ${a.type === 'deposit' ? 'text-green-700' : 'text-gray-900'}`}>
                    {a.type === 'deposit' ? '+' : '-'}{formatUSDC(a.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wallets Tab */}
      {activeTab === 'wallets' && (
        <div className="space-y-4">
          {mockWallets.map(w => (
            <div key={w.id} className={`bg-white border rounded-xl p-5 ${w.status === 'inactive' ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${w.is_primary ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Wallet size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{w.label}</span>
                      {w.is_primary && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">Primary</span>
                      )}
                      {w.is_settlement && (
                        <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">Settlement</span>
                      )}
                      <StatusPill status={w.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-gray-500">{w.address}</span>
                      <button onClick={() => { navigator.clipboard.writeText(w.address); toast('Address copied'); }} className="text-gray-300 hover:text-gray-500">
                        <Copy size={12} />
                      </button>
                      <a href={getExplorerAddressUrl(w.chain, w.address)} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-500">
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
                <ChainBadge chain={w.chain} />
              </div>

              <div className="grid grid-cols-4 gap-4 bg-gray-50 rounded-lg p-3">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Balance</div>
                  <div className="text-sm font-bold text-gray-900">{showBalances ? formatUSDC(w.balance) : '****'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Pending In</div>
                  <div className="text-sm font-medium text-green-600">{showBalances ? `+${formatUSDC(w.pending_in)}` : '****'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Pending Out</div>
                  <div className="text-sm font-medium text-orange-500">{showBalances ? `-${formatUSDC(w.pending_out)}` : '****'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Available</div>
                  <div className="text-sm font-bold text-gray-900">{showBalances ? formatUSDC(w.balance - w.pending_out) : '****'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => { setSelectedWallet(w); setDepositOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50"
                >
                  <ArrowDownToLine size={12} /> Deposit
                </button>
                <button
                  onClick={() => { setSelectedWallet(w); setWithdrawChain(w.chain); setWithdrawOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <ArrowUpFromLine size={12} /> Withdraw
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(w.address); toast('Address copied'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Copy size={12} /> Copy Address
                </button>
                {!w.is_primary && (
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 border border-gray-100 rounded-lg hover:bg-gray-50 hover:text-gray-600 ml-auto">
                    <Settings2 size={12} /> Configure
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Networks Tab */}
      {activeTab === 'networks' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-6">
            <ShieldCheck size={18} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Network Configuration</p>
              <p className="text-xs text-blue-700 mt-0.5">Enable networks to accept payments on those chains. Auto-settle will automatically move funds to your primary settlement wallet.</p>
            </div>
          </div>

          {networkConfigs.map(config => {
            const wallet = mockWallets.find(w => w.chain === config.chain && w.is_settlement);
            return (
              <div key={config.chain} className={`bg-white border rounded-xl p-5 ${!config.enabled ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <ChainBadge chain={config.chain} />
                    <div>
                      <div className="flex items-center gap-2">
                        {wallet ? (
                          <span className="font-mono text-xs text-gray-500">{truncateAddress(wallet.address)}</span>
                        ) : (
                          <span className="text-xs text-gray-400">No settlement wallet</span>
                        )}
                        {wallet && (
                          <span className="text-xs text-gray-400">
                            &middot; {showBalances ? formatUSDC(wallet.balance) : '****'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-gray-500">Auto-settle</span>
                      <button
                        onClick={() => toggleNetwork(config.chain, 'auto_settle')}
                        className={`relative w-9 h-5 rounded-full transition-colors ${config.auto_settle ? 'bg-blue-600' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.auto_settle ? 'translate-x-4' : ''}`} />
                      </button>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-gray-500">Enabled</span>
                      <button
                        onClick={() => toggleNetwork(config.chain, 'enabled')}
                        className={`relative w-9 h-5 rounded-full transition-colors ${config.enabled ? 'bg-green-500' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-4' : ''}`} />
                      </button>
                    </label>
                  </div>
                </div>

                {config.enabled && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-400">
                    <span>Min payout: {formatUSDC(config.min_payout)}</span>
                    <span>&middot;</span>
                    <span>Settlement: {config.auto_settle ? 'Automatic' : 'Manual'}</span>
                    {!wallet && (
                      <>
                        <span>&middot;</span>
                        <span className="text-orange-500 flex items-center gap-1">
                          <AlertTriangle size={11} /> No wallet assigned
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Wallet Modal */}
      <Modal
        open={addWalletOpen}
        onClose={() => { setAddWalletOpen(false); setNewLabel(''); setNewAddress(''); }}
        title="Add Wallet"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setAddWalletOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => { toast('Wallet added'); setAddWalletOpen(false); setNewLabel(''); setNewAddress(''); }}
              disabled={!newLabel || !/^0x[a-fA-F0-9]{40}$/.test(newAddress)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Add Wallet
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Label</label>
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. Arbitrum Settlement"
              className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Wallet Address</label>
            <input
              type="text"
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
              placeholder="0x..."
              className="w-full mt-1 px-3 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Network</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'] as Chain[]).map(c => (
                <button
                  key={c}
                  onClick={() => setNewChain(c)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    newChain === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <ChainBadge chain={c} showLabel={false} />
                  <span className="capitalize">{c}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newIsSettlement}
              onChange={e => setNewIsSettlement(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Use as settlement wallet for this network</span>
          </label>
        </div>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        title={`Deposit to ${selectedWallet?.label || 'Wallet'}`}
      >
        {selectedWallet && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Send USDC to this address on <span className="font-medium text-gray-700 capitalize">{selectedWallet.chain}</span> to deposit funds.</p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="w-32 h-32 mx-auto bg-white border border-gray-200 rounded-lg flex items-center justify-center mb-3">
                <QrCode size={80} className="text-gray-300" />
              </div>
              <div className="font-mono text-xs text-gray-700 break-all px-4">{selectedWallet.address}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(selectedWallet.address); toast('Address copied'); }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Copy size={14} /> Copy Address
              </button>
              <a
                href={getExplorerAddressUrl(selectedWallet.chain, selectedWallet.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <ExternalLink size={14} /> View on Explorer
              </a>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-orange-500 mt-0.5 shrink-0" />
              <p className="text-xs text-orange-700">Only send <strong>USDC</strong> on the <strong className="capitalize">{selectedWallet.chain}</strong> network. Sending other tokens or using the wrong network may result in permanent loss of funds.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        open={withdrawOpen}
        onClose={() => { setWithdrawOpen(false); setWithdrawAddress(''); setWithdrawAmount(''); }}
        title={`Withdraw from ${selectedWallet?.label || 'Wallet'}`}
        footer={
          <div className="flex gap-3">
            <button onClick={() => setWithdrawOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => { toast('Withdrawal initiated'); setWithdrawOpen(false); setWithdrawAddress(''); setWithdrawAmount(''); }}
              disabled={!withdrawAddress || !withdrawAmount || !/^0x[a-fA-F0-9]{40}$/.test(withdrawAddress)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowUpFromLine size={14} /> Withdraw
            </button>
          </div>
        }
      >
        {selectedWallet && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Available balance</span>
              <span className="text-sm font-bold text-gray-900">{formatUSDC(selectedWallet.balance - selectedWallet.pending_out)}</span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Recipient Address</label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={e => setWithdrawAddress(e.target.value)}
                placeholder="0x..."
                className="w-full mt-1 px-3 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Amount (USDC)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-16 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setWithdrawAmount(((selectedWallet.balance - selectedWallet.pending_out) / 100).toFixed(2))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600 hover:text-blue-800 px-1.5 py-0.5"
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChainBadge chain={selectedWallet.chain} />
              <span className="text-xs text-gray-400">Network fee: ~{selectedWallet.chain === 'ethereum' ? '$2.50' : '$0.01'}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
