export function VentureStory() {
  const comparisons = [
    {
      brand: 'Himalayan Crunch',
      price: '₹49',
      pack: '35g Trial Pack',
      focus: 'Student-first pricing, bold Indian flavours & campus hubs',
      highlight: true,
    },
    {
      brand: 'Legacy Packaged Jars',
      price: '₹113–₹150',
      pack: '60g–100g Jar',
      focus: 'High single-ticket spend for everyday campus snacking',
      highlight: false,
    },
    {
      brand: 'Fried Chips & Namkeen',
      price: '₹20–₹50',
      pack: 'Fried Snack',
      focus: 'High oil, high salt & post-snack sluggishness',
      highlight: false,
    },
  ];

  return (
    <section id="story" className="py-14 sm:py-18">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-2">
              Built in Dehradun · Expanding to Delhi-NCR
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
              Why students shouldn&apos;t have to choose between tasty and healthy
            </h2>
            <p className="mt-4 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed">
              Between lectures, hostel study sessions, and evening commutes, healthy snacks often
              feel bland or overpriced—pushing everyone back to fried chips and namkeen.
            </p>
            <p className="mt-3 text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed">
              Himalayan Crunch pairs slow-roasted makhana with vibrant Indian seasonings in a ₹49
              pocket-ready trial pack, distributed directly through college canteens, local kirana
              stores, and student ambassadors.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151B19] overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                <h3 className="font-display text-base font-semibold text-stone-900 dark:text-white">
                  Everyday Snack Comparison
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400">
                      <th className="py-3 px-6 font-medium">Option</th>
                      <th className="py-3 px-4 font-medium">Pack Price</th>
                      <th className="py-3 px-4 font-medium">Format</th>
                      <th className="py-3 px-6 font-medium">Snacking Experience</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                    {comparisons.map((row) => (
                      <tr
                        key={row.brand}
                        className={
                          row.highlight
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/30 font-medium text-stone-900 dark:text-white'
                            : 'text-stone-600 dark:text-stone-300'
                        }
                      >
                        <td className="py-3.5 px-6 whitespace-nowrap">{row.brand}</td>
                        <td className="py-3.5 px-4 font-mono-nums whitespace-nowrap">{row.price}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">{row.pack}</td>
                        <td className="py-3.5 px-6">{row.focus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
