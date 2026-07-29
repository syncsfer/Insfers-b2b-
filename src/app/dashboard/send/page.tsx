'use client';

import { useState, useMemo } from 'react';
import {
  Send, ArrowRight, Check, AlertTriangle, Copy, ExternalLink,
  Clock, ChevronDown, Plus, Star, Search, ArrowUpRight, MoreHorizontal,
  Loader2, ShieldCheck, X,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { ChainBadge } from '@/components/ui/chain-badge';
import { CoinBadge, CoinMark, Money } from '@/components/ui/coin-badge';
import { WalletChip } from '@/components/ui/wallet-chip';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime, truncateAddress, getExplorerUrl } from '@/lib/utils';
import { mockTransfers, mockSavedRecipients } from '@/lib/mock-data';
import type { Chain, Currency, Transfer, SavedRecipient } from '@/types';
import { STABLECOINS, STABLECOIN_LIST, getCoin, formatAmount, toUsdCents } from '@/lib/currencies';

type SendStep = 'form' | 'review' | 'sending' | 'success' | 'error';

const supportedChains: { chain: Chain; label: string; fee: string; speed: string }[] = [
  { chain: 'base', label: 'Base', fee: '~$0.01', speed: '~2s' },
  { chain: 'arbitrum', label: 'Arbitrum', fee: '~$0.02', speed: '~3s' },
  { chain: 'optimism', label: 'Optimism', fee: '~$0.02', speed: '~3s' },
  { chain: 'polygon', label: 'Polygon', fee: '~$0.01', speed: '~5s' },
  { chain: 'ethereum', label: 'Ethereum', fee: '~$2.50', speed: '~15s' },
];

/** Available balance per stablecoin, in each coin's minor units. */
const balances: Record<Currency, number> = {
  USDC: 8_542_100,
  EURC: 3_120_400,
  JPYC: 4_850_000,
  HTGC: 62_400_000,
};

/**
 * Network fee in the sending currency's minor units. The underlying gas cost is
 * denominated in USD, so it is converted into the coin being sent.
 */
function estimateFee(chain: Chain, currency: Currency): number {
  const usdCents: Record<Chain, number> = { base: 1, arbitrum: 2, optimism: 2, polygon: 1, ethereum: 250 };
  const perUsdCent: Record<Currency, number> = { USDC: 1, EURC: 0.93, JPYC: 1.56, HTGC: 1.32 };
  return Math.max(1, Math.round(usdCents[chain] * perUsdCent[currency]));
}

function estimateTime(chain: Chain): string {
  const times: Record<Chain, string> = { base: '~2 seconds', arbitrum: '~3 seconds', optimism: '~3 seconds', polygon: '~5 seconds', ethereum: '~15 seconds' };
  return times[chain] || '~5 seconds';
}

export default function SendMoneyPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'recipients'>('send');

  // Send form state
  const [step, setStep] = useState<SendStep>('form');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientLabel, setRecipientLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [chain, setChain] = useState<Chain>('base');
  const [currency, setCurrency] = useState<Currency>('USDC');
  const [memo, setMemo] = useState('');
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false);
  const [recipientSearchOpen, setRecipientSearchOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [completedTx, setCompletedTx] = useState<{ id: string; txHash: string } | null>(null);

  // Add recipient modal
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [newRecipientLabel, setNewRecipientLabel] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientAddress, setNewRecipientAddress] = useState('');
  const [newRecipientChain, setNewRecipientChain] = useState<Chain>('base');

  // History state
  const [historyTab, setHistoryTab] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  const coin = getCoin(currency);
  const merchantBalance = balances[currency];
  // Parse in the coin's own minor units — yen has no subunit.
  const parsedAmount = Math.round(parseFloat(amount || '0') * coin.minorUnits);
  const fee = estimateFee(chain, currency);
  // Networks are constrained by the coin: JPYC doesn't exist on Base, etc.
  const availableChains = supportedChains.filter(c => coin.networks.includes(c.chain));
  const total = parsedAmount + fee;
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(recipientAddress);
  const canProceed = isValidAddress && parsedAmount > 0 && total <= merchantBalance;

  const filteredRecipients = useMemo(() => {
    if (!recipientSearch) return mockSavedRecipients;
    const q = recipientSearch.toLowerCase();
    return mockSavedRecipients.filter(r =>
      r.label.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)
    );
  }, [recipientSearch]);

  const filteredTransfers = useMemo(() => {
    if (historyTab === 'all') return mockTransfers;
    return mockTransfers.filter(t => t.status === historyTab);
  }, [historyTab]);

  const historyTabCounts = useMemo(() => ({
    all: mockTransfers.length,
    completed: mockTransfers.filter(t => t.status === 'completed').length,
    pending: mockTransfers.filter(t => t.status === 'pending' || t.status === 'confirming').length,
    failed: mockTransfers.filter(t => t.status === 'failed').length,
  }), []);

  const changeCurrency = (next: Currency) => {
    setCurrency(next);
    // Move off a network the new coin can't settle on.
    if (!STABLECOINS[next].networks.includes(chain)) {
      setChain(STABLECOINS[next].networks[0]);
    }
  };

  const selectRecipient = (r: SavedRecipient) => {
    setRecipientAddress(r.address);
    setRecipientLabel(r.label);
    setChain(r.chain);
    setRecipientSearchOpen(false);
    setRecipientSearch('');
  };

  const handleReview = () => {
    if (canProceed) setStep('review');
  };

  const handleSend = () => {
    setStep('sending');
    setTimeout(() => {
      const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      const txId = `txfr_${Math.random().toString(36).slice(2, 10)}`;
      setCompletedTx({ id: txId, txHash });
      setStep('success');
    }, 2500);
  };

  const resetForm = () => {
    setStep('form');
    setRecipientAddress('');
    setRecipientLabel('');
    setAmount('');
    setChain('base');
    setMemo('');
    setSaveRecipient(false);
    setCompletedTx(null);
  };

  const tabs = [
    { key: 'send' as const, label: 'Send', icon: Send },
    { key: 'history' as const, label: 'History', icon: Clock },
    { key: 'recipients' as const, label: 'Recipients', icon: Star },
  ];

  const transferColumns: Column<Transfer>[] = [
    {
      key: 'status', header: 'Status', width: '120px',
      render: (t) => <StatusPill status={t.status} size="sm" />,
    },
    {
      key: 'recipient', header: 'Recipient', width: '200px',
      render: (t) => (
        <div>
          {t.recipient_label && <div className="text-sm font-medium text-gray-900">{t.recipient_label}</div>}
          <div className="font-mono text-xs text-gray-500">{truncateAddress(t.recipient_address)}</div>
        </div>
      ),
    },
    {
      key: 'amount', header: 'Amount', width: '120px', align: 'right',
      render: (t) => <span className="font-semibold text-gray-900"><Money minor={t.amount} currency={t.currency} showTicker={false} /></span>,
    },
    {
      key: 'fee', header: 'Fee', width: '80px', align: 'right',
      render: (t) => <span className="text-gray-400"><Money minor={t.fee} currency={t.currency} showTicker={false} /></span>,
    },
    {
      key: 'currency', header: 'Currency', width: '90px',
      render: (t) => <CoinBadge currency={t.currency} size="sm" />,
    },
    {
      key: 'chain', header: 'Network', width: '100px',
      render: (t) => <ChainBadge chain={t.chain} />,
    },
    {
      key: 'tx', header: 'Tx Hash', width: '140px',
      render: (t) => t.tx_hash ? (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-gray-500">{truncateAddress(t.tx_hash)}</span>
          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t.tx_hash!); toast('Tx hash copied'); }} className="text-gray-300 hover:text-gray-500"><Copy size={11} /></button>
          <a href={getExplorerUrl(t.chain, t.tx_hash)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-gray-300 hover:text-gray-500"><ExternalLink size={11} /></a>
        </div>
      ) : <span className="text-gray-300">-</span>,
    },
    {
      key: 'memo', header: 'Memo', width: '140px',
      render: (t) => <span className="text-sm text-gray-500 truncate">{t.memo || '-'}</span>,
    },
    {
      key: 'time', header: 'Time', width: '120px',
      render: (t) => <span className="text-xs text-gray-500">{formatRelativeTime(t.created_at)}</span>,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Send Money</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send stablecoins to any wallet across all supported chains</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500">Available &middot; {coin.symbol}</div>
            <div className="text-lg font-bold text-gray-900 tabular-nums">
              {formatAmount(merchantBalance, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); if (tab.key === 'send') resetForm(); }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-[3px] transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Send Tab */}
      {activeTab === 'send' && (
        <div className="max-w-2xl mx-auto">
          {step === 'form' && (
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">New Transfer</h2>
                <p className="text-sm text-gray-500 mt-0.5">Send stablecoins like a wire transfer — instant, low fees, any chain.</p>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Recipient */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Recipient</label>
                  <div className="relative mt-1.5">
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={e => { setRecipientAddress(e.target.value); setRecipientLabel(''); }}
                      onFocus={() => setRecipientSearchOpen(true)}
                      placeholder="0x... wallet address or search saved recipients"
                      className="w-full px-3 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    />
                    <button
                      onClick={() => setRecipientSearchOpen(!recipientSearchOpen)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-gray-400"
                    >
                      <ChevronDown size={16} />
                    </button>

                    {recipientSearchOpen && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        <div className="p-2 border-b border-gray-100">
                          <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={recipientSearch}
                              onChange={e => setRecipientSearch(e.target.value)}
                              placeholder="Search recipients..."
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        {filteredRecipients.length > 0 ? (
                          <div className="py-1">
                            {filteredRecipients.map(r => (
                              <button
                                key={r.id}
                                onClick={() => selectRecipient(r)}
                                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                  <Star size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900">{r.label}</div>
                                  <div className="text-xs text-gray-500">{r.full_name}{r.email ? ` · ${r.email}` : ''}</div>
                                  <div className="text-[10px] text-gray-400 font-mono">{truncateAddress(r.address)}</div>
                                </div>
                                <ChainBadge chain={r.chain} />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-400">No recipients found</div>
                        )}
                        <div className="border-t border-gray-100 p-2">
                          <button onClick={() => { setRecipientSearchOpen(false); }} className="text-sm text-gray-500 hover:text-gray-700 w-full text-left px-2 py-1">
                            Enter address manually
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {recipientLabel && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Star size={12} className="text-blue-500" />
                      <span className="text-xs text-blue-600 font-medium">{recipientLabel}</span>
                    </div>
                  )}
                  {recipientAddress && !isValidAddress && (
                    <p className="text-xs text-red-500 mt-1">Enter a valid Ethereum address (0x...)</p>
                  )}
                </div>

                {/* Currency */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Currency</label>
                  <div className="mt-1.5 grid grid-cols-4 gap-2">
                    {STABLECOIN_LIST.map(c => {
                      const active = currency === c.symbol;
                      return (
                        <button
                          key={c.symbol}
                          onClick={() => changeCurrency(c.symbol)}
                          title={`${c.name} · ${c.fiat}`}
                          className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-all ${
                            active
                              ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <CoinMark currency={c.symbol} size="lg" />
                          <span className={`text-[11px] font-semibold ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                            {c.symbol}
                          </span>
                          <span className="text-[9px] leading-none text-gray-400">
                            {formatAmount(balances[c.symbol], c.symbol)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    {coin.name} &middot; settles on {coin.networks.length} network{coin.networks.length === 1 ? '' : 's'}
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount ({coin.symbol})</label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{coin.sign}</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step={coin.precision === 0 ? '1' : '0.01'}
                      className="w-full pl-7 pr-16 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">{coin.symbol}</span>
                  </div>
                  {parsedAmount > 0 && total > merchantBalance && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} /> Insufficient {coin.symbol}. Available: {formatAmount(merchantBalance, currency)}
                    </p>
                  )}
                </div>

                {/* Chain selector */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Network</label>
                  <div className="relative mt-1.5">
                    <button
                      onClick={() => setChainDropdownOpen(!chainDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div className="flex items-center gap-3">
                        <ChainBadge chain={chain} />
                        <span className="text-gray-500">
                          Fee: {formatAmount(fee, currency)} &middot; Speed: {supportedChains.find(c => c.chain === chain)?.speed}
                        </span>
                      </div>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>

                    {chainDropdownOpen && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                        {availableChains.map(c => (
                          <button
                            key={c.chain}
                            onClick={() => { setChain(c.chain); setChainDropdownOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 ${chain === c.chain ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <ChainBadge chain={c.chain} />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Fee: {c.fee}</span>
                              <span>Speed: {c.speed}</span>
                              {chain === c.chain && <Check size={14} className="text-blue-600" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Memo */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Memo / Reference <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    placeholder="e.g. Invoice #1234, Vendor payment, Payroll"
                    className="w-full mt-1.5 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Save recipient checkbox */}
                {isValidAddress && !recipientLabel && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveRecipient}
                      onChange={e => setSaveRecipient(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Save this recipient for future transfers</span>
                  </label>
                )}

                {/* Summary */}
                {parsedAmount > 0 && isValidAddress && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Send amount</span>
                      <span className="font-medium text-gray-900">{formatAmount(parsedAmount, currency)} {coin.symbol}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Network fee</span>
                      <span className="text-gray-600">{formatAmount(fee, currency)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Total debit</span>
                      <span className="font-bold text-gray-900">{formatAmount(total, currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Estimated time</span>
                      <span className="text-gray-600">{estimateTime(chain)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleReview}
                  disabled={!canProceed}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Review Transfer <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Review & Confirm</h2>
                <p className="text-sm text-gray-500 mt-0.5">Please verify the details below before sending.</p>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Verify the recipient address</p>
                    <p className="text-xs text-blue-700 mt-0.5">Stablecoin transfers on-chain are irreversible. Double check the address and network before confirming.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Recipient', value: (
                      <div>
                        {recipientLabel && <div className="text-sm font-medium text-gray-900">{recipientLabel}</div>}
                        <div className="font-mono text-sm text-gray-700">{recipientAddress}</div>
                      </div>
                    )},
                    { label: 'Currency', value: <CoinBadge currency={currency} showName /> },
                    { label: 'Network', value: <ChainBadge chain={chain} /> },
                    { label: 'Amount', value: <span className="text-lg font-bold text-gray-900">{formatAmount(parsedAmount, currency)} {coin.symbol}</span> },
                    { label: 'Network Fee', value: <span className="text-sm text-gray-600">{formatAmount(fee, currency)}</span> },
                    { label: 'Total Debit', value: <span className="text-sm font-bold text-gray-900">{formatAmount(total, currency)}</span> },
                    { label: 'Est. Arrival', value: <span className="text-sm text-gray-600">{estimateTime(chain)}</span> },
                    ...(memo ? [{ label: 'Memo', value: <span className="text-sm text-gray-600">{memo}</span> }] : []),
                  ].map((row, i) => (
                    <div key={i} className="flex items-start justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-500">{row.label}</span>
                      <div className="text-right">{row.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Remaining balance after transfer</span>
                  <span className="text-sm font-semibold text-gray-900">{formatAmount(merchantBalance - total, currency)}</span>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setStep('form')}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send size={15} /> Confirm & Send {formatAmount(parsedAmount, currency)} {coin.symbol}
                </button>
              </div>
            </div>
          )}

          {step === 'sending' && (
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Loader2 size={28} className="text-blue-600 animate-spin" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Sending {formatAmount(parsedAmount, currency)} {coin.symbol}</h2>
              <p className="text-sm text-gray-500">Broadcasting transaction to {chain}...</p>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
                <span>Signing transaction</span>
                <ArrowRight size={12} />
                <span>Broadcasting</span>
                <ArrowRight size={12} />
                <span>Confirming</span>
              </div>
            </div>
          )}

          {step === 'success' && completedTx && (
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Transfer Sent Successfully</h2>
              <p className="text-sm text-gray-500 mb-6">
                {formatAmount(parsedAmount, currency)} {coin.symbol} sent to {recipientLabel || truncateAddress(recipientAddress)} on {chain}
              </p>

              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Transfer ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-gray-700">{completedTx.id}</span>
                    <button onClick={() => { navigator.clipboard.writeText(completedTx.id); toast('Transfer ID copied'); }} className="text-gray-300 hover:text-gray-500">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Tx Hash</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-gray-700">{truncateAddress(completedTx.txHash)}</span>
                    <button onClick={() => { navigator.clipboard.writeText(completedTx.txHash); toast('Tx hash copied'); }} className="text-gray-300 hover:text-gray-500">
                      <Copy size={12} />
                    </button>
                    <a href={getExplorerUrl(chain, completedTx.txHash)} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-500">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Currency</span>
                  <CoinBadge currency={currency} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Network</span>
                  <ChainBadge chain={chain} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Amount</span>
                  <span className="text-sm font-semibold text-gray-900">{formatAmount(parsedAmount, currency)} {coin.symbol}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Send size={14} /> Send Another
                </button>
                <a
                  href={getExplorerUrl(chain, completedTx.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <ExternalLink size={14} /> View on Explorer
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Sent (30d)', value: `≈ ${formatUSDC(mockTransfers.filter(t => t.status === 'completed').reduce((sum, t) => sum + toUsdCents(t.amount, t.currency), 0))}`, color: 'text-gray-900', note: 'USD equivalent across all currencies' },
              { label: 'Transfers (30d)', value: mockTransfers.length.toString(), color: 'text-gray-900' },
              { label: 'Avg. Transfer', value: `≈ ${formatUSDC(Math.round(mockTransfers.reduce((sum, t) => sum + toUsdCents(t.amount, t.currency), 0) / mockTransfers.length))}`, color: 'text-gray-900', note: 'USD equivalent' },
              { label: 'Total Fees (30d)', value: `≈ ${formatUSDC(mockTransfers.filter(t => t.status === 'completed').reduce((sum, t) => sum + toUsdCents(t.fee, t.currency), 0))}`, color: 'text-gray-500', note: 'USD equivalent' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                {'note' in stat && stat.note && (
                  <div className="text-[10px] text-gray-400 mt-0.5">{stat.note}</div>
                )}
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-0 border-b border-gray-200 mb-4">
            {(['all', 'completed', 'pending', 'failed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setHistoryTab(tab)}
                className={`px-5 py-3 text-sm font-medium border-b-[3px] transition-colors capitalize ${
                  historyTab === tab
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab} ({historyTabCounts[tab]})
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <DataTable
              columns={transferColumns}
              data={filteredTransfers}
              keyExtractor={t => t.id}
              emptyMessage="No transfers found"
              emptyAction={
                <button onClick={() => setActiveTab('send')} className="text-sm text-blue-600 font-medium hover:text-blue-700">
                  Send your first transfer
                </button>
              }
            />
          </div>
        </div>
      )}

      {/* Recipients Tab */}
      {activeTab === 'recipients' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{mockSavedRecipients.length} saved recipients</p>
            <button
              onClick={() => setAddRecipientOpen(true)}
              className="inline-flex items-center gap-2 px-4 h-9 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Plus size={15} /> Add Recipient
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {mockSavedRecipients.map(r => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Star size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{r.label}</span>
                    <ChainBadge chain={r.chain} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-600">{r.full_name}</span>
                    {r.email && <span className="text-xs text-gray-400">&middot; {r.email}</span>}
                  </div>
                  <div className="font-mono text-xs text-gray-400 mt-0.5">{r.address}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-gray-900">≈ {formatUSDC(r.total_sent)}</div>
                  <div className="text-xs text-gray-400">{r.transfer_count} transfers</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setActiveTab('send'); resetForm(); setRecipientAddress(r.address); setRecipientLabel(r.label); setChain(r.chain); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    <Send size={12} /> Send
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(r.address); toast('Address copied'); }}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Recipient Modal */}
          <Modal
            open={addRecipientOpen}
            onClose={() => { setAddRecipientOpen(false); setNewRecipientLabel(''); setNewRecipientName(''); setNewRecipientEmail(''); setNewRecipientAddress(''); setNewRecipientChain('base'); }}
            title="Add Recipient"
            footer={
              <div className="flex gap-3">
                <button onClick={() => setAddRecipientOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => { toast('Recipient saved'); setAddRecipientOpen(false); setNewRecipientLabel(''); setNewRecipientName(''); setNewRecipientEmail(''); setNewRecipientAddress(''); }}
                  disabled={!newRecipientLabel || !newRecipientName || !/^0x[a-fA-F0-9]{40}$/.test(newRecipientAddress)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Recipient
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Label</label>
                <input
                  type="text"
                  value={newRecipientLabel}
                  onChange={e => setNewRecipientLabel(e.target.value)}
                  placeholder="e.g. Vendor A, Marketing Agency"
                  className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={newRecipientName}
                    onChange={e => setNewRecipientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newRecipientEmail}
                    onChange={e => setNewRecipientEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Wallet Address</label>
                <input
                  type="text"
                  value={newRecipientAddress}
                  onChange={e => setNewRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full mt-1 px-3 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Preferred Network</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {supportedChains.map(c => (
                    <button
                      key={c.chain}
                      onClick={() => setNewRecipientChain(c.chain)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        newRecipientChain === c.chain
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <ChainBadge chain={c.chain} showLabel={false} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
