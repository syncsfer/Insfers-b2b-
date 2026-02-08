'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Loader2, Eye, EyeOff, Check } from 'lucide-react';

const onboardingSteps = ['Account', 'Business', 'Wallet', 'Networks', 'Review'];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0: Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Business
  const [businessName, setBusinessName] = useState('');
  const [businessUrl, setBusinessUrl] = useState('');

  // Step 2: Wallet
  const [walletAddress, setWalletAddress] = useState('');

  // Step 3: Networks
  const [selectedNetworks, setSelectedNetworks] = useState(['base']);

  const networks = [
    { id: 'base', name: 'Base', desc: '~2s confirmation, $0.001 gas' },
    { id: 'ethereum', name: 'Ethereum', desc: '~12s confirmation, $0.50-$5 gas' },
    { id: 'polygon', name: 'Polygon', desc: '~2s confirmation, $0.01 gas' },
    { id: 'arbitrum', name: 'Arbitrum', desc: '~0.25s confirmation, $0.01 gas' },
    { id: 'optimism', name: 'Optimism', desc: '~2s confirmation, $0.01 gas' },
  ];

  const canProgress = () => {
    if (step === 0) return email && password && password.length >= 8;
    if (step === 1) return businessName;
    if (step === 2) return walletAddress;
    if (step === 3) return selectedNetworks.length > 0;
    return true;
  };

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Chain Payments</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-1 mb-8">
            {onboardingSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium ${i === step ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
                {i < onboardingSteps.length - 1 && <div className="w-4 h-0.5 bg-gray-200 mx-0.5" />}
              </div>
            ))}
          </div>

          {/* Step 0: Account */}
          {step === 0 && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
              <p className="text-sm text-gray-500 mb-6">Start accepting on-chain payments</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" className="w-full mt-1 px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 mt-0.5">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && password.length < 8 && <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>}
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-gray-500">
                Already have an account? <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">Sign in</Link>
              </p>
            </div>
          )}

          {/* Step 1: Business */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Business details</h1>
              <p className="text-sm text-gray-500 mb-6">This information appears on your checkout and receipts</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Business name</label>
                  <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Acme Corp" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Website URL (optional)</label>
                  <input value={businessUrl} onChange={e => setBusinessUrl(e.target.value)} placeholder="https://acme.com" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Wallet */}
          {step === 2 && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Settlement wallet</h1>
              <p className="text-sm text-gray-500 mb-6">Where should we send your payments? You can change this later.</p>
              <div>
                <label className="text-sm font-medium text-gray-700">Wallet address</label>
                <input value={walletAddress} onChange={e => setWalletAddress(e.target.value)} placeholder="0x..." className="w-full mt-1 px-3 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-1">Enter a wallet address you control (not an exchange address)</p>
              </div>
              <button
                onClick={() => setWalletAddress('0x7777777777777777777777777777777777777777')}
                className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                Connect wallet instead
              </button>
            </div>
          )}

          {/* Step 3: Networks */}
          {step === 3 && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Select networks</h1>
              <p className="text-sm text-gray-500 mb-6">Choose which chains to accept payments on</p>
              <div className="space-y-2">
                {networks.map(n => (
                  <label
                    key={n.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                      selectedNetworks.includes(n.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedNetworks.includes(n.id)}
                      onChange={() => setSelectedNetworks(prev =>
                        prev.includes(n.id) ? prev.filter(x => x !== n.id) : [...prev, n.id]
                      )}
                      className="rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{n.name}</div>
                      <div className="text-xs text-gray-500">{n.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Review & finish</h1>
              <p className="text-sm text-gray-500 mb-6">Everything looks good? You can always change these later.</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span className="text-gray-900">{email}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Business</span><span className="text-gray-900">{businessName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Wallet</span><span className="text-gray-900 font-mono text-xs">{walletAddress ? `${walletAddress.slice(0, 10)}...` : '-'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Networks</span><span className="text-gray-900">{selectedNetworks.join(', ')}</span></div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                Back
              </button>
            ) : <div />}
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProgress()}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Launch dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
