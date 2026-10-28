import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  PhoneCall, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  Heart,
  Users,
  Clock,
  Sparkles
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const Footer: React.FC = () => {
  const { setActiveTab, setSelectedCategory, setIsAboutModalOpen } = useApp();

  return (
    <footer className="bg-slate-950 text-gray-300 pt-12 pb-24 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info with Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-auto bg-white rounded-xl p-1 shadow-sm">
                <img src="/logo.png" alt="Tantawy Group Logo" className="h-full w-auto object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white">طنطاوي جروب</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  TANTAWY GROUP
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              مجموعة طنطاوي التجارية - الصرح الرائد في تجارة وتوزيع الأجهزة المنزلية الكبرى، الشاشات والتلفزيونات، والأجهزة المنزلية الخفيفة بأعلى ضمانات الجودة في مصر.
            </p>
            <div className="space-y-1.5 text-xs">
              <a href="tel:15218" className="flex items-center gap-2 text-yellow-400 font-bold hover:underline">
                <PhoneCall size={14} />
                <span>الخط الساخن الموحد: 15218</span>
              </a>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={14} />
                <span>خدمة العملاء: يومياً من 9 صباحاً حتى 11 مساءً</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">روابط سريعة</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setSelectedCategory(null);
                  }}
                  className="hover:text-blue-400 transition"
                >
                  الصفحة الرئيسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('deals')}
                  className="hover:text-blue-400 transition"
                >
                  عروض وخصومات طنطاوي جروب
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('categories')}
                  className="hover:text-blue-400 transition"
                >
                  جميع الأقسام والتصنيفات
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('cart')}
                  className="hover:text-blue-400 transition"
                >
                  قائمة طلبات المعاينة والمفضلة
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="hover:text-blue-400 transition"
                >
                  تتبع الشحنات والطلبات
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">أقسام طنطاوي جروب</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('Major Appliances');
                    setActiveTab('categories');
                  }}
                  className="hover:text-blue-400 transition"
                >
                  أجهزة منزلية كبرى (ثلاجات، غسالات، بوتاجازات)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('Smart TVs');
                    setActiveTab('categories');
                  }}
                  className="hover:text-blue-400 transition"
                >
                  شاشات وتلفزيونات ذكية 4K
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('Small Appliances');
                    setActiveTab('categories');
                  }}
                  className="hover:text-blue-400 transition"
                >
                  أجهزة منزلية خفيفة (قلايات، محضرات طعام، ميكروويف)
                </button>
              </li>
            </ul>
          </div>

          {/* Mobile & Web App Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">تطبيق الهاتف والويب</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              تطبيق طنطاوي جروب يعمل مباشرة على الموبايل والكمبيوتر (Progressive Web App) مع إمكانية تثبيته بنقرة واحدة بدون متجر تطبيقات.
            </p>
            <div className="pt-1">
              <PWAInstallButton />
            </div>
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold underline block mt-2"
            >
              عن مجموعة طنطاوي وضماناتنا
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} مجموعة طنطاوي (TANTAWY GROUP) - جميع الحقوق محفوظة</p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-bold">دفع موحد عند الاستلام بعد المعاينة</span>
            <span>•</span>
            <span>شحن لجميع المحافظات</span>
            <span>•</span>
            <span>ضمان استبدال خلال 14 يوم</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
