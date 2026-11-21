import React from 'react';
import { HelpCircle, ChevronDown, MessageCircle, Truck, ShieldCheck, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STOREFRONT_TEXT } from '../i18n/translations';

const FAQ_ICONS = [
  <Wallet key="w1" size={16} />,
  <ShieldCheck key="s1" size={16} />,
  <Truck key="t1" size={16} />,
  <Wallet key="w2" size={16} />,
  <MessageCircle key="m1" size={16} />,
  <ShieldCheck key="s2" size={16} />,
];

export const FAQSection: React.FC = () => {
  const { language } = useApp();
  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].faq;

  return (
    <section id="faq" className="mt-10 scroll-mt-24">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-l from-blue-950 to-blue-900 text-white flex items-center gap-2.5">
          <HelpCircle size={20} className="text-yellow-400" />
          <div>
            <h2 className="text-base sm:text-lg font-black">{t.title}</h2>
            <p className="text-[11px] text-blue-200">{t.subtitle}</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {t.items.map((item, idx) => (
            <details key={item.q} className="group px-5 sm:px-6 py-3.5 open:bg-blue-50/40 transition">
              <summary className={`flex items-center gap-2.5 cursor-pointer list-none ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  {FAQ_ICONS[idx % FAQ_ICONS.length]}
                </span>
                <span className="flex-1 text-[13px] sm:text-sm font-black text-gray-900">{item.q}</span>
                <ChevronDown
                  size={16}
                  className="text-gray-400 group-open:rotate-180 transition shrink-0"
                />
              </summary>
              <p className={`mt-2 ${isRtl ? 'pr-9' : 'pl-9'} text-xs sm:text-[13px] text-gray-600 leading-relaxed font-medium`}>
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="px-5 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500 font-bold">
            {t.footerNote}
          </p>
        </div>
      </div>
    </section>
  );
};
