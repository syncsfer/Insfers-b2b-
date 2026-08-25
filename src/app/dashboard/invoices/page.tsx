'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Send, Eye, Copy, ExternalLink, CheckCircle2, Bot, Wallet, Package, Search, X } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { CoinBadge, Money } from '@/components/ui/coin-badge';
import { getStatusSummary } from '@/components/ui/status-explainer';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { mockInvoices, mockAgents, mockCatalogItems, mockCatalogCategories } from '@/lib/mock-data';
import { useCollection, newId } from '@/lib/use-collection';
import type { Invoice, InvoiceItem, Currency } from '@/types';
import { formatAmount } from '@/lib/currencies';
import { CurrencySelect, CurrencyHint } from '@/components/ui/currency-select';
import { useCurrencySettings } from '@/lib/currency-settings';
import { CategoryBadge } from '@/components/ui/category-badge';

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
  const [dueDate, setDueDate] = useState('');
  // null until picked, so the form follows the accepted default once settings hydrate.
  const [pickedCurrency, setPickedCurrency] = useState<Currency | null>(null);
  const [createdInvoice, setCreatedInvoice] = useState<{ id: string; url: string } | null>(null);

  const { items: invoices, add: addInvoice } = useCollection<Invoice>('invoices', mockInvoices);
  const { settings } = useCurrencySettings();
  const invoiceCurrency = pickedCurrency && settings.enabled.includes(pickedCurrency)
    ? pickedCurrency
    : settings.defaultCurrency;

  // Catalog-backed line items — the point of the catalog is not retyping these.
  const [lineItems, setLineItems] = useState<{ itemId: string; quantity: number }[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  const { items: catalogItems } = useCollection('catalog-items', mockCatalogItems);
  const { items: catalogCategories } = useCollection('catalog-categories', mockCatalogCategories);
  const catalogById = useMemo(() => new Map(catalogItems.map(i => [i.id, i])), [catalogItems]);
  const categoryById = useMemo(() => new Map(catalogCategories.map(c => [c.id, c])), [catalogCategories]);

  /** How many active items exist per currency — drives the currency picker. */
  const itemsPerCurrency = useMemo(() => {
    const counts: Partial<Record<Currency, number>> = {};
    for (const i of catalogItems) {
      if (i.active) counts[i.currency] = (counts[i.currency] ?? 0) + 1;
    }
    return counts;
  }, [catalogItems]);

  // Only items priced in the invoice's currency are offerable — an invoice
  // bills one currency, and mixing them would need an FX rate we don't quote.
  const catalogResults = useMemo(() => {
    const active = catalogItems.filter(i => i.active && i.currency === invoiceCurrency);
    if (!catalogSearch) return active;
    const q = catalogSearch.toLowerCase();
    return active.filter(i =>
      i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
  }, [catalogSearch, catalogItems, invoiceCurrency]);

  const addLineItem = (itemId: string) => {
    setLineItems(prev => {
      const existing = prev.find(l => l.itemId === itemId);
      if (existing) {
        return prev.map(l => l.itemId === itemId ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, { itemId, quantity: 1 }];
    });
    setCatalogOpen(false);
    setCatalogSearch('');
  };

  /**
   * Changing currency clears items priced in the old one. The catalog picker
   * only ever offers matching items, so this is the only way a mismatch can
   * arise — and dropping them is clearer than carrying dead rows that don't
   * count toward the total.
   */
  const changeCurrency = (next: Currency) => {
    setPickedCurrency(next);
    setLineItems(prev => prev.filter(l => catalogById.get(l.itemId)?.currency === next));
  };

  const lineTotal = lineItems.reduce((sum, l) => {
    const item = catalogById.get(l.itemId);
    return item && item.currency === invoiceCurrency ? sum + item.price * l.quantity : sum;
  }, 0);

  const handleCreate = (send: boolean) => {
    const id = newId('inv');
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/i/${id}`;
    const now = new Date().toISOString();

    const items: InvoiceItem[] = lineItems.flatMap(l => {
      const item = catalogById.get(l.itemId);
      if (!item || item.currency !== invoiceCurrency) return [];
      return [{
        description: item.name,
        quantity: l.quantity,
        unit_price: item.price,
        amount: item.price * l.quantity,
      }];
    });

    addInvoice({
      id,
      customer_id: '',
      customer_email: email,
      amount: lineTotal,
      currency: invoiceCurrency,
      status: send ? 'sent' : 'draft',
      due_date: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 14 * 86400_000).toISOString(),
      paid_at: null,
      payment_intent_id: null,
      items,
      memo: description || null,
      created_at: now,
      created_by: 'human',
      agent_id: null,
      paid_by: null,
      paid_by_agent_id: null,
    });

    setCreatedInvoice({ id, url });
    toast(send ? 'Invoice created and sent' : 'Invoice saved as draft');
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreatedInvoice(null);
    setEmail('');
    setDescription('');
    setDueDate('');
    setPickedCurrency(null);
    setLineItems([]);
    setCatalogSearch('');
  };

  const filtered = useMemo(() => {
    if (activeTab === 'all') return invoices;
    return invoices.filter(inv => inv.status === activeTab);
  }, [activeTab, invoices]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: invoices.length };
    for (const inv of invoices) counts[inv.status] = (counts[inv.status] || 0) + 1;
    return counts;
  }, [invoices]);

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
    { key: 'status', header: 'Status', width: '130px', render: (inv) => (
      <div>
        <StatusPill status={inv.status} size="sm" />
        <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{getStatusSummary('invoice', inv.status)}</div>
      </div>
    ) },
    { key: 'amount', header: 'Amount', width: '120px', align: 'right', render: (inv) => <span className="font-semibold text-gray-900"><Money minor={inv.amount} currency={inv.currency} showTicker={false} /></span> },
    { key: 'currency', header: 'Currency', width: '90px', render: (inv) => <CoinBadge currency={inv.currency} size="sm" /> },
    {
      key: 'due', header: 'Due Date', width: '120px',
      render: (inv) => {
        const isOverdue = new Date(inv.due_date) < new Date() && inv.status !== 'paid' && inv.status !== 'void';
        return <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{formatDate(inv.due_date).split(',')[0]}</span>;
      },
    },
    {
      key: 'created_by', header: 'Created By', width: '90px',
      render: (inv) => inv.created_by === 'agent' ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200" title={inv.agent_id ? mockAgents.find(a => a.id === inv.agent_id)?.name : 'Agent'}>
          <Bot size={9} /> Agent
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
          <Wallet size={9} /> Human
        </span>
      ),
    },
    {
      key: 'paid_by', header: 'Paid By', width: '90px',
      render: (inv) => inv.paid_by === 'agent' ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200" title={inv.paid_by_agent_id ? mockAgents.find(a => a.id === inv.paid_by_agent_id)?.name : 'Agent'}>
          <Bot size={9} /> Agent
        </span>
      ) : inv.paid_by === 'human' ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
          <Wallet size={9} /> Wallet
        </span>
      ) : (
        <span className="text-gray-300">-</span>
      ),
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
              <button onClick={() => handleCreate(false)} disabled={!email || lineItems.length === 0} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Save draft</button>
              <button onClick={() => handleCreate(true)} disabled={!email || lineItems.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">Send invoice</button>
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

            <div>
              <label className="text-sm font-medium text-gray-700">Bill in</label>
              <CurrencySelect
                value={invoiceCurrency}
                onChange={changeCurrency}
                isDisabled={(symbol) =>
                  itemsPerCurrency[symbol]
                    ? null
                    : `No active catalog items are priced in ${symbol}`}
                className="mt-1.5"
              />
              <CurrencyHint currency={invoiceCurrency} />
            </div>

            {/* Catalog line items */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Line items</label>
                <button
                  onClick={() => setCatalogOpen(!catalogOpen)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <Package size={13} /> Add from catalog
                </button>
              </div>

              {catalogOpen && (
                <div className="mb-3 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={catalogSearch}
                        onChange={e => setCatalogSearch(e.target.value)}
                        placeholder="Search catalog by name or SKU..."
                        autoFocus
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {catalogResults.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-400">
                        No {invoiceCurrency} items match
                      </p>
                    ) : catalogResults.map(item => (
                      <button
                        key={item.id}
                        onClick={() => addLineItem(item.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                            <CategoryBadge category={categoryById.get(item.category_id)} size="sm" />
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">{item.sku}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatAmount(item.price, item.currency)}
                          </div>
                          <div className="text-[10px] text-gray-400">{item.currency} · {item.unit}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {lineItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center">
                  <Package size={20} className="mx-auto text-gray-300" />
                  <p className="mt-1.5 text-sm text-gray-500">No items yet</p>
                  <p className="text-[11px] text-gray-400">
                    Pull {invoiceCurrency} items from your catalog instead of retyping prices.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {lineItems.map(({ itemId, quantity }) => {
                    const item = catalogById.get(itemId);
                    if (!item) return null;
                    return (
                      <div key={itemId} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                          <div className="text-[11px] text-gray-400">
                            {formatAmount(item.price, item.currency)} {item.currency} {item.unit}
                          </div>
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={e => {
                            const q = Math.max(1, parseInt(e.target.value || '1', 10));
                            setLineItems(prev => prev.map(l => l.itemId === itemId ? { ...l, quantity: q } : l));
                          }}
                          className="w-14 px-2 py-1 text-sm text-center border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="w-24 text-right text-sm font-semibold text-gray-900">
                          {formatAmount(item.price * quantity, item.currency)}
                        </div>
                        <button
                          onClick={() => setLineItems(prev => prev.filter(l => l.itemId !== itemId))}
                          className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatAmount(lineTotal, invoiceCurrency)} {invoiceCurrency}
                    </span>
                  </div>
                </div>
              )}

            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
