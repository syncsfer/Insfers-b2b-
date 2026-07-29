'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, ArrowRight, Wallet, Eye, EyeOff } from 'lucide-react';

const steps = ['Account', 'Business', 'Wallet', 'Networks', 'Review'];

const networks = [
  { id: 'base', name: 'Base', desc: '~2s confirmation · $0.001 gas' },
  { id: 'ethereum', name: 'Ethereum', desc: '~12s confirmation · $0.50–$5 gas' },
  { id: 'polygon', name: 'Polygon', desc: '~2s confirmation · $0.01 gas' },
  { id: 'arbitrum', name: 'Arbitrum', desc: '~0.25s confirmation · $0.01 gas' },
  { id: 'optimism', name: 'Optimism', desc: '~2s confirmation · $0.01 gas' },
];

const field =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10';

const label = 'block text-[13px] font-medium text-gray-700 mb-1.5';

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessUrl, setBusinessUrl] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedNetworks, setSelectedNetworks] = useState(['base']);

  const lastStep = steps.length - 1;

  const canProgress = () => {
    if (step === 0) return Boolean(email) && password.length >= 8;
    if (step === 1) return Boolean(businessName);
    if (step === 2) return Boolean(walletAddress);
    if (step === 3) return selectedNetworks.length > 0;
    return true;
  };

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-[13px] font-medium text-gray-900">{steps[step]}</span>
          <span className="text-[12px] tabular-nums text-gray-400">
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-500 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 0: Account */}
      {step === 0 && (
        <div className="animate-fade-in">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-gray-900">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            Start accepting on-chain payments in a few minutes.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={field} autoFocus />
            </div>
            <div>
              <label htmlFor="password" className={label}>Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" className={`${field} pr-11`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && password.length < 8 && (
                <p className="mt-1.5 text-[12px] text-red-500">Password must be at least 8 characters</p>
              )}
            </div>
          </div>
          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 transition-colors hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      )}

      {/* Step 1: Business */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-gray-900">
            Business details
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            This appears on your checkout pages and customer receipts.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="biz-name" className={label}>Business name</label>
              <input id="biz-name" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Corp" className={field} autoFocus />
            </div>
            <div>
              <label htmlFor="biz-url" className={label}>
                Website <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input id="biz-url" value={businessUrl} onChange={e => setBusinessUrl(e.target.value)} placeholder="https://acme.com" className={field} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Wallet */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-gray-900">
            Settlement wallet
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            Where should we send your payments? You can change this later.
          </p>
          <div className="mt-6">
            <label htmlFor="wallet" className={label}>Wallet address</label>
            <input id="wallet" value={walletAddress} onChange={e => setWalletAddress(e.target.value)} placeholder="0x…" className={`${field} font-mono`} autoFocus />
            <p className="mt-1.5 text-[12px] text-gray-400">
              Use a wallet you control — not an exchange deposit address.
            </p>
            <button
              type="button"
              onClick={() => setWalletAddress('0x7777777777777777777777777777777777777777')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <Wallet size={14} /> Connect wallet instead
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Networks */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-gray-900">
            Select networks
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            Choose which chains to accept payments on.
          </p>
          <div className="mt-6 space-y-2">
            {networks.map(n => {
              const active = selectedNetworks.includes(n.id);
              return (
                <label
                  key={n.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-all ${
                    active
                      ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => setSelectedNetworks(prev =>
                      prev.includes(n.id) ? prev.filter(x => x !== n.id) : [...prev, n.id]
                    )}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{n.name}</div>
                    <div className="text-[12px] text-gray-500">{n.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="animate-fade-in">
          <h1 className="text-[1.5rem] font-semibold tracking-tight text-gray-900">
            Review &amp; finish
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
            All of this can be changed later in Settings.
          </p>
          <dl className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
            {[
              ['Email', email || '—'],
              ['Business', businessName || '—'],
              ['Wallet', walletAddress ? `${walletAddress.slice(0, 12)}…${walletAddress.slice(-4)}` : '—'],
              ['Networks', selectedNetworks.join(', ')],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-[13px] text-gray-500">{k}</dt>
                <dd className={`truncate text-[13px] font-medium text-gray-900 ${k === 'Wallet' ? 'font-mono' : ''}`}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={15} /> Back
          </button>
        ) : <span />}

        {step < lastStep ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProgress()}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none active:scale-[0.99]"
          >
            Continue
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md disabled:opacity-60 active:scale-[0.99]"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Setting up…' : 'Launch dashboard'}
          </button>
        )}
      </div>
    </div>
  );
}
