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
import { Package, Building2 } from 'lucide-react';
import { StatCard } from './StatCard';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'visitors' | 'clicks' | 'excel'>('overview');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const { stats, loading } = useDashboardStats();
  const [products, setProducts] = useState<FirebaseProduct[]>([]);
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [recentClicks, setRecentClicks] = useState<any[]>([]);

  useEffect(() => {
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
    loadData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const admin = await adminAuthService.login(adminUsername, adminPassword);
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

          <div className="mt-4 text-xs text-gray-500 text-center">
            اسم المستخدم: <span className="font-bold">saja</span> | كلمة المرور: <span className="font-bold">osama442</span>
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
            <h1 className="text-xl font-black text-gray-900">لوحة التحكم</h1>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition"
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatCard title="إجمالي الزوار" value={stats.total_visitors} icon={<span>👥</span>} subtitle={stats.today_visitors + ' اليوم'} color="blue" />
          <StatCard title="نقرات الواتساب" value={stats.total_whatsapp_clicks} icon={<span>📱</span>} subtitle="ضغط على رابط الشراء" color="green" />
          <StatCard title="إجمالي الطلبات" value={stats.total_orders} icon={<span>🛒</span>} subtitle={stats.today_orders + ' اليوم'} color="purple" />
          <StatCard title="إجمالي المنتجات" value={stats.total_products} icon={<span>📦</span>} subtitle="في قاعدة البيانات" color="orange" />
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
          {[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'products', label: 'المنتجات' },
            { id: 'orders', label: 'الطلبات' },
            { id: 'visitors', label: 'الزوار' },
            { id: 'clicks', label: 'نقرات الواتساب' },
            { id: 'excel', label: 'رفع اكسل' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <OverviewTab orders={orders} recentVisitors={recentVisitors} />}
        {activeTab === 'products' && <ProductsTab products={products} />}
        {activeTab === 'orders' && <OrdersTab orders={orders} />}
        {activeTab === 'visitors' && <VisitorsTab stats={stats} recentVisitors={recentVisitors} />}
        {activeTab === 'clicks' && <ClicksTab stats={stats} recentClicks={recentClicks} />}
        {activeTab === 'excel' && <ExcelUpload />}
      </div>
    </div>
  );
};