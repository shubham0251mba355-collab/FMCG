import { Moon, ShoppingBag, Sun, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  cartCount: number;
  onOpenCart: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onOpenAccount: () => void;
}

export function Navbar({
  theme,
  onToggleTheme,
  cartCount,
  onOpenCart,
  user,
  onOpenAuth,
  onOpenAccount,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 dark:border-stone-800 bg-[#FAF9F6]/92 dark:bg-[#0D1110]/92 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element wordmark */}
        <a
          href="#top"
          className="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded"
        >
          Himalayan Crunch
        </a>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-stone-300"
        >
          <a
            href="#packs"
            className="hover:text-stone-950 dark:hover:text-white underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Shop Packs
          </a>
          <a
            href="#suppliers"
            className="hover:text-stone-950 dark:hover:text-white underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Local Suppliers
          </a>
          <a
            href="#partner"
            className="hover:text-stone-950 dark:hover:text-white underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Partner With Us
          </a>
          <a
            href="#story"
            className="hover:text-stone-950 dark:hover:text-white underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Our Story
          </a>
        </nav>

        {/* Zone 3: Compact action cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="h-10 w-10 inline-flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Shopping bag with ${cartCount} items`}
            className="h-10 px-3.5 inline-flex items-center gap-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] text-sm font-medium text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag</span>
            <span className="font-mono-nums text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
              {cartCount}
            </span>
          </button>

          {user ? (
            <button
              type="button"
              onClick={onOpenAccount}
              className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-sm font-medium hover:bg-[#143326] dark:hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0 max-w-[170px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-sm font-medium hover:bg-[#143326] dark:hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
