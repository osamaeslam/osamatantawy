import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CategoryItem } from '../types';
import { Plus, Trash2, Pencil, Save, X, RefreshCw, Tags } from 'lucide-react';

const EMPTY_CATEGORY: CategoryItem = {
  name: '',
  nameAr: '',
  icon: 'Package',
  descriptionAr: '',
  subcategories: [],
  subcategoriesAr: [],
};

export const CategoriesTab: React.FC = () => {
  const {
    categories,
    categoriesLoading,
    refreshCategoriesFromDatabase,
    addCategory,
    editCategory,
    deleteCategory,
  } = useApp();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryItem>(EMPTY_CATEGORY);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [subcatsText, setSubcatsText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (cat: CategoryItem) => {
    setEditingKey(cat.nameAr);
    setForm({ ...cat });
    setSubcatsText((cat.subcategoriesAr || []).join('، '));
    setIsAddingNew(false);
    setError(null);
  };

  const startAdd = () => {
    setEditingKey(null);
    setForm({ ...EMPTY_CATEGORY });
    setSubcatsText('');
    setIsAddingNew(true);
    setError(null);
  };

  const cancel = () => {
    setEditingKey(null);
    setIsAddingNew(false);
    setForm({ ...EMPTY_CATEGORY });
    setSubcatsText('');
    setError(null);
  };

  const handleSave = async () => {
    if (!form.nameAr.trim()) {
      setError('يرجى إدخال اسم القسم بالعربي');
      return;
    }
    const subs = subcatsText
      .split(/[،,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: CategoryItem = {
      ...form,
      name: form.name.trim() || form.nameAr.trim(),
      nameAr: form.nameAr.trim(),
      descriptionAr: form.descriptionAr.trim(),
      subcategories: subs,
      subcategoriesAr: subs,
    };

    setBusy(true);
    setError(null);
    try {
      const { categoryService } = await import('../supabase/categories.service');
      if (isAddingNew) {
        await addCategory(payload);
      } else {
        const fresh = await categoryService.getAll();
        const target = fresh.find((c) => c.nameAr === editingKey);
        if (target && target.id) {
          await editCategory(target.id, payload);
        } else {
          await addCategory(payload);
        }
      }
      cancel();
    } catch (err: any) {
      console.error('Category save error:', err);
      setError('تعذر الحفظ في قاعدة البيانات. تحقق من الاتصال وإعدادات Supabase.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!confirm(`هل تريد حذف القسم "${cat.nameAr}" نهائياً؟`)) return;
    setBusy(true);
    setError(null);
    try {
      const { categoryService } = await import('../supabase/categories.service');
      const fresh = await categoryService.getAll();
      const target = fresh.find((c) => c.nameAr === cat.nameAr);
      if (target && target.id) {
        await deleteCategory(target.id);
      }
    } catch (err: any) {
      console.error('Category delete error:', err);
      setError('تعذر حذف القسم من قاعدة البيانات.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Tags className="text-blue-700" size={22} />
            <span>إدارة أسماء الأقسام (Categories)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            أضف، عدّل، أو احذف أقسام الموقع. التغييرات تُحفظ في قاعدة البيانات وتظهر لجميع الزوار فوراً.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshCategoriesFromDatabase()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={categoriesLoading ? 'animate-spin' : ''} />
            <span>تحديث</span>
          </button>
          <button
            onClick={startAdd}
            className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <Plus size={16} />
            <span>إضافة قسم جديد</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded-xl text-xs font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* Add / Edit Form */}
      {(isAddingNew || editingKey) && (
        <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-blue-900">
              {isAddingNew ? '➕ قسم جديد' : `✏️ تعديل: ${editingKey}`}
            </h4>
            <button onClick={cancel} className="text-gray-500 hover:text-red-600">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">اسم القسم بالعربي *</label>
              <input
                type="text"
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                placeholder="مثال: أجهزة منزلية"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">الاسم بالإنجليزي (اختياري)</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Home Appliances"
                dir="ltr"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 text-left"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-bold text-gray-700">وصف القسم</label>
              <textarea
                rows={2}
                value={form.descriptionAr}
                onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                placeholder="ثلاجات، غسالات، بوتاجازات..."
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-bold text-gray-700">
                الأقسام الفرعية (افصل بينها بفاصلة "،")
              </label>
              <input
                type="text"
                value={subcatsText}
                onChange={(e) => setSubcatsText(e.target.value)}
                placeholder="ثلاجات، غسالات، بوتاجازات"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={busy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 disabled:opacity-60"
            >
              <Save size={15} />
              <span>{busy ? 'جارٍ الحفظ...' : 'حفظ في قاعدة البيانات'}</span>
            </button>
            <button
              onClick={cancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-5 py-2.5 rounded-xl transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {categoriesLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">جارٍ تحميل الأقسام...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">لا توجد أقسام بعد. اضغط "إضافة قسم جديد".</div>
        ) : (
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 text-xs font-bold text-gray-500">اسم القسم</th>
                <th className="p-3 text-xs font-bold text-gray-500">الوصف</th>
                <th className="p-3 text-xs font-bold text-gray-500">الأقسام الفرعية</th>
                <th className="p-3 text-xs font-bold text-gray-500 w-32">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.nameAr} className="border-b border-gray-100 hover:bg-gray-50/60">
                  <td className="p-3 text-sm font-bold text-gray-900">{cat.nameAr}</td>
                  <td className="p-3 text-xs text-gray-600 max-w-xs line-clamp-2">{cat.descriptionAr}</td>
                  <td className="p-3 text-xs text-gray-500">
                    {(cat.subcategoriesAr || []).join('، ')}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                        title="تعديل"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
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
        )}
      </div>
    </div>
  );
};
