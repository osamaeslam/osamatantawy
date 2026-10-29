import React from 'react';
import type { FirebaseProduct } from '../types/firebase';

interface ProductsTabProps {
  products: FirebaseProduct[];
}

export const ProductsTab: React.FC<ProductsTabProps> = ({ products }) => (
  <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
    <h3 className="text-lg font-bold mb-4">إدارة المنتجات</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-2 text-left text-xs font-bold text-gray-500">الصورة</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">الاسم</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">القسم</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">السعر</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-gray-100">
              <td className="p-2 text-left">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.nameAr} className="w-12 h-12 object-cover rounded border" />
                ) : (
                  <span className="text-xs text-gray-400">لا توجد</span>
                )}
              </td>
              <td className="p-2 text-left text-sm">{p.nameAr}</td>
              <td className="p-2 text-left text-sm">{p.categoryAr}</td>
              <td className="p-2 text-left text-sm font-bold">{p.price} ج</td>
              <td className="p-2 text-left text-sm">
                {p.inStock ? (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">متوفر</span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">نفذ</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);