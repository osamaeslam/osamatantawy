import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  BookOpen, 
  Smartphone, 
  ShoppingBag, 
  ShieldCheck, 
  KeyRound, 
  Globe, 
  HelpCircle, 
  CheckCircle2, 
  Download, 
  ArrowRight, 
  PhoneCall, 
  MessageCircle, 
  ExternalLink,
  Laptop,
  Layers,
  Sparkles,
  Lock,
  ChevronLeft,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { TANTAWY_HOTLINE, TANTAWY_SALES_PHONE } from '../services/whatsapp-order';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin
}) => {
  const { setIsOrderTrackingOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'pwa' | 'customer' | 'admin' | 'vercel' | 'faq'>('pwa');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto font-['Cairo',sans-serif]"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Eng. Saja Persona */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
            title="إغلاق"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-300 text-blue-950 font-black text-xl flex items-center justify-center shadow-lg border-2 border-white/80">
                  سجى
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-blue-900" title="متصل الآن" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-yellow-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-yellow-400/30 mb-1">
                  <Sparkles size={12} />
                  <span>دليل الاستخدام والتشغيل المعتمد</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
                  <span>دليل استخدام المنظومة • إعداد م/ سجى</span>
                </h2>
                <p className="text-xs text-blue-200">
                  مهندسة ومسؤولة المنظومة الرقمية والتطوير - طنطاوي جروب
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-xs text-right self-start sm:self-auto">
              <span className="text-[10px] text-gray-300 block">مرجع سريع للعرض:</span>
              <strong className="text-yellow-300 text-xs">للعملاء • للإدارة • وللموظفين</strong>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shrink-0 ${
              activeTab === 'pwa'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200/70'
            }`}
          >
            <Smartphone size={15} />
            <span>تثبيت الموبايل (PWA)</span>
          </button>

          <button
            onClick={() => setActiveTab('customer')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shrink-0 ${
              activeTab === 'customer'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200/70'
            }`}
          >
            <ShoppingBag size={15} />
            <span>دليل العميل والطلب</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shrink-0 ${
              activeTab === 'admin'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200/70'
            }`}
          >
            <KeyRound size={15} />
            <span>دخول الإدارة والموظفين</span>
          </button>

          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shrink-0 ${
              activeTab === 'vercel'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200/70'
            }`}
          >
            <Globe size={15} />
            <span>الرفع على Vercel والدومين</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shrink-0 ${
              activeTab === 'faq'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200/70'
            }`}
          >
            <HelpCircle size={15} />
            <span>أسئلة الإدارة الشائعة</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-right">

          {/* TAB 1: PWA Mobile Installation */}
          {activeTab === 'pwa' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 sm:p-5 space-y-2">
                <h3 className="text-sm sm:text-base font-black text-blue-950 flex items-center gap-2">
                  <Smartphone size={18} className="text-blue-900" />
                  <span>تثبيت التطبيق كـ أيقونة مستقلة على الموبايل (PWA)</span>
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  تطبيق طنطاوي جروب مبرمج بأحدث معايير الويب التقدمي (Progressive Web App). وهذا يعني أن العميل أو الإداري يمكنه تثبيته فوراً كأيقونة تطبيق حقيقية بلوجو الشركة الرسمي على هاتفه <strong>بدون الحاجة لمتاجر التطبيقات (Google Play / App Store)</strong>.
                </p>
              </div>

              {/* Step by step Android & iOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Android Chrome */}
                <div className="bg-white border-2 border-emerald-100 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-emerald-50 pb-2">
                    <span className="text-xs font-black text-emerald-800">هواتف أندرويد (Google Chrome)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">خطوتان</span>
                  </div>
                  <ol className="text-xs space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>افتح رابط المتجر من متصفح كروم على الموبايل.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>اضغط على الزر الذهبي العلوي <strong>«تثبيت التطبيق 📲»</strong> أو افتح قائمة المتصفح (الثلاث نقاط <strong>⋮</strong>) واختر <strong>«تثبيت التطبيق» (Install app)</strong>.</span>
                    </li>
                  </ol>
                  <div className="p-2.5 bg-emerald-50/70 rounded-xl text-[11px] text-emerald-900 font-medium">
                    ✨ النتيجة: تنزل أيقونة طنطاوي جروب مباشرة على الشاشة الرئيسية وتفتح بملء الشاشة كتطبيق أصلي!
                  </div>
                </div>

                {/* iPhone iOS Safari */}
                <div className="bg-white border-2 border-blue-100 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                    <span className="text-xs font-black text-blue-900">هواتف آبل آيفون (Apple Safari)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">3 خطوات</span>
                  </div>
                  <ol className="text-xs space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>افتح رابط المتجر من متصفح سفاري (Safari).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>اضغط على أيقونة المشاركة بالأسفل (Share ⎋).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>اختر <strong>«إضافة إلى الصفحة الرئيسية» (Add to Home Screen)</strong>.</span>
                    </li>
                  </ol>
                  <div className="p-2.5 bg-blue-50/70 rounded-xl text-[11px] text-blue-950 font-medium">
                    ✨ النتيجة: تظهر أيقونة طنطاوي جروب الفاخرة بجوار باقي تطبيقات هاتفك.
                  </div>
                </div>
              </div>

              {/* Management Value Table: Why PWA is superior for Tantawy Group */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden text-xs">
                <div className="bg-gray-100 p-3 font-black text-gray-900">
                  💡 لماذا يعتبر حل PWA هو الأنسب والأوفر لشركة طنطاوي جروب أمام الإدارة؟
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="p-3 flex items-start gap-3 bg-white">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-gray-900 block">بدون رسوم واشتراكات سنوية للمتاجر:</strong>
                      <span className="text-gray-600 text-[11px]">توفر الشركة رسوم حساب المطور السنوي لشركة آبل (99$ سنوياً) وتراخيص جوجل.</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-start gap-3 bg-gray-50/60">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-gray-900 block">تحديث فوري للأسعار والأجهزة (Zero Waiting):</strong>
                      <span className="text-gray-600 text-[11px]">أي تعديل في المنتجات أو العروض يظهر فوراً للعميل دون الحاجة لتحديث يدوي من المتجر.</span>
                    </div>
                  </div>
                  <div className="p-3 flex items-start gap-3 bg-white">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-gray-900 block">خفيف للغاية ولا يستهلك ذاكرة الهاتف:</strong>
                      <span className="text-gray-600 text-[11px]">العميل في مصر يرفض أحياناً تحميل تطبيقات كبيرة الحجم، بينما تطبيقنا خفيف ويفتح في أقل من ثانية.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Customer Guide */}
          {activeTab === 'customer' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-2">
                <h3 className="text-sm sm:text-base font-black text-emerald-950 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-emerald-700" />
                  <span>دليل العميل: رحلة الشراء والمعاينة السهلة</span>
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  تم تصميم المتجر ليركز على أعلى نسبة تحويل للطلبات (Conversion Rate) عبر تسهيل الإجراءات وإلغاء أي حواجز قد تعيق قرار الشراء.
                </p>
              </div>

              {/* 4 Pillars of Customer Journey */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="font-black text-xs text-blue-950">تصفح بدون تسجيل دخول إجباري</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    يستطيع العميل استعراض الأجهزة الكبرى، الشاشات، والأجهزة الخفيفة ومقارنة المواصفات والماركات كزائر حر فوراً.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="font-black text-xs text-emerald-950">حجز معاينة مجانية منزلية</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    يضغط العميل على «طلب معاينة الصنف» ويدخل اسمه ورقم هاتفه فقط، ويصل مندوب طنطاوي جروب بالكرتونة لفتحها وفحصها أمام العميل.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="font-black text-xs text-green-950">الطلب المباشر السريع عبر واتساب</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    بضغطة واحدة على زر واتساب الأخضر في أي منتج، تفتح محادثة مجهزة باسم الجهاز وكود الصنف ليتحدث مع فريق المبيعات فوراً.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <h4 className="font-black text-xs text-gray-900">تتبع الطلب برقم الهاتف</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    يكتب العميل رقم تليفونه في شاشة «تتبع طلبك» ليعرف موقف التجهيز وموعد وصول المندوب واسم مسؤول المعاينة.
                  </p>
                </div>
              </div>

              {/* Action Buttons for Customer demo */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-gray-700">تريد تجربة شاشة التتبع الآن؟</span>
                <button
                  onClick={() => {
                    onClose();
                    setIsOrderTrackingOpen(true);
                  }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-black px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <span>فتح شاشة تتبع الطلبات 🚚</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Admin & Staff Guide */}
          {activeTab === 'admin' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-2">
                <h3 className="text-sm sm:text-base font-black text-indigo-950 flex items-center gap-2">
                  <KeyRound size={18} className="text-indigo-800" />
                  <span>دليل الإدارة والموظفين: التحكم الكامل بالمنظومة</span>
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  لوحة التحكم مدمجة في نفس التطبيق بشكل آمن ومخفية عن الزوار العاديين، وتتصل مباشرة بقاعدة بيانات Supabase الموحدة.
                </p>
              </div>

              {/* Default Credentials Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-lg border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock size={18} className="text-yellow-400" />
                    <span className="text-sm font-black text-white">بيانات تسجيل الدخول الافتراضية للوحة الإدارة</span>
                  </div>
                  <span className="text-[10px] bg-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded">مفعلة وجاهزة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-xl space-y-1">
                    <span className="text-gray-400 text-[11px] block">اسم المستخدم (Username):</span>
                    <strong className="text-yellow-300 font-mono text-base block tracking-wider select-all">
                      saja
                    </strong>
                    <span className="text-[10px] text-gray-400">(مسؤولة الإدارة م/ سجى)</span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl space-y-1">
                    <span className="text-gray-400 text-[11px] block">كلمة المرور (Password):</span>
                    <strong className="text-emerald-400 font-mono text-base block tracking-wider select-all">
                      osama442
                    </strong>
                    <span className="text-[10px] text-gray-400">(كلمة المرور المشفرة المعتمدة)</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-gray-400">
                    طريقة الدخول: أضف <code className="bg-slate-800 px-1.5 py-0.5 rounded text-yellow-300 font-mono">/admin</code> لنهاية رابط الموقع، أو اضغط الزر:
                  </span>
                  {onOpenAdmin && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAdmin();
                      }}
                      className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                    >
                      <KeyRound size={15} />
                      <span>فتح لوحة الإدارة الآن ⚙️</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Crucial Question: Do we need a separate app for Admin? */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
                <h4 className="font-black text-amber-950 text-sm flex items-center gap-2">
                  <ShieldCheck size={18} className="text-amber-700" />
                  <span>سؤال الإدارة: هل نحتاج تطبيق منفصل للإدارة عن تطبيق العملاء؟</span>
                </h4>
                <p className="text-gray-700 leading-relaxed font-medium">
                  <strong>الإجابة القاطعة: لا نحتاج لتطبيق منفصل</strong>، والتصميم الحالي الموحد هو الخيار الهندسي والاقتصادي الأفضل للأسباب التالية:
                </p>
                <ul className="space-y-2 text-gray-700 pr-2">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">✔</span>
                    <span><strong>قاعدة بيانات مركزية واحدة (Single Source of Truth):</strong> أي منتج يضاف أو يعدل يظهر لحظياً في المعرض بدون تأخير أو مزامنة معقدة.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">✔</span>
                    <span><strong>توفير نصف تكاليف الاستضافة والصيانة:</strong> كود برمجي واحد (One Codebase) أسهل في التطوير والتأمين من إدارة تطبيقين مستقلين.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">✔</span>
                    <span><strong>حماية كاملة:</strong> واجهة الإدارة محمية بتسجيل الدخول ولا يمكن لأي عميل الوصول إليها.</span>
                  </li>
                </ul>
              </div>

              {/* Dashboard Tabs Overview */}
              <div className="border border-gray-200 rounded-2xl p-4 space-y-3 text-xs">
                <h4 className="font-black text-gray-900 text-xs flex items-center gap-2">
                  <Layers size={16} className="text-blue-900" />
                  <span>أقسام لوحة الإدارة المتوفرة للمدير والموظفين:</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="block text-blue-950">📊 نظرة عامة:</strong>
                    <span className="text-[10px] text-gray-500">إحصائيات المبيعات، الطلبات، ونشاط الزوار.</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="block text-blue-950">📦 إدارة المنتجات:</strong>
                    <span className="text-[10px] text-gray-500">تعديل الأسعار وإضافة وحذف الأجهزة.</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="block text-blue-950">📋 طلبات المعاينة:</strong>
                    <span className="text-[10px] text-gray-500">متابعة الطلبات وتعيين المندوب وتغيير الحالة.</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="block text-blue-950">💬 نقرات الواتساب:</strong>
                    <span className="text-[10px] text-gray-500">معرفة الأجهزة الأكثر طلباً عبر واتساب.</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="block text-blue-950">📑 رفع ملف إكسل:</strong>
                    <span className="text-[10px] text-gray-500">رفع قائمة أجهزة ومخزون كامل بملف Excel.</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <strong className="block text-blue-950">👥 الزوار والمحافظات:</strong>
                    <span className="text-[10px] text-gray-500">معرفة المحافظات الأكثر تصفحاً للأجهزة.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Vercel Deployment & Domain */}
          {activeTab === 'vercel' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 sm:p-5 space-y-2">
                <h3 className="text-sm sm:text-base font-black text-purple-950 flex items-center gap-2">
                  <Globe size={18} className="text-purple-800" />
                  <span>دليل رفع المنظومة على Vercel وربط الدومين الخاص</span>
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  منصة Vercel السحابية هي الخيار الأقوى والأسرع عالمياً لاستضافة تطبيقات React & Vite بتقنيات PWA السريعة.
                </p>
              </div>

              {/* Deployment Steps */}
              <div className="space-y-3 text-xs">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center gap-2 font-black text-gray-900">
                    <span className="w-5 h-5 rounded-full bg-purple-900 text-white text-[10px] flex items-center justify-center font-mono">1</span>
                    <span>الرفع التلقائي (Deploy):</span>
                  </div>
                  <p className="text-gray-600 pr-7 text-[11px]">
                    يتم ربط مستودع GitHub بحساب Vercel، أو تشغيل الأمر السريع <code className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono text-purple-900">vercel --prod</code>.
                  </p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center gap-2 font-black text-gray-900">
                    <span className="w-5 h-5 rounded-full bg-purple-900 text-white text-[10px] flex items-center justify-center font-mono">2</span>
                    <span>الروابط الناتجة على Vercel:</span>
                  </div>
                  <div className="pr-7 space-y-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-24">رابط العملاء:</span>
                      <code className="bg-white px-2 py-0.5 rounded border text-blue-900 font-bold font-mono">https://tantawy-store.vercel.app</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-24">رابط الإدارة:</span>
                      <code className="bg-white px-2 py-0.5 rounded border text-purple-900 font-bold font-mono">https://tantawy-store.vercel.app/admin</code>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center gap-2 font-black text-gray-900">
                    <span className="w-5 h-5 rounded-full bg-purple-900 text-white text-[10px] flex items-center justify-center font-mono">3</span>
                    <span>ربط الدومين المخصص الخاص بطنطاوي جروب:</span>
                  </div>
                  <p className="text-gray-600 pr-7 text-[11px] leading-relaxed">
                    من لوحة تحكم Vercel ادخل على <strong>Settings → Domains → Add Domain</strong> واكتب نطاق الشركة (مثل <code className="font-mono text-purple-900">store.tantawy.com</code>)، وسيقدم لك Vercel سجلات CNAME لإضافتها في لوحة الدومين بضغطة زر.
                  </p>
                </div>
              </div>

              {/* Status Note */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-1">
                <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-700" />
                  <span>حالة الكود والتوافق مع Vercel:</span>
                </span>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  الكود مجهز ومضبوط بالكامل للعمل على Vercel بنجاح مع ملفات التكوين ومتغيرات Supabase الآمنة.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: Management FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="border border-gray-200 rounded-2xl p-4 space-y-2 bg-gray-50/60">
                <strong className="text-blue-950 font-black block">
                  س: هل يحتاج العميل لإنشاء حساب أو كلمة مرور ليطلب جهاز؟
                </strong>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  ج: لا، الشراء متاح كـ "ضيف" (Guest Checkout) لتقليل خطوات الشراء، والطلب يتم بتسجيل الاسم ورقم الهاتف والعنوان فقط مع حق المعاينة المجانية.
                </p>
              </div>

              <div className="border border-gray-200 rounded-2xl p-4 space-y-2 bg-gray-50/60">
                <strong className="text-blue-950 font-black block">
                  س: ماذا يحدث عندما يضغط العميل على "طلب مباشر عبر واتساب"؟
                </strong>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  ج: يتم فتح تطبيق واتساب الخاص بالعميل تلقائياً برسالة منسقة رسمية تحتوي على: اسم المنتج، كود الصنف، الماركة، وتأكيد حق المعاينة والدفع عند الاستلام، لتسهيل مهمة موظف المبيعات.
                </p>
              </div>

              <div className="border border-gray-200 rounded-2xl p-4 space-y-2 bg-gray-50/60">
                <strong className="text-blue-950 font-black block">
                  س: كيف يمكن للموظفين متابعة وتأكيد طلبات المعاينة؟
                </strong>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  ج: يدخل موظف المبيعات للوحة الإدارة عبر الرابط <code className="font-mono text-blue-900">/admin</code> مستخدماً بيانات الدخول، ويفتح تبويب "الطلبات" ليرى قائمة الطلبات الواردة لحظة بلحظة مع أرقام هواتف العملاء وتحديث حالتها.
                </p>
              </div>

              <div className="border border-gray-200 rounded-2xl p-4 space-y-2 bg-gray-50/60">
                <strong className="text-blue-950 font-black block">
                  س: هل يمكن تعديل بيانات الدخول الافتراضية (saja / osama442)؟
                </strong>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  ج: نعم بكل سهولة، من خلال جدول <code className="font-mono text-blue-900">admin_users</code> في قاعدة بيانات Supabase أو من خلال كود الخدمة، ويمكن إضافة مستخدمين متعددين بحسابات مستقلة.
                </p>
              </div>

              {/* Direct Support with Eng. Saja */}
              <div className="bg-gradient-to-r from-blue-950 to-indigo-950 text-white rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400 text-blue-950 font-black flex items-center justify-center text-sm">
                    سجى
                  </div>
                  <div>
                    <h4 className="font-black text-sm">الدعم الفني المباشر مع م/ سجى</h4>
                    <p className="text-xs text-blue-200">مسؤولة المنظومة والدعم التقني لطنطاوي جروب</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="tel:15218"
                    className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <PhoneCall size={14} />
                    <span>الخط الساخن: 15218</span>
                  </a>

                  <a
                    href={`https://wa.me/${TANTAWY_SALES_PHONE}?text=${encodeURIComponent('السلام عليكم م/ سجى، أود الاستفسار بخصوص تشغيل وإدارة منظومة طنطاوي جروب للأجهزة المنزلية')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <MessageCircle size={14} />
                    <span>مراسلة واتساب للدعم الفني</span>
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>منظومة متكاملة معتمدة لعرضها على مجلس إدارة طنطاوي جروب</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="flex-1 sm:flex-initial bg-blue-900 hover:bg-blue-950 text-white font-bold px-4 py-2 rounded-xl transition text-xs shadow-xs"
              >
                تجربة لوحة الإدارة ⚙️
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-5 py-2 rounded-xl transition text-xs"
            >
              إغلاق الدليل
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
