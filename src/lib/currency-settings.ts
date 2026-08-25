'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { STABLECOINS } from './currencies';
import type { Chain, Currency } from '@/types';

/**
 * Which stablecoins this merchant accepts.
 *
 * This governs what a customer can pay in — payment links, invoices, catalog
 * prices, checkout. It deliberately does NOT govern treasury: a merchant who
 * stops accepting EURC still holds whatever EURC they already took, and must
 * be able to send, bridge, and withdraw it. Filtering the wallet by this
 * setting would hide real money.
 *
 * It also never applies retroactively. An invoice raised in EURC stays a EURC
 * invoice and renders as one forever; disabling a currency only removes it
 * from the choices offered when creating something new.
 */

export interface CurrencySettings {
  /** Currencies customers may pay in. Never empty. */
  enabled: Currency[];
  /** Networks offered at checkout. Always a subset of the enabled coins' networks. */
  networks: Chain[];
  /** Preselected when creating something new. Always a member of `enabled`. */
  defaultCurrency: Currency;
}

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  enabled: ['USDC', 'EURC', 'JPYC', 'HTGC'],
  networks: ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'],
  defaultCurrency: 'USDC',
};

/** Canonical display order, so networks never shuffle between renders. */
const ALL_CHAINS: Chain[] = ['base', 'ethereum', 'polygon', 'arbitrum', 'optimism'];

/** Every network at least one of these currencies can settle on. */
export function networksFor(currencies: Currency[]): Chain[] {
  const set = new Set<Chain>();
  for (const c of currencies) {
    for (const n of STABLECOINS[c].networks) set.add(n);
  }
  return ALL_CHAINS.filter(n => set.has(n));
}

/**
 * Forces the invariants the rest of the app relies on: at least one currency,
 * a default that is actually enabled, and at least one reachable network.
 *
 * Every write goes through this, so no call site has to remember the rules.
 */
export function normalise(input: Partial<CurrencySettings>): CurrencySettings {
  const order: Currency[] = ['USDC', 'EURC', 'JPYC', 'HTGC'];

  // A merchant with no accepted currency could not be paid at all, so an empty
  // selection falls back rather than being stored.
  let enabled = order.filter(c => input.enabled?.includes(c));
  if (enabled.length === 0) enabled = ['USDC'];

  const possible = networksFor(enabled);
  let networks = possible.filter(n => input.networks?.includes(n));
  if (networks.length === 0) networks = possible;

  const defaultCurrency = input.defaultCurrency && enabled.includes(input.defaultCurrency)
    ? input.defaultCurrency
    : enabled[0];

  return { enabled, networks, defaultCurrency };
}

const KEY = 'cp.currency-settings';

let value: CurrencySettings = DEFAULT_CURRENCY_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): CurrencySettings {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CURRENCY_SETTINGS;
    const settings = normalise(JSON.parse(raw) as Partial<CurrencySettings>);

    // Heal a stored record that violates the invariants — an older shape, or a
    // hand-edited value. Writing straight to storage rather than through
    // `write` keeps this free of side effects during render.
    const healed = JSON.stringify(settings);
    if (healed !== raw) window.localStorage.setItem(KEY, healed);

    return settings;
  } catch {
    // Unparseable. Drop it rather than leaving a record that can never be
    // read and would shadow every future default.
    try { window.localStorage.removeItem(KEY); } catch { /* non-fatal */ }
    return DEFAULT_CURRENCY_SETTINGS;
  }
}

function write(next: CurrencySettings) {
  value = next;
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* non-fatal */ }
  }
  listeners.forEach(l => l());
}

/** Read-and-write access to the merchant's accepted currencies. */
export function useCurrencySettings() {
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

  // The server cannot see localStorage, so it renders the default and the
  // client reconciles on hydration.
  const getServerSnapshot = useCallback(() => DEFAULT_CURRENCY_SETTINGS, []);

  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const patch = useCallback((changes: Partial<CurrencySettings>) => {
    write(normalise({ ...value, ...changes }));
  }, []);

  const toggleCurrency = useCallback((c: Currency) => {
    const next = value.enabled.includes(c)
      ? value.enabled.filter(x => x !== c)
      : [...value.enabled, c];
    // Turning a coin off can strand the networks it was the only user of, so
    // re-derive networks against what remains.
    const possible = networksFor(next.length ? next : ['USDC']);
    write(normalise({
      ...value,
      enabled: next,
      networks: value.networks.filter(n => possible.includes(n)),
    }));
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(KEY); } catch { /* non-fatal */ }
    }
    write(DEFAULT_CURRENCY_SETTINGS);
  }, []);

  return { settings, patch, toggleCurrency, reset };
}

/** Whether a currency may be used for something new. */
export function isAccepted(settings: CurrencySettings, c: Currency): boolean {
  return settings.enabled.includes(c);
}

/** Networks a given currency can actually be paid on, given the settings. */
export function acceptedNetworks(settings: CurrencySettings, c: Currency): Chain[] {
  return STABLECOINS[c].networks.filter(n => settings.networks.includes(n));
}
