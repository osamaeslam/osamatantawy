import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X, Smartphone, Share, PlusSquare, Sparkles, CheckCircle } from 'lucide-react';

export const MobilePWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('tantawy_pwa_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('tantawy_pwa_banner_dismissed', 'true');
  };

  const handleInstall = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  // Hide if already running in standalone mode or dismissed
  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      <aside aria-label="تثبيت تطبيق طنطاوي جروب" className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-3 sm:px-4 py-2.5 shadow-md border-b border-blue-700/50 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 shrink-0 shadow-sm flex items-center justify-center">
              <img src="/logo.png" alt="Tantawy Group Icon" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white truncate">
                  تطبيق طنطاوي جروب
                </span>
                <span className="text-[10px] bg-yellow-400 text-blue-950 font-bold px-1.5 py-0.2 rounded-xs shrink-0">
                  تطبيق رسمي
                </span>
              </div>
              <p className="text-[11px] text-blue-200 truncate">
                ثبّت التطبيق كأيقونة على هاتفك لطلب المعاينة والشحن بدون متجر
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 text-xs font-black px-3 py-1.5 rounded-full transition shadow-xs flex items-center gap-1"
            >
              <Download size={13} className="animate-bounce" />
              <span>تثبيت التطبيق 📲</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-blue-200 hover:text-white rounded-full transition"
              title="إغلاق التنبيه"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Visual Step-by-Step Installation Modal */}
      {showGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowGuide(false)}
        >
          <div 
            className="relative bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 left-4 p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition"
            >
              <X size={16} />
            </button>

            <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-md border border-gray-200 p-2 bg-white">
              <img src="/logo.png" alt="Tantawy Group" className="w-full h-full object-contain" />
            </div>

            <div>
              <h3 className="text-base font-black text-blue-950">
                تثبيت أيقونة طنطاوي جروب على هاتفك
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                ينزل التطبيق مباشرة على شاشة هاتفك مثل أي تطبيق أصلي، سريع وبدون مساحة تخزين!
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-xs text-right space-y-3.5 border border-gray-200">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                      <Share size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">1. على متصفح سفاري (Safari):</span>
                      <span className="text-gray-600 text-[11px]">
                        اضغط على أيقونة المشاركة (Share) في الشريط السفلي.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                      <PlusSquare size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">2. إضافة إلى الصفحة الرئيسية:</span>
                      <span className="text-gray-600 text-[11px]">
                        اسحب للأعلى واختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">3. جاهز كأيقونة تطبيق:</span>
                      <span className="text-gray-600 text-[11px]">
                        ستجد أيقونة طنطاوي جروب نزلت على شاشة موبايلك الرئيسية!
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">1. على متصفح كروم (Google Chrome):</span>
                      <span className="text-gray-600 text-[11px]">
                        اضغط على القائمة العلوية ذات الثلاث نقاط (⋮).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                      <Download size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">2. تثبيت التطبيق:</span>
                      <span className="text-gray-600 text-[11px]">
                        اختر <strong>"تثبيت التطبيق" (Install App)</strong> أو "إضافة إلى الشاشة الرئيسية".
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              تم الفهم، إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
};
