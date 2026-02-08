import { type Address } from 'viem';
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi';
import {
  getSubscriptionsConfig,
  SubscriptionStatusOnChain,
  type SubscriptionStatusOnChain as SubscriptionStatusType,
} from '@/lib/contracts';

// ===========================================================================
// Parsed return types
// ===========================================================================

export interface OnChainPlan {
  merchant: Address;
  name: string;
  amount: bigint;
  interval: bigint;
  active: boolean;
}

export interface OnChainSubscription {
  planId: bigint;
  customer: Address;
  status: SubscriptionStatusType;
  nextBillingAt: bigint;
  retryCount: bigint;
  /** Human-readable label for the subscription status. */
  statusLabel: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SUBSCRIPTION_STATUS_LABELS: Record<number, string> = {
  [SubscriptionStatusOnChain.None]: 'None',
  [SubscriptionStatusOnChain.Active]: 'Active',
  [SubscriptionStatusOnChain.PastDue]: 'Past Due',
  [SubscriptionStatusOnChain.Paused]: 'Paused',
  [SubscriptionStatusOnChain.Canceled]: 'Canceled',
};

function parsePlan(
  data: readonly [Address, string, bigint, bigint, boolean],
): OnChainPlan {
  const [merchant, name, amount, interval, active] = data;
  return {
    merchant,
    name,
    amount,
    interval,
    active,
  };
}

function parseSubscription(
  data: readonly [bigint, Address, number, bigint, bigint],
): OnChainSubscription {
  const [planId, customer, status, nextBillingAt, retryCount] = data;
  return {
    planId,
    customer,
    status: status as SubscriptionStatusType,
    nextBillingAt,
    retryCount,
    statusLabel: SUBSCRIPTION_STATUS_LABELS[status] ?? 'Unknown',
  };
}

// ===========================================================================
// Read Hooks
// ===========================================================================

/**
 * Reads a subscription plan from the Subscriptions contract.
 *
 * @param planId - The uint256 plan ID. Pass `undefined` to disable the query.
 */
export function usePlan(planId: bigint | undefined) {
  const chainId = useChainId();
  const contractConfig = getSubscriptionsConfig(chainId);

  const result = useReadContract({
    ...contractConfig,
    functionName: 'getPlan',
    args: planId !== undefined ? [planId] : undefined,
    query: {
      enabled: planId !== undefined,
    },
  });

  return {
    ...result,
    plan: result.data ? parsePlan(result.data) : undefined,
  };
}

/**
 * Reads a subscription from the Subscriptions contract.
 *
 * @param subId - The uint256 subscription ID. Pass `undefined` to disable the query.
 */
export function useSubscription(subId: bigint | undefined) {
  const chainId = useChainId();
  const contractConfig = getSubscriptionsConfig(chainId);

  const result = useReadContract({
    ...contractConfig,
    functionName: 'getSubscription',
    args: subId !== undefined ? [subId] : undefined,
    query: {
      enabled: subId !== undefined,
    },
  });

  return {
    ...result,
    subscription: result.data ? parseSubscription(result.data) : undefined,
  };
}

// ===========================================================================
// Write Hooks
// ===========================================================================

/**
 * Hook for a merchant to create a new subscription plan.
 *
 * Usage:
 * ```ts
 * const { createPlan, txHash, isConfirmed } = useCreatePlan();
 * createPlan({
 *   name: 'Pro Monthly',
 *   amount: 10_000000n,   // 10 USDC
 *   interval: 2592000n,   // 30 days in seconds
 *   trialDays: 14n,
 *   gracePeriod: 86400n,  // 1 day
 *   maxRetries: 3n,
 * });
 * ```
 */
export function useCreatePlan() {
  const chainId = useChainId();
  const contractConfig = getSubscriptionsConfig(chainId);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function createPlan({
    name,
    amount,
    interval,
    trialDays,
    gracePeriod,
    maxRetries,
  }: {
    name: string;
    amount: bigint;
    interval: bigint;
    trialDays: bigint;
    gracePeriod: bigint;
    maxRetries: bigint;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'createPlan',
      args: [name, amount, interval, trialDays, gracePeriod, maxRetries],
    });
  }

  return {
    createPlan,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a merchant to deactivate a plan (no new subscriptions).
 *
 * Usage:
 * ```ts
 * const { deactivatePlan, txHash, isConfirmed } = useDeactivatePlan();
 * deactivatePlan({ planId: 1n });
 * ```
 */
export function useDeactivatePlan() {
  const chainId = useChainId();
  const contractConfig = getSubscriptionsConfig(chainId);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function deactivatePlan({ planId }: { planId: bigint }) {
    writeContract({
      ...contractConfig,
      functionName: 'deactivatePlan',
      args: [planId],
    });
  }

  return {
    deactivatePlan,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a customer to subscribe to a plan.
 * The customer must have approved USDC to the Subscriptions contract
 * before billing can occur.
 *
 * Usage:
 * ```ts
 * const { subscribe, txHash, isConfirmed } = useSubscribe();
 * subscribe({ planId: 1n });
 * ```
 */
export function useSubscribe() {
  const chainId = useChainId();
  const contractConfig = getSubscriptionsConfig(chainId);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function subscribe({ planId }: { planId: bigint }) {
    writeContract({
      ...contractConfig,
      functionName: 'subscribe',
      args: [planId],
    });
  }

  return {
    subscribe,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook to process a recurring billing charge for a subscription.
 * Callable by the merchant or any authorized bot.
 *
 * Usage:
 * ```ts
 * const { chargeBilling, txHash, isConfirmed } = useChargeBilling();
 * chargeBilling({ subId: 1n });
 * ```
 */
export function useChargeBilling() {
  const chainId = useChainId();
  const contractConfig = getSubscriptionsConfig(chainId);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function chargeBilling({ subId }: { subId: bigint }) {
    writeContract({
      ...contractConfig,
      functionName: 'chargeBilling',
      args: [subId],
    });
  }

  return {
    chargeBilling,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a customer to pause their subscription (billing stops).
 *
 * Usage:
 * ```ts
 * const { pauseSubscription, txHash, isConfirmed } = usePauseSubscription();
 * pauseSubscription({ subId: 1n });
 * ```
 */
export function usePauseSubscription() {
  const chainId = useChainId();
  const contractConfig = getSubscriptionsConfig(chainId);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function pauseSubscription({ subId }: { subId: bigint }) {
    writeContract({
      ...contractConfig,
      functionName: 'pause',
      args: [subId],
    });
  }

  return {
    pauseSubscription,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a customer to resume a paused subscription.
 *
 * Usage:
 * ```ts
 * const { resumeSubscription, txHash, isConfirmed } = useResumeSubscription();
 * resumeSubscription({ subId: 1n });
 * ```
 */
export function useResumeSubscription() {
  const chainId = useChainId();
  const contractConfig = getSubscriptionsConfig(chainId);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function resumeSubscription({ subId }: { subId: bigint }) {
    writeContract({
      ...contractConfig,
      functionName: 'resume',
      args: [subId],
    });
  }

  return {
    resumeSubscription,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a customer to permanently cancel their subscription.
 *
 * Usage:
 * ```ts
 * const { cancelSubscription, txHash, isConfirmed } = useCancelSubscription();
 * cancelSubscription({ subId: 1n });
 * ```
 */
export function useCancelSubscription() {
  const chainId = useChainId();
  const contractConfig = getSubscriptionsConfig(chainId);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function cancelSubscription({ subId }: { subId: bigint }) {
    writeContract({
      ...contractConfig,
      functionName: 'cancel',
      args: [subId],
    });
  }

  return {
    cancelSubscription,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}
