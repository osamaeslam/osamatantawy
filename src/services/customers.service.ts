import { supabase } from '../supabase/config';

/**
 * CRM بسيط: ملاحظات لكل رقم عميل + وسم VIP + آخر تواصل.
 * عدد الطلبات وقيمة المبيعات بتتحسب من جدول الطلبات (مش متخزنة هنا).
 * يتطلب تشغيل: supabase/cs_advanced.sql
 */

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  notes?: string;
  isVip: boolean;
  lastContactAt?: string | null;
  createdAt?: string;
}

const TABLE = 'customers';

export const normalizeCustomerPhone = (phone: string): string =>
  (phone || '').replace(/[^0-9]/g, '');

const mapRow = (row: any): Customer => ({
  id: String(row.id),
  phone: row.phone || '',
  name: row.name || undefined,
  notes: row.notes || undefined,
  isVip: row.is_vip === true,
  lastContactAt: row.last_contact_at || null,
  createdAt: row.created_at,
});

const translateError = (error: any): string => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  if (code === '42P01' || code === 'PGRST205' || message.includes('could not find the table')) {
    return 'ملف العملاء غير مفعّل بعد. شغّل supabase/cs_advanced.sql في Supabase أولاً.';
  }
  if (
    code === 'PGRST204' ||
    message.includes('Could not find the') ||
    message.includes('column') ||
    code === '42P10'
  ) {
    return 'بنية جدول العملاء قديمة. شغّل supabase/cs_advanced.sql في Supabase لتفعيل الملاحظات و VIP.';
  }
  if (code === '42501' || message.toLowerCase().includes('row-level security')) {
    return 'مفيش صلاحية لهذه العملية. تأكد من تسجيل الدخول كموظف.';
  }
  return message || 'تعذر تنفيذ العملية.';
};

export const customersService = {
  async getAll(): Promise<Customer[]> {
    // بدون ترتيب على عمود ممكن يكون مش موجود في البنية القديمة — بنرتب محلياً
    const { data, error } = await supabase.from(TABLE).select('*').limit(500);

    if (error) throw new Error(translateError(error));

    return (data || [])
      .map(mapRow)
      .sort(
        (a, b) =>
          new Date(b.lastContactAt || b.createdAt || 0).getTime() -
          new Date(a.lastContactAt || a.createdAt || 0).getTime()
      );
  },

  async getByPhone(phone: string): Promise<Customer | null> {
    const clean = normalizeCustomerPhone(phone);
    if (!clean) return null;

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('phone', clean)
      .maybeSingle();

    if (error) throw new Error(translateError(error));
    return data ? mapRow(data) : null;
  },

  /** حفظ/تحديث ملاحظات العميل (upsert على رقم الموبايل) */
  async save(input: {
    phone: string;
    name?: string;
    notes?: string;
    isVip?: boolean;
    touchContact?: boolean;
  }): Promise<Customer> {
    const clean = normalizeCustomerPhone(input.phone);
    if (!clean) throw new Error('رقم الموبايل غير صالح.');

    const payload: Record<string, any> = {
      phone: clean,
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) payload.name = input.name.trim() || null;
    if (input.notes !== undefined) payload.notes = input.notes.trim() || null;
    if (input.isVip !== undefined) payload.is_vip = input.isVip;
    if (input.touchContact) payload.last_contact_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(TABLE)
      .upsert([payload], { onConflict: 'phone' })
      .select('*')
      .single();

    if (error) throw new Error(translateError(error));
    return mapRow(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(translateError(error));
  },
};
