import { supabase } from './config';

export interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
}

export const adminAuthService = {
  /** تسجيل دخول المسؤول */
  async login(username: string, password: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, full_name, role')
      .eq('username', username)
      .eq('password_hash', password)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      role: data.role,
    };
  },

  /** جلب جميع المسؤولين (لعرضهم في الإدارة لاحقًا) */
  async getAll(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};