import React, { useState } from 'react';
import { Check, Package, Send, Store } from 'lucide-react';
import { api, setStoredToken } from '../lib/api';
import { Inquiry, Order, OrderStatus, Supplier, SupplierType, User } from '../types';

interface SupplierOnboardingProps {
  user: User | null;
  ownedSupplier: Supplier | null;
  supplierOrders: Order[];
  incomingInquiries: Inquiry[];
  onAuthAndSupplierCreated: (user: User, supplier: Supplier) => void;
  onSupplierUpdated: (supplier: Supplier) => void;
  onOrderUpdated: (order: Order) => void;
  onInquiryUpdated: (inquiry: Inquiry) => void;
  onOpenAuth: () => void;
}

const ALL_FLAVOURS = [
  'Himalayan Peri Peri',
  'Dehradun Rock Salt & Pepper',
  'Mountain Pudina Zing',
  'Cream & Himalayan Herb',
];

export function SupplierOnboarding({
  user,
  ownedSupplier,
  supplierOrders,
  incomingInquiries,
  onAuthAndSupplierCreated,
  onSupplierUpdated,
  onOrderUpdated,
  onInquiryUpdated,
  onOpenAuth,
}: SupplierOnboardingProps) {
  // Inline account fields if guest
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  // Business fields
  const [businessName, setBusinessName] = useState('');
  const [supplierType, setSupplierType] = useState<SupplierType>('Local Store');
  const [city, setCity] = useState('Dehradun');
  const [zone, setZone] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryEta, setDeliveryEta] = useState('25 mins local drop');
  const [minOrder, setMinOrder] = useState(49);
  const [acceptsCod, setAcceptsCod] = useState(true);
  const [acceptsPickup, setAcceptsPickup] = useState(true);
  const [stockedFlavours, setStockedFlavours] = useState<string[]>([...ALL_FLAVOURS]);
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Partner reply state
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  function toggleFlavour(flavour: string) {
    setStockedFlavours((prev) =>
      prev.includes(flavour) ? prev.filter((f) => f !== flavour) : [...prev, flavour]
    );
  }

  async function handleOnboardSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      let activeUser = user;
      if (!activeUser) {
        const signupRes = await api.signup({
          name: ownerName,
          email: ownerEmail,
          password: ownerPassword,
          role: 'supplier',
          city,
          phone,
        });
        setStoredToken(signupRes.token);
        activeUser = signupRes.user;
      }

      const supRes = await api.createSupplier({
        businessName,
        supplierType,
        city,
        zone,
        phone,
        deliveryEta,
        minOrder,
        acceptsCod,
        acceptsPickup,
        stockedFlavours: stockedFlavours.length ? stockedFlavours : [ALL_FLAVOURS[0]],
        description,
      });

      onAuthAndSupplierCreated(supRes.user, supRes.supplier);
      setSuccessMsg(`${supRes.supplier.businessName} is now live in the Local Suppliers directory.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStock() {
    if (!ownedSupplier) return;
    setBusyId(ownedSupplier.id);
    try {
      const res = await api.updateSupplier(ownedSupplier.id, {
        inStock: !ownedSupplier.inStock,
      });
      onSupplierUpdated(res.supplier);
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdvanceOrder(order: Order, nextStatus: OrderStatus) {
    setBusyId(order.id);
    try {
      const res = await api.updateOrderStatus(order.id, nextStatus);
      onOrderUpdated(res.order);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReplyInquiry(inquiryId: string) {
    const text = (replyDrafts[inquiryId] || '').trim();
    if (!text) return;
    setBusyId(inquiryId);
    try {
      const res = await api.replyInquiry(inquiryId, text);
      onInquiryUpdated(res.inquiry);
      setReplyDrafts((prev) => ({ ...prev, [inquiryId]: '' }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      id="partner"
      className="py-14 sm:py-18 border-b border-stone-200 dark:border-stone-800/90"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {ownedSupplier ? (
          /* LIVE PARTNER PORTAL */
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
              <div>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  Partner Operations Portal · {ownedSupplier.supplierType}
                </p>
                <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-white">
                  {ownedSupplier.businessName}
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  {ownedSupplier.zone}, {ownedSupplier.city} · Rating{' '}
                  <span className="font-mono-nums font-semibold">
                    {ownedSupplier.reviewCount > 0 ? ownedSupplier.avgRating.toFixed(1) : 'New'}
                  </span>{' '}
                  ({ownedSupplier.reviewCount} reviews)
                </p>
              </div>

              <button
                type="button"
                disabled={busyId === ownedSupplier.id}
                onClick={handleToggleStock}
                className={`h-10 px-4 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 self-start md:self-auto ${
                  ownedSupplier.inStock
                    ? 'border-emerald-700 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200'
                    : 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                }`}
              >
                {ownedSupplier.inStock ? 'Status: Accepting Orders' : 'Status: Restocking (Paused)'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Incoming Customer Orders */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] p-6">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                    <span>Incoming D2C Orders ({supplierOrders.length})</span>
                  </h3>
                </div>

                {supplierOrders.length === 0 ? (
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    No orders routed to your hub yet. Orders placed via your listing appear here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {supplierOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#0E1311]"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono-nums font-semibold text-stone-900 dark:text-white">
                            {order.orderNumber} · ₹{order.total}
                          </span>
                          <span className="font-medium text-emerald-800 dark:text-emerald-300 capitalize">
                            {order.status} · {order.fulfillmentType}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-stone-800 dark:text-stone-200">
                          {order.customerName} ({order.phone})
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {order.addressOrCampus}
                        </p>
                        <p className="mt-2 text-xs text-stone-600 dark:text-stone-300">
                          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </p>

                        {order.status !== 'delivered' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {order.status === 'confirmed' && (
                              <button
                                type="button"
                                disabled={busyId === order.id}
                                onClick={() => handleAdvanceOrder(order, 'packing')}
                                className="px-3 py-1.5 rounded-md bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-xs font-semibold"
                              >
                                Mark Packing
                              </button>
                            )}
                            {order.status === 'packing' && (
                              <button
                                type="button"
                                disabled={busyId === order.id}
                                onClick={() => handleAdvanceOrder(order, 'dispatched')}
                                className="px-3 py-1.5 rounded-md bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-xs font-semibold"
                              >
                                Mark Dispatched
                              </button>
                            )}
                            {order.status === 'dispatched' && (
                              <button
                                type="button"
                                disabled={busyId === order.id}
                                onClick={() => handleAdvanceOrder(order, 'delivered')}
                                className="px-3 py-1.5 rounded-md bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-xs font-semibold"
                              >
                                Mark Delivered
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Connect Inquiries */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] p-6">
                <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-white mb-5">
                  Customer Inquiries ({incomingInquiries.length})
                </h3>

                {incomingInquiries.length === 0 ? (
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Direct bulk, hostel drop, and campus event inquiries will appear here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {incomingInquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="p-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-[#0E1311]"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
                          <span className="font-semibold text-stone-900 dark:text-white">
                            {inq.senderName} · {inq.senderContact}
                          </span>
                          <span className="capitalize">{inq.inquiryType.replace('_', ' ')}</span>
                        </div>
                        <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
                          {inq.message}
                        </p>

                        {inq.reply ? (
                          <p className="mt-3 pt-2 border-t border-stone-200 dark:border-stone-800 text-xs text-emerald-800 dark:text-emerald-300">
                            Your reply: {inq.reply}
                          </p>
                        ) : (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              type="text"
                              value={replyDrafts[inq.id] || ''}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({ ...prev, [inq.id]: e.target.value }))
                              }
                              placeholder="Write a quick response..."
                              className="flex-1 h-9 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-xs"
                            />
                            <button
                              type="button"
                              disabled={busyId === inq.id}
                              onClick={() => handleReplyInquiry(inq.id)}
                              className="h-9 px-3 inline-flex items-center gap-1 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-xs font-semibold"
                            >
                              <Send className="w-3 h-3" />
                              <span>Reply</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ONBOARDING FORM FOR LOCAL DISTRIBUTORS & SUPPLIERS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-5">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                Distributor & Supplier Onboarding
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
                Onboard your local store, canteen, or campus hub in under a minute
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed">
                Join the Himalayan Crunch D2C fulfillment network. Local kirana stores, college
                canteens, and student ambassadors receive direct student orders, hostel bulk
                inquiries, and verified customer ratings.
              </p>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3 text-sm text-stone-700 dark:text-stone-300">
                <div className="flex items-start gap-3">
                  <Store className="w-4 h-4 text-emerald-700 dark:text-emerald-300 mt-1 shrink-0" />
                  <span>Zero onboarding fee—list your stocked ₹49 flavours immediately</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-300 mt-1 shrink-0" />
                  <span>Accept UPI or Cash on Delivery with self-managed pickup & local drops</span>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-4 h-4 text-emerald-700 dark:text-emerald-300 mt-1 shrink-0" />
                  <span>Manage incoming orders and student messages in your Partner Portal</span>
                </div>
              </div>

              {!user && (
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19]">
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    Already registered as a partner?{' '}
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="font-semibold text-emerald-800 dark:text-emerald-300 underline underline-offset-4"
                    >
                      Sign in to open your Partner Portal
                    </button>
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-7">
              <form
                onSubmit={handleOnboardSubmit}
                className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] p-6 sm:p-8 space-y-5"
              >
                {!user && (
                  <div className="pb-5 border-b border-stone-200 dark:border-stone-800 space-y-4">
                    <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                      1. Partner Account Credentials
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                          Owner Name
                        </label>
                        <input
                          type="text"
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="e.g. Rajesh Chauhan"
                          className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          placeholder="store@domain.in"
                          className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={ownerPassword}
                          onChange={(e) => setOwnerPassword(e.target.value)}
                          placeholder="Min 6 chars"
                          className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {user ? 'Business & Local Distribution Details' : '2. Business & Local Distribution Details'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        Business / Store / Canteen Name
                      </label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Ballupur Student Mart"
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        Partner Category
                      </label>
                      <select
                        value={supplierType}
                        onChange={(e) => setSupplierType(e.target.value as SupplierType)}
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                      >
                        <option value="Local Store">Local Store</option>
                        <option value="College Canteen">College Canteen</option>
                        <option value="Student Ambassador">Student Ambassador</option>
                        <option value="Regional Distributor">Regional Distributor</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        City
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                      >
                        <option value="Dehradun">Dehradun</option>
                        <option value="Delhi-NCR">Delhi-NCR</option>
                        <option value="Rishikesh">Rishikesh</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        Campus / Neighbourhood Coverage
                      </label>
                      <input
                        type="text"
                        required
                        value={zone}
                        onChange={(e) => setZone(e.target.value)}
                        placeholder="e.g. Ballupur Chowk · Chakrata Road"
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98..."
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        Delivery ETA
                      </label>
                      <input
                        type="text"
                        value={deliveryEta}
                        onChange={(e) => setDeliveryEta(e.target.value)}
                        placeholder="25 mins local drop"
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                        Min Order (₹)
                      </label>
                      <input
                        type="number"
                        min={49}
                        step={1}
                        value={minOrder}
                        onChange={(e) => setMinOrder(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm font-mono-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-2">
                      Stocked ₹49 Flavours
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ALL_FLAVOURS.map((flavour) => {
                        const active = stockedFlavours.includes(flavour);
                        return (
                          <button
                            key={flavour}
                            type="button"
                            onClick={() => toggleFlavour(flavour)}
                            className={`px-3 py-2 rounded-lg border text-left text-xs font-medium transition-colors flex items-center justify-between ${
                              active
                                ? 'border-[#1B4332] dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 text-stone-900 dark:text-white'
                                : 'border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400'
                            }`}
                          >
                            <span>{flavour}</span>
                            {active && <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-1">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptsCod}
                        onChange={(e) => setAcceptsCod(e.target.checked)}
                        className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-700"
                      />
                      Accept Cash on Delivery (COD)
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptsPickup}
                        onChange={(e) => setAcceptsPickup(e.target.checked)}
                        className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-700"
                      />
                      Offer Counter / Campus Pickup
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                      Short Store Description
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Hours, campus gates covered, bulk fest discounts..."
                      className="w-full p-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-[#0E1311] text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2"
                  >
                    {error}
                  </p>
                )}

                {successMsg && (
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    {successMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 px-6 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-sm font-semibold hover:bg-[#143326] dark:hover:bg-emerald-300 disabled:opacity-60 transition-colors"
                >
                  {submitting
                    ? 'Publishing Listing...'
                    : user
                      ? 'Publish Local Supplier Listing'
                      : 'Create Account & Publish Listing'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
