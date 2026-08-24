'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Play, Copy, Check, RotateCcw, Wallet, Zap, BookOpen, ChevronDown,
  CircleDot, Loader2, ExternalLink, ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import {
  API_ENDPOINTS, WEBHOOK_EVENTS, TEST_WALLETS, SANDBOX_FACTS,
  DEV_CATEGORIES, type ApiParam,
} from '@/lib/developer-content';

interface RunResult {
  status: number;
  ok: boolean;
  ms: number;
  body: string;
}

/** A short, readable copy button used throughout the sandbox. */
function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100"
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// API explorer
// ---------------------------------------------------------------------------

/**
 * Issues real requests against this app's own API routes.
 *
 * The point of a sandbox explorer is that it actually runs — a form that only
 * printed a curl command would teach you nothing about what comes back.
 */
function ApiExplorer() {
  const [endpointId, setEndpointId] = useState(API_ENDPOINTS[0].id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [pathId, setPathId] = useState('pi_001');
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  const endpoint = useMemo(
    () => API_ENDPOINTS.find(e => e.id === endpointId) ?? API_ENDPOINTS[0],
    [endpointId],
  );
  const params: ApiParam[] = endpoint.method === 'GET' ? endpoint.query ?? [] : endpoint.body ?? [];
  const needsPathId = endpoint.localPath.includes('{id}');

  const selectEndpoint = (id: string) => {
    setEndpointId(id);
    setValues({});
    setResult(null);
  };

  /** Coerce a form string into the JSON type the handler expects. */
  const coerce = (param: ApiParam, raw: string): unknown => {
    if (param.type === 'integer') return Number(raw);
    if (param.type === 'boolean') return raw === 'true';
    if (param.type === 'array') return raw.split(',').map(s => s.trim()).filter(Boolean);
    if (param.type === 'object') {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return raw;
  };

  const filled = Object.entries(values).filter(([, v]) => v !== '');

  const buildUrl = () => {
    const path = endpoint.localPath.replace('{id}', pathId);
    if (endpoint.method !== 'GET' || filled.length === 0) return path;
    const qs = new URLSearchParams(filled.map(([k, v]) => [k, v] as [string, string]));
    return `${path}?${qs}`;
  };

  const buildBody = () => {
    if (endpoint.method === 'GET') return undefined;
    const body: Record<string, unknown> = {};
    for (const [k, v] of filled) {
      const param = params.find(p => p.name === k);
      if (param) body[k] = coerce(param, v);
    }
    return body;
  };

  const run = async () => {
    setRunning(true);
    const started = performance.now();
    try {
      const body = buildBody();
      const res = await fetch(buildUrl(), {
        method: endpoint.method,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      });
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* leave as-is */ }
      setResult({ status: res.status, ok: res.ok, ms: Math.round(performance.now() - started), body: pretty });
    } catch (err) {
      setResult({
        status: 0,
        ok: false,
        ms: Math.round(performance.now() - started),
        body: err instanceof Error ? err.message : 'Request failed',
      });
    } finally {
      setRunning(false);
    }
  };

  const curl = useMemo(() => {
    const lines = [`curl https://api.chainpayments.com${endpoint.path.replace('{id}', pathId)}`];
    if (endpoint.method !== 'GET') lines.push(`  -X ${endpoint.method}`);
    lines.push('  -H "Authorization: Bearer $CHAIN_PAYMENTS_SECRET_KEY"');
    const body = buildBody();
    if (body) {
      for (const [k, v] of Object.entries(body)) {
        lines.push(`  -d ${k}=${typeof v === 'string' ? `"${v}"` : Array.isArray(v) ? `"${v.join(',')}"` : JSON.stringify(v)}`);
      }
    } else if (filled.length) {
      lines[0] += '?' + filled.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    }
    return lines.join(' \\\n');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, values, pathId]);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">API explorer</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Sends a real request to this environment and shows exactly what comes back.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
        {/* Request */}
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Endpoint</label>
            <div className="relative mt-1">
              <select
                value={endpointId}
                onChange={e => selectEndpoint(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 pr-9 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DEV_CATEGORIES.map(cat => {
                  const group = API_ENDPOINTS.filter(e => e.category === cat.id);
                  if (!group.length) return null;
                  return (
                    <optgroup key={cat.id} label={cat.name}>
                      {group.map(e => (
                        <option key={e.id} value={e.id}>{e.method} {e.path}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="mt-1.5 text-[12px] text-gray-500">{endpoint.summary}</p>
          </div>

          {needsPathId && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Path id
              </label>
              <input
                value={pathId}
                onChange={e => setPathId(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {params.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {endpoint.method === 'GET' ? 'Query parameters' : 'Body'}
              </p>
              {params.map(p => (
                <div key={p.name}>
                  <label className="flex items-baseline gap-1.5">
                    <code className="text-[12px] font-mono font-medium text-gray-700">{p.name}</code>
                    {p.required && <span className="text-[10px] font-semibold text-red-600">required</span>}
                    <span className="text-[10px] text-gray-400">{p.type}</span>
                  </label>
                  {p.enum ? (
                    <div className="relative mt-1">
                      <select
                        value={values[p.name] ?? ''}
                        onChange={e => setValues(v => ({ ...v, [p.name]: e.target.value }))}
                        className="w-full appearance-none px-3 py-2 pr-9 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">—</option>
                        {p.enum.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <input
                      value={values[p.name] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [p.name]: e.target.value }))}
                      placeholder={p.type === 'integer' ? '0' : p.type === 'array' ? 'comma,separated' : ''}
                      className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={run}
            disabled={running}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={14} />}
            {running ? 'Sending…' : 'Send request'}
          </button>
        </div>

        {/* Response */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Response</p>
            {result && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                    result.ok
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {result.status || 'ERR'}
                </span>
                <span className="text-[11px] text-gray-400">{result.ms}ms</span>
              </div>
            )}
          </div>

          <pre className="rounded-lg bg-gray-900 p-3.5 overflow-auto max-h-[280px] min-h-[120px]">
            <code className="text-[11.5px] leading-relaxed font-mono text-gray-300 whitespace-pre">
              {result?.body ?? '// Send a request to see the response'}
            </code>
          </pre>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Same request, as curl
              </p>
              <CopyButton value={curl} />
            </div>
            <pre className="rounded-lg bg-gray-50 border border-gray-200 p-3 overflow-x-auto">
              <code className="text-[11.5px] leading-relaxed font-mono text-gray-600 whitespace-pre">
                {curl}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event builder
// ---------------------------------------------------------------------------

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Builds a signed event payload for a chosen event type.
 *
 * It deliberately does not claim to deliver anything: we have no server here to
 * POST from, and showing a fake "delivered" status would teach a developer to
 * trust a green tick that means nothing. Instead it hands over a genuinely
 * signed body and the command to replay it at their own handler.
 */
function EventBuilder() {
  const { toast } = useToast();
  const [type, setType] = useState(WEBHOOK_EVENTS[0].type);
  const [secret, setSecret] = useState('whsec_sandbox_3f9a2b7c1d84');
  const [target, setTarget] = useState('http://localhost:3000/webhooks/chain-payments');
  const [signed, setSigned] = useState<{ header: string; payload: string } | null>(null);
  const [signing, setSigning] = useState(false);

  const event = WEBHOOK_EVENTS.find(e => e.type === type) ?? WEBHOOK_EVENTS[0];

  const sign = async () => {
    setSigning(true);
    try {
      // Timestamp is read at click time, never during render — a clock read in
      // render would differ between server and client and break hydration.
      const ts = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify(
        {
          id: `evt_${Math.random().toString(36).slice(2, 12)}`,
          object: 'event',
          type: event.type,
          created: ts,
          livemode: false,
          data: { object: event.sample },
        },
        null,
        2,
      );
      const signature = await hmacSha256(secret, `${ts}.${payload}`);
      setSigned({ header: `t=${ts},v1=${signature}`, payload });
    } catch {
      toast('Could not sign — Web Crypto needs a secure context');
    } finally {
      setSigning(false);
    }
  };

  const replayCommand = signed
    ? `curl ${target} \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Chain-Signature: ${signed.header}" \\
  -d '${signed.payload.replace(/\n\s*/g, '')}'`
    : '';

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">Event builder</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Produces a real signed payload you can replay at your own handler to test verification.
        </p>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Event type</label>
            <div className="relative mt-1">
              <select
                value={type}
                onChange={e => { setType(e.target.value); setSigned(null); }}
                className="w-full appearance-none px-3 py-2 pr-9 text-sm font-mono border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {WEBHOOK_EVENTS.map(e => <option key={e.type} value={e.type}>{e.type}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Endpoint secret</label>
            <input
              value={secret}
              onChange={e => { setSecret(e.target.value); setSigned(null); }}
              className="w-full mt-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Your handler URL</label>
          <input
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="w-full mt-1 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p className="text-[12px] leading-relaxed text-gray-500">{event.description}</p>

        <button
          onClick={sign}
          disabled={signing}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
        >
          {signing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          Sign this event
        </button>

        {signed && (
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Chain-Signature</p>
                <CopyButton value={signed.header} />
              </div>
              <pre className="rounded-lg bg-gray-50 border border-gray-200 p-3 overflow-x-auto">
                <code className="text-[11.5px] font-mono text-gray-600 whitespace-pre-wrap break-all">
                  {signed.header}
                </code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Payload</p>
                <CopyButton value={signed.payload} />
              </div>
              <pre className="rounded-lg bg-gray-900 p-3.5 overflow-auto max-h-[240px]">
                <code className="text-[11.5px] leading-relaxed font-mono text-gray-300 whitespace-pre">
                  {signed.payload}
                </code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Replay it</p>
                <CopyButton value={replayCommand} label="Copy command" />
              </div>
              <pre className="rounded-lg bg-gray-50 border border-gray-200 p-3 overflow-x-auto">
                <code className="text-[11.5px] leading-relaxed font-mono text-gray-600 whitespace-pre">
                  {replayCommand}
                </code>
              </pre>
              <p className="mt-1.5 text-[11px] text-gray-400">
                The signature is genuine — verifying it with the code in{' '}
                <Link href="/developers/webhooks" className="text-blue-600 hover:underline">
                  the webhooks guide
                </Link>{' '}
                will pass, and tampering with the payload will fail.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sandbox tab
// ---------------------------------------------------------------------------

const OUTCOME_STYLE: Record<string, string> = {
  succeeds: 'bg-green-50 text-green-700 border-green-200',
  fails: 'bg-red-50 text-red-700 border-red-200',
  delays: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function SandboxPanel() {
  const { toast } = useToast();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <Zap size={15} className="text-amber-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">You are in the sandbox</p>
          <p className="text-[13px] leading-relaxed text-amber-800 mt-0.5">
            Every object here is a test object and every balance is testnet funds. Sandbox keys
            cannot move real money.
          </p>
        </div>
        <Link
          href="/developers/sandbox"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white border border-amber-200 text-[12px] font-medium text-amber-800 hover:bg-amber-100"
        >
          <BookOpen size={13} /> Guide
        </Link>
      </div>

      <ApiExplorer />

      {/* Test wallets */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Test wallets</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Deterministic addresses — the same address always produces the same outcome, so you can
              assert on them.
            </p>
          </div>
          <Wallet size={16} className="text-gray-300 shrink-0" />
        </div>
        <div className="divide-y divide-gray-100">
          {TEST_WALLETS.map(w => (
            <div key={w.address} className="px-4 py-3 flex items-start gap-3">
              <CircleDot
                size={14}
                className={`mt-0.5 shrink-0 ${
                  w.outcome === 'succeeds' ? 'text-green-500'
                  : w.outcome === 'fails' ? 'text-red-500'
                  : 'text-amber-500'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-gray-900">{w.label}</span>
                  <span className={`px-1.5 py-px rounded border text-[10px] font-semibold ${OUTCOME_STYLE[w.outcome]}`}>
                    {w.outcome}
                  </span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-gray-500 mt-0.5">{w.behaviour}</p>
                <code className="mt-1 block text-[11px] font-mono text-gray-400 truncate">{w.address}</code>
              </div>
              <CopyButton value={w.address} />
            </div>
          ))}
        </div>
      </div>

      <EventBuilder />

      {/* Facts + reset */}
      <div className="grid sm:grid-cols-2 gap-3">
        {SANDBOX_FACTS.map(f => (
          <div key={f.title} className="rounded-xl border border-gray-200 p-4">
            <p className="text-[13px] font-semibold text-gray-900">{f.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-gray-500">{f.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-gray-900">Reset this sandbox</p>
          <p className="text-[12.5px] text-gray-500 mt-0.5">
            Clears sandbox payments, customers, and events. Your keys and webhook endpoints survive.
          </p>
        </div>
        <button
          onClick={() => toast('Sandbox reset requires the live backend — not wired up in this build')}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <p className="text-[12px] text-gray-400">
        Looking for the full API?{' '}
        <Link href="/developers/api-reference" className="text-blue-600 hover:underline inline-flex items-center gap-1">
          API reference <ExternalLink size={10} />
        </Link>
      </p>
    </div>
  );
}
