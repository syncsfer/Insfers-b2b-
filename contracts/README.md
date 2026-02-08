# Chain Payments Platform - Smart Contracts

Solidity smart contracts for the Chain Payments Platform, built with [Foundry](https://getfoundry.sh/) and targeting [Arc Testnet](https://docs.arc.network).

## Contracts

| Contract | Description |
|---|---|
| `ChainPayments.sol` | Core payment processor — accepts USDC payments, tracks intents, handles direct refunds and escrow holds |
| `ClaimableRefund.sol` | Claimable refund mechanism — merchants deposit refunds, customers claim to any wallet they control |

## Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Setup

```bash
cd contracts
cp .env.example .env
# Edit .env with your private key and RPC URL
```

## Build & Test

```bash
forge build
forge test
forge test -vvv  # verbose output
```

## Deploy to Arc Testnet

```bash
source .env

# Deploy ChainPayments
forge create src/ChainPayments.sol:ChainPayments \
  --constructor-args $OWNER_ADDRESS \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Deploy ClaimableRefund
forge create src/ClaimableRefund.sol:ClaimableRefund \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

Or use the deployment script:

```bash
forge script script/Deploy.s.sol:DeployChainPayments \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Interact

```bash
# Read a payment intent
cast call $CHAIN_PAYMENTS_ADDRESS \
  "getPayment(bytes32)(uint256,address,address,uint8)" \
  $PAYMENT_ID \
  --rpc-url $ARC_TESTNET_RPC_URL

# Check claimable refund
cast call $CLAIMABLE_REFUND_ADDRESS \
  "getRefund(bytes32)(uint256,address,uint256,bool)" \
  $REFUND_ID \
  --rpc-url $ARC_TESTNET_RPC_URL
```

## Architecture

```
Payer ──USDC──> ChainPayments ──> Merchant Settlement Wallet
                     │
                     ├── Direct Refund: Merchant ──USDC──> Payer
                     │
                     └── Claimable Refund: Merchant ──USDC──> ClaimableRefund
                                                                    │
                                                              Payer claims ──> Any wallet
```

## Security

- All contracts use OpenZeppelin's ReentrancyGuard and Ownable
- Payment amounts validated on-chain
- Claimable refunds have configurable expiry (default 24h)
- Expired unclaimed refunds returnable to merchant
- Events emitted for all state changes (indexable by backend)
