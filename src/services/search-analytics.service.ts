import { supabase } from '../supabase/config';
import { siteConfigService } from '../supabase/siteConfig.service';

export type ZeroSearchStatus = 'open' | 'sourced' | 'ignored';

export interface ZeroResultSearchEntry {
  id: string;
  query: string;
  normalizedQuery: string;
  count: number;
  lastSearchedAt: string;
  firstSearchedAt: string;
  status: ZeroSearchStatus;
}

const CONFIG_KEY = 'zero_result_searches_v1';
const LOCAL_KEY = 'tantawy_zero_searches_v1';
const sessionRecordedQueries = new Set<string>();

const normalizeQuery = (q: string): string =>
  q
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');

const readLocal = (): ZeroResultSearchEntry[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const writeLocal = (entries: ZeroResultSearchEntry[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  } catch {}
};

export const searchAnalyticsService = {
  async getAll(): Promise<ZeroResultSearchEntry[]> {
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
      // fallback to local cache
    }
    return readLocal();
  },

  async saveAll(entries: ZeroResultSearchEntry[]): Promise<void> {
    const sorted = [...entries]
      .sort((a, b) => b.count - a.count || b.lastSearchedAt.localeCompare(a.lastSearchedAt))
      .slice(0, 200);
    writeLocal(sorted);
    try {
      await siteConfigService.setValue(CONFIG_KEY, JSON.stringify(sorted));
    } catch {
      // silent fallback
    }
  },

  /**
   * يسجل عبارة بحث لم ترجع أي نتائج (بحد أدنى حرفين ومع منع التكرار داخل نفس الجلسة لتقليل الـ Egress)
   */
  async trackZeroResultSearch(rawQuery: string): Promise<void> {
    const clean = rawQuery.trim();
    if (clean.length < 2 || clean.length > 80) return;

    const norm = normalizeQuery(clean);
    if (!norm || norm.length < 2) return;
    if (sessionRecordedQueries.has(norm)) return;
    sessionRecordedQueries.add(norm);

    const now = new Date().toISOString();
    const list = await this.getAll();
    const idx = list.findIndex((item) => item.normalizedQuery === norm);

    if (idx >= 0) {
      const existing = list[idx];
      list[idx] = {
        ...existing,
        query: clean,
        count: (existing.count || 1) + 1,
        lastSearchedAt: now,
        status: existing.status === 'ignored' ? 'open' : existing.status,
      };
    } else {
      list.unshift({
        id: `zs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        query: clean,
        normalizedQuery: norm,
        count: 1,
        firstSearchedAt: now,
        lastSearchedAt: now,
        status: 'open',
      });
    }

    await this.saveAll(list);
  },

  async updateStatus(id: string, status: ZeroSearchStatus): Promise<void> {
    const list = await this.getAll();
    const next = list.map((item) => (item.id === id ? { ...item, status } : item));
    await this.saveAll(next);
  },

  async remove(id: string): Promise<void> {
    const list = await this.getAll();
    await this.saveAll(list.filter((item) => item.id !== id));
  },
};
