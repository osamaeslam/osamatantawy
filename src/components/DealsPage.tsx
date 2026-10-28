import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Clock, Flame, ShoppingCart, Heart, ShieldAlert, Sparkles } from 'lucide-react';

export const DealsPage: React.FC = () => {
  const { products, addToCart, toggleWishlist, isInWishlist, setSelectedProduct } = useApp();

  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 22 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dealProducts = products.filter((p) => p.discountpercent >= 20);

  return (
    <div className="space-y-6 pb-16">
      {/* Thunder Deals Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-900 to-red-600 text-white p-6 md:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-yellow-300">
              <Zap size={14} className="fill-yellow-300" />
              <span>عروض الصاعقة الحصرية من طنطاوي جروب (Thunder Deals)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              تخفيضات اليوم: وفر حتى 60% على الأجهزة والمنزل
            </h1>
            <p className="text-xs md:text-sm text-blue-100">
              كميات محدودة جداً بأسعار جملة الجملة وضمان معتمد، تنتهي بمجرد نفاذ الكمية أو انتهاء العداد!
            </p>
          </div>

          {/* Countdown Clock Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center shrink-0 self-start md:self-auto">
            <span className="text-[11px] font-bold text-red-100 mb-2 flex items-center gap-1">
              <Clock size={14} />
              <span>الوقت المتبقي لانتهاء العروض:</span>
            </span>
            <div className="flex items-center gap-2 font-mono text-center">
              <div className="bg-black/40 rounded-xl px-3 py-2 min-w-[50px]">
                <span className="text-xl md:text-2xl font-black text-yellow-300 block">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-gray-300 font-sans">ساعة</span>
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="bg-black/40 rounded-xl px-3 py-2 min-w-[50px]">
                <span className="text-xl md:text-2xl font-black text-yellow-300 block">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-gray-300 font-sans">دقيقة</span>
              </div>
              <span className="text-xl font-bold">:</span>
              <div className="bg-black/40 rounded-xl px-3 py-2 min-w-[50px]">
                <span className="text-xl md:text-2xl font-black text-yellow-300 block">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-gray-300 font-sans">ثانية</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dealProducts.map((product, idx) => {
          const discountedPrice = Math.round(product.actualprice * (1 - product.discountpercent / 100));
          const savings = product.actualprice - discountedPrice;
          const inWish = isInWishlist(product.id);
          const percentClaimed = 60 + ((idx * 11) % 35);

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Top Banner Tag */}
              <div className="bg-gradient-to-r from-red-600 to-amber-500 text-white px-3 py-1.5 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1">
                  <Flame size={14} className="fill-white" />
                  <span>توفير {savings.toLocaleString()} ج.م</span>
                </span>
                <span className="bg-black/20 px-2 py-0.5 rounded text-[10px]">
                  خصم {product.discountpercent}%
                </span>
              </div>

              {/* Product Visual */}
              <div className="relative p-6 bg-gray-50 flex items-center justify-center">
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-3 left-3 p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-xs transition z-10"
                >
                  <Heart size={18} className={inWish ? 'text-red-500 fill-red-500' : ''} />
                </button>

                <div
                  onClick={() => setSelectedProduct(product)}
                  className="w-48 h-48 cursor-pointer flex items-center justify-center"
                >
                  <img
                    src={product.previewimage}
                    alt={product.nameAr}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                  />
                </div>
              </div>

              {/* Details & Deal Progress */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">
                    {product.categoryAr}
                  </span>
                  <h3
                    onClick={() => setSelectedProduct(product)}
                    className="text-sm font-bold text-gray-800 hover:text-red-600 transition cursor-pointer mt-1.5 line-clamp-2"
                  >
                    {product.nameAr}
                  </h3>
                </div>

                {/* Progress Bar (Hurry, stock selling out) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                    <span>تم بيع: {percentClaimed}%</span>
                    <span className="text-red-600 font-bold">متبقي قطع قليلة</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-red-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentClaimed}%` }}
                    />
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-red-600 block">
                      {discountedPrice.toLocaleString()} ج.م
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      {product.actualprice.toLocaleString()} ج.م
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(product, 1)}
                    className="bg-red-600 hover:bg-red-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <ShoppingCart size={14} />
                    <span>اطلب الآن</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
