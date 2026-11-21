import React, { useMemo, useState } from 'react';
import { BellRing, CheckCircle2, ArrowLeftRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import type { Product } from '../types';
import { useApp } from '../context/AppContext';
import { findSmartAlternatives, stockAlertsService } from '../services/stock-alerts.service';
import { normalizeImageUrl } from '../services/image-url';
import { getSafeImageSrc } from '../utils/imageHelper';
import { getStockMeta } from '../utils/stockStatus';
import { offlineStoreService, isLikelyOfflineError } from '../services/offline-store.service';
import { STOREFRONT_TEXT, getLocalizedProductName } from '../i18n/translations';

interface OutOfStockAssistantProps {
  product: Product;
  onSelectAlternative: (alternative: Product) => void;
}

export const OutOfStockAssistant: React.FC<OutOfStockAssistantProps> = ({
  product,
  onSelectAlternative,
}) => {
  const { products, stockStatusMap, language } = useApp();
  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].outOfStock;

  const alternatives = useMemo(
    () => findSmartAlternatives(product, products, stockStatusMap, 3),
    [product, products, stockStatusMap]
  );

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSavedMessage('');

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      setError(t.invalidPhone);
      return;
    }

    setSubmitting(true);
    const payload = {
      productId: product.id,
      productName: product.nameAr,
      productCode: product.unifiedCode || product.itemNumber,
      brand: product.brand,
      category: product.itemGroup || product.categoryAr,
      customerName: customerName.trim() || (isRtl ? 'عميل مهتم' : 'Interested Customer'),
      customerPhone: cleanPhone,
    };

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await stockAlertsService.addAlert(payload);
        await offlineStoreService.enqueueAction('stock_alert', payload);
        setSavedMessage(t.offlineSaved);
      } else {
        const res = await stockAlertsService.addAlert(payload);
        setSavedMessage(res.duplicate ? t.duplicateMsg : t.successMsg);
      }
      setCustomerName('');
      setCustomerPhone('');
    } catch (err: any) {
      if (isLikelyOfflineError(err)) {
        await offlineStoreService.enqueueAction('stock_alert', payload);
        setSavedMessage(t.offlineSaved);
        setCustomerName('');
        setCustomerPhone('');
      } else {
        setError(err?.message || t.errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`space-y-3 border border-amber-200 bg-amber-50/70 rounded-2xl p-3.5 ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* 1. Notify Me When Back in Stock */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
              <BellRing size={16} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">{t.title}</h4>
              <p className="text-[11px] text-slate-600">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {savedMessage ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            <span>{savedMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="sm:col-span-4 px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                dir="ltr"
                required
                className="sm:col-span-5 px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-left text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={submitting}
                className="sm:col-span-3 px-3 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
                <span>{t.submitBtn}</span>
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-red-700 font-bold flex items-center gap-1">
                <AlertCircle size={12} />
                <span>{error}</span>
              </p>
            )}
          </form>
        )}
      </div>

      {/* 2. Smart In-Stock Alternatives */}
      {alternatives.length > 0 && (
        <div className="pt-2.5 border-t border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-slate-900 flex items-center gap-1.5">
              <ArrowLeftRight size={14} className="text-blue-800" />
              <span>{t.alternativesTitle(alternatives.length)}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {alternatives.map((alt) => {
              const altImg = getSafeImageSrc(
                normalizeImageUrl(alt.previewimage || alt.imageLink || '', undefined, 240)
              );
              const altStock = getStockMeta(alt, stockStatusMap, language);
              const altName = getLocalizedProductName(alt, language);
              return (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => onSelectAlternative(alt)}
                  className={`w-full p-2 bg-white hover:bg-blue-50 border border-amber-200/80 hover:border-blue-300 rounded-xl flex items-center justify-between gap-2.5 ${isRtl ? 'text-right' : 'text-left'} transition group`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={altImg}
                      referrerPolicy="no-referrer"
                      alt={altName}
                      className="w-11 h-11 rounded-lg object-contain bg-gray-50 border border-gray-100 p-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-900">
                        {altName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 flex-wrap">
                        {alt.brand && <span className="font-bold text-blue-900">{alt.brand}</span>}
                        {alt.size && <span>· {alt.size}</span>}
                        <span className="text-emerald-700 font-bold inline-flex items-center gap-0.5">
                          <ShieldCheck size={10} />
                          {altStock.shortLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg shrink-0">
                    {t.viewAlternative}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
