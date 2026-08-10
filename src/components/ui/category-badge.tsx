'use client';

import { cn } from '@/lib/utils';
import type { CategoryAccent, CatalogCategory } from '@/types';

/** Category colours, kept in one place so a category looks the same everywhere. */
export const CATEGORY_ACCENTS: Record<
  CategoryAccent,
  { chip: string; dot: string; bar: string; label: string }
> = {
  blue:    { chip: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500',    bar: '#3b82f6', label: 'Blue' },
  violet:  { chip: 'bg-violet-50 text-violet-700 border-violet-200',    dot: 'bg-violet-500',  bar: '#8b5cf6', label: 'Violet' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', bar: '#10b981', label: 'Emerald' },
  amber:   { chip: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   bar: '#f59e0b', label: 'Amber' },
  rose:    { chip: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500',    bar: '#f43f5e', label: 'Rose' },
  slate:   { chip: 'bg-slate-100 text-slate-700 border-slate-200',      dot: 'bg-slate-500',   bar: '#64748b', label: 'Slate' },
};

export function CategoryBadge({
  category,
  size = 'md',
  className,
}: {
  category: CatalogCategory | undefined;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!category) {
    return <span className="text-xs text-gray-300">Uncategorised</span>;
  }
  const a = CATEGORY_ACCENTS[category.accent];

  return (
    <span
      title={category.description}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        a.chip,
        size === 'sm' ? 'h-5 px-2 text-[10px]' : 'h-6 px-2.5 text-[11px]',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', a.dot)} />
      {category.name}
    </span>
  );
}
