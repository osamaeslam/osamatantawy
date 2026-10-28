import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  CheckCircle, 
  Truck, 
  ShieldCheck, 
  ShoppingBag,
  PhoneCall,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { OrderItem } from '../types';

export const CheckoutModal: React.FC = () => {
  const { 
    isCheckoutModalOpen, 
    setIsCheckoutModalOpen, 
    cart, 
    cartTotal, 
    user, 
    createOrder,
    setActiveTab 
  } = useApp();

  const [shippingAddress, setShippingAddress] = useState(user.address);
  const [phone, setPhone] = useState(user.phone);
  const [city, setCity] = useState(user.city);
  const [notes, setNotes] = useState('');
  const [completedOrder, setCompletedOrder] = useState<OrderItem | null>(null);

  if (!isCheckoutModalOpen) return null;


  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const order = createOrder(
      `${city} - ${shippingAddress} (هاتف: ${phone}${notes ? ` - ملاحظات: ${notes}` : ''})`, 
      'دفع موحد عند الاستلام - طنطاوي جروب (مع حق المعاينة)'
    );
    if (order) {
      setCompletedOrder(order);
    }
  };

  const handleFinish = () => {
    setCompletedOrder(null);
    setIsCheckoutModalOpen(false);
    setActiveTab('profile');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={() => {
        if (!completedOrder) setIsCheckoutModalOpen(false);
      }}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {!completedOrder && (
          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="absolute top-4 left-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition"
          >
            <X size={18} />
          </button>
        )}

        {completedOrder ? (
          /* Order Confirmed Screen */
          <div className="text-center py-6 space-y-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle size={48} />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                تم تسجيل طلبك في طنطاوي جروب بنجاح!
              </span>
              <h3 className="text-xl font-black text-gray-900 pt-2">
                شكراً لثقتكم في طنطاوي جروب (TANTAWY GROUP)
              </h3>
              <p className="text-xs text-gray-500">
                رقم بوليصة الشحن: <strong className="font-mono text-blue-900 text-sm">{completedOrder.orderid}</strong>
              </p>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-2xl text-xs text-right space-y-2 border border-blue-100">
              <div className="flex justify-between">
                <span className="text-gray-500">طريقة الدفع الموحدة:</span>
                <span className="font-bold text-blue-900">دفع موحد عند الاستلام بعد المعاينة التامة</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">رسوم حجز المعاينة:</span>
                <span className="font-black text-emerald-700 text-sm">مجانية بالكامل (0 ج.م)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">موعد التسليم المتوقع:</span>
                <span className="text-emerald-700 font-bold">خلال 24 إلى 48 ساعة</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl text-center text-[11px] text-gray-600">
              📞 سيقوم أحد ممثلي خدمة عملاء <strong>طنطاوي جروب (15218)</strong> بالتواصل معك لتأكيد الموعد والتفاصيل.
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 rounded-xl transition text-xs shadow-md"
            >
              عرض تفاصيل الطلب في حسابي
            </button>
          </div>
        ) : (
          /* Checkout Form with Unified Payment */
          <form onSubmit={handleConfirmOrder} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 border border-gray-200 shrink-0 shadow-xs">
                <img src="/logo.png" alt="Tantawy Group Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">حجز طلب المعاينة - طنطاوي جروب</h3>
                <p className="text-xs text-gray-500">طلبك محمي بضمان طنطاوي جروب المعتمد</p>
              </div>
            </div>

            {/* Address fields */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">المدينة والمحافظة:</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-blue-700"
                  placeholder="مثال: القاهرة، الجيزة، الإسكندرية..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">العنوان بالتفصيل:</label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-blue-700"
                  placeholder="الشارع، رقم العمارة، رقم الشقة أو علامة مميزة"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">رقم الهاتف للتواصل وتأكيد المعاينة والشحن:</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-blue-700"
                  placeholder="+20 100 000 0000"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">ملاحظات إضافية للتوصيل (اختياري):</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-blue-700"
                  placeholder="ميعاد مفضل للمعاينة، أو تعليمات خاصة لمندوب التوصيل"
                />
              </div>
            </div>

            {/* Unified Payment Option (طنطاوي جروب الموحدة) */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>طريقة الدفع الموحدة: طنطاوي جروب</span>
                </span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                  خيار آمن 100%
                </span>
              </div>
              <p className="text-[11px] text-gray-200 leading-relaxed">
                تم توحيد الدفع ليكون <strong>نقداً عند الاستلام (كاش)</strong> مع إتاحة <strong>حق فتح الشحنة ومعاينتها بالكامل</strong> قبل سداد أي مبالغ للمندوب لضمان أعلى مستويات الأمان ورضا العملاء.
              </p>
            </div>

            {/* Total and Submit */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-500 block">رسوم حجز المعاينة:</span>
                <span className="text-base font-black text-emerald-700">
                  مجانية بالكامل (0 ج.م)
                </span>
              </div>

              <button
                type="submit"
                className="bg-blue-900 hover:bg-blue-950 active:scale-95 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md flex items-center gap-2"
              >
                <span>تأكيد حجز المعاينة</span>
                <Truck size={16} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
