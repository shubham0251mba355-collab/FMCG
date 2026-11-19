import { LogOut, MessageSquare, Package, X } from 'lucide-react';
import { Inquiry, Order, User } from '../types';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  orders: Order[];
  inquiries: Inquiry[];
  onLogout: () => void;
}

export function AccountDrawer({
  isOpen,
  onClose,
  user,
  orders,
  inquiries,
  onLogout,
}: AccountDrawerProps) {
  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-drawer-title"
    >
      <div className="w-full max-w-md h-full bg-[#FAF9F6] dark:bg-[#111614] text-stone-900 dark:text-stone-100 border-l border-stone-200 dark:border-stone-800 flex flex-col">
        <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 capitalize">
              {user.role === 'supplier' ? 'Local Supplier Account' : 'Customer Account'} ·{' '}
              {user.city || 'Dehradun'}
            </p>
            <h2 id="account-drawer-title" className="font-display text-lg font-semibold truncate">
              {user.name}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account drawer"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Orders */}
          <div>
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mb-3">
              <Package className="w-3.5 h-3.5" />
              <span>Your D2C Orders ({orders.length})</span>
            </h3>
            {orders.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                You haven&apos;t placed any orders yet.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19]"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono-nums font-semibold">{order.orderNumber}</span>
                      <span className="capitalize font-medium text-emerald-800 dark:text-emerald-300">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{order.supplierName}</p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </p>
                    <p className="mt-2 font-mono-nums text-xs font-semibold">
                      Total: ₹{order.total} · {order.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Inquiries */}
          <div>
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mb-3">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Messages to Suppliers ({inquiries.length})</span>
            </h3>
            {inquiries.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                No direct supplier messages sent yet.
              </p>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19]"
                  >
                    <p className="text-xs font-semibold text-stone-900 dark:text-white">
                      To: {inq.supplierName}
                    </p>
                    <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                      {inq.message}
                    </p>
                    {inq.reply && (
                      <p className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-emerald-800 dark:text-emerald-300">
                        Reply: {inq.reply}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19]">
          <button
            type="button"
            onClick={onLogout}
            className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
