import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  X,
  Download,
  Copy,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  PhoneCall,
  Barcode,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import type { Product } from '../types';
import { normalizeImageUrl } from '../services/image-url';
import { TANTAWY_HOTLINE } from '../services/whatsapp-order';

interface SocialPosterModalProps {
  product: Product | null;
  onClose: () => void;
  hotline?: string;
}

type PosterTheme = 'navy_gold' | 'clean_catalog';
type PosterFormat = 'square' | 'portrait';

export const SocialPosterModal: React.FC<SocialPosterModalProps> = ({
  product,
  onClose,
  hotline = TANTAWY_HOTLINE,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<PosterTheme>('navy_gold');
  const [format, setFormat] = useState<PosterFormat>('square');
  const [showCode, setShowCode] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  if (!product) return null;

  const codeLabel = product.unifiedCode || product.itemNumber || '';
  const safeImg = normalizeImageUrl(product.previewimage || product.imageLink || '', undefined, 1000);

  const specsList = [
    product.brand ? `الماركة: ${product.brand}` : null,
    product.sector || product.categoryAr ? `القسم: ${product.sector || product.categoryAr}` : null,
    product.size ? `المقاس / السعة: ${product.size}` : null,
    product.color ? `الألوان: ${product.color}` : null,
  ].filter(Boolean) as string[];

  const socialCaption = [
    `✨ ${product.nameAr}`,
    product.brand ? `🏷️ الماركة: ${product.brand}` : '',
    codeLabel ? `🔢 كود الصنف: ${codeLabel}` : '',
    product.size ? `📐 المواصفة: ${product.size}` : '',
    product.summaryAr ? `📋 ${product.summaryAr}` : '',
    '',
    '🛡️ ضمان الوكيل المعتمد وضمان دريم طنطاوي جروب',
    '🚚 توصيل لجميع المحافظات · معاينة وفحص كامل قبل الدفع',
    `💬 للاستفسار عن السعر والحجز تواصل معنا على الخاص أو اتصل بالخط الساخن: ${hotline}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  const handleDownloadPoster = async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    setDownloaded(false);
    try {
      await new Promise((r) => setTimeout(r, 80));
      const canvas = await html2canvas(posterRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: theme === 'navy_gold' ? '#0f172a' : '#f8fafc',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const cleanName = (codeLabel || product.nameAr || 'product')
        .replace(/[^\u0600-\u06FFa-zA-Z0-9_-]+/g, '_')
        .slice(0, 40);
      link.download = `بوستر_طنطاوي_${cleanName}.png`;
      link.href = dataUrl;
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3500);
    } catch {
      // Fallback: if external CDN blocks CORS pixel readback, re-render without tainted img
      setImageLoadFailed(true);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(socialCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {}
  };

  const isDark = theme === 'navy_gold';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-gray-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">
                مُولّد بوستر المنتج للسوشيال ميديا
              </h3>
              <p className="text-[11px] text-slate-300">
                صورة جاهزة للنشر على فيسبوك وواتساب بالكود والمواصفات بدون كتابة سعر
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 block">تصميم البوستر:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('navy_gold')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    theme === 'navy_gold'
                      ? 'bg-slate-900 text-amber-300 border-slate-900'
                      : 'bg-gray-50 text-slate-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  كحلي ملكي وذهبي
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('clean_catalog')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    theme === 'clean_catalog'
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-gray-50 text-slate-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  أبيض عصري للكتالوج
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 block">المقاس (المنصة):</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('square')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    format === 'square'
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-gray-50 text-slate-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Layers size={14} />
                  <span>مربع (1:1) فيسبوك</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('portrait')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    format === 'portrait'
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-gray-50 text-slate-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Layers size={14} />
                  <span>طولي (4:5) بوست/ستوري</span>
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none bg-gray-50 p-3 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                checked={showCode}
                onChange={(e) => setShowCode(e.target.checked)}
                className="rounded accent-blue-900"
              />
              <span>إظهار الكود الموحد / رقم الصنف داخل البوستر</span>
            </label>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadPoster}
                className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-sm font-black transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
              >
                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                <span>{downloading ? 'جارٍ تجهيز البوستر...' : 'تحميل البوستر كصورة PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCaption}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
              >
                <Copy size={14} />
                <span>{copiedCaption ? 'تم نسخ نص المنشور جاهزاً ✅' : 'نسخ نص المنشور للفيسبوك / واتساب'}</span>
              </button>

              {downloaded && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-2.5 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>تم حفظ صورة البوستر بنجاح على جهازك.</span>
                </div>
              )}
            </div>

            {/* Caption Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
              <span className="text-[11px] font-black text-slate-700 block">نص المنشور المرفق (بدون سعر):</span>
              <pre className="text-[11px] text-slate-700 font-['Cairo',sans-serif] whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {socialCaption}
              </pre>
            </div>
          </div>

          {/* Live Capture Preview Canvas */}
          <div className="lg:col-span-7 flex justify-center bg-gray-100 rounded-2xl p-4 border border-gray-200">
            <div
              ref={posterRef}
              className={`w-full max-w-[440px] ${
                format === 'portrait' ? 'min-h-[540px]' : 'min-h-[440px]'
              } rounded-2xl overflow-hidden flex flex-col justify-between p-5 border ${
                isDark
                  ? 'bg-slate-950 text-white border-amber-400/40'
                  : 'bg-white text-slate-900 border-blue-900/20'
              }`}
            >
              {/* Poster Top Brand Header */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-current/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shrink-0">
                    <img
                      src="/logo.png"
                      alt="طنطاوي جروب"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-black leading-tight">
                      دريم طنطاوي جروب
                    </div>
                    <div className={`text-[10px] font-bold ${isDark ? 'text-amber-300' : 'text-blue-800'}`}>
                      أجهزة منزلية وكهربية معتمدة
                    </div>
                  </div>
                </div>

                {showCode && codeLabel && (
                  <div
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-black flex items-center gap-1 ${
                      isDark
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-blue-950 text-white'
                    }`}
                  >
                    <Barcode size={13} />
                    <span>{codeLabel}</span>
                  </div>
                )}
              </div>

              {/* Poster Product Visual Frame */}
              <div
                className={`my-3 rounded-2xl p-4 flex items-center justify-center flex-1 min-h-[210px] ${
                  isDark ? 'bg-white' : 'bg-slate-50 border border-slate-200'
                }`}
              >
                {!imageLoadFailed && safeImg ? (
                  <img
                    src={safeImg}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={() => setImageLoadFailed(true)}
                    alt={product.nameAr}
                    className="max-h-52 w-auto object-contain"
                  />
                ) : (
                  <div className="text-center space-y-1 text-slate-500">
                    <ImageIcon size={36} className="mx-auto text-slate-300" />
                    <span className="text-xs font-bold block text-slate-700">{product.nameAr}</span>
                  </div>
                )}
              </div>

              {/* Product Title & Specs */}
              <div className="space-y-2">
                <h4 className="text-base sm:text-lg font-black leading-snug">
                  {product.nameAr}
                </h4>

                {specsList.length > 0 && (
                  <div
                    className={`text-[11px] font-bold flex flex-wrap items-center gap-x-2 gap-y-1 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {specsList.map((sp, i) => (
                      <React.Fragment key={sp}>
                        {i > 0 && <span aria-hidden="true">·</span>}
                        <span>{sp}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {product.summaryAr && (
                  <p
                    className={`text-[11px] leading-relaxed line-clamp-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {product.summaryAr}
                  </p>
                )}
              </div>

              {/* Footer CTA Band (Zero Public Price + Hotline 15218) */}
              <div
                className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div className="space-y-0.5 text-[10px] font-bold">
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={13} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
                    <span>ضمان الوكيل · دفع عند الاستلام بعد الفحص</span>
                  </div>
                  <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                    للاستفسار عن السعر والحجز الفوري تواصل معنا
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 ${
                    isDark ? 'bg-amber-400 text-slate-950' : 'bg-blue-950 text-white'
                  }`}
                >
                  <PhoneCall size={14} />
                  <span className="font-mono text-sm font-black tabular-nums">{hotline}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
