'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Wallet, Loader2, Check, AlertTriangle, Clock, ExternalLink, Copy,
  ShieldCheck, XCircle, Ban,
} from 'lucide-react';
import { ChainBadge } from '@/components/ui/chain-badge';
import { CoinBadge } from '@/components/ui/coin-badge';
import { truncateAddress, getExplorerUrl } from '@/lib/utils';
import { formatAmount } from '@/lib/currencies';
import { mockRefunds, mockPayments } from '@/lib/mock-data';

type Step = 'connect' | 'choose' | 'claiming' | 'done';

/** Human countdown to expiry, or null once it's passed. */
function timeLeft(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[500px]">
        <div className="rounded-2xl bg-white p-8 shadow-xl">{children}</div>
        <p className="mt-5 text-center">
          <Link
            href="/security"
            className="inline-flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-blue-500"
          >
            <ShieldCheck size={11} /> Secured by <span className="font-medium">Chain Payments</span>
          </Link>
        </p>
      </div>
    </div>
  );
}

/** Terminal states — the link exists but can't be used. */
function Blocked({
  icon: Icon,
  tone,
  title,
  body,
  children,
}: {
  icon: React.ElementType;
  tone: 'gray' | 'red' | 'green';
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  const tones = {
    gray: 'bg-gray-100 text-gray-500',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600',
  };
  return (
    <Shell>
      <div className="text-center">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon size={26} />
        </div>
        <h1 className="mb-1 text-lg font-semibold text-gray-900">{title}</h1>
        <p className="text-sm leading-relaxed text-gray-500">{body}</p>
        {children}
      </div>
    </Shell>
  );
}

export default function ClaimRefundPage({
  params,
}: {
  params: Promise<{ refundId: string }>;
}) {
  const { refundId } = use(params);

  const refund = mockRefunds.find(r => r.id === refundId)
    // Fall back to any claimable refund so a demo link always resolves.
    ?? mockRefunds.find(r => r.method === 'claimable' && r.status === 'awaiting_claim')
    ?? mockRefunds[0];
  const payment = mockPayments.find(p => p.id === refund?.payment_intent_id);

  const [step, setStep] = useState<Step>('connect');
  const [connectedWallet, setConnectedWallet] = useState('');
  const [useDifferent, setUseDifferent] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [claimTx, setClaimTx] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<string | null>(null);

  const expiresAt = refund?.claim_expires_at ?? null;

  // Live countdown so a link that lapses while open stops being actionable.
  useEffect(() => {
    const tick = () => setRemaining(timeLeft(expiresAt));
    // Deferred so the first paint matches the server render.
    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, 30_000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [expiresAt]);

  if (!refund) {
    return (
      <Blocked
        icon={XCircle}
        tone="gray"
        title="Claim link not found"
        body="This link doesn't match any refund. Check the link in your email, or contact the merchant."
      />
    );
  }

  const merchantName = 'Acme Corp';
  const amountLabel = `${formatAmount(refund.amount, refund.currency)} ${refund.currency}`;

  // --- Terminal states, derived from the refund rather than toggled by hand ---

  if (refund.claim_revoked_at) {
    return (
      <Blocked
        icon={Ban}
        tone="gray"
        title="This claim link was cancelled"
        body={`${merchantName} cancelled this refund link and the funds were returned to them. Contact them if you believe this is a mistake.`}
      />
    );
  }

  if (refund.claimed_at || refund.claimed_by) {
    return (
      <Blocked
        icon={Check}
        tone="green"
        title="This refund was already claimed"
        body={`${amountLabel} was sent to the address below.`}
      >
        <div className="mt-5 rounded-lg bg-gray-50 p-3">
          <p className="font-mono text-sm text-gray-700">{truncateAddress(refund.claimed_by ?? '')}</p>
        </div>
        {refund.tx_hash && (
          <a
            href={getExplorerUrl(refund.chain, refund.tx_hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View on explorer <ExternalLink size={13} />
          </a>
        )}
      </Blocked>
    );
  }

  const isExpired = Boolean(expiresAt) && !timeLeft(expiresAt);
  if (isExpired || refund.status === 'expired') {
    return (
      <Blocked
        icon={Clock}
        tone="gray"
        title="This refund link has expired"
        body={`Unclaimed funds were returned to ${merchantName}. Contact them to have a new link issued.`}
      />
    );
  }

  if (refund.status === 'failed') {
    return (
      <Blocked
        icon={AlertTriangle}
        tone="red"
        title="This refund could not be processed"
        body={`Something went wrong on-chain. Contact ${merchantName} — no funds have left their account.`}
      />
    );
  }

  // --- Claimable ---

  const destination = useDifferent ? customAddress : connectedWallet;
  const destinationValid = /^0x[a-fA-F0-9]{40}$/.test(destination);

  const connect = () => {
    const addr = payment?.from_address ?? '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12';
    setConnectedWallet(addr);
    setStep('choose');
  };

  const submitClaim = () => {
    setStep('claiming');
    setTimeout(() => {
      setClaimTx(`0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`);
      setStep('done');
    }, 2500);
  };

  if (step === 'done' && claimTx) {
    return (
      <Blocked
        icon={Check}
        tone="green"
        title="Refund claimed"
        body={`${amountLabel} is on its way to your wallet.`}
      >
        <div className="mt-5 space-y-2.5 rounded-lg bg-gray-50 p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Sent to</span>
            <span className="font-mono text-xs text-gray-700">{truncateAddress(destination)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Network</span>
            <ChainBadge chain={refund.chain} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Transaction</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-gray-700">{truncateAddress(claimTx)}</span>
              <button
                onClick={() => navigator.clipboard.writeText(claimTx)}
                className="text-gray-300 hover:text-gray-500"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>
        <a
          href={getExplorerUrl(refund.chain, claimTx)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View on explorer <ExternalLink size={13} />
        </a>
      </Blocked>
    );
  }

  return (
    <Shell>
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
          <span className="font-bold text-white">{merchantName[0]}</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Refund from {merchantName}</h1>
        <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
          {formatAmount(refund.amount, refund.currency)}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <CoinBadge currency={refund.currency} showName />
          <ChainBadge chain={refund.chain} />
        </div>
      </div>

      {/* Expiry */}
      {remaining && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <Clock size={15} className="shrink-0 text-amber-600" />
          <p className="text-[13px] text-amber-900">
            Claim within <span className="font-semibold">{remaining}</span> or the funds return to{' '}
            {merchantName}.
          </p>
        </div>
      )}

      {refund.reason && (
        <div className="mb-5 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
          <span className="text-xs text-gray-500">Reason</span>
          <span className="text-sm text-gray-800">{refund.reason}</span>
        </div>
      )}

      {/* Step: connect */}
      {step === 'connect' && (
        <div>
          <p className="mb-4 text-center text-sm leading-relaxed text-gray-500">
            Connect a wallet to claim this refund. You can send it to the wallet you pay with, or
            any other address you control.
          </p>
          <button
            onClick={connect}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Wallet size={17} /> Connect wallet
          </button>
        </div>
      )}

      {/* Step: choose destination */}
      {step === 'choose' && (
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Send refund to</label>

          <button
            onClick={() => setUseDifferent(false)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
              !useDifferent
                ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Wallet size={16} className="shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900">Connected wallet</div>
              <div className="truncate font-mono text-xs text-gray-500">{connectedWallet}</div>
            </div>
            {!useDifferent && <Check size={15} className="shrink-0 text-blue-600" />}
          </button>

          <button
            onClick={() => setUseDifferent(true)}
            className={`mt-2 flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
              useDifferent
                ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <ExternalLink size={16} className="shrink-0 text-gray-400" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">A different address</div>
              <div className="text-xs text-gray-500">Send somewhere else you control</div>
            </div>
            {useDifferent && <Check size={15} className="shrink-0 text-blue-600" />}
          </button>

          {useDifferent && (
            <div className="mt-3">
              <input
                value={customAddress}
                onChange={e => setCustomAddress(e.target.value)}
                placeholder="0x…"
                autoFocus
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
              {customAddress && !destinationValid && (
                <p className="mt-1.5 text-xs text-red-500">Enter a valid address (0x…)</p>
              )}
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-gray-400" />
            <p className="text-[12px] leading-relaxed text-gray-500">
              Double-check the address. On-chain transfers are irreversible, and{' '}
              {refund.currency} must be received on {refund.chain}.
            </p>
          </div>

          <button
            onClick={submitClaim}
            disabled={!destinationValid}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Claim {formatAmount(refund.amount, refund.currency)}
          </button>

          <button
            onClick={() => { setStep('connect'); setConnectedWallet(''); }}
            className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Use a different wallet
          </button>
        </div>
      )}

      {/* Step: claiming */}
      {step === 'claiming' && (
        <div className="py-8 text-center">
          <Loader2 size={30} className="mx-auto mb-4 animate-spin text-blue-600" />
          <h2 className="mb-1 text-base font-semibold text-gray-900">Claiming your refund…</h2>
          <p className="text-sm text-gray-500">Confirm the transaction in your wallet.</p>
        </div>
      )}
    </Shell>
  );
}
