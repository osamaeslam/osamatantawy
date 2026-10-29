import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { ShoppingCart, Heart, PhoneCall, Info, Package, List, Grid3X3 } from 'lucide-react';

interface BrandPageProps {
  brandName: string;
}

export const BrandPage: React.FC<BrandPageProps> = ({ brandName }) => {
  const {
    products,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setSelectedProduct,
    setActiveTab,
    setIsAuthModalOpen,
  } = useApp();

  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');

  const brandProducts = products.filter((p) => p.brand === brandName);

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-right">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-blue-900">{brandName}</h1>
            <p className="text-gray-500 text-sm">
              منتجات {brandName} المتاحة عند طنطاوي جروب
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
            <span className="text-xs font-bold text-gray-600">{brandProducts.length} منتج</span>
            <button
              onClick={() => setViewStyle(viewStyle === 'grid' ? 'list' : 'grid')}
              className="p-1 hover:bg-gray-200 rounded transition"
              title="تغيير طريقة العرض"
            >
              {viewStyle === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
            </button>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-right">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-yellow-800">للعملاء والتجار (الجملة والقطاعي)</h3>
              <p className="text-xs text-yellow-700 mt-1">
                الأسعار غير معروضة على الموقع لأنها تخضع للتجارة بالجملة والاتفاق المباشر.
                <br />
                للاستفسار عن الأسعار وطلب المنتجات، يرجى التواصل عبر الخط الساخن{' '}
                <a href="tel:15218" className="text-yellow-600 font-bold hover:underline">
                  15218
                </a>{' '}
                أو عبر واتساب طنطاوي جروب.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {brandProducts.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-gray-200">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-800">
              لا توجد منتجات متاحة لهذه الماركة حالياً
            </h3>
            <p className="text-gray-500">سيتم إضافة منتجات {brandName} قريباً.</p>
          </div>
        ) : (
          brandProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group"
            >
              <div
                onClick={() => setSelectedProduct(product)}
                className="aspect-[4/5] bg-gray-50 rounded-t-2xl overflow-hidden cursor-pointer border-b border-gray-50 group-hover:border-blue-100"
              >
                <img
                  src={product.previewimage}
                  alt={product.nameAr}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded">
                  متوفر للمعاينة
                </div>
              </div>
              <div className="p-4 text-right">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2 block">
                  {product.categoryAr}
                </span>
                <h3
                  onClick={() => setSelectedProduct(product)}
                  className="text-base font-bold text-gray-800 hover:text-blue-600 transition line-clamp-2 mb-2 cursor-pointer"
                >
                  {product.nameAr}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{product.colors.length} لون</span>
                  <span>{product.sizes.length} مقاس</span>
                  <span className="font-bold text-green-600">متوفر</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <PhoneCall size={14} /> استفسار عن السعر
                  </button>
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="p-2 border border-gray-200 hover:border-red-300 rounded-lg text-gray-400 hover:text-red-500 transition flex items-center justify-center"
                  >
                    <Heart size={16} className={isInWishlist(product) ? 'text-red-500 fill-red-500' : ''} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-900 text-white rounded-2xl p-6 text-right flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">طلب منتجات {brandName} للجملة؟</h3>
          <p className="text-blue-100 text-sm mt-1">
            تواصل مع فريق المبيعات للحصول على أفضل أسعار الجملة والعروض الخاصة بالتجار.
          </p>
        </div>
        <button
          onClick={() => {
            setActiveTab('cart');
            setIsAuthModalOpen(true);
          }}
          className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black px-6 py-3 rounded-xl text-sm shadow-lg transition"
        >
          <PhoneCall size={16} className="mr-2" />
          تواصل للمبيعات
        </button>
      </div>
    </div>
  );
};
