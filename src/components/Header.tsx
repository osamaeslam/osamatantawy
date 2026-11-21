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
  Globe,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { getSafeImageSrc } from '../utils/imageHelper';
import { normalizeImageUrl } from '../services/image-url';
import { smartSearchProducts } from '../utils/smartSearch';
import { Product } from '../types';
import {
  STOREFRONT_TEXT,
  getLocalizedProductName,
  getLocalizedProductCategory,
  translateSubcategoryLabel,
} from '../i18n/translations';

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
    setQuickViewProduct,
    addToCart,
    setIsOrderTrackingOpen,
    setIsUserGuideOpen,
    setIsAboutModalOpen,
    homePageConfig,
    openItemRequestModal,
    language,
    toggleLanguage,
  } = useApp();

  const t = STOREFRONT_TEXT[language];
  const th = t.header;
  const isRtl = language === 'ar';

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const searchResults = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) {
      return { matchedProducts: [], matchingGroups: [], totalCount: 0 };
    }
    const res = smartSearchProducts(products, rawQuery, 5);
    return {
      matchedProducts: res.topFive,
      matchingGroups: res.matchingGroups,
      totalCount: res.totalCount,
    };
  }, [products, searchQuery]);

  const handleSelectProduct = (product: Product) => {
    setQuickViewProduct(product);
    setShowDropdown(false);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId((curr) => (curr === product.id ? null : curr)), 1500);
  };

  const handleSelectGroup = (groupName: string) => {
    setSelectedSubcategory(groupName);
    setActiveTab('categories');
    setShowDropdown(false);
  };

  const handleExecuteSearch = () => {
    setShowDropdown(false);
    if (activeTab !== 'categories' && activeTab !== 'home') {
      setActiveTab('home');
    }
  };

  const announcementText =
    language === 'en'
      ? th.announcementDefault
      : homePageConfig?.announcementText || th.announcementDefault;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-gray-100">
      {/* Top Banner Announcement - Sleek single row on mobile & desktop */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white text-xs py-1.5 sm:py-2 px-3 sm:px-4 font-medium flex items-center justify-between border-b border-blue-800/40 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PhoneCall size={13} className="text-yellow-400 shrink-0" />
          <a href={`tel:${homePageConfig?.hotline || '15218'}`} className="hover:underline flex items-center gap-1 whitespace-nowrap">
            <span className="hidden sm:inline text-gray-200 text-[11px]">{th.hotlineLabel}</span>
            <strong className="font-black tracking-wider text-yellow-300 text-xs sm:text-sm">
              {homePageConfig?.hotline || '15218'}
            </strong>
          </a>
        </div>
        <div className="hidden md:flex items-center justify-center gap-2 text-xs text-gray-100 truncate">
          <Sparkles size={14} className="text-yellow-300 animate-pulse shrink-0" />
          <span className="truncate">{announcementText}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switcher (Arabic / English) */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black transition shadow-xs border border-white/25 whitespace-nowrap shrink-0 cursor-pointer"
            title={t.switchLangTitle}
            aria-label={t.switchLangTitle}
          >
            <Globe size={12} className="text-yellow-300 shrink-0" />
            <span>{t.switchLangLabel}</span>
          </button>

          <button
            onClick={() => setIsOrderTrackingOpen(true)}
            className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-300 text-blue-950 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black transition shadow-xs whitespace-nowrap shrink-0"
            title={th.trackOrderTitle}
          >
            <Truck size={12} />
            <span>{th.trackOrder}</span>
          </button>
          <button
            onClick={() => setIsUserGuideOpen(true)}
            className="hidden sm:flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full text-[11px] font-bold transition shadow-xs border border-white/20 whitespace-nowrap shrink-0"
            title={th.guideTitle}
          >
            <BookOpen size={12} className="text-yellow-300" />
            <span>{th.guide}</span>
          </button>
          <PWAInstallButton />
          <button
            onClick={() => setIsAboutModalOpen(true)}
            className="hidden lg:flex items-center gap-1 bg-white/10 hover:bg-white/20 transition px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-200 whitespace-nowrap shrink-0"
          >
            <Building2 size={12} />
            <span>{th.aboutCompany}</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar - Responsive 2-row on Mobile, 1-row on Desktop */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5 md:gap-5">
          {/* Brand Logo */}
          <div
            onClick={() => {
              setActiveTab('home');
              setSelectedCategory(null);
            }}
            className="order-1 flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
          >
            <div className="h-9 sm:h-10 md:h-12 w-auto bg-white rounded-lg p-0.5 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src="/logo.png"
                alt="Dream Tantawy Group Logo"
                className="h-full w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base md:text-xl font-black text-blue-950 tracking-tight flex items-center gap-1 whitespace-nowrap">
                {t.brandName}
                <span className="text-[9px] sm:text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-sm">
                  {t.brandCountry}
                </span>
              </span>
              <span className="text-[10px] text-amber-700 font-black tracking-wide whitespace-nowrap">
                {t.brandTagline}
              </span>
            </div>
          </div>

          {/* Action Icons */}
          <div className="order-2 md:order-3 flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Wishlist Icon */}
            <button
              onClick={() => setActiveTab('cart')}
              className="relative p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition flex"
              title={th.wishlistTitle}
            >
              <Heart size={19} className={wishlist.length > 0 ? 'text-red-500 fill-red-500' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => setActiveTab('cart')}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-full transition whitespace-nowrap"
              title={th.cartTitle}
            >
              <div className="relative">
                <ShoppingCart size={19} className="text-blue-800" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-700 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-black text-blue-900 md:hidden">{cartCount}</span>
              <div className={`hidden lg:flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="text-[10px] text-gray-500 font-medium">{th.cartLabel}</span>
                <span className="text-xs font-black text-blue-900">
                  {cartCount} {th.itemsUnit}
                </span>
              </div>
            </button>
          </div>

          {/* Smart Search Box */}
          <div className="order-3 md:order-2 w-full md:flex-1 md:max-w-2xl relative" ref={searchContainerRef}>
            <div
              className={`relative flex items-center w-full transition-all duration-200 rounded-2xl md:rounded-full border ${
                isSearchFocused || showDropdown
                  ? 'border-blue-600 ring-2 ring-blue-100 shadow-md bg-white'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="ps-3.5 pe-2 text-blue-900/60 shrink-0">
                <Search size={17} />
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
                placeholder={th.searchPlaceholder}
                className="w-full py-2 sm:py-2.5 text-xs md:text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400 font-bold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowDropdown(false);
                  }}
                  className="p-1.5 ms-1 text-gray-400 hover:text-red-600 rounded-full shrink-0"
                  title={th.clearSearch}
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={handleExecuteSearch}
                className="bg-blue-900 hover:bg-blue-950 text-white px-3.5 md:px-5 py-1.5 sm:py-2 m-1 rounded-xl md:rounded-full text-xs font-black transition flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>{th.searchBtn}</span>
              </button>
            </div>

            {/* Smart Top-5 Live Results Dropdown */}
            {showDropdown && searchQuery.trim().length >= 1 && (
              <div className={`absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-blue-100 z-50 overflow-hidden ${isRtl ? 'text-right' : 'text-left'}`}>
                {/* Header */}
                <div className="px-3.5 py-2.5 bg-gradient-to-l from-blue-50 to-indigo-50/70 border-b border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles size={14} className="text-amber-500 shrink-0" />
                    <span className="text-xs font-black text-blue-950 truncate">
                      {th.closestMatchesPrefix} «{searchQuery}»
                    </span>
                  </div>
                  <span className="text-[10px] bg-blue-900 text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                    {searchResults.totalCount} {th.resultsCountSuffix}
                  </span>
                </div>

                {/* Matching Item Groups Pills */}
                {searchResults.matchingGroups.length > 0 && (
                  <div className="p-2 bg-gray-50/80 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] text-gray-500 font-bold shrink-0">{th.sectorsLabel}</span>
                    {searchResults.matchingGroups.map((grp) => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => handleSelectGroup(grp)}
                        className="text-[11px] bg-white border border-blue-200 hover:bg-blue-900 hover:text-white text-blue-900 font-bold px-2.5 py-1 rounded-lg transition shrink-0 flex items-center gap-1"
                      >
                        <Tag size={10} />
                        <span>{translateSubcategoryLabel(grp, language)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Top 5 Product List */}
                <div className="max-h-[65vh] overflow-y-auto divide-y divide-gray-100">
                  {searchResults.matchedProducts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 space-y-2.5">
                      <p className="font-bold text-gray-700">
                        {th.noSearchMatches} «{searchQuery}»
                      </p>
                      <p className="text-[11px] text-gray-400">{th.noSearchHint}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDropdown(false);
                          openItemRequestModal(searchQuery.trim());
                        }}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl transition"
                      >
                        <span>{th.requestFromProcurement(searchQuery.trim())}</span>
                      </button>
                    </div>
                  ) : (
                    searchResults.matchedProducts.map((product) => {
                      const imgUrl =
                        normalizeImageUrl(product.previewimage, undefined, 200) ||
                        getSafeImageSrc(product.previewimage);
                      const isAdded = justAddedId === product.id;
                      const displayTitle = getLocalizedProductName(product, language);
                      const displayCat = getLocalizedProductCategory(product, language);

                      return (
                        <div
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className="p-2.5 sm:px-3.5 hover:bg-blue-50/70 active:bg-blue-50 cursor-pointer transition flex items-center gap-2.5 sm:gap-3 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={imgUrl}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                              alt={displayTitle}
                              className="w-full h-full object-contain group-hover:scale-105 transition"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              {product.brand && (
                                <span className="text-[9px] bg-blue-100 text-blue-900 font-black px-1.5 py-0.2 rounded">
                                  {product.brand}
                                </span>
                              )}
                              {product.itemGroup && (
                                <span className="text-[9px] text-gray-500 font-bold truncate max-w-[110px]">
                                  {translateSubcategoryLabel(product.itemGroup, language)}
                                </span>
                              )}
                              {(product.unifiedCode || product.itemNumber) && (
                                <span className="text-[9px] font-mono text-blue-950 font-bold bg-gray-100 px-1.5 rounded">
                                  {product.unifiedCode || product.itemNumber}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-900 transition">
                              {displayTitle}
                            </h4>
                            <span className="text-[10px] text-gray-400 block truncate">{displayCat}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleQuickAdd(e, product)}
                              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition flex items-center gap-1 shadow-2xs ${
                                isAdded
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-blue-900 hover:bg-blue-950 text-white'
                              }`}
                              title={th.quickAddTitle}
                            >
                              <ShoppingCart size={12} />
                              <span className="hidden sm:inline">{isAdded ? th.addedShort : th.addShort}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer to View All */}
                {searchResults.totalCount > 0 && (
                  <div className="p-2.5 bg-gray-50 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleExecuteSearch}
                      className="w-full py-2 px-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>{th.viewAllResults(searchResults.totalCount)}</span>
                      <ArrowRight size={13} className={isRtl ? 'rotate-180' : ''} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Quick Sector Strip */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setActiveTab('deals')}
            className={`px-3 py-1 rounded-full text-[11px] font-black shrink-0 flex items-center gap-1 transition whitespace-nowrap ${
              activeTab === 'deals'
                ? 'bg-red-600 text-white shadow-2xs'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <Flame size={12} className="text-amber-400" />
            <span>{th.dealsShort}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              setSelectedCategory(null);
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition whitespace-nowrap ${
              activeTab === 'home' && !searchQuery ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {th.catalogShort}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('أجهزة منزلية');
              setSelectedSubcategory(null);
              setActiveTab('categories');
            }}
            className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 hover:bg-blue-50 shrink-0 transition whitespace-nowrap"
          >
            {th.homeAppliances}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('أجهزة كهربيه');
              setSelectedSubcategory(null);
              setActiveTab('categories');
            }}
            className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 hover:bg-blue-50 shrink-0 transition whitespace-nowrap"
          >
            {th.electricalAppliances}
          </button>
          <button
            type="button"
            onClick={() => setIsUserGuideOpen(true)}
            className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 shrink-0 transition whitespace-nowrap"
          >
            {th.guide}
          </button>
        </div>
      </div>

      {/* Categories Horizontal Quick Navigation */}
      <div className="bg-gray-50/90 border-t border-gray-100 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs font-semibold text-gray-700 gap-4">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setActiveTab('deals')}
              className={`flex items-center gap-1.5 font-bold transition px-3 py-1 rounded-lg whitespace-nowrap shrink-0 ${
                activeTab === 'deals' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Flame size={14} className="text-yellow-400" />
              <span>{th.dailyDealsNav}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('home');
                setSelectedCategory(null);
              }}
              className={`hover:text-blue-700 transition px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
                activeTab === 'home' && !searchQuery ? 'text-blue-900 font-bold bg-blue-50' : ''
              }`}
            >
              {th.allProductsNav}
            </button>
            <button
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory('أجهزة منزلية');
              }}
              className="hover:text-blue-700 transition px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0"
            >
              {th.homeAppliances}
            </button>
            <button
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory('أجهزة كهربيه');
              }}
              className="hover:text-blue-700 transition px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0"
            >
              {th.electricalAppliances}
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
              {th.companySubtitleNav}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
