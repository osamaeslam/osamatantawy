import { supabase } from './config';
import type { HeroBanner, HomePageConfig, PromoBanner } from '../types';

const CONFIG_TABLE = 'site_configs';
const BANNERS_TABLE = 'hero_banners';

/**
 * خدمة إعدادات الموقع - تقرأ وتكتب في Supabase بشكل دائم
 * (Hotline / WhatsApp / Announcement / Hero Banners / Promo Banners)
 */
export const siteConfigService = {
  /** قراءة قيمة إعداد واحدة بالـ key */
  async getValue(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from(CONFIG_TABLE)
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    return data?.value ?? null;
  },

  /** حفظ/تحديث قيمة إعداد (upsert) */
  async setValue(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from(CONFIG_TABLE)
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    if (error) throw error;
  },

  /** قراءة كل البنرات النشطة مرتبة */
  async getBanners(): Promise<HeroBanner[]> {
    const { data, error } = await supabase
      .from(BANNERS_TABLE)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title || '',
      subtitle: row.subtitle || '',
      badge: row.badge || '',
      buttonText: row.button_text || '',
      category: row.category || '',
      bgGradient: row.bg_gradient || 'from-blue-950 via-blue-900 to-indigo-900',
      image: row.image_url || '',
      linkCategory: row.link_category || row.category || '',
    }));
  },

  /** استبدال كل البنرات بالبنرات المرسلة (حذف القديم + إدخال الجديد) */
  async replaceBanners(banners: HeroBanner[]): Promise<void> {
    // حذف كل البنرات الحالية
    const { error: delError } = await supabase
      .from(BANNERS_TABLE)
      .delete()
      .neq('id', 0);
    if (delError) throw delError;

    if (!banners || banners.length === 0) return;

    // إدخال القائمة الجديدة بالترتيب
    const rows = banners.map((b, index) => ({
      title: b.title,
      subtitle: b.subtitle,
      badge: b.badge,
      button_text: b.buttonText,
      category: b.category,
      link_category: b.linkCategory || b.category,
      bg_gradient: b.bgGradient,
      image_url: b.image,
      sort_order: index,
      is_active: true,
    }));

    const { error: insError } = await supabase.from(BANNERS_TABLE).insert(rows);
    if (insError) throw insError;
  },

  /** قراءة عدة مفاتيح إعدادات في استعلام واحد لتقليل الـ Egress والطلبات */
  async getValuesBatch(keys: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};
    if (!keys || keys.length === 0) return result;
    const { data, error } = await supabase
      .from(CONFIG_TABLE)
      .select('key,value')
      .in('key', keys);
    if (error) throw error;
    for (const row of data || []) {
      result[row.key] = row.value ?? null;
    }
    return result;
  },

  /** جلب إعدادات الصفحة الرئيسية + الباقات + حالات المخزون في طلب واحد بدل 7 طلبات منفصلة */
  async getBootstrapConfigs(): Promise<{
    homeConfig: Partial<HomePageConfig> | null;
    bundles: import('../types').ProductBundle[] | null;
    stockStatusMap: Record<string, import('../types').StockStatus> | null;
  }> {
    try {
      const [map, banners] = await Promise.all([
        this.getValuesBatch([
          'announcement_text',
          'hotline',
          'whatsapp_sales_number',
          'homepage_promo_banners',
          'section_banners',
          'product_bundles',
          'product_stock_status_map',
        ]),
        this.getBanners(),
      ]);

      let promoBanners: PromoBanner[] | undefined = undefined;
      if (map.homepage_promo_banners) {
        try {
          const parsed = JSON.parse(map.homepage_promo_banners);
          if (Array.isArray(parsed) && parsed.length > 0) promoBanners = parsed;
        } catch {}
      }

      let sectionBanners = undefined;
      if (map.section_banners) {
        try {
          const parsed = JSON.parse(map.section_banners);
          if (parsed && typeof parsed === 'object') sectionBanners = parsed;
        } catch {}
      }

      let bundles: import('../types').ProductBundle[] | null = null;
      if (map.product_bundles) {
        try {
          const parsed = JSON.parse(map.product_bundles);
          if (Array.isArray(parsed)) bundles = parsed;
        } catch {}
      }

      let stockStatusMap: Record<string, import('../types').StockStatus> | null = null;
      if (map.product_stock_status_map) {
        try {
          const parsed = JSON.parse(map.product_stock_status_map);
          if (parsed && typeof parsed === 'object') stockStatusMap = parsed;
        } catch {}
      }

      return {
        homeConfig: {
          announcementText: map.announcement_text ?? undefined,
          hotline: map.hotline ?? undefined,
          whatsappNumber: map.whatsapp_sales_number ?? undefined,
          heroBanners: banners,
          promoBanners,
          sectionBanners,
        },
        bundles,
        stockStatusMap,
      };
    } catch (err) {
      console.warn('siteConfigService.getBootstrapConfigs error:', err);
      return { homeConfig: null, bundles: null, stockStatusMap: null };
    }
  },

  /** قراءة إعدادات الصفحة الرئيسية كاملة من قاعدة البيانات */
  async getHomePageConfig(): Promise<Partial<HomePageConfig> | null> {
    const boot = await this.getBootstrapConfigs();
    return boot.homeConfig;
  },

  /** حفظ إعدادات الصفحة الرئيسية كاملة إلى قاعدة البيانات */
  async saveHomePageConfig(config: HomePageConfig): Promise<void> {
    await Promise.all([
      this.setValue('announcement_text', config.announcementText || ''),
      this.setValue('hotline', config.hotline || ''),
      config.whatsappNumber
        ? this.setValue('whatsapp_sales_number', config.whatsappNumber)
        : Promise.resolve(),
      config.promoBanners && config.promoBanners.length > 0
        ? this.setValue('homepage_promo_banners', JSON.stringify(config.promoBanners))
        : Promise.resolve(),
      config.sectionBanners
        ? this.setValue('section_banners', JSON.stringify(config.sectionBanners))
        : Promise.resolve(),
    ]);
    await this.replaceBanners(config.heroBanners || []);
  },

  /** قراءة باقات وعروض التجهيز الكامل (باكدج العرايس) */
  async getBundles(): Promise<import('../types').ProductBundle[]> {
    try {
      const raw = await this.getValue('product_bundles');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('siteConfigService.getBundles error:', err);
      return [];
    }
  },

  /** حفظ باقات العرايس والتجهيز في قاعدة البيانات */
  async saveBundles(bundles: import('../types').ProductBundle[]): Promise<void> {
    await this.setValue('product_bundles', JSON.stringify(bundles || []));
  },

  /** قراءة خريطة حالات المخزون (متوفر / أوشك على النفاد / غير متوفر مؤقتاً) */
  async getStockStatusMap(): Promise<Record<string, import('../types').StockStatus>> {
    try {
      const raw = await this.getValue('product_stock_status_map');
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
      console.warn('siteConfigService.getStockStatusMap error:', err);
      return {};
    }
  },

  /** حفظ خريطة حالات المخزون */
  async saveStockStatusMap(map: Record<string, import('../types').StockStatus>): Promise<void> {
    await this.setValue('product_stock_status_map', JSON.stringify(map || {}));
  },
};

