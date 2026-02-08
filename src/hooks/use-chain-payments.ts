import { type Address, type Hex } from 'viem';
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
} from 'wagmi';
import {
  getChainPaymentsConfig,
  getUsdcConfig,
  PaymentStatusOnChain,
  type PaymentStatusOnChain as PaymentStatusType,
  HoldStatusOnChain,
  type HoldStatusOnChain as HoldStatusType,
} from '@/lib/contracts';

// ===========================================================================
// Parsed return types
// ===========================================================================

export interface OnChainPayment {
  amount: bigint;
  payer: Address;
  merchant: Address;
  status: PaymentStatusType;
  refundedAmount: bigint;
  /** Human-readable label for the payment status. */
  statusLabel: string;
}

export interface OnChainHold {
  amount: bigint;
  captured: bigint;
  released: bigint;
  status: HoldStatusType;
  expiresAt: bigint;
  statusLabel: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAYMENT_STATUS_LABELS: Record<number, string> = {
  [PaymentStatusOnChain.None]: 'None',
  [PaymentStatusOnChain.AwaitingPayment]: 'Awaiting Payment',
  [PaymentStatusOnChain.Succeeded]: 'Succeeded',
  [PaymentStatusOnChain.Failed]: 'Failed',
  [PaymentStatusOnChain.Expired]: 'Expired',
  [PaymentStatusOnChain.Refunded]: 'Refunded',
  [PaymentStatusOnChain.PartialRefund]: 'Partial Refund',
};

const HOLD_STATUS_LABELS: Record<number, string> = {
  [HoldStatusOnChain.None]: 'None',
  [HoldStatusOnChain.Active]: 'Active',
  [HoldStatusOnChain.Captured]: 'Captured',
  [HoldStatusOnChain.Released]: 'Released',
  [HoldStatusOnChain.Expired]: 'Expired',
};

function parsePayment(
  data: readonly [bigint, Address, Address, number, bigint],
): OnChainPayment {
  const [amount, payer, merchant, status, refundedAmount] = data;
  return {
    amount,
    payer,
    merchant,
    status: status as PaymentStatusType,
    refundedAmount,
    statusLabel: PAYMENT_STATUS_LABELS[status] ?? 'Unknown',
  };
}

function parseHold(
  data: readonly [bigint, bigint, bigint, number, bigint],
): OnChainHold {
  const [amount, captured, released, status, expiresAt] = data;
  return {
    amount,
    captured,
    released,
    status: status as HoldStatusType,
    expiresAt,
    statusLabel: HOLD_STATUS_LABELS[status] ?? 'Unknown',
  };
}

// ===========================================================================
// Read Hooks
// ===========================================================================

/**
 * Reads a payment intent from the ChainPayments contract.
 *
 * @param paymentId - The bytes32 payment ID (pass as `0x...` hex string).
 *                    Pass `undefined` to disable the query.
 */
export function usePayment(paymentId: Hex | undefined) {
  const chainId = useChainId();
  const contractConfig = getChainPaymentsConfig(chainId);

  const result = useReadContract({
    ...contractConfig,
    functionName: 'getPayment',
    args: paymentId ? [paymentId] : undefined,
    query: {
      enabled: !!paymentId,
    },
  });

  return {
    ...result,
    payment: result.data ? parsePayment(result.data) : undefined,
  };
}

/**
 * Reads an escrow hold from the ChainPayments contract.
 *
 * @param holdId - The bytes32 hold ID. Pass `undefined` to disable.
 */
export function useHold(holdId: Hex | undefined) {
  const chainId = useChainId();
  const contractConfig = getChainPaymentsConfig(chainId);

  const result = useReadContract({
    ...contractConfig,
    functionName: 'getHold',
    args: holdId ? [holdId] : undefined,
    query: {
      enabled: !!holdId,
    },
  });

  return {
    ...result,
    hold: result.data ? parseHold(result.data) : undefined,
  };
}

/**
 * Reads the USDC balance for a given address.
 *
 * @param address - Wallet address to check. Pass `undefined` to disable.
 */
export function useUSDCBalance(address: Address | undefined) {
  const chainId = useChainId();
  const usdcConfig = getUsdcConfig(chainId);

  return useReadContract({
    ...usdcConfig,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Reads the USDC allowance the `owner` has granted to `spender`.
 */
export function useUSDCAllowance(owner: Address | undefined, spender: Address | undefined) {
  const chainId = useChainId();
  const usdcConfig = getUsdcConfig(chainId);

  return useReadContract({
    ...usdcConfig,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender,
    },
  });
}

// ===========================================================================
// Write Hooks
// ===========================================================================

/**
 * Hook to create a new payment intent on the ChainPayments contract.
 *
 * Usage:
 * ```ts
 * const { createPayment, txHash, isConfirming, isConfirmed } = useCreatePayment();
 * await createPayment({ id, amount, merchant });
 * ```
 */
export function useCreatePayment() {
  const chainId = useChainId();
  const contractConfig = getChainPaymentsConfig(chainId);

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

  function createPayment({
    id,
    amount,
    merchant,
  }: {
    id: Hex;
    amount: bigint;
    merchant: Address;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'createPayment',
      args: [id, amount, merchant],
    });
  }

  return {
    createPayment,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a customer to pay a payment intent.
 * The customer must have approved sufficient USDC to the ChainPayments contract
 * before calling this.
 *
 * Usage:
 * ```ts
 * const { pay, txHash, isConfirming, isConfirmed } = usePay();
 * pay({ paymentId: '0x...' });
 * ```
 */
export function usePay() {
  const chainId = useChainId();
  const contractConfig = getChainPaymentsConfig(chainId);

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

  function pay({ paymentId }: { paymentId: Hex }) {
    writeContract({
      ...contractConfig,
      functionName: 'pay',
      args: [paymentId],
    });
  }

  return {
    pay,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook to approve the USDC ERC-20 token for spending by a spender contract.
 *
 * Usage:
 * ```ts
 * const { approve, txHash, isConfirmed } = useApproveUSDC();
 * approve({ spender: chainPaymentsAddress, amount: 1000000n }); // 1 USDC
 * ```
 */
export function useApproveUSDC() {
  const chainId = useChainId();
  const usdcConfig = getUsdcConfig(chainId);

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

  function approve({
    spender,
    amount,
  }: {
    spender: Address;
    amount: bigint;
  }) {
    writeContract({
      ...usdcConfig,
      functionName: 'approve',
      args: [spender, amount],
    });
  }

  return {
    approve,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a merchant to issue a direct refund (full or partial).
 *
 * The merchant must have approved USDC to the ChainPayments contract
 * for the refund amount before calling this.
 *
 * Usage:
 * ```ts
 * const { directRefund, txHash, isConfirmed } = useDirectRefund();
 * directRefund({ paymentId: '0x...', amount: 500000n });
 * ```
 */
export function useDirectRefund() {
  const chainId = useChainId();
  const contractConfig = getChainPaymentsConfig(chainId);

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

  function directRefund({
    paymentId,
    amount,
  }: {
    paymentId: Hex;
    amount: bigint;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'directRefund',
      args: [paymentId, amount],
    });
  }

  return {
    directRefund,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook to create an escrow hold on a payment.
 *
 * Usage:
 * ```ts
 * const { createHold, txHash, isConfirmed } = useCreateHold();
 * createHold({ holdId, paymentId, amount, duration });
 * ```
 */
export function useCreateHold() {
  const chainId = useChainId();
  const contractConfig = getChainPaymentsConfig(chainId);

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

  function createHold({
    holdId,
    paymentId,
    amount,
    duration,
  }: {
    holdId: Hex;
    paymentId: Hex;
    amount: bigint;
    duration: bigint;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'createHold',
      args: [holdId, paymentId, amount, duration],
    });
  }

  return {
    createHold,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a merchant to capture held funds from escrow.
 */
export function useCaptureHold() {
  const chainId = useChainId();
  const contractConfig = getChainPaymentsConfig(chainId);

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

  function captureHold({
    holdId,
    amount,
  }: {
    holdId: Hex;
    amount: bigint;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'captureHold',
      args: [holdId, amount],
    });
  }

  return {
    captureHold,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for a merchant to release held funds back to the payer.
 */
export function useReleaseHold() {
  const chainId = useChainId();
  const contractConfig = getChainPaymentsConfig(chainId);

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

  function releaseHold({
    holdId,
    amount,
  }: {
    holdId: Hex;
    amount: bigint;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'releaseHold',
      args: [holdId, amount],
    });
  }

  return {
    releaseHold,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

// ===========================================================================
// Convenience: connected wallet's USDC balance
// ===========================================================================

/**
 * Reads the connected wallet's USDC balance. Automatically uses the
 * account from `useAccount()`.
 */
export function useMyUSDCBalance() {
  const { address } = useAccount();
  return useUSDCBalance(address);
}
