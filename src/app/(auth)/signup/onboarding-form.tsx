'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';

const field =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10';

const perks = [
  'No setup fees or monthly minimums',
  'Settle to wallets you already control',
  'Go live on testnet in minutes',
];

/**
 * Account creation only.
 *
 * Everything needed to actually take a payment — business details, settlement
 * wallet, currencies — happens at /onboarding afterwards, so an abandoned setup
 * doesn't cost someone their account.
 */
export function OnboardingForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;

  const submit = () => {
    if (!emailValid || !passwordValid) return;
    setLoading(true);
    setTimeout(() => router.push('/onboarding'), 900);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
          Takes a minute. We&apos;ll set up your business details next.
        </p>
      </div>

      <ul className="mb-8 space-y-2.5">
        {perks.map(perk => (
          <li key={perk} className="flex items-center gap-2.5">
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-green-100">
              <Check size={11} className="text-green-700" strokeWidth={3} />
            </span>
            <span className="text-[13.5px] text-gray-600">{perk}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-gray-700">
            Work email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="you@company.com"
            autoFocus
            className={field}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="At least 8 characters"
              className={`${field} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password && !passwordValid && (
            <p className="mt-1.5 text-[12px] text-red-500">Use at least 8 characters</p>
          )}
        </div>

        <button
          onClick={submit}
          disabled={!emailValid || !passwordValid || loading}
          className="group !mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.99]"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Creating your account…' : 'Create account'}
          {!loading && (
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </div>

      <p className="mt-5 text-center text-[12px] leading-relaxed text-gray-400">
        By creating an account you agree to our{' '}
        <Link href="/legal/terms" className="text-gray-500 underline underline-offset-2 hover:text-gray-700">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/legal/privacy" className="text-gray-500 underline underline-offset-2 hover:text-gray-700">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-blue-600 transition-colors hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
