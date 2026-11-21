import React from 'react';
import { useApp } from '../context/AppContext';
import { Package, PhoneCall } from 'lucide-react';
import { STOREFRONT_TEXT } from '../i18n/translations';

const BRANDS = [
  { name: 'دريم', nameEn: 'Dream', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'توباكو', nameEn: 'Tobacco', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'جيجلي', nameEn: 'Jiggly', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'الزا', nameEn: 'Elza', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'كازان', nameEn: 'Kazan', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'لوتس', nameEn: 'Lotus', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'لومنارك', nameEn: 'Luminarc', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'بلانك مكس', nameEn: 'Blanc Mix', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'لاينز', nameEn: 'Lines', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'ماركتو', nameEn: 'Marcato', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'جيميا', nameEn: 'Gemia', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'تسي & جيسي', nameEn: 'Tesi & Jessy', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'الفا', nameEn: 'Alfa', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'كوكي كوك', nameEn: 'Cooky Cook', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'كسسونك', nameEn: 'Xsonic', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'أولالا', nameEn: 'Ohlala', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'كازان مستورد', nameEn: 'Kazan Imported', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'دلي سوجا', nameEn: 'Deli Soga', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
  { name: 'جلاكسي', nameEn: 'Galaxy', categoryAr: 'أدوات منزلية', categoryEn: 'Houseware', icon: Package },
] as const;

export const BrandsGrid: React.FC = () => {
  const { setSelectedBrand, language } = useApp();
  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].brands;

  return (
    <div className="space-y-6 pb-8">
      <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 ${isRtl ? 'text-right' : 'text-left'}`}>
        <h2 className="text-xl md:text-2xl font-black text-blue-900 mb-6">
          {t.title}
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          {t.subtitle}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {BRANDS.map((brand) => (
            <button
              key={brand.name}
              onClick={() => setSelectedBrand(brand.name)}
              className="group relative aspect-square bg-white rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:shadow-lg transition-all flex flex-col items-center justify-center p-3 cursor-pointer"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
                <brand.icon size={24} className="text-blue-600 group-hover:text-blue-800" />
              </div>
              <span className="text-xs font-bold text-gray-800 leading-tight text-center group-hover:text-blue-600">
                {isRtl ? brand.name : brand.nameEn}
              </span>
              <span className={`absolute top-1 ${isRtl ? 'left-1' : 'right-1'} bg-gray-200 text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity`}>
                {isRtl ? brand.categoryAr : brand.categoryEn}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <PhoneCall size={18} className="text-yellow-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-blue-800">{t.salesContactTitle}</h3>
            <p className="text-xs text-blue-700 mt-1">
              {t.salesContactDesc}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <a href="tel:15218" className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-bold px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1">
              <PhoneCall size={14} /> 15218
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};