import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Grid, Zap, ShoppingBag, Truck } from 'lucide-react';
import { STOREFRONT_TEXT } from '../i18n/translations';

interface NavItem {
  id: 'home' | 'categories' | 'deals' | 'cart' | 'tracking';
  label: string;
  icon: any;
  isDeal?: boolean;
  badge?: number;
}

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, cartCount, setIsOrderTrackingOpen, language } = useApp();
  const t = STOREFRONT_TEXT[language].nav;

  const navItems: NavItem[] = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'categories', label: t.categories, icon: Grid },
    { id: 'deals', label: t.deals, icon: Zap, isDeal: true },
    { id: 'cart', label: t.cart, icon: ShoppingBag, badge: cartCount },
    { id: 'tracking', label: t.tracking, icon: Truck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-3 md:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.08)] select-none">
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
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 active:scale-90 relative ${
                isActive ? 'text-blue-900 font-bold' : 'text-gray-500 hover:text-gray-900 font-medium'
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
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
