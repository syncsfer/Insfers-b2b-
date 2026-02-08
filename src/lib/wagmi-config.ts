import { http, createConfig } from 'wagmi';
import { base, mainnet, polygon, arbitrum, optimism } from 'wagmi/chains';
import { defineChain } from 'viem';

// ---------------------------------------------------------------------------
// Arc Testnet -- Custom Chain Definition
// ---------------------------------------------------------------------------
// Arc Testnet is the primary development chain for Chain Payments.
// USDC is the native gas token (6 decimals).
// ---------------------------------------------------------------------------

export const arcTestnet = defineChain({
  id: 1637,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: 'https://testnet.arcscan.app',
    },
  },
  testnet: true,
});

// ---------------------------------------------------------------------------
// Wagmi Configuration
// ---------------------------------------------------------------------------
// Defines the supported chains and their HTTP transports.
// In production, replace public RPC URLs with dedicated provider endpoints
// (Alchemy, Infura, QuickNode, etc.) for reliability and rate-limit headroom.
// ---------------------------------------------------------------------------

export const config = createConfig({
  chains: [arcTestnet, base, mainnet, polygon, arbitrum, optimism],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
    [base.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  },
});

// ---------------------------------------------------------------------------
// Supported chain metadata (for UI display)
// ---------------------------------------------------------------------------

export const SUPPORTED_CHAINS = [
  {
    id: arcTestnet.id,
    name: 'Arc Testnet',
    shortName: 'arc',
    isTestnet: true,
  },
  {
    id: base.id,
    name: 'Base',
    shortName: 'base',
    isTestnet: false,
  },
  {
    id: mainnet.id,
    name: 'Ethereum',
    shortName: 'ethereum',
    isTestnet: false,
  },
  {
    id: polygon.id,
    name: 'Polygon',
    shortName: 'polygon',
    isTestnet: false,
  },
  {
    id: arbitrum.id,
    name: 'Arbitrum',
    shortName: 'arbitrum',
    isTestnet: false,
  },
  {
    id: optimism.id,
    name: 'Optimism',
    shortName: 'optimism',
    isTestnet: false,
  },
] as const;

// Re-export chain objects for convenient access
export { base, mainnet, polygon, arbitrum, optimism };
