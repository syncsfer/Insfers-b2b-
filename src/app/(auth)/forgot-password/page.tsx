import Link from 'next/link';
import { ArrowRight, KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div>
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
        <KeyRound size={19} className="text-blue-600" />
      </div>

      <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-900">
        Reset your password
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
        Password resets are handled by our identity provider. Continue to sign in and
        choose <span className="font-medium text-gray-700">Forgot password</span> to get
        a reset link by email.
      </p>

      <a
        href="/auth/login"
        className="group mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-medium text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.99]"
      >
        Continue to sign in
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </a>

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
