import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HeroBanner, HomePageConfig, PromoBanner } from '../types';
import { INITIAL_HOMEPAGE_CONFIG } from '../data/mockData';
import { RefreshCw } from 'lucide-react';
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
  Send,
  Layers
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
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>(
    homePageConfig.promoBanners && homePageConfig.promoBanners.length > 0 
      ? homePageConfig.promoBanners 
      : (INITIAL_HOMEPAGE_CONFIG.promoBanners || [])
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'promos' | 'hero' | 'contact'>(() => {
    try {
      const h = window.location.hash.toLowerCase();
      if (h.includes('promo') || h.includes('cms')) return 'promos';
    } catch {}
    return 'all';
  });

  // Sync state if context changes
  React.useEffect(() => {
    setAnnouncementText(homePageConfig.announcementText);
    setHotline(homePageConfig.hotline);
    setWhatsappNumber(homePageConfig.whatsappNumber || '201521800000');
    setBanners(homePageConfig.heroBanners || []);
    if (homePageConfig.promoBanners && homePageConfig.promoBanners.length > 0) {
      setPromoBanners(homePageConfig.promoBanners);
    }
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

  const updatePromoBanner = (index: number, field: keyof PromoBanner, value: any) => {
    setPromoBanners(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
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
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=1600&auto=format&fit=crop&q=80',
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
      heroBanners: banners,
      promoBanners: promoBanners
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
      setPromoBanners(INITIAL_HOMEPAGE_CONFIG.promoBanners || []);
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

      {/* Quick Section Tabs & Shortcuts */}
      <div className="bg-gradient-to-r from-blue-950 to-indigo-900 p-3.5 rounded-2xl shadow-sm text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-blue-200 shrink-0">أقسام الواجهة:</span>
          <button
            type="button"
            onClick={() => setActiveSection('promos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 ${
              activeSection === 'promos'
                ? 'bg-amber-400 text-blue-950 shadow-md font-black ring-2 ring-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <span>🖼️ البانران الترويجيان (شاشات وأجهزة كبرى)</span>
            <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">تعديل هنا</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('hero')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSection === 'hero'
                ? 'bg-amber-400 text-blue-950 shadow-md font-black ring-2 ring-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <span>🎠 بنرات السلايدر العلوية ({banners.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('contact')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeSection === 'contact'
                ? 'bg-amber-400 text-blue-950 shadow-md font-black ring-2 ring-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <span>📱 رقم واتساب الطلبات والخط الساخن</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeSection === 'all'
                ? 'bg-white text-blue-950 shadow-md font-black'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <span>عرض كل الأقسام</span>
          </button>
        </div>

        <button
          onClick={handleSaveAll}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs px-5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5 shrink-0 mr-auto"
        >
          <CheckCircle2 size={16} />
          <span>حفظ التعديلات ونشرها 🚀</span>
        </button>
      </div>

      {/* Section 1: Announcement Bar & Hotline */}
      {(activeSection === 'all' || activeSection === 'contact') && (
        <>
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
      </>
      )}

      {/* Section 2: Hero Banners Manager */}
      {(activeSection === 'all' || activeSection === 'hero') && (
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
                  src={normalizeImageUrl(activeBanner.image)} referrerPolicy="no-referrer"
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
      )}

      {/* Section 4: Two Side-By-Side Promotional Banners (تعديل البانرين الترويجيين بالصفحة الرئيسية) */}
      {(activeSection === 'all' || activeSection === 'promos') && (
        <div 
          id="promo-banners-section" 
          className={`bg-white rounded-3xl border-2 ${
            activeSection === 'promos' 
              ? 'border-indigo-600 ring-4 ring-indigo-100 shadow-lg' 
              : 'border-indigo-200 shadow-xs'
          } p-6 space-y-5`}
        >
          {/* Prominent Banner Notification */}
          <div className="bg-indigo-950 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-lg shrink-0">
                🖼️
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-300">
                  تعديل البانرين الترويجيين بالصفحة الرئيسية (شاشات وأجهزة كبرى)
                </h4>
                <p className="text-xs text-gray-200">
                  هنا يتم تعديل صور وعناوين وأزرار البانرين المعروضين في منتصف الصفحة الرئيسية.
                </p>
              </div>
            </div>
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-bold self-start sm:self-auto">
              قابل للتعديل بنسبة 100%
            </span>
          </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Layers className="text-indigo-600" size={18} />
              <span>تعديل البانرات الترويجية الثنائية (Two Promotional Banners)</span>
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              البانران الجانبيان في منتصف الصفحة الرئيسية (بنر الأجهزة الكبرى وبنر الشاشات الذكية والأجهزة الكهربية).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (banners.length === 0) return;
                const hero1 = banners[0];
                const hero2 = banners[1] || banners[0];
                const newPromos: PromoBanner[] = [
                  {
                    id: 'promo-1',
                    badge: hero1.badge || 'أجهزة منزلية كبرى',
                    badgeBg: 'bg-red-600 text-white',
                    title: hero1.title || 'ثلاجات، غسالات وبوتاجازات',
                    subtitle: hero1.subtitle || 'أحدث الأجهزة بضمان طنطاوي جروب والوكيل المعتمد',
                    buttonText: hero1.buttonText || 'تصفح الأجهزة الكبرى',
                    image: hero1.image,
                    bgGradient: hero1.bgGradient || 'from-blue-950 to-blue-800',
                    linkCategory: hero1.linkCategory || hero1.category || 'أجهزة منزلية'
                  },
                  {
                    id: 'promo-2',
                    badge: hero2.badge || 'شاشات وتلفزيونات 4K',
                    badgeBg: 'bg-amber-500 text-black',
                    title: hero2.title || 'شاشات ذكية وتكييفات وأجهزة كهربية',
                    subtitle: hero2.subtitle || 'وضوح كريستالي مع ريسيفر داخلي وتوصيل سريع',
                    buttonText: hero2.buttonText || 'تصفح الأجهزة الكهربية',
                    image: hero2.image,
                    bgGradient: hero2.bgGradient || 'from-slate-900 to-indigo-950',
                    linkCategory: hero2.linkCategory || hero2.category || 'أجهزة كهربيه'
                  }
                ];
                setPromoBanners(newPromos);
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 4000);
              }}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              title="نسخ صور وبيانات البنرات العلوية إلى البانرين تلقائياً"
            >
              <RefreshCw size={14} />
              <span>🔄 ربط البانرين بالبنرات الرئيسية العلوية فوراً</span>
            </button>
            <span className="text-xs bg-indigo-50 text-indigo-900 font-bold px-3 py-1 rounded-full">
              بانران قابلان للتعديل
            </span>
          </div>
        </div>

        {/* Live Preview of the Two Banners */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-600">معاينة حية لشكل البانرين في الصفحة الرئيسية:</label>
            <span className="text-[11px] text-gray-500">صور أجهزة طنطاوي المعتمدة فقط (ثلاجات، غسالات، شاشات)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-950 rounded-2xl">
            {promoBanners.slice(0, 2).map((promo, idx) => (
              <div
                key={idx}
                className={`overflow-hidden rounded-2xl bg-gradient-to-r ${promo.bgGradient || 'from-blue-950 to-blue-800'} text-white p-4 flex items-center justify-between shadow-sm border border-white/10`}
              >
                <div className="space-y-1.5 max-w-[65%]">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${promo.badgeBg || 'bg-red-600 text-white'}`}>
                    {promo.badge}
                  </span>
                  <h5 className="text-xs sm:text-sm font-black line-clamp-1">{promo.title}</h5>
                  <p className="text-[10px] text-blue-200 line-clamp-2">{promo.subtitle}</p>
                  <span className="text-[10px] font-bold text-yellow-300 block pt-0.5">
                    {promo.buttonText} ←
                  </span>
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-md border border-white/20 shrink-0 bg-white/10">
                  <img
                    src={normalizeImageUrl(promo.image)}
                    referrerPolicy="no-referrer"
                    alt={promo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Fields for Both Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {promoBanners.slice(0, 2).map((promo, index) => (
            <div key={index} className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-xs font-black text-blue-950">
                  {index === 0 ? '🔘 البانر الأول (اليمين - أجهزة منزلية كبرى)' : '🔘 البانر الثاني (اليسار - شاشات وأجهزة كهربيه)'}
                </span>
                <span className="text-[10px] text-gray-500 font-bold">بانر #{index + 1}</span>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">عنوان البانر الرئيسي:</label>
                <input
                  type="text"
                  value={promo.title}
                  onChange={(e) => updatePromoBanner(index, 'title', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">الوصف الترويجي والموديلات:</label>
                <input
                  type="text"
                  value={promo.subtitle}
                  onChange={(e) => updatePromoBanner(index, 'subtitle', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">نص البادج / التمييز:</label>
                  <input
                    type="text"
                    value={promo.badge}
                    onChange={(e) => updatePromoBanner(index, 'badge', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">نص زر التصفح:</label>
                  <input
                    type="text"
                    value={promo.buttonText}
                    onChange={(e) => updatePromoBanner(index, 'buttonText', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">رابط صورة البانر:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={promo.image}
                    onChange={(e) => updatePromoBanner(index, 'image', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2 text-xs font-mono text-left outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    dir="ltr"
                  />
                  <ImageIcon size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {/* Quick image recommendations */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-gray-500 font-bold">صور مقترحة:</span>
                  {banners[0] && (
                    <button
                      type="button"
                      onClick={() => updatePromoBanner(index, 'image', banners[0].image)}
                      className="text-[10px] bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 py-0.5 rounded text-blue-900 font-bold"
                      title="نسخ نفس صورة البانر الرئيسي الأول"
                    >
                      📷 نفس صورة البانر العلوي 1
                    </button>
                  )}
                  {banners[1] && (
                    <button
                      type="button"
                      onClick={() => updatePromoBanner(index, 'image', banners[1].image)}
                      className="text-[10px] bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 py-0.5 rounded text-blue-900 font-bold"
                      title="نسخ نفس صورة البانر الرئيسي الثاني"
                    >
                      📷 نفس صورة البانر العلوي 2
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => updatePromoBanner(index, 'image', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80')}
                    className="text-[10px] bg-white border border-gray-200 hover:border-blue-400 px-2 py-0.5 rounded text-blue-700"
                  >
                    ثلاجة وأجهزة فاخرة
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePromoBanner(index, 'image', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80')}
                    className="text-[10px] bg-white border border-gray-200 hover:border-blue-400 px-2 py-0.5 rounded text-blue-700"
                  >
                    شاشة 4K سمارت
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">القسم المرتبط عند النقر:</label>
                  <select
                    value={promo.linkCategory}
                    onChange={(e) => updatePromoBanner(index, 'linkCategory', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2 text-xs font-bold text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="أجهزة منزلية">أجهزة منزلية</option>
                    <option value="أجهزة كهربيه">أجهزة كهربيه</option>
                    <option value="عروض طنطاوي جروب اليومية">عروض طنطاوي جروب</option>
                    <option value="جميع المنتجات">جميع المنتجات</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">تدرج اللون للخلفية:</label>
                  <select
                    value={promo.bgGradient}
                    onChange={(e) => updatePromoBanner(index, 'bgGradient', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2 text-xs font-bold text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="from-blue-950 to-blue-800">أزرق داكن كلاسيكي</option>
                    <option value="from-slate-900 to-indigo-950">رمادي وكحلي غامق</option>
                    <option value="from-indigo-950 to-blue-900">كحلي ممزوج بنيلي</option>
                    <option value="from-red-950 to-red-800">أحمر داكن للعروض</option>
                  </select>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
      )}

      {/* Floating Save Button at bottom of CMS */}
      <div className="sticky bottom-4 z-20 flex justify-end">
        <button
          onClick={handleSaveAll}
          className="bg-blue-900 hover:bg-blue-950 active:scale-95 text-white font-black text-sm px-8 py-3 rounded-2xl shadow-xl transition flex items-center gap-2 border-2 border-white/80"
        >
          <CheckCircle2 size={18} />
          <span>حفظ ونشر التعديلات والبانرات فوراً 🚀</span>
        </button>
      </div>

    </div>
  );
};
