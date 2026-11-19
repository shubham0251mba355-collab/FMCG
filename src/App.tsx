import { useCallback, useEffect, useState } from 'react';
import { AccountDrawer } from './components/AccountDrawer';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { Hero } from './components/Hero';
import { Navbar } from './components/Navbar';
import { ProductCatalog } from './components/ProductCatalog';
import { SupplierDetailModal } from './components/SupplierDetailModal';
import { SupplierDirectory } from './components/SupplierDirectory';
import { SupplierOnboarding } from './components/SupplierOnboarding';
import { VentureStory } from './components/VentureStory';
import { api, getStoredToken, setStoredToken } from './lib/api';
import { CartItem, Inquiry, Order, Product, Supplier, User } from './types';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('sup-bidholi-mart');
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const [activeSupplierModal, setActiveSupplierModal] = useState<{
    supplier: Supplier;
    tab: 'reviews' | 'connect';
  } | null>(null);

  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<Order[]>([]);
  const [sentInquiries, setSentInquiries] = useState<Inquiry[]>([]);
  const [incomingInquiries, setIncomingInquiries] = useState<Inquiry[]>([]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      try {
        localStorage.setItem('hc_theme', next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const loadUserActivity = useCallback(async () => {
    try {
      const [ordRes, inqRes] = await Promise.all([api.getOrders(), api.getInquiries()]);
      setCustomerOrders(ordRes.customerOrders);
      setSupplierOrders(ordRes.supplierOrders);
      setSentInquiries(inqRes.sent);
      setIncomingInquiries(inqRes.incoming);
    } catch {
      // ignore if unauthenticated
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [prodRes, supRes] = await Promise.all([
          api.getProducts(),
          api.getSuppliers(),
        ]);
        if (!active) return;
        setProducts(prodRes.products);
        setSuppliers(supRes.suppliers);
        if (supRes.suppliers.length > 0) {
          setSelectedSupplierId((prev) =>
            supRes.suppliers.some((s) => s.id === prev) ? prev : supRes.suppliers[0].id
          );
        }

        if (getStoredToken()) {
          const meRes = await api.me().catch(() => null);
          if (active && meRes?.user) {
            setUser(meRes.user);
            await loadUserActivity();
          } else {
            setStoredToken(null);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [loadUserActivity]);

  function handleAddToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function handleUpdateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function handleRemoveItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  async function handleAuthSuccess(loggedInUser: User) {
    setUser(loggedInUser);
    await loadUserActivity();
  }

  async function handleLogout() {
    await api.logout().catch(() => undefined);
    setStoredToken(null);
    setUser(null);
    setCustomerOrders([]);
    setSupplierOrders([]);
    setSentInquiries([]);
    setIncomingInquiries([]);
    setIsAccountOpen(false);
  }

  function handleSupplierUpdated(updated: Supplier) {
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setActiveSupplierModal((prev) =>
      prev && prev.supplier.id === updated.id ? { ...prev, supplier: updated } : prev
    );
  }

  function handleSelectForOrder(supplier: Supplier) {
    setSelectedSupplierId(supplier.id);
    const el = document.getElementById('packs');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const ownedSupplier = user
    ? suppliers.find((s) => s.ownerUserId === user.id || s.id === user.supplierId) || null
    : null;

  const totalBagCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 dark:bg-[#0D1110] dark:text-stone-100 transition-colors duration-200">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        cartCount={totalBagCount}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
      />

      <main className="flex-1">
        <Hero supplierCount={suppliers.length} />

        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-sm text-stone-500 dark:text-stone-400">
            Loading packs and verified local suppliers...
          </div>
        ) : (
          <>
            <ProductCatalog
              products={products}
              suppliers={suppliers}
              selectedSupplierId={selectedSupplierId}
              onSelectSupplier={setSelectedSupplierId}
              onAddToCart={handleAddToCart}
            />

            <SupplierDirectory
              suppliers={suppliers}
              selectedSupplierId={selectedSupplierId}
              onSelectForOrder={handleSelectForOrder}
              onOpenSupplierModal={(supplier, tab) =>
                setActiveSupplierModal({ supplier, tab })
              }
            />

            <SupplierOnboarding
              user={user}
              ownedSupplier={ownedSupplier}
              supplierOrders={supplierOrders}
              incomingInquiries={incomingInquiries}
              onAuthAndSupplierCreated={(newUser, newSupplier) => {
                setUser(newUser);
                setSuppliers((prev) => [newSupplier, ...prev]);
                setSelectedSupplierId(newSupplier.id);
              }}
              onSupplierUpdated={handleSupplierUpdated}
              onOrderUpdated={(updatedOrder) =>
                setSupplierOrders((prev) =>
                  prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                )
              }
              onInquiryUpdated={(updatedInq) =>
                setIncomingInquiries((prev) =>
                  prev.map((i) => (i.id === updatedInq.id ? updatedInq : i))
                )
              }
              onOpenAuth={() => setIsAuthOpen(true)}
            />

            <VentureStory />
          </>
        )}
      </main>

      <footer className="border-t border-stone-200 dark:border-stone-800 py-10 bg-white/60 dark:bg-[#101513]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
          <div>
            <span className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">
              Himalayan Crunch
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>Dehradun & Delhi-NCR Direct-to-Consumer Makhana Network</span>
          </div>

          <div className="flex items-center gap-5">
            <a href="#packs" className="hover:text-stone-900 dark:hover:text-stone-100">
              Shop ₹49 Packs
            </a>
            <a href="#suppliers" className="hover:text-stone-900 dark:hover:text-stone-100">
              Local Suppliers
            </a>
            <a href="#partner" className="hover:text-stone-900 dark:hover:text-stone-100">
              Partner Onboarding
            </a>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        suppliers={suppliers}
        selectedSupplierId={selectedSupplierId}
        onSelectSupplier={setSelectedSupplierId}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
        user={user}
        onOrderCreated={(newOrder) => {
          setCustomerOrders((prev) => [newOrder, ...prev]);
          if (ownedSupplier && newOrder.supplierId === ownedSupplier.id) {
            setSupplierOrders((prev) => [newOrder, ...prev]);
          }
        }}
      />

      <AccountDrawer
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        user={user}
        orders={customerOrders}
        inquiries={sentInquiries}
        onLogout={handleLogout}
      />

      <SupplierDetailModal
        supplier={activeSupplierModal?.supplier || null}
        initialTab={activeSupplierModal?.tab || 'reviews'}
        user={user}
        onClose={() => setActiveSupplierModal(null)}
        onRequireAuth={() => setIsAuthOpen(true)}
        onSupplierUpdated={handleSupplierUpdated}
        onSelectForOrder={handleSelectForOrder}
      />
    </div>
  );
}
