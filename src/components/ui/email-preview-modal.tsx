'use client';

import { useState } from 'react';
import { Eye, Code2, Mail } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import type { RenderedEmail } from '@/lib/email';

/**
 * Shows exactly what a customer will receive.
 *
 * Merchants never see their own transactional email — it goes to someone else.
 * Putting the real rendered message one click from the action that sends it is
 * the difference between copy that has been read and copy that has not.
 */
export function EmailPreviewModal({
  open,
  onClose,
  email,
  title = 'Email preview',
}: {
  open: boolean;
  onClose: () => void;
  email: RenderedEmail | null;
  title?: string;
}) {
  const [view, setView] = useState<'html' | 'text'>('html');

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      {!email ? (
        <p className="py-8 text-center text-sm text-gray-400">Nothing to preview.</p>
      ) : (
        <div className="space-y-3">
          {/* What it looks like in an inbox list */}
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-start gap-2.5">
              <Mail size={14} className="mt-0.5 shrink-0 text-gray-300" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">{email.subject}</p>
                <p className="text-[12px] text-gray-400">{email.preheader}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">To {email.to || '—'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-md w-fit">
            <button
              onClick={() => setView('html')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium ${
                view === 'html' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              <Eye size={12} /> Rendered
            </button>
            <button
              onClick={() => setView('text')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium ${
                view === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              <Code2 size={12} /> Plain text
            </button>
          </div>

          {view === 'html' ? (
            <iframe
              title="Email preview"
              srcDoc={email.html}
              sandbox=""
              className="w-full rounded-lg border border-gray-200 bg-white"
              style={{ height: 460 }}
            />
          ) : (
            <pre className="rounded-lg border border-gray-200 bg-gray-50 p-3.5 overflow-auto" style={{ maxHeight: 460 }}>
              <code className="text-[12px] leading-relaxed font-mono text-gray-700 whitespace-pre-wrap">
                {email.text}
              </code>
            </pre>
          )}
        </div>
      )}
    </Modal>
  );
}
