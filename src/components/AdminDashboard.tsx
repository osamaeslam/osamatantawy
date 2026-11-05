import React, { useState, useEffect } from 'react';
import { ExcelUpload } from './ExcelUpload';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { visitorService } from '../supabase/visitor.service';
import { whatsappClickService } from '../supabase/whatsapp-click.service';
import { orderService } from '../supabase/orders.service';
import { productService } from '../supabase/products.service';
import type { FirebaseProduct } from '../types/firebase';
import type { FirebaseOrder } from '../types/firebase';
import { Package, Building2, BookOpen, Users, ArrowRight, ShieldCheck, UserCheck, MessageCircle, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from './StatCard';
import { OverviewTab } from './OverviewTab';
import { ProductsTab } from './ProductsTab';
import { OrdersTab } from './OrdersTab';
import { VisitorsTab } from './VisitorsTab';
import { ClicksTab } from './ClicksTab';
import { HomePageCMS } from './HomePageCMS';
import { CategoriesTab } from './CategoriesTab';
import { StaffManagementTab } from './StaffManagementTab';
import { staffService } from '../services/staff.service';
import type { StaffUser, StaffRole } from '../services/staff.service';

interface AdminDashboardProps {
  onExit?: () => void;
}

const roleLabelAr = (role: StaffRole | string): string => {
  if (role === 'admin') return 'المدير العام';
  if (role === 'sales_rep') return 'موظف مبيعات وفواتير';
  return 'مسؤول شحن وتوصيل';
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const { 
    setIsUserGuideOpen, 
    whatsappNumber, 
    updateWhatsAppNumber,
    hideDemoProducts,
    setHideDemoProducts,
    fetchProductsFromDatabase,
    isSyncingWithDatabase,
    products: appProducts 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'visitors' | 'clicks' | 'excel' | 'cms' | 'categories' | 'staff'>(() => {
    try {
      const h = window.location.hash.toLowerCase();
      if (h.includes('cms') || h.includes('banner')) return 'cms';
    } catch {}
    return 'overview';
  });
  const [adminEmail, setAdminEmail] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(() => staffService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const cached = staffService.getCurrentUser();
    return Boolean(cached && cached.isActive);
  });
  const [loggingIn, setLoggingIn] = useState(false);

  const { stats, loading } = useDashboardStats(isAuthenticated);
  const [products, setProducts] = useState<FirebaseProduct[]>([]);
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [recentClicks, setRecentClicks] = useState<any[]>([]);

  // حالة تعديل رقم الواتساب السريع
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [quickPhoneInput, setQuickPhoneInput] = useState(whatsappNumber);
  const [phoneSavedMessage, setPhoneSavedMessage] = useState(false);

  const loadData = async () => {
    try {
      const [p, o, v, c] = await Promise.all([
        productService.getAll(),
        orderService.getAll(),
        visitorService.getAll(),
        whatsappClickService.getAll(),
      ]);
      setProducts(p);
      setOrders(o);
      setRecentVisitors(v.slice(0, 10));
      setRecentClicks(c.slice(0, 10));
    } catch (err) {
      console.error(err);
    }
  };

  // استرجاع جلسة Supabase Auth عند فتح لوحة التحكم (تأكيد إن الحساب لسه نشط)
  useEffect(() => {
    let cancelled = false;
    staffService
      .restoreSession()
      .then((staff) => {
        if (cancelled) return;
        if (staff && staff.isActive) {
          setCurrentStaff(staff);
          setIsAuthenticated(true);
          setActiveTab(staff.role === 'admin' ? 'overview' : 'orders');
        } else {
          setCurrentStaff(null);
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        /* فشل الشبكة: سيب الحالة زي ما هي */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const enterWithStaff = (staff: StaffUser) => {
    setCurrentStaff(staff);
    setIsAuthenticated(true);
    setActiveTab(staff.role === 'admin' ? 'overview' : 'orders');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      if (authMode === 'signup') {
        if (!adminFullName.trim()) {
          alert('يرجى كتابة الاسم بالكامل لإنشاء الحساب.');
          return;
        }
        const result = await staffService.signUp(adminEmail.trim(), adminPassword, adminFullName.trim());
        if (result.needsEmailConfirmation) {
          alert(
            'تم إنشاء الحساب. افتح رسالة التأكيد في بريدك الإلكتروني ثم سجّل الدخول.\n\nملاحظة للمدير: يمكن إيقاف تأكيد الإيميل من Supabase → Authentication → Providers → Email.'
          );
          setAuthMode('login');
          return;
        }
        if (result.staff) {
          enterWithStaff(result.staff);
          alert(`أهلاً ${result.staff.fullName || ''} — تم الدخول كـ ${roleLabelAr(result.staff.role)}.`);
          return;
        }
        alert(
          'تم إنشاء الحساب بنجاح، لكنه لم يُسند له دور بعد. اطلب من المدير العام إضافة بريدك الإلكتروني في صفحة فريق العمل.'
        );
        return;
      }

      const staff = await staffService.login(adminEmail.trim(), adminPassword);
      enterWithStaff(staff);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء التحقق من الحساب');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await staffService.logout();
    setCurrentStaff(null);
    setIsAuthenticated(false);
    setAdminEmail('');
    setAdminPassword('');
  };

  const isSuperAdmin = staffService.isAdmin(currentStaff);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-['Cairo',sans-serif]">
        <div className="bg-white p-7 sm:p-9 rounded-3xl shadow-2xl w-full max-w-md space-y-6 text-right">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-900 text-white rounded-2xl flex items-center justify-center shadow-md">
                <Building2 size={26} />
              </div>
              <div>
                <h1 className="text-xl font-black text-blue-950">لوحة تحكم طنطاوي جروب</h1>
                <p className="text-xs text-gray-500 font-bold">بوابة دخول المدير العام والموظفين</p>
              </div>
            </div>
            {onExit && (
              <button
                onClick={onExit}
                className="text-xs font-bold text-gray-400 hover:text-blue-900 transition flex items-center gap-1"
                title="الرجوع للمتجر"
              >
                <span>المتجر</span>
                <ArrowRight size={14} className="rotate-180" />
              </button>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">الاسم بالكامل:</label>
                <input
                  type="text"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="مثال: ك/ محمد طارق"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-bold"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">البريد الإلكتروني (Email):</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="username"
                dir="ltr"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-mono font-bold text-left"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">كلمة المرور (Password):</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                dir="ltr"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-mono font-bold text-left"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-blue-900 hover:bg-blue-950 text-white font-black py-3 rounded-xl transition disabled:opacity-50 text-sm shadow-md"
            >
              {loggingIn
                ? 'جاري التحقق من الصلاحيات...'
                : authMode === 'signup'
                ? 'إنشاء الحساب 🔐'
                : 'تسجيل الدخول للمنظومة 🔐'}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-xs font-bold text-blue-800 hover:underline"
            >
              {authMode === 'login'
                ? 'موظف جديد؟ إنشاء حساب بالبريد الإلكتروني'
                : 'لديك حساب بالفعل؟ تسجيل الدخول'}
            </button>
          </div>

          {/* شرح طريقة الصلاحيات */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 text-[11px] leading-relaxed text-gray-700 space-y-1.5">
            <span className="font-black text-blue-950 block">إزاي الصلاحيات بتتحدد؟</span>
            <p>• الدخول بحساب بريد إلكتروني حقيقي عبر Supabase Auth (مفيش كلمات مرور مكتوبة في الكود).</p>
            <p>• المدير العام يضيف بريد الموظف ودوره من صفحة «فريق العمل»، والموظف ينشئ حسابه بنفس البريد فيتفعّل تلقائياً.</p>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <button
              type="button"
              onClick={() => setIsUserGuideOpen(true)}
              className="text-blue-700 font-bold hover:underline flex items-center gap-1"
            >
              <BookOpen size={13} />
              <span>دليل الاستخدام 📖</span>
            </button>
            <span>طنطاوي جروب للتجارة والتوزيع</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-['Cairo',sans-serif] text-right">
      {/* Top Main Navigation Header */}
      <header className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap justify-between items-center gap-3">
          {/* Logo & User Role Badge */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-auto bg-white rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt="Tantawy Logo" className="h-9 w-auto object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-blue-950">
                  لوحة تحكم طنطاوي جروب
                </h1>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  currentStaff?.role === 'admin'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : currentStaff?.role === 'sales_rep'
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : 'bg-purple-100 text-purple-900 border-purple-300'
                }`}>
                  {currentStaff?.role === 'admin' 
                    ? '👑 المدير العام' 
                    : currentStaff?.role === 'sales_rep' 
                    ? '📱 موظف مبيعات وفواتير' 
                    : '🚚 مسؤول شحن وتوصيل'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-bold">
                مرحباً: <span className="text-gray-900">{currentStaff?.fullName}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {/* WhatsApp Quick Editor */}
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setQuickPhoneInput(whatsappNumber);
                  setShowPhoneModal(true);
                }}
                className="hidden md:flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs"
                title="اضغط لتعديل رقم واتساب المبيعات فوراً"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>واتساب المبيعات:</span>
                <span className="font-mono text-emerald-800" dir="ltr">{whatsappNumber || '201521800000'}</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md font-bold">تعديل ⚙️</span>
              </button>
            )}

            {onExit && (
              <button
                onClick={onExit}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-900 text-gray-700 border border-gray-200 rounded-xl font-bold text-xs transition flex items-center gap-1.5"
                title="الرجوع إلى المتجر وتصفح الكتالوج"
              >
                <ArrowRight size={14} className="rotate-180" />
                <span>العودة للمتجر 🛒</span>
              </button>
            )}

            <button
              onClick={() => setIsUserGuideOpen(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs transition hidden sm:flex items-center gap-1.5"
            >
              <BookOpen size={14} />
              <span>دليل الاستخدام 📖</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition shadow-2xs"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Quick WhatsApp Edit Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 text-right">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <span>📱 تعديل رقم واتساب استلام الفواتير والطلبات</span>
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              هذا هو الرقم الذي سيتلقى جميع كروت الفواتير وطلبات العملاء عبر رسائل واتساب المنظمة فورياً.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">رقم الواتساب بالصيغة الدولية أو المحلية:</label>
              <input
                type="text"
                value={quickPhoneInput}
                onChange={(e) => setQuickPhoneInput(e.target.value)}
                placeholder="مثال: 201012345678 أو 01012345678"
                className="w-full p-3 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-left"
                dir="ltr"
              />
              <span className="text-[10px] text-gray-400 block">
                ملاحظة: يمكنك إدخال 01012345678 أو 201012345678 وسيتم ضبطه تلقائياً.
              </span>
            </div>

            {phoneSavedMessage && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>✅ تم حفظ الرقم بنجاح وتحديث جميع أزرار المتجر والفواتير!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!quickPhoneInput.trim()) {
                    alert('يرجى إدخال رقم صحيح');
                    return;
                  }
                  updateWhatsAppNumber(quickPhoneInput.trim());
                  setPhoneSavedMessage(true);
                  setTimeout(() => {
                    setPhoneSavedMessage(false);
                    setShowPhoneModal(false);
                  }, 1200);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-xs"
              >
                حفظ وتطبيق فوراً 💾
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Employee Welcome Banner for Sales/Shipping Reps */}
        {!isSuperAdmin && (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-blue-800/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-base font-black">
                  واجهة موظف طنطاوي جروب: {currentStaff?.fullName}
                </h3>
              </div>
              <p className="text-xs text-blue-200">
                يمكنك الآن فحص جميع كروت الفواتير الواردة، التواصل مع العملاء عبر واتساب والاتصال الهاتفي، تأكيد الأسعار النهائية وتحديث حالة الأوردر.
              </p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/20">
              <span>الطلبات المسجلة: </span>
              <strong className="text-yellow-300 font-mono text-sm">{orders.length}</strong>
            </div>
          </div>
        )}

        {/* Supabase Live Connection & Demo Data Control Bar (Visible to Super Admin) */}
        {isSuperAdmin && (
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md border border-blue-800/40">
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <strong className="text-sm sm:text-base font-black text-white">
                  قاعدة بيانات سوبابيز مربوطة ومزامنة فورية
                </strong>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Live Supabase Connected
                </span>
              </div>
              <p className="text-xs text-blue-200">
                يوجد حالياً <strong className="text-yellow-300 font-mono font-black">{stats.total_products || appProducts.length}</strong> صنف بقاعدة البيانات، ويتم استرداد الصور والأصناف تلقائياً للزوار.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={async () => {
                  await fetchProductsFromDatabase();
                  await loadData();
                  alert('تمت مزامنة المنتجات واسترداد الصور والبيانات من قاعدة بيانات سوبابيز بنجاح!');
                }}
                disabled={isSyncingWithDatabase}
                className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs"
              >
                <span>{isSyncingWithDatabase ? 'جاري المزامنة...' : 'مزامنة من قاعدة البيانات الآن 🔄'}</span>
              </button>

              <button
                onClick={() => {
                  const nextState = !hideDemoProducts;
                  setHideDemoProducts(nextState);
                  alert(nextState 
                    ? 'تم إخفاء البيانات التجريبية نهائياً! المتجر يعرض الآن منتجات قاعدة البيانات / الشيت فقط.' 
                    : 'تمت استعادة البيانات التجريبية للعرض التجريبي.'
                  );
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs border ${
                  hideDemoProducts 
                    ? 'bg-amber-500 hover:bg-amber-600 text-blue-950 border-amber-400 font-black' 
                    : 'bg-red-600/90 hover:bg-red-600 text-white border-red-500'
                }`}
              >
                <span>{hideDemoProducts ? 'إظهار البيانات التجريبية للاختبار 👁️' : 'حذف وإخفاء البيانات التجريبية نهائياً 🗑️'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Stat Cards */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard title="إجمالي الزوار" value={stats.total_visitors} icon={<span>👥</span>} subtitle={stats.today_visitors + ' اليوم'} color="blue" />
            <StatCard title="نقرات الواتساب" value={stats.total_whatsapp_clicks} icon={<span>📱</span>} subtitle="ضغط على رابط الشراء" color="green" />
            <StatCard title="إجمالي الطلبات" value={stats.total_orders} icon={<span>🛒</span>} subtitle={stats.today_orders + ' اليوم'} color="purple" />
            <StatCard title="إجمالي المنتجات" value={stats.total_products} icon={<span>📦</span>} subtitle="في قاعدة البيانات" color="orange" />
          </div>
        )}

        {/* Tab Navigation Buttons */}
        <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
          {(isSuperAdmin
            ? [
                { id: 'overview', label: 'نظرة عامة 📊' },
                { id: 'cms', label: '🖼️ تعديل البانرات والواجهة (CMS) 🎨' },
                { id: 'orders', label: `طلبات وفواتير العملاء (${orders.length}) 🛒` },
                { id: 'staff', label: 'فريق العمل وحسابات الموظفين 👥' },
                { id: 'categories', label: 'أسماء الأقسام 🗂️' },
                { id: 'excel', label: 'شيت جوجل ورفع إكسل 📊' },
                { id: 'products', label: 'المنتجات 📦' },
                { id: 'visitors', label: 'الزوار 👥' },
                { id: 'clicks', label: 'نقرات الواتساب 📱' },
              ]
            : [
                { id: 'orders', label: `طلبات وفواتير العملاء (${orders.length}) 🛒` },
                { id: 'products', label: 'كتالوج المنتجات والأكواد 📦' },
              ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-blue-900 text-white shadow-md' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && isSuperAdmin && <OverviewTab orders={orders} recentVisitors={recentVisitors} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} onRefresh={loadData} />}
        {activeTab === 'staff' && isSuperAdmin && <StaffManagementTab currentStaff={currentStaff} />}
        {activeTab === 'cms' && isSuperAdmin && <HomePageCMS />}
        {activeTab === 'categories' && isSuperAdmin && <CategoriesTab />}
        {activeTab === 'excel' && isSuperAdmin && <ExcelUpload />}
        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            onRefresh={async () => {
              await loadData();
              await fetchProductsFromDatabase();
            }}
          />
        )}
        {activeTab === 'visitors' && isSuperAdmin && <VisitorsTab stats={stats} recentVisitors={recentVisitors} />}
        {activeTab === 'clicks' && isSuperAdmin && <ClicksTab stats={stats} recentClicks={recentClicks} />}
      </div>
    </div>
  );
};