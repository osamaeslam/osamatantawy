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
  User,
} from 'lucide-react';
import { DeveloperBadge } from './DeveloperBadge';
import { STOREFRONT_TEXT } from '../i18n/translations';

export const AboutCompanyModal: React.FC = () => {
  const { isAboutModalOpen, setIsAboutModalOpen, language } = useApp();
  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].about;

  if (!isAboutModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={() => setIsAboutModalOpen(false)}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 md:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsAboutModalOpen(false)}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition`}
        >
          <X size={18} />
        </button>

        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-16 w-auto bg-white rounded-2xl p-2 border border-gray-100 shadow-sm">
            <img src="/logo.png" alt="Tantawy Group Logo" className="h-full w-auto object-contain" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-blue-950">{t.title}</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        {/* Company Vision & About */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-5 space-y-3 shadow-sm">
          <h3 className="text-sm font-black flex items-center gap-2">
            <Award size={18} className="text-yellow-400" />
            <span>{t.visionTitle}</span>
          </h3>
          <p className="text-xs text-gray-200 leading-relaxed">
            {isRtl ? (
              <>
                انطلقت <strong>مجموعة طنطاوي</strong> بهدف تقديم تجربة شراء أجهزة منزلية موثوقة ومريحة لكافة الأسر في جمهورية مصر العربية. نوفر لكم أفضل الماركات العالمية والمحلية في عالم الثلاجات، الغسالات، البوتاجازات، الشاشات الذكية، والأجهزة المنزلية الخفيفة مع خدمة معاينة حرة ودفع موحد عند الاستلام.
              </>
            ) : (
              <>
                <strong>Tantawy Group</strong> was founded to provide families and wholesalers across Egypt with a trusted, seamless appliance buying experience. We supply top international & local brands across refrigerators, washers, cookers, Smart TVs, and small kitchen appliances with open inspection before Cash on Delivery.
              </>
            )}
          </p>
        </div>

        {/* Golden Guarantees */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span>{t.guaranteesTitle}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-600" />
                <span>{isRtl ? 'دفع موحد ومعاينة قبل الاستلام' : 'Full Inspection Before Payment'}</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                {isRtl
                  ? 'لك كامل الحق في فتح الشحنة وفحص الجهاز والتأكد من مطابقة المواصفات قبل دفع أي جنيه للمندوب.'
                  : 'Inspect the appliance and confirm specs upon delivery before paying any cash.'}
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold flex items-center gap-1.5">
                <Truck size={15} className="text-blue-600" />
                <span>{isRtl ? 'شحن وتوصيل لكافة محافظات مصر' : 'Nationwide Egypt Delivery'}</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                {isRtl
                  ? 'خدمة توصيل سريعة ومباشرة إلى باب بيتك في القاهرة الكبرى، الإسكندرية، الدلتا، القناة، والصعيد.'
                  : 'Fast doorstep delivery across Cairo, Giza, Alexandria, Delta, Canal, and Upper Egypt.'}
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold flex items-center gap-1.5">
                <Award size={15} className="text-amber-500" />
                <span>{isRtl ? 'ضمان الوكيل الرسمي وضمان طنطاوي' : 'Official Agent & Tantawy Warranty'}</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                {isRtl
                  ? 'جميع الأجهزة أصلية 100% ومرفقة بشهادات الضمان المعتمدة والفاتورة الضريبية.'
                  : '100% genuine sealed appliances accompanied by official warranty cards and tax invoices.'}
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold flex items-center gap-1.5">
                <Clock size={15} className="text-red-500" />
                <span>{isRtl ? 'استبدال واسترجاع مضمون' : '14-Day Guaranteed Exchange'}</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                {isRtl
                  ? 'إمكانية استبدال أو استرجاع الأجهزة خلال 14 يوماً وفق معايير جهاز حماية المستهلك.'
                  : '14-day return and exchange coverage in accordance with consumer protection standards.'}
              </p>
            </div>
          </div>
        </div>

        {/* Unified Service Coverage Info */}
        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-blue-950 font-bold">
            <Truck size={17} className="text-blue-700" />
            <span>
              {isRtl ? 'طلب المعاينة والشحن المباشر لجميع المحافظات:' : 'Direct Inspection & Nationwide Shipping:'}
            </span>
          </div>
          <p className="text-gray-600 text-[11px] leading-relaxed">
            {isRtl ? (
              <>
                يتم استقبال كافة طلبات المعاينة والاستفسارات عبر منظومة خدمة العملاء والخط الساخن الموحد <strong>15218</strong>، حيث يتولى فريقنا شحن وتوصيل الصنف المطلوب مباشرة إلى موقعك مع إمكانية الفحص الكامل قبل الدفع.
              </>
            ) : (
              <>
                All orders and inspection requests are handled via our unified hotline <strong>15218</strong>, shipping directly to your address with full pre-payment verification.
              </>
            )}
          </p>
        </div>

        {/* Hotline Bar */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <PhoneCall size={18} />
            </div>
            <div>
              <span className="font-bold text-emerald-950 block">
                {isRtl ? 'الخط الساخن الموحد لخدمة عملاء طنطاوي جروب:' : 'Tantawy Group Unified Hotline:'}
              </span>
              <a href="tel:15218" className="text-emerald-700 text-lg font-black tracking-wider hover:underline flex items-center gap-1">
                <span>15218</span>
                <span className="text-xs font-normal text-emerald-600">
                  {isRtl ? '(اتصال مباشر)' : '(Direct Call)'}
                </span>
              </a>
            </div>
          </div>
          <span className="text-gray-600 text-[11px] font-medium">
            {isRtl ? 'متاح يومياً 9:00 ص - 11:00 م' : 'Daily 9:00 AM – 11:00 PM'}
          </span>
        </div>

        {/* Leadership Highlight */}
        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-5 space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-pink-400 text-white rounded-lg shadow-sm">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-pink-900">
                {isRtl ? 'المهندسة سجي اسامه' : 'Eng. Saji Osama'}
              </h3>
              <p className="text-xs text-pink-700 font-bold">
                {isRtl ? 'المسؤولة عن مجموعة طنطاوي' : 'Managing Director — Tantawy Group'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">
            {isRtl ? (
              <>
                المهندسة <strong>سجي اسامه</strong> هي المسؤولة عن إدارة وتطوير مجموعة طنطاوي للأجهزة المنزلية والتجارة بالجملة. تشرف على جودة المنتجات وخدمة العملاء وضمان رضا التجار والعملاء في جميع المحافظات.
              </>
            ) : (
              <>
                Eng. <strong>Saji Osama</strong> oversees operations and growth at Tantawy Group for home appliances & wholesale distribution, ensuring top product quality and customer satisfaction nationwide.
              </>
            )}
          </p>
        </div>

        {/* Developer Credit Badge */}
        <div className="flex justify-center pt-1">
          <DeveloperBadge variant="light" />
        </div>

        <div className="text-center pt-1">
          <button
            onClick={() => setIsAboutModalOpen(false)}
            className="bg-blue-950 hover:bg-black text-white font-bold text-xs py-2.5 px-8 rounded-xl transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
