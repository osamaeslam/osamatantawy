import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ShieldCheck, 
  Building2, 
  PhoneCall, 
  MapPin, 
  Award, 
  Truck, 
  CheckCircle,
  Clock
} from 'lucide-react';

export const AboutCompanyModal: React.FC = () => {
  const { isAboutModalOpen, setIsAboutModalOpen } = useApp();

  if (!isAboutModalOpen) return null;

  const branches = [
    { city: 'القاهرة', address: 'مدينة نصر - شارع عباس العقاد الرئيسي', phone: '02-24019980' },
    { city: 'الجيزة', address: 'شارع الهرم - أمام محطة المترو', phone: '02-35819980' },
    { city: 'الإسكندرية', address: 'سموحة - ميدان فيكتور عمانويل', phone: '03-42019980' },
    { city: 'الدلتا - طنطا', address: 'شارع البحر الرئيسي - تقاطع النحاس', phone: '040-33019980' }
  ];

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
              عن مجموعة طنطاوي (TANTAWY GROUP)
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
              الريادة في تجارة وتوزيع الأجهزة المنزلية والكهربائية
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
            انطلقت <strong>مجموعة طنطاوي</strong> بهدف تقديم تجربة تسوق منزلية استثنائية لكافة الأسر المصرية. نلتزم بتوفير أفضل الماركات العالمية والمحلية في عالم الأجهزة الكهربائية، مستلزمات المطبخ، وأفخم المفروشات، بأسعار تنافسية وخدمة عملاء فائقة وضمان رسمي معتمد.
          </p>
        </div>

        {/* Golden Guarantees */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span>مميزات وضمانات طنطاوي جروب الذهبية:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold block flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-600" />
                <span>دفع موحد ومعاينة قبل الاستلام</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                لك كامل الحق في فتح الشحنة وفحص المنتج بالكامل قبل دفع أي جنيه للمندوب.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold block flex items-center gap-1.5">
                <Truck size={15} className="text-blue-600" />
                <span>شحن سريع لكافة محافظات مصر</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                أسطول سيارات توصيل خاص يصلك أينما كنت خلال 24 - 48 ساعة فقط.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold block flex items-center gap-1.5">
                <Award size={15} className="text-amber-500" />
                <span>ضمان الوكيل الرسمي وضمان طنطاوي</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                جميع المنتجات أصلية 100% ومرفقة بشهادات الضمان المعتمدة.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
              <strong className="text-blue-950 font-bold block flex items-center gap-1.5">
                <Clock size={15} className="text-red-500" />
                <span>استرجاع واستبدال مجاني</span>
              </strong>
              <p className="text-gray-500 text-[11px]">
                إمكانية استبدال أو استرجاع المنتجات خلال 14 يوماً وفق الشروط القانونية.
              </p>
            </div>
          </div>
        </div>

        {/* Branches */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Building2 size={18} className="text-blue-700" />
            <span>فروع ومعارض طنطاوي جروب:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {branches.map((b) => (
              <div key={b.city} className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-1">
                <span className="font-black text-blue-900 block flex items-center gap-1">
                  <MapPin size={13} className="text-red-500" />
                  <span>فرع {b.city}</span>
                </span>
                <p className="text-gray-600 text-[11px]">{b.address}</p>
                <span className="text-[10px] text-gray-500 font-mono block">هاتف: {b.phone}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hotline */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <PhoneCall size={18} />
            </div>
            <div>
              <span className="font-bold text-emerald-950 block">الخط الساخن الموحد لخدمة العملاء:</span>
              <span className="text-emerald-700 text-base font-black tracking-wider">19980</span>
            </div>
          </div>
          <span className="text-gray-500 text-[11px]">متاح يومياً 9:00 ص - 11:00 م</span>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => setIsAboutModalOpen(false)}
            className="bg-blue-950 hover:bg-black text-white font-bold text-xs py-2.5 px-8 rounded-xl transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
