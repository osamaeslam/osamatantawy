import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Sparkles, 
  X,
  PhoneCall,
  Flame,
  Building2,
  Truck,
  BookOpen,
  Tag,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { getSafeImageSrc } from '../utils/imageHelper';
import { Product } from '../types';

// Arabic letter normalizer for smart, fuzzy appliance searching
const normalizeArabic = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\-_/\\,.]/g, ' ')
    .replace(/\s+/g, ' ');
};

export const Header: React.FC = () => {
  const {
    products,
    cartCount,
    wishlist,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    setSelectedSubcategory,
    setSelectedProduct,
    setIsOrderTrackingOpen,
    setIsUserGuideOpen,
    setIsAboutModalOpen,
    homePageConfig
  } = useApp();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart Real-time Search: Activates instantly on 1 character!
  const searchResults = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) {
      return { matchedProducts: [], matchingGroups: [], totalCount: 0 };
    }

    const normQuery = normalizeArabic(rawQuery);
    const queryWords = normQuery.split(' ').filter(Boolean);

    // 1. Find matching item groups / subcategories
    const groupsSet = new Set<string>();
    products.forEach((p) => {
      if (p.itemGroup && normalizeArabic(p.itemGroup).includes(normQuery)) {
        groupsSet.add(p.itemGroup.trim());
      }
      if (p.familyName && normalizeArabic(p.familyName).includes(normQuery)) {
        groupsSet.add(p.familyName.trim());
      }
    });
    const matchingGroups = Array.from(groupsSet).slice(0, 4);

    // 2. Score and rank products
    interface ScoredProduct {
      product: Product;
      score: number;
    }

    const scored: ScoredProduct[] = [];

    products.forEach((p) => {
      const nameAr = normalizeArabic(p.nameAr || '');
      const nameEn = (p.name || '').toLowerCase();
      const brand = normalizeArabic(p.brand || '');
      const code = (p.unifiedCode || '').toLowerCase();
      const itemNum = (p.itemNumber || '').toLowerCase();
      const group = normalizeArabic(p.itemGroup || '');
      const family = normalizeArabic(p.familyName || '');

      let score = 0;

      // Exact start matches (Highest priority)
      if (nameAr.startsWith(normQuery)) score += 150;
      if (brand.startsWith(normQuery)) score += 130;
      if (code.startsWith(normQuery)) score += 140;
      if (itemNum.startsWith(normQuery)) score += 135;

      // Word boundary matches (e.g. "ثلاجة ش..." matches Sharp)
      if (nameAr.includes(' ' + normQuery)) score += 80;
      if (brand.includes(' ' + normQuery)) score += 70;

      // General substring matches
      if (nameAr.includes(normQuery)) score += 50;
      if (brand.includes(normQuery)) score += 45;
      if (code.includes(normQuery)) score += 60;
      if (group.includes(normQuery)) score += 40;
      if (family.includes(normQuery)) score += 35;
      if (nameEn.includes(normQuery)) score += 30;

      // Multi-word checking if user typed multiple characters/words
      if (queryWords.length > 1) {
        const matchesAll = queryWords.every((w) =>
          nameAr.includes(w) ||
          brand.includes(w) ||
          code.includes(w) ||
          group.includes(w) ||
          family.includes(w)
        );
        if (matchesAll) score += 90;
      }

      if (score > 0) {
        scored.push({ product: p, score });
      }
    });

    // Sort descending by relevance score
    scored.sort((a, b) => b.score - a.score);

    return {
      matchedProducts: scored.slice(0, 6).map((s) => s.product),
      matchingGroups,
      totalCount: scored.length,
    };
  }, [products, searchQuery]);

  // Handle select product from dropdown
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDropdown(false);
  };

  // Handle click on subcategory badge
  const handleSelectGroup = (groupName: string) => {
    setSelectedSubcategory(groupName);
    setActiveTab('categories');
    setShowDropdown(false);
  };

  // Handle submit search
  const handleExecuteSearch = () => {
    setShowDropdown(false);
    if (activeTab !== 'categories' && activeTab !== 'home') {
      setActiveTab('home');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-gray-100">
      {/* Top Banner Announcement - Ultra sleek on mobile */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white text-xs py-1.5 sm:py-2 px-3 sm:px-4 font-medium flex items-center justify-between border-b border-blue-800/40">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <PhoneCall size={13} className="text-yellow-400 shrink-0" />
          <a href={`tel:${homePageConfig?.hotline || '15218'}`} className="hover:underline flex items-center gap-1">
            <span className="hidden sm:inline text-gray-200 text-[11px]">الخط الساخن:</span>
            <strong className="font-black tracking-wider text-yellow-300 text-xs sm:text-sm">
              {homePageConfig?.hotline || '15218'}
            </strong>
          </a>
        </div>
        <div className="hidden md:flex items-center justify-center gap-2 text-xs text-gray-100">
          <Sparkles size={14} className="text-yellow-300 animate-pulse shrink-0" />
          <span>{homePageConfig?.announcementText || 'طنطاوي جروب: أجهزة منزلية وكهربية • شحن لجميع المحافظات • دفع عند الاستلام بعد الفحص'}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsOrderTrackingOpen(true)}
            className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-300 text-blue-950 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black transition shadow-xs"
            title="تتبع الطلب والشحنة برقم الهاتف"
          >
            <Truck size={12} />
            <span>تتبع طلبك 🚚</span>
          </button>
          <button
            onClick={() => setIsUserGuideOpen(true)}
            className="hidden sm:flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full text-[11px] font-bold transition shadow-xs border border-white/20"
            title="دليل الاستخدام"
          >
            <BookOpen size={12} className="text-yellow-300" />
            <span>الدليل 📖</span>
          </button>
          <PWAInstallButton />
          <button 
            onClick={() => setIsAboutModalOpen(true)}
            className="hidden lg:flex items-center gap-1 bg-white/10 hover:bg-white/20 transition px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-200"
          >
            <Building2 size={12} />
            <span>عن الشركة</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          {/* Brand Logo with User's Uploaded Logo */}
          <div 
            onClick={() => {
              setActiveTab('home');
              setSelectedCategory(null);
            }}
            className="flex items-center gap-3 cursor-pointer shrink-0 select-none group"
          >
            <div className="h-10 md:h-12 w-auto bg-white rounded-lg p-0.5 flex items-center justify-center transition-transform group-hover:scale-105">
              <img 
                src="/logo.png" 
                alt="Tantawy Group Logo" 
                className="h-full w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base md:text-xl font-black text-blue-950 tracking-tight flex items-center gap-1">
                طنطاوي جروب
                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-sm">مصر</span>
              </span>
              <span className="text-[10px] text-gray-500 font-bold tracking-wide uppercase hidden sm:inline">
                TANTAWY GROUP
              </span>
            </div>
          </div>

          {/* Smart Search Box with Instant Live Autocomplete Dropdown */}
          <div className="flex-1 max-w-2xl relative" ref={searchContainerRef}>
            <div className={`relative flex items-center w-full transition-all duration-200 rounded-full border ${isSearchFocused || showDropdown ? 'border-blue-600 ring-2 ring-blue-100 shadow-md bg-white' : 'border-gray-300 bg-gray-50'}`}>
              <div className="pr-4 pl-2 text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(e.target.value.trim().length >= 1);
                }}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchQuery.trim().length >= 1) {
                    setShowDropdown(true);
                  }
                }}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch();
                  } else if (e.key === 'Escape') {
                    setShowDropdown(false);
                  }
                }}
                placeholder="ابحث في أجهزة طنطاوي جروب: ثلاجات، غسالات، شاشات، كود الصنف..."
                className="w-full py-2.5 text-xs md:text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowDropdown(false);
                  }}
                  className="p-1 ml-2 text-gray-400 hover:text-gray-600 rounded-full"
                  title="مسح البحث"
                >
                  <X size={16} />
                </button>
              )}
              <button 
                onClick={handleExecuteSearch}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 md:px-5 py-2 m-0.5 rounded-full text-xs md:text-sm font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>بحث</span>
              </button>
            </div>

            {/* Smart Live Results Dropdown (Activates on 1+ characters!) */}
            {showDropdown && searchQuery.trim().length >= 1 && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-blue-100 z-50 overflow-hidden text-right animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header with Results Count */}
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-900" />
                    <span className="text-xs font-black text-blue-950">
                      أقرب نتائج البحث لـ: "{searchQuery}"
                    </span>
                  </div>
                  <span className="text-[11px] bg-blue-900 text-white px-2 py-0.5 rounded-full font-bold">
                    {searchResults.totalCount} منتج مطابق
                  </span>
                </div>

                {/* Matching Item Groups Pills if any */}
                {searchResults.matchingGroups.length > 0 && (
                  <div className="p-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] text-gray-500 font-bold shrink-0">أقسام فرعية مطابقة:</span>
                    {searchResults.matchingGroups.map((grp) => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => handleSelectGroup(grp)}
                        className="text-[11px] bg-white border border-blue-200 hover:bg-blue-900 hover:text-white text-blue-900 font-bold px-2.5 py-1 rounded-lg transition shrink-0 flex items-center gap-1 shadow-2xs"
                      >
                        <Tag size={11} />
                        <span>{grp}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Product List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.matchedProducts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 space-y-1">
                      <p className="font-bold text-gray-700">لم نجد أجهزة مطابقة لـ "{searchQuery}"</p>
                      <p className="text-[11px] text-gray-400">جرب كتابة حرف آخر، اسم الماركة (مثل شارب، فريش، توشيبا)، أو كود المنتج.</p>
                    </div>
                  ) : (
                    searchResults.matchedProducts.map((product) => {
                      const discountedPrice = Math.round(
                        product.actualprice * (1 - product.discountpercent / 100)
                      );

                      return (
                        <div
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className="p-2.5 hover:bg-blue-50/60 cursor-pointer transition flex items-center gap-3 group"
                        >
                          {/* Image */}
                          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={getSafeImageSrc(product.previewimage)}
                              referrerPolicy="no-referrer"
                              alt={product.nameAr}
                              className="w-full h-full object-contain group-hover:scale-105 transition"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {product.brand && (
                                <span className="text-[9px] bg-blue-100 text-blue-900 font-black px-1.5 py-0.2 rounded">
                                  {product.brand}
                                </span>
                              )}
                              {product.itemGroup && (
                                <span className="text-[9px] text-gray-400 font-bold truncate">
                                  {product.itemGroup}
                                </span>
                              )}
                              {product.unifiedCode && (
                                <span className="text-[9px] font-mono text-gray-500 bg-gray-100 px-1 rounded">
                                  {product.unifiedCode}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-900 transition">
                              {product.nameAr}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-mono block truncate">
                              {product.size ? `الحجم: ${product.size}` : product.name}
                            </span>
                          </div>

                          {/* Price & Action */}
                          <div className="text-left shrink-0 pl-2">
                            <div className="text-xs font-black text-blue-950">
                              {discountedPrice.toLocaleString()} ج.م
                            </div>
                            {product.discountpercent > 0 && (
                              <div className="text-[10px] text-red-600 font-bold">
                                خصم {product.discountpercent}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer to View All */}
                {searchResults.totalCount > 0 && (
                  <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleExecuteSearch}
                      className="w-full py-1.5 px-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>عرض كافة نتائج البحث ({searchResults.totalCount} منتج)</span>
                      <ArrowRight size={13} className="rotate-180" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">

            {/* Wishlist Icon */}
            <button
              onClick={() => setActiveTab('cart')}
              className="relative p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition hidden sm:flex"
              title="المفضلة"
            >
              <Heart size={21} className={wishlist.length > 0 ? 'text-red-500 fill-red-500' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart / Inspection List Icon */}
            <button
              onClick={() => setActiveTab('cart')}
              className="relative flex items-center gap-2 p-2 md:px-3 md:py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-full transition"
              title="سلة طلبات الشراء والفاتورة"
            >
              <div className="relative">
                <ShoppingCart size={20} className="text-blue-800" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[10px] text-gray-500 font-medium">سلة الطلبات</span>
                <span className="text-xs font-black text-blue-900">{cartCount} أصناف</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Quick Navigation */}
      <div className="bg-gray-50/90 border-t border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs font-semibold text-gray-700">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-0.5">
            <button 
              onClick={() => setActiveTab('deals')}
              className={`flex items-center gap-1.5 font-bold transition px-3 py-1 rounded-lg ${
                activeTab === 'deals' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Flame size={14} className="text-yellow-400" />
              <span>عروض طنطاوي جروب اليومية</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('home');
                setSelectedCategory(null);
              }}
              className={`hover:text-blue-700 transition px-2.5 py-1 rounded-lg ${activeTab === 'home' && !searchQuery ? 'text-blue-900 font-bold bg-blue-50' : ''}`}
            >
              جميع المنتجات
            </button>
            <button 
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory('أجهزة منزلية');
              }}
              className="hover:text-blue-700 transition px-2.5 py-1 rounded-lg"
            >
              أجهزة منزلية
            </button>
            <button 
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory('أجهزة كهربيه');
              }}
              className="hover:text-blue-700 transition px-2.5 py-1 rounded-lg"
            >
              أجهزة كهربيه
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-medium">طنطاوي جروب للتجارة والتوزيع</span>
          </div>
        </div>
      </div>
    </header>
  );
};
