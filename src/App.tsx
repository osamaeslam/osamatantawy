import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { HomePage } from './components/HomePage';
import { CategoriesPage } from './components/CategoriesPage';
import { DealsPage } from './components/DealsPage';
import { CartPage } from './components/CartPage';
import { ProfilePage } from './components/ProfilePage';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AboutCompanyModal } from './components/AboutCompanyModal';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { Smartphone, Monitor } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, viewMode, setViewMode } = useApp();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'categories':
        return <CategoriesPage />;
      case 'deals':
        return <DealsPage />;
      case 'cart':
        return <CartPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  // If user selected mobile mockup mode
  if (viewMode === 'mobile') {
    return (
      <div className="min-h-screen bg-neutral-900 py-4 sm:py-8 px-2 flex flex-col items-center justify-center font-['Cairo',sans-serif]">
        {/* Top Control Bar for Mobile Mode */}
        <div className="w-full max-w-sm mb-3 flex items-center justify-between text-white text-xs px-2">
          <div className="flex items-center gap-1.5 font-bold">
            <Smartphone size={16} className="text-red-500" />
            <span>محاكي تطبيق رنين (Mobile App Shell)</span>
          </div>
          <button
            onClick={() => setViewMode('web')}
            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1"
          >
            <Monitor size={13} />
            <span>تبديل لمتجر ويب كامل</span>
          </button>
        </div>

        {/* Smartphone Shell Frame */}
        <div className="w-full max-w-[420px] h-[860px] bg-white rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-[10px] border-neutral-800 overflow-hidden relative flex flex-col">
          {/* Phone Dynamic Island / Notch */}
          <div className="bg-neutral-800 h-6 w-full flex items-center justify-center relative shrink-0">
            <div className="w-24 h-4 bg-neutral-950 rounded-full" />
          </div>

          {/* App Header */}
          <Header />

          {/* Scrollable Screen Content */}
          <main className="flex-1 overflow-y-auto px-3 py-4 bg-gray-50 no-scrollbar">
            {renderContent()}
          </main>

          {/* Phone Bottom Navigation */}
          <BottomNavigation />
        </div>

        {/* Modals */}
        <ProductDetailModal />
        <AboutCompanyModal />
        <CheckoutModal />
        <AuthModal />
      </div>
    );
  }

  // Full-width Responsive Web View
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-['Cairo',sans-serif]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {renderContent()}
      </main>

      <Footer />
      <BottomNavigation />

      {/* Global Modals */}
      <ProductDetailModal />
      <AboutCompanyModal />
      <CheckoutModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
