import React, { useEffect, useState } from 'react';
import { Check, MessageSquare, Phone, Send, Star, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { Inquiry, Review, Supplier, User } from '../types';

interface SupplierDetailModalProps {
  supplier: Supplier | null;
  initialTab: 'reviews' | 'connect';
  user: User | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onSupplierUpdated: (updated: Supplier) => void;
  onSelectForOrder: (supplier: Supplier) => void;
}

const FLAVOUR_OPTIONS = [
  'Himalayan Peri Peri',
  'Dehradun Rock Salt & Pepper',
  'Mountain Pudina Zing',
  'Cream & Himalayan Herb',
  'Campus 3-Pack Trio',
  'Hostel Study 6-Pack',
];

export function SupplierDetailModal({
  supplier,
  initialTab,
  user,
  onClose,
  onRequireAuth,
  onSupplierUpdated,
  onSelectForOrder,
}: SupplierDetailModalProps) {
  const [tab, setTab] = useState<'reviews' | 'connect'>(initialTab);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review form state
  const [rating, setRating] = useState(5);
  const [freshnessRating, setFreshnessRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [flavourTried, setFlavourTried] = useState(FLAVOUR_OPTIONS[0]);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSaved, setReviewSaved] = useState(false);

  // Connect inquiry state
  const [senderName, setSenderName] = useState(user?.name || '');
  const [senderContact, setSenderContact] = useState(user?.phone || user?.email || '');
  const [inquiryType, setInquiryType] = useState<Inquiry['inquiryType']>('hostel_drop');
  const [message, setMessage] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [sentInquiry, setSentInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, supplier?.id]);

  useEffect(() => {
    if (user) {
      setSenderName((prev) => prev || user.name);
      setSenderContact((prev) => prev || user.phone || user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!supplier) return;
    setLoadingReviews(true);
    setReviewError(null);
    setReviewSaved(false);
    setSentInquiry(null);
    setInquiryError(null);
    api
      .getReviews(supplier.id)
      .then((res) => setReviews(res.reviews))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [supplier?.id]);

  if (!supplier) return null;

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!supplier) return;
    if (!user) {
      onRequireAuth();
      return;
    }
    setReviewError(null);
    setSubmittingReview(true);
    try {
      const res = await api.createReview(supplier.id, {
        rating,
        freshnessRating,
        deliveryRating,
        title,
        comment,
        flavourTried,
      });
      setReviews((prev) => [res.review, ...prev]);
      onSupplierUpdated(res.supplier);
      setTitle('');
      setComment('');
      setReviewSaved(true);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Could not post review.');
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleDeleteReview(reviewId: string) {
    try {
      const res = await api.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (res.supplier) {
        onSupplierUpdated(res.supplier);
      }
    } catch {
      // ignore
    }
  }

  async function handleSendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!supplier) return;
    setInquiryError(null);
    setSendingInquiry(true);
    try {
      const res = await api.createInquiry({
        supplierId: supplier.id,
        senderName,
        senderContact,
        inquiryType,
        message,
      });
      setSentInquiry(res.inquiry);
      setMessage('');
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSendingInquiry(false);
    }
  }

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, pct };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-modal-title"
    >
      <div className="w-full max-w-2xl h-full bg-[#FAF9F6] dark:bg-[#111614] text-stone-900 dark:text-stone-100 border-l border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              {supplier.supplierType} · {supplier.city}
            </p>
            <h2
              id="supplier-modal-title"
              className="mt-1 font-display text-2xl font-semibold text-stone-900 dark:text-white truncate"
            >
              {supplier.businessName}
            </h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {supplier.zone} · {supplier.deliveryEta} · Contact: {supplier.phone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close supplier panel"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setTab('reviews')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                tab === 'reviews'
                  ? 'bg-white dark:bg-[#1E2623] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Reviews & Ratings ({supplier.reviewCount})
            </button>
            <button
              type="button"
              onClick={() => setTab('connect')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                tab === 'connect'
                  ? 'bg-white dark:bg-[#1E2623] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Connect & Bulk Inquiry
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectForOrder(supplier);
              onClose();
            }}
            className="h-9 px-3.5 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-xs font-semibold hover:bg-[#143326] dark:hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
          >
            Order From Hub
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {tab === 'reviews' ? (
            <>
              {/* Rating Aggregate Overview */}
              <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono-nums text-4xl font-semibold text-stone-900 dark:text-white">
                      {supplier.reviewCount > 0 ? supplier.avgRating.toFixed(1) : '—'}
                    </span>
                    <span className="text-sm text-stone-500 dark:text-stone-400">/ 5.0</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(supplier.avgRating)
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    Freshness{' '}
                    <span className="font-mono-nums font-semibold text-stone-800 dark:text-stone-200">
                      {supplier.avgFreshness || '—'}
                    </span>{' '}
                    · Speed{' '}
                    <span className="font-mono-nums font-semibold text-stone-800 dark:text-stone-200">
                      {supplier.avgDelivery || '—'}
                    </span>
                  </p>
                </div>

                <div className="sm:col-span-7 space-y-1.5">
                  {ratingBreakdown.map((row) => (
                    <div key={row.star} className="flex items-center gap-2.5 text-xs">
                      <span className="font-mono-nums w-6 text-stone-600 dark:text-stone-400">
                        {row.star}★
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="font-mono-nums w-7 text-right text-stone-500 dark:text-stone-400">
                        {row.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Review Form */}
              <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19]">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-white">
                    Rate your experience
                  </h3>
                  {!user && (
                    <button
                      type="button"
                      onClick={onRequireAuth}
                      className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 underline underline-offset-4"
                    >
                      Sign in to review
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1.5">
                        Overall Rating
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            aria-label={`Rate ${n} stars`}
                            className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                n <= rating
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-stone-300 dark:text-stone-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1.5">
                        Crunch & Freshness
                      </label>
                      <select
                        value={freshnessRating}
                        onChange={(e) => setFreshnessRating(Number(e.target.value))}
                        className="w-full h-9 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-xs"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} / 5 Freshness
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1.5">
                        Delivery / Pickup
                      </label>
                      <select
                        value={deliveryRating}
                        onChange={(e) => setDeliveryRating(Number(e.target.value))}
                        className="w-full h-9 px-2.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-xs"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} / 5 Speed
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        Flavour Tried
                      </label>
                      <select
                        value={flavourTried}
                        onChange={(e) => setFlavourTried(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-xs"
                      >
                        {FLAVOUR_OPTIONS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        Review Headline
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Super crisp trial pack"
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                      Your Experience
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share feedback on crunch, ₹49 value, packaging, or supplier responsiveness..."
                      className="w-full p-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-xs text-red-700 dark:text-red-300">{reviewError}</p>
                  )}
                  {reviewSaved && (
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Review published to supplier rating.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="h-10 px-5 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-xs font-semibold hover:bg-[#143326] dark:hover:bg-emerald-300 disabled:opacity-60 transition-colors"
                  >
                    {submittingReview ? 'Submitting...' : user ? 'Submit Review' : 'Sign In & Submit'}
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Customer Reviews ({reviews.length})
                </h3>

                {loadingReviews ? (
                  <p className="text-sm text-stone-500">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    No reviews yet. Be the first customer to review {supplier.businessName}.
                  </p>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                            <span className="font-semibold text-stone-900 dark:text-stone-100">
                              {rev.userName}
                            </span>
                            {rev.userCity && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{rev.userCity}</span>
                              </>
                            )}
                            {rev.verifiedOrder && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                                  Verified Order
                                </span>
                              </>
                            )}
                          </div>
                          <h4 className="mt-1 font-semibold text-sm text-stone-900 dark:text-white">
                            {rev.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono-nums text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {rev.rating}.0 ★
                          </span>
                          {user?.id === rev.userId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev.id)}
                              aria-label="Delete your review"
                              className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        {rev.comment}
                      </p>

                      <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">
                        Flavour: {rev.flavourTried} ·{' '}
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Direct Connect Tab */
            <div className="space-y-6">
              <div className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19]">
                <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-white">
                  Message {supplier.businessName} directly
                </h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  Coordinate hostel group drops, college fest sampling stalls, canteen restocks,
                  or retail shelf onboarding directly with this local partner.
                </p>

                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-4 text-xs text-stone-600 dark:text-stone-300">
                  <span className="inline-flex items-center gap-1.5 font-mono-nums">
                    <Phone className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                    {supplier.phone}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{supplier.deliveryEta}</span>
                </div>
              </div>

              {sentInquiry ? (
                <div className="p-6 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Direct inquiry sent to {supplier.businessName}
                  </p>
                  <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
                    &ldquo;{sentInquiry.message}&rdquo;
                  </p>
                  <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                    The supplier can reply in their Partner Portal, or reach you at{' '}
                    {sentInquiry.senderContact}.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSendInquiry}
                  className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="e.g. Kabir Mehta"
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Phone / WhatsApp or Email
                      </label>
                      <input
                        type="text"
                        required
                        value={senderContact}
                        onChange={(e) => setSenderContact(e.target.value)}
                        placeholder="+91 98..."
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Connection Purpose
                    </label>
                    <select
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value as Inquiry['inquiryType'])}
                      className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                    >
                      <option value="hostel_drop">Hostel / PG Evening Drop</option>
                      <option value="campus_event">College Event / Club Sampling</option>
                      <option value="bulk_canteen">Canteen / Office Pantry Bulk Order</option>
                      <option value="retail_stock">Retail Shelf Partnership</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Specify pack count, preferred ₹49 flavours, hostel block or event timing..."
                      className="w-full p-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  {inquiryError && (
                    <p className="text-xs text-red-700 dark:text-red-300">{inquiryError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={sendingInquiry}
                    className="h-11 px-5 inline-flex items-center gap-2 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-xs font-semibold hover:bg-[#143326] dark:hover:bg-emerald-300 disabled:opacity-60 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingInquiry ? 'Sending...' : 'Send Direct Message'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
