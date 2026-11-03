import React, { useState, useEffect } from 'react';
import { ExcelUpload } from './ExcelUpload';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { visitorService } from '../supabase/visitor.service';
import { adminAuthService } from '../supabase/admin-auth.service';
import { whatsappClickService } from '../supabase/whatsapp-click.service';
import { orderService } from '../supabase/orders.service';
import { productService } from '../supabase/products.service';
import type { FirebaseProduct } from '../types/firebase';
import type { FirebaseOrder } from '../types/firebase';
import { Package, Building2, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from './StatCard';
import { OverviewTab } from './OverviewTab';
import { ProductsTab } from './ProductsTab';
import { OrdersTab } from './OrdersTab';
import { VisitorsTab } from './VisitorsTab';
import { ClicksTab } from './ClicksTab';

import { HomePageCMS } from './HomePageCMS';

export const AdminDashboard: React.FC = () => {
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

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'visitors' | 'clicks' | 'excel' | 'cms'>('overview');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const { stats, loading } = useDashboardStats();
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

  useEffect(() => {
    loadData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const admin = await adminAuthService.login(adminUsername.trim(), adminPassword);
      if (admin) {
        setIsAuthenticated(true);
      } else {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err: any) {
      alert('حدث خطأ أثناء الاتصال بالخادم: ' + err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-center mb-4">
            <Building2 size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 text-center mb-2">لوحة تحكم طنطاوي جروب</h1>
          <p className="text-center text-gray-600 text-sm mb-6">تسجيل دخول مسؤول النظام</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">اسم المستخدم</label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loggingIn ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col items-center gap-2">
            <p className="text-[11px] text-gray-400 text-center">
              الدخول مخصص للمسؤولين فقط
            </p>
            <button
              type="button"
              onClick={() => setIsUserGuideOpen(true)}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center gap-1"
            >
              <BookOpen size={13} />
              <span>عرض دليل الاستخدام</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-['Cairo',sans-serif]">
      <header className="bg-white shadow border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-blue-600" />
            <h1 className="text-xl font-black text-gray-900">لوحة التحكم - طنطاوي جروب</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setQuickPhoneInput(whatsappNumber);
                setShowPhoneModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
              title="اضغط لتعديل رقم واتساب المبيعات فوراً"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>واتساب الطلبات:</span>
              <span className="font-mono text-emerald-800" dir="ltr">{whatsappNumber || '201521800000'}</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md font-bold">تعديل ⚙️</span>
            </button>
            <button
              onClick={() => setIsUserGuideOpen(true)}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg font-bold text-xs transition flex items-center gap-1.5"
            >
              <BookOpen size={14} />
              <span>دليل الاستخدام 📖</span>
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* Quick WhatsApp Edit Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-right">
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Supabase Live Connection & Demo Data Control Bar */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md border border-blue-800/40">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-sm sm:text-base font-black text-white">
                قاعدة بيانات سوبابيز مربوطة مباشرة ومستمرة
              </strong>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                Live Supabase Connected
              </span>
            </div>
            <p className="text-xs text-blue-200">
              يوجد حالياً <strong className="text-yellow-300 font-mono font-black">{stats.total_products || appProducts.length}</strong> صنف بقاعدة البيانات، ويتم استرداد الصور والأصناف تلقائياً فوراً للزوار.
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatCard title="إجمالي الزوار" value={stats.total_visitors} icon={<span>👥</span>} subtitle={stats.today_visitors + ' اليوم'} color="blue" />
          <StatCard title="نقرات الواتساب" value={stats.total_whatsapp_clicks} icon={<span>📱</span>} subtitle="ضغط على رابط الشراء" color="green" />
          <StatCard title="إجمالي الطلبات" value={stats.total_orders} icon={<span>🛒</span>} subtitle={stats.today_orders + ' اليوم'} color="purple" />
          <StatCard title="إجمالي المنتجات" value={stats.total_products} icon={<span>📦</span>} subtitle="في قاعدة البيانات" color="orange" />
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
          {[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'cms', label: 'تخصيص الواجهة ورقم الواتساب 🎨📱' },
            { id: 'excel', label: 'شيت جوجل ورفع إكسل (9 أعمدة) 📊' },
            { id: 'products', label: 'المنتجات' },
            { id: 'orders', label: `طلبات وفواتير العملاء (${orders.length}) 🛒` },
            { id: 'visitors', label: 'الزوار' },
            { id: 'clicks', label: 'نقرات الواتساب' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab orders={orders} recentVisitors={recentVisitors} />}
        {activeTab === 'cms' && <HomePageCMS />}
        {activeTab === 'excel' && <ExcelUpload />}
        {activeTab === 'products' && <ProductsTab products={products} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} onRefresh={loadData} />}
        {activeTab === 'visitors' && <VisitorsTab stats={stats} recentVisitors={recentVisitors} />}
        {activeTab === 'clicks' && <ClicksTab stats={stats} recentClicks={recentClicks} />}
      </div>
    </div>
  );
};