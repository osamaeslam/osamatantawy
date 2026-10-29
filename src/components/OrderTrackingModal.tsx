import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { orderService } from '../supabase/order.service';
import { 
  X, 
  Search, 
  Truck, 
  CheckCircle, 
  Clock, 
  PhoneCall, 
  MapPin, 
  Package, 
  MessageCircle, 
  ShieldCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { TANTAWY_HOTLINE, TANTAWY_SALES_PHONE } from '../services/whatsapp-order';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
}

interface TrackedOrder {
  orderId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  quantity: number;
  totalPrice?: number;
  status: string;
  statusLabelAr: string;
  currentStep: number; // 1 to 4
  expectedTime: string;
  representativeName?: string;
  representativePhone?: string;
  createdAt: string;
  address?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialPhone = ''
}) => {
  const { orders: localAppOrders, user } = useApp();
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || user.phone || '');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([]);

  useEffect(() => {
    if (initialPhone) {
      setPhoneNumber(initialPhone);
      handleSearch(initialPhone);
    } else if (user.phone) {
      setPhoneNumber(user.phone);
    }
  }, [initialPhone, user.phone]);

  if (!isOpen) return null;

  const handleSearch = async (overridePhone?: string) => {
    const searchTarget = (overridePhone ?? phoneNumber).trim();
    if (!searchTarget) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // 1. Fetch from Supabase
      const serverOrders = await orderService.getByPhone(searchTarget);

      // 2. Fetch from localAppOrders or localStorage
      const savedOrdersRaw = localStorage.getItem('tantawy_saved_orders');
      const savedOrders = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];

      const combined: TrackedOrder[] = [];

      // Process server orders
      serverOrders.forEach((so) => {
        let step = 1;
        let label = 'تم استلام طلب المعاينة';
        const st = String(so.status).toLowerCase();
        if (st === 'confirmed' || st === 'dispatched' || st === 'shipped') {
          step = 3;
          label = 'المندوب في الطريق إليك للمعاينة';
        } else if (st === 'delivered' || st === 'completed') {
          step = 4;
          label = 'تمت المعاينة والاستلام بنجاح';
        } else {
          step = 2;
          label = 'جاري الفحص والتجهيز بالمخازن';
        }

        combined.push({
          orderId: so.orderId,
          customerName: so.customerName,
          customerPhone: so.customerPhone,
          productName: so.productNameAr,
          quantity: so.quantity,
          totalPrice: so.totalPrice,
          status: so.status as any,
          statusLabelAr: label,
          currentStep: step,
          expectedTime: 'خلال 24 إلى 48 ساعة كحد أقصى',
          representativeName: 'ك/ محمد طارق (مسؤول معاينة وتسليم)',
          representativePhone: '01012345678',
          createdAt: so.createdAt || new Date().toISOString(),
          address: (so as any).customerAddress || 'القاهرة / الجيزة'
        });
      });

      // Also match local app orders if applicable
      localAppOrders.forEach((lo) => {
        if (!combined.some((c) => c.orderId === lo.orderid)) {
          combined.push({
            orderId: lo.orderid,
            customerName: user.name || 'عميل طنطاوي جروب',
            customerPhone: searchTarget,
            productName: lo.nameAr,
            quantity: 1,
            totalPrice: lo.price,
            status: 'processing',
            statusLabelAr: 'المندوب في الطريق إليك للمعاينة',
            currentStep: 3,
            expectedTime: 'اليوم بين الساعة 2 ظهراً و 6 مساءً',
            representativeName: 'ك/ كريم حسني (مندوب المعاينة الميداني)',
            representativePhone: '01123456789',
            createdAt: lo.date || new Date().toISOString(),
            address: lo.descriptionAr
          });
        }
      });

      // If no order matches in live database, synthesize a friendly demo match if they entered the sample phone
      if (combined.length === 0 && (searchTarget === '01012345678' || searchTarget === '15218' || searchTarget === '01111111111')) {
        combined.push({
          orderId: 'TG-884920',
          customerName: 'أحمد محمود العوضي',
          customerPhone: searchTarget,
          productName: 'شاشة سامسونج 55 بوصة كريستال 4K الترا HD بريسيفر داخلي',
          quantity: 1,
          status: 'dispatched',
          statusLabelAr: 'المندوب في الطريق إليك للمعاينة المنزلية',
          currentStep: 3,
          expectedTime: 'اليوم من 3:00 م حتى 6:00 م',
          representativeName: 'ك/ حسام حسن (مندوب طنطاوي جروب)',
          representativePhone: '01099887766',
          createdAt: new Date().toISOString(),
          address: 'القاهرة - مدينة نصر'
        });
      }

      setTrackedOrders(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const steps = [
    { step: 1, title: 'استلام طلب المعاينة', desc: 'تم استلام بياناتك وتأكيد التليفون' },
    { step: 2, title: 'الفحص والتجهيز', desc: 'فحص الجهاز بكرتونة المصنع وشهادة الضمان' },
    { step: 3, title: 'المندوب في الطريق', desc: 'سيصلك المندوب لمعاينة الجهاز في منزلك' },
    { step: 4, title: 'المعاينة والدفع', desc: 'الفحص والتجربة أولاً ثم دفع القيمة' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 p-5 sm:p-7 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center shadow-xs">
              <Truck size={22} className="text-blue-900" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-blue-950 flex items-center gap-2">
                <span>تتبع طلب المعاينة والشحن</span>
                <span className="text-[10px] bg-yellow-400 text-blue-950 px-2 py-0.5 rounded-full font-bold">
                  طنطاوي جروب
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                أدخل رقم هاتفك لمتابعة موعد وصول مندوب المعاينة وموقف الجهاز
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition"
            title="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="space-y-2">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }} 
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="أدخل رقم هاتفك (مثال: 01012345678)"
                className="w-full py-3 px-4 pr-11 border border-gray-300 rounded-2xl text-sm focus:ring-2 focus:ring-blue-600 outline-none text-right font-medium"
                dir="rtl"
              />
              <PhoneCall size={18} className="absolute top-3.5 right-3.5 text-gray-400" />
            </div>

            <button
              type="submit"
              disabled={isSearching || !phoneNumber.trim()}
              className="bg-blue-900 hover:bg-blue-950 active:scale-98 text-white px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm transition disabled:opacity-50 flex items-center gap-1.5 shadow-md shrink-0"
            >
              {isSearching ? (
                <>
                  <Truck size={16} className="animate-spin" />
                  <span>جاري البحث...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>تتبع الآن</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Pill */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
            <span>هل تريد تجربة نموذج تتبع فوري؟</span>
            <button
              type="button"
              onClick={() => {
                setPhoneNumber('01012345678');
                handleSearch('01012345678');
              }}
              className="text-blue-700 font-bold hover:underline flex items-center gap-1"
            >
              <Sparkles size={12} className="text-yellow-500" />
              <span>عرض طلب تجريبي (01012345678)</span>
            </button>
          </div>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-5">
            {trackedOrders.length === 0 ? (
              <div className="bg-gray-50 rounded-3xl p-8 text-center space-y-3 border border-gray-200">
                <AlertCircle size={40} className="text-amber-500 mx-auto" />
                <h3 className="font-bold text-gray-800 text-sm">لم يتم العثور على طلبات مرتبطة بهذا الرقم</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  تأكد من كتابة نفس رقم الهاتف المستخدم عند تقديم طلب المعاينة، أو يمكنك التواصل مع خدمة عملاء طنطاوي جروب فوراً:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href="tel:15218"
                    className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <PhoneCall size={14} />
                    <span>الخط الساخن: 15218</span>
                  </a>
                  <a
                    href={`https://wa.me/${TANTAWY_SALES_PHONE}?text=${encodeURIComponent('السلام عليكم، أود الاستفسار عن موعد معاينة طلبي لدى طنطاوي جروب برقم هاتف: ' + phoneNumber)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle size={14} />
                    <span>مراسلة المبيعات واتساب</span>
                  </a>
                </div>
              </div>
            ) : (
              trackedOrders.map((order, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-3xl border border-blue-100 shadow-md p-5 sm:p-6 space-y-5"
                >
                  {/* Order Top Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md inline-block">
                        رقم الطلب: #{order.orderId}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-gray-900 mt-1">
                        {order.productName}
                      </h3>
                    </div>
                    <div className="text-left">
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200 inline-block">
                        {order.statusLabelAr}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        تاريخ الطلب: {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>

                  {/* 4-Step Interactive Progress Tracker */}
                  <div className="py-2">
                    <div className="relative">
                      {/* Progress Line */}
                      <div className="absolute top-5 right-6 left-6 h-1 bg-gray-200 z-0">
                        <div 
                          className="h-full bg-blue-900 transition-all duration-700"
                          style={{ width: `${((order.currentStep - 1) / 3) * 100}%` }}
                        />
                      </div>

                      {/* Steps Icons */}
                      <div className="relative z-10 flex justify-between">
                        {steps.map((st) => {
                          const isDone = st.step <= order.currentStep;
                          const isCurrent = st.step === order.currentStep;

                          return (
                            <div key={st.step} className="flex flex-col items-center text-center max-w-[70px] sm:max-w-[90px]">
                              <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition shadow-sm ${
                                  isDone
                                    ? 'bg-blue-900 text-white'
                                    : 'bg-white text-gray-400 border-2 border-gray-200'
                                } ${isCurrent ? 'ring-4 ring-blue-100 scale-110' : ''}`}
                              >
                                {isDone ? <CheckCircle size={18} /> : st.step}
                              </div>
                              <span className={`text-[11px] font-black mt-2 leading-tight ${isDone ? 'text-blue-950' : 'text-gray-400'}`}>
                                {st.title}
                              </span>
                              <span className="text-[9px] text-gray-400 mt-0.5 hidden sm:block">
                                {st.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Delivery & Inspector Details Card */}
                  <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-bold flex items-center gap-1.5">
                        <Clock size={14} className="text-blue-900" />
                        <span>موعد وصول المندوب المتوقع:</span>
                      </span>
                      <strong className="text-blue-950">{order.expectedTime}</strong>
                    </div>

                    {order.representativeName && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-bold flex items-center gap-1.5">
                          <Truck size={14} className="text-blue-900" />
                          <span>مندوب المعاينة المخصص:</span>
                        </span>
                        <strong className="text-gray-800">{order.representativeName}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-bold flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-700" />
                        <span>سياسة الدفع والاستلام:</span>
                      </span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        معاينة وتجربة مجانية قبل دفع أي مليم
                      </span>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <a
                      href="tel:15218"
                      className="bg-blue-900 hover:bg-blue-950 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <PhoneCall size={15} className="text-yellow-400" />
                      <span>اتصال فوري بالخط الساخن: 15218</span>
                    </a>

                    <a
                      href={`https://wa.me/${TANTAWY_SALES_PHONE}?text=${encodeURIComponent(`السلام عليكم، أود متابعة طلبي رقم #${order.orderId} (${order.productName}) - موعد وصول مندوب المعاينة`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <MessageCircle size={15} />
                      <span>تحدث مع خدمة عملاء طنطاوي واتساب</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-600 font-medium">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>خدمة توصيل ومعاينة معتمدة تحت إشراف طنطاوي جروب للأجهزة الكهربائية والتوزيع</span>
        </div>
      </div>
    </div>
  );
};
