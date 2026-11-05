import React, { useState } from 'react';
import type { FirebaseOrder } from '../types/firebase';
import { SmartOrderPricingModal } from './SmartOrderPricingModal';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Truck, 
  FileText, 
  PhoneCall, 
  MessageCircle, 
  Users, 
  Package, 
  Sparkles,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { normalizeWhatsAppNumber } from '../services/whatsapp-order';

interface OverviewTabProps {
  orders: FirebaseOrder[];
  recentVisitors: any[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ orders, recentVisitors }) => {
  const [selectedOrderForPricing, setSelectedOrderForPricing] = useState<FirebaseOrder | null>(null);

  // Financial and Operational Calculations
  const totalSales = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const pendingOrders = orders.filter((o) => !o.status || o.status === 'pending');
  const pricedOrders = orders.filter((o) => o.status === 'priced');
  const confirmedOrders = orders.filter((o) => o.status === 'confirmed' || o.status === 'dispatched');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  const averageOrderValue = orders.length > 0 ? Math.round(totalSales / orders.length) : 0;

  return (
    <div className="space-y-6">
      {/* Commercial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Value */}
        <div className="bg-gradient-to-br from-blue-950 to-blue-900 text-white p-5 rounded-3xl shadow-sm border border-blue-800 space-y-2">
          <div className="flex items-center justify-between text-blue-200">
            <span className="text-xs font-bold">إجمالي قيمة المبيعات المسجلة</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-yellow-300">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {totalSales.toLocaleString('ar-EG')} <span className="text-xs font-normal text-blue-200">ج.م</span>
          </div>
          <div className="text-[11px] text-blue-200 flex items-center justify-between pt-1 border-t border-white/10">
            <span>متوسط الأوردر:</span>
            <strong className="font-mono text-yellow-300">{averageOrderValue.toLocaleString('ar-EG')} ج.م</strong>
          </div>
        </div>

        {/* Pending Pricing */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-amber-200 space-y-2">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-black">طلبات بانتظار التسعير</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600">
            {pendingOrders.length} <span className="text-xs font-normal text-gray-500">طلب</span>
          </div>
          <p className="text-[11px] text-amber-700 font-bold">
            بحاجة لتحديد الأسعار وإرسال الفاتورة للعميل
          </p>
        </div>

        {/* Confirmed for Shipping */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-blue-200 space-y-2">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-xs font-black">طلبات قيد التجهيز والشحن</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-950">
            {confirmedOrders.length} <span className="text-xs font-normal text-gray-500">طلب</span>
          </div>
          <p className="text-[11px] text-blue-800 font-bold">
            تم تأكيد الشراء مع العميل وجاهزة للمندوب
          </p>
        </div>

        {/* Delivered & Completed */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-black">طلبات تم تسليمها بنجاح</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
            {deliveredOrders.length} <span className="text-xs font-normal text-gray-500">طلب</span>
          </div>
          <p className="text-[11px] text-emerald-800 font-bold">
            تم الفحص وسداد القيمة عند الاستلام
          </p>
        </div>
      </div>

      {/* Operational Delivery Policy Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black">
              مدة التوصيل المعتمدة للطلبيات: من يومين إلى 7 أيام عمل
            </h4>
            <p className="text-[11px] text-emerald-800">
              يتم التوصيل لكافة المحافظات بعد الاتصال وتأكيد الأوردر مع إتاحة الفحص الكامل للأجهزة واستلام كارت الفاتورة قبل السداد.
            </p>
          </div>
        </div>
        <div className="text-xs bg-white px-3 py-1.5 rounded-xl border border-emerald-200 font-bold text-emerald-900 shrink-0">
          دفع عند الاستلام بعد المعاينة ✓
        </div>
      </div>

      {/* Main Grid: Orders Management Table & Real-Time Visitors Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Orders Table */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <FileText className="text-blue-900" size={18} />
                <span>أحدث طلبيات وفواتير العملاء</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                اضغط على أي طلب لتسعيره، تعديل أصنافه، وتصدير كارت الفاتورة PDF
              </p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-900 font-bold px-2.5 py-1 rounded-full font-mono">
              {orders.length} طلبات
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <th className="p-2.5">رقم الطلب</th>
                  <th className="p-2.5">العميل والموبايل</th>
                  <th className="p-2.5">الأصناف المطلوبة</th>
                  <th className="p-2.5 text-center">القيمة</th>
                  <th className="p-2.5 text-center">الحالة</th>
                  <th className="p-2.5 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 8).map((o) => {
                  const isPriced = o.totalPrice && o.totalPrice > 0;
                  return (
                    <tr key={o.id} className="hover:bg-blue-50/40 transition">
                      <td className="p-2.5 font-mono font-bold text-blue-900">
                        #{o.orderId}
                      </td>
                      <td className="p-2.5">
                        <strong className="text-gray-900 block">{o.customerName}</strong>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-gray-500" dir="ltr">{o.customerPhone}</span>
                          <a
                            href={`https://wa.me/${normalizeWhatsAppNumber(o.customerPhone)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700"
                            title="مراسلة واتساب"
                          >
                            <MessageCircle size={12} />
                          </a>
                        </div>
                      </td>
                      <td className="p-2.5 max-w-[200px]">
                        <span className="truncate block font-medium text-gray-800">
                          {o.productNameAr}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          {new Date(o.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-black text-gray-900">
                        {isPriced ? `${o.totalPrice?.toLocaleString('ar-EG')} ج.م` : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px]">قيد التسعير</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            o.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : o.status === 'priced'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : o.status === 'confirmed'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : o.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {o.status === 'pending'
                            ? 'بانتظار التسعير'
                            : o.status === 'priced'
                            ? 'تم التسعير'
                            : o.status === 'confirmed'
                            ? 'مؤكد للشحن'
                            : o.status === 'delivered'
                            ? 'تم التسليم'
                            : 'ملغي'}
                        </span>
                      </td>
                      <td className="p-2.5 text-left">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForPricing(o)}
                          className="bg-blue-900 hover:bg-blue-950 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1"
                        >
                          <Sparkles size={12} className="text-yellow-400" />
                          <span>كارت الفاتورة 📄</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400 font-bold">
                      لا توجد طلبات واردة بعد. ستظهر هنا فور تسجيل العميل لأي طلب.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Live Visitors & Operational Activity */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-gray-200 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Users className="text-blue-900" size={18} />
                <span>الزوار والنشاط اللحظي</span>
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-2">
              {recentVisitors.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-6 font-bold">
                  جاري تسجيل تفاعل الزوار لحظياً...
                </p>
              ) : (
                recentVisitors.slice(0, 6).map((v, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <span className="font-bold text-gray-800 truncate max-w-[150px]">
                      {v.page_visited || 'تصفح المتجر'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono" dir="ltr">
                      {new Date(v.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Support & Hotline Card */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between font-black text-blue-950">
              <span>مركز اتصالات طنطاوي:</span>
              <span className="bg-yellow-400 text-blue-950 px-2 py-0.5 rounded font-mono font-bold">15218</span>
            </div>
            <p className="text-[11px] text-blue-900 leading-relaxed">
              الدعم الفني واستقبال تأكيدات الشحن ومتابعة المندوبين متاح يومياً.
            </p>
          </div>
        </div>

      </div>

      {/* Smart Order Pricing Modal Trigger */}
      {selectedOrderForPricing && (
        <SmartOrderPricingModal
          isOpen={Boolean(selectedOrderForPricing)}
          onClose={() => setSelectedOrderForPricing(null)}
          order={selectedOrderForPricing}
          onOrderUpdated={(updated) => {
            setSelectedOrderForPricing(null);
          }}
        />
      )}
    </div>
  );
};