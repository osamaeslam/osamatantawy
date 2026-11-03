import { supabase } from './config';
import type { HeroBanner, HomePageConfig } from '../types';

const CONFIG_TABLE = 'site_configs';
const BANNERS_TABLE = 'hero_banners';

/**
 * خدمة إعدادات الموقع - تقرأ وتكتب في Supabase بشكل دائم
 * (Hotline / WhatsApp / Announcement / Hero Banners)
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

  /** قراءة إعدادات الصفحة الرئيسية كاملة من قاعدة البيانات */
  async getHomePageConfig(): Promise<Partial<HomePageConfig> | null> {
    try {
      const [announcement, hotline, whatsapp, banners] = await Promise.all([
        this.getValue('announcement_text'),
        this.getValue('hotline'),
        this.getValue('whatsapp_sales_number'),
        this.getBanners(),
      ]);

      return {
        announcementText: announcement ?? undefined,
        hotline: hotline ?? undefined,
        whatsappNumber: whatsapp ?? undefined,
        heroBanners: banners,
      };
    } catch (err) {
      console.warn('siteConfigService.getHomePageConfig error:', err);
      return null;
    }
  },

  /** حفظ إعدادات الصفحة الرئيسية كاملة إلى قاعدة البيانات */
  async saveHomePageConfig(config: HomePageConfig): Promise<void> {
    await Promise.all([
      this.setValue('announcement_text', config.announcementText || ''),
      this.setValue('hotline', config.hotline || ''),
      config.whatsappNumber
        ? this.setValue('whatsapp_sales_number', config.whatsappNumber)
        : Promise.resolve(),
    ]);
    await this.replaceBanners(config.heroBanners || []);
  },
};
