import { supabase } from '../supabase/config';

/**
 * نظام دخول الإدارة/الموظفين — معتمد بالكامل على Supabase Auth.
 *
 * قبل كده كان الدخول بيتم من localStorage بكلمات مرور مكتوبة في الكود،
 * وده كان معناه إن أي زائر يقدر يكتب في localStorage ويبقى "مدير عام"
 * من غير أي كلمة مرور. دلوقتي:
 *   • الهوية = حساب Supabase Auth حقيقي (JWT موقّع).
 *   • الصلاحية (role) = جدول staff_members في قاعدة البيانات.
 *   • مفيش أي كلمة مرور مخزّنة في الكود أو في المتصفح.
 *
 * يتطلب تشغيل: supabase/security_hardening.sql
 */

export type StaffRole = 'admin' | 'sales_rep' | 'delivery_rep';

export interface StaffUser {
  id: string;
  userId?: string | null;
  email: string;
  fullName: string;
  role: StaffRole;
  phone?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string | null;
  lastLogin?: string | null;
}

export interface SaveStaffInput {
  id?: string;
  email: string;
  fullName: string;
  role: StaffRole;
  phone?: string;
  notes?: string;
  isActive?: boolean;
}

const TABLE = 'staff_members';
const CACHE_KEY = 'tantawy_current_staff';

const mapRow = (row: any): StaffUser => ({
  id: String(row.id),
  userId: row.user_id || null,
  email: row.email || '',
  fullName: row.full_name || '',
  role: (row.role as StaffRole) || 'sales_rep',
  phone: row.phone || undefined,
  notes: row.notes || undefined,
  isActive: row.is_active !== false,
  createdAt: row.created_at || null,
  lastLogin: row.last_login || null,
});

/** رسائل أخطاء عربية مفهومة بدل رسائل Supabase الخام */
const translateAuthError = (message: string): string => {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (m.includes('email not confirmed')) return 'الحساب لسه مش مفعّل. افتح رسالة التأكيد في بريدك الإلكتروني ثم سجّل الدخول.';
  if (m.includes('user already registered')) return 'هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.';
  if (m.includes('password should be at least')) return 'كلمة المرور ضعيفة: لازم 6 أحرف أو أكثر.';
  if (m.includes('rate limit') || m.includes('too many requests')) return 'محاولات كثيرة في وقت قصير. استنى دقيقة وجرّب تاني.';
  if (m.includes('unable to validate email')) return 'صيغة البريد الإلكتروني غير صحيحة.';
  return message || 'تعذر إتمام العملية.';
};

/** رسالة واضحة لو ملف الـ SQL لسه ما اشتغلش */
const translateDbError = (error: any): string => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  if (code === '42P01' || code === 'PGRST205' || message.includes('could not find the table')) {
    return 'جدول فريق العمل غير موجود. شغّل ملف supabase/security_hardening.sql في Supabase أولاً.';
  }
  if (code === '42501' || message.toLowerCase().includes('row-level security')) {
    return 'مفيش صلاحية لهذه العملية. تأكد إن حسابك مسجّل كمدير عام ونشط من صفحة فريق العمل.';
  }
  if (code === '23505') return 'البريد الإلكتروني مسجل بالفعل لموظف آخر.';
  return message || 'تعذر تنفيذ العملية على قاعدة البيانات.';
};

const readCache = (): StaffUser | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // نتجاهل أي كاش قديم (كان بيحفظ كلمة المرور) أو أي جسم مزيّف بدون بريد
    if (!parsed || !parsed.id || !parsed.email || typeof parsed.isActive !== 'boolean') {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed as StaffUser;
  } catch {
    return null;
  }
};

const writeCache = (staff: StaffUser | null): void => {
  try {
    if (staff) localStorage.setItem(CACHE_KEY, JSON.stringify(staff));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    /* التخزين المحلي مش متاح — مش مشكلة، الجلسة نفسها محفوظة بواسطة Supabase */
  }
};

export const staffService = {
  /** هل الحساب مدير عام؟ */
  isAdmin(staff: StaffUser | null): boolean {
    return Boolean(staff && staff.isActive && staff.role === 'admin');
  },

  /** الملف الشخصي المحفوظ محلياً — قراءة فورية (بدون أي باسورد) */
  getCurrentUser(): StaffUser | null {
    return readCache();
  },

  /** جلب سطر الموظف المرتبط بحساب Auth */
  async fetchProfile(userId: string): Promise<StaffUser | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(translateDbError(error));
    return data ? mapRow(data) : null;
  },

  /** تسجيل الدخول بالبريد وكلمة المرور */
  async login(email: string, password: string): Promise<StaffUser> {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw new Error(translateAuthError(error.message));
    if (!data.user) throw new Error('تعذر تسجيل الدخول. جرّب مرة أخرى.');

    let profile: StaffUser | null = null;
    try {
      profile = await this.fetchProfile(data.user.id);
    } catch (err: any) {
      await supabase.auth.signOut();
      throw err;
    }

    if (!profile) {
      await supabase.auth.signOut();
      throw new Error(
        'هذا الحساب مسجل لكنه غير موجود في فريق العمل. اطلب من المدير العام إضافة بريدك الإلكتروني أولاً.'
      );
    }

    if (!profile.isActive) {
      await supabase.auth.signOut();
      throw new Error('تم تعطيل هذا الحساب من قِبل الإدارة. برجاء مراجعة المدير العام.');
    }

    writeCache(profile);

    // تحديث "آخر دخول" — اختياري، وفشله مش بيوقف تسجيل الدخول
    supabase.rpc('touch_staff_login').then(
      () => undefined,
      () => undefined
    );

    return profile;
  },

  /**
   * إنشاء حساب موظف جديد.
   * الصلاحية بتتحدد من سطر staff_members المسجّل بنفس البريد (تلقائياً عبر trigger).
   */
  async signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ needsEmailConfirmation: boolean; staff: StaffUser | null }> {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (error) throw new Error(translateAuthError(error.message));

    if (!data.session) {
      return { needsEmailConfirmation: true, staff: null };
    }

    const profile = data.user ? await this.fetchProfile(data.user.id) : null;
    if (profile && profile.isActive) writeCache(profile);

    return { needsEmailConfirmation: false, staff: profile };
  },

  /** استرجاع الجلسة عند فتح الصفحة (لو Supabase لسه فاكر الدخول) */
  async restoreSession(): Promise<StaffUser | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      writeCache(null);
      return null;
    }

    try {
      const profile = await this.fetchProfile(data.session.user.id);
      if (!profile || !profile.isActive) {
        await supabase.auth.signOut();
        writeCache(null);
        return null;
      }
      writeCache(profile);
      return profile;
    } catch {
      // لو قاعدة البيانات مش جاهزة، سيب الجلسة والملف المخزّن محلياً زي ما هو
      return readCache();
    }
  },

  /** قائمة كل الموظفين (للمدير العام) */
  async getAll(): Promise<StaffUser[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw new Error(translateDbError(error));
    return (data || []).map(mapRow);
  },

  /** إضافة أو تعديل موظف */
  async save(input: SaveStaffInput): Promise<StaffUser> {
    const payload = {
      email: input.email.trim().toLowerCase(),
      full_name: input.fullName.trim(),
      role: input.role,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      is_active: input.isActive ?? true,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const { data, error } = await supabase
        .from(TABLE)
        .update(payload)
        .eq('id', input.id)
        .select('*')
        .single();

      if (error) throw new Error(translateDbError(error));
      return mapRow(data);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*')
      .single();

    if (error) throw new Error(translateDbError(error));
    return mapRow(data);
  },

  /** تفعيل / تعطيل حساب */
  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(translateDbError(error));

    const cached = readCache();
    if (cached && cached.id === id) writeCache({ ...cached, isActive });
  },

  /** حذف موظف */
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(translateDbError(error));

    const cached = readCache();
    if (cached && cached.id === id) writeCache(null);
  },

  /** ربط سطر الموظف بحساب Auth مسجّل بنفس البريد (للمدير فقط) */
  async linkAccount(id: string): Promise<void> {
    const { error } = await supabase.rpc('link_staff_member', { p_staff_id: id });
    if (error) throw new Error(translateDbError(error));
  },

  /** تسجيل الخروج */
  async logout(): Promise<void> {
    writeCache(null);
    try {
      await supabase.auth.signOut();
    } catch {
      /* الجلسة انتهت أصلاً */
    }
  },
};

