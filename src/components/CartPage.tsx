import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag, 
  ArrowLeft, 
  ShieldCheck, 
  Truck, 
  Heart,
  ShoppingCart,
  X
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { 
    cart, 
    wishlist,
    removeFromCart, 
    updateQuantity, 
    clearCart,
    cartSubtotal, 
    cartDiscount, 
    cartTotal,
    discountCode,
    discountPercent,
    applyPromoCode,
    removePromoCode,
    setIsCheckoutModalOpen,
    setActiveTab,
    toggleWishlist,
    addToCart,
    setSelectedProduct
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState<'cart' | 'wishlist'>('cart');
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState<{ message: string; isError?: boolean } | null>(null);

  const shippingCost = cartTotal > 500 || cartTotal === 0 ? 0 : 50;
  const finalTotal = cartTotal + shippingCost;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput) return;
    const res = applyPromoCode(promoInput);
    setPromoStatus({ message: res.message, isError: !res.success });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Sub Tabs: Cart vs Wishlist */}
      <div className="flex items-center gap-3 border-b border-gray-200">
        <button
          onClick={() => setActiveTabSub('cart')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition ${
            activeTabSub === 'cart'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShoppingCart size={18} />
          <span>عربة التسوق</span>
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
            {cart.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSub('wishlist')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition ${
            activeTabSub === 'wishlist'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Heart size={18} />
          <span>قائمة الرغبات (المفضلة)</span>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            {wishlist.length}
          </span>
        </button>
      </div>

      {activeTabSub === 'cart' ? (
        cart.length === 0 ? (
          /* Empty Cart State (from original EmptyCartPage.xaml) */
          <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 text-center max-w-lg mx-auto space-y-5 my-8">
            <div className="w-28 h-28 mx-auto bg-red-50 text-red-500 rounded-full flex items-center justify-center p-6">
              <ShoppingBag size={56} className="text-red-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">سلة التسوق فارغة حالياً</h3>
              <p className="text-xs md:text-sm text-gray-500 max-w-sm mx-auto">
                لم تقم بإضافة أي منتجات إلى عربة التسوق بعد. تصفح عروض وأقسام طنطاوي جروب وأضف ما يحتاجه منزلك!
              </p>
            </div>
            <button
              onClick={() => setActiveTab('home')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3 px-8 rounded-xl shadow-md transition"
            >
              ابدأ التسوق الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 text-xs">
                <span className="font-bold text-gray-700">المنتجات في السلة ({cart.length})</span>
                <button
                  onClick={clearCart}
                  className="text-gray-400 hover:text-red-600 transition flex items-center gap-1 font-semibold"
                >
                  <Trash2 size={14} />
                  <span>تفريغ السلة</span>
                </button>
              </div>

              {cart.map((item) => {
                const discountedPrice = Math.round(
                  item.product.actualprice * (1 - item.product.discountpercent / 100)
                );
                const itemTotal = discountedPrice * item.quantity;

                return (
                  <div
                    key={item.product.id}
                    className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row items-center gap-4 hover:shadow-xs transition"
                  >
                    <div
                      onClick={() => setSelectedProduct(item.product)}
                      className="w-24 h-24 bg-gray-50 rounded-xl p-2 shrink-0 cursor-pointer flex items-center justify-center"
                    >
                      <img
                        src={item.product.previewimage}
                        alt={item.product.nameAr}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-right">
                      <span className="text-[10px] text-gray-400 font-bold block">
                        {item.product.categoryAr}
                      </span>
                      <h4
                        onClick={() => setSelectedProduct(item.product)}
                        className="text-sm font-bold text-gray-800 hover:text-red-600 transition cursor-pointer line-clamp-1"
                      >
                        {item.product.nameAr}
                      </h4>
                      {item.selectedSize && (
                        <span className="inline-block text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1">
                          الخيار: {item.selectedSize}
                        </span>
                      )}

                      <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-sm font-black text-red-600">
                          {discountedPrice.toLocaleString()} ج.م
                        </span>
                        {item.product.discountpercent > 0 && (
                          <span className="text-xs text-gray-400 line-through">
                            {item.product.actualprice.toLocaleString()} ج.م
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selector and Total */}
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1.5 text-gray-600 hover:bg-gray-200 transition"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 text-xs font-bold font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1.5 text-gray-600 hover:bg-gray-200 transition"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-left">
                        <span className="text-xs font-bold text-gray-900 block">
                          الإجمالي: {itemTotal.toLocaleString()} ج.م
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[11px] text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 mt-1"
                        >
                          <Trash2 size={12} />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary & Coupon */}
            <div className="space-y-4">
              {/* Promo Code Box */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Tag size={16} className="text-red-600" />
                  <span>كود الخصم أو قسيمة الشراء</span>
                </span>
                
                {discountCode ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-green-800 block">كوبون مفعّل: {discountCode}</span>
                      <span className="text-green-600">خصم {discountPercent}% على إجمالي السلة</span>
                    </div>
                    <button
                      onClick={removePromoCode}
                      className="p-1 text-green-700 hover:text-red-600 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="جرب كود: TANTAWY10 أو VIP30"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-red-500 uppercase"
                    />
                    <button
                      type="submit"
                      className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                    >
                      تطبيق
                    </button>
                  </form>
                )}

                {promoStatus && (
                  <p className={`text-[11px] font-medium ${promoStatus.isError ? 'text-red-600' : 'text-green-600'}`}>
                    {promoStatus.message}
                  </p>
                )}
              </div>

              {/* Price Details (from PriceDetailView.xaml) */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-3">
                  ملخص الطلب (تفاصيل السعر)
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>سعر المنتجات:</span>
                    <span className="font-bold">{Math.round(cartSubtotal).toLocaleString()} ج.م</span>
                  </div>

                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>خصم الكوبون ({discountPercent}%):</span>
                      <span>-{Math.round(cartDiscount).toLocaleString()} ج.م</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>مصاريف الشحن والتوصيل:</span>
                    <span>
                      {shippingCost === 0 ? (
                        <strong className="text-green-600">مجاني (للطلبات فوق 500 ج.م)</strong>
                      ) : (
                        `${shippingCost} ج.م`
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                    <span className="text-sm font-black text-gray-900">المبلغ الإجمالي للدفع:</span>
                    <span className="text-xl font-black text-red-600 font-mono">
                      {Math.round(finalTotal).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white py-3 px-4 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  <span>متابعة الشراء وإتمام الطلب</span>
                  <ArrowLeft size={16} />
                </button>

                <div className="space-y-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-green-600 shrink-0" />
                    <span>دفع آمن 100% مع إمكانية الدفع عند الاستلام</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-blue-600 shrink-0" />
                    <span>توصيل سريع حتى باب المنزل في جميع محافظات مصر</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Wishlist Tab Content (from WishlistPage.xaml) */
        wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 text-center max-w-lg mx-auto space-y-4 my-8">
            <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
              <Heart size={40} />
            </div>
            <h3 className="text-lg font-black text-gray-900">قائمة المفضلة فارغة</h3>
            <p className="text-xs text-gray-500">
              قم بحفظ المنتجات التي تعجبك بالضغط على علامة القلب لتصل إليها بسهولة لاحقاً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {wishlist.map((product) => {
              const discountedPrice = Math.round(
                product.actualprice * (1 - product.discountpercent / 100)
              );

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200 p-3 flex flex-col justify-between group"
                >
                  <div
                    onClick={() => setSelectedProduct(product)}
                    className="aspect-square bg-gray-50 rounded-xl p-3 flex items-center justify-center cursor-pointer mb-2"
                  >
                    <img
                      src={product.previewimage}
                      alt={product.nameAr}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div>
                    <h4
                      onClick={() => setSelectedProduct(product)}
                      className="text-xs font-bold text-gray-800 hover:text-red-600 transition cursor-pointer line-clamp-1"
                    >
                      {product.nameAr}
                    </h4>
                    <span className="text-sm font-black text-red-600 mt-1 block">
                      {discountedPrice.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        addToCart(product, 1);
                        toggleWishlist(product);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <ShoppingCart size={13} />
                      <span>نقل للسلة</span>
                    </button>
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="p-1.5 text-gray-400 hover:text-red-600 border border-gray-200 rounded-lg"
                      title="إزالة من المفضلة"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
