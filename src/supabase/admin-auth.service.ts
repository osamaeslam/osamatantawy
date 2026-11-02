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
    // 1) الطريقة الآمنة: عبر دالة RPC (بعد تشغيل supabase/admin_users_security.sql)
    //    لا تُرجع أي بيانات عند عدم التطابق، والجدول نفسه مقفول عن المتصفح.
    try {
      const { data, error } = await supabase.rpc('verify_admin_login', {
        p_username: username,
        p_password: password,
      });
      if (!error) {
        const row = Array.isArray(data) ? data[0] : data;
        return (row as AdminUser) ?? null;
      }
    } catch {
      // الدالة غير موجودة بعد (لم يُشغّل سكربت التأمين) — نكمل للاحتياطي
    }

    // 2) احتياطي مؤقت (يعمل فقط قبل تشغيل سكربت التأمين)
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, full_name, role')
      .eq('username', username)
      .eq('password_hash', password)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;
    return data as AdminUser;
  },
};
