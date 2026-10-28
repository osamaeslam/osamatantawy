import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtitle, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    green: 'bg-green-50 text-green-900 border-green-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
    orange: 'bg-orange-50 text-orange-900 border-orange-200',
  };

  return (
    <div className={`p-6 rounded-2xl shadow border ${colorMap[color]}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-1">{title}</p>
          <p className="text-3xl font-black">{value}</p>
        </div>
        <div className="p-2 bg-white/50 rounded-lg">{icon}</div>
      </div>
      <p className="text-xs text-gray-600">{subtitle}</p>
    </div>
  );
};