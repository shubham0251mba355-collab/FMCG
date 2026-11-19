import { useState } from 'react';
import { MessageSquare, Search, Star } from 'lucide-react';
import { Supplier } from '../types';

interface SupplierDirectoryProps {
  suppliers: Supplier[];
  selectedSupplierId: string;
  onSelectForOrder: (supplier: Supplier) => void;
  onOpenSupplierModal: (supplier: Supplier, initialTab: 'reviews' | 'connect') => void;
}

export function SupplierDirectory({
  suppliers,
  selectedSupplierId,
  onSelectForOrder,
  onOpenSupplierModal,
}: SupplierDirectoryProps) {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest'>('rating');

  const cities = ['All', ...Array.from(new Set(suppliers.map((s) => s.city)))];

  const filtered = suppliers
    .filter((s) => {
      if (cityFilter !== 'All' && s.city !== cityFilter) return false;
      if (typeFilter !== 'All' && s.supplierType !== typeFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          s.businessName.toLowerCase().includes(q) ||
          s.zone.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.avgRating - a.avgRating || b.reviewCount - a.reviewCount;
      if (sortBy === 'newest')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return b.reviewCount - a.reviewCount || b.avgRating - a.avgRating;
    });

  return (
    <section
      id="suppliers"
      className="py-14 sm:py-18 border-b border-stone-200 dark:border-stone-800/90"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-2">
              Local Distributors & Campus Suppliers
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
              Connect with verified local suppliers near you
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-300">
              Choose a local canteen, neighbourhood store, or campus ambassador for fast delivery,
              rate your freshness & pickup experience, or message directly for hostel bulk drops.
            </p>
          </div>

          <a
            href="#partner"
            className="h-10 px-4 inline-flex items-center justify-center rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-xs font-semibold text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
          >
            + List Your Local Business
          </a>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 mb-8">
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campus, area (Bidholi, Prem Nagar, NCR)..."
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter by city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Cities' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Filter by supplier type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="All">All Partner Types</option>
              <option value="College Canteen">College Canteen</option>
              <option value="Local Store">Local Store</option>
              <option value="Student Ambassador">Student Ambassador</option>
              <option value="Regional Distributor">Regional Distributor</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Sort suppliers"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'reviews' | 'newest')}
              className="w-full h-11 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviewed</option>
              <option value="newest">Newly Onboarded</option>
            </select>
          </div>
        </div>

        {/* Supplier Grid */}
        {filtered.length === 0 ? (
          <div className="p-10 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] text-center">
            <p className="text-base font-medium text-stone-900 dark:text-stone-100">
              No local distributors matched your filters
            </p>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Try clearing your search or list your own campus store below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((supplier) => {
              const isSelected = supplier.id === selectedSupplierId;

              return (
                <article
                  key={supplier.id}
                  className={`rounded-xl border p-6 bg-white dark:bg-[#151B19] flex flex-col justify-between transition-colors ${
                    isSelected
                      ? 'border-[#1B4332] dark:border-emerald-400'
                      : 'border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div>
                    {/* Top Metadata + Rating Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                          <span className="font-medium text-emerald-800 dark:text-emerald-300">
                            {supplier.supplierType}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{supplier.city}</span>
                          <span aria-hidden="true">·</span>
                          <span>{supplier.inStock ? 'In Stock' : 'Restocking'}</span>
                        </div>

                        <h3 className="mt-1.5 font-display text-xl font-semibold text-stone-900 dark:text-stone-50 leading-snug">
                          {supplier.businessName}
                        </h3>
                        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                          {supplier.zone}
                        </p>
                      </div>

                      {/* Tabular Rating Summary */}
                      <button
                        type="button"
                        onClick={() => onOpenSupplierModal(supplier, 'reviews')}
                        className="shrink-0 text-right group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded p-1"
                        title="Read and write reviews"
                      >
                        <div className="inline-flex items-center gap-1 text-sm font-semibold text-stone-900 dark:text-stone-100">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span className="font-mono-nums">
                            {supplier.reviewCount > 0 ? supplier.avgRating.toFixed(1) : 'New'}
                          </span>
                        </div>
                        <p className="font-mono-nums text-xs text-stone-500 dark:text-stone-400 group-hover:underline">
                          {supplier.reviewCount}{' '}
                          {supplier.reviewCount === 1 ? 'review' : 'reviews'}
                        </p>
                      </button>
                    </div>

                    <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                      {supplier.description}
                    </p>

                    {/* Key Operational Specs (Unboxed) */}
                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="block text-stone-400 dark:text-stone-500">Speed</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {supplier.deliveryEta}
                        </span>
                      </div>
                      <div>
                        <span className="block text-stone-400 dark:text-stone-500">Min Order</span>
                        <span className="font-mono-nums font-medium text-stone-800 dark:text-stone-200">
                          ₹{supplier.minOrder}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="block text-stone-400 dark:text-stone-500">Options</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {supplier.acceptsPickup ? 'Pickup & Delivery' : 'Delivery'}
                          {supplier.acceptsCod ? ' · COD' : ''}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                      Stocked: {supplier.stockedFlavours.join(' · ')}
                    </p>
                  </div>

                  {/* Action Row */}
                  <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onSelectForOrder(supplier)}
                      className={`h-10 px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-emerald-800 dark:bg-emerald-500 text-white dark:text-stone-950'
                          : 'bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 hover:bg-[#143326] dark:hover:bg-emerald-300'
                      }`}
                    >
                      {isSelected ? 'Active Hub · Shop Packs' : 'Order via Hub'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenSupplierModal(supplier, 'reviews')}
                      className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#0E1311] text-xs font-medium text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>Reviews & Rate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenSupplierModal(supplier, 'connect')}
                      className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#0E1311] text-xs font-medium text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
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
