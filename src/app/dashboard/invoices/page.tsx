'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Send, Eye, MoreHorizontal, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime, formatDate } from '@/lib/utils';
import { mockInvoices } from '@/lib/mock-data';
import type { Invoice } from '@/types';

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Void', value: 'void' },
];

export default function InvoicesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [createdInvoice, setCreatedInvoice] = useState<{ id: string; url: string } | null>(null);

  const handleCreate = (send: boolean) => {
    const newId = `inv_${Math.random().toString(36).slice(2, 8)}`;
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/i/${newId}`;
    setCreatedInvoice({ id: newId, url });
    toast(send ? 'Invoice created and sent' : 'Invoice saved as draft');
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreatedInvoice(null);
    setEmail('');
    setDescription('');
    setInvoiceAmount('');
    setDueDate('');
  };

  const filtered = useMemo(() => {
    if (activeTab === 'all') return mockInvoices;
    return mockInvoices.filter(inv => inv.status === activeTab);
  }, [activeTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mockInvoices.length };
    for (const inv of mockInvoices) counts[inv.status] = (counts[inv.status] || 0) + 1;
    return counts;
  }, []);

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice', header: 'Invoice', width: '140px',
      render: (inv) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">{inv.id}</div>
          <div className="text-[11px] text-gray-400">{inv.customer_email}</div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', width: '100px', render: (inv) => <StatusPill status={inv.status} size="sm" /> },
    { key: 'amount', header: 'Amount', width: '100px', align: 'right', render: (inv) => <span className="font-semibold text-gray-900">{formatUSDC(inv.amount)}</span> },
    {
      key: 'due', header: 'Due Date', width: '120px',
      render: (inv) => {
        const isOverdue = new Date(inv.due_date) < new Date() && inv.status !== 'paid' && inv.status !== 'void';
        return <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{formatDate(inv.due_date).split(',')[0]}</span>;
      },
    },
    {
      key: 'paid', header: 'Paid At', width: '120px',
      render: (inv) => inv.paid_at ? <span className="text-sm text-gray-500">{formatRelativeTime(inv.paid_at)}</span> : <span className="text-gray-300">-</span>,
    },
    {
      key: 'actions', header: '', width: '110px', align: 'right',
      render: (inv) => (
        <div className="flex gap-1 justify-end">
          <Link href={`/i/${inv.id}`} target="_blank" onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400" title="View invoice">
            <Eye size={14} />
          </Link>
          {inv.status === 'draft' && (
            <button onClick={(e) => { e.stopPropagation(); toast('Invoice sent'); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400" title="Send invoice">
              <Send size={14} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); const url = `${window.location.origin}/i/${inv.id}`; navigator.clipboard.writeText(url); toast('Invoice link copied'); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400" title="Copy link">
            <Copy size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-4 h-10 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Create invoice
        </button>
      </div>

      <div className="flex items-center gap-0 border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-5 py-3 text-sm font-medium border-b-[3px] transition-colors ${
              activeTab === tab.value ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label} ({tabCounts[tab.value] || 0})
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <DataTable columns={columns} data={filtered} keyExtractor={(inv) => inv.id} emptyMessage="No invoices found" />
      </div>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title={createdInvoice ? 'Invoice created' : 'Create Invoice'}
        footer={
          createdInvoice ? (
            <div className="flex gap-3">
              <button onClick={closeCreate} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Done</button>
              <Link href={`/i/${createdInvoice.id}`} target="_blank" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 inline-flex items-center gap-1.5">
                Open invoice <ExternalLink size={14} />
              </Link>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={closeCreate} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleCreate(false)} disabled={!email || !invoiceAmount} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Save draft</button>
              <button onClick={() => handleCreate(true)} disabled={!email || !invoiceAmount} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">Send invoice</button>
            </div>
          )
        }
      >
        {createdInvoice ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center text-center pt-2">
              <div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={22} className="text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Invoice {createdInvoice.id} created</p>
                <p className="text-xs text-gray-500 mt-1">Share this link with your customer to receive payment:</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
              <span className="text-xs font-mono text-gray-700 flex-1 truncate">{createdInvoice.url}</span>
              <button onClick={() => { navigator.clipboard.writeText(createdInvoice.url); toast('Link copied'); }} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500" title="Copy link">
                <Copy size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Customer email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Consulting services" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Amount (USDC)</label>
                <input type="number" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} placeholder="0.00" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Due date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Memo (optional)</label>
              <textarea placeholder="Thank you for your business" className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
