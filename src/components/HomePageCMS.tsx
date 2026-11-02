import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HeroBanner, HomePageConfig } from '../types';
import { INITIAL_HOMEPAGE_CONFIG } from '../data/mockData';
import { 
  Palette, 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  RotateCcw, 
  Image as ImageIcon, 
  Megaphone, 
  PhoneCall, 
  ExternalLink,
  Eye,
  MessageCircle,
  Smartphone,
  Send
} from 'lucide-react';
import { normalizeWhatsAppNumber } from '../services/whatsapp-order';
import { normalizeImageUrl } from '../services/image-url';

export const HomePageCMS: React.FC = () => {
  const { homePageConfig, updateHomePageConfig } = useApp();

  const [announcementText, setAnnouncementText] = useState(homePageConfig.announcementText);
  const [hotline, setHotline] = useState(homePageConfig.hotline);
  const [whatsappNumber, setWhatsappNumber] = useState(homePageConfig.whatsappNumber || '201521800000');
  const [banners, setBanners] = useState<HeroBanner[]>(homePageConfig.heroBanners || []);
  const [selectedBannerIndex, setSelectedBannerIndex] = useState(0);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if context changes
  React.useEffect(() => {
    setAnnouncementText(homePageConfig.announcementText);
    setHotline(homePageConfig.hotline);
    setWhatsappNumber(homePageConfig.whatsappNumber || '201521800000');
    setBanners(homePageConfig.heroBanners || []);
  }, [homePageConfig]);

  const activeBanner = banners[selectedBannerIndex] || banners[0];

  const updateActiveBanner = (field: keyof HeroBanner, value: any) => {
    if (!banners[selectedBannerIndex]) return;
    const updated = [...banners];
    updated[selectedBannerIndex] = {
      ...updated[selectedBannerIndex],
      [field]: value
    };
    setBanners(updated);
  };

  const handleAddBanner = () => {
    const newBanner: HeroBanner = {
      id: Date.now(),
      title: 'عنوان البنر الترويجي الجديد',
      subtitle: 'اكتب هنا تفاصيل العرض أو مميزات المنتجات المشمولة في هذا البنر',
      badge: 'عرض جديد',
      buttonText: 'تصفح الأصناف',
      category: 'أجهزة منزلية',
      bgGradient: 'from-blue-950 via-blue-900 to-indigo-900',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1600&auto=format&fit=crop&q=80',
      linkCategory: 'أجهزة منزلية'
    };
    const updated = [...banners, newBanner];
    setBanners(updated);
    setSelectedBannerIndex(updated.length - 1);
  };

  const handleDeleteBanner = (index: number) => {
    if (banners.length <= 1) {
      alert('يجب الإبقاء على بنر واحد على الأقل في الصفحة الرئيسية');
      return;
    }
    const updated = banners.filter((_, i) => i !== index);
    setBanners(updated);
    setSelectedBannerIndex(Math.max(0, index - 1));
  };

  const handleMoveBanner = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBanners(updated);
    setSelectedBannerIndex(targetIndex);
  };

  const handleSaveAll = () => {
    const cleanNumber = normalizeWhatsAppNumber(whatsappNumber);
    const newConfig: HomePageConfig = {
      announcementText,
      hotline,
      whatsappNumber: cleanNumber,
      heroBanners: banners
    };
    updateHomePageConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleResetToDefault = () => {
    if (confirm('هل تريد استعادة إعدادات وبنرات الصفحة الرئيسية الافتراضية؟')) {
      updateHomePageConfig(INITIAL_HOMEPAGE_CONFIG);
      setAnnouncementText(INITIAL_HOMEPAGE_CONFIG.announcementText);
      setHotline(INITIAL_HOMEPAGE_CONFIG.hotline);
      setWhatsappNumber(INITIAL_HOMEPAGE_CONFIG.whatsappNumber || '201521800000');
      setBanners(INITIAL_HOMEPAGE_CONFIG.heroBanners);
      setSelectedBannerIndex(0);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Palette className="text-blue-700" size={22} />
            <span>إدارة وتخصيص محتوى الصفحة الرئيسية (CMS)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            تحكم كامل في النصوص، بنرات السلايدر، الصور، وروابط الأقسام بدون الاعتماد على أي مطور.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefault}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
          >
            <RotateCcw size={14} />
            <span>استعادة الافتراضي</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="bg-blue-900 hover:bg-blue-950 active:scale-95 text-white font-black text-xs px-6 py-2.5 rounded-xl transition shadow-md flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>حفظ ونشر التعديلات فوراً 🚀</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>تم حفظ التعديلات بنجاح! تم تحديث الصفحة الرئيسية الآن مباشرة لجميع الزوار.</span>
        </div>
      )}

      {/* Section 1: Announcement Bar & Hotline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
          <Megaphone className="text-amber-500" size={18} />
          <span>شريط الإعلانات العلوي والخط الساخن</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              نص شريط الإعلانات العلوي المتحرك:
            </label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="مثال: طنطاوي جروب للأجهزة المنزلية والكهربية • دفع عند الاستلام بعد المعاينة"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              رقم الخط الساخن (Hotline):
            </label>
            <div className="relative">
              <input
                type="text"
                value={hotline}
                onChange={(e) => setHotline(e.target.value)}
                placeholder="15218"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold text-left"
                dir="ltr"
              />
              <PhoneCall size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Dedicated WhatsApp Order Phone Number */}
      <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3">
          <div>
            <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
              <MessageCircle className="text-emerald-600 fill-emerald-100" size={20} />
              <span>رقم واتساب المبيعات وتلقي طلبات المعاينة 📱</span>
            </h4>
            <p className="text-xs text-emerald-800 mt-1">
              الرقم الذي يستقبل رسائل وتفاصيل طلبات العملاء فور الضغط على "طلب عبر واتساب" أو إرسال سلة المعاينة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${normalizeWhatsAppNumber(whatsappNumber)}?text=${encodeURIComponent('السلام عليكم فريق مبيعات طنطاوي جروب، هذه رسالة تجريبية لاختبار استلام طلبات المعاينة من لوحة الإدارة.')}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-sm"
              title="فتح واتساب وإرسال رسالة تجريبية للتأكد من صحة الرقم"
            >
              <Send size={14} />
              <span>تجربة إرسال رسالة للرقم الآن 📲</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-emerald-950">
              أدخل رقم هاتف الواتساب (مصري أو دولي):
            </label>
            <div className="relative">
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="مثال: 01012345678 أو 01521800000 أو 201..."
                className="w-full bg-white border-2 border-emerald-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-black text-left"
                dir="ltr"
              />
              <Smartphone size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">
              * يدعم كتابة الرقم العادي (مثل 010 أو 011 أو 012 أو 015) ويقوم النظام بتحويله تلقائياً للصيغة الدولية الرسمية.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-200 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[11px] font-bold text-gray-500 block mb-1">الرابط المعتمد النهائي في أزرار الموقع:</span>
              <div className="flex items-center gap-2 font-mono text-xs font-black text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span>wa.me/{normalizeWhatsAppNumber(whatsappNumber)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>يتم تحويل أي ضغطة طلب في المتجر إلى هذا الرقم لحظياً عند الحفظ.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Hero Banners Manager */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="text-blue-700" size={18} />
              <span>بنرات السلايدر الرئيسي (Hero Banners)</span>
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              حدد الصور والعناوين والأزرار التي تظهر في الواجهة الرئيسية.
            </p>
          </div>

          <button
            onClick={handleAddBanner}
            className="bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 self-start"
          >
            <Plus size={15} />
            <span>إضافة بنر جديد</span>
          </button>
        </div>

        {/* Banner Pills / Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {banners.map((b, idx) => (
            <div
              key={b.id || idx}
              onClick={() => setSelectedBannerIndex(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 border ${
                selectedBannerIndex === idx
                  ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>بنر {idx + 1}: {b.badge || b.title.slice(0, 15)}</span>
              <div className="flex items-center gap-0.5 mr-1" onClick={(e) => e.stopPropagation()}>
                {idx > 0 && (
                  <button
                    onClick={() => handleMoveBanner(idx, 'up')}
                    className="p-1 hover:bg-white/20 rounded-sm"
                    title="تحريك للأمام"
                  >
                    <ArrowUp size={12} />
                  </button>
                )}
                {idx < banners.length - 1 && (
                  <button
                    onClick={() => handleMoveBanner(idx, 'down')}
                    className="p-1 hover:bg-white/20 rounded-sm"
                    title="تحريك للخلف"
                  >
                    <ArrowDown size={12} />
                  </button>
                )}
                {banners.length > 1 && (
                  <button
                    onClick={() => handleDeleteBanner(idx)}
                    className="p-1 hover:bg-red-500 hover:text-white rounded-sm text-red-400"
                    title="حذف البنر"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Banner Live Preview Card */}
        {activeBanner && (
          <div className="space-y-4">
            <span className="text-xs font-bold text-gray-500 block">معاينة شكل البنر الحالي في الواجهة:</span>
            <div className={`relative overflow-hidden rounded-2xl min-h-[200px] md:min-h-[240px] bg-gradient-to-r ${activeBanner.bgGradient || 'from-blue-950 to-indigo-950'} flex items-center p-6 md:p-8 text-white shadow-md`}>
              <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
                <img
                  src={normalizeImageUrl(activeBanner.image)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1600';
                  }}
                />
              </div>
              <div className="relative z-10 space-y-2 max-w-lg">
                <span className="inline-block bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {activeBanner.badge || 'شارة العرض'}
                </span>
                <h3 className="text-xl md:text-2xl font-black">{activeBanner.title}</h3>
                <p className="text-xs text-blue-100 line-clamp-2">{activeBanner.subtitle}</p>
                <div className="pt-2">
                  <span className="inline-block bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-xs">
                    {activeBanner.buttonText || 'تصفح الآن'}
                  </span>
                </div>
              </div>
            </div>

            {/* Banner Fields Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">عنوان البنر الرئيسي:</label>
                <input
                  type="text"
                  value={activeBanner.title}
                  onChange={(e) => updateActiveBanner('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">شارة البنر (Badge):</label>
                <input
                  type="text"
                  value={activeBanner.badge}
                  onChange={(e) => updateActiveBanner('badge', e.target.value)}
                  placeholder="مثال: ضمان الوكيل المعتمد"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-gray-700">النص التوضيحي للبنر (Subtitle):</label>
                <textarea
                  rows={2}
                  value={activeBanner.subtitle}
                  onChange={(e) => updateActiveBanner('subtitle', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">رابط صورة البنر (Image URL):</label>
                <div className="relative">
                  <input
                    type="text"
                    value={activeBanner.image}
                    onChange={(e) => updateActiveBanner('image', e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 font-mono text-left"
                    dir="ltr"
                  />
                  <ImageIcon size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">نص زر الإجراء:</label>
                <input
                  type="text"
                  value={activeBanner.buttonText}
                  onChange={(e) => updateActiveBanner('buttonText', e.target.value)}
                  placeholder="تصفح الأجهزة"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">القسم الذي يفتحه الزر عند الضغط:</label>
                <select
                  value={activeBanner.linkCategory || activeBanner.category}
                  onChange={(e) => {
                    updateActiveBanner('linkCategory', e.target.value);
                    updateActiveBanner('category', e.target.value);
                  }}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="أجهزة منزلية">أجهزة منزلية (ثلاجات، غسالات، بوتاجازات...)</option>
                  <option value="أجهزة كهربيه">أجهزة كهربيه (شاشات، تكييفات، أجهزة خفيفة...)</option>
                  <option value="عروض طنطاوي جروب اليومية">عروض طنطاوي جروب اليومية</option>
                  <option value="جميع المنتجات">جميع المنتجات</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">تدرج الخلفية اللوني:</label>
                <select
                  value={activeBanner.bgGradient}
                  onChange={(e) => updateActiveBanner('bgGradient', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="from-blue-950 via-blue-900 to-indigo-900">أزرق داكن ملكي (طنطاوي الرسمي)</option>
                  <option value="from-slate-950 via-slate-900 to-blue-950">رمادي داكن وكحلي تقني</option>
                  <option value="from-indigo-950 via-blue-950 to-red-950">كحلي ممزوج بأحمر طنطاوي</option>
                  <option value="from-red-950 via-red-900 to-amber-950">أحمر ناري للعروض الحصرية</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
