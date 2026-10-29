import React from 'react';
import { useApp } from '../context/AppContext';
import { Image, Package, Building2, Truck, PhoneCall } from 'lucide-react';

const BRANDS = [
  { name: 'دريم', category: 'أدوات منزلية', icon: Package },
  { name: 'توباكو', category: 'أدوات منزلية', icon: Package },
  { name: 'جيجلي', category: 'أدوات منزلية', icon: Package },
  { name: 'الزا', category: 'أدوات منزلية', icon: Package },
  { name: 'كازان', category: 'أدوات منزلية', icon: Package },
  { name: 'لوتس', category: 'أدوات منزلية', icon: Package },
  { name: 'لومنارك', category: 'أدوات منزلية', icon: Package },
  { name: 'بلانك مكس', category: 'أدوات منزلية', icon: Package },
  { name: 'لاينز', category: 'أدوات منزلية', icon: Package },
  { name: 'ماركتو', category: 'أدوات منزلية', icon: Package },
  { name: 'جيميا', category: 'أدوات منزلية', icon: Package },
  { name: 'تسي & جيسي', category: 'أدوات منزلية', icon: Package },
  { name: 'الفا', category: 'أدوات منزلية', icon: Package },
  { name: 'كوكي كوك', category: 'أدوات منزلية', icon: Package },
  { name: 'كسسونك', category: 'أدوات منزلية', icon: Package },
  { name: 'أولالا', category: 'أدوات منزلية', icon: Package },
  { name: 'كازان مستورد', category: 'أدوات منزلية', icon: Package },
  { name: 'دلي سوجا', category: 'أدوات منزلية', icon: Package },
  { name: 'جلاكسي', category: 'أدوات منزلية', icon: Package },
] as const;

export const BrandsGrid: React.FC = () => {
  const { setSelectedBrand } = useApp();

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-right">
        <h2 className="text-xl md:text-2xl font-black text-blue-900 mb-6">
          الماركات المتاحة لدى طنطاوي جروب
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          اختر الماركة لعرض منتجاتها. الأسعار غير معروضة على الموقع لأنها للتجارة بالجملة والاتفاق المباشر.
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
                {brand.name}
              </span>
              <span className="absolute top-1 left-1 bg-gray-200 text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {brand.category}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <PhoneCall size={18} className="text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-blue-800">تواصل مباشرة مع المبيعات</h3>
            <p className="text-xs text-blue-700 mt-1">
              للاستفسار عن أسعار الجملة وطلب منتجات أي مarka من الماركات أعلاه، تواصل معنا عبر:
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