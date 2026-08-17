'use client';

import { Printer } from 'lucide-react';

/** Small client island so the handbook itself stays a server component. */
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
    >
      <Printer size={15} /> Save as PDF
    </button>
  );
}
