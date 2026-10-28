import React, { useState, useEffect } from 'react';
import { ExcelUpload } from './ExcelUpload';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { visitorService } from '../supabase/visitor.service';
import { whatsappClickService } from '../supabase/whatsapp-click.service';
import { orderService } from '../supabase/orders.service';
import { productService } from '../supabase/products.service';
import type { FirebaseProduct } from '../types/firebase';
import type { FirebaseOrder } from '../types/firebase';
import { Package } from 'lucide-react';
import { StatCard } from './StatCard';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'visitors' | 'clicks' | 'excel'>('overview');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <h1 className="text-2xl font-black text-gray-900 mb-2">لوحة تحكم طنطاوي جروب</h1>
          <p className="text-gray-600 mb-6">يرجى إدخال كلمة المرور للدخول</p>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={() => {
              if (adminPassword === 'tantawy123') setIsAuthenticated(true);
              else alert('كلمة مرور خاطئة');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            تسجيل الدخول
          </button>
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