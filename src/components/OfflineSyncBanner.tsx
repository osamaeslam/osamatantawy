import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Download, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useApp } from '../context/AppContext';
import { STOREFRONT_TEXT, getNumberLocale } from '../i18n/translations';

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, lastSyncedCount, triggerSync } = useOnlineStatus();
  const {
    products,
    offlineDownloadProgress,
    cancelOfflineCatalogDownload,
    language,
  } = useApp();

  const t = STOREFRONT_TEXT[language].offline;
  const numLocale = getNumberLocale(language);

  const shouldShow =
    !isOnline ||
    pendingCount > 0 ||
    isSyncing ||
    lastSyncedCount > 0 ||
    offlineDownloadProgress.active ||
    offlineDownloadProgress.completed;

  if (!shouldShow) return null;

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="fixed bottom-16 md:bottom-4 left-3 right-3 md:left-auto md:right-4 md:max-w-md z-40 space-y-2 pointer-events-none"
    >
      {!isOnline && (
        <div className="pointer-events-auto bg-slate-900 text-white border border-amber-400/50 rounded-2xl px-4 py-3 shadow-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
            <WifiOff size={16} />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-xs font-black text-amber-300">{t.offlineTitle}</p>
            <p className="text-[11px] text-slate-200 leading-relaxed tabular-nums">
              {t.offlineDesc(products.length.toLocaleString(numLocale))}
            </p>
            {pendingCount > 0 && (
              <p className="text-[11px] font-bold text-amber-200 tabular-nums pt-0.5">
                {t.pendingOrders(pendingCount)}
              </p>
            )}
          </div>
        </div>
      )}

      {isOnline && (pendingCount > 0 || isSyncing) && (
        <div className="pointer-events-auto bg-blue-950 text-white border border-blue-700 rounded-2xl px-4 py-2.5 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <RefreshCw size={15} className={`shrink-0 text-amber-300 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold truncate tabular-nums">
              {isSyncing ? t.syncing : t.pendingSyncCount(pendingCount)}
            </span>
          </div>
          {!isSyncing && (
            <button
              type="button"
              onClick={() => void triggerSync()}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[11px] font-black whitespace-nowrap shrink-0 transition"
            >
              {t.syncNow}
            </button>
          )}
        </div>
      )}

      {isOnline && lastSyncedCount > 0 && pendingCount === 0 && (
        <div className="pointer-events-auto bg-emerald-700 text-white rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span className="text-xs font-bold tabular-nums">
            {t.syncedSuccess(lastSyncedCount)}
          </span>
        </div>
      )}

      {offlineDownloadProgress.active && (
        <div className="pointer-events-auto bg-white text-slate-900 border border-blue-200 rounded-2xl px-4 py-3 shadow-xl space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-blue-950">
              <Download size={14} className="text-blue-700" />
              <span>{t.preparingTitle}</span>
            </div>
            <button
              type="button"
              onClick={cancelOfflineCatalogDownload}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              aria-label="Cancel"
            >
              <X size={14} />
            </button>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-900 transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    ((offlineDownloadProgress.downloaded || 0) /
                      Math.max(1, offlineDownloadProgress.total || 1)) *
                      100
                  )
                )}%`,
              }}
            />
          </div>
          <div className="text-[11px] text-slate-600 font-bold tabular-nums flex items-center justify-between">
            <span>{t.savedCount(offlineDownloadProgress.downloaded.toLocaleString(numLocale))}</span>
            <span>{t.ofTotal(offlineDownloadProgress.total.toLocaleString(numLocale))}</span>
          </div>
        </div>
      )}

      {offlineDownloadProgress.completed && !offlineDownloadProgress.active && (
        <div className="pointer-events-auto bg-emerald-700 text-white rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span className="text-xs font-bold tabular-nums">
            {t.completedMsg(offlineDownloadProgress.downloaded.toLocaleString(numLocale))}
          </span>
        </div>
      )}
    </div>
  );
};
