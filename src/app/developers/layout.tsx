import Link from 'next/link';
import { Zap, ArrowUpRight } from 'lucide-react';
import { DocsNav } from './docs-nav';

export const metadata = {
  title: 'Developer docs — Chain Payments',
  description:
    'Build stablecoin payments: the API, the sandbox, webhooks, and guides for every Chain Payments product.',
};

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/developers" className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Chain Payments</span>
              <span className="text-sm text-gray-400">Docs</span>
            </Link>
          </div>
          <div className="flex items-center gap-1 text-[13px]">
            <Link href="/developers/api-reference" className="px-3 py-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              API reference
            </Link>
            <Link href="/help" className="px-3 py-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              Support
            </Link>
            <Link
              href="/dashboard/developer"
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 text-white font-medium hover:bg-gray-800"
            >
              Dashboard <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 flex gap-10">
        <DocsNav />
        <main className="flex-1 min-w-0 py-10">{children}</main>
      </div>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
          <span>Chain Payments — stablecoin payments infrastructure</span>
          <div className="flex items-center gap-4">
            <Link href="/legal/terms" className="hover:text-gray-600">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-gray-600">Privacy</Link>
            <Link href="/security" className="hover:text-gray-600">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
