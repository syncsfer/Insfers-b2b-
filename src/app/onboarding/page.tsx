'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap, Check, ArrowRight, ArrowLeft, Wallet, Loader2, ShieldCheck,
  AlertTriangle, Sparkles, ExternalLink, Copy, PartyPopper,
} from 'lucide-react';
import { ChainBadge } from '@/components/ui/chain-badge';
import { CoinMark } from '@/components/ui/coin-badge';
import { useToast } from '@/components/ui/toast';
import { STABLECOIN_LIST, STABLECOINS, formatAmount } from '@/lib/currencies';
import { truncateAddress, getExplorerUrl } from '@/lib/utils';
import {
  useOnboarding, ONBOARDING_STEPS, BUSINESS_TYPES, isReadyForPayments,
} from '@/lib/onboarding';
import type { Chain, Currency } from '@/types';

const ALL_CHAINS: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];

const field =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10';
const label = 'block text-[13px] font-medium text-gray-700 mb-1.5';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { state, patch, completeStep } = useOnboarding();

  // Resume where they left off rather than always starting at step 1.
  const firstIncomplete = ONBOARDING_STEPS.findIndex(s => !state.completed.includes(s.id));
  const [stepIndex, setStepIndex] = useState(firstIncomplete === -1 ? 0 : firstIncomplete);
  const [testing, setTesting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const step = ONBOARDING_STEPS[stepIndex];
  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;
  const ready = isReadyForPayments(state);

  const walletValid = /^0x[a-fA-F0-9]{40}$/.test(state.walletAddress);

  /** Networks available given the currencies chosen — the same rule the app uses. */
  const availableNetworks = useMemo(() => {
    const set = new Set<Chain>();
    state.currencies.forEach(c => STABLECOINS[c].networks.forEach(n => set.add(n)));
    return ALL_CHAINS.filter(c => set.has(c));
  }, [state.currencies]);

  const canContinue = () => {
    if (step.id === 'profile') return state.businessName.trim().length > 0;
    if (step.id === 'wallet') return walletValid;
    if (step.id === 'currencies') return state.currencies.length > 0 && state.networks.length > 0;
    return true;
  };

  const advance = () => {
    completeStep(step.id);
    if (isLast) return;
    setStepIndex(i => i + 1);
  };

  const toggleCurrency = (c: Currency) => {
    const next = state.currencies.includes(c)
      ? state.currencies.filter(x => x !== c)
      : [...state.currencies, c];

    // Drop networks no remaining currency can settle on.
    const stillValid = new Set<Chain>();
    next.forEach(cur => STABLECOINS[cur].networks.forEach(n => stillValid.add(n)));
    let networks = state.networks.filter(n => stillValid.has(n));

    // Swapping currencies can invalidate every selected network — for example
    // going from USDC on Base to JPYC, which doesn't exist there. Leaving the
    // selection empty strands the user on a disabled Continue with no hint of
    // what changed, so seed a sensible default instead.
    if (networks.length === 0 && next.length > 0) {
      networks = [STABLECOINS[next[0]].networks[0]];
    }

    patch({ currencies: next, networks });
  };

  const toggleNetwork = (n: Chain) => {
    patch({
      networks: state.networks.includes(n)
        ? state.networks.filter(x => x !== n)
        : [...state.networks, n],
    });
  };

  const runTestPayment = () => {
    setTesting(true);
    setTimeout(() => {
      const hash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      patch({ testPaymentTxHash: hash });
      completeStep('test');
      setTesting(false);
      toast('Test payment confirmed');
    }, 2200);
  };

  const finish = () => {
    setFinishing(true);
    patch({ finishedAt: new Date().toISOString() });
    setTimeout(() => router.push('/dashboard'), 900);
  };

  const skipForNow = () => {
    patch({ dismissedAt: new Date().toISOString() });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-gray-900">Chain Payments</span>
          </div>
          <button
            onClick={skipForNow}
            className="text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            Finish later
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Stepper */}
        <ol className="mb-8 flex items-center gap-2">
          {ONBOARDING_STEPS.map((s, i) => {
            const done = state.completed.includes(s.id);
            const current = i === stepIndex;
            return (
              <li key={s.id} className="flex flex-1 items-center gap-2">
                <button
                  onClick={() => setStepIndex(i)}
                  className="flex items-center gap-2 text-left"
                  title={s.title}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    done ? 'bg-green-500 text-white'
                      : current ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {done ? <Check size={13} /> : i + 1}
                  </span>
                  <span className={`hidden text-[12px] font-medium sm:inline ${
                    current ? 'text-blue-700' : done ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {s.short}
                  </span>
                </button>
                {i < ONBOARDING_STEPS.length - 1 && (
                  <span className={`h-0.5 flex-1 rounded ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </li>
            );
          })}
        </ol>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-[1.6rem] font-bold tracking-tight text-gray-900">{step.title}</h1>
            <p className="mt-1.5 text-[15px] leading-relaxed text-gray-500">{step.description}</p>
          </div>

          {/* --- Profile --- */}
          {step.id === 'profile' && (
            <div className="animate-fade-in space-y-4">
              <div>
                <label htmlFor="biz" className={label}>Business name</label>
                <input
                  id="biz"
                  value={state.businessName}
                  onChange={e => patch({ businessName: e.target.value })}
                  placeholder="Acme Corp"
                  autoFocus
                  className={field}
                />
                <p className="mt-1.5 text-[12px] text-gray-400">
                  Customers will see this on the checkout page and on their receipt.
                </p>
              </div>
              <div>
                <label htmlFor="url" className={label}>
                  Website <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="url"
                  value={state.businessUrl}
                  onChange={e => patch({ businessUrl: e.target.value })}
                  placeholder="https://acme.com"
                  className={field}
                />
              </div>
              <div>
                <label className={label}>What do you sell?</label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => patch({ businessType: t })}
                      className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all ${
                        state.businessType === t
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/10'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- Wallet --- */}
          {step.id === 'wallet' && (
            <div className="animate-fade-in">
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <p className="text-[13px] leading-relaxed text-blue-900">
                  Payments go straight from your customer&apos;s wallet to this address. We never
                  take custody, so there is no balance with us to withdraw.
                </p>
              </div>

              <label htmlFor="wallet" className={label}>Settlement wallet address</label>
              <input
                id="wallet"
                value={state.walletAddress}
                onChange={e => patch({ walletAddress: e.target.value })}
                placeholder="0x…"
                autoFocus
                className={`${field} font-mono`}
              />
              {state.walletAddress && !walletValid && (
                <p className="mt-1.5 text-[12px] text-red-500">
                  That doesn&apos;t look like a valid address — it should start with 0x and be 42
                  characters long.
                </p>
              )}

              <button
                onClick={() => patch({ walletAddress: '0x7777777777777777777777777777777777777777' })}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <Wallet size={14} /> Connect a wallet instead
              </button>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-[13px] leading-relaxed text-amber-900">
                  Use a wallet you control the keys to — not an exchange deposit address. Exchanges
                  often reject unexpected transfers, and funds sent there can be unrecoverable.
                </p>
              </div>
            </div>
          )}

          {/* --- Currencies --- */}
          {step.id === 'currencies' && (
            <div className="animate-fade-in">
              <label className={label}>Currencies you&apos;ll accept</label>
              <div className="grid grid-cols-2 gap-2.5">
                {STABLECOIN_LIST.map(c => {
                  const on = state.currencies.includes(c.symbol);
                  return (
                    <button
                      key={c.symbol}
                      onClick={() => toggleCurrency(c.symbol)}
                      className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                        on ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CoinMark currency={c.symbol} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">{c.symbol}</div>
                        <div className="truncate text-[11px] text-gray-500">{c.name}</div>
                      </div>
                      {on && <Check size={15} className="shrink-0 text-blue-600" />}
                    </button>
                  );
                })}
              </div>

              <label className={`${label} mt-6`}>Networks</label>
              <p className="-mt-1 mb-2 text-[12px] text-gray-400">
                Only networks your chosen currencies settle on are shown.
              </p>
              <div className="flex flex-wrap gap-2">
                {availableNetworks.map(n => {
                  const on = state.networks.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => toggleNetwork(n)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${
                        on ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ChainBadge chain={n} />
                      {on && <Check size={13} className="text-blue-600" />}
                    </button>
                  );
                })}
              </div>

              {state.currencies.length > 0 && state.networks.length === 0 && (
                <p className="mt-3 text-[12px] text-red-500">Pick at least one network.</p>
              )}
            </div>
          )}

          {/* --- Test --- */}
          {step.id === 'test' && (
            <div className="animate-fade-in">
              {state.testPaymentTxHash ? (
                <div>
                  <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50/70 px-4 py-4">
                    <Check size={18} className="mt-0.5 shrink-0 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">Test payment confirmed</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-green-800">
                        A test payment of {formatAmount(1000, state.currencies[0] ?? 'USDC')}{' '}
                        {state.currencies[0] ?? 'USDC'} settled to your wallet on test network. No
                        real funds moved.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="font-mono text-[12px] text-green-900">
                          {truncateAddress(state.testPaymentTxHash)}
                        </span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(state.testPaymentTxHash!); toast('Copied'); }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Copy size={12} />
                        </button>
                        <a
                          href={getExplorerUrl(state.networks[0] ?? 'base', state.testPaymentTxHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
                    <p className="text-[13px] font-medium uppercase tracking-wide text-gray-400">
                      What will happen
                    </p>
                    <ul className="mt-3 space-y-2">
                      {[
                        `We create a test payment for ${formatAmount(1000, state.currencies[0] ?? 'USDC')} ${state.currencies[0] ?? 'USDC'}`,
                        `It settles to ${state.walletAddress ? truncateAddress(state.walletAddress) : 'your wallet'} on a test network`,
                        'You see it appear in your payments list, exactly as a real one would',
                      ].map(t => (
                        <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-gray-700">
                          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                          {t}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-[12px] text-gray-500">
                      Test mode uses test networks. No real money is involved at any point.
                    </p>
                  </div>

                  <button
                    onClick={runTestPayment}
                    disabled={testing}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    {testing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {testing ? 'Running test payment…' : 'Run a test payment'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-100 pt-6">
            {stepIndex > 0 ? (
              <button
                onClick={() => setStepIndex(i => i - 1)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : <span />}

            <div className="flex items-center gap-3">
              {!step.required && !state.completed.includes(step.id) && (
                <button
                  onClick={advance}
                  className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
                >
                  Skip this
                </button>
              )}

              {isLast ? (
                <button
                  onClick={finish}
                  disabled={!ready || finishing}
                  title={!ready ? 'Complete the required steps first' : undefined}
                  className="group inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {finishing ? <Loader2 size={15} className="animate-spin" /> : <PartyPopper size={15} />}
                  {finishing ? 'Setting up…' : 'Go to dashboard'}
                </button>
              ) : (
                <button
                  onClick={advance}
                  disabled={!canContinue()}
                  className="group inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary once everything required is done */}
        {ready && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50/70 p-5">
            <div className="flex items-start gap-3">
              <Check size={17} className="mt-0.5 shrink-0 text-green-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-green-900">You&apos;re ready to take payments</p>
                <dl className="mt-3 grid gap-x-8 gap-y-1.5 text-[13px] sm:grid-cols-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-green-800/70">Business</dt>
                    <dd className="truncate font-medium text-green-900">{state.businessName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-green-800/70">Wallet</dt>
                    <dd className="font-mono text-[12px] font-medium text-green-900">
                      {truncateAddress(state.walletAddress)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-green-800/70">Currencies</dt>
                    <dd className="font-medium text-green-900">{state.currencies.join(', ')}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-green-800/70">Networks</dt>
                    <dd className="font-medium capitalize text-green-900">{state.networks.join(', ')}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-[12px] text-gray-400">
          Need a hand?{' '}
          <Link href="/help" className="text-blue-600 hover:text-blue-700">
            Read the setup guide
          </Link>{' '}
          or{' '}
          <Link href="/help#contact" className="text-blue-600 hover:text-blue-700">
            talk to us
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
