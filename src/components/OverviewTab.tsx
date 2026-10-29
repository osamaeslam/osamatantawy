import React from 'react';
import type { FirebaseOrder } from '../types/firebase';

interface OverviewTabProps {
  orders: FirebaseOrder[];
  recentVisitors: any[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ orders, recentVisitors }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow border border-gray-200">
      <h3 className="text-lg font-bold mb-4">آخر الطلبات</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-2 text-left text-xs font-bold text-gray-500">رقم الطلب</th>
              <th className="p-2 text-left text-xs font-bold text-gray-500">اسم المنتج</th>
              <th className="p-2 text-left text-xs font-bold text-gray-500">العميل</th>
              <th className="p-2 text-left text-xs font-bold text-gray-500">المبلغ</th>
              <th className="p-2 text-left text-xs font-bold text-gray-500">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 10).map((o) => (
              <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-2 text-left text-sm">{o.orderId}</td>
                <td className="p-2 text-left text-sm">{o.productNameAr}</td>
                <td className="p-2 text-left text-sm">{o.customerName}</td>
                <td className="p-2 text-left text-sm font-bold">{o.totalPrice} ج</td>
                <td className="p-2 text-left text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      o.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                        : o.status === 'confirmed' ? 'bg-blue-100 text-blue-700'
                          : o.status === 'delivered' ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
      <h3 className="text-lg font-bold mb-4">آخر الزوار</h3>
      <div className="space-y-3">
        {recentVisitors.length === 0 ? (
          <p className="text-gray-500 text-sm">لا توجد بيانات زوار بعد</p>
        ) : (
          recentVisitors.map((v, i) => (
            <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <span className="text-sm">{v.page_visited}</span>
              <span className="text-xs text-gray-500">{new Date(v.created_at).toLocaleString('ar-EG')}</span>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);