'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A dark code panel with a copy button.
 *
 * Docs are read to be copied from, so the copy affordance is always present
 * rather than appearing on hover — on touch there is no hover to reveal it.
 */
export function CodeBlock({
  source,
  label,
  className,
}: {
  source: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={cn('rounded-xl bg-gray-900 overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-[11px] font-medium text-gray-400">{label ?? 'Example'}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/10"
          aria-label="Copy code"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-[12.5px] leading-relaxed font-mono text-gray-300 whitespace-pre">
          {source}
        </code>
      </pre>
    </div>
  );
}

/** Same panel, with one tab per language. */
export function CodeTabs({
  samples,
  label,
}: {
  samples: { id: string; label: string; source: string }[];
  label?: string;
}) {
  const [active, setActive] = useState(samples[0]?.id);
  const [copied, setCopied] = useState(false);
  const current = samples.find(s => s.id === active) ?? samples[0];

  if (!current) return null;

  const copy = () => {
    navigator.clipboard.writeText(current.source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-xl bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10">
        <div className="flex items-center gap-0.5">
          {samples.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                s.id === current.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pr-1">
          {label && <span className="text-[11px] text-gray-500">{label}</span>}
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/10"
            aria-label="Copy code"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-[12.5px] leading-relaxed font-mono text-gray-300 whitespace-pre">
          {current.source}
        </code>
      </pre>
    </div>
  );
}
