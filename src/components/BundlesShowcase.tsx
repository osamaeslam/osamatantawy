import React, { useState } from 'react';
import { Package, ShoppingCart, Check, Sparkles, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { normalizeImageUrl } from '../services/image-url';
import { getSafeImageSrc } from '../utils/imageHelper';
import { STOREFRONT_TEXT, getNumberLocale } from '../i18n/translations';
import type { ProductBundle } from '../types';

export const BundlesShowcase: React.FC = () => {
  const { bundles, addBundleToCart, setActiveTab, language } = useApp();
  const [addedId, setAddedId] = useState<string | null>(null);
  const t = STOREFRONT_TEXT[language].bundles;
  const numLocale = getNumberLocale(language);

  const activeBundles = bundles.filter((b) => b.isActive);
  if (activeBundles.length === 0) return null;

  const handleOrderBundle = (bundle: ProductBundle) => {
    addBundleToCart(bundle);
    setAddedId(bundle.id);
    setTimeout(() => {
      setAddedId((curr) => (curr === bundle.id ? null : curr));
    }, 2500);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base md:text-xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-gray-500">
            {t.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('cart')}
          className="text-xs font-bold text-blue-800 hover:underline self-start sm:self-auto"
        >
          {t.viewCart}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeBundles.map((bundle) => {
          const isAdded = addedId === bundle.id;
          const savings =
            bundle.originalPrice && bundle.originalPrice > bundle.bundlePrice
              ? bundle.originalPrice - bundle.bundlePrice
              : 0;
          const coverImg = getSafeImageSrc(normalizeImageUrl(bundle.image, undefined, 700));

          return (
            <div
              key={bundle.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="relative h-44 bg-slate-50 border-b border-gray-100 overflow-hidden">
                <img
                  src={coverImg}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  alt={bundle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between gap-2 text-white">
                  <div className="min-w-0">
                    {bundle.badge && (
                      <span className="text-[10px] font-bold text-amber-300 block">
                        {bundle.badge}
                      </span>
                    )}
                    <h3 className="text-sm sm:text-base font-black truncate">{bundle.title}</h3>
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  {bundle.subtitle && (
                    <p className="text-xs text-gray-600 leading-relaxed">{bundle.subtitle}</p>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                      <span className="flex items-center gap-1">
                        <Package size={13} className="text-blue-900" />
                        <span>{t.componentsCount(bundle.items.length)}</span>
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs text-gray-700">
                      {bundle.items.map((it, idx) => (
                        <li
                          key={`${it.productId}-${idx}`}
                          className="flex items-center justify-between gap-2 py-1 border-b border-gray-50 last:border-b-0"
                        >
                          <span className="truncate font-semibold">{it.nameAr}</span>
                          <span className="font-mono text-[11px] text-gray-500 shrink-0 tabular-nums">
                            ×{it.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-2.5">
                  {bundle.bundlePrice > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Tag size={13} className="text-emerald-700" />
                        <span className="font-bold text-gray-600">{t.bundlePriceLabel}</span>
                      </div>
                      <div className={language === 'en' ? 'text-right' : 'text-left'}>
                        <strong className="font-mono text-base font-black text-blue-950 tabular-nums">
                          {bundle.bundlePrice.toLocaleString(numLocale)} {t.egp}
                        </strong>
                        {savings > 0 && (
                          <span className="block text-[10px] font-bold text-emerald-700 tabular-nums">
                            {t.savePrefix(savings.toLocaleString(numLocale))}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOrderBundle(bundle)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-900 hover:bg-blue-950 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={15} />
                          <span>{t.addedBundle}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={15} />
                          <span>{t.orderBundle}</span>
                        </>
                      )}
                    </button>
                    {isAdded && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('cart')}
                        className="px-3 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 rounded-xl text-xs font-black shrink-0"
                      >
                        {t.checkoutBtn}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
