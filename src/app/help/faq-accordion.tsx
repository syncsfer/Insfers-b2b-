'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/lib/help-content';

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <span className="text-[15px] font-medium text-gray-900">{item.question}</span>
              <ChevronDown
                size={17}
                className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-0">
                <p className="max-w-2xl text-[14px] leading-relaxed text-gray-600">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
