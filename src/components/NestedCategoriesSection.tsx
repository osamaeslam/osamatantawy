import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronDown, 
  Search, 
  Layers, 
  Tv, 
  Refrigerator, 
  ExternalLink,
  Tag,
  ArrowRight
} from 'lucide-react';
import { getSafeImageSrc } from '../utils/imageHelper';

// Standard 21 Home item groups
const HOME_ITEM_GROUPS_BASELINE = [
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

// Standard 19 Electrical item groups
const ELECTRIC_ITEM_GROUPS_BASELINE = [
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

interface SubCategoryGroup {
  name: string;
  sector: 'home' | 'electric';
  sectorNameAr: string;
  products: Product[];
  count: number;
}

export const NestedCategoriesSection: React.FC = () => {
  const { 
    products, 
    setSelectedCategory, 
    setSelectedSubcategory, 
    setActiveTab, 
    setSelectedProduct 
  } = useApp();

  const [activeSector, setActiveSector] = useState<'all' | 'home' | 'electric'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>('ثلاجات');

  // Match helper based on itemGroup, familyName, and title
  const matchesGroup = (p: Product, groupName: string) => {
    const target = groupName.trim().toLowerCase();
    const itemGroup = (p.itemGroup || '').toLowerCase();
    const familyName = (p.familyName || '').toLowerCase();
    const nameAr = (p.nameAr || '').toLowerCase();

    if (itemGroup === target || familyName === target) return true;
    if (itemGroup.includes(target) || target.includes(itemGroup)) return true;
    if (familyName.includes(target) || target.includes(familyName)) return true;
    if (nameAr.includes(target)) return true;

    const stopWords = ['أجهزة', 'جهاز', 'اجهزة', 'في', 'من', 'و', 'كافة', 'جميع', 'قسم'];
    const meaningfulWords = target
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.includes(w));

    if (meaningfulWords.length > 0 && meaningfulWords.some((w) => nameAr.includes(w))) {
      return true;
    }
    return false;
  };

  // Dynamic grouping purely from actual products in catalog
  const subCategoriesData = useMemo(() => {
    const homeProducts = products.filter(
      (p) => p.sector === 'أجهزة منزلية' || p.categoryAr === 'أجهزة منزلية' || p.category === 'Home Appliances'
    );
    const electricProducts = products.filter(
      (p) => p.sector === 'أجهزة كهربيه' || p.categoryAr === 'أجهزة كهربيه' || p.category === 'Electrical Appliances'
    );

    // Helper to dynamically extract groups from a given product list
    const extractGroupsForProducts = (
      productList: Product[],
      sectorKey: 'home' | 'electric',
      sectorLabel: string,
      baselineFallback: string[]
    ): SubCategoryGroup[] => {
      // 1. Gather all item groups and family names present in products
      const uniqueNames = new Set<string>();
      productList.forEach((p) => {
        if (p.itemGroup && p.itemGroup.trim()) {
          uniqueNames.add(p.itemGroup.trim());
        }
        if (p.familyName && p.familyName.trim()) {
          uniqueNames.add(p.familyName.trim());
        }
      });

      // 2. If products don't specify itemGroup/familyName yet, check which baseline categories have actual matching products
      if (uniqueNames.size === 0) {
        baselineFallback.forEach((catName) => {
          if (productList.some((p) => matchesGroup(p, catName))) {
            uniqueNames.add(catName);
          }
        });
      }

      // 3. Build group objects and ONLY retain groups with count > 0 (Never display 0 منتج)
      const groups: SubCategoryGroup[] = [];
      uniqueNames.forEach((name) => {
        const matching = productList.filter((p) => matchesGroup(p, name));
        if (matching.length > 0) {
          groups.push({
            name,
            sector: sectorKey,
            sectorNameAr: sectorLabel,
            products: matching,
            count: matching.length,
          });
        }
      });

      // 4. Sort descending by product count so the most populated categories appear first
      groups.sort((a, b) => b.count - a.count);
      return groups;
    };

    const homeGroups = extractGroupsForProducts(
      homeProducts,
      'home',
      'أجهزة منزلية',
      HOME_ITEM_GROUPS_BASELINE
    );

    const electricGroups = extractGroupsForProducts(
      electricProducts,
      'electric',
      'أجهزة كهربيه',
      ELECTRIC_ITEM_GROUPS_BASELINE
    );

    return {
      homeGroups,
      electricGroups,
      allGroups: [...homeGroups, ...electricGroups],
      homeTotal: homeProducts.length,
      electricTotal: electricProducts.length,
    };
  }, [products]);

  // Filter groups according to active sector and search
  const displayedGroups = useMemo(() => {
    let list: SubCategoryGroup[] = [];
    if (activeSector === 'home') {
      list = subCategoriesData.homeGroups;
    } else if (activeSector === 'electric') {
      list = subCategoriesData.electricGroups;
    } else {
      list = subCategoriesData.allGroups;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (g) => g.name.toLowerCase().includes(q) || g.sectorNameAr.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeSector, searchQuery, subCategoriesData]);

  // Navigate to category page with selected subcategory
  const handleOpenSubcategory = (sectorNameAr: string, subcategoryName: string) => {
    setSelectedCategory(sectorNameAr);
    setSelectedSubcategory(subcategoryName);
    setActiveTab('categories');
  };

  return (
    <section className="bg-white rounded-3xl border border-gray-200 p-5 md:p-7 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <Layers size={18} />
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-black text-gray-900">
              دليل الأقسام والتصنيفات الفرعية (Item Groups)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            أقسام وتصنيفات فرعية مرتبطة بجدول منتجات طنطاوي جروب ({subCategoriesData.allGroups.length} قسماً فرعياً مفعلاً بالأصناف)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick search inside subcategories */}
          <div className="relative flex-1 md:w-56">
            <input
              type="text"
              placeholder="ابحث عن قسم فرعي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pr-8 pl-3 py-2 outline-none focus:border-blue-900 focus:bg-white transition"
            />
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              setActiveTab('categories');
            }}
            className="text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition shrink-0 flex items-center gap-1"
          >
            <span>كل المنتجات</span>
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/* Sector Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveSector('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
            activeSector === 'all'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Sparkles size={14} className="text-yellow-400" />
          <span>كافة الأقسام والتصنيفات ({subCategoriesData.allGroups.length})</span>
        </button>

        <button
          onClick={() => setActiveSector('home')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
            activeSector === 'home'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Refrigerator size={14} />
          <span>أجهزة منزلية ({subCategoriesData.homeGroups.length} قسم)</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
            {subCategoriesData.homeTotal} منتج
          </span>
        </button>

        <button
          onClick={() => setActiveSector('electric')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
            activeSector === 'electric'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Tv size={14} />
          <span>أجهزة كهربيه ({subCategoriesData.electricGroups.length} قسم)</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
            {subCategoriesData.electricTotal} منتج
          </span>
        </button>
      </div>

      {/* Nested Interactive Accordion & Sub-Categories Tree */}
      <div className="space-y-3">
        {displayedGroups.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl p-4 text-xs text-gray-500 font-bold">
            لا توجد أقسام فرعية مطابقة لبحثك "{searchQuery}"
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedGroups.map((group) => {
              const isExpanded = expandedGroup === group.name;
              const hasProducts = group.count > 0;
              const sampleProducts = group.products.slice(0, 3);

              return (
                <div
                  key={`${group.sector}-${group.name}`}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? 'border-blue-900/40 bg-blue-50/20 shadow-xs ring-1 ring-blue-900/10' 
                      : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50/50'
                  }`}
                >
                  {/* Master Subcategory Header */}
                  <div
                    onClick={() => setExpandedGroup(isExpanded ? null : group.name)}
                    className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        group.sector === 'home' 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'bg-slate-100 text-slate-900'
                      }`}>
                        {group.sector === 'home' ? <Refrigerator size={16} /> : <Tv size={16} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-gray-900 truncate">
                            {group.name}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            hasProducts 
                              ? 'bg-blue-900 text-white' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {group.count} منتج
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold block truncate">
                          القطاع: {group.sectorNameAr}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSubcategory(group.sectorNameAr, group.name);
                        }}
                        className="text-[11px] font-bold text-blue-900 hover:text-white bg-blue-50 hover:bg-blue-900 px-2.5 py-1 rounded-lg transition"
                        title="فتح القسم بالكامل"
                      >
                        عرض
                      </button>
                      <div className={`p-1 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-900' : ''}`}>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Nested Sub-tray Content (When Expanded) */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-blue-900/10 space-y-2.5 bg-white/70">
                      {hasProducts ? (
                        <>
                          <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                            <span>منتجات معروضة داخل هذا القسم ({group.count}):</span>
                            <span className="text-blue-900">مشمولة بالضمان وكارت الفاتورة</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {sampleProducts.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => setSelectedProduct(p)}
                                className="bg-white p-2 rounded-xl border border-gray-200 hover:border-blue-400 cursor-pointer transition flex items-center gap-2 group shadow-2xs"
                              >
                                <div className="w-11 h-11 bg-gray-50 rounded-lg p-1 shrink-0 overflow-hidden flex items-center justify-center">
                                  <img
                                    src={getSafeImageSrc(p.previewimage)}
                                    referrerPolicy="no-referrer"
                                    alt={p.nameAr}
                                    className="w-full h-full object-contain group-hover:scale-105 transition"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] text-blue-900 font-bold block truncate">
                                    {p.brand}
                                  </span>
                                  <h5 className="text-[11px] font-bold text-gray-800 truncate">
                                    {p.nameAr}
                                  </h5>
                                  <span className="text-[9px] text-gray-500 font-mono block">
                                    {p.unifiedCode || p.size || 'متوفر'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-xl text-center text-xs text-gray-400 font-bold">
                          هذا القسم متاح في كتالوج طنطاوي، وسيتم إضافة أحدث أصنافه فوراً من شيت البيانات.
                        </div>
                      )}

                      {/* Explore Entire Subcategory Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenSubcategory(group.sectorNameAr, group.name)}
                        className="w-full py-2 bg-gradient-to-r from-blue-950 to-blue-900 hover:from-blue-900 hover:to-indigo-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <span>تصفح كافة منتجات {group.name} في صفحة الأقسام ({group.count})</span>
                        <ChevronLeft size={15} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
