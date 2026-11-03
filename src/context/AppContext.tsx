import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, OrderItem, UserProfile, HomePageConfig, CategoryItem } from '../types';
import { PRODUCTS, CATEGORIES, INITIAL_ORDERS, INITIAL_USER, PROMO_CODES, INITIAL_HOMEPAGE_CONFIG } from '../data/mockData';
import { normalizeImageUrl } from '../services/image-url';
import { supabase } from '../supabase/config';
import { mapSupabaseToProduct } from '../supabase/product-mapper';
import { siteConfigService } from '../supabase/siteConfig.service';
import { categoryService } from '../supabase/categories.service';

/** يضمن أن صور المنتجات (من الشيت/الدريفي/المخزّن) قابلة للعرض مباشرة */
const withNormalizedImages = (list: Product[]): Product[] =>
  (list || []).map((p) => ({
    ...p,
    previewimage: normalizeImageUrl(p.previewimage),
    imageLink: normalizeImageUrl(p.imageLink),
    previewimages: Array.isArray(p.previewimages)
      ? p.previewimages.map((u) => normalizeImageUrl(u))
      : p.previewimages,
  }));

interface AppContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  importProducts: (newProducts: Product[]) => void;
  resetProductsToDefault: () => void;
  hideDemoProducts: boolean;
  setHideDemoProducts: (hide: boolean) => void;
  isSyncingWithDatabase: boolean;
  fetchProductsFromDatabase: () => Promise<void>;
  supabaseProductCount: number;
  homePageConfig: HomePageConfig;
  updateHomePageConfig: (config: HomePageConfig) => void;
  saveHomePageConfigToDatabase: (config: HomePageConfig) => Promise<void>;
  refreshHomePageConfigFromDatabase: () => Promise<void>;
  categories: CategoryItem[];
  categoriesLoading: boolean;
  refreshCategoriesFromDatabase: () => Promise<void>;
  addCategory: (item: CategoryItem) => Promise<void>;
  editCategory: (id: number, item: Partial<CategoryItem>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  whatsappNumber: string;
  updateWhatsAppNumber: (phone: string) => void;
  cart: CartItem[];
  wishlist: Product[];
  activeTab: 'home' | 'categories' | 'deals' | 'cart';
  setActiveTab: (tab: 'home' | 'categories' | 'deals' | 'cart') => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  selectedSubcategory: string | null;
  setSelectedSubcategory: (sub: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  isAboutModalOpen: boolean;
  setIsAboutModalOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  isOrderTrackingOpen: boolean;
  setIsOrderTrackingOpen: (open: boolean) => void;
  isUserGuideOpen: boolean;
  setIsUserGuideOpen: (open: boolean) => void;
  trackingPhone: string;
  setTrackingPhone: (phone: string) => void;
  user: UserProfile;
  isLoggedIn: boolean;
  orders: OrderItem[];
  viewMode: 'mobile' | 'web';
  setViewMode: (mode: 'mobile' | 'web') => void;
  discountCode: string;
  discountPercent: number;
  addToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  createOrder: (address: string, paymentMethod: string) => OrderItem | null;
  cartTotal: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartCount: number;
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  addProductReview: (productId: string, review: { customername: string; comment: string; rating: number; revieweddate: string }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideDemoProducts, setHideDemoProductsState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tantawy_hide_demo_products') === 'true';
    } catch {
      return false;
    }
  });

  const [isSyncingWithDatabase, setIsSyncingWithDatabase] = useState(false);
  const [supabaseProductCount, setSupabaseProductCount] = useState(0);

  // Products initialized from localStorage or default
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('tantawy_custom_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return withNormalizedImages(parsed);
      }
    } catch (e) {
      console.warn('Fallback to default products:', e);
    }
    return withNormalizedImages(PRODUCTS);
  });

  // مزامنة فورية ومباشرة مع قاعدة بيانات سوبابيز
  const fetchProductsFromDatabase = async () => {
    setIsSyncingWithDatabase(true);
    try {
      const dbItems: any[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: false })
          .range(offset, offset + 999);
        if (error) throw error;
        dbItems.push(...(data || []));
        if (!data || data.length < 1000) break;
      }

      if (dbItems.length > 0) {
        setSupabaseProductCount(dbItems.length);
        const mapped = dbItems.map((item, idx) => mapSupabaseToProduct(item, idx));
        setProducts(mapped);
        try {
          // حفظ نسخة احتياطية محلية
          localStorage.setItem('tantawy_custom_products', JSON.stringify(mapped.slice(0, 100)));
        } catch {
          // ignore quota limits
        }
      }
    } catch (err) {
      console.warn('Live Supabase products fetch error:', err);
    } finally {
      setIsSyncingWithDatabase(false);
    }
  };

  // تشغيل المزامنة المباشرة مع قاعدة البيانات فور فتح التطبيق
  useEffect(() => {
    fetchProductsFromDatabase();
  }, []);

  const setHideDemoProducts = (hide: boolean) => {
    setHideDemoProductsState(hide);
    try {
      localStorage.setItem('tantawy_hide_demo_products', hide ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
    if (hide) {
      // إخفاء البيانات التجريبية والاعتماد على قاعدة البيانات
      fetchProductsFromDatabase();
    } else {
      resetProductsToDefault();
    }
  };

  // Homepage CMS Config
  const [homePageConfig, setHomePageConfig] = useState<HomePageConfig>(() => {
    try {
      const saved = localStorage.getItem('tantawy_homepage_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.heroBanners && Array.isArray(parsed.heroBanners)) return parsed;
      }
    } catch (e) {
      console.warn('Fallback to default home config:', e);
    }
    return INITIAL_HOMEPAGE_CONFIG;
  });

  // Categories (from database, fallback to defaults)
  const [categories, setCategories] = useState<CategoryItem[]>(CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'deals' | 'cart'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [trackingPhone, setTrackingPhone] = useState('');
  const [user] = useState<UserProfile>(INITIAL_USER);
  const [isLoggedIn] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [viewMode, setViewMode] = useState<'mobile' | 'web'>('web');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // رقم الواتساب المعتمد لتلقي الطلبات والفواتير
  const [whatsappNumber, setWhatsappNumber] = useState<string>(() => {
    try {
      const direct = localStorage.getItem('tantawy_whatsapp_number');
      if (direct) return direct;
      const directSales = localStorage.getItem('tantawy_sales_whatsapp');
      if (directSales) return directSales;
      const saved = localStorage.getItem('tantawy_homepage_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.whatsappNumber) return parsed.whatsappNumber;
      }
    } catch (e) {
      console.warn('Fallback to default whatsapp:', e);
    }
    return INITIAL_HOMEPAGE_CONFIG.whatsappNumber || '201521800000';
  });

 const updateWhatsAppNumber = async (newNumber: string) => {
    const trimmed = newNumber.trim();
    setWhatsappNumber(trimmed);
    
    // Save to localStorage for immediate access (fast, works offline)
    try {
      localStorage.setItem('tantawy_whatsapp_number', trimmed);
      localStorage.setItem('tantawy_sales_whatsapp', trimmed);
      localStorage.setItem('tantawy_sales_phone', trimmed);
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    // Save to Supabase for cross-device sync and persistence (async, doesn't block UI)
    try {
      const { error } = await supabase
        .from('site_configs')
        .upsert({ key: 'whatsapp_sales_number', value: trimmed }, { onConflict: 'key' });

      if (error) {
        console.warn('Failed to save to Supabase, localStorage will persist:', error.message);
      }
    } catch (e) {
      console.warn('Error saving to Supabase:', e);
    }

    // Update homepage config in localStorage
    try {
      setHomePageConfig(prev => {
        const updated = { ...prev, whatsappNumber: trimmed };
        localStorage.setItem('tantawy_homepage_config', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Error updating homepage config:', e);
    }
  };

  // تحديث محتوى الصفحة الرئيسية وحفظه
  const updateHomePageConfig = (newConfig: HomePageConfig) => {
    setHomePageConfig(newConfig);
    if (newConfig.whatsappNumber) {
      const trimmed = newConfig.whatsappNumber.trim();
      setWhatsappNumber(trimmed);
      try {
        localStorage.setItem('tantawy_whatsapp_number', trimmed);
        localStorage.setItem('tantawy_sales_whatsapp', trimmed);
        localStorage.setItem('tantawy_sales_phone', trimmed);
      } catch (e) {
        console.error(e);
      }
    }
    try {
      localStorage.setItem('tantawy_homepage_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error('Error saving homepage config:', e);
    }
  };

  // حفظ إعدادات الصفحة الرئيسية في قاعدة البيانات (Supabase)
  const saveHomePageConfigToDatabase = async (config: HomePageConfig) => {
    // تحديث الحالة والمحلي أولاً (فوري)
    updateHomePageConfig(config);
    // ثم الحفظ في قاعدة البيانات
    await siteConfigService.saveHomePageConfig(config);
  };

  // جلب إعدادات الصفحة الرئيسية (بنرات/خط ساخن/واتساب) من قاعدة البيانات
  const refreshHomePageConfigFromDatabase = async () => {
    try {
      const dbConfig = await siteConfigService.getHomePageConfig();
      if (!dbConfig) return;

      setHomePageConfig((prev) => {
        // استخدام بيانات القاعدة إذا وجدت، وإلا الاحتفاظ بالافتراضي
        const merged: HomePageConfig = {
          announcementText: dbConfig.announcementText ?? prev.announcementText,
          hotline: dbConfig.hotline ?? prev.hotline,
          whatsappNumber: dbConfig.whatsappNumber ?? prev.whatsappNumber,
          heroBanners:
            dbConfig.heroBanners && dbConfig.heroBanners.length > 0
              ? dbConfig.heroBanners
              : prev.heroBanners,
        };
        try {
          localStorage.setItem('tantawy_homepage_config', JSON.stringify(merged));
          if (merged.whatsappNumber) {
            localStorage.setItem('tantawy_whatsapp_number', merged.whatsappNumber);
          }
        } catch { /* ignore */ }
        return merged;
      });

      if (dbConfig.whatsappNumber) {
        setWhatsappNumber(dbConfig.whatsappNumber);
      }
    } catch (err) {
      console.warn('refreshHomePageConfigFromDatabase error:', err);
    }
  };

  // جلب الأقسام من قاعدة البيانات
  const refreshCategoriesFromDatabase = async () => {
    setCategoriesLoading(true);
    try {
      const dbCategories = await categoryService.getAll();
      if (dbCategories && dbCategories.length > 0) {
        setCategories(
          dbCategories.map((c) => ({
            name: c.name,
            nameAr: c.nameAr,
            icon: c.icon,
            image: c.image,
            descriptionAr: c.descriptionAr,
            subcategories: c.subcategories,
            subcategoriesAr: c.subcategoriesAr,
          }))
        );
      }
    } catch (err) {
      console.warn('refreshCategoriesFromDatabase error:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // إضافة قسم جديد
  const addCategory = async (item: CategoryItem) => {
    await categoryService.create(item);
    await refreshCategoriesFromDatabase();
  };

  // تعديل قسم
  const editCategory = async (id: number, item: Partial<CategoryItem>) => {
    await categoryService.update(id, item);
    await refreshCategoriesFromDatabase();
  };

  // حذف قسم
  const deleteCategory = async (id: number) => {
    await categoryService.delete(id);
    await refreshCategoriesFromDatabase();
  };

  // تحميل الأقسام وإعدادات الصفحة الرئيسية من قاعدة البيانات عند البدء
  useEffect(() => {
    refreshCategoriesFromDatabase();
    refreshHomePageConfigFromDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // استيراد منتجات شيت جوجل أو ملف الإكسل
  const importProducts = (newProducts: Product[]) => {
    const normalized = withNormalizedImages(newProducts);
    setProducts(normalized);
    try {
      localStorage.setItem('tantawy_custom_products', JSON.stringify(normalized.slice(0, 100)));
    } catch (e) {
      console.error('Error saving custom products:', e);
    }
  };

  // استعادة المنتجات الأساسية المعتمدة
  const resetProductsToDefault = () => {
    setProducts(PRODUCTS);
    try {
      localStorage.removeItem('tantawy_custom_products');
      localStorage.removeItem('tantawy_hide_demo_products');
    } catch (e) {
      console.error('Error resetting products:', e);
    }
  };

  // تنظيف أي بقايا لجلسات مستخدمين سابقة
  useEffect(() => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('tantawy_user');
      localStorage.removeItem('tantawy_auth');
      localStorage.removeItem('ahmed_user');
      localStorage.removeItem('userProfile');
    } catch (e) {
      // ignore
    }
  }, []);

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => {
    const discountedPrice = item.product.actualprice * (1 - item.product.discountpercent / 100);
    return sum + discountedPrice * item.quantity;
  }, 0);

  const cartDiscount = (cartSubtotal * discountPercent) / 100;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: Product, quantity = 1, selectedSize?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
          selectedSize: selectedSize || next[existingIndex].selectedSize
        };
        return next;
      } else {
        return [...prev, { product, quantity, selectedSize: selectedSize || product.sizevariants?.[0] || product.size }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p.id === productId);
  };

  const applyPromoCode = (code: string) => {
    const upper = code.trim().toUpperCase();
    if (PROMO_CODES[upper]) {
      setDiscountCode(upper);
      setDiscountPercent(PROMO_CODES[upper]);
      return { success: true, message: `تم تفعيل كوبون الخصم بنجاح! خصم ${PROMO_CODES[upper]}%` };
    }
    return { success: false, message: 'كوبون الخصم غير صحيح أو منتهي الصلاحية' };
  };

  const removePromoCode = () => {
    setDiscountCode('');
    setDiscountPercent(0);
  };

  const createOrder = (address: string, paymentMethod: string): OrderItem | null => {
    if (cart.length === 0) return null;
    const newOrder: OrderItem = {
      orderid: `TG-${Math.floor(10000000 + Math.random() * 90000000)}`,
      name: cart[0].product.name,
      nameAr: cart[0].product.nameAr + (cart.length > 1 ? ` (+ ${cart.length - 1} أصناف أخرى)` : ''),
      description: `الدفع بواسطة ${paymentMethod} - العنوان: ${address}`,
      descriptionAr: `الدفع بواسطة ${paymentMethod} - العنوان: ${address}`,
      status: 'Processing',
      productimage: cart[0].product.previewimage || cart[0].product.imageLink || '',
      price: Math.round(cartTotal),
      date: new Date().toISOString().split('T')[0]
    };
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const addProductReview = (
    productId: string, 
    review: { customername: string; comment: string; rating: number; revieweddate: string }
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const newReviews = [review, ...(p.reviews || [])];
        const avg =
          newReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) /
          newReviews.length;
        const updated = {
          ...p,
          reviews: newReviews,
          overallrating: Number(avg.toFixed(1)),
        };
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct(updated);
        }
        return updated;
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        products,
        setProducts,
        importProducts,
        resetProductsToDefault,
        hideDemoProducts,
        setHideDemoProducts,
        isSyncingWithDatabase,
        fetchProductsFromDatabase,
        supabaseProductCount,
        homePageConfig,
        updateHomePageConfig,
        saveHomePageConfigToDatabase,
        refreshHomePageConfigFromDatabase,
        categories,
        categoriesLoading,
        refreshCategoriesFromDatabase,
        addCategory,
        editCategory,
        deleteCategory,
        whatsappNumber,
        updateWhatsAppNumber,
        cart,
        wishlist,
        activeTab,
        setActiveTab,
        selectedCategory,
        setSelectedCategory,
        selectedSubcategory,
        setSelectedSubcategory,
        searchQuery,
        setSearchQuery,
        selectedProduct,
        setSelectedProduct,
        isAboutModalOpen,
        setIsAboutModalOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        isOrderTrackingOpen,
        setIsOrderTrackingOpen,
        isUserGuideOpen,
        setIsUserGuideOpen,
        trackingPhone,
        setTrackingPhone,
        user,
        isLoggedIn,
        orders,
        viewMode,
        setViewMode,
        discountCode,
        discountPercent,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        applyPromoCode,
        removePromoCode,
        createOrder,
        cartTotal,
        cartSubtotal,
        cartDiscount,
        cartCount,
        selectedBrand,
        setSelectedBrand,
        addProductReview,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
