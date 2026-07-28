'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, AlertTriangle, Loader2, Check, X, ExternalLink, Copy, ChevronDown, ShieldCheck, Mail } from 'lucide-react';
import { ChainBadge } from '@/components/ui/chain-badge';
import { formatUSDC, truncateAddress, getExplorerUrl } from '@/lib/utils';
import type { CheckoutState, Chain } from '@/types';

const steps = ['Connect', 'Approve', 'Pay'];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            i < currentStep ? 'bg-green-500 text-white' :
            i === currentStep ? 'bg-blue-600 text-white' :
            'bg-gray-200 text-gray-500'
          }`}>
            {i < currentStep ? <Check size={14} /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:inline ${
            i === currentStep ? 'text-blue-600' : i < currentStep ? 'text-green-600' : 'text-gray-400'
          }`}>
            {label}
          </span>
          {i < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
        </div>
      ))}
    </div>
  );
}

function WalletButton({ name, color, onClick }: { name: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full sm:w-60 h-14 flex items-center gap-3 px-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold`} style={{ backgroundColor: color }}>
        {name[0]}
      </div>
      <span className="text-sm font-medium text-gray-900">{name}</span>
    </button>
  );
}

export default function CheckoutPage() {
  const [state, setState] = useState<CheckoutState>('not_connected');
  const [connectedWallet, setConnectedWallet] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const chain: Chain = 'base';
  const amount = 5000;
  const fee = 2;
  const total = amount + fee;
  const merchantName = 'Acme Corp';
  const txHash = '0xabc123def456789abc123def456789abc123def456789abc123def456789abcd';
  const receiptUrl = '/r/rcpt_demo';

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const currentStep = state === 'not_connected' || state === 'connecting' ? 0 :
    state === 'wrong_chain' || state === 'checking_balance' || state === 'insufficient_usdc' ||
    state === 'insufficient_gas' || state === 'ready_for_approval' || state === 'approval_pending' ||
    state === 'approval_failed' ? 1 :
    2;

  const simulateFlow = (walletName: string) => {
    setState('connecting');
    setTimeout(() => {
      setConnectedWallet('0x1a2b3c4d5e6f7890abcdef1234567890abcdef12');
      setState('checking_balance');
      setTimeout(() => {
        setState('ready_for_approval');
      }, 1000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Left panel: Order summary */}
          <div className="sm:w-[40%] bg-gray-50 p-6 border-b sm:border-b-0 sm:border-r border-gray-200">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mb-3">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h2 className="text-base font-bold text-gray-900">{merchantName}</h2>
            <p className="text-sm text-gray-500 mt-1">One-time purchase</p>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="text-gray-900">{formatUSDC(amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Network fee</span><span className="text-gray-900">~{formatUSDC(fee)}</span></div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatUSDC(total)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <ChainBadge chain={chain} />
              <span className="text-xs text-gray-500">Network</span>
            </div>
          </div>

          {/* Right panel: Payment flow */}
          <div className="sm:w-[60%] p-6">
            <StepIndicator currentStep={currentStep} />

            {/* State: Not Connected */}
            {state === 'not_connected' && (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Connect your wallet</h3>
                <p className="text-sm text-gray-500 mb-6">Choose a wallet to pay with USDC</p>
                <div className="flex flex-col items-center gap-3">
                  <WalletButton name="MetaMask" color="#E2761B" onClick={() => simulateFlow('MetaMask')} />
                  <WalletButton name="WalletConnect" color="#3B99FC" onClick={() => simulateFlow('WalletConnect')} />
                  <WalletButton name="Coinbase Wallet" color="#0052FF" onClick={() => simulateFlow('Coinbase')} />
                </div>
              </div>
            )}

            {/* State: Connecting */}
            {state === 'connecting' && (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Connecting...</h3>
                <p className="text-sm text-gray-500">Approve connection in your wallet</p>
              </div>
            )}

            {/* State: Wrong Chain */}
            {state === 'wrong_chain' && (
              <div className="text-center py-4">
                <AlertTriangle size={32} className="mx-auto text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Wrong network</h3>
                <p className="text-sm text-gray-500 mb-4">
                  You&apos;re connected to Ethereum. Please switch to Base.
                </p>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full border border-amber-200">Ethereum</span>
                  <span className="text-gray-400">→</span>
                  <ChainBadge chain="base" />
                </div>
                <button onClick={() => setState('checking_balance')} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  Switch to Base
                </button>
                <button onClick={() => setState('not_connected')} className="block mx-auto mt-3 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            )}

            {/* State: Checking Balance */}
            {state === 'checking_balance' && (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-sm text-gray-500">Checking USDC balance...</p>
              </div>
            )}

            {/* State: Insufficient USDC */}
            {state === 'insufficient_usdc' && (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <X size={20} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Insufficient USDC</h3>
                <p className="text-sm text-gray-500 mb-2">
                  You need {formatUSDC(total)} USDC but only have $10.00
                </p>
                <p className="text-sm text-gray-500 mb-6">Amount needed: $40.02</p>
                <button className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 mb-3">
                  Get USDC
                </button>
                <button onClick={() => setState('not_connected')} className="block mx-auto text-sm text-gray-500 hover:text-gray-700">
                  Use different wallet
                </button>
              </div>
            )}

            {/* State: Insufficient Gas */}
            {state === 'insufficient_gas' && (
              <div className="text-center py-4">
                <AlertTriangle size={32} className="mx-auto text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Insufficient ETH for gas</h3>
                <p className="text-sm text-gray-500 mb-6">You need ~0.001 ETH to pay transaction fees</p>
                <button className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 mb-3">
                  Get ETH
                </button>
                <button onClick={() => setState('not_connected')} className="block mx-auto text-sm text-gray-500 hover:text-gray-700">
                  Use different wallet
                </button>
              </div>
            )}

            {/* State: Ready for Approval */}
            {state === 'ready_for_approval' && (
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Approve USDC spending</h3>
                <p className="text-sm text-gray-500 mb-4">
                  One-time approval to allow Chain Payments to move your USDC. This is a standard security step.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
                  <p className="text-xs text-blue-700">You&apos;ll approve up to {formatUSDC(total)}. This is the maximum that can be spent.</p>
                </div>
                <p className="text-xs text-gray-400 mb-4">Estimated gas: ~$0.01</p>
                <button
                  onClick={() => {
                    setState('approval_pending');
                    setTimeout(() => setState('ready_to_pay'), 2000);
                  }}
                  className="w-full px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Approve USDC
                </button>
              </div>
            )}

            {/* State: Approval Pending */}
            {state === 'approval_pending' && (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Approving...</h3>
                <p className="text-sm text-gray-500">Confirm in your wallet</p>
              </div>
            )}

            {/* State: Approval Failed */}
            {state === 'approval_failed' && (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <X size={20} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Approval failed</h3>
                <p className="text-sm text-gray-500 mb-6">User rejected transaction</p>
                <button onClick={() => setState('ready_for_approval')} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 mb-3">
                  Try again
                </button>
                <button onClick={() => setState('not_connected')} className="block mx-auto text-sm text-gray-500 hover:text-gray-700">
                  Use different wallet
                </button>
              </div>
            )}

            {/* State: Ready to Pay */}
            {state === 'ready_to_pay' && (
              <div className="py-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Complete payment</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-medium">{formatUSDC(amount)} USDC</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Network fee</span><span>~{formatUSDC(fee)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold">{formatUSDC(total)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Recipient</span><span className="font-medium">{merchantName}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Network</span><ChainBadge chain={chain} /></div>
                </div>

                {/* Email for receipt */}
                <div className="mb-5">
                  <label htmlFor="receipt-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email for receipt <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="receipt-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {emailTouched && email && !emailValid ? (
                    <p className="text-xs text-red-500 mt-1">Enter a valid email address</p>
                  ) : (
                    <p className="text-[11px] text-gray-400 mt-1">
                      We&apos;ll email you a receipt with the transaction details.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setState('payment_pending');
                    setTimeout(() => setState('payment_succeeded'), 3000);
                  }}
                  disabled={Boolean(email) && !emailValid}
                  className="w-full px-6 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay {formatUSDC(total)}
                </button>
              </div>
            )}

            {/* State: Payment Pending */}
            {state === 'payment_pending' && (
              <div className="text-center py-8">
                <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Processing payment...</h3>
                <p className="text-sm text-gray-500 mb-3">Awaiting confirmation...</p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <span className="font-mono">{truncateAddress(txHash)}</span>
                  <a href={getExplorerUrl(chain, txHash)} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">
                    <ExternalLink size={11} />
                  </a>
                </div>
                <p className="text-xs text-gray-400 mt-2">~2 seconds on Base</p>
              </div>
            )}

            {/* State: Payment Succeeded */}
            {state === 'payment_succeeded' && (
              <div className="text-center py-4 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment successful!</h3>
                <p className="text-2xl font-bold text-gray-900 mb-3">{formatUSDC(amount)} USDC</p>
                <p className="text-sm text-gray-500 mb-1">to {merchantName}</p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
                  <span className="font-mono">{truncateAddress(txHash)}</span>
                  <button onClick={() => navigator.clipboard.writeText(txHash)} className="hover:text-gray-600">
                    <Copy size={11} />
                  </button>
                  <a href={getExplorerUrl(chain, txHash)} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">
                    <ExternalLink size={11} />
                  </a>
                </div>
                {/* Receipt delivery */}
                {emailValid ? (
                  <div className="mb-5 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2.5 text-left">
                    <Mail size={15} className="text-green-600 shrink-0" />
                    <p className="text-xs text-green-800">
                      Receipt sent to <span className="font-semibold">{email}</span>
                    </p>
                  </div>
                ) : (
                  <div className="mb-5 text-left">
                    <label htmlFor="post-pay-email" className="block text-xs font-medium text-gray-600 mb-1.5">
                      Want a receipt by email?
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          id="post-pay-email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        disabled={!emailValid}
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  <Link
                    href={receiptUrl}
                    className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    View receipt
                  </Link>
                  <button
                    onClick={() => window.open(receiptUrl, '_blank')}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Download receipt
                  </button>
                </div>
              </div>
            )}

            {/* State: Payment Failed */}
            {state === 'payment_failed' && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <X size={28} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment failed</h3>
                <p className="text-sm text-gray-500 mb-6">Transaction reverted: Insufficient balance</p>
                <button onClick={() => setState('ready_to_pay')} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 mb-3">
                  Try again
                </button>
                <button className="block mx-auto text-sm text-gray-500 hover:text-gray-700">
                  Contact support
                </button>
              </div>
            )}

            {/* Connected wallet indicator */}
            {connectedWallet && state !== 'not_connected' && state !== 'connecting' && state !== 'payment_succeeded' && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-mono text-gray-400">{truncateAddress(connectedWallet)}</span>
                </div>
                <button onClick={() => { setState('not_connected'); setConnectedWallet(''); }} className="text-xs text-gray-400 hover:text-gray-600">
                  Disconnect
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <Link href="/security" className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-500 transition-colors">
                <ShieldCheck size={10} /> Secured by Chain Payments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
