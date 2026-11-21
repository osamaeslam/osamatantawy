import type { StockStatus, Product } from '../types';
import type { FirebaseProduct } from '../types/firebase';

export interface StockMeta {
  status: StockStatus;
  labelAr: string;
  shortLabelAr: string;
  labelEn: string;
  shortLabelEn: string;
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotClass: string;
  canOrder: boolean;
}

export const STOCK_STATUS_META: Record<StockStatus, Omit<StockMeta, 'label' | 'shortLabel'>> = {
  available: {
    status: 'available',
    labelAr: 'متوفر للطلب الفوري',
    shortLabelAr: 'متوفر',
    labelEn: 'Available for Immediate Order',
    shortLabelEn: 'In Stock',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-600',
    canOrder: true,
  },
  low_stock: {
    status: 'low_stock',
    labelAr: 'أوشك على النفاد — كمية محدودة',
    shortLabelAr: 'أوشك على النفاد',
    labelEn: 'Low Stock — Limited Quantity',
    shortLabelEn: 'Low Stock',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    canOrder: true,
  },
  out_of_stock: {
    status: 'out_of_stock',
    labelAr: 'غير متوفر مؤقتاً',
    shortLabelAr: 'غير متوفر مؤقتاً',
    labelEn: 'Temporarily Out of Stock',
    shortLabelEn: 'Out of Stock',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    dotClass: 'bg-red-600',
    canOrder: false,
  },
};

export function resolveStockStatus(
  product: Pick<Product, 'id' | 'inStock' | 'stockStatus'> | Pick<FirebaseProduct, 'id' | 'inStock' | 'stockStatus'>,
  stockMap?: Record<string, StockStatus>
): StockStatus {
  const id = String(product.id || '');
  if (id && stockMap && stockMap[id]) {
    return stockMap[id];
  }
  if (product.stockStatus) return product.stockStatus;
  if (product.inStock === false) return 'out_of_stock';
  return 'available';
}

export function getStockMeta(
  product: Pick<Product, 'id' | 'inStock' | 'stockStatus'> | Pick<FirebaseProduct, 'id' | 'inStock' | 'stockStatus'>,
  stockMap?: Record<string, StockStatus>,
  lang: 'ar' | 'en' = 'ar'
): StockMeta {
  const status = resolveStockStatus(product, stockMap);
  const base = STOCK_STATUS_META[status];
  return {
    ...base,
    label: lang === 'en' ? base.labelEn : base.labelAr,
    shortLabel: lang === 'en' ? base.shortLabelEn : base.shortLabelAr,
  };
}

