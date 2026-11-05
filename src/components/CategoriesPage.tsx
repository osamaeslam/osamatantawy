import React, { useState } from 'react';
import { useProductPagination } from '../hooks/useProductPagination';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/mockData';
import { 
  SlidersHorizontal, 
  ArrowUpDown, 
  Grid3X3, 
  List, 
  Star, 
  ShoppingCart, 
  Heart,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
  MessageCircle
} from 'lucide-react';
import { Product } from '../types';
import { createProductWhatsAppUrl } from '../services/whatsapp-order';
import { getSafeImageSrc } from '../utils/imageHelper';

export const CategoriesPage: React.FC = () => {
  const { 
    products, 
    selectedCategory, 
    setSelectedCategory, 
    selectedSubcategory, 
    setSelectedSubcategory,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setSelectedProduct
  } = useApp();

  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'name'>('default');
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');
  const [itemGroupSearch, setItemGroupSearch] = useState('');

  // Identify active sector
  const isHomeSector = selectedCategory === 'أجهزة منزلية' || selectedCategory === 'Home Appliances';
  const isElectricSector = selectedCategory === 'أجهزة كهربيه' || selectedCategory === 'Electrical Appliances';

  // Products belonging to the active sector
  const sectorProducts = products.filter((p) => {
    if (isHomeSector) {
      return p.sector === 'أجهزة منزلية' || p.categoryAr === 'أجهزة منزلية' || p.category === 'Home Appliances';
    }
    if (isElectricSector) {
      return p.sector === 'أجهزة كهربيه' || p.categoryAr === 'أجهزة كهربيه' || p.category === 'Electrical Appliances';
    }
    if (selectedCategory) {
      return p.category === selectedCategory || p.categoryAr === selectedCategory || p.sector === selectedCategory;
    }
    return true;
  });

  // Standard predefined Item Groups
  const HOME_ITEM_GROUPS = [
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

  const ELECTRIC_ITEM_GROUPS = [
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

  // Dynamically extract all unique item groups and family names from actual products
  const productItemGroups = Array.from(
    new Set(
      sectorProducts
        .flatMap((p) => [p.itemGroup, p.familyName])
        .filter((val): val is string => Boolean(val && val.trim() !== ''))
    )
  );

  // Combine standard list according to sector + any custom groups found in product data
  const baseGroups = isHomeSector 
    ? HOME_ITEM_GROUPS 
    : isElectricSector 
    ? ELECTRIC_ITEM_GROUPS 
    : [...HOME_ITEM_GROUPS, ...ELECTRIC_ITEM_GROUPS];

  // Merge unique groups ensuring product data groups are present
  const allAvailableGroups = Array.from(
    new Set([...baseGroups, ...productItemGroups])
  );

  // Helper function to check if a product matches a given subcategory / item group
  const matchesSubcategory = (p: Product, sub: string): boolean => {
    if (!sub || sub === 'الكل') return true;
    const target = sub.trim().toLowerCase();
    const itemGroup = (p.itemGroup || '').toLowerCase().trim();
    const familyName = (p.familyName || '').toLowerCase().trim();
    const nameAr = (p.nameAr || '').toLowerCase();
    const nameEn = (p.name || '').toLowerCase();

    // 1. Exact or direct containment on itemGroup / familyName
    if (itemGroup === target || familyName === target) return true;
    if (itemGroup && (itemGroup.includes(target) || target.includes(itemGroup))) return true;
    if (familyName && (familyName.includes(target) || target.includes(familyName))) return true;

    // 2. Exact match in product title
    if (nameAr.includes(target) || nameEn.includes(target)) return true;

    // 3. Meaningful keywords matching (ignoring generic stop words like "أجهزة" which caused 736 false matches)
    const stopWords = ['أجهزة', 'جهاز', 'اجهزة', 'في', 'من', 'و', 'كافة', 'جميع', 'قسم'];
    const meaningfulWords = target
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.includes(w));

    if (meaningfulWords.length > 0 && meaningfulWords.some((w) => nameAr.includes(w) || nameEn.includes(w))) {
      return true;
    }

    return false;
  };

  // Calculate count for each group in the current sector
  const groupCounts: Record<string, number> = {};
  allAvailableGroups.forEach((group) => {
    groupCounts[group] = sectorProducts.filter((p) => matchesSubcategory(p, group)).length;
  });

  // Only retain groups that actually contain products (> 0) or the currently selected group
  const activeAvailableGroups = allAvailableGroups
    .filter((group) => (groupCounts[group] || 0) > 0 || group === selectedSubcategory)
    .sort((a, b) => (groupCounts[b] || 0) - (groupCounts[a] || 0));

  // Filter products by selected category and subcategory (Item Group)
  let filtered = sectorProducts;
  if (selectedSubcategory) {
    filtered = filtered.filter((p) => matchesSubcategory(p, selectedSubcategory));
  }

  // Filter groups list if user types in search
  const visibleGroups = activeAvailableGroups.filter((group) =>
    itemGroupSearch ? group.toLowerCase().includes(itemGroupSearch.trim().toLowerCase()) : true
  );

  // Pagination setup - show 10 products per page (applied to the fully filtered list)
  const { paginatedProducts, currentPage, totalPages, next, prev, pageNumbers, goTo, hasPreviousPage, hasNextPage, startIndex, endIndex } = useProductPagination({
    products: filtered,
    pageSize: 10,
    initialPage: 1,
  });

  // Sorting without prices
  const sorted = [...paginatedProducts()].sort((a, b) => {
    if (sortBy === 'rating') return b.overallrating - a.overallrating;
    if (sortBy === 'name') return a.nameAr.localeCompare(b.nameAr, 'ar');
    return 0;
  });

  const homeCount = products.filter(p => p.sector === 'أجهزة منزلية' || p.categoryAr === 'أجهزة منزلية').length;
  const electricCount = products.filter(p => p.sector === 'أجهزة كهربيه' || p.categoryAr === 'أجهزة كهربيه').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Category Pills Header & Sector Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-900 flex items-center gap-2">
              <span>
                {isHomeSector
                  ? 'أجهزة منزلية كبرى'
                  : isElectricSector
                  ? 'أجهزة كهربيه وشاشات وتكييفات'
                  : selectedCategory || 'جميع منتجات وأقسام طنطاوي جروب'}
              </span>
              <span className="text-xs bg-blue-50 text-blue-900 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                {filtered.length} صنف معروض
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isHomeSector
                ? 'تضم 21 قسماً داخلياً (ثلاجات، غسالات، بوتاجازات، ديب فريزر، ميكروويف...)'
                : isElectricSector
                ? 'تضم 15 قسماً داخلياً (شاشات 4K، تكييفات، مكانس، مراوح، دفايات...)'
                : 'تصفح كافة القطاعات والأقسام الداخلية المعتمدة مع إمكانية الفحص الكامل وكارت الفاتورة'}
            </p>
          </div>

          {(selectedCategory || selectedSubcategory) && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
              }}
              className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg transition"
            >
              إلغاء التصفية وعرض الكل
            </button>
          )}
        </div>

        {/* Sectors primary tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
              selectedCategory === null
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>جميع المنتجات</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${selectedCategory === null ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {products.length}
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('أجهزة منزلية');
              setSelectedSubcategory(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
              isHomeSector
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>أجهزة منزلية (21 قسم)</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${isHomeSector ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {homeCount}
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('أجهزة كهربيه');
              setSelectedSubcategory(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
              isElectricSector
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>أجهزة كهربيه (15 قسم)</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${isElectricSector ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {electricCount}
            </span>
          </button>
        </div>

        {/* Inner Subcategories (Item Groups) Section */}
        <div className="pt-3 border-t border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-gray-900">
                {isHomeSector 
                  ? 'الأقسام الداخلية للأجهزة المنزلية (21 صنف):' 
                  : isElectricSector 
                  ? 'الأقسام الداخلية للأجهزة الكهربية (15 صنف):' 
                  : 'الأقسام الداخلية والأصناف (Item Group):'}
              </span>
              {selectedSubcategory && (
                <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  محدد: {selectedSubcategory}
                  <button onClick={() => setSelectedSubcategory(null)} className="text-amber-800 hover:text-black font-black">✕</button>
                </span>
              )}
            </div>

            {/* Quick search inside item groups */}
            <input
              type="text"
              placeholder="بحث في الأقسام..."
              value={itemGroupSearch}
              onChange={(e) => setItemGroupSearch(e.target.value)}
              className="text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 w-28 sm:w-40 outline-none focus:border-blue-900 focus:bg-white transition"
            />
          </div>

          {/* Subcategories pills */}
          <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedSubcategory(null)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                selectedSubcategory === null
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>الكل</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedSubcategory === null ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {sectorProducts.length}
              </span>
            </button>

            {visibleGroups.map((group) => {
              const count = groupCounts[group] || 0;
              const isSelected = selectedSubcategory === group;

              return (
                <button
                  key={group}
                  onClick={() => setSelectedSubcategory(isSelected ? null : group)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-900 text-white font-bold ring-2 ring-blue-300 shadow-xs'
                      : count > 0
                      ? 'bg-gray-50 text-gray-800 hover:bg-blue-50 border border-gray-200 font-semibold'
                      : 'bg-gray-50/60 text-gray-400 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  <span>{group}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-blue-800 text-white'
                        : count > 0
                        ? 'bg-blue-100 text-blue-900 font-bold'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Bar: Sort and View Style */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 text-xs">
        <div className="flex items-center gap-2">
          <ArrowUpDown size={15} className="text-gray-400" />
          <span className="text-gray-500 font-medium hidden sm:inline">ترتيب حسب:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 font-bold outline-none cursor-pointer"
          >
            <option value="default">الترتيب الافتراضي</option>
            <option value="rating">الأعلى تقييماً</option>
            <option value="name">الاسم أبجدياً</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewStyle('grid')}
            className={`p-1 rounded ${viewStyle === 'grid' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500'}`}
            title="شبكة"
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewStyle('list')}
            className={`p-1 rounded ${viewStyle === 'list' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500'}`}
            title="قائمة"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Products Display (Grid vs List) */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 space-y-3">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Filter size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800">لا توجد منتجات في هذا القسم حالياً</h3>
          <p className="text-xs text-gray-500">جرب اختيار قسم آخر أو إلغاء فلتر البحث</p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }}
            className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
          >
            العودة لجميع المنتجات
          </button>
        </div>
      ) : viewStyle === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {sorted.map((product) => {
            const inWish = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col justify-between group relative"
              >
                <div className="absolute top-2 right-2 z-10 bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                  {product.brand}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  className="absolute top-2 left-2 z-10 p-1.5 bg-white/90 hover:bg-white rounded-full text-gray-400 hover:text-red-500 shadow-xs transition"
                >
                  <Heart size={16} className={inWish ? 'text-red-500 fill-red-500' : ''} />
                </button>

                <div
                  onClick={() => setSelectedProduct(product)}
                  className="aspect-square w-full overflow-hidden bg-gray-50 cursor-pointer p-4 flex items-center justify-center"
                >
                  <img
                    src={getSafeImageSrc(product.previewimage)}
                    referrerPolicy="no-referrer"
                    alt={product.nameAr}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-amber-500 mb-1">
                      <Star size={12} className="fill-amber-400" />
                      <span className="text-[11px] font-bold text-gray-700">{product.overallrating}</span>
                      <span className="text-[10px] text-gray-400">({product.reviews.length})</span>
                    </div>
                    <h3
                      onClick={() => setSelectedProduct(product)}
                      className="text-xs md:text-sm font-bold text-gray-800 hover:text-blue-900 transition cursor-pointer line-clamp-2"
                    >
                      {product.nameAr}
                    </h3>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="flex-1 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-900 text-blue-900 hover:text-white rounded-lg transition text-[11px] font-bold flex items-center justify-center gap-1"
                      title="إضافة الصنف لسلة الطلبات"
                    >
                      <ShoppingCart size={14} />
                      <span>إضافة للطلب</span>
                    </button>
                    <a
                      href={createProductWhatsAppUrl(product)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs flex items-center justify-center"
                      title="طلب فوري واستفسار عبر واتساب"
                    >
                      <MessageCircle size={14} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {sorted.map((product) => {
            const inWish = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 flex items-center gap-4 hover:shadow-md transition"
              >
                <div
                  onClick={() => setSelectedProduct(product)}
                  className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-lg shrink-0 cursor-pointer p-2 flex items-center justify-center"
                >
                  <img
                    src={getSafeImageSrc(product.previewimage)}
                    referrerPolicy="no-referrer"
                    alt={product.nameAr}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-blue-900 bg-blue-50 font-bold px-2 py-0.5 rounded">
                      {product.categoryAr}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      {product.brand}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500 mr-2">
                      <Star size={12} className="fill-amber-400" />
                      <span className="text-[11px] font-bold text-gray-700">{product.overallrating}</span>
                    </div>
                  </div>

                  <h3
                    onClick={() => setSelectedProduct(product)}
                    className="text-xs md:text-base font-bold text-gray-800 hover:text-blue-900 transition cursor-pointer line-clamp-1"
                  >
                    {product.nameAr}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1 hidden sm:block">
                    {product.summaryAr}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      متوفر للطلب الفوري واستخراج كارت الفاتورة
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <ShoppingCart size={14} />
                    <span className="hidden sm:inline">إضافة للطلب</span>
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="p-2 border border-gray-200 hover:border-red-300 rounded-lg text-gray-400 hover:text-red-500 transition flex items-center justify-center"
                  >
                    <Heart size={16} className={inWish ? 'text-red-500 fill-red-500' : ''} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 select-none">
          {hasPreviousPage && (
            <button
              onClick={() => goTo(currentPage - 1)}
              className="bg-white hover:bg-gray-100 text-gray-900 font-bold p-2 sm:px-3 sm:py-2 rounded-lg border border-gray-200 transition shadow-xs"
              title="الصفحة السابقة"
            >
              <ChevronRight size={18} />
            </button>
          )}
          {pageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => goTo(page)}
              className={`font-bold px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg transition shadow-xs ${
                currentPage === page 
                  ? 'bg-blue-900 text-white shadow-sm' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
          {hasNextPage && (
            <button
              onClick={() => goTo(currentPage + 1)}
              className="bg-white hover:bg-gray-100 text-gray-900 font-bold p-2 sm:px-3 sm:py-2 rounded-lg border border-gray-200 transition shadow-xs"
              title="الصفحة التالية"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
