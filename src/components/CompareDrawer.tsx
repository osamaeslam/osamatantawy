import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Scale,
  ShoppingCart,
  MessageCircle,
  Trash2,
  Star,
  Check,
  Package,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { normalizeImageUrl } from '../services/image-url';
import { getSafeImageSrc } from '../utils/imageHelper';
import { getStockMeta } from '../utils/stockStatus';
import { createProductWhatsAppUrl } from '../services/whatsapp-order';
import {
  STOREFRONT_TEXT,
  getLocalizedProductName,
  getLocalizedProductDescription,
  getLocalizedProductSummary,
  translateSectorLabel,
  translateSubcategoryLabel,
} from '../i18n/translations';

interface SpecRow {
  id: string;
  label: string;
  getValue: (idx: number) => string;
  isMono?: boolean;
}

export const CompareDrawer: React.FC = () => {
  const {
    compareList,
    isCompareDrawerOpen,
    setIsCompareDrawerOpen,
    removeFromCompare,
    clearCompare,
    addToCart,
    stockStatusMap,
    setQuickViewProduct,
    language,
  } = useApp();

  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].compare;
  const tp = STOREFRONT_TEXT[language].productDetail;
  const tq = STOREFRONT_TEXT[language].quickView;
  const th = STOREFRONT_TEXT[language].home;

  const [highlightDiffOnly, setHighlightDiffOnly] = useState(false);
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    if (!isCompareDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCompareDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCompareDrawerOpen, setIsCompareDrawerOpen]);

  const specRows: SpecRow[] = useMemo(() => {
    return [
      {
        id: 'sector',
        label: t.rows.sector,
        getValue: (i) => {
          const p = compareList[i];
          if (!p) return t.unspecified;
          return translateSectorLabel(p.sector || p.categoryAr, language) || t.unspecified;
        },
      },
      {
        id: 'family',
        label: t.rows.family,
        getValue: (i) => {
          const p = compareList[i];
          if (!p) return t.standard;
          const raw = p.familyName || p.itemGroup;
          return raw ? translateSubcategoryLabel(raw, language) : t.standard;
        },
      },
      {
        id: 'brand',
        label: t.rows.brand,
        getValue: (i) => compareList[i]?.brand || STOREFRONT_TEXT[language].brandName,
      },
      {
        id: 'code',
        label: t.rows.code,
        getValue: (i) =>
          compareList[i]?.unifiedCode || compareList[i]?.itemNumber || '—',
        isMono: true,
      },
      {
        id: 'size',
        label: t.rows.size,
        getValue: (i) => {
          const p = compareList[i];
          if (!p) return '—';
          const variants =
            Array.isArray(p.sizevariants) && p.sizevariants.length > 0
              ? p.sizevariants.join(' · ')
              : p.size || t.standard;
          return variants;
        },
      },
      {
        id: 'color',
        label: t.rows.color,
        getValue: (i) => compareList[i]?.color || t.asAvailable,
      },
      {
        id: 'stock',
        label: t.rows.stock,
        getValue: (i) => {
          const p = compareList[i];
          if (!p) return '—';
          return getStockMeta(p, stockStatusMap, language).label;
        },
      },
      {
        id: 'rating',
        label: t.rows.rating,
        getValue: (i) => {
          const p = compareList[i];
          if (!p) return '—';
          return `${p.overallrating || 4.8} / 5 (${p.reviews?.length || 0} ${tp.reviewsWord})`;
        },
        isMono: true,
      },
      {
        id: 'description',
        label: t.rows.description,
        getValue: (i) => {
          const p = compareList[i];
          if (!p) return '—';
          return getLocalizedProductDescription(p, language) || getLocalizedProductSummary(p, language) || '—';
        },
      },
    ];
  }, [compareList, stockStatusMap, language, t, tp]);

  if (compareList.length === 0) return null;

  return (
    <>
      {/* Floating mini comparison bar */}
      {!isCompareDrawerOpen && (
        <div
          className={`fixed bottom-18 md:bottom-5 left-3 right-3 ${
            isRtl ? 'md:left-auto md:right-6' : 'md:right-auto md:left-6'
          } z-40 flex justify-center md:justify-start pointer-events-none`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="pointer-events-auto bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 px-3 py-2 flex items-center gap-3 max-w-full">
            <div className="flex items-center gap-1.5 shrink-0">
              <Scale size={15} className="text-amber-400" />
              <span className="text-xs font-black whitespace-nowrap tabular-nums">
                {t.barTitle(compareList.length)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {compareList.map((item) => {
                const itemName = getLocalizedProductName(item, language);
                return (
                  <div
                    key={item.id}
                    className="relative w-8 h-8 rounded-md bg-white border border-slate-600 shrink-0 overflow-hidden group"
                    title={itemName}
                  >
                    <img
                      src={getSafeImageSrc(normalizeImageUrl(item.previewimage, undefined, 100))}
                      referrerPolicy="no-referrer"
                      alt={itemName}
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCompare(item.id)}
                      aria-label={itemName}
                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsCompareDrawerOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg transition whitespace-nowrap shrink-0"
              >
                {t.compareNow}
              </button>
              <button
                type="button"
                onClick={clearCompare}
                aria-label={t.clearAria}
                className="p-1.5 text-slate-400 hover:text-white transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Side-by-Side Comparison Modal */}
      {isCompareDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end md:items-center justify-center md:p-6"
          onClick={() => setIsCompareDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t.modalTitle}
        >
          <div
            className="bg-white w-full max-w-6xl max-h-[92vh] rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <Scale size={20} className="text-blue-900 shrink-0" />
                <div>
                  <h2 className="text-sm sm:text-base font-black text-gray-900">
                    {t.modalTitle}
                  </h2>
                  <p className="text-[11px] text-gray-500 font-mono tabular-nums">
                    {t.modalSub(compareList.length)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {compareList.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setHighlightDiffOnly((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap shrink-0 ${
                      highlightDiffOnly
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {highlightDiffOnly ? t.showAllSpecs : t.diffOnly}
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearCompare}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Trash2 size={13} />
                  <span>{t.clearAll}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCompareDrawerOpen(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  aria-label={STOREFRONT_TEXT[language].about.close}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Matrix Body */}
            <div className="overflow-auto flex-1 p-4 sm:p-5 bg-slate-50/50">
              {compareList.length < 2 && (
                <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2.5 rounded-xl text-xs font-bold">
                  {t.addMoreHint}
                </div>
              )}

              <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
                <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} text-xs border-collapse min-w-[640px]`}>
                  <thead>
                    <tr className="border-b border-gray-200 align-top">
                      <th className="p-4 w-44 bg-slate-50 text-gray-700 font-black">{t.modelCol}</th>
                      {compareList.map((product) => {
                        const pName = getLocalizedProductName(product, language);
                        return (
                          <th key={product.id} className={`p-4 min-w-[210px] ${isRtl ? 'border-r' : 'border-l'} border-gray-100`}>
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[11px] font-bold text-gray-500">
                                  {product.brand || STOREFRONT_TEXT[language].brandName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFromCompare(product.id)}
                                  className="text-gray-400 hover:text-red-600 p-1 rounded"
                                  aria-label={pName}
                                >
                                  <X size={14} />
                                </button>
                              </div>

                              <div
                                onClick={() => {
                                  setIsCompareDrawerOpen(false);
                                  setQuickViewProduct(product);
                                }}
                                className="h-32 w-full bg-slate-50 border border-gray-100 rounded-lg p-2 flex items-center justify-center cursor-pointer overflow-hidden"
                              >
                                {product.previewimage || product.imageLink ? (
                                  <img
                                    src={getSafeImageSrc(
                                      normalizeImageUrl(
                                        product.previewimage || product.imageLink || '',
                                        undefined,
                                        400
                                      )
                                    )}
                                    referrerPolicy="no-referrer"
                                    alt={pName}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                ) : (
                                  <Package size={24} className="text-gray-300" />
                                )}
                              </div>

                              <h3
                                onClick={() => {
                                  setIsCompareDrawerOpen(false);
                                  setQuickViewProduct(product);
                                }}
                                className="text-xs sm:text-sm font-black text-gray-900 hover:text-blue-900 cursor-pointer leading-snug line-clamp-2"
                              >
                                {pName}
                              </h3>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {specRows.map((row) => {
                      const values = compareList.map((_, idx) => row.getValue(idx));
                      const uniqueCount = new Set(
                        values.map((v) => v.trim().toLowerCase())
                      ).size;
                      const isDifferent = compareList.length > 1 && uniqueCount > 1;

                      if (highlightDiffOnly && !isDifferent) return null;

                      return (
                        <tr
                          key={row.id}
                          className={isDifferent ? 'bg-blue-50/35' : 'bg-white'}
                        >
                          <td className="p-3.5 bg-slate-50/80 font-bold text-gray-700 align-top">
                            <span>{row.label}</span>
                            {isDifferent && (
                              <span className="block text-[10px] text-blue-800 font-bold mt-0.5">
                                {t.differencePoint}
                              </span>
                            )}
                          </td>
                          {values.map((val, colIdx) => {
                            const p = compareList[colIdx];
                            const stockMeta = getStockMeta(p, stockStatusMap, language);
                            return (
                              <td
                                key={p.id}
                                className={`p-3.5 ${isRtl ? 'border-r' : 'border-l'} border-gray-100 align-top leading-relaxed ${
                                  row.isMono ? 'font-mono tabular-nums' : ''
                                } ${
                                  row.id === 'stock'
                                    ? stockMeta.status === 'available'
                                      ? 'text-emerald-800 font-bold'
                                      : stockMeta.status === 'low_stock'
                                      ? 'text-amber-800 font-bold'
                                      : 'text-red-700 font-bold'
                                    : 'text-gray-800'
                                }`}
                              >
                                {row.id === 'rating' ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Star size={12} className="text-amber-500 fill-amber-400" />
                                    <span>{val}</span>
                                  </span>
                                ) : (
                                  val
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* Action Row */}
                    <tr className="bg-slate-50 border-t border-gray-200">
                      <td className="p-4 font-black text-gray-800">{t.actionRow}</td>
                      {compareList.map((product) => {
                        const stockMeta = getStockMeta(product, stockStatusMap, language);
                        const justAdded = addedFeedbackId === product.id;

                        return (
                          <td key={product.id} className={`p-4 ${isRtl ? 'border-r' : 'border-l'} border-gray-100`}>
                            <div className="space-y-2">
                              <button
                                type="button"
                                disabled={!stockMeta.canOrder}
                                onClick={() => {
                                  addToCart(product, 1);
                                  setAddedFeedbackId(product.id);
                                  setTimeout(() => {
                                    setAddedFeedbackId((curr) =>
                                      curr === product.id ? null : curr
                                    );
                                  }, 2000);
                                }}
                                className={`w-full py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                  !stockMeta.canOrder
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : justAdded
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-blue-900 hover:bg-blue-950 text-white'
                                }`}
                              >
                                {justAdded ? <Check size={14} /> : <ShoppingCart size={14} />}
                                <span>
                                  {justAdded
                                    ? t.addedBtn
                                    : stockMeta.canOrder
                                    ? t.selectAddBtn
                                    : th.outOfStock}
                                </span>
                              </button>

                              <a
                                href={createProductWhatsAppUrl(product)}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                              >
                                <MessageCircle size={14} />
                                <span>{tq.whatsappBtn}</span>
                              </a>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompareDrawer;
