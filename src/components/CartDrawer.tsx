import React, { useEffect, useState } from 'react';
import { Check, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { CartItem, Order, Supplier, User } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  suppliers: Supplier[];
  selectedSupplierId: string;
  onSelectSupplier: (id: string) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  user: User | null;
  onOrderCreated: (order: Order) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  suppliers,
  selectedSupplierId,
  onSelectSupplier,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  user,
  onOrderCreated,
}: CartDrawerProps) {
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressOrCampus, setAddressOrCampus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.name);
      setPhone((prev) => prev || user.phone || '');
    }
  }, [user]);

  if (!isOpen) return null;

  const activeSupplier =
    suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = fulfillmentType === 'pickup' || subtotal >= 147 || subtotal === 0 ? 0 : 15;
  const total = subtotal + deliveryFee;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSupplier || items.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.createOrder({
        supplierId: activeSupplier.id,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        fulfillmentType,
        paymentMethod,
        customerName,
        phone,
        addressOrCampus,
      });
      setConfirmedOrder(res.order);
      onOrderCreated(res.order);
      onClearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div className="w-full max-w-md h-full bg-[#FAF9F6] dark:bg-[#111614] text-stone-900 dark:text-stone-100 border-l border-stone-200 dark:border-stone-800 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            <h2 id="cart-drawer-title" className="font-display text-lg font-semibold">
              Your Snack Bag
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              onClose();
            }}
            aria-label="Close shopping bag"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {confirmedOrder ? (
            <div className="p-6 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-[#151B19] space-y-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="font-mono-nums text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Order {confirmedOrder.orderNumber} Confirmed
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-stone-900 dark:text-white">
                  Preparing via {confirmedOrder.supplierName}
                </h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                  {confirmedOrder.fulfillmentType === 'pickup'
                    ? 'Ready for counter pickup'
                    : `Dispatching to ${confirmedOrder.addressOrCampus}`}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-1.5 text-sm">
                {confirmedOrder.items.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="text-stone-600 dark:text-stone-300">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-mono-nums font-medium">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-between font-semibold">
                  <span>Total ({confirmedOrder.paymentMethod.toUpperCase()})</span>
                  <span className="font-mono-nums">₹{confirmedOrder.total}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  onClose();
                }}
                className="w-full h-10 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-xs font-semibold"
              >
                Continue Exploring
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="font-display text-lg font-medium text-stone-800 dark:text-stone-200">
                Your bag is empty
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Add a ₹49 trial pack or Campus 3-Pack Trio to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Supplier Hub Selector */}
              {suppliers.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                    Fulfilling Local Partner
                  </label>
                  <select
                    value={activeSupplier?.id || ''}
                    onChange={(e) => onSelectSupplier(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-xs font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.businessName} · {s.deliveryEta}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Free Delivery Notice */}
              <div className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#151B19] border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300">
                {subtotal >= 147 ? (
                  <span className="font-medium text-emerald-800 dark:text-emerald-300">
                    Free local campus delivery unlocked (₹147+ order)
                  </span>
                ) : (
                  <span>
                    Add{' '}
                    <span className="font-mono-nums font-semibold">₹{147 - subtotal}</span> more
                    (3 trial packs) for free local campus delivery.
                  </span>
                )}
              </div>

              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                        {item.product.name}
                      </p>
                      <p className="font-mono-nums text-xs text-stone-500 dark:text-stone-400">
                        ₹{item.product.price} · {item.product.weight}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="inline-flex items-center rounded-lg border border-stone-200 dark:border-stone-700">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.product.id, -1)}
                          aria-label={`Decrease ${item.product.name} quantity`}
                          className="h-8 w-8 inline-flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono-nums w-7 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.product.id, 1)}
                          aria-label={`Increase ${item.product.name} quantity`}
                          className="h-8 w-8 inline-flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.product.id)}
                        aria-label={`Remove ${item.product.name}`}
                        className="h-8 w-8 inline-flex items-center justify-center text-stone-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('delivery')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      fulfillmentType === 'delivery'
                        ? 'border-[#1B4332] dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/50 text-stone-900 dark:text-white'
                        : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Local Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('pickup')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                      fulfillmentType === 'pickup'
                        ? 'border-[#1B4332] dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/50 text-stone-900 dark:text-white'
                        : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Self Pickup (Free)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Full name"
                      className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98..."
                      className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                    {fulfillmentType === 'pickup'
                      ? 'Pickup Note / Time Slot'
                      : 'Hostel, Campus Gate, or Street Address'}
                  </label>
                  <input
                    type="text"
                    required
                    value={addressOrCampus}
                    onChange={(e) => setAddressOrCampus(e.target.value)}
                    placeholder={
                      fulfillmentType === 'pickup'
                        ? 'e.g. Picking up at 5:30 PM'
                        : 'e.g. DGU Hostel Block B, Bidholi'
                    }
                    className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      paymentMethod === 'upi'
                        ? 'border-[#1B4332] dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/50 text-stone-900 dark:text-white'
                        : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Pay via UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                      paymentMethod === 'cod'
                        ? 'border-[#1B4332] dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/50 text-stone-900 dark:text-white'
                        : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Cash on Delivery
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Footer Subtotal & Place Order */}
        {!confirmedOrder && items.length > 0 && (
          <div className="p-6 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-stone-600 dark:text-stone-300">
                <span>Subtotal</span>
                <span className="font-mono-nums">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-300">
                <span>Local Drop Fee</span>
                <span className="font-mono-nums">
                  {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="font-mono-nums">₹{total}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="w-full h-11 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-sm font-semibold hover:bg-[#143326] dark:hover:bg-emerald-300 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Confirming Order...' : `Confirm Order · ₹${total}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
