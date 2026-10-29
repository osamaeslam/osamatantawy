import React from 'react';

interface ClicksTabProps {
  stats: any;
  recentClicks: any[];
}

export const ClicksTab: React.FC<ClicksTabProps> = ({ stats, recentClicks }) => (
  <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
    <h3 className="text-lg font-bold mb-4">نقرات رابط الواتساب</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
        <p className="text-green-800 text-xs font-bold uppercase mb-1">إجمالي النقرات</p>
        <p className="text-2xl font-black text-green-900">{stats.total_whatsapp_clicks}</p>
      </div>
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-blue-800 text-xs font-bold uppercase mb-1">نقرات اليوم</p>
        <p className="text-2xl font-black text-blue-900">{stats.today_visitors}</p>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-2 text-left text-xs font-bold text-gray-500">المنتج</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {recentClicks.map((c, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="p-2 text-left text-sm">{c.product_name_ar || 'غير محدد'}</td>
              <td className="p-2 text-left text-sm">{new Date(c.clicked_at).toLocaleString('ar-EG')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);