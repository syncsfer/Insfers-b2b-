import { type Abi, type Address } from 'viem';

// ===========================================================================
// ChainPayments Contract
// ===========================================================================
// Matches: contracts/src/ChainPayments.sol
// Core payment processor: payment intents, direct refunds, escrow holds.
// ===========================================================================

export const chainPaymentsAbi = [
  // ── Admin ────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'setUSDC',
    inputs: [{ name: '_usdc', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setFeeBps',
    inputs: [{ name: '_feeBps', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'registerMerchant',
    inputs: [
      { name: 'merchant', type: 'address', internalType: 'address' },
      { name: 'settlementWallet', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Payments ─────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'createPayment',
    inputs: [
      { name: 'id', type: 'bytes32', internalType: 'bytes32' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'merchant', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'pay',
    inputs: [{ name: 'id', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'expirePayment',
    inputs: [{ name: 'id', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Direct Refunds ───────────────────────────────────────────────────
  {
    type: 'function',
    name: 'directRefund',
    inputs: [
      { name: 'paymentId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Escrow Holds ─────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'createHold',
    inputs: [
      { name: 'holdId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'paymentId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'duration', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'captureHold',
    inputs: [
      { name: 'holdId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'releaseHold',
    inputs: [
      { name: 'holdId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'expireHold',
    inputs: [{ name: 'holdId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Views ────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'getPayment',
    inputs: [{ name: 'id', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'payer', type: 'address', internalType: 'address' },
      { name: 'merchant', type: 'address', internalType: 'address' },
      { name: 'status', type: 'uint8', internalType: 'enum ChainPayments.PaymentStatus' },
      { name: 'refundedAmount', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getHold',
    inputs: [{ name: 'id', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'captured', type: 'uint256', internalType: 'uint256' },
      { name: 'released', type: 'uint256', internalType: 'uint256' },
      { name: 'status', type: 'uint8', internalType: 'enum ChainPayments.HoldStatus' },
      { name: 'expiresAt', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },

  // ── Public state readers ─────────────────────────────────────────────
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'usdc',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'feeBps',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalVolume',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalFees',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paymentCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'registeredMerchants',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'merchantSettlementWallets',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },

  // ── Owner: Withdraw fees ─────────────────────────────────────────────
  {
    type: 'function',
    name: 'withdrawFees',
    inputs: [{ name: 'to', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Events ───────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'PaymentCreated',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'merchant', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'PaymentSucceeded',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'payer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'merchant', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'PaymentFailed',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true, internalType: 'bytes32' },
    ],
  },
  {
    type: 'event',
    name: 'PaymentExpired',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true, internalType: 'bytes32' },
    ],
  },
  {
    type: 'event',
    name: 'DirectRefundIssued',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'payer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'PartialRefundIssued',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'payer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'HoldCreated',
    inputs: [
      { name: 'holdId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'paymentId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'expiresAt', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'HoldCaptured',
    inputs: [
      { name: 'holdId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'HoldReleased',
    inputs: [
      { name: 'holdId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'HoldExpired',
    inputs: [
      { name: 'holdId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
    ],
  },
  {
    type: 'event',
    name: 'MerchantRegistered',
    inputs: [
      { name: 'merchant', type: 'address', indexed: true, internalType: 'address' },
      { name: 'settlementWallet', type: 'address', indexed: true, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'FeeUpdated',
    inputs: [
      { name: 'oldFeeBps', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newFeeBps', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
] as const satisfies Abi;

// ===========================================================================
// ClaimableRefund Contract
// ===========================================================================
// Matches: contracts/src/ClaimableRefund.sol
// Merchant deposits refund, customer claims to any wallet via secret link.
// ===========================================================================

export const claimableRefundAbi = [
  // ── Admin ────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'setUSDC',
    inputs: [{ name: '_usdc', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Merchant: Deposit ────────────────────────────────────────────────
  {
    type: 'function',
    name: 'depositRefund',
    inputs: [
      { name: 'refundId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'paymentId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'claimSecretHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'expiryDuration', type: 'uint256', internalType: 'uint256' },
      { name: 'reason', type: 'string', internalType: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Customer: Claim ──────────────────────────────────────────────────
  {
    type: 'function',
    name: 'claim',
    inputs: [
      { name: 'claimSecret', type: 'bytes32', internalType: 'bytes32' },
      { name: 'destinationWallet', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Merchant: Manage ─────────────────────────────────────────────────
  {
    type: 'function',
    name: 'extendExpiry',
    inputs: [
      { name: 'refundId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'additionalDuration', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'markExpired',
    inputs: [{ name: 'refundId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'reclaimExpired',
    inputs: [{ name: 'refundId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Views ────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'getRefund',
    inputs: [{ name: 'refundId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'merchant', type: 'address', internalType: 'address' },
      { name: 'claimedBy', type: 'address', internalType: 'address' },
      { name: 'status', type: 'uint8', internalType: 'enum ClaimableRefund.RefundStatus' },
      { name: 'expiresAt', type: 'uint256', internalType: 'uint256' },
      { name: 'claimedAt', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isClaimable',
    inputs: [{ name: 'refundId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'timeRemaining',
    inputs: [{ name: 'refundId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },

  // ── Public state readers ─────────────────────────────────────────────
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'usdc',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalDeposited',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalClaimed',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalReturned',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'refundCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },

  // ── Events ───────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'RefundDeposited',
    inputs: [
      { name: 'refundId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'paymentId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'merchant', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'expiresAt', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'RefundClaimed',
    inputs: [
      { name: 'refundId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'claimedBy', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'RefundExpired',
    inputs: [
      { name: 'refundId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
    ],
  },
  {
    type: 'event',
    name: 'RefundReturned',
    inputs: [
      { name: 'refundId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'merchant', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'ExpiryExtended',
    inputs: [
      { name: 'refundId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'newExpiresAt', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
] as const satisfies Abi;

// ===========================================================================
// Subscriptions Contract
// ===========================================================================
// Matches: contracts/src/Subscriptions.sol
// Recurring USDC payments: plans, subscriptions, billing, dunning.
// ===========================================================================

export const subscriptionsAbi = [
  // ── Plan Management ─────────────────────────────────────────────────
  {
    type: 'function',
    name: 'createPlan',
    inputs: [
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'interval', type: 'uint256', internalType: 'uint256' },
      { name: 'trialDays', type: 'uint256', internalType: 'uint256' },
      { name: 'gracePeriod', type: 'uint256', internalType: 'uint256' },
      { name: 'maxRetries', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'deactivatePlan',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Subscription Lifecycle ──────────────────────────────────────────
  {
    type: 'function',
    name: 'subscribe',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: 'subId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'chargeBilling',
    inputs: [{ name: 'subId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancel',
    inputs: [{ name: 'subId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'pause',
    inputs: [{ name: 'subId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'resume',
    inputs: [{ name: 'subId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Views ────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'getPlan',
    inputs: [{ name: 'planId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'merchant', type: 'address', internalType: 'address' },
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'interval', type: 'uint256', internalType: 'uint256' },
      { name: 'active', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSubscription',
    inputs: [{ name: 'subId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'planId', type: 'uint256', internalType: 'uint256' },
      { name: 'customer', type: 'address', internalType: 'address' },
      { name: 'status', type: 'uint8', internalType: 'enum Subscriptions.SubscriptionStatus' },
      { name: 'nextBillingAt', type: 'uint256', internalType: 'uint256' },
      { name: 'retryCount', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },

  // ── Public state readers ─────────────────────────────────────────────
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'usdc',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'planCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'subscriptionCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'authorizations',
    inputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },

  // ── Events ───────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'PlanCreated',
    inputs: [
      { name: 'planId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'merchant', type: 'address', indexed: true, internalType: 'address' },
      { name: 'name', type: 'string', indexed: false, internalType: 'string' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'interval', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'PlanDeactivated',
    inputs: [
      { name: 'planId', type: 'uint256', indexed: true, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'SubscriptionCreated',
    inputs: [
      { name: 'subId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'planId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'customer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'trialEndsAt', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'BillingCharged',
    inputs: [
      { name: 'subId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'customer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'nextBillingAt', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'BillingFailed',
    inputs: [
      { name: 'subId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'customer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'retryCount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'maxRetries', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'SubscriptionCanceled',
    inputs: [
      { name: 'subId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'customer', type: 'address', indexed: true, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'SubscriptionPaused',
    inputs: [
      { name: 'subId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'customer', type: 'address', indexed: true, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'SubscriptionResumed',
    inputs: [
      { name: 'subId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'customer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'nextBillingAt', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
] as const satisfies Abi;

// ===========================================================================
// ConnectSplits Contract
// ===========================================================================
// Matches: contracts/src/ConnectSplits.sol
// Marketplace payment splits for connected accounts.
// ===========================================================================

export const connectSplitsAbi = [
  // ── Admin ────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'connectAccount',
    inputs: [
      { name: 'account', type: 'address', internalType: 'address' },
      { name: 'settlementWallet', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'deactivateAccount',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setPlatformFeeBps',
    inputs: [{ name: '_feeBps', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Split Payments ──────────────────────────────────────────────────
  {
    type: 'function',
    name: 'splitPayment',
    inputs: [
      { name: 'paymentId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'totalAmount', type: 'uint256', internalType: 'uint256' },
      {
        name: 'rules',
        type: 'tuple[]',
        internalType: 'struct ConnectSplits.SplitRule[]',
        components: [
          { name: 'recipient', type: 'address', internalType: 'address' },
          { name: 'bps', type: 'uint256', internalType: 'uint256' },
          { name: 'flat', type: 'uint256', internalType: 'uint256' },
        ],
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Views ────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'getSplitRecord',
    inputs: [{ name: 'paymentId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'payer', type: 'address', internalType: 'address' },
      { name: 'totalAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', internalType: 'uint256' },
      { name: 'splitCount', type: 'uint256', internalType: 'uint256' },
      { name: 'executedAt', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isConnected',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },

  // ── Public state readers ─────────────────────────────────────────────
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'usdc',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'platformFeeBps',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_PLATFORM_FEE_BPS',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'BPS_DENOMINATOR',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSplitVolume',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalPlatformFees',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },

  // ── Events ───────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'AccountConnected',
    inputs: [
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
      { name: 'settlementWallet', type: 'address', indexed: true, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'AccountDeactivated',
    inputs: [
      { name: 'account', type: 'address', indexed: true, internalType: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'PaymentSplit',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'SplitExecuted',
    inputs: [
      { name: 'paymentId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'payer', type: 'address', indexed: true, internalType: 'address' },
      { name: 'totalAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'platformFee', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'recipientCount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'PlatformFeeUpdated',
    inputs: [
      { name: 'oldFeeBps', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newFeeBps', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
] as const satisfies Abi;

// ===========================================================================
// Payouts Contract
// ===========================================================================
// Matches: contracts/src/Payouts.sol
// Batch payout processor for platform-to-merchant USDC disbursements.
// ===========================================================================

export const payoutsAbi = [
  // ── Payout Management ───────────────────────────────────────────────
  {
    type: 'function',
    name: 'createPayout',
    inputs: [
      { name: 'recipient', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: 'payoutId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'executeBatch',
    inputs: [
      { name: 'payoutIds', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Views ────────────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'getPayout',
    inputs: [{ name: 'payoutId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      { name: 'recipient', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'status', type: 'uint8', internalType: 'enum Payouts.PayoutStatus' },
      { name: 'createdAt', type: 'uint256', internalType: 'uint256' },
      { name: 'completedAt', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },

  // ── Public state readers ─────────────────────────────────────────────
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'usdc',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'payoutCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalDisbursed',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalPayoutsCompleted',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },

  // ── Events ───────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'PayoutCreated',
    inputs: [
      { name: 'payoutId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'PayoutCompleted',
    inputs: [
      { name: 'payoutId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'PayoutFailed',
    inputs: [
      { name: 'payoutId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'recipient', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'BatchExecuted',
    inputs: [
      { name: 'payoutIds', type: 'uint256[]', indexed: false, internalType: 'uint256[]' },
      { name: 'totalAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'successCount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'failCount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
] as const satisfies Abi;

// ===========================================================================
// USDC ERC-20 Token (standard interface)
// ===========================================================================
// Matches: contracts/src/interfaces/IERC20.sol
// ===========================================================================

export const usdcAbi = [
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true, internalType: 'address' },
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'spender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
  },
] as const satisfies Abi;

// ===========================================================================
// Deployed Contract Addresses
// ===========================================================================
// Placeholder addresses -- replace after deployment to each network.
// The zero address (0x000...000) indicates "not yet deployed".
// ===========================================================================

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export interface ContractAddresses {
  chainPayments: Address;
  claimableRefund: Address;
  subscriptions: Address;
  connectSplits: Address;
  payouts: Address;
  usdc: Address;
}

/**
 * Contract addresses indexed by chain ID.
 * After deploying contracts, fill in the real addresses here.
 */
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  // Arc Testnet (chain ID 1637)
  1637: {
    chainPayments: ZERO_ADDRESS,
    claimableRefund: ZERO_ADDRESS,
    subscriptions: ZERO_ADDRESS,
    connectSplits: ZERO_ADDRESS,
    payouts: ZERO_ADDRESS,
    usdc: ZERO_ADDRESS,
  },
  // Base (chain ID 8453)
  8453: {
    chainPayments: ZERO_ADDRESS,
    claimableRefund: ZERO_ADDRESS,
    subscriptions: ZERO_ADDRESS,
    connectSplits: ZERO_ADDRESS,
    payouts: ZERO_ADDRESS,
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, // Base USDC
  },
  // Ethereum Mainnet (chain ID 1)
  1: {
    chainPayments: ZERO_ADDRESS,
    claimableRefund: ZERO_ADDRESS,
    subscriptions: ZERO_ADDRESS,
    connectSplits: ZERO_ADDRESS,
    payouts: ZERO_ADDRESS,
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address, // Ethereum USDC
  },
  // Polygon (chain ID 137)
  137: {
    chainPayments: ZERO_ADDRESS,
    claimableRefund: ZERO_ADDRESS,
    subscriptions: ZERO_ADDRESS,
    connectSplits: ZERO_ADDRESS,
    payouts: ZERO_ADDRESS,
    usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as Address, // Polygon native USDC
  },
  // Arbitrum One (chain ID 42161)
  42161: {
    chainPayments: ZERO_ADDRESS,
    claimableRefund: ZERO_ADDRESS,
    subscriptions: ZERO_ADDRESS,
    connectSplits: ZERO_ADDRESS,
    payouts: ZERO_ADDRESS,
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address, // Arbitrum native USDC
  },
  // Optimism (chain ID 10)
  10: {
    chainPayments: ZERO_ADDRESS,
    claimableRefund: ZERO_ADDRESS,
    subscriptions: ZERO_ADDRESS,
    connectSplits: ZERO_ADDRESS,
    payouts: ZERO_ADDRESS,
    usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as Address, // Optimism native USDC
  },
} as const;

// ===========================================================================
// Typed Contract Configs
// ===========================================================================
// Pre-built config objects suitable for passing directly to wagmi hooks:
//   useReadContract(chainPaymentsConfig)
//   useWriteContract() + writeContract(chainPaymentsConfig)
// ===========================================================================

/**
 * Returns the contract address set for a given chain ID.
 * Falls back to Arc Testnet addresses if the chain is not configured.
 */
export function getContractAddresses(chainId: number): ContractAddresses {
  return CONTRACT_ADDRESSES[chainId] ?? CONTRACT_ADDRESSES[1637];
}

/**
 * Builds a typed wagmi contract config for ChainPayments on the given chain.
 */
export function getChainPaymentsConfig(chainId: number) {
  return {
    address: getContractAddresses(chainId).chainPayments,
    abi: chainPaymentsAbi,
  } as const;
}

/**
 * Builds a typed wagmi contract config for ClaimableRefund on the given chain.
 */
export function getClaimableRefundConfig(chainId: number) {
  return {
    address: getContractAddresses(chainId).claimableRefund,
    abi: claimableRefundAbi,
  } as const;
}

/**
 * Builds a typed wagmi contract config for Subscriptions on the given chain.
 */
export function getSubscriptionsConfig(chainId: number) {
  return {
    address: getContractAddresses(chainId).subscriptions,
    abi: subscriptionsAbi,
  } as const;
}

/**
 * Builds a typed wagmi contract config for ConnectSplits on the given chain.
 */
export function getConnectSplitsConfig(chainId: number) {
  return {
    address: getContractAddresses(chainId).connectSplits,
    abi: connectSplitsAbi,
  } as const;
}

/**
 * Builds a typed wagmi contract config for Payouts on the given chain.
 */
export function getPayoutsConfig(chainId: number) {
  return {
    address: getContractAddresses(chainId).payouts,
    abi: payoutsAbi,
  } as const;
}

/**
 * Builds a typed wagmi contract config for the USDC token on the given chain.
 */
export function getUsdcConfig(chainId: number) {
  return {
    address: getContractAddresses(chainId).usdc,
    abi: usdcAbi,
  } as const;
}

// ===========================================================================
// Solidity enum mirrors (for interpreting on-chain uint8 values)
// ===========================================================================

/** Mirrors ChainPayments.PaymentStatus enum indices */
export const PaymentStatusOnChain = {
  None: 0,
  AwaitingPayment: 1,
  Succeeded: 2,
  Failed: 3,
  Expired: 4,
  Refunded: 5,
  PartialRefund: 6,
} as const;

export type PaymentStatusOnChain =
  (typeof PaymentStatusOnChain)[keyof typeof PaymentStatusOnChain];

/** Mirrors ChainPayments.HoldStatus enum indices */
export const HoldStatusOnChain = {
  None: 0,
  Active: 1,
  Captured: 2,
  Released: 3,
  Expired: 4,
} as const;

export type HoldStatusOnChain =
  (typeof HoldStatusOnChain)[keyof typeof HoldStatusOnChain];

/** Mirrors ClaimableRefund.RefundStatus enum indices */
export const RefundStatusOnChain = {
  None: 0,
  AwaitingClaim: 1,
  Claimed: 2,
  Expired: 3,
  Returned: 4,
} as const;

export type RefundStatusOnChain =
  (typeof RefundStatusOnChain)[keyof typeof RefundStatusOnChain];

/** Mirrors Subscriptions.SubscriptionStatus enum indices */
export const SubscriptionStatusOnChain = {
  None: 0,
  Active: 1,
  PastDue: 2,
  Paused: 3,
  Canceled: 4,
} as const;

export type SubscriptionStatusOnChain =
  (typeof SubscriptionStatusOnChain)[keyof typeof SubscriptionStatusOnChain];

/** Mirrors Payouts.PayoutStatus enum indices */
export const PayoutStatusOnChain = {
  None: 0,
  Pending: 1,
  Processing: 2,
  Completed: 3,
  Failed: 4,
} as const;

export type PayoutStatusOnChain =
  (typeof PayoutStatusOnChain)[keyof typeof PayoutStatusOnChain];
