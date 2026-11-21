import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Clock, Flame, ShoppingCart, Heart, Sparkles, Edit3, Scale } from 'lucide-react';
import { getSafeImageSrc } from '../utils/imageHelper';
import { normalizeImageUrl } from '../services/image-url';
import { INITIAL_HOMEPAGE_CONFIG } from '../data/mockData';
import { BundlesShowcase } from './BundlesShowcase';
import { getStockMeta } from '../utils/stockStatus';
import { productService } from '../supabase/products.service';
import {
  STOREFRONT_TEXT,
  getLocalizedProductName,
  getLocalizedProductCategory,
} from '../i18n/translations';

export const DealsPage: React.FC = () => {
  const {
    products,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setQuickViewProduct,
    homePageConfig,
    stockStatusMap,
    supabaseProductCount,
    mergeProductsIntoState,
    toggleCompare,
    isInCompare,
    language,
  } = useApp();

  const t = STOREFRONT_TEXT[language];
  const td = t.deals;
  const th = t.home;
  const isRtl = language === 'ar';

  const dealsBanner = homePageConfig.sectionBanners?.deals || INITIAL_HOMEPAGE_CONFIG.sectionBanners!.deals;

  useEffect(() => {
    if (supabaseProductCount > products.length) {
      productService
        .getMappedDeals(24)
        .then((deals) => mergeProductsIntoState(deals))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseProductCount]);

  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 22 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dealProducts =
    products.filter((p) => p.isDeal).length > 0
      ? products.filter((p) => p.isDeal)
      : products.slice(0, 8);

  const bannerTitle = isRtl ? dealsBanner.title : th.flashDealsTitle;
  const bannerBadge = isRtl ? dealsBanner.badge : th.flashDealsBtn;
  const bannerSubtitle = isRtl
    ? dealsBanner.subtitle
    : th.flashDealsSub;

  return (
    <div className="space-y-6 pb-16">
      {/* Thunder Deals Hero Header */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${
          dealsBanner.bgGradient || 'from-blue-950 via-indigo-900 to-blue-900'
        } text-white p-6 md:p-8 shadow-md`}
      >
        {dealsBanner.image && (
          <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
            <img
              src={normalizeImageUrl(dealsBanner.image, undefined, 1000)}
              referrerPolicy="no-referrer"
              alt={bannerTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-yellow-300">
                <Zap size={14} className="fill-yellow-300" />
                <span>{bannerBadge}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#admin-cms-sections';
                  window.dispatchEvent(new HashChangeEvent('hashchange'));
                }}
                className="text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded-full border border-white/20 transition inline-flex items-center gap-1"
                title={td.editBanner}
              >
                <Edit3 size={12} />
                <span>{td.editBanner}</span>
              </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{bannerTitle}</h1>
            <p className="text-xs md:text-sm text-blue-100">
              {bannerSubtitle}{' '}
              <strong className="text-yellow-300">({homePageConfig.hotline || '15218'})</strong>
            </p>
          </div>

          {/* Countdown Clock Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center shrink-0 self-start md:self-auto">
            <span className="text-[11px] font-bold text-blue-100 mb-2 flex items-center gap-1">
              <Clock size={14} />
              <span>{td.timeRemaining}</span>
            </span>
            <div className="flex items-center gap-2 font-mono text-center" dir="ltr">
              <div className="bg-black/40 rounded-xl px-3 py-2 min-w-[50px]">
                <span className="text-xl md:text-2xl font-black text-yellow-300 block">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-gray-300 font-sans">{td.hours}</span>
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="bg-black/40 rounded-xl px-3 py-2 min-w-[50px]">
                <span className="text-xl md:text-2xl font-black text-yellow-300 block">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-gray-300 font-sans">{td.minutes}</span>
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="bg-black/40 rounded-xl px-3 py-2 min-w-[50px]">
                <span className="text-xl md:text-2xl font-black text-yellow-300 block">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-gray-300 font-sans">{td.seconds}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      {dealProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-2">
          <Sparkles size={32} className="text-gray-300 mx-auto" />
          <h3 className="text-base font-black text-gray-800">{td.noDealsTitle}</h3>
          <p className="text-xs text-gray-500">{td.noDealsSub}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealProducts.map((product, idx) => {
            const inWish = isInWishlist(product.id);
            const percentClaimed = 60 + ((idx * 11) % 35);
            const stockMeta = getStockMeta(product, stockStatusMap, language);
            const displayTitle = getLocalizedProductName(product, language);
            const displayCat = getLocalizedProductCategory(product, language);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1">
                    <Flame size={14} className="fill-yellow-400 text-yellow-400" />
                    <span>{product.brand}</span>
                  </span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">
                    {td.certifiedWarranty}
                  </span>
                </div>

                <div className="relative p-6 bg-gray-50 flex items-center justify-center">
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-3 end-3 p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-xs transition z-10"
                  >
                    <Heart size={18} className={inWish ? 'text-red-500 fill-red-500' : ''} />
                  </button>

                  <div
                    onClick={() => setQuickViewProduct(product)}
                    className="w-48 h-48 cursor-pointer flex items-center justify-center"
                  >
                    <img
                      src={getSafeImageSrc(normalizeImageUrl(product.previewimage, undefined, 500))}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      alt={displayTitle}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                    />
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded">
                      {displayCat}
                    </span>
                    <h3
                      onClick={() => setQuickViewProduct(product)}
                      className="text-sm font-bold text-gray-800 hover:text-blue-900 transition cursor-pointer mt-1.5 line-clamp-2"
                    >
                      {displayTitle}
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                      <span>{td.reservationsPct(percentClaimed)}</span>
                      <span className="text-amber-600 font-bold">
                        {stockMeta.status === 'low_stock' ? td.lowStockHint : td.fewLeftHint}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-700 to-indigo-900 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentClaimed}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-md border inline-flex items-center gap-1 ${stockMeta.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${stockMeta.dotClass}`} />
                      <span>{stockMeta.shortLabel}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleCompare(product)}
                        className={`p-2 rounded-xl border transition flex items-center justify-center ${
                          isInCompare(product.id)
                            ? 'bg-blue-900 border-blue-900 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-900'
                        }`}
                        title={isInCompare(product.id) ? th.inCompareTitle : th.compareTitle}
                        aria-label={th.compareTitle}
                      >
                        <Scale size={14} />
                      </button>
                      <button
                        disabled={!stockMeta.canOrder}
                        onClick={() => addToCart(product, 1)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                          stockMeta.canOrder
                            ? 'bg-blue-900 hover:bg-blue-950 active:scale-95 text-white'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart size={14} />
                        <span>{stockMeta.canOrder ? th.addToOrder : th.outOfStock}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BundlesShowcase />
    </div>
  );
};
