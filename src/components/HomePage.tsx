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
  Flame,
  Award,
  PhoneCall,
  MessageCircle,
  Edit3,
  Search,
  X,
  Barcode,
  Package
} from 'lucide-react';
import { Product } from '../types';
import { BrandsGrid } from './BrandsGrid';
import { FAQSection } from './FAQSection';
import { NestedCategoriesSection } from './NestedCategoriesSection';
import { createProductWhatsAppUrl } from '../services/whatsapp-order';
import { normalizeImageUrl } from '../services/image-url';

const normalizeSearchText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\-_/\\,.]/g, ' ')
    .replace(/\s+/g, ' ');
};

export const HomePage: React.FC = () => {
  const { 
    products, 
    addToCart, 
    toggleWishlist, 
    isInWishlist, 
    setSelectedProduct, 
    setActiveTab, 
    setSelectedCategory,
    setSelectedSubcategory,
    setIsAboutModalOpen,
    searchQuery,
    setSearchQuery,
    setSelectedBrand,
    homePageConfig
  } = useApp();

  const heroBanners = homePageConfig.heroBanners && homePageConfig.heroBanners.length > 0 
    ? homePageConfig.heroBanners 
    : [
        {
          id: 1,
          title: 'أجهزة منزلية كبرى بضمان الوكيل',
          subtitle: 'أحدث موديلات الثلاجات، الغسالات، البوتاجازات، والتكييفات بضمان الوكيل الرسمي وضمان طنطاوي',
          badge: 'ضمان الوكيل المعتمد',
          buttonText: 'تصفح الأجهزة المنزلية',
          category: 'أجهزة منزلية',
          bgGradient: 'from-blue-950 via-blue-900 to-indigo-900',
          image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=1600&auto=format&fit=crop&q=80',
          linkCategory: 'أجهزة منزلية'
        }
      ];

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Auto rotate banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const [isQuickSearchFocused, setIsQuickSearchFocused] = useState(false);

  // Fast catalog search by product name, unified code, item number, brand, or group
  const filteredProducts = useMemo(() => {
    const raw = searchQuery.trim();
    if (!raw) return products;

    const normQuery = normalizeSearchText(raw);
    const compactQuery = raw.toLowerCase().replace(/[\s\-_]/g, '');
    const queryWords = normQuery.split(' ').filter(Boolean);

    const scored: { product: Product; score: number }[] = [];

    products.forEach((p) => {
      const nameAr = normalizeSearchText(p.nameAr || '');
      const nameEn = (p.name || '').toLowerCase();
      const brand = normalizeSearchText(p.brand || '');
      const category = normalizeSearchText(p.category || '');
      const categoryAr = normalizeSearchText(p.categoryAr || '');
      const itemGroup = normalizeSearchText(p.itemGroup || '');
      const familyName = normalizeSearchText(p.familyName || '');
      const code = (p.unifiedCode || '').toLowerCase();
      const itemNum = (p.itemNumber || '').toLowerCase();
      const importKey = (p.importKey || '').toLowerCase();
      const compactCode = `${code}${itemNum}${importKey}`.replace(/[\s\-_]/g, '');

      let score = 0;

      if (code === raw.toLowerCase() || itemNum === raw.toLowerCase()) score += 250;
      else if (compactCode.includes(compactQuery) && compactQuery.length >= 2) score += 170;
      else if (code.includes(raw.toLowerCase()) || itemNum.includes(raw.toLowerCase())) score += 140;

      if (nameAr.startsWith(normQuery)) score += 150;
      else if (nameAr.includes(' ' + normQuery)) score += 90;
      else if (nameAr.includes(normQuery)) score += 60;

      if (brand.includes(normQuery)) score += 50;
      if (itemGroup.includes(normQuery) || familyName.includes(normQuery)) score += 45;
      if (categoryAr.includes(normQuery) || category.includes(normQuery) || nameEn.includes(normQuery)) score += 30;

      if (score === 0 && queryWords.length > 1) {
        const haystack = `${nameAr} ${nameEn} ${brand} ${itemGroup} ${familyName} ${code} ${itemNum}`;
        if (queryWords.every((w) => haystack.includes(w))) {
          score += 80;
        }
      }

      if (score > 0) scored.push({ product: p, score });
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.product);
  }, [products, searchQuery]);

  // Single pagination source of truth - show 10 products per page
  // (search results when searching, all products otherwise)
  const { paginatedProducts, currentPage, totalPages, next, prev, pageNumbers, goTo, hasPreviousPage, hasNextPage } = useProductPagination({
    products: filteredProducts,
    pageSize: 10,
    initialPage: 1,
  });

  const pageProducts = paginatedProducts();
  const deals = pageProducts.filter((p) => p.isDeal);
  const newArrivals = pageProducts.slice(2, 7);
  const quickSuggestions = searchQuery.trim() ? filteredProducts.slice(0, 5) : [];

  const quickTags = ['شاشة', 'ثلاجة', 'خلاط', 'مكواة', 'طقم حلل', 'قلاية'];

  return (
    <div className="space-y-6 md:space-y-10 pb-16">
      {/* Fast Home Catalog Search Bar (By Name or Code) */}
      <section className="bg-gradient-to-l from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-4 sm:p-6 shadow-md border border-blue-800/40 relative">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-yellow-400 text-blue-950 flex items-center justify-center shrink-0 shadow-xs">
                <Search size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
                  <span>البحث السريع في كتالوج طنطاوي جروب</span>
                  <span className="text-[10px] bg-white/15 text-yellow-300 px-2 py-0.5 rounded-full font-bold">
                    {products.length.toLocaleString('ar-EG')} صنف
                  </span>
                </h2>
                <p className="text-[11px] text-blue-200">
                  ابحث فوراً باسم المنتج أو الكود الموحد أو رقم الصنف أو الماركة
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-blue-100 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <Barcode size={14} className="text-yellow-300" />
              <span>يدعم البحث بالكود (مثل: TG- أو رقم الصنف)</span>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative">
            <div className="flex items-center bg-white rounded-2xl shadow-lg border-2 border-transparent focus-within:border-yellow-400 transition overflow-hidden">
              <span className="pr-4 pl-2 text-gray-400">
                <Search size={20} className="text-blue-900" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsQuickSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsQuickSearchFocused(false), 180)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اكتب اسم المنتج أو الكود الموحد أو الماركة للوصول السريع..."
                className="w-full py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-2 text-gray-400 hover:text-red-600 transition flex items-center gap-1 text-xs font-bold shrink-0"
                  title="مسح البحث"
                >
                  <X size={16} />
                  <span className="hidden sm:inline">مسح</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsQuickSearchFocused(false)}
                className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-3.5 transition shrink-0"
              >
                بحث فوري
              </button>
            </div>

            {/* Instant Autocomplete Suggestions */}
            {isQuickSearchFocused && quickSuggestions.length > 0 && (
              <div className="absolute right-0 left-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-30 overflow-hidden divide-y divide-gray-100">
                <div className="px-3.5 py-2 bg-gray-50 flex items-center justify-between text-[11px] font-bold text-gray-500">
                  <span>أقرب المنتجات المطابقة ({filteredProducts.length} نتيجة)</span>
                  <span className="text-blue-900">اضغط على الصنف لفتح التفاصيل</span>
                </div>
                {quickSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => {
                      setSelectedProduct(item);
                      setIsQuickSearchFocused(false);
                    }}
                    className="w-full p-2.5 sm:px-4 hover:bg-blue-50/70 transition flex items-center justify-between gap-3 text-right"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={normalizeImageUrl(item.previewimage, undefined, 200)}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        alt={item.nameAr}
                        className="w-10 h-10 rounded-lg object-contain bg-gray-50 border border-gray-100 p-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{item.nameAr}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                          <span className="text-blue-800 font-bold">{item.brand}</span>
                          <span>•</span>
                          <span>{item.itemGroup || item.categoryAr}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(item.unifiedCode || item.itemNumber) && (
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                          {item.unifiedCode || item.itemNumber}
                        </span>
                      )}
                      <ChevronLeft size={15} className="text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Suggested Keywords */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-blue-200 font-bold ml-1">أشهر عمليات البحث:</span>
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  searchQuery === tag
                    ? 'bg-yellow-400 text-blue-950'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Dedicated Search Results Section when searchQuery is active */}
      {searchQuery.trim() && (
        <section className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-blue-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Package size={18} className="text-blue-900" />
              <span className="text-xs sm:text-sm text-gray-600">نتائج البحث في الكتالوج عن:</span>
              <span className="text-xs sm:text-sm font-black text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                "{searchQuery}"
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full font-black">
                {filteredProducts.length.toLocaleString('ar-EG')} منتج مطابق
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-red-600 hover:bg-red-50 font-bold px-3 py-1.5 rounded-lg border border-red-200 transition"
              >
                إلغاء البحث ✕
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className="text-xs text-blue-800 hover:bg-blue-50 font-bold px-3 py-1.5 rounded-lg border border-blue-200 transition"
              >
                تصفح كل الأقسام
              </button>
            </div>
          </div>

          {pageProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center space-y-3">
              <Search size={36} className="text-gray-300 mx-auto" />
              <h3 className="text-base font-black text-gray-800">لم نجد منتجات مطابقة لـ "{searchQuery}"</h3>
              <p className="text-xs text-gray-500">
                جرب البحث بكلمة أقصر، أو برقم الكود الموحد، أو تصفح الأقسام الداخلية مباشرة.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
              >
                عرض جميع المنتجات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {pageProducts.map((product) => {
                const inWish = isInWishlist(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col justify-between group relative"
                  >
                    <div className="absolute top-2 right-2 z-10 bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
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
                        src={normalizeImageUrl(product.previewimage, undefined, 500)}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        alt={product.nameAr}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] text-blue-800 font-bold truncate">
                            {product.itemGroup || product.categoryAr}
                          </span>
                          {(product.unifiedCode || product.itemNumber) && (
                            <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                              {product.unifiedCode || product.itemNumber}
                            </span>
                          )}
                        </div>
                        <h3
                          onClick={() => setSelectedProduct(product)}
                          className="text-xs md:text-sm font-bold text-gray-800 hover:text-blue-700 transition cursor-pointer line-clamp-2"
                        >
                          {product.nameAr}
                        </h3>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="flex-1 py-1.5 px-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl transition text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs"
                        >
                          <ShoppingCart size={13} />
                          <span>إضافة للطلب</span>
                        </button>
                        <a
                          href={createProductWhatsAppUrl(product)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center justify-center"
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
          )}
        </section>
      )}

      {/* Hero Carousel (Exclusive Tantawy Group Banners) */}
      {!searchQuery && (
        <section className="relative overflow-hidden rounded-3xl shadow-lg border border-gray-100 group">
          <div 
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(${currentBannerIndex * 100}%)` }}
          >
            {heroBanners.map((banner) => (
              <div 
                key={banner.id} 
                className={`w-full shrink-0 relative min-h-[260px] sm:min-h-[320px] md:min-h-[380px] bg-gradient-to-r ${banner.bgGradient} flex items-center`}
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
                  <img
                    src={normalizeImageUrl(banner.image)} referrerPolicy="no-referrer"
                    alt={banner.title}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Banner Content */}
                <div className="relative z-10 p-6 sm:p-10 md:p-14 max-w-xl text-white space-y-3">
                  <div className="inline-flex items-center gap-2 bg-red-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    <Sparkles size={13} />
                    <span>{banner.badge}</span>
                    <span>•</span>
                    <span>طنطاوي جروب</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                    {banner.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-md">
                    {banner.subtitle}
                  </p>

                  <div className="pt-2 flex items-center gap-3">
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
                      className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md"
                    >
                      <span>{banner.buttonText}</span>
                      <ArrowRight size={15} className="rotate-180" />
                    </button>
                    <button
                      onClick={() => setActiveTab('deals')}
                      className="bg-white/15 hover:bg-white/25 text-white border border-white/30 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition"
                    >
                      عروض الصاعقة ⚡
                    </button>
                  </div>
                </div>

                {/* Left/Right Product Accent Graphic */}
                <div className="hidden lg:block absolute left-12 top-1/2 -translate-y-1/2 z-10 w-80 h-72 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <img
                    src={normalizeImageUrl(banner.image)} referrerPolicy="no-referrer"
                    alt="Featured Product"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={() => setCurrentBannerIndex((prev) => (prev === 0 ? heroBanners.length - 1 : prev - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-xs transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-xs transition"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {heroBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentBannerIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentBannerIndex === i ? 'w-7 bg-red-600' : 'w-2 bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trust & Guarantee Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3 p-2">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-bold text-gray-800">شحن سريع لكافة المحافظات</h4>
            <p className="text-[11px] text-gray-500">توصيل مباشر حتى باب منزلك</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-bold text-gray-800">دفع عند الاستلام بعد الفحص</h4>
            <p className="text-[11px] text-gray-500">افحص طلبك وتأكد من سلامته قبل السداد</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
            <Award size={20} />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-bold text-gray-800">ضمان طنطاوي جروب الذهبي</h4>
            <p className="text-[11px] text-gray-500">منتجات أصلية 100% بضمان معتمد</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <RefreshCw size={20} />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-bold text-gray-800">استرجاع واستبدال 14 يوم</h4>
            <p className="text-[11px] text-gray-500">خدمة عملاء طنطاوي 15218</p>
          </div>
        </div>
      </div>

      {/* Quick Category Icons Carousel / Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-black text-gray-900 flex items-center gap-2">
            <span>تسوق حسب أقسام طنطاوي جروب</span>
            <span className="text-xs font-medium text-gray-500">كل ما يلزم بيتك</span>
          </h2>
          <button 
            onClick={() => setActiveTab('categories')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 group"
          >
            <span>عرض كل الأقسام</span>
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => {
            const isHome = cat.nameAr === 'أجهزة منزلية' || cat.name === 'Home Appliances';
            const countLabel = isHome ? '21 قسماً داخلياً' : '15 قسماً داخلياً';

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
                            {cat.nameAr}
                          </h3>
                          <span className="text-[10px] bg-blue-100 text-blue-900 font-black px-2 py-0.5 rounded-full">
                            {countLabel}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                          {cat.descriptionAr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clickable Inner Item Groups Chips */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-bold text-gray-700 mb-2">الأقسام الداخلية والأصناف المتاحة:</p>
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
                          {sub}
                        </button>
                      ))}
                      {cat.subcategoriesAr.length > 8 && (
                        <span className="text-[11px] bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg font-bold">
                          +{cat.subcategoriesAr.length - 8} أقسام أخرى...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between text-xs font-bold text-blue-800 group-hover:text-blue-950">
                  <span>تصفح كافة منتجات {cat.nameAr}</span>
                  <ChevronLeft size={16} className="group-hover:-translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Nested Subcategories Hierarchy Explorer (Item Groups) */}
      <NestedCategoriesSection />

      {/* Flash Deals / Thunder Section */}
      <section className="bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-900 text-white p-5 md:p-7 rounded-3xl space-y-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2.5 rounded-2xl animate-bounce shadow-md">
              <Zap size={22} className="fill-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black">عروض الصاعقة والتخفيضات الكبرى (Flash Deals)</h2>
              <p className="text-xs text-blue-200">أسعار خاصة لفترة محدودة مقدمة من طنطاوي جروب</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold">
            <Clock size={16} className="text-yellow-400" />
            <span>تنتهي العروض بعد: </span>
            <span className="font-mono text-yellow-300 bg-black/40 px-2 py-0.5 rounded-md">12:45:30</span>
          </div>
        </div>

        {/* Deals Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {deals.map((product) => {
            const discountedPrice = Math.round(product.actualprice * (1 - product.discountpercent / 100));
            const inWish = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                className="bg-white text-gray-900 rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
              >
                {/* Brand Badge */}
                <div className="absolute top-2 right-2 z-10 bg-blue-900 text-white text-[11px] font-black px-2.5 py-0.5 rounded-md shadow-xs">
                  {product.brand}
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  className="absolute top-2 left-2 z-10 p-1.5 bg-white/90 hover:bg-white rounded-full text-gray-400 hover:text-red-500 shadow-xs transition"
                >
                  <Heart size={16} className={inWish ? 'text-red-500 fill-red-500' : ''} />
                </button>

                {/* Product Image */}
                <div 
                  onClick={() => setSelectedProduct(product)}
                  className="aspect-square w-full overflow-hidden bg-gray-50 cursor-pointer p-4 flex items-center justify-center"
                >
                  <img
                    src={normalizeImageUrl(product.previewimage, undefined, 500)}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    alt={product.nameAr}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Product Info */}
                <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-blue-700 font-bold block mb-1">
                      {product.categoryAr}
                    </span>
                    <h3
                      onClick={() => setSelectedProduct(product)}
                      className="text-xs md:text-sm font-bold text-gray-800 hover:text-blue-700 transition cursor-pointer line-clamp-2 leading-snug"
                    >
                      {product.nameAr}
                    </h3>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        متاح بالمعارض
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">شحن لجميع المحافظات</span>
                    </div>

                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        onClick={() => addToCart(product, 1)}
                        className="flex-1 bg-blue-900 hover:bg-blue-950 active:scale-95 text-white py-2 px-2.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-xs"
                      >
                        <ShoppingCart size={13} />
                        <span>إضافة للطلب</span>
                      </button>
                      <a
                        href={createProductWhatsAppUrl(product)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center justify-center"
                        title="طلب فوري عبر واتساب"
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

      {/* Two Side-By-Side Branded Promotional Banners (Editable via Admin CMS) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-black text-gray-800">أقوى العروض الحصرية والماركات المعتمدة (طنطاوي جروب)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#admin-cms';
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }}
            className="text-[11px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-blue-200 shadow-2xs group"
            title="انقر لتعديل صور ونصوص هذين البانرين من لوحة الإدارة مباشرة"
          >
            <Edit3 size={13} className="text-blue-700 group-hover:scale-110 transition" />
            <span>تعديل هذا البانر في لوحة الإدارة ✏️</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(homePageConfig.promoBanners && homePageConfig.promoBanners.length > 0 
          ? homePageConfig.promoBanners 
          : [
              {
                id: 'promo-1',
                badge: 'أجهزة منزلية كبرى',
                badgeBg: 'bg-red-600 text-white',
                title: 'ثلاجات، غسالات وبوتاجازات',
                subtitle: 'شارب، إل جي، فريش، وكاريير بضمان الوكيل المعتمد وضمان طنطاوي',
                buttonText: 'تصفح الأجهزة الكبرى',
                image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80',
                bgGradient: 'from-blue-950 to-blue-800',
                linkCategory: 'أجهزة منزلية'
              },
              {
                id: 'promo-2',
                badge: 'شاشات وتلفزيونات 4K',
                badgeBg: 'bg-amber-500 text-black',
                title: 'شاشات سامسونج وتوشيبا وإل جي',
                subtitle: 'وضوح كريستالي مع ريسيفر داخلي وتوصيل سريع لكافة المحافظات',
                buttonText: 'تصفح الشاشات الذكية',
                image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
                bgGradient: 'from-slate-900 to-indigo-950',
                linkCategory: 'أجهزة كهربيه'
              }
            ]
        ).map((promo, idx) => {
          // Ensure promo image is never a food or invalid placeholder
          const isInvalidPromoImage = 
            !promo.image || 
            promo.image.includes('1556911220') || 
            promo.image.includes('yarn') ||
            promo.image.includes('skillet');
          
          const cleanPromoImage = isInvalidPromoImage
            ? (heroBanners[idx]?.image || (idx === 0 
                ? 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80' 
                : 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80'))
            : promo.image;

          return (
            <div 
              key={promo.id || idx}
              onClick={() => {
                setSelectedCategory(promo.linkCategory || 'أجهزة منزلية');
                setActiveTab('categories');
              }}
              className={`cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-r ${promo.bgGradient || 'from-blue-950 to-blue-800'} text-white p-6 md:p-8 flex items-center justify-between shadow-md hover:shadow-lg transition group relative`}
            >
              <div className="space-y-2 z-10 max-w-[65%]">
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full inline-block ${promo.badgeBg || 'bg-red-600 text-white'}`}>
                  {promo.badge}
                </span>
                <h3 className="text-lg md:text-xl font-black">{promo.title}</h3>
                <p className="text-xs text-blue-200 line-clamp-2">{promo.subtitle}</p>
                <span className="text-xs font-bold text-yellow-300 flex items-center gap-1 pt-1">
                  <span>{promo.buttonText || 'تصفح الأصناف'}</span>
                  <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition" />
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

      {/* All Products / New Arrivals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base md:text-xl font-black text-gray-900">وصل حديثاً في طنطاوي جروب</h2>
            <p className="text-xs text-gray-500">أحدث الأجهزة والأدوات المنزلية بضمان طنطاوي المعتمد</p>
          </div>
          <button
            onClick={() => setActiveTab('categories')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 group"
          >
            <span>مشاهدة الكل</span>
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {newArrivals.map((product) => {
            const discountedPrice = Math.round(product.actualprice * (1 - product.discountpercent / 100));
            const inWish = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col justify-between group relative"
              >
                {/* Brand Badge */}
                <div className="absolute top-2 right-2 z-10 bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
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
                    src={normalizeImageUrl(product.previewimage, undefined, 500)}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
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
                      className="text-xs md:text-sm font-bold text-gray-800 hover:text-blue-700 transition cursor-pointer line-clamp-2"
                    >
                      {product.nameAr}
                    </h3>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="flex-1 py-1.5 px-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl transition text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs"
                      title="إضافة إلى سلة الطلبات"
                    >
                      <ShoppingCart size={13} />
                      <span>إضافة للطلب</span>
                    </button>
                    <a
                      href={createProductWhatsAppUrl(product)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center justify-center"
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
      </section>

      {/* Tantawy Group VIP Club & Direct Hotline Banner (Replaces old ITI team card) */}
      <section className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-xl border border-blue-900/50">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-right">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30">
              <Award size={14} className="text-yellow-400" />
              <span>نادي عملاء طنطاوي جروب المميزين (VIP Club)</span>
            </div>
            <h3 className="text-xl md:text-3xl font-black">
              تسوق بثقة تامة مع أكبر صرح للأجهزة والأدوات المنزلية
            </h3>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
              نوفر لك تشكيلة متكاملة تناسب كل بيت وعروسة مع استلام كارت الفاتورة الرسمي وفحص الأجهزة عند الاستلام. فريق خدمة العملاء متاح للرد على استفساراتكم طوال اليوم عبر الخط الساخن <a href="tel:15218" className="text-yellow-300 font-bold hover:underline">15218</a>.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => setIsAboutModalOpen(true)}
                className="bg-white text-blue-950 hover:bg-gray-100 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <span>تعرف على فروع وضمانات طنطاوي جروب</span>
                <ArrowRight size={14} className="rotate-180" />
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2.5 rounded-xl text-xs font-bold transition"
              >
                تصفح الكتالوج الشامل
              </button>
            </div>
          </div>

          {/* Logo Showcase inside the card */}
          <div className="h-28 w-auto bg-white rounded-3xl p-4 shadow-2xl flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Tantawy Group Logo" className="h-full w-auto object-contain" />
          </div>
        </div>
      </section>

      {/* Pagination Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
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

      {/* الأسئلة الشائعة */}
      <FAQSection />
    </div>
  );
};
