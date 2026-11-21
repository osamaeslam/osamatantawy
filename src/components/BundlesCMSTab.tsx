import React, { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Trash2,
  Save,
  Search,
  CheckCircle2,
  X,
  Pencil,
  Package,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { productService } from '../supabase/products.service';
import type { Product, ProductBundle, ProductBundleItem } from '../types';
import { normalizeImageUrl } from '../services/image-url';

export const BundlesCMSTab: React.FC = () => {
  const { bundles, saveBundlesToDatabase, products: localProducts } = useApp();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('باكدج التجهيز الكامل');
  const [image, setImage] = useState('');
  const [bundlePrice, setBundlePrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<ProductBundleItem[]>([]);

  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const q = searchQ.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await productService.getMappedPaged({ page: 1, pageSize: 8, query: q });
        if (!cancelled) {
          setSearchResults(
            res.products.length > 0
              ? res.products
              : localProducts.filter((p) => p.nameAr.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
          );
        }
      } catch {
        if (!cancelled) {
          setSearchResults(
            localProducts.filter((p) => p.nameAr.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
          );
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQ, localProducts]);

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setBadge('باكدج التجهيز الكامل');
    setImage('');
    setBundlePrice(0);
    setOriginalPrice(0);
    setIsActive(true);
    setItems([]);
    setSearchQ('');
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const startEdit = (b: ProductBundle) => {
    setEditingId(b.id);
    setIsCreating(false);
    setTitle(b.title);
    setSubtitle(b.subtitle);
    setBadge(b.badge);
    setImage(b.image);
    setBundlePrice(b.bundlePrice || 0);
    setOriginalPrice(b.originalPrice || 0);
    setIsActive(b.isActive);
    setItems(b.items || []);
  };

  const addProductToBundle = (p: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        return prev.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          productId: p.id,
          nameAr: p.nameAr,
          brand: p.brand,
          image: p.previewimage,
          unifiedCode: p.unifiedCode || p.itemNumber,
          quantity: 1,
        },
      ];
    });
    if (!image && p.previewimage) {
      setImage(p.previewimage);
    }
    setSearchQ('');
    setSearchResults([]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('يرجى إدخال اسم الباقة (مثال: باكدج العرايس الذهبي)');
      return;
    }
    if (items.length === 0) {
      alert('يرجى إضافة جهاز أو صنف واحد على الأقل داخل الباقة');
      return;
    }

    setSaving(true);
    try {
      const bundleObj: ProductBundle = {
        id: editingId || `bnd-${Date.now()}`,
        title: title.trim(),
        subtitle: subtitle.trim(),
        badge: badge.trim() || 'عرض الباقة الموفر',
        image: image.trim() || items[0]?.image || '/logo.png',
        bundlePrice: Number(bundlePrice) || 0,
        originalPrice: Number(originalPrice) || undefined,
        items,
        isActive,
        createdAt: new Date().toISOString(),
      };

      const nextList = editingId
        ? bundles.map((b) => (b.id === editingId ? bundleObj : b))
        : [bundleObj, ...bundles];

      await saveBundlesToDatabase(nextList);
      setStatusMsg(editingId ? 'تم تحديث الباقة وحفظها في قاعدة البيانات' : 'تمت إضافة الباقة ونشرها بالمتجر');
      setTimeout(() => setStatusMsg(null), 3500);
      resetForm();
    } catch (e: any) {
      alert('تعذر حفظ الباقة: ' + (e?.message || 'تحقق من الاتصال'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const next = bundles.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    await saveBundlesToDatabase(next);
  };

  const handleDelete = async (b: ProductBundle) => {
    if (!confirm(`هل تريد حذف الباقة "${b.title}" نهائياً؟`)) return;
    const next = bundles.filter((x) => x.id !== b.id);
    await saveBundlesToDatabase(next);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Gift size={22} className="text-blue-900" />
            <span>عروض الباقات (باكدج العرايس والتجهيز الكامل)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            تجميع أكثر من جهاز في باقة واحدة بسعر مجمّع موفر وزر طلب مباشر للعملاء على الرئيسية
          </p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0"
        >
          <Plus size={16} />
          <span>إنشاء باقة جديدة</span>
        </button>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{statusMsg}</span>
        </div>
      )}

      {(isCreating || editingId) && (
        <div className="bg-white border border-blue-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 className="text-sm font-black text-blue-950">
              {editingId ? 'تعديل بيانات الباقة' : 'إعداد باقة أجهزة جديدة'}
            </h4>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">اسم الباقة *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: باكدج العروسة الشامل (ثلاجة + غسالة + شاشة + خلاط)"
                className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">عنوان فرعي مميز (Badge)</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="تجهيز العرايس / خصم الباقة"
                className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-gray-700 block mb-1">وصف الباقة ومميزاتها</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="ضمان الوكيل المعتمد مع توصيل مجاني للمنزل..."
                className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">سعر الباقة المجمّع (ج.م) — اتركه 0 للتسعير عند الطلب</label>
              <input
                type="number"
                min={0}
                value={bundlePrice || ''}
                onChange={(e) => setBundlePrice(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-2.5 border border-gray-300 rounded-xl font-mono outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">السعر قبل العرض (لحساب التوفير - اختياري)</label>
              <input
                type="number"
                min={0}
                value={originalPrice || ''}
                onChange={(e) => setOriginalPrice(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-2.5 border border-gray-300 rounded-xl font-mono outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-gray-700 block mb-1">رابط صورة غلاف الباقة</label>
              <input
                type="text"
                dir="ltr"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://... (يؤخذ تلقائياً من أول صنف إن تُرك فارغاً)"
                className="w-full p-2.5 border border-gray-300 rounded-xl font-mono text-left outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Search & Add Catalog Items */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <label className="text-xs font-black text-gray-900 block">
              إضافة أجهزة من الكتالوج إلى الباقة:
            </label>
            <div className="relative">
              <Search size={15} className="absolute right-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="ابحث بالاسم أو الماركة أو الكود لإضافته للباقة..."
                className="w-full pr-9 pl-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600"
              />
              {searching && <Loader2 size={14} className="absolute left-3 top-3 text-blue-700 animate-spin" />}

              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-blue-200 rounded-xl divide-y divide-gray-100 max-h-48 overflow-y-auto shadow-md">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProductToBundle(p)}
                      className="w-full px-3 py-2 hover:bg-blue-50 flex items-center justify-between gap-2 text-right"
                    >
                      <span className="text-xs font-bold text-gray-900 truncate">{p.nameAr}</span>
                      <span className="text-[11px] font-bold text-blue-800 shrink-0">+ إضافة للباقة</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {items.map((it, idx) => (
                  <div
                    key={`${it.productId}-${idx}`}
                    className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package size={14} className="text-blue-900 shrink-0" />
                      <span className="font-bold text-gray-900 truncate">{it.nameAr}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-gray-500">العدد:</span>
                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => {
                          const q = Math.max(1, Number(e.target.value) || 1);
                          setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, quantity: q } : row)));
                        }}
                        className="w-14 p-1 border border-gray-300 rounded-lg text-center font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>إظهار الباقة للزوار في المتجر</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>حفظ الباقة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Bundles List */}
      {bundles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-3">
          <Gift size={40} className="text-gray-300 mx-auto" />
          <h4 className="text-sm font-black text-gray-800">لا توجد باقات تجهيز مضافة بعد</h4>
          <p className="text-xs text-gray-500">
            اضغط «إنشاء باقة جديدة» لتجميع أجهزة العرايس أو تجهيز المطبخ في عرض واحد متكامل.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col justify-between">
              <div className="h-36 bg-slate-50 relative overflow-hidden border-b border-gray-100">
                <img
                  src={normalizeImageUrl(b.image, undefined, 500) || '/logo.png'}
                  referrerPolicy="no-referrer"
                  alt={b.title}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded border ${
                    b.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-gray-100 text-gray-700 border-gray-300'
                  }`}
                >
                  {b.isActive ? 'منشورة بالمتجر' : 'مخفية'}
                </span>
              </div>

              <div className="p-4 flex-1 space-y-2">
                <span className="text-[11px] font-bold text-blue-800 block">{b.badge}</span>
                <h4 className="text-sm font-black text-gray-900">{b.title}</h4>
                <p className="text-xs text-gray-500">{b.items.length} أصناف مشمولة بالباقة</p>
                {b.bundlePrice > 0 && (
                  <p className="text-sm font-mono font-black text-emerald-700 tabular-nums">
                    {b.bundlePrice.toLocaleString('ar-EG')} ج.م
                  </p>
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(b.id)}
                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700 flex items-center gap-1"
                >
                  {b.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{b.isActive ? 'إخفاء' : 'نشر'}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(b)}
                    className="p-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg"
                    title="تعديل"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b)}
                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
