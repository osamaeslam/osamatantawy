import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CategoryItem } from '../types';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Save, 
  X, 
  RefreshCw, 
  Tags, 
  Sparkles, 
  CheckCircle2, 
  Tag, 
  Tv, 
  Refrigerator,
  Layers
} from 'lucide-react';

export const STANDARD_HOME_SUBCATEGORIES = [
  'أطقم حلل وأواني طهي',
  'مقالي وصواني طهي',
  'صواني تقديم وطهي',
  'مجات وكاسات وشوب',
  'فناجين شاي وقهوة',
  'أطقم ملاعق وسكاكين',
  'أطقم توزيع وسيليكون',
  'أطقم توابل ومطبخ',
  'بولات تقديم وأيس كريم',
  'بمبونيرات وتحف',
  'شيالات كحك وتسالي',
  'برادات وترامس وكنك',
  'حوافظ وعلب طعام',
  'أطقم سفرة وميلامين',
  'قوالب كيك ومستلزمات فرن',
  'ثلاجات',
  'ديب فريزر',
  'غسالات ملابس وأطباق',
  'بوتاجازات ومسطحات بلت إن',
  'سخانات مياه',
  'مبردات مياه'
];

export const STANDARD_ELECTRIC_SUBCATEGORIES = [
  'هاند بلندر ومحضرات',
  'مكاوي بخار',
  'محضرات طعام',
  'عجانات ومضارب بيض',
  'كبات ومفارم لحوم',
  'غلايات مياه',
  'قلايات هوائية',
  'عصارات فواكه',
  'أفران كهربائية وميكروويف',
  'صانعات قهوة ومطاحن',
  'خلاطات وعجانات',
  'مراوح سقف واستاند',
  'دفايات',
  'موازين إلكترونية',
  'توستر وساندوتش ميكر',
  'شاشات وتلفزيونات',
  'تكييفات هواء',
  'مكانس كهربائية',
  'أجهزة عناية شخصية واستشوار'
];

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
    products,
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New subcategory inline input per category
  const [newSubcatInput, setNewSubcatInput] = useState<{ [categoryNameAr: string]: string }>({});

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

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

  // Helper to count how many products match a given subcategory title
  const getProductCountForSub = (subName: string, categoryAr: string) => {
    const s = subName.trim().toLowerCase();
    const sectorProducts = products.filter(
      (p) => p.sector === categoryAr || p.categoryAr === categoryAr || p.category === categoryAr
    );

    const stopWords = ['أجهزة', 'جهاز', 'اجهزة', 'في', 'من', 'و', 'كافة', 'جميع', 'قسم'];
    const meaningfulWords = s.split(/\s+/).filter((w) => w.length >= 3 && !stopWords.includes(w));

    return sectorProducts.filter((p) => {
      const g = (p.itemGroup || '').toLowerCase();
      const f = (p.familyName || '').toLowerCase();
      const n = (p.nameAr || '').toLowerCase();

      if (g === s || f === s) return true;
      if (g && (g.includes(s) || s.includes(g))) return true;
      if (f && (f.includes(s) || s.includes(f))) return true;
      if (n.includes(s)) return true;

      if (meaningfulWords.length > 0 && meaningfulWords.some((w) => n.includes(w))) {
        return true;
      }
      return false;
    }).length;
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
        showSuccess('تمت إضافة القسم الجديد بنجاح!');
      } else {
        const fresh = await categoryService.getAll();
        const target = fresh.find((c) => c.nameAr === editingKey);
        if (target && target.id) {
          await editCategory(target.id, payload);
        } else {
          await addCategory(payload);
        }
        showSuccess('تم تحديث القسم بنجاح في قاعدة البيانات!');
      }
      cancel();
    } catch (err: any) {
      console.error('Category save error:', err);
      setError('تعذر الحفظ في قاعدة البيانات. تحقق من الاتصال.');
    } finally {
      setBusy(false);
    }
  };

  // Quick 1-click seeder to restore/seed the full 21 Home and 15+ Electrical subcategories
  const handleSeedStandardCategories = async () => {
    setBusy(true);
    setError(null);
    try {
      const { categoryService } = await import('../supabase/categories.service');
      const fresh = await categoryService.getAll();

      // Home category payload
      const homePayload: CategoryItem = {
        name: 'Home Appliances',
        nameAr: 'أجهزة منزلية',
        icon: 'Refrigerator',
        descriptionAr: 'ثلاجات، غسالات، بوتاجازات، أطقم حلل، صواني، مجات، ومستلزمات المطبخ والسفرة',
        subcategories: STANDARD_HOME_SUBCATEGORIES,
        subcategoriesAr: STANDARD_HOME_SUBCATEGORIES,
      };

      // Electric category payload
      const electricPayload: CategoryItem = {
        name: 'Electrical Appliances',
        nameAr: 'أجهزة كهربيه',
        icon: 'Tv',
        descriptionAr: 'شاشات، هاند بلندر، مكاوي، عجانات، قلايات، غلايات، أفران، ومحضرات طعام',
        subcategories: STANDARD_ELECTRIC_SUBCATEGORIES,
        subcategoriesAr: STANDARD_ELECTRIC_SUBCATEGORIES,
      };

      // Upsert Home
      const existingHome = fresh.find((c) => c.nameAr === 'أجهزة منزلية' || c.name === 'Home Appliances');
      if (existingHome && existingHome.id) {
        await editCategory(existingHome.id, homePayload);
      } else {
        await addCategory(homePayload);
      }

      // Upsert Electric
      const existingElectric = fresh.find((c) => c.nameAr === 'أجهزة كهربيه' || c.name === 'Electrical Appliances');
      if (existingElectric && existingElectric.id) {
        await editCategory(existingElectric.id, electricPayload);
      } else {
        await addCategory(electricPayload);
      }

      await refreshCategoriesFromDatabase();
      showSuccess('تم تفعيل وتثبيت كافة الأقسام الـ 21 والـ 19 القياسية بنجاح في قاعدة البيانات والمتجر!');
    } catch (err: any) {
      console.error('Seed error:', err);
      setError('تعذر تفعيل الأقسام القياسية. تحقق من الاتصال بقاعدة البيانات.');
    } finally {
      setBusy(false);
    }
  };

  // Inline add subcategory to an existing category
  const handleAddSubcatToCategory = async (cat: CategoryItem) => {
    const inputVal = (newSubcatInput[cat.nameAr] || '').trim();
    if (!inputVal) return;

    const currentSubs = cat.subcategoriesAr || [];
    if (currentSubs.includes(inputVal)) {
      setError(`القسم الفرعي "${inputVal}" موجود بالفعل.`);
      return;
    }

    const updatedSubs = [...currentSubs, inputVal];
    const payload: CategoryItem = {
      ...cat,
      subcategories: updatedSubs,
      subcategoriesAr: updatedSubs,
    };

    setBusy(true);
    setError(null);
    try {
      const { categoryService } = await import('../supabase/categories.service');
      const fresh = await categoryService.getAll();
      const target = fresh.find((c) => c.nameAr === cat.nameAr);
      if (target && target.id) {
        await editCategory(target.id, payload);
      } else {
        await addCategory(payload);
      }
      setNewSubcatInput((prev) => ({ ...prev, [cat.nameAr]: '' }));
      showSuccess(`تمت إضافة القسم الفرعي "${inputVal}" بنجاح!`);
    } catch (err) {
      setError('تعذر إضافة القسم الفرعي.');
    } finally {
      setBusy(false);
    }
  };

  // Inline remove subcategory from an existing category
  const handleRemoveSubcat = async (cat: CategoryItem, subToRemove: string) => {
    if (!confirm(`هل تريد حذف القسم الفرعي "${subToRemove}" من ${cat.nameAr}؟`)) return;

    const updatedSubs = (cat.subcategoriesAr || []).filter((s) => s !== subToRemove);
    const payload: CategoryItem = {
      ...cat,
      subcategories: updatedSubs,
      subcategoriesAr: updatedSubs,
    };

    setBusy(true);
    setError(null);
    try {
      const { categoryService } = await import('../supabase/categories.service');
      const fresh = await categoryService.getAll();
      const target = fresh.find((c) => c.nameAr === cat.nameAr);
      if (target && target.id) {
        await editCategory(target.id, payload);
      }
      showSuccess(`تم حذف القسم الفرعي "${subToRemove}" بنجاح.`);
    } catch (err) {
      setError('تعذر حذف القسم الفرعي.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!confirm(`هل تريد حذف القسم "${cat.nameAr}" نهائياً من قاعدة البيانات؟`)) return;
    setBusy(true);
    setError(null);
    try {
      const { categoryService } = await import('../supabase/categories.service');
      const fresh = await categoryService.getAll();
      const target = fresh.find((c) => c.nameAr === cat.nameAr);
      if (target && target.id) {
        await deleteCategory(target.id);
        showSuccess(`تم حذف قسم "${cat.nameAr}" بنجاح.`);
      }
    } catch (err: any) {
      setError('تعذر حذف القسم من قاعدة البيانات.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
            <Tags className="text-blue-900" size={24} />
            <span>إدارة الأقسام والتصنيفات الفرعية (Categories & Subcategories)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            تحكم كامل في الأقسام الرئيسية والأقسام الداخلية (15+ قسماً للأجهزة الكهربية و21 قسماً للأجهزة المنزلية وأدوات المطبخ).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSeedStandardCategories}
            disabled={busy}
            className="bg-amber-400 hover:bg-amber-500 text-blue-950 text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            title="تثبيت كافة الأقسام الـ 15 والـ 21 القياسية لطنطاوي بنقرة واحدة"
          >
            <Sparkles size={16} />
            <span>تثبيت الأقسام القياسية الـ 15 والـ 21 ⚡</span>
          </button>

          <button
            onClick={() => refreshCategoriesFromDatabase()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2.5 rounded-xl transition flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={categoriesLoading ? 'animate-spin' : ''} />
            <span>تحديث</span>
          </button>

          <button
            onClick={startAdd}
            className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <Plus size={16} />
            <span>إضافة قسم رئيسي جديد</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Add / Edit Form Modal or Box */}
      {(isAddingNew || editingKey) && (
        <div className="bg-blue-50/70 border-2 border-blue-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200 pb-3">
            <h4 className="text-sm font-black text-blue-950 flex items-center gap-2">
              <Pencil size={16} />
              <span>{isAddingNew ? '➕ إضافة قسم رئيسي جديد' : `✏️ تعديل القسم: ${editingKey}`}</span>
            </h4>
            <button onClick={cancel} className="text-gray-400 hover:text-red-600 p-1 rounded-lg">
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
                placeholder="مثال: أجهزة كهربيه"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">الاسم بالإنجليزي (اختياري)</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Electrical Appliances"
                dir="ltr"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white text-left font-mono"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-bold text-gray-700">وصف القسم المختصر</label>
              <input
                type="text"
                value={form.descriptionAr}
                onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                placeholder="شاشات وتلفزيونات، خلاطات، مكاوي، قلايات هوائية، غلايات..."
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-bold text-gray-700">
                قائمة الأقسام الفرعية (افصل بين كل قسم بفاصلة "،"):
              </label>
              <textarea
                rows={3}
                value={subcatsText}
                onChange={(e) => setSubcatsText(e.target.value)}
                placeholder="هاند بلندر، مكاوي بخار، محضرات طعام، عجانات ومضارب، غلايات مياه، قلايات هوائية، صانعات قهوة..."
                className="w-full border border-gray-300 rounded-xl p-3 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
            <button
              onClick={handleSave}
              disabled={busy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-60"
            >
              <Save size={15} />
              <span>{busy ? 'جارٍ الحفظ...' : 'حفظ في قاعدة البيانات والكتالوج'}</span>
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

      {/* Main Categories Cards with Interactive Subcategory Tags Management */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const isHome = cat.nameAr === 'أجهزة منزلية' || cat.name === 'Home Appliances';
          const subList = cat.subcategoriesAr && cat.subcategoriesAr.length > 0 
            ? cat.subcategoriesAr 
            : (isHome ? STANDARD_HOME_SUBCATEGORIES : STANDARD_ELECTRIC_SUBCATEGORIES);

          const newInputValue = newSubcatInput[cat.nameAr] || '';

          return (
            <div 
              key={cat.nameAr}
              className="bg-white rounded-3xl border-2 border-gray-200 p-6 shadow-sm space-y-4 hover:border-blue-300 transition"
            >
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-950 text-white flex items-center justify-center shadow-xs">
                    {isHome ? <Refrigerator size={22} className="text-yellow-400" /> : <Tv size={22} className="text-yellow-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-black text-gray-900">{cat.nameAr}</h4>
                      <span className="text-xs bg-blue-100 text-blue-900 font-bold px-2.5 py-0.5 rounded-full">
                        {subList.length} قسماً داخلياً
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.descriptionAr}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-2 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    title="تعديل هذا القسم"
                  >
                    <Pencil size={14} />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    title="حذف هذا القسم"
                  >
                    <Trash2 size={14} />
                    <span>حذف</span>
                  </button>
                </div>
              </div>

              {/* Quick Add Subcategory Box */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-gray-700 shrink-0">
                  <Plus size={16} className="text-blue-900" />
                  <span>إضافة قسم داخلي جديد لـ ({cat.nameAr}):</span>
                </div>
                <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                  <input
                    type="text"
                    value={newInputValue}
                    onChange={(e) => setNewSubcatInput({ ...newSubcatInput, [cat.nameAr]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubcatToCategory(cat);
                    }}
                    placeholder="اكتب اسم القسم (مثل: مكاوي، قلايات، حلل، شاشات...) ثم اضغط إضافة"
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubcatToCategory(cat)}
                    disabled={busy || !newInputValue.trim()}
                    className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-2xs disabled:opacity-40 shrink-0"
                  >
                    إضافة +
                  </button>
                </div>
              </div>

              {/* Subcategories Pills List with Product Counts */}
              <div>
                <span className="text-xs font-bold text-gray-500 block mb-2">
                  الأقسام الداخلية المعروضة بالمتجر ({subList.length} قسم):
                </span>
                <div className="flex flex-wrap gap-2">
                  {subList.map((sub) => {
                    const count = getProductCountForSub(sub, cat.nameAr);

                    return (
                      <div
                        key={sub}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition group ${
                          count > 0 
                            ? 'bg-blue-50/70 border-blue-200 text-blue-950 hover:bg-blue-100' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Tag size={12} className={count > 0 ? 'text-blue-900' : 'text-gray-400'} />
                        <span>{sub}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                          count > 0 ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {count} صنف
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcat(cat, sub)}
                          className="text-gray-400 hover:text-red-600 p-0.5 rounded-full hover:bg-white transition"
                          title={`حذف قسم ${sub}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
