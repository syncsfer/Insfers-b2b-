'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DEV_CATEGORIES, productsInCategory } from '@/lib/developer-content';

/**
 * Docs sidebar. Grouped by the same five categories as the landing page, so a
 * reader who arrived through one route recognises the shape of the other.
 */
export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:block w-[232px] shrink-0 py-10">
      <div className="sticky top-[72px] max-h-[calc(100vh-96px)] overflow-y-auto pr-2 pb-6">
        <Link
          href="/developers"
          className={cn(
            'block px-2.5 py-1.5 rounded-md text-[13px] font-semibold',
            pathname === '/developers'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-900 hover:bg-gray-100',
          )}
        >
          Get started
        </Link>

        {DEV_CATEGORIES.map(cat => (
          <div key={cat.id} className="mt-5">
            <p className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {cat.name}
            </p>
            <div className="space-y-0.5">
              {productsInCategory(cat.id).map(p => {
                const href = `/developers/${p.slug}`;
                const active = pathname === href;
                return (
                  <Link
                    key={p.slug}
                    href={href}
                    className={cn(
                      'block px-2.5 py-1.5 rounded-md text-[13px] transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                    )}
                  >
                    {p.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
