import Link from 'next/link';
import { Zap, KeyRound, ArrowRight } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Chain Payments</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <KeyRound size={20} className="text-blue-600" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h1>
          <p className="text-sm text-gray-500 mb-6">
            Password resets are handled by our identity provider. Continue to the sign-in
            page and choose <span className="font-medium text-gray-700">Forgot password</span> to
            receive a reset link by email.
          </p>

          <a
            href="/auth/login"
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
          >
            Continue to sign in <ArrowRight size={15} />
          </a>

          <p className="mt-6 text-center text-sm text-gray-500">
            Remembered it?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
