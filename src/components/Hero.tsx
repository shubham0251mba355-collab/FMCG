import { useState } from 'react';
import { ArrowRight, Store } from 'lucide-react';

interface HeroProps {
  supplierCount: number;
}

export function Hero({ supplierCount }: HeroProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section id="top" className="pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-stone-200 dark:border-stone-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Editorial Column */}
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-4">
                Dehradun & Delhi-NCR · Direct-to-Consumer Makhana
              </p>

              <h1
                className="font-display font-semibold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08] max-w-xl"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', textWrap: 'balance' }}
              >
                Flavoured crunch built for campus breaks, at ₹49 a pack.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl">
                Slow-roasted lotus seeds seasoned in bold Indian flavours—giving students and young
                professionals a lighter, non-greasy alternative to fried chips without ₹150 supermarket markups.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#packs"
                className="min-h-[44px] px-6 py-3 inline-flex items-center gap-2 rounded-lg bg-[#1B4332] dark:bg-emerald-400 text-white dark:text-stone-950 text-sm font-semibold hover:bg-[#143326] dark:hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Shop ₹49 Trial Packs</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#partner"
                className="min-h-[44px] px-5 py-3 inline-flex items-center gap-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#151B19] text-stone-800 dark:text-stone-100 text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Store className="w-4 h-4" />
                <span>Onboard Local Business</span>
              </a>
            </div>
          </div>

          {/* Right Media Column */}
          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[280px] sm:min-h-[360px] rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-200 dark:bg-stone-900">
              {!imgFailed ? (
                <img
                  src="/src/assets/images/hero_himalayan_makhana_1795096799261.jpg"
                  alt="Himalayan Crunch slow-roasted flavoured makhana in stoneware bowls and kraft pouches"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full lg:h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 text-stone-200">
                  <div className="text-center">
                    <p className="font-display text-2xl font-semibold">Himalayan Crunch</p>
                    <p className="mt-1 text-sm text-stone-400">Slow-Roasted Flavoured Makhana · ₹49</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/35 to-transparent text-white">
                <p className="text-xs font-medium text-stone-200">
                  Fresh Batch · Roasted Not Fried · Zero Palm Oil
                </p>
                <p className="mt-0.5 text-sm font-medium text-white">
                  Order D2C or pick up from {supplierCount} verified local campus & neighbourhood hubs
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 3-Column Venture Proof Bar */}
        <div className="mt-10 pt-8 border-t border-stone-200 dark:border-stone-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="font-mono-nums text-2xl font-semibold text-stone-900 dark:text-stone-100">
              ₹49
            </p>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              Pocket-friendly 35g student trial pack—under half the price of legacy jars
            </p>
          </div>
          <div>
            <p className="font-mono-nums text-2xl font-semibold text-stone-900 dark:text-stone-100">
              {supplierCount} Local Hubs
            </p>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              College canteens, student ambassadors & stores across Dehradun and Delhi-NCR
            </p>
          </div>
          <div>
            <p className="font-mono-nums text-2xl font-semibold text-stone-900 dark:text-stone-100">
              15–30 min
            </p>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              Direct campus gate drop or counter pickup with verified supplier ratings
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
