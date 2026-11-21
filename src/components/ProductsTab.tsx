import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  RefreshCw,
  Image as ImageIcon,
  Package,
  Search,
  Loader2,
  BellRing,
  MessageCircle,
} from 'lucide-react';
import type { FirebaseProduct } from '../types/firebase';
import type { Product, StockStatus } from '../types';
import { productService } from '../supabase/products.service';
import { useApp } from '../context/AppContext';
import { STOCK_STATUS_META, resolveStockStatus } from '../utils/stockStatus';
import { stockAlertsService } from '../services/stock-alerts.service';
import type { StockAlertEntry } from '../services/stock-alerts.service';
import { buildCustomerWhatsAppUrl } from '../services/customer-messages';
import { TANTAWY_HOTLINE } from '../services/whatsapp-order';

interface ProductsTabProps {
  products: FirebaseProduct[];
  onRefresh?: () => void | Promise<void>;
  isSuperAdmin?: boolean;
}

const EMPTY_PRODUCT: Omit<FirebaseProduct, 'id'> = {
  nameAr: '',
  nameEn: '',
  categoryAr: '',
  category: '',
  price: 0,
  discountedPrice: 0,
  imageUrl: '',
  colors: [],
  sizes: [],
  inStock: true,
  stockStatus: 'available',
  brand: '',
  createdAt: null,
};

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products: propProducts,
  onRefresh,
  isSuperAdmin = true,
}) => {
  const { categories, stockStatusMap, updateProductStockStatus, setPosterProduct } = useApp();

  const [form, setForm] = useState<Omit<FirebaseProduct, 'id'>>(EMPTY_PRODUCT);
  const [formStockStatus, setFormStockStatus] = useState<StockStatus>('available');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [colorsText, setColorsText] = useState('');
  const [sizesText, setSizesText] = useState('');
  const [busy, setBusy] = useState(false);
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [waitingAlerts, setWaitingAlerts] = useState<StockAlertEntry[]>([]);
  const [readyToNotifyAlerts, setReadyToNotifyAlerts] = useState<StockAlertEntry[]>([]);

  useEffect(() => {
    stockAlertsService
      .getAll()
      .then((list) => setWaitingAlerts(list.filter((a) => a.status === 'waiting')))
      .catch(() => {});
  }, []);

  // Server-Side Pagination & Search State (optimized for 5,000 - 10,000 products)
  const PAGE_SIZE = 15;
  const [serverItems, setServerItems] = useState<FirebaseProduct[]>([]);
  const [totalCount, setTotalCount] = useState<number>(propProducts.length);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loadingPage, setLoadingPage] = useState<boolean>(false);

  const loadServerPage = async (page: number, q: string, cat: string) => {
    setLoadingPage(true);
    try {
      const res = await productService.getPaged({
        page,
        pageSize: PAGE_SIZE,
        query: q,
        category: cat === 'all' ? null : cat,
      });
      setServerItems(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.warn('Server page fetch fallback to local slice:', err);
      const lower = q.trim().toLowerCase();
      const filtered = propProducts.filter((p) => {
        const matchCat = cat === 'all' || p.categoryAr === cat || p.category === cat;
        const matchQ =
          !lower ||
          (p.nameAr || '').toLowerCase().includes(lower) ||
          (p.brand || '').toLowerCase().includes(lower) ||
          (p.itemNumber || '').toLowerCase().includes(lower);
        return matchCat && matchQ;
      });
      setTotalCount(filtered.length);
      const start = (page - 1) * PAGE_SIZE;
      setServerItems(filtered.slice(start, start + PAGE_SIZE));
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadServerPage(currentPage, searchQuery, categoryFilter);
    }, searchQuery ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const startAdd = () => {
    setForm({ ...EMPTY_PRODUCT });
    setFormStockStatus('available');
    setColorsText('');
    setSizesText('');
    setEditingId(null);
    setIsAddingNew(true);
    setError(null);
    setSuccess(null);
  };

  const startEdit = (p: FirebaseProduct) => {
    const resolved = resolveStockStatus(p, stockStatusMap);
    setForm({
      nameAr: p.nameAr || '',
      nameEn: p.nameEn || '',
      categoryAr: p.categoryAr || p.category || '',
      category: p.category || p.categoryAr || '',
      price: p.price || 0,
      discountedPrice: p.discountedPrice || 0,
      imageUrl: p.imageUrl || '',
      itemNumber: p.itemNumber || '',
      colors: p.colors || [],
      sizes: p.sizes || [],
      inStock: resolved !== 'out_of_stock',
      stockStatus: resolved,
      brand: p.brand || '',
      createdAt: null,
    });
    setFormStockStatus(resolved);
    setColorsText((p.colors || []).join('، '));
    setSizesText((p.sizes || []).join('، '));
    setEditingId(p.id || null);
    setIsAddingNew(false);
    setError(null);
    setSuccess(null);
  };

  const cancelForm = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setForm({ ...EMPTY_PRODUCT });
    setFormStockStatus('available');
    setColorsText('');
    setSizesText('');
    setError(null);
  };

  const handleSave = async () => {
    if (!form.nameAr.trim()) {
      setError('يرجى إدخال اسم المنتج بالعربي');
      return;
    }
    const colors = colorsText.split(/[،,\n]/).map((s) => s.trim()).filter(Boolean);
    const sizes = sizesText.split(/[،,\n]/).map((s) => s.trim()).filter(Boolean);
    const categoryValue = form.categoryAr.trim() || form.category.trim();
    const inStockBool = formStockStatus !== 'out_of_stock';

    const payload: Omit<FirebaseProduct, 'id'> = {
      ...form,
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      categoryAr: categoryValue,
      category: categoryValue,
      colors,
      sizes,
      inStock: inStockBool,
      price: Number(form.price) || 0,
      discountedPrice: Number(form.discountedPrice) || 0,
    };

    setBusy(true);
    setError(null);
    try {
      let savedId = editingId;
      if (isAddingNew) {
        savedId = await productService.create(payload);
      } else if (editingId) {
        await productService.update(editingId, payload);
      }
      if (savedId) {
        await updateProductStockStatus(String(savedId), formStockStatus);
      }
      await loadServerPage(currentPage, searchQuery, categoryFilter);
      if (onRefresh) await onRefresh();
      setSuccess(isAddingNew ? 'تمت إضافة المنتج بنجاح' : 'تم تحديث المنتج بنجاح');
      cancelForm();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('Product save error:', err);
      setError('تعذر الحفظ في قاعدة البيانات. تحقق من الاتصال وإعدادات Supabase.');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickStockChange = async (productId: string, nextStatus: StockStatus) => {
    setUpdatingStockId(productId);
    try {
      await updateProductStockStatus(productId, nextStatus);
      setServerItems((prev) =>
        prev.map((item) =>
          item.id === productId
            ? { ...item, inStock: nextStatus !== 'out_of_stock', stockStatus: nextStatus }
            : item
        )
      );

      if (nextStatus === 'available' || nextStatus === 'low_stock') {
        const matchingAlerts = waitingAlerts.filter((a) => a.productId === productId);
        if (matchingAlerts.length > 0) {
          setReadyToNotifyAlerts(matchingAlerts);
        }
      }
    } catch (e) {
      console.error('Stock status update failed:', e);
    } finally {
      setUpdatingStockId(null);
    }
  };

  const toStoreProduct = (p: FirebaseProduct): Product => ({
    id: String(p.id || ''),
    name: p.nameEn || p.nameAr,
    nameAr: p.nameAr,
    category: p.category || p.categoryAr || 'Home Appliances',
    categoryAr: p.categoryAr || p.category || 'أجهزة منزلية',
    summary: p.nameEn || p.categoryAr || p.nameAr,
    summaryAr: `${p.brand ? `${p.brand} · ` : ''}${p.categoryAr || ''}`,
    description: p.nameEn || p.nameAr,
    descriptionAr: p.nameAr,
    actualprice: Number(p.price) || 0,
    discountpercent: 0,
    overallrating: 5,
    previewimage: p.imageUrl || '/logo.png',
    previewimages: p.imageUrl ? [p.imageUrl] : ['/logo.png'],
    reviews: [],
    quantities: ['1'],
    sizevariants: p.sizes?.length ? p.sizes : ['قياسي'],
    inStock: p.inStock !== false,
    brand: p.brand || 'دريم طنطاوي جروب',
    itemNumber: p.itemNumber,
    unifiedCode: p.importKey || p.itemNumber,
    size: p.sizes?.join(' / '),
    color: p.colors?.join(' / '),
  });

  const handleNotifyWaitingCustomer = async (entry: StockAlertEntry) => {
    const codeText = entry.productCode ? ` (كود: ${entry.productCode})` : '';
    const msg = `السلام عليكم 🌿\nأ/ة ${entry.customerName}، مع حضرتك فريق دريم طنطاوي جروب.\n\nيسعدنا إبلاغك بأن الصنف:\n*${entry.productName}*${codeText}\n\n✅ *أصبح متوفراً الآن* بالمخزن وجاهز للطلب والشحن.\nرد علينا هنا لتأكيد الحجز أو اتصل على الخط الساخن ${TANTAWY_HOTLINE}.`;
    window.open(buildCustomerWhatsAppUrl(entry.customerPhone, msg), '_blank', 'noopener');
    await stockAlertsService.markNotified(entry.id);
    setWaitingAlerts((prev) => prev.filter((a) => a.id !== entry.id));
    setReadyToNotifyAlerts((prev) => prev.filter((a) => a.id !== entry.id));
  };

  const handleDelete = async (p: FirebaseProduct) => {
    if (!p.id) return;
    if (!confirm(`هل تريد حذف المنتج "${p.nameAr}" نهائياً؟`)) return;
    setBusy(true);
    setError(null);
    try {
      await productService.delete(p.id);
      await loadServerPage(currentPage, searchQuery, categoryFilter);
      if (onRefresh) await onRefresh();
      setSuccess('تم حذف المنتج');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('Product delete error:', err);
      setError('تعذر حذف المنتج من قاعدة البيانات.');
    } finally {
      setBusy(false);
    }
  };

  // Visible page numbers window
  const visiblePages = (() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  return (
    <>
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2 text-gray-900">
              <Package size={20} className="text-blue-900" />
              <span>إدارة الكتالوج والمخزون أونلاين</span>
              <span className="text-xs font-mono text-gray-500 font-bold tabular-nums">
                ({totalCount.toLocaleString('ar-EG')} صنف)
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              بحث وتصفح مباشر من Supabase على صفحات صغيرة (متوافق مع 5,000 - 10,000 منتج) مع تحكم فوري بحالة التوفر
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                loadServerPage(currentPage, searchQuery, categoryFilter);
                if (onRefresh) onRefresh();
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={loadingPage ? 'animate-spin' : ''} />
              <span>تحديث</span>
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={startAdd}
                className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>إضافة منتج جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Ready-to-notify waiting customers alert when product flips back to available */}
        {readyToNotifyAlerts.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-950 text-xs sm:text-sm font-black">
                <BellRing size={17} className="text-emerald-700" />
                <span>
                  يوجد {readyToNotifyAlerts.length} عميل منتظر لتوفر هذا الصنف — تواصل معهم الآن لسرعة الإغلاق:
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReadyToNotifyAlerts([])}
                className="text-xs font-bold text-emerald-800 hover:underline"
              >
                إغلاق
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {readyToNotifyAlerts.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => handleNotifyWaitingCustomer(entry)}
                  className="px-3 py-2 bg-white hover:bg-emerald-600 hover:text-white text-emerald-950 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <MessageCircle size={13} />
                  <span>{entry.customerName}</span>
                  <span className="font-mono text-[11px]" dir="ltr">{entry.customerPhone}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Server-Side Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="relative md:col-span-7">
            <Search size={15} className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث في قاعدة البيانات بالاسم، الماركة، أو رقم الصنف..."
              className="w-full pr-9 pl-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="md:col-span-5 flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">جميع الأقسام</option>
              {categories.map((c) => (
                <option key={c.nameAr} value={c.nameAr}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold">
            {success}
          </div>
        )}

        {(isAddingNew || editingId) && (
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-blue-900">
                {isAddingNew ? 'إضافة منتج جديد' : 'تعديل بيانات المنتج'}
              </h4>
              <button type="button" onClick={cancelForm} className="text-gray-500 hover:text-red-600">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">اسم المنتج بالعربي *</label>
                <input
                  type="text"
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  placeholder="مثال: ثلاجة شارب 16 قدم"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">الاسم بالإنجليزي / الكود</label>
                <input
                  type="text"
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="Sharp Refrigerator"
                  dir="ltr"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-600 text-left"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">القسم</label>
                <select
                  value={form.categoryAr}
                  onChange={(e) => setForm({ ...form, categoryAr: e.target.value, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">— اختر القسم —</option>
                  {categories.map((c) => (
                    <option key={c.nameAr} value={c.nameAr}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">الماركة</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="شارب / LG / توشيبا"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">السعر (ج.م)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">حالة المخزون والتوافر</label>
                <select
                  value={formStockStatus}
                  onChange={(e) => setFormStockStatus(e.target.value as StockStatus)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="available">متوفر للطلب الفوري</option>
                  <option value="low_stock">أوشك على النفاد (كمية محدودة)</option>
                  <option value="out_of_stock">غير متوفر مؤقتاً</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-700">رابط صورة المنتج (Image URL)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..."
                    dir="ltr"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-600 font-mono text-left"
                  />
                  <ImageIcon size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="معاينة" className="mt-2 w-20 h-20 object-cover rounded-lg border" />
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">الألوان (افصل بفاصلة)</label>
                <input
                  type="text"
                  value={colorsText}
                  onChange={(e) => setColorsText(e.target.value)}
                  placeholder="أبيض، فضي، أسود"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">المقاسات (افصل بفاصلة)</label>
                <input
                  type="text"
                  value={sizesText}
                  onChange={(e) => setSizesText(e.target.value)}
                  placeholder="16 قدم، 18 قدم"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={busy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 disabled:opacity-60"
              >
                <Save size={15} />
                <span>{busy ? 'جارٍ الحفظ...' : 'حفظ في قاعدة البيانات'}</span>
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-5 py-2.5 rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {loadingPage ? (
            <div className="py-12 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin text-blue-900" />
              <span>جاري تحميل الصفحة {currentPage} من قاعدة البيانات...</span>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-bold">
                  <th className="p-2.5">الصورة</th>
                  <th className="p-2.5">الاسم والكود</th>
                  <th className="p-2.5">القسم</th>
                  <th className="p-2.5 text-center">السعر</th>
                  <th className="p-2.5 text-center">حالة المخزون (تغيير فوري)</th>
                  <th className="p-2.5 text-center w-24">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serverItems.map((p) => {
                  const status = resolveStockStatus(p, stockStatusMap);
                  const meta = STOCK_STATUS_META[status];
                  const isUpdatingStock = updatingStockId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5">
                        {p.imageUrl ? (
                          <img
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            src={p.imageUrl}
                            alt={p.nameAr}
                            className="w-11 h-11 object-cover rounded-lg border border-gray-200 bg-gray-50"
                          />
                        ) : (
                          <span className="text-[11px] text-gray-400">بدون صورة</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span className="font-bold text-gray-900 block max-w-[260px] truncate">{p.nameAr}</span>
                        <span className="text-[10px] font-mono text-gray-500">
                          {p.brand} {p.itemNumber ? `· ${p.itemNumber}` : ''}
                        </span>
                        {p.id && waitingAlerts.some((a) => a.productId === p.id) && (
                          <span className="text-[10px] font-bold text-amber-800 block mt-0.5">
                            عملاء منتظرين لتوفره ({waitingAlerts.filter((a) => a.productId === p.id).length})
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-gray-700 font-medium">{p.categoryAr}</td>
                      <td className="p-2.5 text-center font-mono font-bold tabular-nums">
                        {p.price ? `${p.price.toLocaleString('ar-EG')} ج.م` : '0 ج.م'}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <select
                            disabled={isUpdatingStock}
                            value={status}
                            onChange={(e) => p.id && handleQuickStockChange(p.id, e.target.value as StockStatus)}
                            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer ${meta.badgeClass}`}
                          >
                            <option value="available">متوفر</option>
                            <option value="low_stock">أوشك على النفاد</option>
                            <option value="out_of_stock">غير متوفر مؤقتاً</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPosterProduct(toStoreProduct(p))}
                            className="p-1.5 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-lg transition"
                            title="توليد بوستر سوشيال ميديا بدون سعر"
                          >
                            <ImageIcon size={14} />
                          </button>
                          {isSuperAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(p)}
                                className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                                title="تعديل"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(p)}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                title="حذف"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Server-Side Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 text-xs">
          <span className="text-gray-500 font-bold tabular-nums">
            صفحة {currentPage} من {totalPages} (إجمالي {totalCount.toLocaleString('ar-EG')} منتج)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-800 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              <ChevronRight size={15} />
              <span>السابق</span>
            </button>
            {visiblePages.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`font-mono font-bold px-3 py-1.5 rounded-lg transition tabular-nums ${
                  currentPage === page
                    ? 'bg-blue-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-800 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              <span>التالي</span>
              <ChevronLeft size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
