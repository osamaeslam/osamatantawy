export interface Review {
  customername: string;
  comment: string;
  rating: number | string;
  revieweddate: string;
  profileimage?: string;
}

export type StockStatus = 'available' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  summary: string;
  summaryAr: string;
  description: string;
  descriptionAr: string;
  actualprice: number;
  discountpercent: number;
  overallrating: number;
  previewimage: string;
  previewimages: string[];
  reviews: Review[];
  quantities: string[];
  sizevariants: string[];
  isDeal?: boolean;
  dealEndsIn?: string;
  inStock?: boolean;
  stockStatus?: StockStatus;
  brand?: string;
  // أعمدة جوجل شيت المعتمدة
  itemNumber?: string;       // Item number
  importKey?: string;
  unifiedCode?: string;      // كود موحد
  size?: string;             // Size
  color?: string;            // Color
  itemGroup?: string;        // Item group
  familyName?: string;       // Family Name
  imageLink?: string;        // لينك الصور
  sector?: string;           // القطاع
}

export interface ProductBundleItem {
  productId: string;
  nameAr: string;
  brand?: string;
  image?: string;
  unifiedCode?: string;
  quantity: number;
}

export interface ProductBundle {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  bundlePrice: number;
  originalPrice?: number;
  items: ProductBundleItem[];
  isActive: boolean;
  createdAt: string;
}

export interface HeroBanner {
  id: string | number;
  title: string;
  subtitle: string;
  badge: string;
  buttonText: string;
  category: string;
  bgGradient: string;
  image: string;
  linkCategory?: string;
}

export interface PromoBanner {
  id: string;
  badge: string;
  badgeBg?: string;
  title: string;
  subtitle: string;
  buttonText: string;
  image: string;
  bgGradient: string;
  linkCategory: string;
}

export interface SectionBanner {
  badge: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  image: string;
  bgGradient: string;
}

export interface SectionBannersConfig {
  homeAppliances: SectionBanner;
  electricalAppliances: SectionBanner;
  deals: SectionBanner;
}

export interface HomePageConfig {
  announcementText: string;
  hotline: string;
  whatsappNumber?: string;
  heroBanners: HeroBanner[];
  promoBanners?: PromoBanner[];
  sectionBanners?: SectionBannersConfig;
}

export interface CategoryItem {
  name: string;
  nameAr: string;
  icon: string;
  image?: string;
  descriptionAr: string;
  subcategories: string[];
  subcategoriesAr: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface OrderItem {
  orderid: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  status: 'Dispatched' | 'Cancelled' | 'Completed' | 'Processing';
  productimage: string;
  price: number;
  date: string;
}

export interface TeamMember {
  employeeName: string;
  image: string;
  designation: string;
  roleAr: string;
  bioAr: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  avatar: string;
}
