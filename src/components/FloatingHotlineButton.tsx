import React from 'react';
import { PhoneCall } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STOREFRONT_TEXT } from '../i18n/translations';

export const FloatingHotlineButton: React.FC = () => {
  const { language } = useApp();
  const t = STOREFRONT_TEXT[language].hotline;
  const isRtl = language === 'ar';

  return (
    <aside aria-label={t.label} className="fixed bottom-18 sm:bottom-6 left-3 sm:left-6 z-40 flex items-center">
      <a
        href="tel:15218"
        aria-label={t.title}
        className="group flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white px-3 py-2 sm:py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-white/80"
        title={t.title}
      >
        <div className="relative">
          <PhoneCall size={18} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
        </div>
        <div className={`flex flex-col leading-tight ${isRtl ? 'text-right' : 'text-left'}`}>
          <span className="text-[10px] text-emerald-100 font-medium">{t.label}</span>
          <span className="text-xs font-black tracking-wider text-yellow-300">15218</span>
        </div>
      </a>
    </aside>
  );
};
