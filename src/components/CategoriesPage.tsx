import React, { useEffect, useState } from 'react';
import { useProductPagination } from '../hooks/useProductPagination';
import { useApp } from '../context/AppContext';
import {
  ArrowUpDown,
  Grid3X3,
  List,
  Star,
  ShoppingCart,
  Heart,
  ChevronRight,
  ChevronLeft,
  Filter,
  MessageCircle,
  Edit3,
  Scale,
} from 'lucide-react';
import { Product } from '../types';
import { createProductWhatsAppUrl } from '../services/whatsapp-order';
import { getSafeImageSrc } from '../utils/imageHelper';
import { normalizeImageUrl } from '../services/image-url';
import { INITIAL_HOMEPAGE_CONFIG } from '../data/mockData';
import { getStockMeta } from '../utils/stockStatus';
import {
  STOREFRONT_TEXT,
  getNumberLocale,
  getLocalizedProductName,
  getLocalizedProductCategory,
  getLocalizedProductSummary,
  translateSectorLabel,
  translateSubcategoryLabel,
} from '../i18n/translations';

export const CategoriesPage: React.FC = () => {
  const {
    products,
    categories,
    homePageConfig,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setQuickViewProduct,
    stockStatusMap,
    supabaseProductCount,
    searchCatalogServer,
    mergeProductsIntoState,
    loadMoreProductsFromDatabase,
    isLoadingMoreProducts,
    toggleCompare,
    isInCompare,
    language,
  } = useApp();

  const t = STOREFRONT_TEXT[language];
  const tc = t.categories;
  const th = t.home;
  const numLocale = getNumberLocale(language);
  const isRtl = language === 'ar';

  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'name'>('default');
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');
  const [itemGroupSearch, setItemGroupSearch] = useState('');

  const isHomeSector =
    selectedCategory === 'أجهزة منزلية' || selectedCategory === 'Home Appliances';
  const isElectricSector =
    selectedCategory === 'أجهزة كهربيه' || selectedCategory === 'Electrical Appliances';

  useEffect(() => {
    if (supabaseProductCount <= products.length) return;
    if (!selectedCategory && !selectedSubcategory) return;
    const catParam = isHomeSector
      ? 'أجهزة منزلية'
      : isElectricSector
      ? 'أجهزة كهربيه'
      : selectedCategory;

    searchCatalogServer({
      category: catParam,
      query: selectedSubcategory || undefined,
      page: 1,
      pageSize: 24,
    })
      .then((res) => mergeProductsIntoState(res.products))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSubcategory, isHomeSector, isElectricSector, supabaseProductCount]);

  const sectorProducts = products.filter((p) => {
    if (isHomeSector) {
      return (
        p.sector === 'أجهزة منزلية' ||
        p.categoryAr === 'أجهزة منزلية' ||
        p.category === 'Home Appliances'
      );
    }
    if (isElectricSector) {
      return (
        p.sector === 'أجهزة كهربيه' ||
        p.categoryAr === 'أجهزة كهربيه' ||
        p.category === 'Electrical Appliances'
      );
    }
    if (selectedCategory) {
      return (
        p.category === selectedCategory ||
        p.categoryAr === selectedCategory ||
        p.sector === selectedCategory
      );
    }
    return true;
  });

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
    'مبردات مياه',
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
    'أجهزة عناية شخصية واستشوار',
  ];

  const productItemGroups = Array.from(
    new Set(
      sectorProducts
        .flatMap((p) => [p.itemGroup, p.familyName])
        .filter((val): val is string => Boolean(val && val.trim() !== ''))
    )
  );

  const liveHomeCat = categories.find(
    (c) => c.nameAr === 'أجهزة منزلية' || c.name === 'Home Appliances'
  );
  const liveElectricCat = categories.find(
    (c) => c.nameAr === 'أجهزة كهربيه' || c.name === 'Electrical Appliances'
  );

  const dynamicHomeGroups = liveHomeCat?.subcategoriesAr?.length
    ? Array.from(new Set([...liveHomeCat.subcategoriesAr, ...HOME_ITEM_GROUPS]))
    : HOME_ITEM_GROUPS;
  const dynamicElectricGroups = liveElectricCat?.subcategoriesAr?.length
    ? Array.from(new Set([...liveElectricCat.subcategoriesAr, ...ELECTRIC_ITEM_GROUPS]))
    : ELECTRIC_ITEM_GROUPS;

  const baseGroups = isHomeSector
    ? dynamicHomeGroups
    : isElectricSector
    ? dynamicElectricGroups
    : [...dynamicHomeGroups, ...dynamicElectricGroups];

  const allAvailableGroups = Array.from(new Set([...baseGroups, ...productItemGroups]));

  const matchesSubcategory = (p: Product, sub: string): boolean => {
    if (!sub || sub === 'الكل') return true;
    const target = sub.trim().toLowerCase();
    const itemGroup = (p.itemGroup || '').toLowerCase().trim();
    const familyName = (p.familyName || '').toLowerCase().trim();
    const nameAr = (p.nameAr || '').toLowerCase();
    const nameEn = (p.name || '').toLowerCase();

    if (itemGroup === target || familyName === target) return true;
    if (itemGroup && (itemGroup.includes(target) || target.includes(itemGroup))) return true;
    if (familyName && (familyName.includes(target) || target.includes(familyName))) return true;
    if (nameAr.includes(target) || nameEn.includes(target)) return true;

    const stopWords = ['أجهزة', 'جهاز', 'اجهزة', 'في', 'من', 'و', 'كافة', 'جميع', 'قسم'];
    const meaningfulWords = target
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.includes(w));

    if (meaningfulWords.length > 0 && meaningfulWords.some((w) => nameAr.includes(w) || nameEn.includes(w))) {
      return true;
    }

    return false;
  };

  const groupCounts: Record<string, number> = {};
  allAvailableGroups.forEach((group) => {
    groupCounts[group] = sectorProducts.filter((p) => matchesSubcategory(p, group)).length;
  });

  const activeAvailableGroups = allAvailableGroups
    .filter((group) => (groupCounts[group] || 0) > 0 || group === selectedSubcategory)
    .sort((a, b) => (groupCounts[b] || 0) - (groupCounts[a] || 0));

  let filtered = sectorProducts;
  if (selectedSubcategory) {
    filtered = filtered.filter((p) => matchesSubcategory(p, selectedSubcategory));
  }

  const visibleGroups = activeAvailableGroups.filter((group) => {
    if (!itemGroupSearch.trim()) return true;
    const q = itemGroupSearch.trim().toLowerCase();
    return (
      group.toLowerCase().includes(q) ||
      translateSubcategoryLabel(group, 'en').toLowerCase().includes(q)
    );
  });

  const {
    paginatedProducts,
    currentPage,
    totalPages,
    pageNumbers,
    goTo,
    hasPreviousPage,
    hasNextPage,
  } = useProductPagination({
    products: filtered,
    pageSize: 10,
    initialPage: 1,
  });

  const sorted = [...paginatedProducts()].sort((a, b) => {
    if (sortBy === 'rating') return b.overallrating - a.overallrating;
    if (sortBy === 'name') {
      return getLocalizedProductName(a, language).localeCompare(
        getLocalizedProductName(b, language),
        language === 'en' ? 'en' : 'ar'
      );
    }
    return 0;
  });

  const homeCount = products.filter(
    (p) => p.sector === 'أجهزة منزلية' || p.categoryAr === 'أجهزة منزلية'
  ).length;
  const electricCount = products.filter(
    (p) => p.sector === 'أجهزة كهربيه' || p.categoryAr === 'أجهزة كهربيه'
  ).length;

  const activeSectorBanner = isHomeSector
    ? homePageConfig.sectionBanners?.homeAppliances ||
      INITIAL_HOMEPAGE_CONFIG.sectionBanners!.homeAppliances
    : isElectricSector
    ? homePageConfig.sectionBanners?.electricalAppliances ||
      INITIAL_HOMEPAGE_CONFIG.sectionBanners!.electricalAppliances
    : null;

  return (
    <div className="space-y-6 pb-16">
      {activeSectorBanner && (
        <div
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${activeSectorBanner.bgGradient} text-white p-5 sm:p-7 shadow-md flex flex-col sm:flex-row items-center justify-between gap-5`}
        >
          <div className="relative z-10 space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-yellow-400 text-blue-950 text-[11px] font-black px-3 py-0.5 rounded-full">
                {isRtl ? activeSectorBanner.badge : t.header.homeAppliances}
              </span>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#admin-cms-sections';
                  window.dispatchEvent(new HashChangeEvent('hashchange'));
                }}
                className="text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white px-2.5 py-0.5 rounded-full border border-white/20 transition inline-flex items-center gap-1"
                title={tc.editSectorBanner}
              >
                <Edit3 size={11} />
                <span>{tc.editSectorBanner}</span>
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-snug">
              {isRtl ? activeSectorBanner.title : isHomeSector ? tc.homeTitle : tc.electricTitle}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              {isRtl
                ? activeSectorBanner.subtitle
                : isHomeSector
                ? tc.homeDesc(dynamicHomeGroups.length)
                : tc.electricDesc(dynamicElectricGroups.length)}
            </p>
          </div>
          {activeSectorBanner.image && (
            <div className="w-full sm:w-44 h-36 sm:h-32 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 shrink-0 bg-white/10">
              <img
                src={normalizeImageUrl(activeSectorBanner.image, undefined, 700)}
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                alt={activeSectorBanner.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      {/* Category Header & Sector Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-900 flex flex-wrap items-center gap-2">
              <span>
                {isHomeSector
                  ? tc.homeTitle
                  : isElectricSector
                  ? tc.electricTitle
                  : selectedCategory
                  ? translateSectorLabel(selectedCategory, language)
                  : tc.allTitle}
              </span>
              <span className="text-xs bg-blue-50 text-blue-900 font-bold px-2.5 py-0.5 rounded-full border border-blue-200 tabular-nums">
                {tc.shownCount(filtered.length.toLocaleString(numLocale))}
              </span>
              {supabaseProductCount > products.length && (
                <button
                  type="button"
                  disabled={isLoadingMoreProducts}
                  onClick={() => loadMoreProductsFromDatabase(120)}
                  className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full tabular-nums transition"
                >
                  {isLoadingMoreProducts
                    ? tc.loadingText
                    : tc.shownOfTotal(
                        products.length.toLocaleString(numLocale),
                        supabaseProductCount.toLocaleString(numLocale)
                      )}
                </button>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isHomeSector
                ? tc.homeDesc(dynamicHomeGroups.length)
                : isElectricSector
                ? tc.electricDesc(dynamicElectricGroups.length)
                : tc.defaultDesc}
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
              {tc.clearFilter}
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
            <span>{t.header.allProductsNav}</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === null ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
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
            <span>
              {t.header.homeAppliances} {tc.deptCountSuffix(dynamicHomeGroups.length)}
            </span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                isHomeSector ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
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
            <span>
              {t.header.electricalAppliances} {tc.deptCountSuffix(dynamicElectricGroups.length)}
            </span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                isElectricSector ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {electricCount}
            </span>
          </button>
        </div>

        {/* Inner Subcategories */}
        <div className="pt-3 border-t border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-gray-900">
                {isHomeSector
                  ? tc.homeGroupsTitle(dynamicHomeGroups.length)
                  : isElectricSector
                  ? tc.electricGroupsTitle(dynamicElectricGroups.length)
                  : tc.defaultGroupsTitle}
              </span>
              {selectedSubcategory && (
                <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  {tc.selectedPrefix} {translateSubcategoryLabel(selectedSubcategory, language)}
                  <button
                    onClick={() => setSelectedSubcategory(null)}
                    className="text-amber-800 hover:text-black font-black"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>

            <input
              type="text"
              placeholder={tc.searchGroupsPlaceholder}
              value={itemGroupSearch}
              onChange={(e) => setItemGroupSearch(e.target.value)}
              className="text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 w-28 sm:w-40 outline-none focus:border-blue-900 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              onClick={() => setSelectedSubcategory(null)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                selectedSubcategory === null
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{th.allTab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedSubcategory === null ? 'bg-blue-800 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
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
                  <span>{translateSubcategoryLabel(group, language)}</span>
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

      {/* Control Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 text-xs">
        <div className="flex items-center gap-2">
          <ArrowUpDown size={15} className="text-gray-400" />
          <span className="text-gray-500 font-medium hidden sm:inline">{tc.sortBy}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 font-bold outline-none cursor-pointer"
          >
            <option value="default">{tc.sortDefault}</option>
            <option value="rating">{tc.sortRating}</option>
            <option value="name">{tc.sortName}</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewStyle('grid')}
            className={`p-1 rounded ${viewStyle === 'grid' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500'}`}
            title={tc.gridTitle}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewStyle('list')}
            className={`p-1 rounded ${viewStyle === 'list' ? 'bg-white text-blue-900 shadow-xs' : 'text-gray-500'}`}
            title={tc.listTitle}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Products Display */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 space-y-3">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Filter size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800">{tc.emptyCatTitle}</h3>
          <p className="text-xs text-gray-500">{tc.emptyCatSub}</p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }}
            className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
          >
            {tc.backToAll}
          </button>
        </div>
      ) : viewStyle === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {sorted.map((product) => {
            const inWish = isInWishlist(product.id);
            const stockMeta = getStockMeta(product, stockStatusMap, language);
            const displayTitle = getLocalizedProductName(product, language);

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col justify-between group relative"
              >
                <div className="absolute top-2 start-2 z-10 bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                  {product.brand}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  className="absolute top-2 end-2 z-10 p-1.5 bg-white/90 hover:bg-white rounded-full text-gray-400 hover:text-red-500 shadow-xs transition"
                >
                  <Heart size={16} className={inWish ? 'text-red-500 fill-red-500' : ''} />
                </button>

                <div
                  onClick={() => setQuickViewProduct(product)}
                  className="aspect-square w-full overflow-hidden bg-gray-50 cursor-pointer p-4 flex items-center justify-center"
                >
                  <img
                    src={getSafeImageSrc(normalizeImageUrl(product.previewimage, undefined, 500))}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    alt={displayTitle}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-amber-500 mb-1">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400" />
                        <span className="text-[11px] font-bold text-gray-700">{product.overallrating}</span>
                        <span className="text-[10px] text-gray-400">({product.reviews.length})</span>
                      </div>
                      {stockMeta.status !== 'available' && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${stockMeta.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${stockMeta.dotClass}`} />
                          <span>{stockMeta.shortLabel}</span>
                        </span>
                      )}
                    </div>
                    <h3
                      onClick={() => setQuickViewProduct(product)}
                      className="text-xs md:text-sm font-bold text-gray-800 hover:text-blue-900 transition cursor-pointer line-clamp-2"
                    >
                      {displayTitle}
                    </h3>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                    <button
                      disabled={!stockMeta.canOrder}
                      onClick={() => addToCart(product, 1)}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg transition text-[11px] font-bold flex items-center justify-center gap-1 ${
                        stockMeta.canOrder
                          ? 'bg-blue-50 hover:bg-blue-900 text-blue-900 hover:text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                      title={stockMeta.canOrder ? th.addToOrder : th.outOfStock}
                    >
                      <ShoppingCart size={14} />
                      <span>{stockMeta.canOrder ? th.addToOrder : th.outOfStock}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCompare(product)}
                      className={`p-1.5 rounded-lg border transition flex items-center justify-center ${
                        isInCompare(product.id)
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-900'
                      }`}
                      title={isInCompare(product.id) ? th.inCompareTitle : th.compareTitle}
                      aria-label={th.compareTitle}
                    >
                      <Scale size={14} />
                    </button>
                    <a
                      href={createProductWhatsAppUrl(product)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs flex items-center justify-center"
                      title={th.whatsappInquiry}
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
        <div className="space-y-3">
          {sorted.map((product) => {
            const inWish = isInWishlist(product.id);
            const stockMeta = getStockMeta(product, stockStatusMap, language);
            const displayTitle = getLocalizedProductName(product, language);
            const displayCat = getLocalizedProductCategory(product, language);
            const displaySummary = getLocalizedProductSummary(product, language);

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 flex items-center gap-4 hover:shadow-md transition"
              >
                <div
                  onClick={() => setQuickViewProduct(product)}
                  className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-lg shrink-0 cursor-pointer p-2 flex items-center justify-center"
                >
                  <img
                    src={getSafeImageSrc(normalizeImageUrl(product.previewimage, undefined, 500))}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    alt={displayTitle}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-blue-900 bg-blue-50 font-bold px-2 py-0.5 rounded">
                      {displayCat}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">{product.brand}</span>
                    <div className="flex items-center gap-1 text-amber-500 ms-2">
                      <Star size={12} className="fill-amber-400" />
                      <span className="text-[11px] font-bold text-gray-700">{product.overallrating}</span>
                    </div>
                  </div>

                  <h3
                    onClick={() => setQuickViewProduct(product)}
                    className="text-xs md:text-base font-bold text-gray-800 hover:text-blue-900 transition cursor-pointer line-clamp-1"
                  >
                    {displayTitle}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1 hidden sm:block">
                    {displaySummary}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${stockMeta.badgeClass}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${stockMeta.dotClass}`} />
                      <span>{stockMeta.label}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    disabled={!stockMeta.canOrder}
                    onClick={() => addToCart(product, 1)}
                    className={`text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs ${
                      stockMeta.canOrder
                        ? 'bg-blue-900 hover:bg-blue-950 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart size={14} />
                    <span className="hidden sm:inline">
                      {stockMeta.canOrder ? th.addToOrder : th.outOfStock}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleCompare(product)}
                      className={`p-2 border rounded-lg transition flex items-center justify-center ${
                        isInCompare(product.id)
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'border-gray-200 hover:border-blue-400 text-gray-500 hover:text-blue-900'
                      }`}
                      title={isInCompare(product.id) ? th.inCompareTitle : th.compareTitle}
                      aria-label={th.compareTitle}
                    >
                      <Scale size={16} />
                    </button>
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="p-2 border border-gray-200 hover:border-red-300 rounded-lg text-gray-400 hover:text-red-500 transition flex items-center justify-center"
                    >
                      <Heart size={16} className={inWish ? 'text-red-500 fill-red-500' : ''} />
                    </button>
                  </div>
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
              title={th.prevPage}
            >
              {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
              onClick={() => {
                const nextP = currentPage + 1;
                goTo(nextP);
                if (nextP >= totalPages && supabaseProductCount > products.length && !isLoadingMoreProducts) {
                  void loadMoreProductsFromDatabase(24);
                }
              }}
              className="bg-white hover:bg-gray-100 text-gray-900 font-bold p-2 sm:px-3 sm:py-2 rounded-lg border border-gray-200 transition shadow-xs"
              title={th.nextPage}
            >
              {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
        </div>
      )}

      {supabaseProductCount > products.length && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            disabled={isLoadingMoreProducts}
            onClick={() => loadMoreProductsFromDatabase(24)}
            className="bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 font-bold text-xs px-4 py-2 rounded-xl transition shadow-2xs disabled:opacity-60 tabular-nums"
          >
            {isLoadingMoreProducts
              ? th.loadingNextBatch
              : th.loadMore24(
                  products.length.toLocaleString(numLocale),
                  supabaseProductCount.toLocaleString(numLocale)
                )}
          </button>
        </div>
      )}
    </div>
  );
};
