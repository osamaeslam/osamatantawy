import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { MobilePWAInstallBanner } from './components/MobilePWAInstallBanner';
import { FloatingHotlineButton } from './components/FloatingHotlineButton';
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
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { WhatsAppChatWidget } from './components/WhatsAppChatWidget';
import { AdminDashboard } from './components/AdminDashboard';
import { BrandPage } from './components/BrandPage';
import { Smartphone, Monitor, ArrowLeft, Building2 } from 'lucide-react';
import { visitorService } from './supabase/visitor.service';

const MainLayout: React.FC = () => {
  const { activeTab, viewMode, setViewMode, isOrderTrackingOpen, setIsOrderTrackingOpen, trackingPhone } = useApp();
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // تتبع الزائر عند تحميل الصفحة
  React.useEffect(() => {
    visitorService.trackVisit(window.location.pathname, undefined, navigator.userAgent);
  }, []);

  // إذا تم اختيار ماركة، عرض صفحة المarka مباشرة
  if (selectedBrand) {
    return (
      <div className="min-h-screen bg-gray-50 font-['Cairo',sans-serif]">
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedBrand(null)}
              className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
            >
              <ArrowLeft size={18} /> العودة
            </button>
            <h1 className="text-xl font-black text-blue-900">{selectedBrand}</h1>
            <button
              onClick={() => setShowAdmin(true)}
              className="hidden md:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-200"
            >
              <Building2 size={12} />
              <span>عن الشركة</span>
            </button>
          </div>
        </header>

        <BrandPage brandName={selectedBrand} />

        {/* Admin Dashboard Overlay */}
        {showAdmin && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">لوحة التحكم - طنطاوي جروب</h2>
                <button
                  onClick={() => setShowAdmin(false)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  title="إغلاق"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminDashboard />
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

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
            <Smartphone size={16} className="text-blue-500" />
            <span>محاكي تطبيق طنطاوي جروب (Tantawy Group Mobile App)</span>
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

          {/* Mobile Install Top Banner */}
          <MobilePWAInstallBanner />

          {/* App Header */}
          <Header />

          {/* Scrollable Screen Content */}
          <main className="flex-1 overflow-y-auto px-3 py-4 pb-20 bg-gray-50 no-scrollbar relative">
            {renderContent()}
          </main>

          {/* Phone Bottom Navigation */}
          <BottomNavigation />

          {/* Floating Hotline Button */}
          <FloatingHotlineButton />
        </div>

        {/* Modals */}
        <ProductDetailModal />
        <AboutCompanyModal />
        <CheckoutModal />
        <AuthModal />
        <OrderTrackingModal
          isOpen={isOrderTrackingOpen}
          onClose={() => setIsOrderTrackingOpen(false)}
          initialPhone={trackingPhone}
        />
      </div>
    );
  }

  // Full-width Responsive Web & Real Mobile View
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-['Cairo',sans-serif]">
      {/* Mobile PWA Installation Banner */}
      <MobilePWAInstallBanner />

      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8 w-full">
        {renderContent()}
      </main>

      <Footer onOpenAdmin={() => setShowAdmin(true)} />
      <BottomNavigation />
      <FloatingHotlineButton />

      {/* WhatsApp Chat Widget */}
      <WhatsAppChatWidget phoneNumber="+201521800000" />

      {/* Admin Dashboard Overlay */}
      {showAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">لوحة التحكم - طنطاوي جروب</h2>
              <button
                onClick={() => setShowAdmin(false)}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                title="إغلاق"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminDashboard />
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <ProductDetailModal />
      <AboutCompanyModal />
      <CheckoutModal />
      <AuthModal />
      <OrderTrackingModal
        isOpen={isOrderTrackingOpen}
        onClose={() => setIsOrderTrackingOpen(false)}
        initialPhone={trackingPhone}
      />
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
