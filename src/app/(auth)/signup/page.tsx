import Link from 'next/link';
import { Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { auth0 } from '@/lib/auth0';
import { OnboardingForm } from './onboarding-form';

export default async function SignupPage() {
  const session = await auth0.getSession();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Chain Payments</span>
        </div>

        {session ? (
          // Account exists — collect the merchant details we still need.
          <OnboardingForm email={session.user.email ?? ''} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
            <p className="text-sm text-gray-500 mb-6">
              Start accepting on-chain payments. We&apos;ll set up your business details
              right after you create your account.
            </p>

            <a
              href="/auth/login?screen_hint=signup&returnTo=%2Fsignup"
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
            >
              Create account <ArrowRight size={15} />
            </a>

            <div className="mt-5 flex items-start gap-2 text-xs text-gray-500">
              <ShieldCheck size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <p>
                Your credentials are handled by our secure identity provider — we never
                store your password.
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
