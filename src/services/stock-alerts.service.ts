import { supabase } from '../supabase/config';
import { siteConfigService } from '../supabase/siteConfig.service';
import type { Product, StockStatus } from '../types';
import { resolveStockStatus } from '../utils/stockStatus';

export type StockAlertStatus = 'waiting' | 'notified';

export interface StockAlertEntry {
  id: string;
  productId: string;
  productName: string;
  productCode?: string;
  brand?: string;
  category?: string;
  customerName: string;
  customerPhone: string;
  status: StockAlertStatus;
  createdAt: string;
  notifiedAt?: string;
}

const CONFIG_KEY = 'stock_back_alerts_v1';
const LOCAL_KEY = 'tantawy_stock_alerts_v1';

const readLocal = (): StockAlertEntry[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const writeLocal = (entries: StockAlertEntry[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  } catch {}
};

export const stockAlertsService = {
  async getAll(): Promise<StockAlertEntry[]> {
    try {
      const { data, error } = await supabase
        .from('site_configs')
        .select('value')
        .eq('key', CONFIG_KEY)
        .maybeSingle();

      if (!error && data?.value) {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed)) {
          writeLocal(parsed);
          return parsed;
        }
      }
    } catch {
      // fallback to localStorage cache
    }
    return readLocal();
  },

  async saveAll(entries: StockAlertEntry[]): Promise<void> {
    const trimmed = entries.slice(0, 400);
    writeLocal(trimmed);
    try {
      await siteConfigService.setValue(CONFIG_KEY, JSON.stringify(trimmed));
    } catch {
      // keep localStorage copy if offline / restricted
    }
  },

  async addAlert(input: {
    productId: string;
    productName: string;
    productCode?: string;
    brand?: string;
    category?: string;
    customerName: string;
    customerPhone: string;
  }): Promise<{ entry: StockAlertEntry; duplicate: boolean }> {
    const cleanPhone = input.customerPhone.replace(/[^0-9]/g, '');
    const current = await this.getAll();

    const existing = current.find(
      (a) =>
        a.productId === input.productId &&
        a.customerPhone === cleanPhone &&
        a.status === 'waiting'
    );
    if (existing) {
      return { entry: existing, duplicate: true };
    }

    const entry: StockAlertEntry = {
      id: `sa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId: input.productId,
      productName: input.productName.trim(),
      productCode: input.productCode?.trim() || undefined,
      brand: input.brand?.trim() || undefined,
      category: input.category?.trim() || undefined,
      customerName: input.customerName.trim() || 'عميل مهتم',
      customerPhone: cleanPhone,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    const next = [entry, ...current];
    await this.saveAll(next);
    return { entry, duplicate: false };
  },

  async markNotified(id: string): Promise<void> {
    const current = await this.getAll();
    const now = new Date().toISOString();
    const next = current.map((e) =>
      e.id === id ? { ...e, status: 'notified' as const, notifiedAt: now } : e
    );
    await this.saveAll(next);
  },

  async remove(id: string): Promise<void> {
    const current = await this.getAll();
    await this.saveAll(current.filter((e) => e.id !== id));
  },
};

const extractKeywords = (text: string): string[] =>
  (text || '')
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

/**
 * ترشيح أقرب 3 بدائل متوفرة عند نفاد المنتج:
 * الأولوية لنفس القطاع/القسم الفرعي + نفس المقاس أو الكلمات المفتاحية + نفس الماركة
 */
export const findSmartAlternatives = (
  target: Product,
  catalog: Product[],
  stockStatusMap: Record<string, StockStatus>,
  limit = 3
): Product[] => {
  if (!target || !Array.isArray(catalog)) return [];

  const targetKeywords = new Set([
    ...extractKeywords(target.nameAr),
    ...extractKeywords(target.itemGroup || ''),
    ...extractKeywords(target.size || ''),
  ]);
  const targetCat = (target.itemGroup || target.categoryAr || target.category || '').toLowerCase();
  const targetSector = (target.sector || target.categoryAr || '').toLowerCase();
  const targetBrand = (target.brand || '').toLowerCase();
  const targetSize = (target.size || '').toLowerCase();

  const scored: Array<{ product: Product; score: number }> = [];

  for (const candidate of catalog) {
    if (!candidate || candidate.id === target.id) continue;
    const status = resolveStockStatus(candidate, stockStatusMap);
    if (status === 'out_of_stock') continue;

    let score = 0;
    const candCat = (candidate.itemGroup || candidate.categoryAr || candidate.category || '').toLowerCase();
    const candSector = (candidate.sector || candidate.categoryAr || '').toLowerCase();
    const candBrand = (candidate.brand || '').toLowerCase();
    const candSize = (candidate.size || '').toLowerCase();

    if (targetCat && candCat && targetCat === candCat) score += 50;
    else if (targetSector && candSector && targetSector === candSector) score += 25;

    if (targetBrand && candBrand && targetBrand === candBrand) score += 20;
    if (targetSize && candSize && (targetSize === candSize || candSize.includes(targetSize) || targetSize.includes(candSize))) {
      score += 30;
    }

    const candWords = extractKeywords(`${candidate.nameAr} ${candidate.size || ''}`);
    let wordOverlap = 0;
    for (const w of candWords) {
      if (targetKeywords.has(w)) wordOverlap += 1;
    }
    score += Math.min(40, wordOverlap * 10);

    if (status === 'available') score += 5;

    if (score >= 25) {
      scored.push({ product: candidate, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.product);
};
