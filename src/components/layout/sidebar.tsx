'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, CreditCard, RotateCcw, Users, LinkIcon,
  FileText, BarChart3, Code2, Settings, Zap, TestTube,
  ShieldCheck, RefreshCw, GitBranch, ArrowLeftRight, HelpCircle,
  AlertCircle, Bot, Send, Wallet, LogOut, Coins, Package, LifeBuoy, Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems: { label: string; href: string; icon: React.ElementType; badge?: boolean }[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Action Center', href: '/dashboard/actions', icon: AlertCircle, badge: true },
  { label: 'Send Money', href: '/dashboard/send', icon: Send },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Refunds', href: '/dashboard/refunds', icon: RotateCcw },
  { label: 'Holds', href: '/dashboard/holds', icon: ShieldCheck },
  { label: 'Subscriptions', href: '/dashboard/subscriptions', icon: RefreshCw },
  { label: 'Connect', href: '/dashboard/connect', icon: GitBranch },
  { label: 'AI Agents', href: '/dashboard/agents', icon: Bot },
  { label: 'Bridge', href: '/dashboard/bridge', icon: ArrowLeftRight },
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
  { label: 'Payment Links', href: '/dashboard/payment-links', icon: LinkIcon },
  { label: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { label: 'Catalog', href: '/dashboard/catalog', icon: Package },
  { label: 'Wallets', href: '/dashboard/wallets', icon: Wallet },
  { label: 'Reporting', href: '/dashboard/reporting', icon: BarChart3 },
  { label: 'Developers', href: '/dashboard/developer', icon: Code2 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] h-screen bg-sidebar border-r border-border flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-bold text-gray-900">Chain Payments</span>
        </Link>
      </div>

      {/* Mode toggle */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white shadow-sm text-gray-900">
            <Zap size={12} /> Live
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-gray-500 hover:text-gray-700">
            <TestTube size={12} /> Test
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : item.badge
                    ? 'text-orange-700 hover:text-orange-800 hover:bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
              {item.badge && (
                <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  !
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-2">
        <Link href="/help" className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
          <LifeBuoy size={13} /> Help & Support
        </Link>
        <Link href="/currencies" className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
          <Coins size={13} /> Currencies
        </Link>
        <Link href="/how-it-works" className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
          <HelpCircle size={13} /> How It Works
        </Link>
        <Link href="/security" className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
          <ShieldCheck size={13} /> Trust & Security
        </Link>
        <Link href="/legal" className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
          <Scale size={13} /> Legal
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
            AC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Acme Corp</p>
            <p className="text-[11px] text-gray-500 truncate">admin@acme.com</p>
          </div>
          <Link
            href="/login"
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0"
          >
            <LogOut size={15} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
