'use client';

import { useState, useMemo } from 'react';
import {
  Package, Plus, Search, Pencil, TrendingUp, TrendingDown, Minus,
  FileText, Tag, Layers, Boxes, Wrench, MoreHorizontal, Check,
} from 'lucide-react';
import { CoinBadge, Money } from '@/components/ui/coin-badge';
import { CategoryBadge, CATEGORY_ACCENTS } from '@/components/ui/category-badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatUSDC, formatRelativeTime } from '@/lib/utils';
import { STABLECOIN_LIST, getCoin, formatAmount, toUsdCents } from '@/lib/currencies';
import { mockCatalogItems, mockCatalogCategories } from '@/lib/mock-data';
import type { CatalogItem, Currency, CategoryAccent } from '@/types';

const field =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10';
const label = 'block text-[13px] font-medium text-gray-700 mb-1.5';

function Trend({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
        <Minus size={11} /> flat
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium ${up ? 'text-green-600' : 'text-red-500'}`}
    >
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? '+' : ''}{value}%
    </span>
  );
}

export default function CatalogPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'performance'>('items');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // Item form
  const [fName, setFName] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fSku, setFSku] = useState('');
  const [fType, setFType] = useState<CatalogItem['type']>('product');
  const [fCategory, setFCategory] = useState(mockCatalogCategories[0]?.id ?? '');
  const [fPrice, setFPrice] = useState('');
  const [fCurrency, setFCurrency] = useState<Currency>('USDC');
  const [fUnit, setFUnit] = useState('each');

  // Category form
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cAccent, setCAccent] = useState<CategoryAccent>('blue');

  const categoryById = useMemo(
    () => new Map(mockCatalogCategories.map(c => [c.id, c])),
    [],
  );

  const filtered = useMemo(() => {
    let data = mockCatalogItems;
    if (categoryFilter !== 'all') data = data.filter(i => i.category_id === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }
    return data;
  }, [search, categoryFilter]);

  // Revenue mixes currencies, so roll up to an approximate USD figure.
  const totalRevenueUsd = mockCatalogItems.reduce(
    (sum, i) => sum + toUsdCents(i.revenue, i.currency), 0);
  const activeCount = mockCatalogItems.filter(i => i.active).length;
  const topItem = [...mockCatalogItems].sort(
    (a, b) => toUsdCents(b.revenue, b.currency) - toUsdCents(a.revenue, a.currency))[0];

  const perCategory = useMemo(() =>
    mockCatalogCategories.map(cat => {
      const items = mockCatalogItems.filter(i => i.category_id === cat.id);
      const revenueUsd = items.reduce((s, i) => s + toUsdCents(i.revenue, i.currency), 0);
      return {
        category: cat,
        itemCount: items.length,
        unitsSold: items.reduce((s, i) => s + i.units_sold, 0),
        revenueUsd,
        share: totalRevenueUsd > 0 ? (revenueUsd / totalRevenueUsd) * 100 : 0,
      };
    }).sort((a, b) => b.revenueUsd - a.revenueUsd),
  [totalRevenueUsd]);

  const openNew = () => {
    setEditing(null);
    setFName(''); setFDesc(''); setFSku(''); setFType('product');
    setFCategory(mockCatalogCategories[0]?.id ?? ''); setFPrice('');
    setFCurrency('USDC'); setFUnit('each');
    setItemModalOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setFName(item.name); setFDesc(item.description); setFSku(item.sku);
    setFType(item.type); setFCategory(item.category_id);
    setFPrice((item.price / getCoin(item.currency).minorUnits).toString());
    setFCurrency(item.currency); setFUnit(item.unit);
    setItemModalOpen(true);
  };

  const itemColumns: Column<CatalogItem>[] = [
    {
      key: 'name', header: 'Item', width: '280px',
      render: (i) => (
        <div className="flex items-start gap-2.5">
          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            i.type === 'service' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {i.type === 'service' ? <Wrench size={13} /> : <Boxes size={13} />}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-900">{i.name}</span>
              {!i.active && (
                <span className="rounded border border-gray-200 bg-gray-50 px-1 py-px text-[9px] font-semibold uppercase text-gray-500">
                  Inactive
                </span>
              )}
            </div>
            <div className="truncate text-[11px] text-gray-400">{i.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'sku', header: 'SKU', width: '110px',
      render: (i) => <span className="font-mono text-xs text-gray-500">{i.sku}</span>,
    },
    {
      key: 'category', header: 'Category', width: '170px',
      render: (i) => <CategoryBadge category={categoryById.get(i.category_id)} size="sm" />,
    },
    {
      key: 'price', header: 'Price', width: '140px', align: 'right',
      render: (i) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">
            <Money minor={i.price} currency={i.currency} showTicker={false} />
          </div>
          <div className="text-[10px] text-gray-400">{i.unit}</div>
        </div>
      ),
    },
    {
      key: 'currency', header: '', width: '80px',
      render: (i) => <CoinBadge currency={i.currency} size="sm" />,
    },
    {
      key: 'sold', header: 'Sold', width: '90px', align: 'right',
      render: (i) => (
        <div>
          <div className="text-sm font-medium text-gray-900 tabular-nums">{i.units_sold}</div>
          <Trend value={i.trend_30d} />
        </div>
      ),
    },
    {
      key: 'actions', header: '', width: '90px', align: 'right',
      render: (i) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); toast(`"${i.name}" added to a new invoice`); }}
            title="Create invoice with this item"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <FileText size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(i); }}
            title="Edit item"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <Pencil size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catalog</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Build your own catalog of products and services to create invoices faster and track
            item performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Tag size={15} /> New category
          </button>
          <button
            onClick={openNew}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={16} /> Add item
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: 'Catalog items', value: String(mockCatalogItems.length), sub: `${activeCount} active`, icon: Package },
          { label: 'Categories', value: String(mockCatalogCategories.length), sub: 'Organising your catalog', icon: Layers },
          { label: 'Catalog revenue', value: `≈ ${formatUSDC(totalRevenueUsd)}`, sub: 'USD equivalent, lifetime', icon: TrendingUp },
          { label: 'Top performer', value: topItem?.name ?? '—', sub: topItem ? `${topItem.units_sold} sold` : '', icon: Boxes, small: true },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{s.label}</span>
              <s.icon size={14} className="text-gray-400" />
            </div>
            <div className={`font-bold text-gray-900 ${s.small ? 'truncate text-base' : 'text-2xl'}`}>
              {s.value}
            </div>
            <div className="mt-1 text-xs text-gray-400">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-0 border-b border-gray-200">
        {([
          ['items', `Items (${mockCatalogItems.length})`],
          ['categories', `Categories (${mockCatalogCategories.length})`],
          ['performance', 'Performance'],
        ] as const).map(([key, text]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`border-b-[3px] px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {/* Items */}
      {activeTab === 'items' && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, SKU, or description..."
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All categories</option>
              {mockCatalogCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <DataTable
              columns={itemColumns}
              data={filtered}
              keyExtractor={i => i.id}
              emptyMessage="No items match your filters"
              emptyAction={
                <button onClick={openNew} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Add your first catalog item
                </button>
              }
            />
          </div>
        </>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-2 gap-4">
          {perCategory.map(({ category, itemCount, unitsSold, revenueUsd, share }) => {
            const a = CATEGORY_ACCENTS[category.accent];
            return (
              <div key={category.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="h-1" style={{ backgroundColor: a.bar }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">
                        {category.description}
                      </p>
                    </div>
                    <button
                      onClick={() => { setCategoryFilter(category.id); setActiveTab('items'); }}
                      className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      title="View items"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">Items</div>
                      <div className="text-sm font-semibold text-gray-900">{itemCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">Units sold</div>
                      <div className="text-sm font-semibold text-gray-900 tabular-nums">{unitsSold}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">Revenue</div>
                      <div className="text-sm font-semibold text-gray-900">≈ {formatUSDC(revenueUsd)}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-gray-400">
                      <span>Share of catalog revenue</span>
                      <span>{share.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${share}%`, backgroundColor: a.bar }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Performance */}
      {activeTab === 'performance' && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Item performance</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Ranked by lifetime revenue. Amounts are shown in each item&apos;s own currency;
              the ranking uses an approximate USD equivalent.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {[...mockCatalogItems]
              .sort((a, b) => toUsdCents(b.revenue, b.currency) - toUsdCents(a.revenue, a.currency))
              .map((item, idx) => {
                const revUsd = toUsdCents(item.revenue, item.currency);
                const share = totalRevenueUsd > 0 ? (revUsd / totalRevenueUsd) * 100 : 0;
                return (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="w-5 shrink-0 text-right text-xs font-medium tabular-nums text-gray-400">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">{item.name}</span>
                        <CategoryBadge category={categoryById.get(item.category_id)} size="sm" />
                      </div>
                      <div className="mt-1.5 h-1 w-full max-w-xs rounded-full bg-gray-100">
                        <div
                          className="h-1 rounded-full bg-blue-500"
                          style={{ width: `${Math.max(share, 1)}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <div className="text-sm font-medium text-gray-900 tabular-nums">{item.units_sold}</div>
                      <div className="text-[10px] text-gray-400">units</div>
                    </div>
                    <div className="w-32 shrink-0 text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatAmount(item.revenue, item.currency)}
                      </div>
                      <div className="text-[10px] text-gray-400">{item.currency}</div>
                    </div>
                    <div className="w-20 shrink-0 text-right"><Trend value={item.trend_30d} /></div>
                    <div className="w-24 shrink-0 text-right text-[11px] text-gray-400">
                      {item.last_sold_at ? formatRelativeTime(item.last_sold_at) : 'Never sold'}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Add / edit item */}
      <Modal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Add catalog item'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setItemModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast(editing ? `"${fName}" updated` : `"${fName}" added to catalog`);
                setItemModalOpen(false);
              }}
              disabled={!fName || !fPrice}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {editing ? 'Save changes' : 'Add to catalog'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Name</label>
              <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Professional Plan" className={field} />
            </div>
            <div>
              <label className={label}>SKU</label>
              <input value={fSku} onChange={e => setFSku(e.target.value)} placeholder="SW-PRO" className={`${field} font-mono`} />
            </div>
          </div>

          <div>
            <label className={label}>Description</label>
            <textarea
              value={fDesc}
              onChange={e => setFDesc(e.target.value)}
              placeholder="What the customer gets. This appears on invoices and receipts."
              className={`${field} h-20 resize-none`}
            />
          </div>

          <div>
            <label className={label}>Type</label>
            <div className="grid grid-cols-2 gap-2">
              {([['product', Boxes, 'Product'], ['service', Wrench, 'Service']] as const).map(([val, Icon, text]) => (
                <button
                  key={val}
                  onClick={() => setFType(val)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    fType === val
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/10'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon size={15} /> {text}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label}>Category</label>
            <div className="flex flex-wrap gap-2">
              {mockCatalogCategories.map(c => {
                const a = CATEGORY_ACCENTS[c.accent];
                const on = fCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setFCategory(c.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                      on ? `${a.chip} ring-4 ring-blue-500/10` : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
                    {c.name}
                    {on && <Check size={11} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={label}>Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {getCoin(fCurrency).sign}
                </span>
                <input
                  type="number"
                  value={fPrice}
                  onChange={e => setFPrice(e.target.value)}
                  placeholder="0.00"
                  className={`${field} pl-7`}
                />
              </div>
            </div>
            <div>
              <label className={label}>Currency</label>
              <select
                value={fCurrency}
                onChange={e => setFCurrency(e.target.value as Currency)}
                className={field}
              >
                {STABLECOIN_LIST.map(c => (
                  <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Unit</label>
              <input value={fUnit} onChange={e => setFUnit(e.target.value)} placeholder="each" className={field} />
            </div>
          </div>

          {fPrice && (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-500">Appears on invoices as </span>
              <span className="font-semibold text-gray-900">
                {fName || 'Item'} — {formatAmount(
                  Math.round(parseFloat(fPrice || '0') * getCoin(fCurrency).minorUnits),
                  fCurrency,
                )} {fCurrency}
              </span>
              <span className="text-gray-500"> {fUnit}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* New category */}
      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="New category"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setCategoryModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => { toast(`Category "${cName}" created`); setCategoryModalOpen(false); setCName(''); setCDesc(''); }}
              disabled={!cName}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Create category
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={label}>Name</label>
            <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Hardware" className={field} />
          </div>
          <div>
            <label className={label}>Description</label>
            <input value={cDesc} onChange={e => setCDesc(e.target.value)} placeholder="Physical devices and accessories" className={field} />
          </div>
          <div>
            <label className={label}>Colour</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_ACCENTS) as CategoryAccent[]).map(accent => {
                const a = CATEGORY_ACCENTS[accent];
                return (
                  <button
                    key={accent}
                    onClick={() => setCAccent(accent)}
                    title={a.label}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                      cAccent === accent ? 'border-gray-900 ring-4 ring-gray-900/10' : 'border-gray-200'
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full ${a.dot}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
