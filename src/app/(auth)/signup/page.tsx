import Link from 'next/link';
import { ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { auth0 } from '@/lib/auth0';
import { OnboardingForm } from './onboarding-form';

const perks = [
  'No setup fees or monthly minimums',
  'Settle to wallets you already control',
  'Go live on testnet in minutes',
];

export default async function SignupPage() {
  const session = await auth0.getSession();

  // Account exists — collect the merchant details we still need.
  if (session) {
    return <OnboardingForm email={session.user.email ?? ''} />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
          Start accepting on-chain payments. We&apos;ll set up your business details
          right after.
        </p>
      </div>

      <ul className="mb-8 space-y-2.5">
        {perks.map((perk) => (
          <li key={perk} className="flex items-center gap-2.5">
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-green-100">
              <Check size={11} className="text-green-700" strokeWidth={3} />
            </span>
            <span className="text-[13.5px] text-gray-600">{perk}</span>
          </li>
        ))}
      </ul>

      <a
        href="/auth/login?screen_hint=signup&returnTo=%2Fsignup"
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.99]"
      >
        Create account
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </a>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3.5">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-gray-400" />
        <p className="text-[12.5px] leading-relaxed text-gray-500">
          Your credentials are handled by our secure identity provider — we never
          store your password.
        </p>
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
