import { type Address, type Hex } from 'viem';
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi';
import {
  getClaimableRefundConfig,
  RefundStatusOnChain,
  type RefundStatusOnChain as RefundStatusType,
} from '@/lib/contracts';

// ===========================================================================
// Parsed return types
// ===========================================================================

export interface OnChainRefund {
  amount: bigint;
  merchant: Address;
  claimedBy: Address;
  status: RefundStatusType;
  expiresAt: bigint;
  claimedAt: bigint;
  /** Human-readable label for the refund status. */
  statusLabel: string;
  /** Whether the refund is currently claimable (not expired, not claimed). */
  isAwaitingClaim: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REFUND_STATUS_LABELS: Record<number, string> = {
  [RefundStatusOnChain.None]: 'None',
  [RefundStatusOnChain.AwaitingClaim]: 'Awaiting Claim',
  [RefundStatusOnChain.Claimed]: 'Claimed',
  [RefundStatusOnChain.Expired]: 'Expired',
  [RefundStatusOnChain.Returned]: 'Returned',
};

function parseRefund(
  data: readonly [bigint, Address, Address, number, bigint, bigint],
): OnChainRefund {
  const [amount, merchant, claimedBy, status, expiresAt, claimedAt] = data;
  return {
    amount,
    merchant,
    claimedBy,
    status: status as RefundStatusType,
    expiresAt,
    claimedAt,
    statusLabel: REFUND_STATUS_LABELS[status] ?? 'Unknown',
    isAwaitingClaim: status === RefundStatusOnChain.AwaitingClaim,
  };
}

// ===========================================================================
// Read Hooks
// ===========================================================================

/**
 * Reads the full refund state from the ClaimableRefund contract.
 *
 * @param refundId - The bytes32 refund ID. Pass `undefined` to disable.
 */
export function useClaimableRefund(refundId: Hex | undefined) {
  const chainId = useChainId();
  const contractConfig = getClaimableRefundConfig(chainId);

  const result = useReadContract({
    ...contractConfig,
    functionName: 'getRefund',
    args: refundId ? [refundId] : undefined,
    query: {
      enabled: !!refundId,
    },
  });

  return {
    ...result,
    refund: result.data ? parseRefund(result.data) : undefined,
  };
}

/**
 * Reads whether a refund is currently claimable (bool).
 *
 * @param refundId - The bytes32 refund ID. Pass `undefined` to disable.
 */
export function useIsRefundClaimable(refundId: Hex | undefined) {
  const chainId = useChainId();
  const contractConfig = getClaimableRefundConfig(chainId);

  return useReadContract({
    ...contractConfig,
    functionName: 'isClaimable',
    args: refundId ? [refundId] : undefined,
    query: {
      enabled: !!refundId,
    },
  });
}

/**
 * Reads the time remaining (in seconds) before a refund's claim window expires.
 * Returns 0 if already expired or not in AwaitingClaim status.
 *
 * @param refundId - The bytes32 refund ID. Pass `undefined` to disable.
 */
export function useRefundTimeRemaining(refundId: Hex | undefined) {
  const chainId = useChainId();
  const contractConfig = getClaimableRefundConfig(chainId);

  return useReadContract({
    ...contractConfig,
    functionName: 'timeRemaining',
    args: refundId ? [refundId] : undefined,
    query: {
      enabled: !!refundId,
      // Poll more aggressively for countdown display.
      // Re-fetch every 30 seconds so the UI stays roughly current.
      refetchInterval: 30_000,
    },
  });
}

// ===========================================================================
// Write Hooks
// ===========================================================================

/**
 * Hook for a customer to claim a refund using the secret from the claim URL.
 *
 * The customer provides the raw claim secret and their chosen destination wallet.
 * The contract hashes the secret on-chain to verify it matches.
 *
 * Usage:
 * ```ts
 * const { claimRefund, txHash, isConfirmed } = useClaimRefund();
 * claimRefund({ claimSecret: '0x...', destinationWallet: '0x...' });
 * ```
 */
export function useClaimRefund() {
  const chainId = useChainId();
  const contractConfig = getClaimableRefundConfig(chainId);

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

  function claimRefund({
    claimSecret,
    destinationWallet,
  }: {
    claimSecret: Hex;
    destinationWallet: Address;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'claim',
      args: [claimSecret, destinationWallet],
    });
  }

  return {
    claimRefund,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a merchant to deposit a claimable refund.
 *
 * The merchant must have approved USDC to the ClaimableRefund contract
 * for the refund amount before calling this.
 *
 * Usage:
 * ```ts
 * const { depositRefund, txHash, isConfirmed } = useDepositRefund();
 * depositRefund({
 *   refundId: '0x...',
 *   paymentId: '0x...',
 *   amount: 1000000n,       // 1 USDC
 *   claimSecretHash: '0x...', // keccak256 of the claim secret
 *   expiryDuration: 86400n,   // 24 hours in seconds (0 = default 24h)
 *   reason: 'Customer requested refund',
 * });
 * ```
 */
export function useDepositRefund() {
  const chainId = useChainId();
  const contractConfig = getClaimableRefundConfig(chainId);

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

  function depositRefund({
    refundId,
    paymentId,
    amount,
    claimSecretHash,
    expiryDuration,
    reason,
  }: {
    refundId: Hex;
    paymentId: Hex;
    amount: bigint;
    claimSecretHash: Hex;
    expiryDuration: bigint;
    reason: string;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'depositRefund',
      args: [refundId, paymentId, amount, claimSecretHash, expiryDuration, reason],
    });
  }

  return {
    depositRefund,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a merchant to extend the claim expiry on a refund.
 *
 * Usage:
 * ```ts
 * const { extendExpiry, txHash, isConfirmed } = useExtendRefundExpiry();
 * extendExpiry({ refundId: '0x...', additionalDuration: 86400n });
 * ```
 */
export function useExtendRefundExpiry() {
  const chainId = useChainId();
  const contractConfig = getClaimableRefundConfig(chainId);

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

  function extendExpiry({
    refundId,
    additionalDuration,
  }: {
    refundId: Hex;
    additionalDuration: bigint;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'extendExpiry',
      args: [refundId, additionalDuration],
    });
  }

  return {
    extendExpiry,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook to mark a refund as expired (callable by anyone after expiry).
 */
export function useMarkRefundExpired() {
  const chainId = useChainId();
  const contractConfig = getClaimableRefundConfig(chainId);

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

  function markExpired({ refundId }: { refundId: Hex }) {
    writeContract({
      ...contractConfig,
      functionName: 'markExpired',
      args: [refundId],
    });
  }

  return {
    markExpired,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a merchant to reclaim funds from an expired refund.
 */
export function useReclaimExpiredRefund() {
  const chainId = useChainId();
  const contractConfig = getClaimableRefundConfig(chainId);

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

  function reclaimExpired({ refundId }: { refundId: Hex }) {
    writeContract({
      ...contractConfig,
      functionName: 'reclaimExpired',
      args: [refundId],
    });
  }

  return {
    reclaimExpired,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}
