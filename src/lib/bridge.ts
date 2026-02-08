/**
 * Circle CCTP Bridge Integration for Arc Testnet
 *
 * Uses Circle's Bridge Kit to transfer USDC cross-chain to Arc Testnet
 * via Cross-Chain Transfer Protocol (CCTP) — native burn-and-mint.
 *
 * Supported source chains:
 *   Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia,
 *   Polygon Amoy, Avalanche Fuji, Unichain Sepolia, Solana Devnet
 */

export type SourceChain =
  | 'Arbitrum_Sepolia'
  | 'Avalanche_Fuji'
  | 'Base_Sepolia'
  | 'Ethereum_Sepolia'
  | 'Optimism_Sepolia'
  | 'Polygon_Amoy_Testnet'
  | 'Solana_Devnet'
  | 'Unichain_Sepolia';

export interface BridgeRequest {
  sourceChain: SourceChain;
  amount: string; // e.g. "1.00" for 1 USDC
  sourceAddress: string;
  destinationAddress: string;
}

export interface BridgeStep {
  name: string;
  state: 'pending' | 'success' | 'error';
  txHash?: string;
  explorerUrl?: string;
}

export interface BridgeResult {
  success: boolean;
  steps: BridgeStep[];
  error?: string;
}

export const SUPPORTED_SOURCE_CHAINS: {
  label: string;
  value: SourceChain;
  isSolana: boolean;
}[] = [
  { label: 'Ethereum Sepolia', value: 'Ethereum_Sepolia', isSolana: false },
  { label: 'Base Sepolia', value: 'Base_Sepolia', isSolana: false },
  { label: 'Arbitrum Sepolia', value: 'Arbitrum_Sepolia', isSolana: false },
  { label: 'Optimism Sepolia', value: 'Optimism_Sepolia', isSolana: false },
  { label: 'Polygon Amoy', value: 'Polygon_Amoy_Testnet', isSolana: false },
  { label: 'Avalanche Fuji', value: 'Avalanche_Fuji', isSolana: false },
  { label: 'Unichain Sepolia', value: 'Unichain_Sepolia', isSolana: false },
  { label: 'Solana Devnet', value: 'Solana_Devnet', isSolana: true },
];

/** Human-readable labels for CCTP bridge steps */
export const BRIDGE_STEP_LABELS: Record<string, string> = {
  approve: 'Approve USDC spending',
  burn: 'Burn USDC on source chain',
  fetchAttestation: 'Fetch attestation from Circle',
  mint: 'Mint USDC on Arc Testnet',
};
