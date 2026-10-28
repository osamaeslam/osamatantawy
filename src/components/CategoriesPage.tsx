import React, { useState } from 'react';
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
  Filter,
  Check
} from 'lucide-react';
import { Product } from '../types';

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

  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating' | 'discount'>('default');
  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');

  // Filter products by selected category and subcategory
  let filtered = products;
  if (selectedCategory) {
    filtered = filtered.filter((p) => p.category === selectedCategory);
  }

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    const priceA = a.actualprice * (1 - a.discountpercent / 100);
    const priceB = b.actualprice * (1 - b.discountpercent / 100);
    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    if (sortBy === 'rating') return b.overallrating - a.overallrating;
    if (sortBy === 'discount') return b.discountpercent - a.discountpercent;
    return 0;
  });

  const activeCategoryObj = CATEGORIES.find((c) => c.name === selectedCategory);

  return (
    <div className="space-y-6 pb-16">
      {/* Category Pills Header */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-black text-gray-900">
            {activeCategoryObj ? activeCategoryObj.nameAr : 'جميع أقسام طنطاوي جروب'}
          </h2>
          {selectedCategory && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
              }}
              className="text-xs text-red-600 font-bold hover:underline"
            >
              عرض كل الأقسام
            </button>
          )}
        </div>

        {/* Categories scrollable chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
              selectedCategory === null
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            الكل ({products.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                setSelectedCategory(cat.name);
                setSelectedSubcategory(null);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                selectedCategory === cat.name
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.nameAr}
            </button>
          ))}
        </div>

        {/* Subcategories if category selected */}
        {activeCategoryObj && (
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-gray-400 font-bold shrink-0">التصنيفات:</span>
            {activeCategoryObj.subcategoriesAr.map((sub, idx) => (
              <button
                key={sub}
                onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? null : sub)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium shrink-0 transition ${
                  selectedSubcategory === sub
                    ? 'bg-red-100 text-red-700 font-bold'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
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
            <option value="price-asc">الأقل سعراً أولاً</option>
            <option value="price-desc">الأعلى سعراً أولاً</option>
            <option value="rating">الأعلى تقييماً</option>
            <option value="discount">أكبر نسبة خصم</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewStyle('grid')}
            className={`p-1 rounded ${viewStyle === 'grid' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-500'}`}
            title="شبكة"
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewStyle('list')}
            className={`p-1 rounded ${viewStyle === 'list' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-500'}`}
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
            const discountedPrice = Math.round(product.actualprice * (1 - product.discountpercent / 100));
            const inWish = isInWishlist(product.id);

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col justify-between group relative"
              >
                {product.discountpercent > 0 && (
                  <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    -{product.discountpercent}%
                  </div>
                )}
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
                      className="text-xs md:text-sm font-bold text-gray-800 hover:text-red-600 transition cursor-pointer line-clamp-2"
                    >
                      {product.nameAr}
                    </h3>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm md:text-base font-black text-gray-900 block">
                        {discountedPrice.toLocaleString()} ج.م
                      </span>
                      {product.discountpercent > 0 && (
                        <span className="text-[11px] text-gray-400 line-through">
                          {product.actualprice.toLocaleString()} ج.م
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(product, 1)}
                      className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition"
                      title="إضافة إلى السلة"
                    >
                      <ShoppingCart size={16} />
                    </button>
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
            const discountedPrice = Math.round(product.actualprice * (1 - product.discountpercent / 100));
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
                    src={product.previewimage}
                    alt={product.nameAr}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-red-600 bg-red-50 font-bold px-2 py-0.5 rounded">
                      {product.categoryAr}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={12} className="fill-amber-400" />
                      <span className="text-[11px] font-bold text-gray-700">{product.overallrating}</span>
                    </div>
                  </div>

                  <h3
                    onClick={() => setSelectedProduct(product)}
                    className="text-xs md:text-base font-bold text-gray-800 hover:text-red-600 transition cursor-pointer line-clamp-1"
                  >
                    {product.nameAr}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1 hidden sm:block">
                    {product.summaryAr}
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-sm md:text-lg font-black text-red-600">
                      {discountedPrice.toLocaleString()} ج.م
                    </span>
                    {product.discountpercent > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        {product.actualprice.toLocaleString()} ج.م
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <ShoppingCart size={14} />
                    <span className="hidden sm:inline">أضف للسلة</span>
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
    </div>
  );
};
