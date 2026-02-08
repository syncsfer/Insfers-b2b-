import { type Address, type Hex } from 'viem';
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi';
import { getConnectSplitsConfig } from '@/lib/contracts';

// ===========================================================================
// Parsed return types
// ===========================================================================

export interface OnChainConnectedAccount {
  owner: Address;
  settlementWallet: Address;
  active: boolean;
}

/** A split rule describing how a portion of a payment is routed. */
export interface SplitRule {
  recipient: Address;
  bps: bigint;
  flat: bigint;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseConnectedAccount(
  data: readonly [Address, Address, boolean],
): OnChainConnectedAccount {
  const [owner, settlementWallet, active] = data;
  return {
    owner,
    settlementWallet,
    active,
  };
}

// ===========================================================================
// Read Hooks
// ===========================================================================

/**
 * Reads a connected account from the ConnectSplits contract.
 *
 * @param account - The account address. Pass `undefined` to disable the query.
 */
export function useConnectedAccount(account: Address | undefined) {
  const chainId = useChainId();
  const contractConfig = getConnectSplitsConfig(chainId);

  const result = useReadContract({
    ...contractConfig,
    functionName: 'isConnected',
    args: account ? [account] : undefined,
    query: {
      enabled: !!account,
    },
  });

  return {
    ...result,
    isConnected: result.data as boolean | undefined,
  };
}

// ===========================================================================
// Write Hooks
// ===========================================================================

/**
 * Hook for the platform owner to register a connected account.
 *
 * Usage:
 * ```ts
 * const { connectAccount, txHash, isConfirmed } = useConnectAccount();
 * connectAccount({ account: '0x...', settlementWallet: '0x...' });
 * ```
 */
export function useConnectAccount() {
  const chainId = useChainId();
  const contractConfig = getConnectSplitsConfig(chainId);

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

  function connectAccount({
    account,
    settlementWallet,
  }: {
    account: Address;
    settlementWallet: Address;
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'connectAccount',
      args: [account, settlementWallet],
    });
  }

  return {
    connectAccount,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for the platform owner to deactivate a connected account.
 *
 * Usage:
 * ```ts
 * const { deactivateAccount, txHash, isConfirmed } = useDeactivateAccount();
 * deactivateAccount({ account: '0x...' });
 * ```
 */
export function useDeactivateAccount() {
  const chainId = useChainId();
  const contractConfig = getConnectSplitsConfig(chainId);

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

  function deactivateAccount({ account }: { account: Address }) {
    writeContract({
      ...contractConfig,
      functionName: 'deactivateAccount',
      args: [account],
    });
  }

  return {
    deactivateAccount,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook to split a USDC payment across multiple connected recipients.
 * The caller must have approved the ConnectSplits contract for the total amount.
 *
 * Usage:
 * ```ts
 * const { splitPayment, txHash, isConfirmed } = useSplitPayment();
 * splitPayment({
 *   paymentId: '0x...',
 *   totalAmount: 100_000000n,  // 100 USDC
 *   rules: [
 *     { recipient: '0x...', bps: 7000n, flat: 0n },  // 70%
 *     { recipient: '0x...', bps: 3000n, flat: 0n },  // 30%
 *   ],
 * });
 * ```
 */
export function useSplitPayment() {
  const chainId = useChainId();
  const contractConfig = getConnectSplitsConfig(chainId);

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

  function splitPayment({
    paymentId,
    totalAmount,
    rules,
  }: {
    paymentId: Hex;
    totalAmount: bigint;
    rules: SplitRule[];
  }) {
    writeContract({
      ...contractConfig,
      functionName: 'splitPayment',
      args: [paymentId, totalAmount, rules],
    });
  }

  return {
    splitPayment,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}

/**
 * Hook for the platform owner to update the platform fee.
 *
 * Usage:
 * ```ts
 * const { updatePlatformFee, txHash, isConfirmed } = useUpdatePlatformFee();
 * updatePlatformFee({ feeBps: 250n });  // 2.5%
 * ```
 */
export function useUpdatePlatformFee() {
  const chainId = useChainId();
  const contractConfig = getConnectSplitsConfig(chainId);

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

  function updatePlatformFee({ feeBps }: { feeBps: bigint }) {
    writeContract({
      ...contractConfig,
      functionName: 'setPlatformFeeBps',
      args: [feeBps],
    });
  }

  return {
    updatePlatformFee,
    txHash,
    isWritePending,
    isConfirming,
    isConfirmed,
    error: writeError || receiptError,
    reset,
  };
}
