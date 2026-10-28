import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running standalone
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
        <CheckCircle size={13} />
        <span>تطبيق مثبت</span>
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 font-bold transition rounded-full ${
          compact
            ? 'p-2 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white text-xs px-3.5 py-1.5 shadow-xs'
        }`}
        title="تثبيت تطبيق طنطاوي جروب على الهاتف"
      >
        <Download size={compact ? 18 : 14} className="animate-bounce" />
        {!compact && <span>تثبيت التطبيق 📲</span>}
      </button>

      {/* Guide Modal for iOS or manual install */}
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
              <h3 className="text-base font-black text-gray-900">تثبيت تطبيق طنطاوي جروب</h3>
              <p className="text-xs text-gray-500 mt-1">
                يعمل التطبيق مباشرة على هاتفك مثل تطبيقات App Store و Google Play وبدون استهلاك للذاكرة!
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-xs text-right space-y-3 border border-gray-200">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                  <Share size={15} />
                </div>
                <div>
                  <span className="font-bold text-gray-800 block">1. على آيفون (Safari):</span>
                  <span className="text-gray-500 text-[11px]">
                    اضغط على زر المشاركة (Share) في أسفل شاشة المتصفح.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-green-100 text-green-700 rounded-lg shrink-0 mt-0.5">
                  <PlusSquare size={15} />
                </div>
                <div>
                  <span className="font-bold text-gray-800 block">2. إضافة إلى الشاشة الرئيسية:</span>
                  <span className="text-gray-500 text-[11px]">
                    اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                  <Smartphone size={15} />
                </div>
                <div>
                  <span className="font-bold text-gray-800 block">3. على أندرويد (Chrome):</span>
                  <span className="text-gray-500 text-[11px]">
                    اضغط على خيارات المتصفح (⋮) ثم اضغط "تثبيت التطبيق" أو "Install App".
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              فهمت، حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
