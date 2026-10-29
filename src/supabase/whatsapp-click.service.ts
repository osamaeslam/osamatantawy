import { supabase } from './config';
import type { WhatsAppClick } from '../types/supabase-extended';

const TABLE = 'whatsapp_clicks';

export const whatsappClickService = {
  async trackClick(productId?: string, productName?: string, ip?: string): Promise<void> {
    await supabase.from(TABLE).insert([
      {
        product_id: productId || null,
        product_name_ar: productName || null,
        user_ip: ip || null,
      },
    ]);
  },

  async getAll(): Promise<WhatsAppClick[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('clicked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCount(): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { head: true, count: 'exact' });

    if (error) throw error;
    return count || 0;
  },

  async getTodayCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { head: true, count: 'exact' })
      .gte('clicked_at', today)
      .lt('clicked_at', today + 'T23:59:59.999Z');

    if (error) throw error;
    return count || 0;
  },
};