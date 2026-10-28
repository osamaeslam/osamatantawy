import React from 'react';
import type { FirebaseOrder } from '../types/firebase';

interface OrdersTabProps {
  orders: FirebaseOrder[];
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ orders }) => (
  <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
    <h3 className="text-lg font-bold mb-4">إدارة الطلبات</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-2 text-left text-xs font-bold text-gray-500">رقم الطلب</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">العميل</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">التليفون</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">المنتج</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">المبلغ</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-gray-100">
              <td className="p-2 text-left text-sm">{o.orderId}</td>
              <td className="p-2 text-left text-sm">{o.customerName}</td>
              <td className="p-2 text-left text-sm">{o.customerPhone}</td>
              <td className="p-2 text-left text-sm">{o.productNameAr}</td>
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
);