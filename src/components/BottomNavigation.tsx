import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Grid, Zap, ShoppingBag, Truck } from 'lucide-react';

interface NavItem {
  id: 'home' | 'categories' | 'deals' | 'cart' | 'tracking';
  label: string;
  icon: any;
  isDeal?: boolean;
  badge?: number;
}

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, cartCount, setIsOrderTrackingOpen } = useApp();

  const navItems: NavItem[] = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'categories', label: 'الأقسام', icon: Grid },
    { id: 'deals', label: 'العروض', icon: Zap, isDeal: true },
    { id: 'cart', label: 'المعاينة', icon: ShoppingBag, badge: cartCount },
    { id: 'tracking', label: 'تتبع الطلب', icon: Truck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 py-1.5 px-3 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === (item.id as any);
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'tracking') {
                  setIsOrderTrackingOpen(true);
                } else {
                  setActiveTab(item.id as any);
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
                isActive ? 'text-blue-900 font-bold scale-105' : 'text-gray-500 hover:text-gray-900 font-medium'
              }`}
            >
              <div className="relative">
                {item.isDeal ? (
                  <div className={`p-1 rounded-full ${isActive ? 'bg-blue-900 text-white shadow-md' : 'text-blue-700'}`}>
                    <Zap size={20} className={isActive ? 'fill-white' : 'fill-blue-700'} />
                  </div>
                ) : (
                  <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
                )}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-blue-900 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
