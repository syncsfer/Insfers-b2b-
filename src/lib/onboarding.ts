'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { Chain, Currency } from '@/types';

/**
 * Onboarding progress, kept separately from signup.
 *
 * Signup only creates an account. Everything needed to actually take a payment
 * happens here, so a merchant can abandon halfway and pick up where they left
 * off rather than losing the account and starting over.
 */

export type OnboardingStepId = 'profile' | 'wallet' | 'currencies' | 'test';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  /** Shown in the stepper. */
  short: string;
  description: string;
  /** Whether a merchant can go live without it. */
  required: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Tell us about your business',
    short: 'Business',
    description: 'This appears on your checkout pages and customer receipts.',
    required: true,
  },
  {
    id: 'wallet',
    title: 'Where should your money go?',
    short: 'Wallet',
    description: 'Payments settle straight to a wallet you control. We never hold your funds.',
    required: true,
  },
  {
    id: 'currencies',
    title: 'What will you accept?',
    short: 'Currencies',
    description: 'Pick the currencies and networks your customers can pay with.',
    required: true,
  },
  {
    id: 'test',
    title: 'Try it before going live',
    short: 'Test',
    description: 'Run a test payment so you can see the whole flow without real money.',
    required: false,
  },
];

export interface OnboardingState {
  /** Steps the merchant has completed, in order of completion. */
  completed: OnboardingStepId[];
  businessName: string;
  businessUrl: string;
  businessType: string;
  walletAddress: string;
  walletChain: Chain;
  currencies: Currency[];
  networks: Chain[];
  testPaymentTxHash: string | null;
  /** Set once they leave onboarding for the dashboard. */
  finishedAt: string | null;
  /** Set if they choose to skip and set things up later. */
  dismissedAt: string | null;
}

export const EMPTY_ONBOARDING: OnboardingState = {
  completed: [],
  businessName: '',
  businessUrl: '',
  businessType: '',
  walletAddress: '',
  walletChain: 'base',
  currencies: ['USDC'],
  networks: ['base'],
  testPaymentTxHash: null,
  finishedAt: null,
  dismissedAt: null,
};

const KEY = 'cp.onboarding';

let value: OnboardingState = EMPTY_ONBOARDING;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): OnboardingState {
  if (typeof window === 'undefined') return EMPTY_ONBOARDING;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_ONBOARDING;
    // Merge so a stored record from an older shape still loads.
    return { ...EMPTY_ONBOARDING, ...(JSON.parse(raw) as Partial<OnboardingState>) };
  } catch {
    return EMPTY_ONBOARDING;
  }
}

function write(next: OnboardingState) {
  value = next;
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* non-fatal */ }
  }
  listeners.forEach(l => l());
}

export function useOnboarding() {
  const subscribe = useCallback((l: () => void) => {
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const getSnapshot = useCallback(() => {
    if (!hydrated) {
      value = read();
      hydrated = true;
    }
    return value;
  }, []);

  // Server has no storage, so it renders the empty state and the client
  // reconciles on hydration.
  const getServerSnapshot = useCallback(() => EMPTY_ONBOARDING, []);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const patch = useCallback((changes: Partial<OnboardingState>) => {
    write({ ...value, ...changes });
  }, []);

  const completeStep = useCallback((id: OnboardingStepId) => {
    if (value.completed.includes(id)) return;
    write({ ...value, completed: [...value.completed, id] });
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(KEY); } catch { /* non-fatal */ }
    }
    write(EMPTY_ONBOARDING);
  }, []);

  return { state, patch, completeStep, reset };
}

/** Required steps still outstanding. */
export function outstandingSteps(state: OnboardingState): OnboardingStep[] {
  return ONBOARDING_STEPS.filter(s => s.required && !state.completed.includes(s.id));
}

export function onboardingProgress(state: OnboardingState): number {
  return Math.round((state.completed.length / ONBOARDING_STEPS.length) * 100);
}

/** True once every required step is done — the merchant can take real payments. */
export function isReadyForPayments(state: OnboardingState): boolean {
  return outstandingSteps(state).length === 0;
}

export const BUSINESS_TYPES = [
  'Software / SaaS',
  'E-commerce',
  'Professional services',
  'Marketplace',
  'Creator / media',
  'Non-profit',
  'Remittance',
  'Other',
];
