import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Star, 
  ShoppingCart, 
  Heart, 
  Check, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Share2, 
  Minus, 
  Plus 
} from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const { 
    selectedProduct, 
    setSelectedProduct, 
    addToCart, 
    toggleWishlist, 
    isInWishlist 
  } = useApp();

  if (!selectedProduct) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(selectedProduct.sizevariants?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [isAddedToast, setIsAddedToast] = useState(false);

  const discountedPrice = Math.round(
    selectedProduct.actualprice * (1 - selectedProduct.discountpercent / 100)
  );
  const savings = selectedProduct.actualprice - discountedPrice;
  const inWish = isInWishlist(selectedProduct.id);

  const images = selectedProduct.previewimages?.length
    ? selectedProduct.previewimages
    : [selectedProduct.previewimage];

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, selectedVariant);
    setIsAddedToast(true);
    setTimeout(() => setIsAddedToast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedProduct(null)}
          className="absolute top-4 left-4 z-20 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition shadow-xs"
        >
          <X size={20} />
        </button>

        {/* Modal Body */}
        <div className="p-5 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column: Image Gallery */}
            <div className="space-y-3">
              <div className="aspect-square bg-gray-50 rounded-2xl p-4 flex items-center justify-center border border-gray-100 relative overflow-hidden">
                <span className="absolute top-3 right-3 bg-blue-900 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-xs">
                  {selectedProduct.brand}
                </span>
                <img
                  src={images[activeImageIndex] || selectedProduct.previewimage}
                  alt={selectedProduct.nameAr}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl border-2 p-1 bg-gray-50 overflow-hidden shrink-0 transition ${
                        activeImageIndex === idx ? 'border-blue-900 shadow-xs' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Product Info & Actions */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs bg-blue-50 text-blue-900 font-bold px-2.5 py-0.5 rounded-md">
                    {selectedProduct.categoryAr}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={14} className="fill-amber-400" />
                    <span className="text-xs font-bold text-gray-800">{selectedProduct.overallrating}</span>
                    <span className="text-xs text-gray-400">({selectedProduct.reviews.length} تقييم)</span>
                  </div>
                </div>

                <h2 className="text-lg md:text-xl font-black text-gray-900 leading-snug">
                  {selectedProduct.nameAr}
                </h2>
                <p className="text-xs text-gray-500 mt-1">{selectedProduct.summaryAr}</p>

                {/* Availability and Direct Contact Hotline */}
                <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl my-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-bold">العلامة التجارية:</span>
                    <span className="font-black text-blue-950 bg-white px-2.5 py-1 rounded-md border border-blue-100">
                      {selectedProduct.brand}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-bold">حالة التوفر:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      متوفر بجميع المعارض • متاح للمعاينة الفورية
                    </span>
                  </div>

                  <a
                    href="tel:15218"
                    className="flex items-center justify-between bg-white hover:bg-blue-900 hover:text-white p-2.5 rounded-xl border border-blue-200 text-xs text-blue-900 font-bold transition group"
                  >
                    <span>للاستفسار المباشر عن التوافر والسعر الحالي:</span>
                    <span className="font-mono text-sm bg-yellow-300 text-blue-950 px-2 py-0.5 rounded font-black group-hover:bg-yellow-400">
                      15218
                    </span>
                  </a>
                </div>

                {/* Variants / Colors */}
                {selectedProduct.sizevariants?.length > 0 && (
                  <div className="space-y-1.5 my-3">
                    <span className="text-xs font-bold text-gray-700">الموديل أو السعة:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.sizevariants.map((variant) => (
                        <button
                          key={variant}
                          onClick={() => setSelectedVariant(variant)}
                          className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition ${
                            selectedVariant === variant
                              ? 'border-blue-900 bg-blue-50 text-blue-900'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {variant}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity selector */}
                <div className="flex items-center gap-3 my-3">
                  <span className="text-xs font-bold text-gray-700">عدد القطع المطلوبة للمعاينة:</span>
                  <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 text-gray-600 hover:bg-gray-200 transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 text-xs font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1.5 text-gray-600 hover:bg-gray-200 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-blue-900 hover:bg-blue-950 active:scale-98 text-white py-3 px-4 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    <span>طلب معاينة الصنف</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(selectedProduct)}
                    className="p-3 border border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-500 rounded-xl transition"
                    title="المفضلة"
                  >
                    <Heart size={20} className={inWish ? 'text-red-500 fill-red-500' : ''} />
                  </button>
                </div>

                {isAddedToast && (
                  <div className="bg-emerald-600 text-white text-xs font-bold p-2.5 rounded-xl text-center shadow-md animate-fade-in flex items-center justify-center gap-1.5">
                    <Check size={16} />
                    <span>تمت إضافة الصنف إلى قائمة المعاينة بنجاح!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Description & Specs */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">تفاصيل ومواصفات المنتج:</h3>
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">
              {selectedProduct.descriptionAr}
            </p>
          </div>

          {/* Customer Reviews Section */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                آراء وتقييمات العملاء ({selectedProduct.reviews.length})
              </h3>
            </div>

            {selectedProduct.reviews.length === 0 ? (
              <p className="text-xs text-gray-400">لا توجد تقييمات بعد لهذا المنتج. كن أول من يقيّمه!</p>
            ) : (
              <div className="space-y-2.5">
                {selectedProduct.reviews.map((rev, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">{rev.customername}</span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: Number(rev.rating) || 5 }).map((_, i) => (
                          <Star key={i} size={11} className="fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{rev.comment}</p>
                    <span className="text-[10px] text-gray-400 block">{rev.revieweddate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
