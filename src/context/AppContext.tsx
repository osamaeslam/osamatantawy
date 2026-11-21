import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, OrderItem, UserProfile, HomePageConfig, CategoryItem, ProductBundle, StockStatus } from '../types';
import { PRODUCTS, CATEGORIES, INITIAL_ORDERS, INITIAL_USER, PROMO_CODES, INITIAL_HOMEPAGE_CONFIG } from '../data/mockData';
import { normalizeImageUrl } from '../services/image-url';
import { supabase } from '../supabase/config';
import { mapSupabaseToProduct } from '../supabase/product-mapper';
import { siteConfigService } from '../supabase/siteConfig.service';
import { categoryService } from '../supabase/categories.service';
import { productService, PagedProductsParams, SLIM_PRODUCT_COLUMNS } from '../supabase/products.service';
import { resolveStockStatus } from '../utils/stockStatus';
import { offlineStoreService } from '../services/offline-store.service';
import { AppLanguage, LANGUAGE_STORAGE_KEY } from '../i18n/translations';

const CATALOG_CACHE_TTL_MS = 15 * 60 * 1000;
const BOOTSTRAP_CACHE_TTL_MS = 10 * 60 * 1000;
const INITIAL_STORE_SLICE = 24;

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
  isLoadingMoreProducts: boolean;
  fetchProductsFromDatabase: (forceRefresh?: boolean) => Promise<void>;
  loadMoreProductsFromDatabase: (pageSize?: number) => Promise<void>;
  mergeProductsIntoState: (incoming: Product[]) => void;
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
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
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
  createOrder: (address: string, paymentMethod: string, orderId?: string) => OrderItem | null;
  cartTotal: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartCount: number;
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  addProductReview: (productId: string, review: { customername: string; comment: string; rating: number; revieweddate: string }) => void;
  bundles: ProductBundle[];
  refreshBundlesFromDatabase: () => Promise<void>;
  saveBundlesToDatabase: (bundles: ProductBundle[]) => Promise<void>;
  addBundleToCart: (bundle: ProductBundle) => void;
  stockStatusMap: Record<string, StockStatus>;
  getProductStockStatus: (product: Pick<Product, 'id' | 'inStock' | 'stockStatus'>) => StockStatus;
  updateProductStockStatus: (productId: string, status: StockStatus) => Promise<void>;
  searchCatalogServer: (params: PagedProductsParams) => Promise<{ products: Product[]; totalCount: number; page: number; pageSize: number }>;
  compareList: Product[];
  isCompareDrawerOpen: boolean;
  setIsCompareDrawerOpen: (open: boolean) => void;
  toggleCompare: (product: Product) => { added: boolean; replacedOldest?: boolean };
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  recentlyViewed: Product[];
  clearRecentlyViewed: () => void;
  posterProduct: Product | null;
  setPosterProduct: (product: Product | null) => void;
  isItemRequestOpen: boolean;
  itemRequestPrefill: string;
  openItemRequestModal: (prefillName?: string) => void;
  closeItemRequestModal: () => void;
  offlineDownloadProgress: { active: boolean; downloaded: number; total: number; completed: boolean };
  startOfflineCatalogDownload: () => Promise<void>;
  cancelOfflineCatalogDownload: () => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideDemoProducts, setHideDemoProductsState] = useState<boolean>(true);
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'ar') return saved;
    } catch {}
    return 'ar';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {}
  }, [language]);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const [isSyncingWithDatabase, setIsSyncingWithDatabase] = useState(false);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const [supabaseProductCount, setSupabaseProductCount] = useState<number>(() => {
    try {
      const meta = localStorage.getItem('tantawy_catalog_meta_v2');
      if (meta) {
        const parsed = JSON.parse(meta);
        if (typeof parsed.count === 'number') return parsed.count;
      }
    } catch {}
    return 0;
  });

  // Products initialized from cached live products or empty array (no demo data)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('tantawy_custom_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return withNormalizedImages(parsed);
      }
    } catch (e) {
      console.warn('Fallback to empty products:', e);
    }
    return [];
  });

  const [offlineDownloadProgress, setOfflineDownloadProgress] = useState<{
    active: boolean;
    downloaded: number;
    total: number;
    completed: boolean;
  }>({ active: false, downloaded: 0, total: 0, completed: false });
  const offlineAbortRef = React.useRef<AbortController | null>(null);

  const mergeProductsIntoState = (incoming: Product[]) => {
    if (!incoming || incoming.length === 0) return;
    const normalized = withNormalizedImages(incoming);
    setProducts((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      for (const item of normalized) {
        byId.set(item.id, item);
      }
      return Array.from(byId.values());
    });
    void offlineStoreService.mergeProducts(normalized);
  };

  // تحميل تدريجي خفيف وموفّر للـ Egress + دعم التصفح أوفلاين من IndexedDB:
  // 1) يقرأ الكتالوج المحفوظ في IndexedDB فوراً بلا انتظار للشبكة
  // 2) عند توفر الإنترنت يتحقق من العدد الإجمالي ويجلب فقط أول 24 صنفاً بأعمدة مضغوطة
  const fetchProductsFromDatabase = async (forceRefresh = false) => {
    setIsSyncingWithDatabase(true);
    try {
      // ترطيب فوري من IndexedDB قبل أي استدعاء للشبكة
      const idbProducts = await offlineStoreService.getAllProducts();
      if (idbProducts.length > 0) {
        setProducts((prev) => (idbProducts.length >= prev.length ? idbProducts : prev));
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsSyncingWithDatabase(false);
        return;
      }

      if (!forceRefresh) {
        try {
          const metaRaw = localStorage.getItem('tantawy_catalog_meta_v2');
          const cachedRaw = localStorage.getItem('tantawy_custom_products');
          if (metaRaw && (idbProducts.length > 0 || cachedRaw)) {
            const meta = JSON.parse(metaRaw);
            const isFresh = typeof meta.ts === 'number' && Date.now() - meta.ts < CATALOG_CACHE_TTL_MS;
            if (isFresh) {
              const liveCount = await productService.getTotalCount();
              setSupabaseProductCount(liveCount);
              if (meta.count === liveCount) {
                if (idbProducts.length === 0 && cachedRaw) {
                  const cachedList = JSON.parse(cachedRaw);
                  if (Array.isArray(cachedList) && cachedList.length > 0) {
                    const norm = withNormalizedImages(cachedList);
                    setProducts(norm);
                    void offlineStoreService.mergeProducts(norm);
                  }
                }
                setIsSyncingWithDatabase(false);
                return;
              }
            }
          }
        } catch {
          // ignore cache read issues
        }
      }

      const { data: firstPage, count, error } = await supabase
        .from('products')
        .select(SLIM_PRODUCT_COLUMNS, { count: 'exact' })
        .order('id', { ascending: false })
        .range(0, INITIAL_STORE_SLICE - 1);

      if (error) throw error;

      const total = count ?? (firstPage?.length || 0);
      setSupabaseProductCount(total);

      const firstMapped = withNormalizedImages(
        (firstPage || []).map((item, idx) => mapSupabaseToProduct(item, idx))
      );

      // ندمج الدفعة الحديثة مع أي أصناف مخزنة أوفلاين حتى لا يفقد المستخدم تصفحه المحفوظ
      setProducts((prev) => {
        if (forceRefresh) return firstMapped;
        const byId = new Map<string, Product>();
        firstMapped.forEach((p) => byId.set(p.id, p));
        prev.forEach((p) => {
          if (!byId.has(p.id)) byId.set(p.id, p);
        });
        return Array.from(byId.values());
      });

      if (firstMapped.length > 0) {
        await offlineStoreService.mergeProducts(firstMapped);
      }

      try {
        if (firstMapped.length > 0) {
          localStorage.setItem('tantawy_custom_products', JSON.stringify(firstMapped.slice(0, INITIAL_STORE_SLICE)));
          localStorage.setItem('tantawy_catalog_meta_v2', JSON.stringify({ ts: Date.now(), count: total }));
        } else {
          localStorage.removeItem('tantawy_custom_products');
          localStorage.removeItem('tantawy_catalog_meta_v2');
        }
      } catch {
        // ignore quota limits
      }
    } catch (err) {
      console.warn('Live Supabase products fetch error:', err);
    } finally {
      setIsSyncingWithDatabase(false);
    }
  };

  // تحميل الدفعة التالية عند الطلب فقط (24 صنفاً بكل دفعة لتقليل استهلاك الباقة والذاكرة)
  const loadMoreProductsFromDatabase = async (pageSize = INITIAL_STORE_SLICE) => {
    if (isLoadingMoreProducts) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    setIsLoadingMoreProducts(true);
    try {
      const offset = products.length;
      const { data, count, error } = await supabase
        .from('products')
        .select(SLIM_PRODUCT_COLUMNS, { count: 'exact' })
        .order('id', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      if (typeof count === 'number') setSupabaseProductCount(count);
      const mapped = (data || []).map((item, idx) => mapSupabaseToProduct(item, offset + idx));
      mergeProductsIntoState(mapped);
    } catch (err) {
      console.warn('loadMoreProductsFromDatabase error:', err);
    } finally {
      setIsLoadingMoreProducts(false);
    }
  };

  const startOfflineCatalogDownload = async () => {
    if (offlineDownloadProgress.active) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const controller = new AbortController();
    offlineAbortRef.current = controller;
    setOfflineDownloadProgress({
      active: true,
      downloaded: products.length,
      total: supabaseProductCount || products.length,
      completed: false,
    });

    try {
      const res = await offlineStoreService.downloadCatalogInChunks({
        pageSize: 120,
        signal: controller.signal,
        onBatch: (batch, downloaded, total) => {
          setSupabaseProductCount(total);
          setProducts((prev) => {
            const byId = new Map(prev.map((p) => [p.id, p]));
            batch.forEach((p) => byId.set(p.id, p));
            return Array.from(byId.values());
          });
          setOfflineDownloadProgress({
            active: true,
            downloaded,
            total,
            completed: false,
          });
        },
      });
      setOfflineDownloadProgress({
        active: false,
        downloaded: res.downloaded,
        total: res.total,
        completed: !res.aborted,
      });
      if (!res.aborted) {
        window.setTimeout(() => {
          setOfflineDownloadProgress((prev) => ({ ...prev, completed: false }));
        }, 5000);
      }
    } catch {
      setOfflineDownloadProgress((prev) => ({ ...prev, active: false }));
    } finally {
      offlineAbortRef.current = null;
    }
  };

  const cancelOfflineCatalogDownload = () => {
    offlineAbortRef.current?.abort();
    setOfflineDownloadProgress((prev) => ({ ...prev, active: false }));
  };

  // تشغيل المزامنة الذكية مع قاعدة البيانات فور فتح التطبيق + عند عودة الإنترنت
  useEffect(() => {
    fetchProductsFromDatabase(false);
    const onReconnect = () => {
      void fetchProductsFromDatabase(false);
    };
    window.addEventListener('online', onReconnect);
    return () => window.removeEventListener('online', onReconnect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setHideDemoProducts = (hide: boolean) => {
    setHideDemoProductsState(hide);
    try {
      localStorage.setItem('tantawy_hide_demo_products', 'true');
    } catch (e) {
      console.error(e);
    }
    fetchProductsFromDatabase();
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

  // Categories (from localStorage cache or database, fallback to defaults)
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const raw = localStorage.getItem('tantawy_categories_cache_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return CATEGORIES;
  });
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('tantawy_wishlist_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return withNormalizedImages(parsed);
      }
    } catch {}
    return [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('tantawy_recently_viewed_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return withNormalizedImages(parsed.slice(0, 8));
      }
    } catch {}
    return [];
  });
  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'deals' | 'cart'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProductState] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProductState] = useState<Product | null>(null);
  const [posterProduct, setPosterProduct] = useState<Product | null>(null);
  const [isItemRequestOpen, setIsItemRequestOpen] = useState(false);
  const [itemRequestPrefill, setItemRequestPrefill] = useState('');
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

  // باقات التجهيز الكامل (باكدج العرايس) وحالة المخزون الثلاثية
  const [bundles, setBundles] = useState<ProductBundle[]>(() => {
    try {
      const raw = localStorage.getItem('tantawy_product_bundles');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [stockStatusMap, setStockStatusMap] = useState<Record<string, StockStatus>>(() => {
    try {
      const raw = localStorage.getItem('tantawy_stock_status_map');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  });

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
    updateHomePageConfig(config);
    try {
      localStorage.removeItem('tantawy_bootstrap_ts_v2');
    } catch {}
    await siteConfigService.saveHomePageConfig(config);
  };

  const applyFetchedHomeConfig = (dbConfig: Partial<HomePageConfig> | null) => {
    if (!dbConfig) return;
    setHomePageConfig((prev) => {
      const merged: HomePageConfig = {
        announcementText: dbConfig.announcementText ?? prev.announcementText,
        hotline: dbConfig.hotline ?? prev.hotline,
        whatsappNumber: dbConfig.whatsappNumber ?? prev.whatsappNumber,
        heroBanners:
          dbConfig.heroBanners && dbConfig.heroBanners.length > 0
            ? dbConfig.heroBanners
            : prev.heroBanners,
        promoBanners:
          dbConfig.promoBanners && dbConfig.promoBanners.length > 0
            ? dbConfig.promoBanners
            : prev.promoBanners,
        sectionBanners: dbConfig.sectionBanners
          ? {
              homeAppliances: {
                ...(prev.sectionBanners?.homeAppliances || INITIAL_HOMEPAGE_CONFIG.sectionBanners!.homeAppliances),
                ...(dbConfig.sectionBanners.homeAppliances || {}),
              },
              electricalAppliances: {
                ...(prev.sectionBanners?.electricalAppliances || INITIAL_HOMEPAGE_CONFIG.sectionBanners!.electricalAppliances),
                ...(dbConfig.sectionBanners.electricalAppliances || {}),
              },
              deals: {
                ...(prev.sectionBanners?.deals || INITIAL_HOMEPAGE_CONFIG.sectionBanners!.deals),
                ...(dbConfig.sectionBanners.deals || {}),
              },
            }
          : (prev.sectionBanners || INITIAL_HOMEPAGE_CONFIG.sectionBanners),
      };
      try {
        localStorage.setItem('tantawy_homepage_config', JSON.stringify(merged));
        if (merged.whatsappNumber) {
          localStorage.setItem('tantawy_whatsapp_number', merged.whatsappNumber);
        }
      } catch {}
      return merged;
    });
    if (dbConfig.whatsappNumber) {
      setWhatsappNumber(dbConfig.whatsappNumber);
    }
  };

  // جلب إعدادات الصفحة الرئيسية (بنرات/خط ساخن/واتساب) من قاعدة البيانات
  const refreshHomePageConfigFromDatabase = async () => {
    try {
      const dbConfig = await siteConfigService.getHomePageConfig();
      applyFetchedHomeConfig(dbConfig);
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
        const mapped = dbCategories.map((c) => ({
          name: c.name,
          nameAr: c.nameAr,
          icon: c.icon,
          image: c.image,
          descriptionAr: c.descriptionAr,
          subcategories: c.subcategories,
          subcategoriesAr: c.subcategoriesAr,
        }));
        setCategories(mapped);
        try {
          localStorage.setItem('tantawy_categories_cache_v2', JSON.stringify(mapped));
        } catch {}
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
    try { localStorage.removeItem('tantawy_bootstrap_ts_v2'); } catch {}
    await refreshCategoriesFromDatabase();
  };

  // تعديل قسم
  const editCategory = async (id: number, item: Partial<CategoryItem>) => {
    await categoryService.update(id, item);
    try { localStorage.removeItem('tantawy_bootstrap_ts_v2'); } catch {}
    await refreshCategoriesFromDatabase();
  };

  // حذف قسم
  const deleteCategory = async (id: number) => {
    await categoryService.delete(id);
    try { localStorage.removeItem('tantawy_bootstrap_ts_v2'); } catch {}
    await refreshCategoriesFromDatabase();
  };

  const refreshBundlesFromDatabase = async () => {
    try {
      const dbBundles = await siteConfigService.getBundles();
      setBundles(dbBundles);
      try {
        localStorage.setItem('tantawy_product_bundles', JSON.stringify(dbBundles));
      } catch {}
    } catch (err) {
      console.warn('refreshBundlesFromDatabase error:', err);
    }
  };

  const saveBundlesToDatabase = async (nextBundles: ProductBundle[]) => {
    setBundles(nextBundles);
    try {
      localStorage.setItem('tantawy_product_bundles', JSON.stringify(nextBundles));
      localStorage.removeItem('tantawy_bootstrap_ts_v2');
    } catch {}
    await siteConfigService.saveBundles(nextBundles);
  };

  const getProductStockStatus = (product: Pick<Product, 'id' | 'inStock' | 'stockStatus'>): StockStatus => {
    return resolveStockStatus(product, stockStatusMap);
  };

  const updateProductStockStatus = async (productId: string, status: StockStatus) => {
    const nextMap = { ...stockStatusMap, [productId]: status };
    setStockStatusMap(nextMap);
    try {
      localStorage.setItem('tantawy_stock_status_map', JSON.stringify(nextMap));
      localStorage.removeItem('tantawy_bootstrap_ts_v2');
    } catch {}

    const inStockBool = status !== 'out_of_stock';
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, inStock: inStockBool, stockStatus: status } : p))
    );

    await Promise.all([
      siteConfigService.saveStockStatusMap(nextMap),
      productService.update(productId, { inStock: inStockBool }).catch((err) => {
        console.warn('Could not sync products.in_stock:', err);
      }),
    ]);
  };

  const searchCatalogServer = async (params: PagedProductsParams) => {
    return productService.getMappedPaged(params);
  };

  // تحميل الإعدادات والأقسام والباقات والمخزون في استعلام موحّد + كاش محلي 10 دقائق لتقليل Egress
  useEffect(() => {
    try {
      const lastTs = Number(localStorage.getItem('tantawy_bootstrap_ts_v2') || '0');
      if (lastTs && Date.now() - lastTs < BOOTSTRAP_CACHE_TTL_MS) {
        return;
      }
    } catch {}

    Promise.all([
      siteConfigService.getBootstrapConfigs(),
      refreshCategoriesFromDatabase(),
    ])
      .then(([boot]) => {
        applyFetchedHomeConfig(boot.homeConfig);
        if (boot.bundles) {
          setBundles(boot.bundles);
          try {
            localStorage.setItem('tantawy_product_bundles', JSON.stringify(boot.bundles));
          } catch {}
        }
        if (boot.stockStatusMap) {
          setStockStatusMap(boot.stockStatusMap);
          try {
            localStorage.setItem('tantawy_stock_status_map', JSON.stringify(boot.stockStatusMap));
          } catch {}
        }
        try {
          localStorage.setItem('tantawy_bootstrap_ts_v2', String(Date.now()));
        } catch {}
      })
      .catch((err) => {
        console.warn('Bootstrap config sync warning:', err);
      });
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

  // تفريغ الكاش المحلي وإعادة التحميل من قاعدة البيانات
  const resetProductsToDefault = () => {
    setProducts([]);
    void offlineStoreService.clearProducts();
    try {
      localStorage.removeItem('tantawy_custom_products');
      localStorage.removeItem('tantawy_catalog_meta_v2');
      localStorage.removeItem('tantawy_bootstrap_ts_v2');
      localStorage.removeItem('tantawy_hide_demo_products');
    } catch (e) {
      console.error('Error clearing cached products:', e);
    }
    fetchProductsFromDatabase(true);
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

  const addBundleToCart = (bundle: ProductBundle) => {
    if (!bundle || !Array.isArray(bundle.items)) return;
    bundle.items.forEach((bItem) => {
      const matched = products.find((p) => p.id === bItem.productId);
      const productObj: Product = matched || {
        id: bItem.productId || `bundle-item-${bItem.nameAr}`,
        name: bItem.nameAr,
        nameAr: bItem.nameAr,
        category: 'Home Appliances',
        categoryAr: 'باقات التجهيز',
        summary: `ضمن ${bundle.title}`,
        summaryAr: `ضمن ${bundle.title}`,
        description: bundle.subtitle || bundle.title,
        descriptionAr: bundle.subtitle || bundle.title,
        actualprice: 0,
        discountpercent: 0,
        overallrating: 5,
        previewimage: bItem.image || bundle.image || '/logo.png',
        previewimages: [bItem.image || bundle.image || '/logo.png'],
        reviews: [],
        quantities: ['1'],
        sizevariants: ['قياسي'],
        inStock: true,
        brand: bItem.brand || 'دريم طنطاوي جروب',
        unifiedCode: bItem.unifiedCode,
      };
      addToCart(productObj, Math.max(1, Number(bItem.quantity) || 1));
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem('tantawy_wishlist_v1', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('tantawy_recently_viewed_v1', JSON.stringify(recentlyViewed));
    } catch {}
  }, [recentlyViewed]);

  const recordRecentlyViewed = (product: Product | null) => {
    if (!product || !product.id) return;
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 8);
    });
  };

  const setSelectedProduct = (product: Product | null) => {
    setSelectedProductState(product);
    if (product) recordRecentlyViewed(product);
  };

  const setQuickViewProduct = (product: Product | null) => {
    setQuickViewProductState(product);
    if (product) recordRecentlyViewed(product);
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    try {
      localStorage.removeItem('tantawy_recently_viewed_v1');
    } catch {}
  };

  const openItemRequestModal = (prefillName = '') => {
    setItemRequestPrefill(prefillName.trim());
    setIsItemRequestOpen(true);
  };

  const closeItemRequestModal = () => {
    setIsItemRequestOpen(false);
    setItemRequestPrefill('');
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

  // قائمة المقارنة جنباً إلى جنب (حد أقصى 4 أجهزة)
  const MAX_COMPARE_ITEMS = 4;
  const [compareList, setCompareList] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('tantawy_compare_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return withNormalizedImages(parsed.slice(0, MAX_COMPARE_ITEMS));
      }
    } catch {}
    return [];
  });
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('tantawy_compare_list', JSON.stringify(compareList));
    } catch {}
  }, [compareList]);

  const isInCompare = (productId: string) => compareList.some((p) => p.id === productId);

  const toggleCompare = (product: Product): { added: boolean; replacedOldest?: boolean } => {
    let added = false;
    let replacedOldest = false;
    setCompareList((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        added = false;
        return prev.filter((p) => p.id !== product.id);
      }
      added = true;
      if (prev.length >= MAX_COMPARE_ITEMS) {
        replacedOldest = true;
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
    return { added, replacedOldest };
  };

  const removeFromCompare = (productId: string) => {
    setCompareList((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareList([]);
    setIsCompareDrawerOpen(false);
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

  const createOrder = (address: string, paymentMethod: string, orderId?: string): OrderItem | null => {
    if (cart.length === 0) return null;
    const newOrder: OrderItem = {
      orderid: orderId || `TG-${Math.floor(10000000 + Math.random() * 90000000)}`,
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
        if (quickViewProduct && quickViewProduct.id === productId) {
          setQuickViewProduct(updated);
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
        isLoadingMoreProducts,
        fetchProductsFromDatabase,
        loadMoreProductsFromDatabase,
        mergeProductsIntoState,
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
        quickViewProduct,
        setQuickViewProduct,
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
        bundles,
        refreshBundlesFromDatabase,
        saveBundlesToDatabase,
        addBundleToCart,
        stockStatusMap,
        getProductStockStatus,
        updateProductStockStatus,
        searchCatalogServer,
        compareList,
        isCompareDrawerOpen,
        setIsCompareDrawerOpen,
        toggleCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        recentlyViewed,
        clearRecentlyViewed,
        posterProduct,
        setPosterProduct,
        isItemRequestOpen,
        itemRequestPrefill,
        openItemRequestModal,
        closeItemRequestModal,
        offlineDownloadProgress,
        startOfflineCatalogDownload,
        cancelOfflineCatalogDownload,
        language,
        setLanguage,
        toggleLanguage,
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
