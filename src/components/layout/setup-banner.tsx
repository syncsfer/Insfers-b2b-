'use client';

import Link from 'next/link';
import { Rocket, ArrowRight, Check, X } from 'lucide-react';
import {
  useOnboarding, ONBOARDING_STEPS, onboardingProgress, isReadyForPayments,
} from '@/lib/onboarding';

/**
 * Persistent nudge shown until required onboarding is done.
 *
 * Someone who skipped setup has no way to take a payment, and no obvious route
 * back — this keeps the remaining work visible without blocking the dashboard.
 */
export function SetupBanner() {
  const { state, patch } = useOnboarding();

  // Nothing to nag about before they've started, or once they're ready.
  const started = state.completed.length > 0 || Boolean(state.dismissedAt);
  if (!started || isReadyForPayments(state)) return null;

  const progress = onboardingProgress(state);
  const remaining = ONBOARDING_STEPS.filter(
    s => s.required && !state.completed.includes(s.id),
  );

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-blue-200 bg-blue-50/60">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <Rocket size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Finish setting up to start taking payments
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-blue-800">
              {remaining.length} step{remaining.length === 1 ? '' : 's'} left —{' '}
              {remaining.map(s => s.short.toLowerCase()).join(', ')}.
            </p>

            {/* Step pills */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {ONBOARDING_STEPS.filter(s => s.required).map(s => {
                const done = state.completed.includes(s.id);
                return (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      done
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-blue-200 bg-white text-blue-700'
                    }`}
                  >
                    {done && <Check size={10} />} {s.short}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-lg font-bold text-blue-900">{progress}%</div>
            <div className="text-[11px] text-blue-700">complete</div>
          </div>
          <Link
            href="/onboarding"
            className="group inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Continue setup
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            onClick={() => patch({ dismissedAt: new Date().toISOString() })}
            aria-label="Dismiss"
            title="Hide until next visit"
            className="rounded-md p-1.5 text-blue-400 transition-colors hover:bg-blue-100 hover:text-blue-700"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="h-1 w-full bg-blue-100">
        <div
          className="h-1 bg-blue-600 transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
