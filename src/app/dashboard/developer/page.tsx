'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Key, Webhook, ScrollText, TestTube, BookOpen, Plus, Copy, Trash2, Check, X } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatRelativeTime } from '@/lib/utils';
import { mockApiKeys, mockWebhooks, mockWebhookLogs } from '@/lib/mock-data';
import { useCollection, newId } from '@/lib/use-collection';
import { WEBHOOK_EVENTS } from '@/lib/developer-content';
import { SandboxPanel } from './sandbox';
import type { ApiKey, WebhookEndpoint, WebhookLog } from '@/types';

const sectionTabs = [
  { key: 'sandbox', label: 'Sandbox', icon: TestTube },
  { key: 'api-keys', label: 'API Keys', icon: Key },
  { key: 'webhooks', label: 'Webhooks', icon: Webhook },
  { key: 'logs', label: 'Event Logs', icon: ScrollText },
] as const;

const TAB_KEYS = sectionTabs.map(t => t.key) as readonly string[];

export default function DeveloperPage() {
  return (
    // useSearchParams needs a Suspense boundary to keep the route statically
    // renderable rather than forcing the whole page dynamic.
    <Suspense fallback={null}>
      <DeveloperConsole />
    </Suspense>
  );
}

function DeveloperConsole() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { items: apiKeys, add: addApiKey } = useCollection<ApiKey>('api-keys', mockApiKeys);
  const { items: webhooks, add: addWebhook } = useCollection<WebhookEndpoint>('webhooks', mockWebhooks);

  // Docs deep-link into a specific tab, e.g. /dashboard/developer?tab=sandbox.
  const requested = searchParams.get('tab');
  const [override, setOverride] = useState<string | null>(null);
  const activeSection = override ?? (requested && TAB_KEYS.includes(requested) ? requested : 'sandbox');
  const setActiveSection = setOverride;
  const [createKeyOpen, setCreateKeyOpen] = useState(false);
  const [createWebhookOpen, setCreateWebhookOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyMode, setKeyMode] = useState<'test' | 'live'>('test');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['payment.succeeded']);

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
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Developer Console</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Keys, webhooks, and a sandbox to build against.{' '}
            <Link href="/developers" className="text-blue-600 hover:underline">
              Read the docs
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/developers"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <BookOpen size={14} /> Docs
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-amber-700">Test Mode</span>
          </div>
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

      {/* Sandbox */}
      {activeSection === 'sandbox' && <SandboxPanel />}

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
            <DataTable columns={apiKeyColumns} data={apiKeys} keyExtractor={(k) => k.id} emptyMessage="No API keys" />
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
            <DataTable columns={webhookColumns} data={webhooks} keyExtractor={(w) => w.id} emptyMessage="No webhook endpoints" />
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
            <button onClick={() => {
              addApiKey({
                id: newId('key'),
                name: keyName,
                key_prefix: `sk_${keyMode === 'live' ? 'live' : 'test'}_${Math.random().toString(36).slice(2, 6)}...${Math.random().toString(36).slice(2, 6)}`,
                mode: keyMode,
                created_at: new Date().toISOString(),
                last_used_at: null,
              });
              toast(`API key "${keyName}" created`);
              setCreateKeyOpen(false);
              setKeyName('');
            }} disabled={!keyName} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50">Create</button>
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
            <button onClick={() => {
              addWebhook({
                id: newId('we'),
                url: webhookUrl,
                events: selectedEvents,
                active: true,
                secret: `whsec_${Math.random().toString(36).slice(2, 14)}`,
                created_at: new Date().toISOString(),
                last_delivery_at: null,
                success_rate: 100,
              });
              toast(`Endpoint added for ${selectedEvents.length} event${selectedEvents.length === 1 ? '' : 's'}`);
              setCreateWebhookOpen(false);
              setWebhookUrl('');
              setSelectedEvents(['payment.succeeded']);
            }} disabled={!webhookUrl || selectedEvents.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50">Add endpoint</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Endpoint URL</label>
            <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://api.example.com/webhooks" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Events to listen to</label>
              <span className="text-[11px] text-gray-400">{selectedEvents.length} selected</span>
            </div>
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-50">
              {WEBHOOK_EVENTS.map(evt => (
                <label key={evt.type} className="flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(evt.type)}
                    onChange={() => setSelectedEvents(prev =>
                      prev.includes(evt.type)
                        ? prev.filter(t => t !== evt.type)
                        : [...prev, evt.type])}
                    className="mt-0.5 rounded"
                  />
                  <span className="min-w-0">
                    <code className="text-xs font-mono text-gray-700">{evt.type}</code>
                    <span className="block text-[11px] leading-relaxed text-gray-400">{evt.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
