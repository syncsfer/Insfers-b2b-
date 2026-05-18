'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Bot, Plus, Wallet, Zap, Pause, Play, Settings, Copy, ArrowRight,
  CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Send,
  BarChart3, RefreshCw, Shield, Eye, TrendingUp, Activity,
  CreditCard, Brain, Cpu, CircleDollarSign,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { ChainBadge } from '@/components/ui/chain-badge';
import { WalletChip } from '@/components/ui/wallet-chip';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime, truncateAddress } from '@/lib/utils';
import { mockAgents, mockAgentActions, mockPayments, mockInvoices } from '@/lib/mock-data';
import type { AIAgent, AgentAction, AgentCapability, AgentStatus, Chain } from '@/types';

const capabilityConfig: Record<AgentCapability, { label: string; icon: React.ElementType; color: string }> = {
  create_invoice:       { label: 'Create Invoices',     icon: FileText,   color: 'text-blue-600 bg-blue-50' },
  send_payment:         { label: 'Send Payments',       icon: Send,       color: 'text-green-600 bg-green-50' },
  collect_payment:      { label: 'Collect Payments',    icon: CreditCard, color: 'text-purple-600 bg-purple-50' },
  generate_report:      { label: 'Generate Reports',    icon: BarChart3,  color: 'text-orange-600 bg-orange-50' },
  manage_subscriptions: { label: 'Manage Subscriptions', icon: RefreshCw, color: 'text-indigo-600 bg-indigo-50' },
  issue_refund:         { label: 'Issue Refunds',       icon: RefreshCw,  color: 'text-red-600 bg-red-50' },
  monitor_activity:     { label: 'Monitor Activity',    icon: Eye,        color: 'text-gray-600 bg-gray-50' },
};

const actionTypeIcons: Record<string, React.ElementType> = {
  invoice_created: FileText,
  payment_sent: Send,
  payment_collected: CreditCard,
  report_generated: BarChart3,
  subscription_renewed: RefreshCw,
  refund_issued: RefreshCw,
  anomaly_detected: AlertTriangle,
  reminder_sent: Clock,
};

function AgentCard({ agent, onToggle, onConfigure }: { agent: AIAgent; onToggle: () => void; onConfigure: () => void }) {
  const spendPercent = agent.spending_limit_daily > 0 ? Math.round((agent.spent_today / agent.spending_limit_daily) * 100) : 0;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${agent.status === 'active' ? 'border-gray-200' : 'border-gray-200 opacity-70'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${agent.status === 'active' ? 'bg-blue-600' : 'bg-gray-400'}`}>
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{agent.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  agent.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                  agent.status === 'paused' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-gray-50 text-gray-500 border border-gray-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-green-500' : agent.status === 'paused' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </span>
                <ChainBadge chain={agent.chain} showLabel={false} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onToggle} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400" title={agent.status === 'active' ? 'Pause agent' : 'Resume agent'}>
              {agent.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onClick={onConfigure} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400" title="Configure">
              <Settings size={14} />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-4">{agent.description}</p>

        {/* Agent wallet */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Agent Wallet</span>
            <span className="text-xs font-bold text-gray-900">{formatUSDC(agent.wallet_balance)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-400">{truncateAddress(agent.wallet_address)}</span>
            <Wallet size={10} className="text-gray-300" />
          </div>
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.capabilities.map(cap => {
            const cfg = capabilityConfig[cap];
            return (
              <span key={cap} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${cfg.color}`}>
                <cfg.icon size={10} /> {cfg.label}
              </span>
            );
          })}
        </div>

        {/* Spending */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-gray-500">Daily spend</span>
            <span className="font-medium text-gray-700">{formatUSDC(agent.spent_today)} / {formatUSDC(agent.spending_limit_daily)}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${spendPercent > 80 ? 'bg-red-500' : spendPercent > 50 ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(spendPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div>
            <div className="text-lg font-bold text-gray-900">{agent.actions_today}</div>
            <div className="text-[10px] text-gray-400">Today</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{agent.total_actions}</div>
            <div className="text-[10px] text-gray-400">Total actions</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{formatUSDC(agent.total_volume)}</div>
            <div className="text-[10px] text-gray-400">Volume</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({ action }: { action: AgentAction }) {
  const Icon = actionTypeIcons[action.type] || Activity;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        action.status === 'completed' ? 'bg-green-50 text-green-600' :
        action.status === 'failed' ? 'bg-red-50 text-red-600' :
        'bg-amber-50 text-amber-600'
      }`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{action.title}</span>
          {action.status === 'failed' && <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">Failed</span>}
          {action.status === 'pending' && <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">Pending</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
          <span className="font-medium text-gray-500">{action.agent_name}</span>
          <span>{formatRelativeTime(action.created_at)}</span>
          {action.amount && <span className="font-medium text-gray-600">{formatUSDC(action.amount)}</span>}
          {action.tx_hash && <span className="font-mono">{truncateAddress(action.tx_hash)}</span>}
        </div>
      </div>
    </div>
  );
}

function DetectionBadge({ type, agentName }: { type: 'human' | 'agent'; agentName?: string | null }) {
  if (type === 'agent') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200" title={agentName ? `Agent: ${agentName}` : 'AI Agent'}>
        <Bot size={9} /> Agent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
      <Wallet size={9} /> Wallet
    </span>
  );
}

const allCapabilities: AgentCapability[] = ['create_invoice', 'send_payment', 'collect_payment', 'generate_report', 'manage_subscriptions', 'issue_refund', 'monitor_activity'];
const allChains: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];

export default function AgentsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'agents' | 'activity' | 'detection'>('agents');
  const [createOpen, setCreateOpen] = useState(false);
  const [configAgent, setConfigAgent] = useState<AIAgent | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newChain, setNewChain] = useState<Chain>('base');
  const [newCaps, setNewCaps] = useState<AgentCapability[]>([]);
  const [newDailyLimit, setNewDailyLimit] = useState('5000');
  const [newTxLimit, setNewTxLimit] = useState('1000');

  // Detection data
  const agentPayments = mockPayments.filter(p => p.initiated_by === 'agent');
  const humanPayments = mockPayments.filter(p => p.initiated_by === 'human');
  const agentCreatedInvoices = mockInvoices.filter(i => i.created_by === 'agent');
  const agentPaidInvoices = mockInvoices.filter(i => i.paid_by === 'agent');

  const agentNameMap: Record<string, string> = {};
  for (const a of mockAgents) agentNameMap[a.id] = a.name;

  const closeCreate = () => {
    setCreateOpen(false);
    setNewName('');
    setNewDesc('');
    setNewChain('base');
    setNewCaps([]);
    setNewDailyLimit('5000');
    setNewTxLimit('1000');
  };

  const toggleCap = (cap: AgentCapability) => {
    setNewCaps(prev => prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]);
  };

  const tabs = [
    { key: 'agents', label: 'My Agents', count: mockAgents.length },
    { key: 'activity', label: 'Activity Feed', count: mockAgentActions.length },
    { key: 'detection', label: 'Agent Detection', count: agentPayments.length + agentPaidInvoices.length },
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-sm text-gray-500 mt-1">Autonomous agents that execute financial actions on your behalf</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 h-10 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Create Agent
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-[3px] transition-colors ${
              activeTab === tab.key ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Agents tab */}
      {activeTab === 'agents' && (
        <div>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Active Agents</div>
              <div className="text-2xl font-bold text-gray-900">{mockAgents.filter(a => a.status === 'active').length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Actions Today</div>
              <div className="text-2xl font-bold text-gray-900">{mockAgents.reduce((s, a) => s + a.actions_today, 0)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Total Agent Volume</div>
              <div className="text-2xl font-bold text-gray-900">{formatUSDC(mockAgents.reduce((s, a) => s + a.total_volume, 0))}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Combined Balance</div>
              <div className="text-2xl font-bold text-gray-900">{formatUSDC(mockAgents.reduce((s, a) => s + a.wallet_balance, 0))}</div>
            </div>
          </div>

          {/* Agent cards */}
          <div className="grid grid-cols-2 gap-4">
            {mockAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggle={() => toast(agent.status === 'active' ? `${agent.name} paused` : `${agent.name} resumed`)}
                onConfigure={() => setConfigAgent(agent)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Agent Activity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Real-time log of all actions taken by your AI agents</p>
          </div>
          <div className="px-5 py-2">
            {mockAgentActions.map(action => (
              <ActionRow key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* Detection tab */}
      {activeTab === 'detection' && (
        <div>
          {/* Detection summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Brain size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Agent vs. Wallet Detection</h2>
                <p className="text-xs text-gray-500">Every transaction is classified as initiated by an AI agent or a human wallet</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot size={14} className="text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">Agent Payments</span>
                </div>
                <div className="text-xl font-bold text-purple-900">{agentPayments.length}</div>
                <div className="text-[10px] text-purple-500">{formatUSDC(agentPayments.reduce((s, p) => s + p.amount, 0))} volume</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet size={14} className="text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">Wallet Payments</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{humanPayments.length}</div>
                <div className="text-[10px] text-gray-500">{formatUSDC(humanPayments.reduce((s, p) => s + p.amount, 0))} volume</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText size={14} className="text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Agent-Created Invoices</span>
                </div>
                <div className="text-xl font-bold text-blue-900">{agentCreatedInvoices.length}</div>
                <div className="text-[10px] text-blue-500">{formatUSDC(agentCreatedInvoices.reduce((s, i) => s + i.amount, 0))} total</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot size={14} className="text-green-600" />
                  <span className="text-xs font-medium text-green-700">Agent-Paid Invoices</span>
                </div>
                <div className="text-xl font-bold text-green-900">{agentPaidInvoices.length}</div>
                <div className="text-[10px] text-green-500">{formatUSDC(agentPaidInvoices.reduce((s, i) => s + i.amount, 0))} total</div>
              </div>
            </div>
          </div>

          {/* Recent agent-initiated payments */}
          <div className="bg-white border border-gray-200 rounded-xl mb-6">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent Payments — Agent Detection</h2>
              <Link href="/dashboard/payments" className="text-xs text-blue-600 font-medium hover:text-blue-700">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {mockPayments.slice(0, 15).map(p => (
                <Link key={p.id} href={`/dashboard/payments/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <DetectionBadge type={p.initiated_by} agentName={p.agent_id ? agentNameMap[p.agent_id] : null} />
                  <StatusPill status={p.status} size="sm" />
                  <span className="font-semibold text-sm text-gray-900 w-24 text-right">{formatUSDC(p.amount)}</span>
                  <span className="text-xs text-gray-400 font-mono flex-1">{truncateAddress(p.from_address)}</span>
                  {p.agent_id && <span className="text-[10px] text-purple-600 font-medium">{agentNameMap[p.agent_id]}</span>}
                  <ChainBadge chain={p.chain} showLabel={false} />
                  <span className="text-xs text-gray-400 w-20 text-right">{formatRelativeTime(p.created_at)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Invoice detection */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Invoices — Agent Detection</h2>
              <Link href="/dashboard/invoices" className="text-xs text-blue-600 font-medium hover:text-blue-700">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {mockInvoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-sm font-mono text-gray-500 w-20">{inv.id}</span>
                  <StatusPill status={inv.status} size="sm" />
                  <span className="font-semibold text-sm text-gray-900 w-24 text-right">{formatUSDC(inv.amount)}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">Created by:</span>
                    <DetectionBadge type={inv.created_by} agentName={inv.agent_id ? agentNameMap[inv.agent_id] : null} />
                    {inv.paid_by && (
                      <>
                        <span className="text-[10px] text-gray-400 ml-2">Paid by:</span>
                        <DetectionBadge type={inv.paid_by} agentName={inv.paid_by_agent_id ? agentNameMap[inv.paid_by_agent_id] : null} />
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{formatRelativeTime(inv.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Create AI Agent"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button onClick={closeCreate} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => {
                toast(`Agent "${newName}" created with dedicated wallet`);
                closeCreate();
              }}
              disabled={!newName || newCaps.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create Agent
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Agent Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Invoice Autopilot" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What should this agent do?" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Agent Wallet</label>
            <div className="mt-1 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500">A dedicated wallet will be created for this agent</span>
              </div>
              <div className="text-xs font-mono text-gray-400">0xA1B0T...{Math.random().toString(16).slice(2, 6)}</div>
              <p className="text-[10px] text-gray-400 mt-1">Fund this wallet with USDC to enable the agent to execute transactions</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Network</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {allChains.map(c => (
                <button
                  key={c}
                  onClick={() => setNewChain(c)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${newChain === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <ChainBadge chain={c} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Capabilities</label>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">What actions can this agent perform?</p>
            <div className="grid grid-cols-2 gap-2">
              {allCapabilities.map(cap => {
                const cfg = capabilityConfig[cap];
                const selected = newCaps.includes(cap);
                return (
                  <button
                    key={cap}
                    onClick={() => toggleCap(cap)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm ${
                      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <cfg.icon size={16} className={selected ? 'text-blue-600' : 'text-gray-400'} />
                    <span className={`font-medium ${selected ? 'text-blue-700' : 'text-gray-600'}`}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Daily Spending Limit (USDC)</label>
              <input type="number" value={newDailyLimit} onChange={e => setNewDailyLimit(e.target.value)} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Per-Transaction Limit (USDC)</label>
              <input type="number" value={newTxLimit} onChange={e => setNewTxLimit(e.target.value)} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <strong>Security:</strong> The agent can only spend up to the limits you set and can only perform the capabilities you enable. All agent actions are logged and auditable. You can pause or disable the agent at any time.
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Configure Agent Modal */}
      <Modal
        open={!!configAgent}
        onClose={() => setConfigAgent(null)}
        title={configAgent ? `Configure: ${configAgent.name}` : ''}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setConfigAgent(null)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => { toast('Agent configuration saved'); setConfigAgent(null); }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        }
      >
        {configAgent && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{configAgent.name}</h3>
                  <div className="text-xs text-gray-500 font-mono">{configAgent.id}</div>
                </div>
                <StatusPill status={configAgent.status} size="sm" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Agent Wallet</label>
              <div className="mt-1 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-mono text-gray-700">{truncateAddress(configAgent.wallet_address)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Balance: {formatUSDC(configAgent.wallet_balance)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(configAgent.wallet_address); toast('Address copied'); }} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => toast('Top-up initiated')} className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100">
                    Fund Wallet
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Daily Spending Limit</label>
                <input type="number" defaultValue={configAgent.spending_limit_daily / 100} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Per-Transaction Limit</label>
                <input type="number" defaultValue={configAgent.spending_limit_per_tx / 100} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Enabled Capabilities</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {allCapabilities.map(cap => {
                  const cfg = capabilityConfig[cap];
                  const enabled = configAgent.capabilities.includes(cap);
                  return (
                    <div key={cap} className={`flex items-center gap-2 p-3 rounded-lg border ${enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                      <input type="checkbox" defaultChecked={enabled} className="rounded" />
                      <cfg.icon size={14} className={enabled ? 'text-blue-600' : 'text-gray-400'} />
                      <span className={`text-sm ${enabled ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-200">
              <button onClick={() => { toast(`${configAgent.name} ${configAgent.status === 'active' ? 'paused' : 'resumed'}`); setConfigAgent(null); }} className={`px-4 py-2 text-sm font-medium rounded-lg border ${configAgent.status === 'active' ? 'text-amber-700 border-amber-200 hover:bg-amber-50' : 'text-green-700 border-green-200 hover:bg-green-50'}`}>
                {configAgent.status === 'active' ? 'Pause Agent' : 'Resume Agent'}
              </button>
              <button onClick={() => { toast(`${configAgent.name} disabled`); setConfigAgent(null); }} className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                Disable Agent
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export { DetectionBadge };
