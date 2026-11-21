import React from 'react';
import { useApp } from '../context/AppContext';
import { PhoneCall, Clock } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { DeveloperBadge } from './DeveloperBadge';
import { STOREFRONT_TEXT } from '../i18n/translations';

export const Footer: React.FC = () => {
  const {
    setActiveTab,
    setSelectedCategory,
    setIsAboutModalOpen,
    setIsUserGuideOpen,
    setIsOrderTrackingOpen,
    language,
  } = useApp();
  const t = STOREFRONT_TEXT[language].footer;
  const th = STOREFRONT_TEXT[language].header;

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
                <span className="text-xl font-black text-white">{t.title}</span>
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  {t.subtitle}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{t.description}</p>
            <div className="space-y-1.5 text-xs">
              <a href="tel:15218" className="flex items-center gap-2 text-yellow-400 font-bold hover:underline">
                <PhoneCall size={14} />
                <span>{t.hotlineFull}</span>
              </a>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={14} />
                <span>{t.hours}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">{t.quickLinks}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setSelectedCategory(null);
                  }}
                  className="hover:text-blue-400 transition text-start"
                >
                  {t.homePage}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('deals')} className="hover:text-blue-400 transition text-start">
                  {t.dealsLink}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('categories')} className="hover:text-blue-400 transition text-start">
                  {t.allCatsLink}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('cart')} className="hover:text-blue-400 transition text-start">
                  {t.cartWishLink}
                </button>
              </li>
              <li>
                <button onClick={() => setIsOrderTrackingOpen(true)} className="hover:text-blue-400 transition text-start">
                  {t.trackLink}
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">{t.popularSectors}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('أجهزة منزلية');
                    setActiveTab('categories');
                  }}
                  className="hover:text-blue-400 transition text-start"
                >
                  {t.majorDesc}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('أجهزة كهربيه');
                    setActiveTab('categories');
                  }}
                  className="hover:text-blue-400 transition text-start"
                >
                  {t.tvDesc}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('أجهزة كهربيه');
                    setActiveTab('categories');
                  }}
                  className="hover:text-blue-400 transition text-start"
                >
                  {t.smallDesc}
                </button>
              </li>
            </ul>
          </div>

          {/* Mobile & Web App Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2">{t.mobileAppTitle}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{t.mobileAppDesc}</p>
            <div className="pt-1">
              <PWAInstallButton />
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setIsUserGuideOpen(true)}
                className="bg-blue-900/80 hover:bg-blue-800 text-yellow-300 font-bold px-3 py-1.5 rounded-xl text-xs transition border border-blue-700/50 flex items-center justify-center gap-1.5"
              >
                <span>{th.guide}</span>
              </button>
              <button
                onClick={() => setIsAboutModalOpen(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold underline text-start"
              >
                {t.aboutLink}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-5 text-xs text-gray-400">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <p>{t.copyright(new Date().getFullYear())}</p>
            <button
              onClick={() => setIsUserGuideOpen(true)}
              className="text-yellow-400 hover:text-yellow-300 text-[11px] font-bold transition cursor-pointer"
              title={th.guideTitle}
            >
              {th.guide}
            </button>
            <span>•</span>
            <button
              onClick={() => {
                window.location.hash = '#admin-cms';
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }}
              className="text-gray-400 hover:text-yellow-300 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
              title={t.adminLink}
            >
              <span>{t.adminLink}</span>
            </button>
          </div>

          <DeveloperBadge variant="dark" />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-emerald-400 font-bold">{t.codInspect}</span>
            <span>•</span>
            <span>{t.nationwide}</span>
            <span>•</span>
            <span>{t.warranty14}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
