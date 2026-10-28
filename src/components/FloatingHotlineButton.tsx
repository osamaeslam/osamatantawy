import React from 'react';
import { PhoneCall } from 'lucide-react';

export const FloatingHotlineButton: React.FC = () => {
  return (
    <aside aria-label="الخط الساخن" className="fixed bottom-16 sm:bottom-6 left-4 z-40 flex items-center">
      <a
        href="tel:15218"
        aria-label="الاتصال بالخط الساخن 15218"
        className="group flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white pl-3.5 pr-2.5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-white/80"
        title="اتصل الآن بالخط الساخن 15218"
      >
        <div className="relative">
          <PhoneCall size={18} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
        </div>
        <div className="flex flex-col text-right leading-tight">
          <span className="text-[10px] text-emerald-100 font-medium">الخط الساخن</span>
          <span className="text-xs font-black tracking-wider text-yellow-300">15218</span>
        </div>
      </a>
    </aside>
  );
};
