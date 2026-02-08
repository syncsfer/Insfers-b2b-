'use client';

import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  SUPPORTED_SOURCE_CHAINS,
  BRIDGE_STEP_LABELS,
  type SourceChain,
  type BridgeStep,
} from '@/lib/bridge';

type BridgeStatus = 'idle' | 'bridging' | 'success' | 'error';

export default function BridgePage() {
  const [sourceChain, setSourceChain] = useState<SourceChain>('Ethereum_Sepolia');
  const [amount, setAmount] = useState('');
  const [sourceAddress, setSourceAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [steps, setSteps] = useState<BridgeStep[]>([]);
  const [error, setError] = useState('');

  const selectedChain = SUPPORTED_SOURCE_CHAINS.find((c) => c.value === sourceChain);

  async function handleBridge() {
    if (!amount || !sourceAddress || !destinationAddress) return;

    setStatus('bridging');
    setSteps([
      { name: 'approve', state: 'pending' },
      { name: 'burn', state: 'pending' },
      { name: 'fetchAttestation', state: 'pending' },
      { name: 'mint', state: 'pending' },
    ]);
    setError('');

    try {
      const res = await fetch('/api/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceChain, amount, sourceAddress, destinationAddress }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus('error');
        setError(data.error || 'Bridge transfer failed');
        return;
      }

      setSteps(data.steps || []);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Network error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bridge USDC</h1>
        <p className="text-sm text-gray-500 mt-1">
          Transfer USDC to Arc Testnet via Circle CCTP (Cross-Chain Transfer Protocol)
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">How CCTP bridging works</p>
          <p className="mt-1 text-blue-700">
            CCTP burns USDC on the source chain and mints an equivalent amount on Arc Testnet.
            This is a native, permissionless mechanism — no wrapped tokens or liquidity pools required.
            The process takes 4 steps: Approve, Burn, Fetch Attestation, and Mint.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bridge Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Transfer Details</h2>

          <div className="space-y-4">
            {/* Source Chain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Chain</label>
              <select
                value={sourceChain}
                onChange={(e) => setSourceChain(e.target.value as SourceChain)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={status === 'bridging'}
              >
                {SUPPORTED_SOURCE_CHAINS.map((chain) => (
                  <option key={chain.value} value={chain.value}>
                    {chain.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDC)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-16"
                  disabled={status === 'bridging'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                  USDC
                </span>
              </div>
            </div>

            {/* Source Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Wallet Address
                {selectedChain?.isSolana && (
                  <span className="text-xs text-gray-400 ml-1">(Solana)</span>
                )}
              </label>
              <input
                type="text"
                value={sourceAddress}
                onChange={(e) => setSourceAddress(e.target.value)}
                placeholder={selectedChain?.isSolana ? 'DGJ1oZtR7...' : '0x...'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={status === 'bridging'}
              />
              <p className="text-xs text-gray-400 mt-1">Circle dev-controlled wallet on source chain</p>
            </div>

            {/* Destination Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Wallet Address
                <span className="text-xs text-gray-400 ml-1">(Arc Testnet)</span>
              </label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={status === 'bridging'}
              />
              <p className="text-xs text-gray-400 mt-1">EVM address on Arc Testnet</p>
            </div>

            {/* Transfer visualization */}
            <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 rounded-lg">
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-500 mb-0.5">From</p>
                <p className="text-sm font-medium text-gray-900">{selectedChain?.label}</p>
              </div>
              <ArrowRight size={20} className="text-blue-500 shrink-0" />
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-500 mb-0.5">To</p>
                <p className="text-sm font-medium text-gray-900">Arc Testnet</p>
              </div>
            </div>

            {/* Bridge button */}
            <button
              onClick={handleBridge}
              disabled={!amount || !sourceAddress || !destinationAddress || status === 'bridging'}
              className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {status === 'bridging' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Bridging USDC...
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  Bridge {amount ? `${amount} USDC` : 'USDC'} to Arc Testnet
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bridge Progress / Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Bridge Steps (CCTP)</h2>

          {status === 'idle' ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <ArrowRight size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Configure your transfer and click Bridge to begin</p>
              <p className="text-xs text-gray-400 mt-2">
                The CCTP process has 4 steps: Approve → Burn → Attestation → Mint
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div
                  key={step.name}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    step.state === 'success'
                      ? 'bg-green-50 border-green-200'
                      : step.state === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Step icon */}
                  <div className="mt-0.5">
                    {step.state === 'success' ? (
                      <CheckCircle2 size={18} className="text-green-600" />
                    ) : step.state === 'error' ? (
                      <XCircle size={18} className="text-red-600" />
                    ) : status === 'bridging' ? (
                      <Loader2 size={18} className="text-blue-500 animate-spin" />
                    ) : (
                      <Clock size={18} className="text-gray-400" />
                    )}
                  </div>

                  {/* Step details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">Step {i + 1}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {BRIDGE_STEP_LABELS[step.name] || step.name}
                    </p>
                    {step.txHash && (
                      <p className="text-xs font-mono text-gray-500 mt-1 truncate">{step.txHash}</p>
                    )}
                    {step.explorerUrl && (
                      <a
                        href={step.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        View on Explorer <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {/* Success message */}
              {status === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle2 size={24} className="text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">Bridge transfer complete!</p>
                  <p className="text-xs text-green-600 mt-1">
                    {amount} USDC has been minted on Arc Testnet
                  </p>
                </div>
              )}

              {/* Error message */}
              {status === 'error' && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <XCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Bridge transfer failed</p>
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prerequisites */}
          <div className="mt-6 pt-5 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Prerequisites</h3>
            <ul className="space-y-2 text-xs text-gray-500">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                Circle Developer Console account with API key
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                Dev-controlled wallets created via Circle Wallets SDK
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                Testnet USDC from{' '}
                <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Circle Faucet
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                Native gas tokens from{' '}
                <a href="https://console.circle.com/faucet" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Console Faucet
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                <code className="bg-gray-100 px-1 rounded">CIRCLE_API_KEY</code> and{' '}
                <code className="bg-gray-100 px-1 rounded">CIRCLE_ENTITY_SECRET</code> set in <code className="bg-gray-100 px-1 rounded">.env</code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
