'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building, Users, Shield, Palette, Save, Mail, Eye, Coins, Send } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { mockReceiptSettings } from '@/lib/mock-data';
import { TeamSection } from './team-section';
import { CurrenciesSection } from './currencies-section';
import { EmailsSection } from './emails-section';

const settingsTabs = [
  { key: 'business', label: 'Business', icon: Building },
  { key: 'currencies', label: 'Currencies', icon: Coins },
  { key: 'receipts', label: 'Receipts', icon: Mail },
  { key: 'emails', label: 'Emails', icon: Send },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'branding', label: 'Branding', icon: Palette },
] as const;

export default function SettingsPage() {
  return (
    // useSearchParams needs a Suspense boundary to keep the route statically
    // renderable rather than forcing the whole page dynamic.
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}

const TAB_KEYS = settingsTabs.map(t => t.key) as readonly string[];

function SettingsContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Other pages deep-link here, e.g. /dashboard/settings?tab=currencies.
  const requested = searchParams.get('tab');
  const [override, setOverride] = useState<string | null>(null);
  const activeTab = override ?? (requested && TAB_KEYS.includes(requested) ? requested : 'business');
  const setActiveTab = setOverride;
  const [businessName, setBusinessName] = useState('Acme Corp');
  const [businessEmail, setBusinessEmail] = useState('admin@acme.com');
  const [businessUrl, setBusinessUrl] = useState('https://acme.com');
  const [supportEmail, setSupportEmail] = useState('support@acme.com');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [logoUrl, setLogoUrl] = useState('');

  // Receipt email settings
  const [autoSend, setAutoSend] = useState(mockReceiptSettings.auto_send);
  const [fromName, setFromName] = useState(mockReceiptSettings.from_name);
  const [replyTo, setReplyTo] = useState(mockReceiptSettings.reply_to);
  const [bccEmail, setBccEmail] = useState(mockReceiptSettings.bcc_email ?? '');
  const [subjectTemplate, setSubjectTemplate] = useState(mockReceiptSettings.subject_template);
  const [footerMessage, setFooterMessage] = useState(mockReceiptSettings.footer_message);
  const [includeTxLink, setIncludeTxLink] = useState(mockReceiptSettings.include_tx_link);
  const [attachPdf, setAttachPdf] = useState(mockReceiptSettings.attach_pdf);

  const previewSubject = subjectTemplate
    .replace(/\{\{\s*merchant\s*\}\}/g, fromName)
    .replace(/\{\{\s*amount\s*\}\}/g, '$50.00')
    .replace(/\{\{\s*receipt_id\s*\}\}/g, 'rcpt_001abc');

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
        <div className={`flex-1 ${
          activeTab === 'team' ? 'max-w-4xl'
            : activeTab === 'emails' ? 'max-w-5xl'
            : activeTab === 'currencies' ? 'max-w-3xl'
            : 'max-w-2xl'
        }`}>
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

          {/* Receipts */}
          {activeTab === 'receipts' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Email Receipts</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Automatically email customers a receipt when their payment succeeds.
                </p>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Send receipts automatically</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {autoSend
                        ? 'Receipts are sent as soon as a payment is confirmed on-chain.'
                        : 'Receipts must be sent manually from each payment.'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setAutoSend(!autoSend); toast(autoSend ? 'Auto-send disabled' : 'Auto-send enabled'); }}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${autoSend ? 'bg-blue-600' : 'bg-gray-200'}`}
                    aria-label="Toggle automatic receipts"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoSend ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">From name</label>
                      <input
                        value={fromName}
                        onChange={e => setFromName(e.target.value)}
                        className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Shown as the sender in the customer&apos;s inbox.</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Reply-to address</label>
                      <input
                        type="email"
                        value={replyTo}
                        onChange={e => setReplyTo(e.target.value)}
                        className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">Where customer replies are delivered.</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      BCC address <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={bccEmail}
                      onChange={e => setBccEmail(e.target.value)}
                      placeholder="receipts@yourcompany.com"
                      className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Keep a copy of every receipt for your records.</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Subject line</label>
                    <input
                      value={subjectTemplate}
                      onChange={e => setSubjectTemplate(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Variables: <code className="font-mono text-gray-500">{'{{merchant}}'}</code>,{' '}
                      <code className="font-mono text-gray-500">{'{{amount}}'}</code>,{' '}
                      <code className="font-mono text-gray-500">{'{{receipt_id}}'}</code>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Footer message</label>
                    <textarea
                      value={footerMessage}
                      onChange={e => setFooterMessage(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Include on-chain transaction link</p>
                        <p className="text-xs text-gray-500">Lets customers verify the payment on a block explorer.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeTxLink}
                        onChange={e => setIncludeTxLink(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ml-4 shrink-0"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Attach PDF receipt</p>
                        <p className="text-xs text-gray-500">Adds a printable PDF copy to the email.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={attachPdf}
                        onChange={e => setAttachPdf(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ml-4 shrink-0"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => toast('Receipt settings saved')}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      <Save size={14} /> Save changes
                    </button>
                    <button
                      onClick={() => toast('Test receipt sent to ' + businessEmail)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <Mail size={14} /> Send test receipt
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Eye size={16} className="text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                </div>
                <p className="text-sm text-gray-500 mb-5">How the receipt email will appear to your customer.</p>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 space-y-1">
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-400 w-14 shrink-0">From</span>
                      <span className="text-gray-900 font-medium">{fromName} &lt;{replyTo}&gt;</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-400 w-14 shrink-0">Subject</span>
                      <span className="text-gray-900 font-medium">{previewSubject}</span>
                    </div>
                  </div>

                  <div className="p-6 bg-white">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Receipt</p>
                    <p className="text-base font-bold text-gray-900 mt-0.5">{fromName}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-4">$50.00</p>
                    <p className="text-xs text-gray-500 mt-1">Paid on Jul 28, 2026, 2:32 PM</p>

                    <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount</span>
                        <span className="text-gray-900 font-semibold">$50.00 USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Network</span>
                        <span className="text-gray-900">Base</span>
                      </div>
                      {includeTxLink && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Transaction</span>
                          <span className="text-blue-600 font-mono">0xabc1...bcd4</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 h-10 rounded-lg text-white text-xs font-semibold flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                      View full receipt
                    </div>

                    {footerMessage && (
                      <p className="text-[11px] text-gray-500 mt-4 pt-4 border-t border-gray-100">{footerMessage}</p>
                    )}
                    {attachPdf && (
                      <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">PDF</span>
                        <span className="text-[11px] text-gray-600">receipt-rcpt_001abc.pdf</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team */}
          {activeTab === 'currencies' && <CurrenciesSection />}

          {activeTab === 'emails' && (
            <EmailsSection
              brand={{
                merchantName: businessName,
                brandColor: brandColor,
                logoUrl: logoUrl || null,
                supportEmail: supportEmail || null,
                footerMessage: footerMessage || null,
                postalAddress: null,
              }}
            />
          )}

          {activeTab === 'team' && <TeamSection />}

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
