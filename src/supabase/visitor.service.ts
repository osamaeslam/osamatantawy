import { supabase } from './config';
import type { Visitor } from '../types/supabase-extended';

const TABLE = 'visitors';

export const visitorService = {
  async trackVisit(page: string, ip?: string, ua?: string): Promise<void> {
    await supabase.from(TABLE).insert([
      {
        page_visited: page,
        ip_address: ip || null,
        user_agent: ua || null,
      },
    ]);
  },

  async getAll(limit = 200): Promise<Visitor[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id,page_visited,ip_address,user_agent,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getCount(): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE)
      .select('id', { head: true, count: 'exact' });

    if (error) throw error;
    return count || 0;
  },

  async getTodayCount(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { head: true, count: 'exact' })
      .gte('created_at', today)
      .lt('created_at', today + 'T23:59:59.999Z');

    if (error) throw error;
    return count || 0;
  },
};