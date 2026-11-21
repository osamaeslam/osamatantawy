import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ShoppingCart,
  Heart,
  Check,
  Minus,
  Plus,
  MessageCircle,
  Star,
  Barcode,
  ShieldCheck,
  Expand,
  ArrowLeft,
  ArrowRight,
  Scale,
  Image as ImageIcon
} from 'lucide-react';
import { createProductWhatsAppUrl } from '../services/whatsapp-order';
import { normalizeImageUrl } from '../services/image-url';
import { getSafeImageSrc } from '../utils/imageHelper';
import { getStockMeta } from '../utils/stockStatus';
import { OutOfStockAssistant } from './OutOfStockAssistant';
import {
  STOREFRONT_TEXT,
  getLocalizedProductName,
  getLocalizedProductCategory,
  getLocalizedProductSummary,
  translateSectorLabel,
} from '../i18n/translations';

export const QuickViewModal: React.FC = () => {
  const {
    quickViewProduct,
    setQuickViewProduct,
    setSelectedProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setActiveTab,
    stockStatusMap,
    toggleCompare,
    isInCompare,
    setIsCompareDrawerOpen,
    setPosterProduct,
    language,
  } = useApp();

  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].quickView;
  const th = STOREFRONT_TEXT[language].home;

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Reset local modal state whenever a different product is opened
  useEffect(() => {
    if (quickViewProduct) {
      setQuantity(1);
      setSelectedVariant(quickViewProduct.sizevariants?.[0] || quickViewProduct.size || '');
      setIsAdded(false);
    }
  }, [quickViewProduct?.id]);

  // Support closing modal with Escape key
  useEffect(() => {
    if (!quickViewProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuickViewProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickViewProduct, setQuickViewProduct]);

  if (!quickViewProduct) return null;

  const inWish = isInWishlist(quickViewProduct.id);
  const primaryImage = getSafeImageSrc(
    normalizeImageUrl(quickViewProduct.previewimage || quickViewProduct.imageLink || '', undefined, 1000)
  );
  const codeLabel = quickViewProduct.unifiedCode || quickViewProduct.itemNumber || '';
  const stockMeta = getStockMeta(quickViewProduct, stockStatusMap, language);
  const pName = getLocalizedProductName(quickViewProduct, language);
  const pCategory = getLocalizedProductCategory(quickViewProduct, language);
  const pSummary = getLocalizedProductSummary(quickViewProduct, language);

  const handleAddToCart = () => {
    addToCart(quickViewProduct, quantity, selectedVariant);
    setIsAdded(true);
  };

  const handleOpenFullDetails = () => {
    const productToOpen = quickViewProduct;
    setQuickViewProduct(null);
    setSelectedProduct(productToOpen);
  };

  const handleGoToCart = () => {
    setQuickViewProduct(null);
    setActiveTab('cart');
  };

  const DirArrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={() => setQuickViewProduct(null)}
      role="dialog"
      aria-modal="true"
      aria-label={pName}
    >
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setQuickViewProduct(null)}
          className={`absolute top-3.5 ${isRtl ? 'left-3.5' : 'right-3.5'} z-20 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition shadow-xs`}
          aria-label={STOREFRONT_TEXT[language].about.close}
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch">
          {/* Product Image */}
          <div className="sm:col-span-5 bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center justify-center relative aspect-square sm:aspect-auto sm:min-h-[260px]">
            {quickViewProduct.brand && (
              <span className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} bg-blue-900 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-xs`}>
                {quickViewProduct.brand}
              </span>
            )}
            <img
              src={primaryImage}
              referrerPolicy="no-referrer"
              alt={pName}
              className="max-h-60 w-full object-contain"
            />
          </div>

          {/* Basic Product Info & Direct Add to Cart */}
          <div className="sm:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              {/* Category / Group & Rating */}
              <div className={`flex flex-wrap items-center justify-between gap-2 ${isRtl ? 'pl-8' : 'pr-8'}`}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] bg-blue-50 text-blue-900 font-bold px-2.5 py-0.5 rounded-md border border-blue-100">
                    {pCategory}
                  </span>
                  {codeLabel && (
                    <span className="text-[11px] font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Barcode size={12} className="text-gray-500" />
                      <span>{codeLabel}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={14} className="fill-amber-400" />
                  <span className="text-xs font-bold text-gray-800">{quickViewProduct.overallrating}</span>
                  <span className="text-[11px] text-gray-400">({quickViewProduct.reviews?.length || 0})</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-black text-gray-900 leading-snug">
                {pName}
              </h2>

              {/* Basic Summary */}
              {pSummary && (
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {pSummary}
                </p>
              )}

              {/* Basic Specs Chips */}
              {(quickViewProduct.size || quickViewProduct.color || quickViewProduct.sector) && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {quickViewProduct.sector && (
                    <span className="text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-lg font-bold">
                      {t.sector} {translateSectorLabel(quickViewProduct.sector, language)}
                    </span>
                  )}
                  {quickViewProduct.size && (
                    <span className="text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-lg font-bold">
                      {t.size} {quickViewProduct.size}
                    </span>
                  )}
                  {quickViewProduct.color && (
                    <span className="text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-lg font-bold">
                      {t.color} {quickViewProduct.color}
                    </span>
                  )}
                </div>
              )}

              {/* Variants Selector */}
              {quickViewProduct.sizevariants && quickViewProduct.sizevariants.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-gray-700 block">{t.variants}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickViewProduct.sizevariants.map((variant) => (
                      <button
                        key={variant}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl border font-bold transition ${
                          selectedVariant === variant
                            ? 'border-blue-900 bg-blue-50 text-blue-900'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability & Quantity */}
              <div className={`flex flex-wrap items-center justify-between gap-2 border rounded-2xl px-3 py-2 ${stockMeta.badgeClass}`}>
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${stockMeta.dotClass}`} />
                  <ShieldCheck size={15} className="shrink-0" />
                  <span>
                    {stockMeta.canOrder
                      ? `${stockMeta.label} • ${t.canOrderSuffix}`
                      : `${stockMeta.label} — ${t.outOfStockSuffix}`}
                  </span>
                </div>

                {stockMeta.canOrder && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-700">{t.quantity}</span>
                    <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 transition"
                        aria-label="-"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-2.5 text-xs font-black text-gray-900 tabular-nums">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 transition"
                        aria-label="+"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {stockMeta.status === 'out_of_stock' && (
                <OutOfStockAssistant
                  product={quickViewProduct}
                  onSelectAlternative={(alt) => setQuickViewProduct(alt)}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!stockMeta.canOrder}
                  onClick={handleAddToCart}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                    stockMeta.canOrder
                      ? 'bg-blue-900 hover:bg-blue-950 active:scale-98 text-white shadow-md'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={17} />
                  <span>{stockMeta.canOrder ? t.addToCart : th.outOfStock}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleCompare(quickViewProduct);
                  }}
                  className={`p-2.5 border rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                    isInCompare(quickViewProduct.id)
                      ? 'border-blue-900 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-900'
                  }`}
                  title={isInCompare(quickViewProduct.id) ? th.inCompareTitle : th.compareTitle}
                >
                  <Scale size={16} />
                  <span>{isInCompare(quickViewProduct.id) ? t.inCompare : t.compare}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(quickViewProduct)}
                  className="p-2.5 border border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-500 rounded-xl transition"
                  title={STOREFRONT_TEXT[language].header.wishlistTitle}
                  aria-label={STOREFRONT_TEXT[language].header.wishlistTitle}
                >
                  <Heart size={18} className={inWish ? 'text-red-500 fill-red-500' : ''} />
                </button>
              </div>
              {isInCompare(quickViewProduct.id) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickViewProduct(null);
                    setIsCompareDrawerOpen(true);
                  }}
                  className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Scale size={14} />
                  <span>{t.openCompareTable}</span>
                </button>
              )}

              {isAdded && (
                <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Check size={15} />
                    <span>{t.addedSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoToCart}
                    className="bg-white text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded-lg text-[11px] font-black transition flex items-center gap-1 shrink-0"
                  >
                    <span>{t.goToCart}</span>
                    <DirArrow size={12} />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <a
                  href={createProductWhatsAppUrl(quickViewProduct, quantity, selectedVariant)}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <MessageCircle size={15} />
                  <span>{t.whatsappBtn}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    const p = quickViewProduct;
                    setQuickViewProduct(null);
                    setPosterProduct(p);
                  }}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <ImageIcon size={14} />
                  <span>{t.posterBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenFullDetails}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Expand size={14} />
                  <span>{t.detailsReviewsBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
