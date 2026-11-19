import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api, setStoredToken } from '../lib/api';
import { User, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  initialRole?: UserRole;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function AuthModal({
  isOpen,
  initialMode = 'login',
  initialRole = 'customer',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Dehradun');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.login({ email, password });
        setStoredToken(res.token);
        onSuccess(res.user);
      } else {
        const res = await api.signup({ name, email, password, role, city, phone });
        setStoredToken(res.token);
        onSuccess(res.user);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(demoEmail: string, demoPassword: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: demoEmail, password: demoPassword });
      setStoredToken(res.token);
      onSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] text-stone-900 dark:text-stone-100 shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
          <div>
            <h2 id="auth-modal-title" className="font-display text-xl font-semibold">
              {mode === 'login' ? 'Sign in to Himalayan Crunch' : 'Create your account'}
            </h2>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Order packs, rate local suppliers, or onboard your business
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Segmented Mode Switch */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#1F2724] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                mode === 'signup'
                  ? 'bg-white dark:bg-[#1F2724] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <span className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Account Type
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`px-3 py-2.5 rounded-lg border text-left text-xs transition-colors ${
                        role === 'customer'
                          ? 'border-[#1B4332] dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/50 text-stone-900 dark:text-white'
                          : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900'
                      }`}
                    >
                      <span className="block font-semibold">Customer / Student</span>
                      <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        Shop & rate suppliers
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('supplier')}
                      className={`px-3 py-2.5 rounded-lg border text-left text-xs transition-colors ${
                        role === 'supplier'
                          ? 'border-[#1B4332] dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/50 text-stone-900 dark:text-white'
                          : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900'
                      }`}
                    >
                      <span className="block font-semibold">Distributor / Store</span>
                      <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        Onboard & fulfill orders
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#0E1311] text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      City
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#0E1311] text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="Dehradun">Dehradun</option>
                      <option value="Delhi-NCR">Delhi-NCR</option>
                      <option value="Rishikesh">Rishikesh</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98..."
                      className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#0E1311] text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#0E1311] text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-10 px-3 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#0E1311] text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-sm font-semibold hover:bg-[#143326] dark:hover:bg-emerald-300 disabled:opacity-60 transition-colors"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Log In'
                  : 'Create Account'}
            </button>
          </form>

          {/* Instant Demo Access */}
          <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-2.5">
              Quick preview accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('student@dehradun.edu', 'crunch49')}
                className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#0E1311] text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap"
              >
                Demo Student
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('partner@bidholimart.in', 'partner49')}
                className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#0E1311] text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap"
              >
                Demo Supplier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
