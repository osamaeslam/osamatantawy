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
  X,
  MessageCircle
} from 'lucide-react';
import { createCartWhatsAppUrl } from '../services/whatsapp-order';

export const CartPage: React.FC = () => {
  const { 
    cart, 
    wishlist,
    user,
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
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShoppingCart size={18} />
          <span>قائمة طلبات المعاينة</span>
          <span className="bg-blue-100 text-blue-900 text-xs px-2 py-0.5 rounded-full font-bold">
            {cart.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSub('wishlist')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition ${
            activeTabSub === 'wishlist'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Heart size={18} />
          <span>المفضلة</span>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            {wishlist.length}
          </span>
        </button>
      </div>

      {activeTabSub === 'cart' ? (
        cart.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 text-center max-w-lg mx-auto space-y-5 my-8">
            <div className="w-24 h-24 mx-auto bg-blue-50 text-blue-900 rounded-full flex items-center justify-center p-6">
              <ShoppingBag size={48} className="text-blue-900 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">قائمة المعاينة فارغة حالياً</h3>
              <p className="text-xs md:text-sm text-gray-500 max-w-sm mx-auto">
                لم تقم بإضافة أي أجهزة إلى قائمة المعاينة بعد. تصفح أقسام طنطاوي جروب واختر الأصناف لمعاينتها مجاناً!
              </p>
            </div>
            <button
              onClick={() => setActiveTab('categories')}
              className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm py-3 px-8 rounded-xl shadow-md transition"
            >
              تصفح أصناف المعرض
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 text-xs">
                <span className="font-bold text-gray-700">الأصناف المطلوبة للمعاينة ({cart.length})</span>
                <button
                  onClick={clearCart}
                  className="text-gray-400 hover:text-red-600 transition flex items-center gap-1 font-semibold"
                >
                  <Trash2 size={14} />
                  <span>تفريغ القائمة</span>
                </button>
              </div>

              {cart.map((item) => (
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
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <span className="text-[10px] text-blue-900 bg-blue-50 font-bold px-2 py-0.5 rounded">
                        {item.product.categoryAr}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold">
                        {item.product.brand}
                      </span>
                    </div>

                    <h4
                      onClick={() => setSelectedProduct(item.product)}
                      className="text-sm font-bold text-gray-800 hover:text-blue-900 transition cursor-pointer line-clamp-1"
                    >
                      {item.product.nameAr}
                    </h4>

                    {item.selectedSize && (
                      <span className="inline-block text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1">
                        الموديل / السعة: {item.selectedSize}
                      </span>
                    )}

                    <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        جاهز للمعاينة الفورية
                      </span>
                    </div>
                  </div>

                  {/* Quantity Selector and Actions */}
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 transition"
                        title="تقليل الكمية"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 text-xs font-bold font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 transition"
                        title="زيادة الكمية"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[11px] text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 mt-1"
                    >
                      <Trash2 size={12} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary & Consultation Request */}
            <div className="space-y-4">
              {/* Tantawy Hotline Direct Box */}
              <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-200">الخط الساخن لخدمة العملاء:</span>
                  <a
                    href="tel:15218"
                    className="font-mono text-base font-black bg-yellow-300 text-blue-950 px-2.5 py-0.5 rounded-lg hover:bg-yellow-400 transition"
                  >
                    15218
                  </a>
                </div>
                <p className="text-[11px] text-blue-100 leading-relaxed">
                  فريق مبيعات طنطاوي جروب متاح على مدار الساعة للإجابة عن توافر الموديلات وحجز مواعيد المعاينة بالمنزل أو المعارض.
                </p>
              </div>

              {/* Inspection Request Summary */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-3">
                  ملخص طلب المعاينة
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>عدد الأصناف المختارة:</span>
                    <span className="font-bold text-gray-900">{cart.length} أصناف</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>إجمالي عدد القطع:</span>
                    <span className="font-bold text-gray-900">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} قطعة
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>رسوم المعاينة الأولية:</span>
                    <span className="font-bold text-emerald-700">مجاناً بالكامل</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>طريقة الدفع:</span>
                    <span className="font-bold text-blue-950">موحدة عند الاستلام بعد المعاينة</span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                    <span className="text-sm font-black text-gray-900">حالة الطلب:</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      جاهز للتأكيد والحجز
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="w-full bg-blue-900 hover:bg-blue-950 active:scale-95 text-white py-3 px-4 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  <span>تأكيد طلب المعاينة وحجز الموعد</span>
                  <ArrowLeft size={16} />
                </button>

                <a
                  href={createCartWhatsAppUrl(cart, user ? { name: user.name, phone: user.phone, address: user.address } : undefined)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2.5 px-4 rounded-xl font-bold text-xs transition shadow-xs flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} />
                  <span>إرسال قائمة المعاينة لمبيعات واتساب 💬</span>
                </a>

                <div className="space-y-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-green-600 shrink-0" />
                    <span>حق فتح الكرتونة ومعاينة الجهاز بالكامل قبل دفع أي قرش</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-blue-600 shrink-0" />
                    <span>شحن سريع لجميع محافظات جمهورية مصر العربية</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Wishlist Tab Content */
        wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 text-center max-w-lg mx-auto space-y-4 my-8">
            <div className="w-20 h-20 mx-auto bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
              <Heart size={40} />
            </div>
            <h3 className="text-lg font-black text-gray-900">قائمة المفضلة فارغة</h3>
            <p className="text-xs text-gray-500">
              قم بحفظ الأجهزة التي تعجبك بالضغط على علامة القلب لتصل إليها بسهولة للمعاينة لاحقاً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {wishlist.map((product) => (
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
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-blue-900 bg-blue-50 font-bold px-2 py-0.5 rounded">
                      {product.categoryAr}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      {product.brand}
                    </span>
                  </div>
                  <h4
                    onClick={() => setSelectedProduct(product)}
                    className="text-xs font-bold text-gray-800 hover:text-blue-900 transition cursor-pointer line-clamp-1"
                  >
                    {product.nameAr}
                  </h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1.5 inline-block">
                    متاح للمعاينة
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      addToCart(product, 1);
                      toggleWishlist(product);
                    }}
                    className="flex-1 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <ShoppingCart size={13} />
                    <span>طلب معاينة</span>
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
            ))}
          </div>
        )
      )}
    </div>
  );
};
