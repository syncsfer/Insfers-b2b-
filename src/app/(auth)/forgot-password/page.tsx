'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, ArrowRight, KeyRound, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  if (sent) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-green-100 bg-green-50">
          <MailCheck size={19} className="text-green-600" />
        </div>

        <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-900">
          Check your inbox
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
          If an account exists for <span className="font-medium text-gray-700">{email}</span>,
          we&apos;ve sent a link to reset your password. It expires in 30 minutes.
        </p>

        <p className="mt-6 text-[13px] leading-relaxed text-gray-400">
          Didn&apos;t get it? Check your spam folder, or{' '}
          <button
            onClick={() => setSent(false)}
            className="font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            try a different address
          </button>
          .
        </p>

        <p className="mt-8 text-center text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-medium text-gray-500 transition-colors hover:text-gray-800"
          >
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
        <KeyRound size={19} className="text-blue-600" />
      </div>

      <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-900">
        Reset your password
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
        Enter your email and we&apos;ll send you a link to set a new one.
      </p>

      <div className="mt-6">
        <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="you@company.com"
          autoFocus
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !email}
        className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.99]"
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {loading ? 'Sending…' : 'Send reset link'}
        {!loading && (
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        )}
      </button>

      <p className="mt-8 text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </p>
    </div>
  );
}
