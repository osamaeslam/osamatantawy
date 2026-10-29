import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  PhoneCall, 
  Award, 
  Truck, 
  CheckCircle,
  Clock,
  Sparkles,
  MapPinOff,
  Headphones,
  User,
} from 'lucide-react';

export const AboutCompanyModal: React.FC = () => {
  const { isAboutModalOpen, setIsAboutModalOpen } = useApp();

  if (!isAboutModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={() => setIsAboutModalOpen(false)}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 md:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsAboutModalOpen(false)}
          className="absolute top-4 left-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition"
        >
          <X size={18} />
        </button>

        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-auto bg-white rounded-2xl p-2 border border-gray-100 shadow-sm">
            <img src="/logo.png" alt="Tantawy Group Logo" className="h-full w-auto object-contain" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-blue-950">
              مجموعة طنطاوي (TANTAWY GROUP)
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
              الصرح الرائد في تجارة وتوزيع الأجهزة المنزلية الكبرى والشاشات والأجهزة الخفيفة
            </p>
          </div>
        </div>

        {/* Company Vision & About */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="text-sm font-black flex items-center gap-2">
            <Award size={18} className="text-yellow-400" />
            <span>رؤيتنا ورسالتنا</span>
          </h3>
          <p className="text-xs text-gray-200 leading-relaxed">
            انطلقت <strong>مجموعة طنطاوي</strong> بهدف تقديم تجربة شراء أجهزة منزلية موثوقة ومريحة لكافة الأسر في جمهورية مصر العربية. نوفر لكم أفضل الماركات العالمية والمحلية في عالم الثلاجات، الغسالات، البوتاجازات، الشاشات الذكية، والأجهزة المنزلية الخفيفة مع خدمة معاينة حرة ودفع موحد عند الاستلام.
          </p>
        </div>

        {/* Golden Guarantees */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span>مميزات وضمانات طنطاوي جروب الذهبية:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold block flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-600" />
                <span>دفع موحد ومعاينة قبل الاستلام</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                لك كامل الحق في فتح الشحنة وفحص الجهاز والتأكد من مطابقة المواصفات قبل دفع أي جنيه للمندوب.
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold block flex items-center gap-1.5">
                <Truck size={15} className="text-blue-600" />
                <span>شحن وتوصيل لكافة محافظات مصر</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                خدمة توصيل سريعة ومباشرة إلى باب بيتك في القاهرة الكبرى، الإسكندرية، الدلتا، القناة، والصعيد.
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold block flex items-center gap-1.5">
                <Award size={15} className="text-amber-500" />
                <span>ضمان الوكيل الرسمي وضمان طنطاوي</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                جميع الأجهزة أصلية 100% ومرفقة بشهادات الضمان المعتمدة والفاتورة الضريبية.
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold block flex items-center gap-1.5">
                <Clock size={15} className="text-red-500" />
                <span>استبدال واسترجاع مضمون</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                إمكانية استبدال أو استرجاع الأجهزة خلال 14 يوماً وفق معايير جهاز حماية المستهلك.
              </p>
            </div>
          </div>
        </div>

        {/* Unified Service Coverage Info */}
        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-blue-950 font-bold">
            <Truck size={17} className="text-blue-700" />
            <span>طلب المعاينة والشحن المباشر لجميع المحافظات:</span>
          </div>
          <p className="text-gray-600 text-[11px] leading-relaxed">
            يتم استقبال كافة طلبات المعاينة والاستفسارات عبر منظومة خدمة العملاء والخط الساخن الموحد <strong>15218</strong>، حيث يتولى فريقنا شحن وتوصيل الصنف المطلوب مباشرة إلى موقعك مع إمكانية الفحص الكامل قبل الدفع.
          </p>
        </div>

        {/* Hotline Bar */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <PhoneCall size={18} />
            </div>
            <div>
              <span className="font-bold text-emerald-950 block">الخط الساخن الموحد لخدمة عملاء طنطاوي جروب:</span>
              <a href="tel:15218" className="text-emerald-700 text-lg font-black tracking-wider hover:underline flex items-center gap-1">
                <span>15218</span>
                <span className="text-xs font-normal text-emerald-600">(اتصال مباشر)</span>
              </a>
            </div>
          </div>
          <span className="text-gray-600 text-[11px] font-medium">متاح يومياً 9:00 ص - 11:00 م</span>
        </div>

        {/* Engineer Saji Osama Section */}
        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5 space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-pink-400 text-white rounded-lg shadow-sm">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-pink-900">المهندسة سجي اسامه</h3>
              <p className="text-xs text-pink-700 font-bold">المسؤولة عن مجموعة طنطاوي</p>
            </div>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">
            المهندسة <strong>سجي اسامه</strong> هي المسؤولة عن إدارة وتطوير مجموعة طنطاوي للأجهزة المنزلية والتجارة بالجملة. تشرف على جودة المنتجات وخدمة العملاء وضمان رضا التجار والعملاء في جميع المحافظات.
          </p>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => setIsAboutModalOpen(false)}
            className="bg-blue-950 hover:bg-black text-white font-bold text-xs py-2.5 px-8 rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
