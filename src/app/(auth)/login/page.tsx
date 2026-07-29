'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

const field =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10';

const primaryBtn =
  'group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.99]';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      // Simulate a 2FA-enrolled account
      if (email.includes('2fa')) {
        setShow2FA(true);
      } else {
        router.push('/dashboard');
      }
    }, 1000);
  };

  const handle2FA = () => {
    if (twoFACode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  if (show2FA) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-900">
          Two-factor authentication
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
          Enter the 6-digit code from your authenticator app.
        </p>

        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/70 px-4 py-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-[13px] leading-relaxed text-red-800">{error}</p>
          </div>
        )}

        <input
          type="text"
          inputMode="numeric"
          value={twoFACode}
          onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && handle2FA()}
          placeholder="000000"
          autoFocus
          aria-label="Six-digit verification code"
          className="mt-6 w-full rounded-xl border border-gray-200 bg-white py-3.5 text-center font-mono text-2xl tracking-[0.5em] text-gray-900 placeholder:text-gray-300 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
        />

        <button
          onClick={handle2FA}
          disabled={loading || twoFACode.length !== 6}
          className={`${primaryBtn} mt-5`}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Verify'}
        </button>

        <p className="mt-8 text-center text-sm">
          <button
            onClick={() => { setShow2FA(false); setError(''); setTwoFACode(''); }}
            className="inline-flex items-center gap-1.5 font-medium text-gray-500 transition-colors hover:text-gray-800"
          >
            <ArrowLeft size={14} /> Back to sign in
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-900">
          Welcome back
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
          Sign in to manage payments, wallets, and payouts.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50/70 px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-[13px] leading-relaxed text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="you@company.com"
            className={field}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="password" className="text-[13px] font-medium text-gray-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your password"
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
        </div>

        <button onClick={handleLogin} disabled={loading} className={`${primaryBtn} !mt-6`}>
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && (
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
