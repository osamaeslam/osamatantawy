import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Star, 
  ShoppingCart, 
  Heart, 
  Check, 
  Minus, 
  Plus,
  MessageCircle,
  Edit3,
  MessageSquarePlus,
  CheckCircle,
  Scale,
  Image as ImageIcon
} from 'lucide-react';
import { createProductWhatsAppUrl } from '../services/whatsapp-order';
import { getSafeImageSrc } from '../utils/imageHelper';
import { getStockMeta } from '../utils/stockStatus';
import { OutOfStockAssistant } from './OutOfStockAssistant';
import {
  STOREFRONT_TEXT,
  getLocalizedProductName,
  getLocalizedProductCategory,
  getLocalizedProductSummary,
  getLocalizedProductDescription,
} from '../i18n/translations';

export const ProductDetailModal: React.FC = () => {
  const { 
    selectedProduct, 
    setSelectedProduct, 
    addToCart, 
    toggleWishlist, 
    isInWishlist,
    addProductReview,
    stockStatusMap,
    toggleCompare,
    isInCompare,
    setIsCompareDrawerOpen,
    setPosterProduct,
    language,
  } = useApp();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(selectedProduct?.sizevariants?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [isAddedToast, setIsAddedToast] = useState(false);

  // Review states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!selectedProduct) return null;

  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].productDetail;
  const tq = STOREFRONT_TEXT[language].quickView;
  const th = STOREFRONT_TEXT[language].home;

  const stockMeta = getStockMeta(selectedProduct, stockStatusMap, language);
  const inWish = isInWishlist(selectedProduct.id);
  const pName = getLocalizedProductName(selectedProduct, language);
  const pCat = getLocalizedProductCategory(selectedProduct, language);
  const pSummary = getLocalizedProductSummary(selectedProduct, language);
  const pDesc = getLocalizedProductDescription(selectedProduct, language);

  const images = selectedProduct.previewimages?.length
    ? selectedProduct.previewimages
    : [selectedProduct.previewimage];

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, selectedVariant);
    setIsAddedToast(true);
    setTimeout(() => setIsAddedToast(false), 2500);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    const newRev = {
      customername: reviewAuthor.trim() || (isRtl ? 'عميل موثق - طنطاوي جروب' : 'Verified Buyer - Tantawy Group'),
      comment: reviewComment.trim(),
      rating: reviewRating,
      revieweddate: new Date().toISOString().split('T')[0],
    };

    addProductReview(selectedProduct.id, newRev);
    setReviewSubmitted(true);
    setReviewComment('');
    setTimeout(() => {
      setReviewSubmitted(false);
      setShowReviewForm(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedProduct(null)}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-20 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition shadow-xs`}
        >
          <X size={20} />
        </button>

        {/* Modal Body */}
        <div className="p-5 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="aspect-square bg-gray-50 rounded-2xl p-4 flex items-center justify-center border border-gray-100 relative overflow-hidden">
                <span className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} bg-blue-900 text-white text-xs font-black px-2.5 py-1 rounded-md shadow-xs`}>
                  {selectedProduct.brand}
                </span>
                <img
                  src={getSafeImageSrc(images[activeImageIndex] || selectedProduct.previewimage)}
                  alt={pName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Thumbnails */}
              {images.filter(img => Boolean(img && img.trim() !== '')).length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {images
                    .filter(img => Boolean(img && img.trim() !== ''))
                    .map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded-xl border-2 p-1 bg-gray-50 overflow-hidden shrink-0 transition ${
                          activeImageIndex === idx ? 'border-blue-900 shadow-xs' : 'border-gray-200'
                        }`}
                      >
                        <img src={getSafeImageSrc(img)} alt="thumbnail" className="w-full h-full object-contain" />
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Product Info & Actions */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs bg-blue-50 text-blue-900 font-bold px-2.5 py-0.5 rounded-md">
                    {pCat}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={14} className="fill-amber-400" />
                    <span className="text-xs font-bold text-gray-800">{selectedProduct.overallrating}</span>
                    <span className="text-xs text-gray-400">({selectedProduct.reviews.length} {t.reviewsWord})</span>
                  </div>
                </div>

                <h2 className="text-lg md:text-xl font-black text-gray-900 leading-snug">
                  {pName}
                </h2>
                <p className="text-xs text-gray-500 mt-1">{pSummary}</p>

                {/* Availability and Direct Contact Hotline */}
                <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl my-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-bold">{t.brandLabel}</span>
                    <span className="font-black text-blue-950 bg-white px-2.5 py-1 rounded-md border border-blue-100">
                      {selectedProduct.brand}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-gray-600 font-bold shrink-0">{t.stockLabel}</span>
                    <span className={`font-bold px-2.5 py-0.5 rounded border inline-flex items-center gap-1.5 ${stockMeta.badgeClass}`}>
                      <span className={`w-2 h-2 rounded-full ${stockMeta.dotClass}`} />
                      <span>{stockMeta.label}</span>
                    </span>
                  </div>

                  <a
                    href="tel:15218"
                    className="flex items-center justify-between bg-white hover:bg-blue-900 hover:text-white p-2.5 rounded-xl border border-blue-200 text-xs text-blue-900 font-bold transition group"
                  >
                    <span>{t.directInquiry}</span>
                    <span className="font-mono text-sm bg-yellow-300 text-blue-950 px-2 py-0.5 rounded font-black group-hover:bg-yellow-400">
                      15218
                    </span>
                  </a>
                </div>

                {stockMeta.status === 'out_of_stock' && (
                  <div className="my-3">
                    <OutOfStockAssistant
                      product={selectedProduct}
                      onSelectAlternative={(alt) => setSelectedProduct(alt)}
                    />
                  </div>
                )}

                {/* Variants / Colors */}
                {selectedProduct.sizevariants?.length > 0 && (
                  <div className="space-y-1.5 my-3">
                    <span className="text-xs font-bold text-gray-700">{tq.variants}</span>
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
                  <span className="text-xs font-bold text-gray-700">{t.piecesNeeded}</span>
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
                    disabled={!stockMeta.canOrder}
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                      stockMeta.canOrder
                        ? 'bg-blue-900 hover:bg-blue-950 active:scale-98 text-white shadow-md'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart size={18} />
                    <span>{stockMeta.canOrder ? t.addToOrdersCart : th.outOfStock}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCompare(selectedProduct)}
                    className={`p-3 border rounded-xl transition flex items-center gap-1 text-xs font-bold ${
                      isInCompare(selectedProduct.id)
                        ? 'border-blue-900 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-900'
                    }`}
                    title={th.compareTitle}
                  >
                    <Scale size={18} />
                    <span>{isInCompare(selectedProduct.id) ? tq.inCompare : tq.compare}</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(selectedProduct)}
                    className="p-3 border border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-500 rounded-xl transition"
                    title={STOREFRONT_TEXT[language].header.wishlistTitle}
                  >
                    <Heart size={20} className={inWish ? 'text-red-500 fill-red-500' : ''} />
                  </button>
                </div>
                {isInCompare(selectedProduct.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setIsCompareDrawerOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Scale size={14} />
                    <span>{t.openCompareNow}</span>
                  </button>
                )}

                {/* Direct WhatsApp Quick Order + Poster Generator */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <a
                    href={createProductWhatsAppUrl(selectedProduct, quantity, selectedVariant)}
                    target="_blank"
                    rel="noreferrer"
                    className="sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white py-3 px-4 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    <span>{t.whatsappOrderBtn}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedProduct;
                      setSelectedProduct(null);
                      setPosterProduct(p);
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 py-3 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <ImageIcon size={16} />
                    <span>{tq.posterBtn}</span>
                  </button>
                </div>

                {isAddedToast && (
                  <div className="bg-emerald-600 text-white text-xs font-bold p-2.5 rounded-xl text-center shadow-md animate-fade-in flex items-center justify-center gap-1.5">
                    <Check size={16} />
                    <span>{t.addedToast}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Description & Specs */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">{t.specsTitle}</h3>
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl">
              {pDesc}
            </p>
          </div>

          {/* Customer Reviews & Interactive Star Rating Section */}
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <span>{t.reviewsTitle}</span>
                  <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full">
                    {selectedProduct.reviews.length} {t.reviewsWord}
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {t.reviewsSub}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewForm((prev) => !prev)}
                className="bg-blue-900 hover:bg-blue-950 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <MessageSquarePlus size={14} />
                <span>{showReviewForm ? t.cancelReview : t.addReviewBtn}</span>
              </button>
            </div>

            {/* Rating Overview Summary Box */}
            <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className={`text-center ${isRtl ? 'sm:border-l sm:pl-4' : 'sm:border-r sm:pr-4'} sm:border-gray-200 space-y-1`}>
                <div className="text-3xl font-black text-blue-950">
                  {selectedProduct.overallrating}
                  <span className="text-sm font-bold text-gray-400"> / 5</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.round(selectedProduct.overallrating) ? 'fill-amber-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-gray-500 font-medium block">
                  {t.basedOn(selectedProduct.reviews.length)}
                </span>
              </div>

              <div className="sm:col-span-2 space-y-1.5 text-xs">
                {[5, 4, 3, 2, 1].map((starNum) => {
                  const count = selectedProduct.reviews.filter(
                    (r) => Math.round(Number(r.rating)) === starNum
                  ).length;
                  const pct = selectedProduct.reviews.length > 0 
                    ? Math.round((count / selectedProduct.reviews.length) * 100) 
                    : starNum === 5 ? 100 : 0;

                  return (
                    <div key={starNum} className="flex items-center gap-2">
                      <span className="w-12 text-[11px] font-bold text-gray-600 flex items-center gap-1">
                        <span>{starNum}</span>
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`w-8 text-[10px] text-gray-400 ${isRtl ? 'text-left' : 'text-right'} font-mono`}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Add Review Form */}
            {showReviewForm && (
              <form
                onSubmit={handleSubmitReview}
                className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-3.5 transition animate-fade-in"
              >
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <h4 className="text-xs sm:text-sm font-black text-blue-950 flex items-center gap-1.5">
                    <Edit3 size={15} className="text-blue-900" />
                    <span>{t.shareReviewTitle(pName)}</span>
                  </h4>
                  <span className="text-[10px] text-gray-500">{t.verifiedReview}</span>
                </div>

                {/* Star Picker */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    {t.selectStars}
                  </label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isFilled = (hoverRating || reviewRating) >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewRating(starVal)}
                          className="p-1 transition transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            size={26}
                            className={`transition-colors ${
                              isFilled
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-black text-blue-900 mx-2 bg-white px-2.5 py-1 rounded-md border border-blue-100">
                      {t.starsLabel[hoverRating || reviewRating]}
                    </span>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className={`w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-none ${isRtl ? 'text-right' : 'text-left'} font-medium`}
                    dir={isRtl ? 'rtl' : 'ltr'}
                  />
                </div>

                {/* Comment Textarea */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t.commentLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t.commentPlaceholder}
                    className={`w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-none ${isRtl ? 'text-right' : 'text-left'} font-medium resize-none`}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold px-5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5"
                  >
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span>{t.publishBtn}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Success Toast */}
            {reviewSubmitted && (
              <div className="bg-emerald-600 text-white text-xs font-bold p-3 rounded-2xl text-center shadow-md animate-fade-in flex items-center justify-center gap-2">
                <CheckCircle size={18} />
                <span>{t.reviewThanks}</span>
              </div>
            )}

            {/* Existing Customer Reviews List */}
            {selectedProduct.reviews.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-6 text-center text-xs text-gray-400">
                {t.noReviews}
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedProduct.reviews.map((rev, idx) => (
                  <div key={idx} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-1.5 transition hover:border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">{rev.customername}</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                          {t.verifiedPurchase}
                        </span>
                      </div>
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < Math.round(Number(rev.rating) || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
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
