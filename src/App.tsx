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
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AboutCompanyModal } from './components/AboutCompanyModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { UserGuideModal } from './components/UserGuideModal';
import { WhatsAppChatWidget } from './components/WhatsAppChatWidget';
import { AdminDashboard } from './components/AdminDashboard';
import { BrandPage } from './components/BrandPage';
import { ArrowLeft } from 'lucide-react';
import { visitorService } from './supabase/visitor.service';

const MainLayout: React.FC = () => {
  const { 
    activeTab, 
    isOrderTrackingOpen, 
    setIsOrderTrackingOpen, 
    isUserGuideOpen, 
    setIsUserGuideOpen, 
    trackingPhone 
  } = useApp();
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // تتبع الزائر واكتشاف مسار لوحة الإدارة تلقائياً
  React.useEffect(() => {
    visitorService.trackVisit(window.location.pathname, undefined, navigator.userAgent);

    const checkAdminRouting = () => {
      const h = window.location.hash.toLowerCase();
      if (
        window.location.pathname.replace(/\/+$/, '').toLowerCase() === '/admin' ||
        h === '#admin' ||
        h === '#admin-cms' ||
        h === '#cms'
      ) {
        setShowAdmin(true);
      }
    };

    checkAdminRouting();
    window.addEventListener('hashchange', checkAdminRouting);
    return () => window.removeEventListener('hashchange', checkAdminRouting);
  }, []);

  // فتح لوحة الإدارة بشكل كامل وشامل كصفحة مستقلة
  if (showAdmin) {
    return (
      <AdminDashboard 
        onExit={() => {
          setShowAdmin(false);
          if (window.location.hash === '#admin') {
            window.location.hash = '';
          }
          if (window.location.pathname.toLowerCase().includes('/admin')) {
            window.history.pushState(null, '', '/');
          }
        }} 
      />
    );
  }

  // إذا تم اختيار ماركة، عرض صفحة الماركة مباشرة
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
          </div>
        </header>

        <BrandPage brandName={selectedBrand} />
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
      default:
        return <HomePage />;
    }
  };

  // Render pristine edge-to-edge responsive layout with native mobile elegance
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-['Cairo',sans-serif] selection:bg-blue-600 selection:text-white">
      {/* Mobile PWA Installation Banner */}
      <MobilePWAInstallBanner />

      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8 w-full">
        {renderContent()}
      </main>

      <Footer />
      <BottomNavigation />
      <FloatingHotlineButton />

      {/* WhatsApp Chat Widget */}
      <WhatsAppChatWidget phoneNumber="+201521800000" />



      {/* Global Modals */}
      <ProductDetailModal />
      <AboutCompanyModal />
      <CheckoutModal />
      <OrderTrackingModal
        isOpen={isOrderTrackingOpen}
        onClose={() => setIsOrderTrackingOpen(false)}
        initialPhone={trackingPhone}
      />
      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
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
