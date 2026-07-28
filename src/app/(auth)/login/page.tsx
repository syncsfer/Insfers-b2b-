import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { auth0 } from '@/lib/auth0';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const session = await auth0.getSession();

  // Already signed in — skip the interstitial.
  if (session) {
    redirect(returnTo || '/dashboard');
  }

  // Only allow same-site paths so `returnTo` can't be used as an open redirect.
  const safeReturnTo = returnTo && /^\/(?!\/)/.test(returnTo) ? returnTo : '/dashboard';
  const loginHref = `/auth/login?returnTo=${encodeURIComponent(safeReturnTo)}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Chain Payments</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">
            Access your dashboard to manage payments, wallets, and payouts.
          </p>

          <a
            href={loginHref}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
          >
            Continue to sign in <ArrowRight size={15} />
          </a>

          <div className="mt-5 flex items-start gap-2 text-xs text-gray-500">
            <ShieldCheck size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <p>
              You&apos;ll sign in through our secure identity provider. Multi-factor
              authentication and password recovery are handled there.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 font-medium hover:text-blue-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
