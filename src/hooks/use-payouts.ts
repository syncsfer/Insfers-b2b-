import { type Address } from 'viem';
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi';
import {
  getPayoutsConfig,
  PayoutStatusOnChain,
  type PayoutStatusOnChain as PayoutStatusType,
} from '@/lib/contracts';

// ===========================================================================
// Parsed return types
// ===========================================================================

export interface OnChainPayout {
  recipient: Address;
  amount: bigint;
  status: PayoutStatusType;
  createdAt: bigint;
  completedAt: bigint;
  /** Human-readable label for the payout status. */
  statusLabel: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAYOUT_STATUS_LABELS: Record<number, string> = {
  [PayoutStatusOnChain.None]: 'None',
  [PayoutStatusOnChain.Pending]: 'Pending',
  [PayoutStatusOnChain.Processing]: 'Processing',
  [PayoutStatusOnChain.Completed]: 'Completed',
  [PayoutStatusOnChain.Failed]: 'Failed',
};

function parsePayout(
  data: readonly [Address, bigint, number, bigint, bigint],
): OnChainPayout {
  const [recipient, amount, status, createdAt, completedAt] = data;
  return {
    recipient,
    amount,
    status: status as PayoutStatusType,
    createdAt,
    completedAt,
    statusLabel: PAYOUT_STATUS_LABELS[status] ?? 'Unknown',
  };
}

// ===========================================================================
// Read Hooks
// ===========================================================================

/**
 * Reads a payout record from the Payouts contract.
 *
 * @param payoutId - The uint256 payout ID. Pass `undefined` to disable the query.
 */
export function usePayout(payoutId: bigint | undefined) {
  const chainId = useChainId();
  const contractConfig = getPayoutsConfig(chainId);

  const result = useReadContract({
    ...contractConfig,
    functionName: 'getPayout',
    args: payoutId !== undefined ? [payoutId] : undefined,
    query: {
      enabled: payoutId !== undefined,
    },
  });

  return {
    ...result,
    payout: result.data ? parsePayout(result.data) : undefined,
  };
}

// ===========================================================================
// Write Hooks
// ===========================================================================

/**
 * Hook for the platform owner to create a single payout record.
 *
 * Usage:
 * ```ts
 * const { createPayout, txHash, isConfirmed } = useCreatePayout();
 * createPayout({ recipient: '0x...', amount: 50_000000n });  // 50 USDC
 * ```
 */
export function useCreatePayout() {
  const chainId = useChainId();
  const contractConfig = getPayoutsConfig(chainId);

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

  function createPayout({
    recipient,
    amount,
  }: {
    recipient: Address;
    amount: bigint;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'createPayout',
      args: [recipient, amount],
    });
  }

  return {
    createPayout,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for the platform owner to execute a batch of pending payouts.
 * The Payouts contract must hold enough USDC to cover all payouts in the batch.
 *
 * Usage:
 * ```ts
 * const { executeBatch, txHash, isConfirmed } = useExecuteBatch();
 * executeBatch({ payoutIds: [1n, 2n, 3n] });
 * ```
 */
export function useExecuteBatch() {
  const chainId = useChainId();
  const contractConfig = getPayoutsConfig(chainId);

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

  function executeBatch({ payoutIds }: { payoutIds: bigint[] }) {
    writeContract({
      ...contractConfig,
      functionName: 'executeBatch',
      args: [payoutIds],
    });
  }

  return {
    executeBatch,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}
