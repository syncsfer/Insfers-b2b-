'use client';

import { useState } from 'react';
import { Key, Webhook, ScrollText, Plus, Copy, Eye, EyeOff, Trash2, Check, X } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatRelativeTime } from '@/lib/utils';
import { mockApiKeys, mockWebhooks, mockWebhookLogs } from '@/lib/mock-data';
import type { ApiKey, WebhookEndpoint, WebhookLog } from '@/types';

const sectionTabs = [
  { key: 'api-keys', label: 'API Keys', icon: Key },
  { key: 'webhooks', label: 'Webhooks', icon: Webhook },
  { key: 'logs', label: 'Event Logs', icon: ScrollText },
] as const;

export default function DeveloperPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string>('api-keys');
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [createKeyOpen, setCreateKeyOpen] = useState(false);
  const [createWebhookOpen, setCreateWebhookOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyMode, setKeyMode] = useState<'test' | 'live'>('test');
  const [webhookUrl, setWebhookUrl] = useState('');

  const apiKeyColumns: Column<ApiKey>[] = [
    {
      key: 'name', header: 'Name', width: '160px',
      render: (k) => <span className="text-sm font-medium text-gray-900">{k.name}</span>,
    },
    {
      key: 'key', header: 'Key', width: '250px',
      render: (k) => (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">{k.key_prefix}</code>
          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(k.key_prefix); toast('Key copied'); }} className="text-gray-300 hover:text-gray-500">
            <Copy size={12} />
          </button>
        </div>
      ),
    },
    {
      key: 'mode', header: 'Mode', width: '80px',
      render: (k) => (
        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full ${
          k.mode === 'live' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {k.mode}
        </span>
      ),
    },
    {
      key: 'last_used', header: 'Last Used', width: '120px',
      render: (k) => <span className="text-xs text-gray-500">{k.last_used_at ? formatRelativeTime(k.last_used_at) : 'Never'}</span>,
    },
    {
      key: 'created', header: 'Created', width: '120px',
      render: (k) => <span className="text-xs text-gray-500">{formatRelativeTime(k.created_at)}</span>,
    },
    {
      key: 'actions', header: '', width: '50px', align: 'center',
      render: () => (
        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
      ),
    },
  ];

  const webhookColumns: Column<WebhookEndpoint>[] = [
    {
      key: 'url', header: 'Endpoint URL', width: '300px',
      render: (w) => <code className="text-xs font-mono text-gray-700">{w.url}</code>,
    },
    {
      key: 'events', header: 'Events', width: '120px',
      render: (w) => <span className="text-sm text-gray-500">{w.events.length} events</span>,
    },
    {
      key: 'status', header: 'Status', width: '80px',
      render: (w) => <StatusPill status={w.active ? 'active' : 'expired'} size="sm" />,
    },
    {
      key: 'success_rate', header: 'Success Rate', width: '100px', align: 'right',
      render: (w) => <span className={`text-sm font-medium ${w.success_rate >= 95 ? 'text-green-600' : 'text-amber-600'}`}>{w.success_rate}%</span>,
    },
    {
      key: 'last_delivery', header: 'Last Delivery', width: '120px',
      render: (w) => <span className="text-xs text-gray-500">{w.last_delivery_at ? formatRelativeTime(w.last_delivery_at) : 'Never'}</span>,
    },
  ];

  const logColumns: Column<WebhookLog>[] = [
    {
      key: 'event', header: 'Event', width: '180px',
      render: (l) => <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">{l.event_type}</code>,
    },
    {
      key: 'status', header: 'Status', width: '100px',
      render: (l) => l.success ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><Check size={12} /> {l.status_code}</span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700"><X size={12} /> {l.status_code}</span>
      ),
    },
    {
      key: 'response_time', header: 'Response Time', width: '120px', align: 'right',
      render: (l) => <span className="text-xs text-gray-500">{l.response_time_ms}ms</span>,
    },
    {
      key: 'endpoint', header: 'Endpoint', width: '120px',
      render: (l) => <span className="text-xs font-mono text-gray-400">{l.endpoint_id}</span>,
    },
    {
      key: 'time', header: 'Time', width: '120px',
      render: (l) => <span className="text-xs text-gray-500">{formatRelativeTime(l.created_at)}</span>,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Developer Console</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-medium text-amber-700">Test Mode</span>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 mb-6">
        {sectionTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === tab.key ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* API Keys */}
      {activeSection === 'api-keys' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Manage API keys for authenticating requests</p>
            <button onClick={() => setCreateKeyOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={14} /> Create key
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <DataTable columns={apiKeyColumns} data={mockApiKeys} keyExtractor={(k) => k.id} emptyMessage="No API keys" />
          </div>

          {/* Quick reference */}
          <div className="mt-6 bg-gray-900 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-100 mb-3">Quick Start</h3>
            <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
{`curl https://api.chainpayments.com/v1/payment_intents \\
  -H "Authorization: Bearer sk_test_xxxx" \\
  -d amount=5000 \\
  -d chain=base`}
            </pre>
          </div>
        </div>
      )}

      {/* Webhooks */}
      {activeSection === 'webhooks' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Configure webhook endpoints for real-time event notifications</p>
            <button onClick={() => setCreateWebhookOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus size={14} /> Add endpoint
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <DataTable columns={webhookColumns} data={mockWebhooks} keyExtractor={(w) => w.id} emptyMessage="No webhook endpoints" />
          </div>
        </div>
      )}

      {/* Event Logs */}
      {activeSection === 'logs' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">Recent webhook delivery attempts</p>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <DataTable columns={logColumns} data={mockWebhookLogs} keyExtractor={(l) => l.id} emptyMessage="No logs yet" />
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      <Modal open={createKeyOpen} onClose={() => setCreateKeyOpen(false)} title="Create API Key"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setCreateKeyOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg">Cancel</button>
            <button onClick={() => { toast('API key created'); setCreateKeyOpen(false); }} disabled={!keyName} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50">Create</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Key name</label>
            <input value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="My API Key" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Mode</label>
            <div className="flex gap-3 mt-1">
              {(['test', 'live'] as const).map(m => (
                <label key={m} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${keyMode === m ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <input type="radio" checked={keyMode === m} onChange={() => setKeyMode(m)} />
                  <span className="text-sm capitalize">{m}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Create Webhook Modal */}
      <Modal open={createWebhookOpen} onClose={() => setCreateWebhookOpen(false)} title="Add Webhook Endpoint"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setCreateWebhookOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg">Cancel</button>
            <button onClick={() => { toast('Webhook endpoint added'); setCreateWebhookOpen(false); }} disabled={!webhookUrl} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50">Add endpoint</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Endpoint URL</label>
            <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://api.example.com/webhooks" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Events to listen to</label>
            <div className="mt-2 space-y-2">
              {['payment.succeeded', 'payment.failed', 'refund.created', 'refund.completed', 'invoice.paid'].map(evt => (
                <label key={evt} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <code className="text-xs font-mono text-gray-600">{evt}</code>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
