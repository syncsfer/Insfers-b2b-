'use client';

import { CodeTabs } from './code-block';
import {
  codeSample, LANGUAGES, type ApiEndpoint, type ApiParam,
} from '@/lib/developer-content';

const METHOD_STYLE: Record<string, string> = {
  GET: 'bg-blue-50 text-blue-700 border-blue-200',
  POST: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PATCH: 'bg-amber-50 text-amber-700 border-amber-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
};

/** Example values so the generated sample is runnable, not a shape with holes. */
const EXAMPLE: Record<string, unknown> = {
  amount: 5000,
  chain: 'base',
  currency: 'USDC',
  merchant_address: '0x9dE24F2c5A1b7E3f8C0a4B6d2E9f1A3c5B7d113a',
  description: 'Pro plan — annual',
  customer_email: 'customer@example.com',
  payment_intent_id: 'pi_3Nk2LmQ8',
  method: 'claimable',
  reason: 'Customer cancelled',
  name: 'Pro Plan',
  chains: ['base', 'ethereum'],
  payment_id: 'pi_3Nk2LmQ8',
  duration: 86400,
  customer_id: 'cus_9Fh2Kd',
  plan_name: 'Pro monthly',
  interval: 'month',
  wallet_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  settlement_wallet: '0x9dE24F2c5A1b7E3f8C0a4B6d2E9f1A3c5B7d113a',
  label: 'Acme Studio',
  recipient_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  url: 'https://example.com/webhooks/chain-payments',
  events: ['payment.succeeded', 'payment.failed'],
  email: 'customer@example.com',
  status: 'succeeded',
  limit: 25,
};

function ParamTable({ title, params }: { title: string; params: ApiParam[] }) {
  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</p>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {params.map(p => (
          <div key={p.name} className="px-3 py-2.5">
            <div className="flex items-baseline gap-2 flex-wrap">
              <code className="text-[12.5px] font-mono font-medium text-gray-900">{p.name}</code>
              <span className="text-[11px] text-gray-400">{p.type}</span>
              {p.required && (
                <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">Required</span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-gray-600">{p.description}</p>
            {p.enum && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {p.enum.map(v => (
                  <code key={v} className="px-1.5 py-0.5 rounded bg-gray-100 text-[11px] font-mono text-gray-600">
                    {v}
                  </code>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  // Build the sample from required params plus one or two illustrative extras,
  // so the snippet is short enough to read but still actually works.
  const source = endpoint.method === 'GET' ? endpoint.query ?? [] : endpoint.body ?? [];
  const chosen = source.filter(p => p.required || (endpoint.method === 'GET' && p.name === 'limit'));
  const params: Record<string, unknown> = {};
  for (const p of chosen.length ? chosen : source.slice(0, 2)) {
    if (p.name in EXAMPLE) params[p.name] = EXAMPLE[p.name];
  }

  const samples = codeSample(endpoint, params);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${METHOD_STYLE[endpoint.method]}`}>
            {endpoint.method}
          </span>
          <code className="text-[13px] font-mono font-medium text-gray-900">{endpoint.path}</code>
        </div>
        <p className="mt-1.5 text-[13px] text-gray-600">{endpoint.summary}</p>
      </div>

      <div className="p-4">
        <CodeTabs samples={LANGUAGES.map(l => ({ id: l.id, label: l.label, source: samples[l.id] }))} />
        {endpoint.query && endpoint.query.length > 0 && (
          <ParamTable title="Query parameters" params={endpoint.query} />
        )}
        {endpoint.body && endpoint.body.length > 0 && (
          <ParamTable title="Body parameters" params={endpoint.body} />
        )}
      </div>
    </div>
  );
}
