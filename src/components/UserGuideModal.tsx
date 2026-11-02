import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Smartphone,
  ShoppingBag,
  ShieldCheck,
  HelpCircle,
  Download,
  PhoneCall,
  MessageCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { TANTAWY_HOTLINE, TANTAWY_SALES_PHONE } from '../services/whatsapp-order';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const { setIsOrderTrackingOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'pwa' | 'customer' | 'faq'>('pwa');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto font-['Cairo',sans-serif]"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
            title="إغلاق"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-300 text-blue-950 font-black text-xl flex items-center justify-center shadow-lg border-2 border-white/80">
              📖
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-yellow-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-yellow-400/30 mb-1">
                <Sparkles size={12} />
                <span>دليل الاستخدام</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black">دليل استخدام تطبيق طنطاوي جروب</h2>
              <p className="text-xs text-blue-200">كل ما تحتاجه للتسوق والطلب بسهولة</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shrink-0 ${
              activeTab === 'pwa' ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/70'
            }`}
          >
            <Smartphone size={15} />
            <span>تثبيت التطبيق على الموبايل</span>
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shrink-0 ${
              activeTab === 'customer' ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/70'
            }`}
          >
            <ShoppingBag size={15} />
            <span>دليل الطلب</span>
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shrink-0 ${
              activeTab === 'faq' ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/70'
            }`}
          >
            <HelpCircle size={15} />
            <span>أسئلة شائعة</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-right">

          {/* PWA Install */}
          {activeTab === 'pwa' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5">
                <h3 className="text-sm sm:text-base font-black text-blue-950 flex items-center gap-2">
                  <Download size={18} className="text-blue-800" />
                  <span>ثبّت التطبيق على شاشتك الرئيسية</span>
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mt-1">
                  يعمل تطبيق طنطاوي جروب مباشرة من المتصفح، ويمكن تثبيته على هاتفك بنقرة واحدة بدون متجر تطبيقات.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="border border-gray-200 rounded-2xl p-4 space-y-2">
                  <h4 className="font-black text-gray-900">أندرويد (Chrome)</h4>
                  <ol className="list-decimal pr-4 space-y-1 text-gray-600">
                    <li>افتح الموقع من متصفح Chrome.</li>
                    <li>اضغط على زر القائمة (×) أعلى اليمين.</li>
                    <li>اختر «إضافة إلى الشاشة الرئيسية».</li>
                    <li>أكّد التثبيت، وسيظهر التطبيق كأيقونة.</li>
                  </ol>
                </div>
                <div className="border border-gray-200 rounded-2xl p-4 space-y-2">
                  <h4 className="font-black text-gray-900">آيفون (Safari)</h4>
                  <ol className="list-decimal pr-4 space-y-1 text-gray-600">
                    <li>افتح الموقع من متصفح Safari.</li>
                    <li>اضغط على زر المشاركة (مربع بسهم).</li>
                    <li>اختر «إضافة إلى الشاشة الرئيسية».</li>
                    <li>أكّد، وسيظهر التطبيق كأيقونة.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Customer Guide */}
          {activeTab === 'customer' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5">
                <h3 className="text-sm sm:text-base font-black text-emerald-950 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-emerald-700" />
                  <span>اطلب في خطوات بسيطة</span>
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                {[
                  'تصفّح الأقسام أو استخدم البحث الذكي للوصول للمنتج بسرعة.',
                  'اضغط على المنتج لمشاهدة المواصفات والألوان والمقاسات المتاحة.',
                  'أضف المنتج إلى السلة وحدد الكمية.',
                  'أكمل بياناتك (الاسم، الهاتف، العنوان) وأكد الطلب.',
                  'ستتلقى تأكيد طلبك، والدفع عند الاستلام بعد معاينة الشحنة.'
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-blue-900 text-white text-[11px] font-black flex items-center justify-center">{i + 1}</span>
                    <span className="text-gray-700 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { onClose(); setIsOrderTrackingOpen(true); }}
                className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                تتبّع طلبك الآن
              </button>
            </div>
          )}

          {/* FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4 text-xs">
              {[
                { q: 'هل الدفع متاح عند الاستلام؟', a: 'نعم، يمكنك معاينة الشحنة بالكامل قبل الدفع عند الاستلام.' },
                { q: 'هل الشحن متاح لجميع المحافظات؟', a: 'نعم، نقوم بالشحن والتوصيل لجميع المحافظات.' },
                { q: 'هل المنتجات أصلية وبضمان؟', a: 'جميع منتجاتنا أصلية وبضمان الوكيل المعتمد.' },
                { q: 'ما مدة الاستبدال؟', a: 'يمكنك الاستبدال خلال 14 يوماً وفق شروط الضمان.' }
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1.5">
                  <strong className="text-blue-950 font-black flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-blue-700" /> {item.q}
                  </strong>
                  <p className="text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              ))}

              <div className="bg-gradient-to-r from-blue-950 to-indigo-950 text-white rounded-2xl p-5 space-y-3 mt-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-yellow-400" />
                  <h4 className="font-black text-sm">خدمة عملاء طنطاوي جروب</h4>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a href={`tel:${TANTAWY_HOTLINE}`} className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
                    <PhoneCall size={14} />
                    <span>الخط الساخن: {TANTAWY_HOTLINE}</span>
                  </a>
                  <a
                    href={`https://wa.me/${TANTAWY_SALES_PHONE}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <MessageCircle size={14} />
                    <span>تواصل واتساب</span>
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 px-6 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>طنطاوي جروب — تسوّق بثقة</span>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-5 py-2 rounded-xl transition text-xs"
          >
            إغلاق الدليل
          </button>
        </div>

      </div>
    </div>
  );
};
