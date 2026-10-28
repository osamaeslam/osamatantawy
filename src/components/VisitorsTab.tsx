import React from 'react';

interface VisitorsTabProps {
  stats: any;
  recentVisitors: any[];
}

export const VisitorsTab: React.FC<VisitorsTabProps> = ({ stats, recentVisitors }) => (
  <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
    <h3 className="text-lg font-bold mb-4">إحصائيات الزوار</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-blue-800 text-xs font-bold uppercase mb-1">إجمالي الزوار</p>
        <p className="text-2xl font-black text-blue-900">{stats.total_visitors}</p>
      </div>
      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
        <p className="text-green-800 text-xs font-bold uppercase mb-1">زوار اليوم</p>
        <p className="text-2xl font-black text-green-900">{stats.today_visitors}</p>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-2 text-left text-xs font-bold text-gray-500">الصفحة visited</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">التاريخ</th>
            <th className="p-2 text-left text-xs font-bold text-gray-500">المتصفح</th>
          </tr>
        </thead>
        <tbody>
          {recentVisitors.map((v, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="p-2 text-left text-sm">{v.page_visited}</td>
              <td className="p-2 text-left text-sm">{new Date(v.created_at).toLocaleString('ar-EG')}</td>
              <td className="p-2 text-left text-sm">{v.user_agent?.split(' ')[0] || 'غير معروف'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);