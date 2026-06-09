'use client';

import { useState } from 'react';
import { Building, Users, Shield, Palette, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const settingsTabs = [
  { key: 'business', label: 'Business', icon: Building },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'branding', label: 'Branding', icon: Palette },
] as const;

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('business');
  const [businessName, setBusinessName] = useState('Acme Corp');
  const [businessEmail, setBusinessEmail] = useState('admin@acme.com');
  const [businessUrl, setBusinessUrl] = useState('https://acme.com');
  const [supportEmail, setSupportEmail] = useState('support@acme.com');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [logoUrl, setLogoUrl] = useState('');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="flex gap-6">
        {/* Settings nav */}
        <div className="w-48 space-y-0.5">
          {settingsTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Settings content */}
        <div className="flex-1 max-w-2xl">
          {/* Business */}
          {activeTab === 'business' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Business Information</h2>
              <p className="text-sm text-gray-500 mb-6">Your business details shown on checkout and receipts</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Business name</label>
                  <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact email</label>
                  <input type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Website URL</label>
                  <input value={businessUrl} onChange={e => setBusinessUrl(e.target.value)} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Support email</label>
                  <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button onClick={() => toast('Settings saved')} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Save size={14} /> Save changes
                </button>
              </div>
            </div>
          )}

          {/* Team */}
          {activeTab === 'team' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Team Members</h2>
              <p className="text-sm text-gray-500 mb-6">Manage access to your dashboard</p>
              <div className="space-y-3 mb-4">
                {[
                  { name: 'Admin User', email: 'admin@acme.com', role: 'Owner' },
                  { name: 'Finance Team', email: 'finance@acme.com', role: 'Admin' },
                  { name: 'Support Agent', email: 'support@acme.com', role: 'Viewer' },
                ].map((member) => (
                  <div key={member.email} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                      {member.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.email}</div>
                    </div>
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                      member.role === 'Owner' ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : member.role === 'Admin' ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {member.role}
                    </span>
                    {member.role !== 'Owner' && (
                      <button className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Plus size={14} /> Invite member
              </button>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account</p>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">2FA Status</p>
                    <p className="text-xs text-gray-500">{twoFAEnabled ? 'Enabled - Using authenticator app' : 'Not enabled'}</p>
                  </div>
                  <button
                    onClick={() => { setTwoFAEnabled(!twoFAEnabled); toast(twoFAEnabled ? '2FA disabled' : '2FA enabled'); }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${
                      twoFAEnabled ? 'text-red-600 border border-red-200 hover:bg-red-50' : 'text-white bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {twoFAEnabled ? 'Disable' : 'Enable 2FA'}
                  </button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Password</h2>
                <p className="text-sm text-gray-500 mb-4">Change your account password</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Current password</label>
                    <input type="password" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">New password</label>
                    <input type="password" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button onClick={() => toast('Password updated')} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    Update password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Branding */}
          {activeTab === 'branding' && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Checkout Branding</h2>
              <p className="text-sm text-gray-500 mb-6">Customize the appearance of your checkout pages</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Logo URL</label>
                  <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Brand color</label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <input value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-32 px-3 py-2.5 text-sm border border-gray-200 rounded-lg font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Preview</label>
                  <div className="mt-2 p-6 border border-gray-200 rounded-xl bg-gray-50">
                    <div className="w-[280px] mx-auto bg-white rounded-xl shadow-lg p-6">
                      <div className="w-10 h-10 rounded-lg mb-3" style={{ backgroundColor: brandColor }} />
                      <div className="text-sm font-semibold mb-1">{businessName}</div>
                      <div className="text-xs text-gray-500 mb-4">Pay $50.00 USDC</div>
                      <div className="w-full h-10 rounded-lg text-white text-sm font-medium flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                        Connect Wallet
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => toast('Branding saved')} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Save size={14} /> Save changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
