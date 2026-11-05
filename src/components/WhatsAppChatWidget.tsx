import React, { useState } from 'react';
import { MessageCircle, X, Phone, Package, Truck, Store, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { normalizeWhatsAppNumber, TANTAWY_HOTLINE } from '../services/whatsapp-order';

interface Props {
  /** رقم واتساب المبيعات (اختياري — الافتراضي من إعدادات الموقع) */
  phoneNumber?: string;
}

/**
 * مركز خدمة العملاء (زر عائم).
 *
 * ملاحظة مهمة: النسخة القديمة كانت "دردشة شات" وهمية — العميل يكتب الرسالة
 * فتظهر له "جارٍ معالجة رسالتك..." ومفيش أي رد ولا أي API، مع عنوان
 * "متصل الآن • رد فوري" غير صحيح، وده كان بيوعد العميل بحاجة مش موجودة.
 *
 * النسخة الحالية: أزرار فعلية كلها بتشتغل (واتساب مباشر / تتبّع الطلب /
 * الخط الساخن). البوت الآلي متوقف لحد ما نربط WhatsApp Business API
 * (راجع WHATSAPP_BOT.md).
 */
export const WhatsAppChatWidget: React.FC<Props> = ({ phoneNumber }) => {
  const { whatsappNumber, homePageConfig, setIsOrderTrackingOpen, setActiveTab } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const activeWhatsApp = normalizeWhatsAppNumber(whatsappNumber || phoneNumber || '201521800000');
  const hotline = homePageConfig?.hotline || TANTAWY_HOTLINE;

  const openWhatsApp = (text: string) => {
    window.open(`https://wa.me/${activeWhatsApp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    setIsOpen(false);
  };

  const actions = [
    {
      icon: <Package size={16} />,
      title: 'استفسار عن منتج أو سعر',
      subtitle: 'ابعت اسم الصنف أو كود الصنف (ITM)',
      color: 'bg-emerald-600 hover:bg-emerald-700',
      onClick: () =>
        openWhatsApp(
          'السلام عليكم، عايز أستفسر عن صنف من كتالوج دريم طنطاوي جروب.\nكود الصنف / الاسم: '
        ),
    },
    {
      icon: <Store size={16} />,
      title: 'طلب عرض سعر لكمية (جملة)',
      subtitle: 'حدّد الأصناف والكميات والمحافظة',
      color: 'bg-blue-900 hover:bg-blue-950',
      onClick: () =>
        openWhatsApp(
          'السلام عليكم، عايز عرض سعر جملة.\nالأصناف والكميات:\n1- \n2- \nالمحافظة / منطقة التسليم: '
        ),
    },
    {
      icon: <Truck size={16} />,
      title: 'تتبّع طلبي',
      subtitle: 'برقم الموبايل اللي طلبت بيه',
      color: 'bg-amber-500 hover:bg-amber-600',
      onClick: () => {
        setIsOrderTrackingOpen(true);
        setIsOpen(false);
      },
    },
    {
      icon: <Phone size={16} />,
      title: `اتصل بالخط الساخن ${hotline}`,
      subtitle: 'أسرع حل لو محتاج رد فوري',
      color: 'bg-gray-800 hover:bg-gray-900',
      onClick: () => {
        window.location.href = `tel:${hotline}`;
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="fixed bottom-18 sm:bottom-6 right-3 sm:right-6 z-40">
      {/* زر الفتح العائم */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl transition hover:scale-105 group border-2 border-white/80"
          aria-label="تواصل مع خدمة عملاء دريم طنطاوي جروب"
          title="تواصل مع خدمة العملاء"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
          <MessageCircle size={24} className="sm:w-7 sm:h-7" />
        </button>
      )}

      {/* نافذة خدمة العملاء */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] sm:w-[360px] max-w-[380px] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-l from-emerald-700 to-emerald-600 p-4 text-white flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                <MessageCircle size={22} />
              </div>
              <div>
                <h3 className="font-black text-sm">خدمة عملاء دريم طنطاوي جروب</h3>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5">
                  <Clock size={11} />
                  <span>يومياً من 9 صباحاً حتى 6 مساءً</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 p-1.5 rounded-full hover:bg-emerald-700/60 transition shrink-0"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-3 space-y-2">
            {actions.map((action) => (
              <button
                key={action.title}
                onClick={action.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition text-right"
              >
                <span
                  className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 ${action.color}`}
                >
                  {action.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-black text-gray-900">{action.title}</span>
                  <span className="block text-[11px] text-gray-500 font-bold">{action.subtitle}</span>
                </span>
              </button>
            ))}

            <button
              onClick={() => {
                setActiveTab('categories');
                setIsOpen(false);
              }}
              className="w-full text-center text-[11px] font-bold text-blue-800 hover:underline py-1.5"
            >
              تصفح الكتالوج كامل ←
            </button>
          </div>

          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-500 leading-relaxed text-center">
              للرد الأسرع: ابعت <strong className="text-gray-700">كود الصنف</strong> والكمية في أول رسالة.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

