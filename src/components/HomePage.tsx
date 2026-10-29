import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
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
  PhoneCall
} from 'lucide-react';
import { Product } from '../types';
import { BrandsGrid } from './BrandsGrid';

export const HomePage: React.FC = () => {
  const { 
    products, 
    addToCart, 
    toggleWishlist, 
    isInWishlist, 
    setSelectedProduct, 
    setActiveTab, 
    setSelectedCategory,
    setIsAboutModalOpen,
    searchQuery,
    setSelectedBrand
  } = useApp();

  // Premium, high-definition promotional banners for Tantawy Group
  const heroBanners = [
    {
      id: 1,
      title: 'الأجهزة المنزلية الكبرى',
      subtitle: 'أحدث موديلات الثلاجات، الغسالات، البوتاجازات، والتكييفات بضمان الوكيل الرسمي وضمان طنطاوي',
      badge: 'أجهزة أصلية معتمدة',
      buttonText: 'تصفح الأجهزة الكبرى',
      category: 'Major Appliances',
      bgGradient: 'from-blue-950 via-blue-900 to-indigo-900',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1600&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      title: 'عالم الشاشات والتلفزيونات الذكية',
      subtitle: 'شاشات 4K الترا HD، أوليد وكريستال سمارت من سامسونج وإل جي وتوشيبا بريسيفر داخلي',
      badge: 'تجربة سينمائية',
      buttonText: 'تصفح الشاشات',
      category: 'Smart TVs',
      bgGradient: 'from-slate-950 via-slate-900 to-blue-950',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1600&auto=format&fit=crop&q=80'
    },
    {
      id: 3,
      title: 'الأجهزة المنزلية الخفيفة والمطبخ',
      subtitle: 'قلايات هوائية إير فراير، محضرات طعام متكاملة، ميكروويف، مكانس، وماكينات قهوة فاخرة',
      badge: 'راحة يومية',
      buttonText: 'تصفح الأجهزة الخفيفة',
      category: 'Small Appliances',
      bgGradient: 'from-indigo-950 via-blue-950 to-red-950',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600&auto=format&fit=crop&q=80'
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

  // Filter products if search is active
  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.categoryAr.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const deals = products.filter((p) => p.isDeal);
  const newArrivals = products.slice(2, 7);

      <BrandsGrid />
  return (
    <div className="space-y-6 md:space-y-10 pb-16">
      {/* Search Result Notification if user searched */}
      {searchQuery && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">نتائج البحث في طنطاوي جروب عن:</span>
            <span className="text-sm font-bold text-blue-900">"{searchQuery}"</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              ({filteredProducts.length} منتج)
            </span>
          </div>
          <button
            onClick={() => setActiveTab('categories')}
            className="text-xs text-blue-700 font-bold hover:underline"
          >
            تصفح كل الفئات
          </button>
        </div>
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
                    src={banner.image}
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
                        setSelectedCategory(banner.category);
                        setActiveTab('categories');
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
                    src={banner.image}
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
            <h4 className="text-xs md:text-sm font-bold text-gray-800">دفع موحد بعد المعاينة</h4>
            <p className="text-[11px] text-gray-500">افتح الشحنة وتأكد منها قبل الدفع</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              onClick={() => {
                setSelectedCategory(cat.name);
                setActiveTab('categories');
              }}
              className="bg-white hover:bg-blue-50/60 border border-gray-200 hover:border-blue-300 rounded-3xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 group shadow-xs hover:shadow-md"
            >
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-950 flex items-center justify-center text-white group-hover:scale-110 transition duration-300 shadow-sm shrink-0">
                  <Sparkles size={24} className="text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-gray-900 group-hover:text-blue-900 transition">
                    {cat.nameAr}
                  </h3>
                  <span className="text-[11px] text-gray-500 font-medium line-clamp-1">
                    {cat.descriptionAr}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                {cat.subcategoriesAr.slice(0, 3).map((sub) => (
                  <span key={sub} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                    {sub}
                  </span>
                ))}
                {cat.subcategoriesAr.length > 3 && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                    +{cat.subcategoriesAr.length - 3} المزيد
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

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
                    src={product.previewimage}
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
                      <span className="text-[10px] text-gray-500 font-medium">معاينة مجانية</span>
                    </div>

                    <button
                      onClick={() => addToCart(product, 1)}
                      className="w-full bg-blue-900 hover:bg-blue-950 active:scale-95 text-white py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <ShoppingCart size={14} />
                      <span>طلب معاينة الصنف</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two Side-By-Side Branded Promotional Banners */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div 
          onClick={() => {
            setSelectedCategory('Major Appliances');
            setActiveTab('categories');
          }}
          className="cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 to-blue-800 text-white p-6 md:p-8 flex items-center justify-between shadow-md hover:shadow-lg transition group relative"
        >
          <div className="space-y-2 z-10 max-w-[65%]">
            <span className="text-[11px] bg-red-600 font-black px-2.5 py-0.5 rounded-full inline-block">
              أجهزة منزلية كبرى
            </span>
            <h3 className="text-lg md:text-xl font-black">ثلاجات، غسالات وبوتاجازات</h3>
            <p className="text-xs text-blue-200">شارب، إل جي، فريش، وكاريير بضمان الوكيل المعتمد</p>
            <span className="text-xs font-bold text-yellow-300 flex items-center gap-1 pt-1">
              <span>تصفح الأجهزة الكبرى</span>
              <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition" />
            </span>
          </div>
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80"
              alt="Major Appliances"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          </div>
        </div>

        <div 
          onClick={() => {
            setSelectedCategory('Smart TVs');
            setActiveTab('categories');
          }}
          className="cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 md:p-8 flex items-center justify-between shadow-md hover:shadow-lg transition group relative"
        >
          <div className="space-y-2 z-10 max-w-[65%]">
            <span className="text-[11px] bg-amber-500 font-black text-black px-2.5 py-0.5 rounded-full inline-block">
              شاشات وتلفزيونات 4K
            </span>
            <h3 className="text-lg md:text-xl font-black">شاشات سامسونج وتوشيبا وإل جي</h3>
            <p className="text-xs text-gray-300">وضوح كريستالي مع ريسيفر داخلي وتوصيل سريع</p>
            <span className="text-xs font-bold text-yellow-300 flex items-center gap-1 pt-1">
              <span>تصفح الشاشات الذكية</span>
              <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition" />
            </span>
          </div>
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80"
              alt="Smart TV"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          </div>
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
                    src={product.previewimage}
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

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-md">
                      طلب معاينة
                    </span>

                    <button
                      onClick={() => addToCart(product, 1)}
                      className="py-1.5 px-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl transition text-xs font-bold flex items-center gap-1"
                      title="حجز للمعاينة"
                    >
                      <ShoppingCart size={13} />
                      <span>حجز</span>
                    </button>
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
              نوفر لك تشكيلة متكاملة تناسب كل بيت وعروسة مع حق فتح ومعاينة الشحنة بالكامل قبل الدفع عند الاستلام. فريق خدمة العملاء متاح للرد على استفساراتكم طوال اليوم عبر الخط الساخن <a href="tel:15218" className="text-yellow-300 font-bold hover:underline">15218</a>.
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
    </div>
  );
};
