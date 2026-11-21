import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ShieldAlert,
  ImageOff,
  DollarSign,
  Barcode,
  Tag,
  CheckCircle2,
  Pencil,
  Save,
  X,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Loader2,
  Globe,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Package,
} from 'lucide-react';
import type { FirebaseProduct } from '../types/firebase';
import { productService } from '../supabase/products.service';
import { normalizeImageUrl } from '../services/image-url';
import { useApp } from '../context/AppContext';

export interface CatalogHealthCheckProps {
  products?: FirebaseProduct[];
  onRefresh?: () => void | Promise<void>;
}

type IssueType = 'all' | 'broken_image' | 'missing_price' | 'missing_code' | 'missing_meta';

const PAGE_SIZE = 25;
const MAX_LIVE_PROBE = 300;

const isInvalidOrPlaceholderImage = (url?: string): boolean => {
  const raw = (url || '').trim();
  if (!raw) return true;
  if (raw === '/logo.png' || raw === 'logo.png') return true;
  if (raw.length < 8) return true;
  const looksValidScheme =
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('/') ||
    raw.startsWith('data:image/');
  return !looksValidScheme;
};

const hasMissingPrice = (price: unknown): boolean => {
  if (price === null || price === undefined || price === '') return true;
  const n = Number(price);
  return Number.isNaN(n) || n <= 0;
};

const hasMissingUnifiedCode = (p: FirebaseProduct): boolean =>
  !String(p.itemNumber || '').trim() && !String(p.importKey || '').trim();

const hasMissingMetadata = (p: FirebaseProduct): boolean =>
  !String(p.categoryAr || p.category || '').trim() || !String(p.brand || '').trim();

export const CatalogHealthCheck: React.FC<CatalogHealthCheckProps> = ({
  products: initialProducts = [],
  onRefresh,
}) => {
  const { categories } = useApp();

  const [scannedProducts, setScannedProducts] = useState<FirebaseProduct[]>(initialProducts);
  const [scanningDb, setScanningDb] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);

  const [issueFilter, setIssueFilter] = useState<IssueType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [brokenUrlIds, setBrokenUrlIds] = useState<Set<string>>(new Set());
  const [probingImages, setProbingImages] = useState(false);
  const [probeProgress, setProbeProgress] = useState<{ checked: number; total: number }>({
    checked: 0,
    total: 0,
  });
  const probeAbortRef = useRef(false);

  const [editingProduct, setEditingProduct] = useState<FirebaseProduct | null>(null);
  const [editForm, setEditForm] = useState({
    imageUrl: '',
    price: 0,
    itemNumber: '',
    importKey: '',
    brand: '',
    categoryAr: '',
  });
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // فحص تلقائي لقاعدة بيانات المنتجات فور فتح الأداة أو عند طلب إعادة الفحص
  const runDatabaseAudit = useCallback(async () => {
    setScanningDb(true);
    setScanError(null);
    try {
      const snapshot = await productService.getAuditSnapshot();
      setScannedProducts(snapshot);
      setLastScannedAt(
        new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err: any) {
      setScanError(err?.message || 'تعذر قراءة جدول المنتجات من قاعدة البيانات. تحقق من الاتصال.');
    } finally {
      setScanningDb(false);
    }
  }, []);

  useEffect(() => {
    runDatabaseAudit();
    return () => {
      probeAbortRef.current = true;
    };
  }, [runDatabaseAudit]);

  // مزامنة فورية إذا حدّث المكوّن الأب قائمة المنتجات لاحقاً
  useEffect(() => {
    if (initialProducts.length > 0 && scannedProducts.length === 0) {
      setScannedProducts(initialProducts);
    }
  }, [initialProducts, scannedProducts.length]);

  // فحص الروابط الحية للصور عبر المتصفح على دفعات
  const runLiveImageProbe = async () => {
    const candidates = scannedProducts
      .filter((p) => p.id && !isInvalidOrPlaceholderImage(p.imageUrl))
      .slice(0, MAX_LIVE_PROBE);
    if (candidates.length === 0) return;

    probeAbortRef.current = false;
    setProbingImages(true);
    setProbeProgress({ checked: 0, total: candidates.length });
    const nextBroken = new Set<string>(brokenUrlIds);

    const checkOne = (url: string) =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        let done = false;
        const finish = (ok: boolean) => {
          if (done) return;
          done = true;
          resolve(ok);
        };
        img.referrerPolicy = 'no-referrer';
        img.onload = () => finish(img.naturalWidth > 0);
        img.onerror = () => finish(false);
        setTimeout(() => finish(false), 4500);
        img.src = normalizeImageUrl(url, undefined, 300);
      });

    const batchSize = 10;
    for (let i = 0; i < candidates.length; i += batchSize) {
      if (probeAbortRef.current) break;
      const slice = candidates.slice(i, i + batchSize);
      const results = await Promise.all(
        slice.map(async (p) => {
          const ok = await checkOne(p.imageUrl);
          return { id: String(p.id), ok };
        })
      );
      results.forEach((r) => {
        if (!r.ok) nextBroken.add(r.id);
        else nextBroken.delete(r.id);
      });
      setBrokenUrlIds(new Set(nextBroken));
      setProbeProgress({
        checked: Math.min(candidates.length, i + slice.length),
        total: candidates.length,
      });
    }
    setProbingImages(false);
  };

  const stopLiveProbe = () => {
    probeAbortRef.current = true;
    setProbingImages(false);
  };

  const analyzed = useMemo(() => {
    return scannedProducts.map((p) => {
      const id = String(p.id || '');
      const missingImage = isInvalidOrPlaceholderImage(p.imageUrl) || brokenUrlIds.has(id);
      const missingPrice = hasMissingPrice(p.price);
      const missingCode = hasMissingUnifiedCode(p);
      const missingMeta = hasMissingMetadata(p);

      const issues: IssueType[] = [];
      if (missingImage) issues.push('broken_image');
      if (missingPrice) issues.push('missing_price');
      if (missingCode) issues.push('missing_code');
      if (missingMeta) issues.push('missing_meta');

      return {
        product: p,
        missingImage,
        missingPrice,
        missingCode,
        missingMeta,
        issues,
      };
    });
  }, [scannedProducts, brokenUrlIds]);

  const counts = useMemo(() => {
    let healthy = 0;
    let withIssues = 0;
    let brokenImage = 0;
    let missingPrice = 0;
    let missingCode = 0;
    let missingMeta = 0;

    for (const a of analyzed) {
      if (a.issues.length === 0) healthy += 1;
      else withIssues += 1;
      if (a.missingImage) brokenImage += 1;
      if (a.missingPrice) missingPrice += 1;
      if (a.missingCode) missingCode += 1;
      if (a.missingMeta) missingMeta += 1;
    }

    return {
      total: analyzed.length,
      healthy,
      withIssues,
      brokenImage,
      missingPrice,
      missingCode,
      missingMeta,
    };
  }, [analyzed]);

  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return analyzed.filter((item) => {
      if (item.issues.length === 0) return false;
      if (issueFilter !== 'all' && !item.issues.includes(issueFilter)) return false;
      if (q) {
        const p = item.product;
        const match =
          (p.nameAr || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.categoryAr || p.category || '').toLowerCase().includes(q) ||
          (p.itemNumber || '').toLowerCase().includes(q) ||
          (p.importKey || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [analyzed, issueFilter, searchQuery]);

  // إعادة ضبط الصفحة عند تغيير الفلتر أو البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [issueFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedIssues = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredIssues.slice(start, start + PAGE_SIZE);
  }, [filteredIssues, safePage]);

  const openQuickFix = (p: FirebaseProduct) => {
    setEditingProduct(p);
    setPreviewLoadFailed(false);
    setEditForm({
      imageUrl: p.imageUrl || '',
      price: Number(p.price) || 0,
      itemNumber: p.itemNumber || '',
      importKey: p.importKey || '',
      brand: p.brand || '',
      categoryAr: p.categoryAr || p.category || '',
    });
  };

  const handleSaveQuickFix = async () => {
    if (!editingProduct?.id) return;
    setSaving(true);
    try {
      const patch = {
        imageUrl: editForm.imageUrl.trim(),
        price: Number(editForm.price) || 0,
        itemNumber: editForm.itemNumber.trim() || undefined,
        importKey: editForm.importKey.trim() || undefined,
        brand: editForm.brand.trim(),
        categoryAr: editForm.categoryAr.trim(),
      };

      await productService.update(editingProduct.id, patch);

      setScannedProducts((prev) =>
        prev.map((item) =>
          item.id === editingProduct.id
            ? {
                ...item,
                imageUrl: patch.imageUrl,
                price: patch.price,
                itemNumber: patch.itemNumber || '',
                importKey: patch.importKey || '',
                brand: patch.brand,
                categoryAr: patch.categoryAr,
                category: patch.categoryAr,
              }
            : item
        )
      );

      if (patch.imageUrl && !isInvalidOrPlaceholderImage(patch.imageUrl)) {
        const next = new Set(brokenUrlIds);
        next.delete(String(editingProduct.id));
        setBrokenUrlIds(next);
      }

      if (onRefresh) {
        await onRefresh();
      }
      showFeedback('success', `تم حفظ إصلاح بيانات "${editingProduct.nameAr}" في قاعدة البيانات.`);
      setEditingProduct(null);
    } catch (e: any) {
      showFeedback('error', 'تعذر حفظ التعديلات: ' + (e?.message || 'تحقق من الاتصال'));
    } finally {
      setSaving(false);
    }
  };

  const handleExportIssuesExcel = () => {
    const source = filteredIssues.length > 0 ? filteredIssues : analyzed.filter((a) => a.issues.length > 0);
    const rows = source.map((a, idx) => ({
      '#': idx + 1,
      'اسم المنتج': a.product.nameAr,
      'القسم': a.product.categoryAr || a.product.category || '-',
      'الماركة': a.product.brand || '-',
      'رقم الصنف': a.product.itemNumber || 'ناقص',
      'الرمز الموحد (import_key)': a.product.importKey || 'ناقص',
      'السعر المسجل': a.product.price || 0,
      'رابط الصورة': a.product.imageUrl || 'فارغ',
      'النواقص المكتشفة': [
        a.missingImage ? 'بدون صورة / رابط تالف' : '',
        a.missingPrice ? 'بدون سعر' : '',
        a.missingCode ? 'بدون رمز موحد / كود' : '',
        a.missingMeta ? 'قسم أو ماركة ناقصة' : '',
      ]
        .filter(Boolean)
        .join(' + '),
    }));

    if (rows.length === 0) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'نواقص_جودة_الكتالوج');
    XLSX.writeFile(wb, `فحص_جودة_كتالوج_دريم_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const healthPercent = counts.total > 0 ? Math.round((counts.healthy / counts.total) * 100) : 100;
  const pageStart = filteredIssues.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(filteredIssues.length, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldAlert size={20} className="text-blue-900 shrink-0" />
            <h3 className="text-base sm:text-lg font-black text-gray-900">
              مدقق جودة الكتالوج التلقائي (CatalogHealthCheck)
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>فحص تلقائي لقاعدة بيانات المنتجات لاكتشاف النواقص في الصور والأسعار والرموز الموحدة</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-gray-700">
              {scanningDb
                ? 'جارٍ مسح قاعدة البيانات...'
                : `تم فحص ${counts.total.toLocaleString('en-US')} منتج`}
            </span>
            {lastScannedAt && !scanningDb && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-gray-500">آخر فحص: {lastScannedAt}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {probingImages ? (
            <button
              type="button"
              onClick={stopLiveProbe}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Loader2 size={14} className="animate-spin" />
              <span className="tabular-nums">
                إيقاف الفحص ({probeProgress.checked}/{probeProgress.total})
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={runLiveImageProbe}
              disabled={scanningDb || scannedProducts.length === 0}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Globe size={14} />
              <span>فحص روابط الصور الحية</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportIssuesExcel}
            disabled={counts.withIssues === 0}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet size={14} />
            <span>تصدير Excel</span>
          </button>

          <button
            type="button"
            onClick={runDatabaseAudit}
            disabled={scanningDb}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <RefreshCw size={14} className={scanningDb ? 'animate-spin' : ''} />
            <span>{scanningDb ? 'جارٍ الفحص...' : 'إعادة فحص قاعدة البيانات'}</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback & Scan Error Banners */}
      {scanError && (
        <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{scanError}</span>
          </div>
          <button
            type="button"
            onClick={runDatabaseAudit}
            className="px-3 py-1 bg-white border border-red-300 rounded-lg text-red-800 hover:bg-red-100 whitespace-nowrap shrink-0"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Summary Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setIssueFilter('all')}
          className={`text-right p-4 rounded-xl border transition space-y-1 ${
            issueFilter === 'all' ? 'bg-slate-50 border-slate-400' : 'bg-white border-gray-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-gray-600 block">نسبة اكتمال الكتالوج</span>
          <strong className="text-2xl font-mono font-black text-emerald-700 tabular-nums block">
            {healthPercent}%
          </strong>
          <span className="text-[11px] text-gray-500 font-mono tabular-nums block">
            {counts.healthy} سليم · {counts.withIssues} به نواقص
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIssueFilter('broken_image')}
          className={`text-right p-4 rounded-xl border transition space-y-1 ${
            issueFilter === 'broken_image'
              ? 'bg-red-50 border-red-300'
              : 'bg-white border-gray-200 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between text-red-700">
            <span className="text-[11px] font-bold">بدون صورة / رابط تالف</span>
            <ImageOff size={15} />
          </div>
          <strong className="text-2xl font-mono font-black text-red-700 tabular-nums block">
            {counts.brokenImage}
          </strong>
          <span className="text-[11px] text-gray-500 block">صور فارغة أو غير صالحة</span>
        </button>

        <button
          type="button"
          onClick={() => setIssueFilter('missing_price')}
          className={`text-right p-4 rounded-xl border transition space-y-1 ${
            issueFilter === 'missing_price'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-gray-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold">بدون سعر / سعر 0</span>
            <DollarSign size={15} />
          </div>
          <strong className="text-2xl font-mono font-black text-amber-700 tabular-nums block">
            {counts.missingPrice}
          </strong>
          <span className="text-[11px] text-gray-500 block">أصناف تحتاج تسعير</span>
        </button>

        <button
          type="button"
          onClick={() => setIssueFilter('missing_code')}
          className={`text-right p-4 rounded-xl border transition space-y-1 ${
            issueFilter === 'missing_code'
              ? 'bg-blue-50 border-blue-300'
              : 'bg-white border-gray-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-[11px] font-bold">بدون رمز موحد / كود</span>
            <Barcode size={15} />
          </div>
          <strong className="text-2xl font-mono font-black text-blue-950 tabular-nums block">
            {counts.missingCode}
          </strong>
          <span className="text-[11px] text-gray-500 block">يفتقد item_number أو import_key</span>
        </button>

        <button
          type="button"
          onClick={() => setIssueFilter('missing_meta')}
          className={`text-right p-4 rounded-xl border transition space-y-1 col-span-2 lg:col-span-1 ${
            issueFilter === 'missing_meta'
              ? 'bg-slate-100 border-slate-400'
              : 'bg-white border-gray-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-bold">قسم أو ماركة ناقصة</span>
            <Tag size={15} />
          </div>
          <strong className="text-2xl font-mono font-black text-slate-900 tabular-nums block">
            {counts.missingMeta}
          </strong>
          <span className="text-[11px] text-gray-500 block">بيانات التصنيف الأساسية</span>
        </button>
      </div>

      {/* Filter Segmented Controls + Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          {(
            [
              { id: 'all', label: `كل النواقص (${counts.withIssues})` },
              { id: 'broken_image', label: `صور (${counts.brokenImage})` },
              { id: 'missing_price', label: `أسعار (${counts.missingPrice})` },
              { id: 'missing_code', label: `رموز موحدة (${counts.missingCode})` },
              { id: 'missing_meta', label: `قسم/ماركة (${counts.missingMeta})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setIssueFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap shrink-0 tabular-nums ${
                issueFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute right-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الكود أو الماركة..."
            className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Diagnostic Data Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {scanningDb && scannedProducts.length === 0 ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-11 bg-slate-100 rounded-lg animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
            <h4 className="text-sm font-black text-gray-900">
              {counts.total === 0
                ? 'لا توجد منتجات مسجلة في قاعدة البيانات حالياً'
                : 'ممتاز — لا توجد منتجات ناقصة مطابقة لهذا الفلتر'}
            </h4>
            <p className="text-xs text-gray-500">
              {counts.total === 0
                ? 'ارفع ملف الأصناف من تبويب إكسل أو أضف منتجات لبدء فحص الجودة.'
                : 'جميع المنتجات في هذا النطاق تحتوي على صورة وسعر ورمز موحد مكتمل.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-gray-200 text-gray-700 font-bold">
                  <tr>
                    <th className="p-3">المنتج</th>
                    <th className="p-3">القسم / الماركة</th>
                    <th className="p-3">الرمز الموحد / رقم الصنف</th>
                    <th className="p-3 text-left">السعر</th>
                    <th className="p-3">النواقص المكتشفة</th>
                    <th className="p-3 text-center w-28">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedIssues.map(
                    ({ product: p, missingImage, missingPrice, missingCode, missingMeta }) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-md border border-gray-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                              {missingImage ? (
                                <ImageOff size={14} className="text-red-500" />
                              ) : (
                                <img
                                  src={normalizeImageUrl(p.imageUrl, undefined, 120)}
                                  alt={p.nameAr}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                            <span className="font-bold text-gray-900 block max-w-[260px] truncate">
                              {p.nameAr || 'منتج بدون اسم'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600 whitespace-nowrap">
                          <span>{p.categoryAr || p.category || 'بدون قسم'}</span>
                          <span className="mx-1.5 text-gray-300" aria-hidden="true">
                            ·
                          </span>
                          <span>{p.brand || 'بدون ماركة'}</span>
                        </td>
                        <td className="p-3 font-mono tabular-nums text-gray-700 whitespace-nowrap">
                          {p.itemNumber || p.importKey ? (
                            <span>{p.itemNumber || p.importKey}</span>
                          ) : (
                            <span className="text-red-700 font-bold font-sans">بدون رمز موحد</span>
                          )}
                        </td>
                        <td className="p-3 text-left font-mono font-bold tabular-nums whitespace-nowrap">
                          {Number(p.price) > 0 ? (
                            `${Number(p.price).toLocaleString('en-US')} ج.م`
                          ) : (
                            <span className="text-amber-700">0 ج.م</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-[11px] font-bold text-red-700">
                            {[
                              missingImage && 'بدون صورة / رابط تالف',
                              missingPrice && 'بدون سعر',
                              missingCode && 'بدون رمز موحد',
                              missingMeta && 'قسم أو ماركة ناقصة',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => openQuickFix(p)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-900 text-blue-900 hover:text-white rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <Pencil size={12} />
                            <span>إصلاح سريع</span>
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="px-4 py-3 bg-slate-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
              <span className="font-mono tabular-nums">
                عرض {pageStart}–{pageEnd} من أصل {filteredIssues.length.toLocaleString('en-US')} منتج بها نواقص
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <ChevronRight size={14} />
                  <span>السابق</span>
                </button>
                <span className="font-mono font-bold tabular-nums px-2 text-gray-800">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>التالي</span>
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Inline Repair Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 border border-gray-200 shadow-2xl space-y-4 text-right"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-blue-950">إصلاح سريع لبيانات المنتج</h4>
                <p className="text-xs text-gray-500 truncate max-w-[360px]">{editingProduct.nameAr}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl border border-gray-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {!editForm.imageUrl.trim() || previewLoadFailed ? (
                    <Package size={20} className="text-slate-400" />
                  ) : (
                    <img
                      src={normalizeImageUrl(editForm.imageUrl, undefined, 160)}
                      alt={editingProduct.nameAr}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                      onError={() => setPreviewLoadFailed(true)}
                      onLoad={() => setPreviewLoadFailed(false)}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <label className="font-bold text-gray-700 block mb-1">رابط الصورة (Image URL)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editForm.imageUrl}
                    onChange={(e) => {
                      setPreviewLoadFailed(false);
                      setEditForm({ ...editForm, imageUrl: e.target.value });
                    }}
                    placeholder="https://..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-mono text-left outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">السعر (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-mono tabular-nums outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">رقم الصنف</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editForm.itemNumber}
                    onChange={(e) => setEditForm({ ...editForm, itemNumber: e.target.value })}
                    placeholder="مثال: 10452"
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-mono text-left outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">الرمز الموحد</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editForm.importKey}
                    onChange={(e) => setEditForm({ ...editForm, importKey: e.target.value })}
                    placeholder="مثال: SKU-001"
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-mono text-left outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">الماركة</label>
                  <input
                    type="text"
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">القسم</label>
                  <select
                    value={editForm.categoryAr}
                    onChange={(e) => setEditForm({ ...editForm, categoryAr: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">اختر القسم</option>
                    {categories.map((c) => (
                      <option key={c.nameAr} value={c.nameAr}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold whitespace-nowrap shrink-0"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveQuickFix}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>حفظ الإصلاح</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogHealthCheck;
