import { useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { Product, Supplier } from '../types';

interface ProductCatalogProps {
  products: Product[];
  suppliers: Supplier[];
  selectedSupplierId: string;
  onSelectSupplier: (id: string) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductCatalog({
  products,
  suppliers,
  selectedSupplierId,
  onSelectSupplier,
  onAddToCart,
}: ProductCatalogProps) {
  const [filter, setFilter] = useState<'All' | 'Trial Pack' | 'Campus Bundle'>('All');
  const [spiceFilter, setSpiceFilter] = useState<'All' | Product['spiceLevel']>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const visibleProducts = products.filter((p) => {
    if (filter !== 'All' && p.category !== filter) return false;
    if (spiceFilter !== 'All' && p.spiceLevel !== spiceFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.spiceLevel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeSupplier =
    suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const hasActiveFilters =
    filter !== 'All' || spiceFilter !== 'All' || searchQuery.trim() !== '';

  function handleResetFilters() {
    setFilter('All');
    setSpiceFilter('All');
    setSearchQuery('');
  }

  function handleAdd(product: Product) {
    onAddToCart(product);
    setAddedId(product.id);
    window.setTimeout(() => {
      setAddedId((prev) => (prev === product.id ? null : prev));
    }, 1200);
  }

  return (
    <section id="packs" className="py-14 sm:py-18 border-b border-stone-200 dark:border-stone-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header & Category Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-2">
              Direct-to-Consumer Menu
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              Roasted makhana packs built for everyday snacking
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-200/70 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 self-start lg:self-auto">
            {(['All', 'Trial Pack', 'Campus Bundle'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab
                    ? 'bg-white dark:bg-[#1E2623] text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {tab === 'All' ? 'All Packs' : tab === 'Trial Pack' ? '₹49 Trial Packs' : 'Campus Bundles'}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar & Flavour/Category Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
          <div className="sm:col-span-6 lg:col-span-6 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search makhana flavours or pack types"
              placeholder="Search flavours (Peri Peri, Pudina, Rock Salt, Trio)..."
              className="w-full h-11 pl-10 pr-10 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear product search"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 absolute right-1.5 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:col-span-3 lg:col-span-3">
            <select
              aria-label="Filter by product category"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'All' | 'Trial Pack' | 'Campus Bundle')}
              className="w-full h-11 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="All">All Categories</option>
              <option value="Trial Pack">Trial Pack (₹49)</option>
              <option value="Campus Bundle">Campus Bundle</option>
            </select>
          </div>

          <div className="sm:col-span-3 lg:col-span-3">
            <select
              aria-label="Filter by flavour spice level"
              value={spiceFilter}
              onChange={(e) => setSpiceFilter(e.target.value as 'All' | Product['spiceLevel'])}
              className="w-full h-11 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="All">All Spice Profiles</option>
              <option value="Mild">Mild (Salted & Herb)</option>
              <option value="Medium">Medium (Pudina Zing)</option>
              <option value="Bold">Bold (Peri Peri)</option>
              <option value="Assorted">Assorted Combos</option>
            </select>
          </div>
        </div>

        {/* Local Supplier Fulfillment Bar */}
        {suppliers.length > 0 && (
          <div className="mb-8 p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                Fulfilling D2C order from local partner
              </p>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                {activeSupplier?.businessName} ·{' '}
                <span className="font-normal text-stone-600 dark:text-stone-300">
                  {activeSupplier?.deliveryEta}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <label htmlFor="fulfillment-supplier-select" className="text-xs font-medium text-stone-600 dark:text-stone-300 whitespace-nowrap">
                Switch hub:
              </label>
              <select
                id="fulfillment-supplier-select"
                value={activeSupplier?.id || ''}
                onChange={(e) => onSelectSupplier(e.target.value)}
                className="h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-xs font-medium text-stone-900 dark:text-stone-100 max-w-[260px] focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.businessName} ({s.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 3-Column Uniform Product Grid or Empty State */}
        {visibleProducts.length === 0 ? (
          <div className="p-10 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] text-center">
            <p className="text-base font-medium text-stone-900 dark:text-stone-100">
              No makhana packs matched your search or filters
            </p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Try searching for Peri Peri, Rock Salt, Pudina, or reset your filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 h-10 px-4 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-xs font-semibold hover:bg-[#143326] dark:hover:bg-emerald-300 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {visibleProducts.map((product) => {
            const isAdded = addedId === product.id;
            const imgFailed = failedImages[product.id];

            return (
              <article
                key={product.id}
                className="group rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
                  {!imgFailed ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [product.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900">
                      <span className="font-display text-lg font-semibold text-stone-700 dark:text-stone-200 text-center">
                        {product.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Zero-pill clean metadata */}
                    <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                      <span>{product.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-nums">{product.weight}</span>
                      <span aria-hidden="true">·</span>
                      <span>{product.spiceLevel}</span>
                    </div>

                    <h3 className="mt-2 font-display text-lg font-semibold text-stone-900 dark:text-stone-50 leading-snug">
                      {product.name}
                    </h3>

                    <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono-nums text-xl font-semibold text-stone-900 dark:text-white">
                        ₹{product.price}
                      </span>
                      <span className="font-mono-nums text-xs text-stone-400 line-through">
                        ₹{product.mrp}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAdd(product)}
                      className={`h-10 px-4 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        isAdded
                          ? 'bg-emerald-700 dark:bg-emerald-500 text-white dark:text-stone-950'
                          : 'bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 hover:bg-[#143326] dark:hover:bg-emerald-300'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Bag</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
