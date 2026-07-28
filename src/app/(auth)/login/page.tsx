import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ShieldCheck, Fingerprint } from 'lucide-react';
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
    <div>
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-900">
          Welcome back
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
          Sign in to manage payments, wallets, and payouts.
        </p>
      </div>

      {returnTo && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
          <Fingerprint size={15} className="mt-0.5 shrink-0 text-blue-600" />
          <p className="text-[13px] leading-relaxed text-blue-900">
            Sign in to continue to{' '}
            <span className="font-medium">{safeReturnTo}</span>
          </p>
        </div>
      )}

      <a
        href={loginHref}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.99]"
      >
        Continue to sign in
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </a>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3.5">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-gray-400" />
        <p className="text-[12.5px] leading-relaxed text-gray-500">
          You&apos;ll sign in through our secure identity provider. Multi-factor
          authentication and password recovery are handled there.
        </p>
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
