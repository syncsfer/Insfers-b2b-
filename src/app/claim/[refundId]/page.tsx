'use client';

import { useState } from 'react';
import { Wallet, Loader2, Check, AlertTriangle, Info, ExternalLink, Copy } from 'lucide-react';
import { formatUSDC, truncateAddress, getExplorerUrl } from '@/lib/utils';

type ClaimState = 'not_connected' | 'connected' | 'claiming' | 'claimed' | 'expired' | 'already_claimed';

export default function ClaimRefundPage() {
  const [state, setState] = useState<ClaimState>('not_connected');
  const [connectedWallet, setConnectedWallet] = useState('');
  const [claimToAddress, setClaimToAddress] = useState('');
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);

  const refundAmount = 5000;
  const merchantName = 'Acme Corp';
  const expiresAt = 'Feb 9, 2026 2:34 PM';
  const claimedBy = '0x5678abcdef1234567890abcdef1234567890abcd';
  const txHash = '0xabc123def456789abc123def456789abc123def456789abc123def456789abcd';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold">A</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Refund from {merchantName}</h1>
        </div>

        {/* Amount */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-gray-900">{formatUSDC(refundAmount)}</div>
          <div className="text-sm text-gray-500 mt-1">USDC</div>
        </div>

        {/* State: Not Connected */}
        {state === 'not_connected' && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Claim before {expiresAt}</p>
            <p className="text-sm text-gray-500 mb-6">Connect your wallet to claim this refund</p>
            <button
              onClick={() => { setConnectedWallet('0x5678abcdef1234567890abcdef1234567890abcd'); setState('connected'); }}
              className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Wallet size={16} /> Connect Wallet
            </button>
            <div className="mt-4 flex justify-center gap-4">
              {['MetaMask', 'WalletConnect', 'Coinbase'].map(w => (
                <span key={w} className="text-[10px] text-gray-400">{w}</span>
              ))}
            </div>
          </div>
        )}

        {/* State: Connected */}
        {state === 'connected' && (
          <div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Connected wallet</p>
              <p className="text-sm font-mono text-gray-900">{truncateAddress(connectedWallet)}</p>
            </div>

            {!useDifferentAddress ? (
              <>
                <button
                  onClick={() => { setState('claiming'); setTimeout(() => setState('claimed'), 2500); }}
                  className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 mb-3"
                >
                  Claim to this wallet
                </button>
                <button
                  onClick={() => setUseDifferentAddress(true)}
                  className="w-full py-3 text-gray-600 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Claim to different address
                </button>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">Claim to address</label>
                  <input
                    value={claimToAddress}
                    onChange={e => setClaimToAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {claimToAddress && (
                    <p className="text-xs text-amber-600 mt-1">You will sign a message to authorize claim to {truncateAddress(claimToAddress)}</p>
                  )}
                </div>
                <button
                  onClick={() => { setState('claiming'); setTimeout(() => setState('claimed'), 2500); }}
                  disabled={!claimToAddress}
                  className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-3"
                >
                  Claim Refund
                </button>
                <button
                  onClick={() => setUseDifferentAddress(false)}
                  className="w-full py-3 text-gray-500 text-sm font-medium hover:text-gray-700"
                >
                  Back
                </button>
              </>
            )}
          </div>
        )}

        {/* State: Claiming */}
        {state === 'claiming' && (
          <div className="text-center py-4">
            <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Claiming refund...</h3>
            <p className="text-sm text-gray-500">Awaiting wallet signature</p>
          </div>
        )}

        {/* State: Claimed */}
        {state === 'claimed' && (
          <div className="text-center py-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Refund claimed!</h3>
            <p className="text-sm text-gray-500 mb-1">{formatUSDC(refundAmount)} USDC sent to</p>
            <p className="text-sm font-mono text-gray-700 mb-4">{truncateAddress(connectedWallet)}</p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
              <span className="font-mono">{truncateAddress(txHash)}</span>
              <button onClick={() => navigator.clipboard.writeText(txHash)} className="hover:text-gray-600"><Copy size={11} /></button>
              <a href={getExplorerUrl('base', txHash)} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600"><ExternalLink size={11} /></a>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
              View receipt
            </button>
          </div>
        )}

        {/* State: Expired */}
        {state === 'expired' && (
          <div className="text-center py-4">
            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">This refund link has expired</h3>
            <p className="text-sm text-gray-500 mb-4">Contact {merchantName} for assistance</p>
            <a href="mailto:support@acme.com" className="text-sm text-blue-600 font-medium hover:text-blue-700">
              support@acme.com
            </a>
          </div>
        )}

        {/* State: Already Claimed */}
        {state === 'already_claimed' && (
          <div className="text-center py-4">
            <Info size={32} className="mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">This refund was already claimed</h3>
            <p className="text-sm text-gray-500 mb-1">Claimed on Feb 8, 2026 by</p>
            <p className="text-sm font-mono text-gray-700">{truncateAddress(claimedBy)}</p>
          </div>
        )}

      </div>
    </div>
  );
}
