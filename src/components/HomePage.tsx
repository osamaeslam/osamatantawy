import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useProductPagination } from '../hooks/useProductPagination';
import { CATEGORIES } from '../data/mockData';
import {
  Zap,
  ChevronRight,
  ChevronLeft,
  Star,
  ShoppingCart,
  Heart,
  Clock,
  Truck,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Award,
  MessageCircle,
  Edit3,
  Search,
  X,
  Barcode,
  Package,
  Scale,
  Download,
} from 'lucide-react';
import { Product } from '../types';
import { FAQSection } from './FAQSection';
import { NestedCategoriesSection } from './NestedCategoriesSection';
import { createProductWhatsAppUrl } from '../services/whatsapp-order';
import { normalizeImageUrl } from '../services/image-url';
import { smartSearchProducts } from '../utils/smartSearch';
import { BundlesShowcase } from './BundlesShowcase';
import { getStockMeta } from '../utils/stockStatus';
import { searchAnalyticsService } from '../services/search-analytics.service';
import {
  STOREFRONT_TEXT,
  getNumberLocale,
  getLocalizedProductName,
  getLocalizedProductCategory,
  getLocalizedCategoryName,
  getLocalizedCategoryDesc,
  translateSubcategoryLabel,
} from '../i18n/translations';

export const HomePage: React.FC = () => {
  const {
    products,
    categories,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setQuickViewProduct,
    setActiveTab,
    setSelectedCategory,
    setSelectedSubcategory,
    setIsAboutModalOpen,
    setIsOrderTrackingOpen,
    searchQuery,
    setSearchQuery,
    homePageConfig,
    isSyncingWithDatabase,
    isLoadingMoreProducts,
    loadMoreProductsFromDatabase,
    stockStatusMap,
    supabaseProductCount,
    searchCatalogServer,
    toggleCompare,
    isInCompare,
    recentlyViewed,
    clearRecentlyViewed,
    openItemRequestModal,
    offlineDownloadProgress,
    startOfflineCatalogDownload,
    language,
  } = useApp();

  const t = STOREFRONT_TEXT[language];
  const th = t.home;
  const numLocale = getNumberLocale(language);
  const isRtl = language === 'ar';

  const [homeSectorFilter, setHomeSectorFilter] = useState<'all' | 'home' | 'electric'>('all');

  const heroBanners =
    homePageConfig.heroBanners && homePageConfig.heroBanners.length > 0
      ? homePageConfig.heroBanners
      : [
          {
            id: 1,
            title: isRtl
              ? 'أجهزة منزلية كبرى بضمان الوكيل'
              : 'Major Home Appliances with Official Warranty',
            subtitle: isRtl
              ? 'أحدث موديلات الثلاجات، الغسالات، البوتاجازات، والتكييفات بضمان الوكيل الرسمي وضمان طنطاوي'
              : 'Latest refrigerators, washers, cookers, and ACs backed by official agent & Tantawy Group warranty',
            badge: isRtl ? 'ضمان الوكيل المعتمد' : 'Certified Warranty',
            buttonText: isRtl ? 'تصفح الأجهزة المنزلية' : 'Browse Home Appliances',
            category: 'أجهزة منزلية',
            bgGradient: 'from-blue-950 via-blue-900 to-indigo-900',
            image:
              'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=1600&auto=format&fit=crop&q=80',
            linkCategory: 'أجهزة منزلية',
          },
        ];

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const [isQuickSearchFocused, setIsQuickSearchFocused] = useState(false);
  const quickSearchRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (quickSearchRef.current && !quickSearchRef.current.contains(e.target as Node)) {
        setIsQuickSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const [serverSearchResults, setServerSearchResults] = useState<Product[]>([]);
  const [serverSearchTotal, setServerSearchTotal] = useState<number>(0);
  const [isSearchingServer, setIsSearchingServer] = useState<boolean>(false);

  const smartSearch = useMemo(
    () => smartSearchProducts(products, searchQuery, 5),
    [products, searchQuery]
  );

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setServerSearchResults([]);
      setServerSearchTotal(0);
      setIsSearchingServer(false);
      return;
    }

    const shouldQueryServer =
      supabaseProductCount > products.length || smartSearch.allMatches.length < 5;
    if (!shouldQueryServer) {
      setServerSearchResults([]);
      setServerSearchTotal(0);
      return;
    }

    let cancelled = false;
    setIsSearchingServer(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await searchCatalogServer({ query: trimmed, page: 1, pageSize: 24 });
        if (!cancelled) {
          setServerSearchResults(res.products);
          setServerSearchTotal(res.totalCount);
        }
      } catch (err) {
        console.warn('Server search fallback error:', err);
      } finally {
        if (!cancelled) setIsSearchingServer(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, supabaseProductCount, products.length, smartSearch.allMatches.length, searchCatalogServer]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return smartSearch.allMatches;
    if (serverSearchResults.length === 0) return smartSearch.allMatches;
    const seen = new Set(smartSearch.allMatches.map((p) => p.id));
    const extra = serverSearchResults.filter((p) => !seen.has(p.id));
    return [...smartSearch.allMatches, ...extra];
  }, [searchQuery, smartSearch.allMatches, serverSearchResults]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2 || isSearchingServer) return;
    if (filteredProducts.length > 0) return;

    const timer = window.setTimeout(() => {
      void searchAnalyticsService.trackZeroResultSearch(trimmed);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [searchQuery, filteredProducts.length, isSearchingServer]);

  const sectorFilteredProducts = useMemo(() => {
    if (searchQuery.trim() || homeSectorFilter === 'all') return filteredProducts;
    if (homeSectorFilter === 'home') {
      return filteredProducts.filter(
        (p) =>
          p.sector === 'أجهزة منزلية' ||
          p.categoryAr === 'أجهزة منزلية' ||
          p.category === 'Home Appliances'
      );
    }
    return filteredProducts.filter(
      (p) =>
        p.sector === 'أجهزة كهربيه' ||
        p.categoryAr === 'أجهزة كهربيه' ||
        p.category === 'Electrical Appliances'
    );
  }, [filteredProducts, searchQuery, homeSectorFilter]);

  const {
    paginatedProducts,
    currentPage,
    totalPages,
    pageNumbers,
    goTo,
    hasPreviousPage,
    hasNextPage,
  } = useProductPagination({
    products: sectorFilteredProducts,
    pageSize: 12,
    initialPage: 1,
  });

  const pageProducts = paginatedProducts();
  const deals = products.filter((p) => p.isDeal).slice(0, 8);
  const quickSuggestions = searchQuery.trim() ? filteredProducts.slice(0, 5) : [];

  const quickTags = isRtl
    ? [
        { label: 'شاشة', query: 'شاشة' },
        { label: 'ثلاجة', query: 'ثلاجة' },
        { label: 'خلاط', query: 'خلاط' },
        { label: 'مكواة', query: 'مكواة' },
        { label: 'طقم حلل', query: 'طقم حلل' },
        { label: 'قلاية', query: 'قلاية' },
      ]
    : [
        { label: 'Smart TV', query: 'شاشة' },
        { label: 'Fridge', query: 'ثلاجة' },
        { label: 'Blender', query: 'خلاط' },
        { label: 'Iron', query: 'مكواة' },
        { label: 'Cookware', query: 'طقم حلل' },
        { label: 'Air Fryer', query: 'قلاية' },
      ];

  const displayCategories = categories.length > 0 ? categories : CATEGORIES;

  const promoDefaults = [
    {
      id: 'promo-1',
      badge: t.header.homeAppliances,
      badgeBg: 'bg-red-600 text-white',
      title: isRtl ? 'ثلاجات، غسالات وبوتاجازات' : 'Fridges, Washers & Cookers',
      subtitle: isRtl
        ? 'شارب، إل جي، فريش، وكاريير بضمان الوكيل المعتمد وضمان طنطاوي'
        : 'Sharp, LG, Fresh, & Carrier with Official Agent & Tantawy Warranty',
      buttonText: isRtl ? 'تصفح الأجهزة الكبرى' : 'Browse Major Appliances',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80',
      bgGradient: 'from-blue-950 to-blue-800',
      linkCategory: 'أجهزة منزلية',
    },
    {
      id: 'promo-2',
      badge: isRtl ? 'شاشات وتلفزيونات 4K' : '4K Smart TVs & Displays',
      badgeBg: 'bg-amber-500 text-black',
      title: isRtl ? 'شاشات سامسونج وتوشيبا وإل جي' : 'Samsung, Toshiba & LG Smart TVs',
      subtitle: isRtl
        ? 'وضوح كريستالي مع ريسيفر داخلي وتوصيل سريع لكافة المحافظات'
        : 'Crystal-clear 4K UHD with built-in receiver & fast nationwide delivery',
      buttonText: isRtl ? 'تصفح الشاشات الذكية' : 'Browse Smart TVs',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
      bgGradient: 'from-slate-900 to-indigo-950',
      linkCategory: 'أجهزة كهربيه',
    },
  ];

  const activePromos =
    isRtl && homePageConfig.promoBanners && homePageConfig.promoBanners.length > 0
      ? homePageConfig.promoBanners
      : promoDefaults;

  return (
    <div className="space-y-6 md:space-y-10 pb-16">
      {/* Fast Home Catalog Search Bar */}
      <section className="bg-gradient-to-l from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-4 sm:p-6 shadow-md border border-blue-800/40 relative">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-yellow-400 text-blue-950 flex items-center justify-center shrink-0 shadow-xs">
                <Search size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black flex items-center gap-2 flex-wrap">
                  <span>{th.fastSearchTitle}</span>
                  <span className="text-[10px] bg-white/15 text-yellow-300 px-2 py-0.5 rounded-full font-bold tabular-nums">
                    {(supabaseProductCount || products.length).toLocaleString(numLocale)} {th.itemWord}
                  </span>
                </h2>
                <p className="text-[11px] text-blue-200">{th.fastSearchSubtitle}</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-blue-100 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 shrink-0">
              <Barcode size={14} className="text-yellow-300" />
              <span>{th.codeSupportBadge}</span>
            </div>
          </div>

          <div className="relative" ref={quickSearchRef}>
            <div className="flex items-center bg-white rounded-2xl shadow-lg border-2 border-transparent focus-within:border-yellow-400 transition overflow-hidden">
              <span className="ps-3.5 sm:ps-4 pe-2 text-gray-400 shrink-0">
                <Search size={19} className="text-blue-900" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsQuickSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length >= 1) setIsQuickSearchFocused(true);
                }}
                placeholder={th.searchInputPlaceholder}
                className="w-full py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2.5 sm:px-3 py-2 text-gray-400 hover:text-red-600 transition flex items-center gap-1 text-xs font-bold shrink-0"
                  title={th.clearBtn}
                >
                  <X size={16} />
                  <span className="hidden sm:inline">{th.clearBtn}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsQuickSearchFocused(false)}
                className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black text-xs sm:text-sm px-3.5 sm:px-6 py-3 sm:py-3.5 transition shrink-0 whitespace-nowrap"
              >
                {th.searchNowBtn}
              </button>
            </div>

            {isQuickSearchFocused && searchQuery.trim().length >= 1 && (
              <div className="absolute right-0 left-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-30 overflow-hidden divide-y divide-gray-100">
                <div className="px-3.5 py-2.5 bg-gradient-to-l from-blue-50 to-slate-50 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-blue-950 font-black flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>{th.closestHeader(Math.min(5, quickSuggestions.length), searchQuery)}</span>
                  </span>
                  <span className="text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full text-[10px]">
                    {filteredProducts.length} {t.header.resultsCountSuffix}
                  </span>
                </div>
                {quickSuggestions.length === 0 ? (
                  <div className="p-5 text-center text-xs text-gray-500">{th.noQuickSuggestions}</div>
                ) : (
                  quickSuggestions.map((item) => {
                    const sMeta = getStockMeta(item, stockStatusMap, language);
                    const displayTitle = getLocalizedProductName(item, language);
                    const displayCat = getLocalizedProductCategory(item, language);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setQuickViewProduct(item);
                          setIsQuickSearchFocused(false);
                        }}
                        className={`w-full p-2.5 sm:px-4 hover:bg-blue-50/70 active:bg-blue-50 cursor-pointer transition flex items-center justify-between gap-2.5 ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <img
                            src={normalizeImageUrl(item.previewimage, undefined, 200)}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                            alt={displayTitle}
                            className="w-11 h-11 rounded-xl object-contain bg-gray-50 border border-gray-100 p-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{displayTitle}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5 flex-wrap">
                              {item.brand && <span className="text-blue-800 font-black">{item.brand}</span>}
                              {displayCat && <span className="truncate max-w-[120px]">• {displayCat}</span>}
                              {(item.unifiedCode || item.itemNumber) && (
                                <span className="font-mono font-bold bg-blue-50 text-blue-900 px-1.5 py-0.2 rounded">
                                  {item.unifiedCode || item.itemNumber}
                                </span>
                              )}
                              {sMeta.status !== 'available' && (
                                <span
                                  className={`font-bold px-1.5 py-0.2 rounded border inline-flex items-center gap-1 ${sMeta.badgeClass}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${sMeta.dotClass}`} />
                                  <span>{sMeta.shortLabel}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={!sMeta.canOrder}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item, 1);
                            }}
                            className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl transition flex items-center gap-1 ${
                              sMeta.canOrder
                                ? 'bg-blue-900 hover:bg-blue-950 text-white'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                            title={sMeta.canOrder ? th.addToOrder : th.outOfStock}
                          >
                            <ShoppingCart size={12} />
                            <span className="hidden sm:inline">
                              {sMeta.canOrder ? t.header.addShort : th.outShort}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Quick Tags & Shortcuts */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-blue-200 font-bold me-1">{th.popularSearches}</span>
              {quickTags.map((tag) => (
                <button
                  key={tag.query}
                  type="button"
                  onClick={() => setSearchQuery(tag.query)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    searchQuery === tag.query
                      ? 'bg-yellow-400 text-blue-950'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setIsOrderTrackingOpen(true)}
                className="bg-emerald-500/90 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs"
              >
                <Truck size={13} />
                <span>{th.trackByPhone}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('أجهزة منزلية');
                  setSelectedSubcategory(null);
                  setActiveTab('categories');
                }}
                className="bg-white/10 hover:bg-white/20 text-yellow-200 border border-white/15 font-bold px-2.5 py-1.5 rounded-lg transition"
              >
                {t.header.homeAppliances}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('أجهزة كهربيه');
                  setSelectedSubcategory(null);
                  setActiveTab('categories');
                }}
                className="bg-white/10 hover:bg-white/20 text-yellow-200 border border-white/15 font-bold px-2.5 py-1.5 rounded-lg transition"
              >
                {t.header.electricalAppliances}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchQuery.trim() && (
        <section className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-blue-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Package size={18} className="text-blue-900" />
              <span className="text-xs sm:text-sm text-gray-600">{th.searchResultsFor}</span>
              <span className="text-xs sm:text-sm font-black text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                "{searchQuery}"
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full font-black tabular-nums">
                {th.matchingCount(Math.max(filteredProducts.length, serverSearchTotal).toLocaleString(numLocale))}
              </span>
              {isSearchingServer && (
                <span className="text-[11px] text-blue-700 font-bold animate-pulse">{th.searchingDb}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-red-600 hover:bg-red-50 font-bold px-3 py-1.5 rounded-lg border border-red-200 transition"
              >
                {th.cancelSearch}
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className="text-xs text-blue-800 hover:bg-blue-50 font-bold px-3 py-1.5 rounded-lg border border-blue-200 transition"
              >
                {th.browseAllDepts}
              </button>
            </div>
          </div>

          {pageProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-3">
              <Search size={36} className="text-gray-300 mx-auto" />
              <h3 className="text-base font-black text-gray-800">{th.noMatchesTitle(searchQuery)}</h3>
              <p className="text-xs text-gray-500">{th.noMatchesHint}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openItemRequestModal(searchQuery.trim())}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-xs"
                >
                  {t.header.requestFromProcurement(searchQuery.trim())}
                </button>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
                >
                  {th.showAllProducts}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {pageProducts.map((product) => {
                const inWish = isInWishlist(product.id);
                const stockMeta = getStockMeta(product, stockStatusMap, language);
                const displayTitle = getLocalizedProductName(product, language);
                const displayCat = getLocalizedProductCategory(product, language);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col justify-between group relative"
                  >
                    <div className="absolute top-2 start-2 z-10 bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
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
                        src={normalizeImageUrl(product.previewimage, undefined, 500)}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        alt={displayTitle}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] text-blue-800 font-bold truncate">{displayCat}</span>
                          {(product.unifiedCode || product.itemNumber) && (
                            <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                              {product.unifiedCode || product.itemNumber}
                            </span>
                          )}
                        </div>
                        <h3
                          onClick={() => setQuickViewProduct(product)}
                          className="text-xs md:text-sm font-bold text-gray-800 hover:text-blue-700 transition cursor-pointer line-clamp-2"
                        >
                          {displayTitle}
                        </h3>
                        <div className="mt-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${stockMeta.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${stockMeta.dotClass}`} />
                            <span>{stockMeta.shortLabel}</span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                        <button
                          disabled={!stockMeta.canOrder}
                          onClick={() => addToCart(product, 1)}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl transition text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs ${
                            stockMeta.canOrder
                              ? 'bg-blue-900 hover:bg-blue-950 text-white'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingCart size={13} />
                          <span>{stockMeta.canOrder ? th.addToOrder : th.outOfStock}</span>
                        </button>
                        <a
                          href={createProductWhatsAppUrl(product)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center justify-center"
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
          )}
        </section>
      )}

      {/* Hero Carousel */}
      {!searchQuery && (
        <section className="relative overflow-hidden rounded-3xl shadow-lg border border-gray-100 group">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(${isRtl ? currentBannerIndex * 100 : -currentBannerIndex * 100}%)`,
            }}
          >
            {heroBanners.map((banner) => {
              const bTitle = isRtl ? banner.title : 'Major Home & Electrical Appliances';
              const bSubtitle = isRtl
                ? banner.subtitle
                : 'Shop top refrigerators, washers, Smart TVs & small appliances with certified Tantawy warranty & pay on delivery.';
              const bBadge = isRtl ? banner.badge : 'Official Warranty';
              const bBtn = isRtl ? banner.buttonText : th.vipBtn2;
              return (
                <div
                  key={banner.id}
                  className={`w-full shrink-0 relative min-h-[260px] sm:min-h-[320px] md:min-h-[380px] bg-gradient-to-r ${banner.bgGradient} flex items-center`}
                >
                  <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
                    <img
                      src={normalizeImageUrl(banner.image)}
                      referrerPolicy="no-referrer"
                      alt={bTitle}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  <div className="relative z-10 p-5 pb-12 sm:p-10 md:p-14 max-w-xl text-white space-y-2.5 sm:space-y-3">
                    <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      <Sparkles size={12} />
                      <span>{bBadge}</span>
                      <span>•</span>
                      <span>{t.brandName}</span>
                    </div>

                    <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                      {bTitle}
                    </h1>

                    <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-md line-clamp-2 sm:line-clamp-none">
                      {bSubtitle}
                    </p>

                    <div className="pt-1.5 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                      <button
                        onClick={() => {
                          const target = (banner as any).linkCategory || banner.category;
                          if (target === 'عروض طنطاوي جروب اليومية') {
                            setActiveTab('deals');
                          } else if (target === 'جميع المنتجات') {
                            setActiveTab('home');
                            setSelectedCategory(null);
                          } else {
                            setSelectedCategory(target);
                            setActiveTab('categories');
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition flex items-center gap-1.5 sm:gap-2 shadow-md"
                      >
                        <span>{bBtn}</span>
                        <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                      </button>
                      <button
                        onClick={() => setActiveTab('deals')}
                        className="bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition"
                      >
                        {th.flashDealsBtn}
                      </button>
                    </div>
                  </div>

                  <div className="hidden lg:block absolute end-12 top-1/2 -translate-y-1/2 z-10 w-80 h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                    <img
                      src={normalizeImageUrl(banner.image)}
                      referrerPolicy="no-referrer"
                      alt="Featured Product"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() =>
              setCurrentBannerIndex((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))
            }
            className="absolute left-3 bottom-2.5 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-20 bg-black/45 hover:bg-black/75 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-xs transition"
            aria-label="Prev"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length)}
            className="absolute right-3 bottom-2.5 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-20 bg-black/45 hover:bg-black/75 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-xs transition"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {heroBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBannerIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentBannerIndex === i ? 'w-7 bg-red-600' : 'w-2 bg-white/60 hover:bg-white'
                }`}
                aria-label={`Banner ${i + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trust & Guarantee Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2">
          <div className="p-2 sm:p-2.5 bg-blue-50 text-blue-700 rounded-xl shrink-0">
            <Truck size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] sm:text-sm font-bold text-gray-800 truncate">{th.trust1Title}</h4>
            <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1">{th.trust1Sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2">
          <div className="p-2 sm:p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] sm:text-sm font-bold text-gray-800 truncate">{th.trust2Title}</h4>
            <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1">{th.trust2Sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2">
          <div className="p-2 sm:p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
            <Award size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] sm:text-sm font-bold text-gray-800 truncate">{th.trust3Title}</h4>
            <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1">{th.trust3Sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2">
          <div className="p-2 sm:p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <RefreshCw size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] sm:text-sm font-bold text-gray-800 truncate">{th.trust4Title}</h4>
            <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1">{th.trust4Sub}</p>
          </div>
        </div>
      </div>

      {/* Bundles */}
      {!searchQuery.trim() && <BundlesShowcase />}

      {/* Shop by Categories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-black text-gray-900 flex items-center gap-2">
            <span>{th.shopByDept}</span>
            <span className="text-xs font-medium text-gray-500 hidden sm:inline">{th.shopByDeptSub}</span>
          </h2>
          <button
            onClick={() => setActiveTab('categories')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 group"
          >
            <span>{th.viewAllDepts}</span>
            {isRtl ? (
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition" />
            ) : (
              <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayCategories.map((cat) => {
            const countLabel = th.subDeptsCount(cat.subcategoriesAr.length);
            const catTitle = getLocalizedCategoryName(cat, language);
            const catDesc = getLocalizedCategoryDesc(cat, language);

            return (
              <div
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.nameAr);
                  setSelectedSubcategory(null);
                  setActiveTab('categories');
                }}
                className="bg-white hover:bg-blue-50/40 border border-gray-200 hover:border-blue-300 rounded-3xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 group shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-950 flex items-center justify-center text-white group-hover:scale-105 transition duration-300 shadow-sm shrink-0">
                        <Sparkles size={22} className="text-yellow-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-gray-900 group-hover:text-blue-900 transition">
                            {catTitle}
                          </h3>
                          <span className="text-[10px] bg-blue-100 text-blue-900 font-black px-2 py-0.5 rounded-full">
                            {countLabel}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                          {catDesc}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-bold text-gray-700 mb-2">{th.availableInnerGroups}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategoriesAr.slice(0, 8).map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(cat.nameAr);
                            setSelectedSubcategory(sub);
                            setActiveTab('categories');
                          }}
                          className="text-[11px] bg-gray-100 hover:bg-blue-900 hover:text-white text-gray-700 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                        >
                          {translateSubcategoryLabel(sub, language)}
                        </button>
                      ))}
                      {cat.subcategoriesAr.length > 8 && (
                        <span className="text-[11px] bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg font-bold">
                          {th.moreGroups(cat.subcategoriesAr.length - 8)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between text-xs font-bold text-blue-800 group-hover:text-blue-950">
                  <span>{th.browseDeptPrefix(catTitle)}</span>
                  {isRtl ? (
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition" />
                  ) : (
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <NestedCategoriesSection />

      {/* Flash Deals */}
      {deals.length > 0 && (
        <section className="bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-900 text-white p-5 md:p-7 rounded-3xl space-y-5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 text-white p-2.5 rounded-2xl animate-bounce shadow-md">
                <Zap size={22} className="fill-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black">{th.flashDealsTitle}</h2>
                <p className="text-xs text-blue-200">{th.flashDealsSub}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold">
              <Clock size={16} className="text-yellow-400" />
              <span>{th.dealsEndIn}</span>
              <span className="font-mono text-yellow-300 bg-black/40 px-2 py-0.5 rounded-md">12:45:30</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {deals.map((product) => {
              const inWish = isInWishlist(product.id);
              const stockMeta = getStockMeta(product, stockStatusMap, language);
              const displayTitle = getLocalizedProductName(product, language);
              const displayCat = getLocalizedProductCategory(product, language);

              return (
                <div
                  key={product.id}
                  className="bg-white text-gray-900 rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
                >
                  <div className="absolute top-2 start-2 z-10 bg-blue-900 text-white text-[11px] font-black px-2.5 py-0.5 rounded-md shadow-xs">
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
                      src={normalizeImageUrl(product.previewimage, undefined, 500)}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      alt={displayTitle}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-blue-700 font-bold block mb-1">{displayCat}</span>
                      <h3
                        onClick={() => setQuickViewProduct(product)}
                        className="text-xs md:text-sm font-bold text-gray-800 hover:text-blue-700 transition cursor-pointer line-clamp-2 leading-snug"
                      >
                        {displayTitle}
                      </h3>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-xs gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${stockMeta.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${stockMeta.dotClass}`} />
                          <span>{stockMeta.shortLabel}</span>
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium truncate">
                          {th.shippingGovernorates}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 w-full">
                        <button
                          disabled={!stockMeta.canOrder}
                          onClick={() => addToCart(product, 1)}
                          className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-xs ${
                            stockMeta.canOrder
                              ? 'bg-blue-900 hover:bg-blue-950 active:scale-95 text-white'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingCart size={13} />
                          <span>{stockMeta.canOrder ? th.addToOrder : th.outOfStock}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCompare(product)}
                          className={`p-2 rounded-xl border transition flex items-center justify-center ${
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
                          className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center justify-center"
                          title={th.whatsappInquiry}
                        >
                          <MessageCircle size={15} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Two Side-By-Side Promo Banners */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-black text-gray-800">{th.exclusiveOffersBar}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#admin-cms';
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }}
            className="text-[11px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-blue-200 shadow-2xs group"
          >
            <Edit3 size={13} className="text-blue-700 group-hover:scale-110 transition" />
            <span>{th.editBannerAdmin}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activePromos.map((promo, idx) => {
            const isInvalidPromoImage =
              !promo.image ||
              promo.image.includes('1556911220') ||
              promo.image.includes('yarn') ||
              promo.image.includes('skillet');

            const cleanPromoImage = isInvalidPromoImage
              ? heroBanners[idx]?.image ||
                (idx === 0
                  ? 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80')
              : promo.image;

            return (
              <div
                key={promo.id || idx}
                onClick={() => {
                  setSelectedCategory(promo.linkCategory || 'أجهزة منزلية');
                  setActiveTab('categories');
                }}
                className={`cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-r ${
                  promo.bgGradient || 'from-blue-950 to-blue-800'
                } text-white p-6 md:p-8 flex items-center justify-between shadow-md hover:shadow-lg transition group relative`}
              >
                <div className="space-y-2 z-10 max-w-[65%]">
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full inline-block ${
                      promo.badgeBg || 'bg-red-600 text-white'
                    }`}
                  >
                    {promo.badge}
                  </span>
                  <h3 className="text-lg md:text-xl font-black">{promo.title}</h3>
                  <p className="text-xs text-blue-200 line-clamp-2">{promo.subtitle}</p>
                  <span className="text-xs font-bold text-yellow-300 flex items-center gap-1 pt-1">
                    <span>{promo.buttonText || th.viewAllDepts}</span>
                    <ArrowRight
                      size={14}
                      className={`${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition`}
                    />
                  </span>
                </div>
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 shrink-0 bg-white/10">
                  <img
                    src={normalizeImageUrl(cleanPromoImage, undefined, 600)}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    alt={promo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Catalog Browser */}
      {!searchQuery.trim() && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base md:text-xl font-black text-gray-900">{th.catalogHeading}</h2>
              <p className="text-xs text-gray-500">{th.catalogSub}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: th.allTab },
                  { id: 'home', label: t.header.homeAppliances },
                  { id: 'electric', label: t.header.electricalAppliances },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setHomeSectorFilter(tab.id);
                    goTo(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    homeSectorFilter === tab.id
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <button
                onClick={() => setActiveTab('categories')}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 group ms-1"
              >
                <span>{th.fullDeptsLink}</span>
                {isRtl ? (
                  <ChevronLeft size={16} className="group-hover:-translate-x-1 transition" />
                ) : (
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition" />
                )}
              </button>
            </div>
          </div>

          {pageProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-2">
              {isSyncingWithDatabase ? (
                <>
                  <RefreshCw size={28} className="text-blue-900 animate-spin mx-auto" />
                  <h3 className="text-sm font-black text-gray-800">{th.loadingDb}</h3>
                  <p className="text-xs text-gray-500">{th.loadingDbSub}</p>
                </>
              ) : (
                <>
                  <Package size={32} className="text-gray-300 mx-auto" />
                  <h3 className="text-sm font-black text-gray-800">{th.noProductsYet}</h3>
                  <p className="text-xs text-gray-500">{th.noProductsHint}</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {pageProducts.map((product) => {
                const inWish = isInWishlist(product.id);
                const stockMeta = getStockMeta(product, stockStatusMap, language);
                const displayTitle = getLocalizedProductName(product, language);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col justify-between group relative"
                  >
                    <div className="absolute top-2 start-2 z-10 bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
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
                        src={normalizeImageUrl(product.previewimage, undefined, 500)}
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
                          className="text-xs md:text-sm font-bold text-gray-800 hover:text-blue-700 transition cursor-pointer line-clamp-2"
                        >
                          {displayTitle}
                        </h3>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                        <button
                          disabled={!stockMeta.canOrder}
                          onClick={() => addToCart(product, 1)}
                          className={`flex-1 py-1.5 px-2.5 rounded-xl transition text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs ${
                            stockMeta.canOrder
                              ? 'bg-blue-900 hover:bg-blue-950 text-white'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                          title={stockMeta.canOrder ? th.addToOrder : th.outOfStock}
                        >
                          <ShoppingCart size={13} />
                          <span>{stockMeta.canOrder ? th.addToOrder : th.outOfStock}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCompare(product)}
                          className={`p-1.5 rounded-xl border transition flex items-center justify-center ${
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
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center justify-center"
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
          )}
        </section>
      )}

      {/* VIP Club Banner */}
      <section className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-xl border border-blue-900/50">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className={`space-y-3 max-w-xl text-center ${isRtl ? 'md:text-right' : 'md:text-left'}`}>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30">
              <Award size={14} className="text-yellow-400" />
              <span>{th.vipBadge}</span>
            </div>
            <h3 className="text-xl md:text-3xl font-black">{th.vipTitle}</h3>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
              {th.vipDesc}{' '}
              <a href="tel:15218" className="text-yellow-300 font-bold hover:underline">
                15218
              </a>
              .
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => setIsAboutModalOpen(true)}
                className="bg-white text-blue-950 hover:bg-gray-100 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <span>{th.vipBtn1}</span>
                <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2.5 rounded-xl text-xs font-bold transition"
              >
                {th.vipBtn2}
              </button>
            </div>
          </div>

          <div className="h-28 w-auto bg-white rounded-3xl p-4 shadow-2xl flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Tantawy Group Logo" className="h-full w-auto object-contain" />
          </div>
        </div>
      </section>

      {/* Pagination */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
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
              const nextPage = currentPage + 1;
              goTo(nextPage);
              if (nextPage >= totalPages && supabaseProductCount > products.length && !isLoadingMoreProducts) {
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

      {/* Progressive Load More & Offline Download */}
      {!searchQuery.trim() && (supabaseProductCount > products.length || products.length > 0) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {supabaseProductCount > products.length && (
            <button
              type="button"
              disabled={isLoadingMoreProducts}
              onClick={() => loadMoreProductsFromDatabase(24)}
              className="bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-2xs flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
            >
              <RefreshCw size={14} className={isLoadingMoreProducts ? 'animate-spin' : ''} />
              <span className="tabular-nums">
                {isLoadingMoreProducts
                  ? th.loadingNextBatch
                  : th.loadMore24(
                      products.length.toLocaleString(numLocale),
                      supabaseProductCount.toLocaleString(numLocale)
                    )}
              </span>
            </button>
          )}

          {supabaseProductCount > products.length && !offlineDownloadProgress.active && (
            <button
              type="button"
              onClick={() => void startOfflineCatalogDownload()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-2xs flex items-center gap-2 whitespace-nowrap"
            >
              <Download size={14} className="text-amber-300" />
              <span>{th.saveOfflineCatalog}</span>
            </button>
          )}
        </div>
      )}

      {/* Recently Viewed */}
      {!searchQuery.trim() && recentlyViewed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-blue-900" />
                <span>{th.recentlyViewed}</span>
              </h2>
              <p className="text-xs text-gray-500">{th.recentlyViewedSub}</p>
            </div>
            <button
              type="button"
              onClick={clearRecentlyViewed}
              className="text-xs font-bold text-gray-500 hover:text-red-700 px-3 py-1.5 rounded-xl border border-gray-200 bg-white transition"
            >
              {th.clearHistory}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recentlyViewed.slice(0, 4).map((item) => {
              const sMeta = getStockMeta(item, stockStatusMap, language);
              const displayTitle = getLocalizedProductName(item, language);
              return (
                <div
                  key={`recent-${item.id}`}
                  className="bg-white rounded-2xl border border-gray-200 p-3 flex flex-col justify-between gap-2.5 hover:border-blue-300 transition"
                >
                  <div
                    onClick={() => setQuickViewProduct(item)}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <img
                      src={normalizeImageUrl(item.previewimage, undefined, 240)}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      alt={displayTitle}
                      className="w-14 h-14 rounded-xl object-contain bg-gray-50 border border-gray-100 p-1 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-blue-900 block truncate">
                        {item.brand}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {displayTitle}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      disabled={!sMeta.canOrder}
                      onClick={() => addToCart(item, 1)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition ${
                        sMeta.canOrder
                          ? 'bg-blue-900 hover:bg-blue-950 text-white'
                          : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {sMeta.canOrder ? th.addToOrderShort : th.unavailableShort}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCompare(item)}
                      className={`p-1.5 rounded-xl border transition ${
                        isInCompare(item.id)
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:text-blue-900'
                      }`}
                      title={th.compareShort}
                    >
                      <Scale size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <FAQSection />
    </div>
  );
};
