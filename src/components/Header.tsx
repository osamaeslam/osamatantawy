import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Users, 
  X,
  PhoneCall,
  Percent,
  Flame,
  Building2
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const Header: React.FC = () => {
  const {
    cartCount,
    cartTotal,
    wishlist,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    isLoggedIn,
    user,
    setIsAuthModalOpen,
    setIsAboutModalOpen,
    setSelectedCategory
  } = useApp();

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
      {/* Top Banner Announcement */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-red-600 text-white text-xs md:text-sm py-2 px-4 font-medium flex items-center justify-between">
        <div className="hidden md:flex items-center gap-2">
          <PhoneCall size={14} className="text-red-400" />
          <span>خدمة عملاء طنطاوي جروب: <strong className="font-bold tracking-wider text-yellow-300">19980</strong></span>
        </div>
        <div className="flex items-center justify-center gap-2 mx-auto">
          <Sparkles size={14} className="text-yellow-300 animate-pulse" />
          <span>عروض طنطاوي جروب الكبرى: خصومات حصرية، شحن سريع لجميع المحافظات ودفع موحد عند الاستلام!</span>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <PWAInstallButton />
          <button 
            onClick={() => setIsAboutModalOpen(true)}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition px-3 py-1 rounded-full text-xs font-semibold"
          >
            <Building2 size={13} />
            <span>عن طنطاوي جروب</span>
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

          {/* Search Box */}
          <div className="flex-1 max-w-2xl relative">
            <div className={`relative flex items-center w-full transition-all duration-200 rounded-full border ${isSearchFocused ? 'border-blue-600 ring-2 ring-blue-100 shadow-md bg-white' : 'border-gray-300 bg-gray-50'}`}>
              <div className="pr-4 pl-2 text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="ابحث في طنطاوي جروب: أجهزة كهربائية، حلل، شاشات، مفروشات..."
                className="w-full py-2.5 text-xs md:text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 ml-2 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X size={16} />
                </button>
              )}
              <button 
                onClick={() => {
                  if (activeTab !== 'categories' && activeTab !== 'home') {
                    setActiveTab('home');
                  }
                }}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 md:px-5 py-2 m-0.5 rounded-full text-xs md:text-sm font-bold transition flex items-center gap-1"
              >
                <span>بحث</span>
              </button>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {/* Install button compact on mobile */}
            <div className="md:hidden">
              <PWAInstallButton compact />
            </div>

            {/* View Mode Switcher */}
            <button
              onClick={() => setViewMode(viewMode === 'mobile' ? 'web' : 'mobile')}
              title={viewMode === 'mobile' ? 'عرض كمتجر ويب واسع' : 'عرض كمحاكي تطبيق موبايل'}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 transition"
            >
              {viewMode === 'mobile' ? (
                <>
                  <Monitor size={16} className="text-blue-700" />
                  <span className="hidden xl:inline">وضع المتجر الكامل</span>
                </>
              ) : (
                <>
                  <Smartphone size={16} className="text-red-600" />
                  <span className="hidden xl:inline">وضع الموبايل</span>
                </>
              )}
            </button>

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

            {/* Cart Icon */}
            <button
              onClick={() => setActiveTab('cart')}
              className="relative flex items-center gap-2 p-2 md:px-3 md:py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-full transition"
              title="عربة التسوق"
            >
              <div className="relative">
                <ShoppingCart size={21} className="text-blue-800" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[10px] text-gray-500 font-medium">سلة المشتريات</span>
                <span className="text-xs font-black text-blue-900">{cartTotal.toLocaleString()} ج.م</span>
              </div>
            </button>

            {/* User Account / Profile */}
            <button
              onClick={() => {
                if (isLoggedIn) {
                  setActiveTab('profile');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="flex items-center gap-2 p-1.5 md:px-3 md:py-1.5 border border-gray-200 hover:border-gray-300 rounded-full transition"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-600">
                {isLoggedIn && user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={18} />
                )}
              </div>
              <span className="text-xs font-bold text-gray-700 hidden md:inline truncate max-w-[90px]">
                {isLoggedIn ? user.name.split(' ')[0] : 'دخول'}
              </span>
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
              className={`flex items-center gap-1.5 font-bold transition px-2.5 py-1 rounded-md ${
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
              className={`hover:text-blue-700 transition ${activeTab === 'home' && !searchQuery ? 'text-blue-700 font-bold' : ''}`}
            >
              جميع المنتجات
            </button>
            <button 
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory('Home & Kitchen');
              }}
              className="hover:text-blue-700 transition"
            >
              أدوات وأجهزة منزلية
            </button>
            <button 
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory('Electronics');
              }}
              className="hover:text-blue-700 transition"
            >
              أجهزة كهربائية وشاشات
            </button>
            <button 
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory('Mobile Phones');
              }}
              className="hover:text-blue-700 transition"
            >
              موبايلات وإكسسوارات
            </button>
            <button 
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory('Home Furniture');
              }}
              className="hover:text-blue-700 transition"
            >
              مفروشات وسجاد
            </button>
            <button 
              onClick={() => {
                setActiveTab('categories');
                setSelectedCategory('Personal Care');
              }}
              className="hover:text-blue-700 transition"
            >
              عناية شخصية
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
