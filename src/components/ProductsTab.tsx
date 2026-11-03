import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Save, X, RefreshCw, Image as ImageIcon, Package } from 'lucide-react';
import { useProductPagination } from '../hooks/useProductPagination';
import type { FirebaseProduct } from '../types/firebase';
import { productService } from '../supabase/products.service';
import { useApp } from '../context/AppContext';

interface ProductsTabProps {
  products: FirebaseProduct[];
  onRefresh?: () => void | Promise<void>;
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
  brand: '',
  createdAt: null,
};

export const ProductsTab: React.FC<ProductsTabProps> = ({ products, onRefresh }) => {
  const { categories } = useApp();
  const [form, setForm] = useState<Omit<FirebaseProduct, 'id'>>(EMPTY_PRODUCT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [colorsText, setColorsText] = useState('');
  const [sizesText, setSizesText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination setup - show 10 products per page
  const { paginatedProducts, currentPage, totalPages, next, prev, pageNumbers, goTo, hasPreviousPage, hasNextPage, startIndex, endIndex } = useProductPagination({
    products,
    pageSize: 10,
    initialPage: 1,
  });

  const currentProducts = paginatedProducts();

  const startAdd = () => {
    setForm({ ...EMPTY_PRODUCT });
    setColorsText('');
    setSizesText('');
    setEditingId(null);
    setIsAddingNew(true);
    setError(null);
    setSuccess(null);
  };

  const startEdit = (p: FirebaseProduct) => {
    setForm({
      nameAr: p.nameAr || '',
      nameEn: p.nameEn || '',
      categoryAr: p.categoryAr || p.category || '',
      category: p.category || p.categoryAr || '',
      price: p.price || 0,
      discountedPrice: p.discountedPrice || 0,
      imageUrl: p.imageUrl || '',
      colors: p.colors || [],
      sizes: p.sizes || [],
      inStock: p.inStock ?? true,
      brand: p.brand || '',
      createdAt: null,
    });
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

    const payload: Omit<FirebaseProduct, 'id'> = {
      ...form,
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      categoryAr: categoryValue,
      category: categoryValue,
      colors,
      sizes,
      price: Number(form.price) || 0,
      discountedPrice: Number(form.discountedPrice) || 0,
    };

    setBusy(true);
    setError(null);
    try {
      if (isAddingNew) {
        await productService.create(payload);
      } else if (editingId) {
        await productService.update(editingId, payload);
      }
      if (onRefresh) await onRefresh();
      setSuccess(isAddingNew ? 'تمت إضافة المنتج بنجاح ✅' : 'تم تحديث المنتج بنجاح ✅');
      cancelForm();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('Product save error:', err);
      setError('تعذر الحفظ في قاعدة البيانات. تحقق من الاتصال وإعدادات Supabase.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (p: FirebaseProduct) => {
    if (!p.id) return;
    if (!confirm(`هل تريد حذف المنتج "${p.nameAr}" نهائياً؟`)) return;
    setBusy(true);
    setError(null);
    try {
      await productService.delete(p.id);
      if (onRefresh) await onRefresh();
      setSuccess('تم حذف المنتج ✅');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error('Product delete error:', err);
      setError('تعذر حذف المنتج من قاعدة البيانات.');
    } finally {
      setBusy(false);
    }
  };


  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Package size={20} className="text-blue-700" />
            إدارة المنتجات أونلاين ({products.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRefresh && onRefresh()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>تحديث</span>
            </button>
            <button
              onClick={startAdd}
              className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
            >
              <Plus size={16} />
              <span>إضافة منتج جديد</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded-xl text-xs font-bold mb-4">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold mb-4">
            {success}
          </div>
        )}

        {(isAddingNew || editingId) && (
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 mb-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-blue-900">
                {isAddingNew ? '➕ منتج جديد' : '✏️ تعديل المنتج'}
              </h4>
              <button onClick={cancelForm} className="text-gray-500 hover:text-red-600">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">اسم المنتج بالعربي *</label>
                <input type="text" value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  placeholder="مثال: ثلاجة شارب 16 قدم"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">الاسم بالإنجليزي (اختياري)</label>
                <input type="text" value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  placeholder="Sharp Refrigerator" dir="ltr"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 text-left" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">القسم</label>
                <select value={form.categoryAr}
                  onChange={(e) => setForm({ ...form, categoryAr: e.target.value, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white">
                  <option value="">— اختر القسم —</option>
                  {categories.map((c) => (<option key={c.nameAr} value={c.nameAr}>{c.nameAr}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">الماركة</label>
                <input type="text" value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="شارب / LG / توشيبا"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">السعر (ج.م)</label>
                <input type="number" value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">السعر بعد الخصم (ج.م)</label>
                <input type="number" value={form.discountedPrice}
                  onChange={(e) => setForm({ ...form, discountedPrice: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-bold text-gray-700">رابط صورة المنتج (Image URL)</label>
                <div className="relative">
                  <input type="text" value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..." dir="ltr"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 font-mono text-left" />
                  <ImageIcon size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="معاينة" className="mt-2 w-20 h-20 object-cover rounded-lg border" />
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">الألوان (افصل بفاصلة)</label>
                <input type="text" value={colorsText}
                  onChange={(e) => setColorsText(e.target.value)}
                  placeholder="أبيض، فضي، أسود"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">المقاسات (افصل بفاصلة)</label>
                <input type="text" value={sizesText}
                  onChange={(e) => setSizesText(e.target.value)}
                  placeholder="16 قدم، 18 قدم"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">حالة التوفر</label>
                <select value={form.inStock ? 'yes' : 'no'}
                  onChange={(e) => setForm({ ...form, inStock: e.target.value === 'yes' })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white">
                  <option value="yes">متوفر</option>
                  <option value="no">غير متوفر</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={handleSave} disabled={busy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 disabled:opacity-60">
                <Save size={15} />
                <span>{busy ? 'جارٍ الحفظ...' : 'حفظ في قاعدة البيانات'}</span>
              </button>
              <button onClick={cancelForm}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-5 py-2.5 rounded-xl transition">
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-2 text-left text-xs font-bold text-gray-500">الصورة</th>
                <th className="p-2 text-left text-xs font-bold text-gray-500">الاسم</th>
                <th className="p-2 text-left text-xs font-bold text-gray-500">القسم</th>
                <th className="p-2 text-left text-xs font-bold text-gray-500">السعر</th>
                <th className="p-2 text-left text-xs font-bold text-gray-500">الحالة</th>
                <th className="p-2 text-left text-xs font-bold text-gray-500 w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="p-2 text-left">
                    {p.imageUrl ? (
                      <img loading="lazy" src={p.imageUrl} alt={p.nameAr} className="w-12 h-12 object-cover rounded border" />
                    ) : (
                      <span className="text-xs text-gray-400">لا توجد</span>
                    )}
                  </td>
                  <td className="p-2 text-left text-sm">{p.nameAr}</td>
                  <td className="p-2 text-left text-sm">{p.categoryAr}</td>
                  <td className="p-2 text-left text-sm font-bold">{p.price} ج</td>
                  <td className="p-2 text-left text-sm">
                    {p.inStock ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">متوفر</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">نفذ</span>
                    )}
                  </td>
                  <td className="p-2 text-left">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                        title="تعديل"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="mt-6 flex justify-center space-x-2">
        {hasPreviousPage && (
          <button
            onClick={() => goTo(currentPage - 1)}
            className="bg-white hover:bg-gray-100 text-gray-900 font-bold px-4 py-2 rounded-lg transition"
            title="الصفحة السابقة"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {pageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => goTo(page)}
            className={`bg-${currentPage === page ? 'blue-600' : 'white'} text-gray-900 font-bold px-4 py-2 rounded-lg transition ${
              currentPage === page ? 'text-white' : 'text-gray-800'
            }`}
          >
            {page}
          </button>
        ))}
        {hasNextPage && (
          <button
            onClick={() => goTo(currentPage + 1)}
            className="bg-white hover:bg-gray-100 text-gray-900 font-bold px-4 py-2 rounded-lg transition"
            title="الصفحة التالية"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </>
  );
};
