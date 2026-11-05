import { supabase } from '../supabase/config';

/**
 * طلبات الأصناف غير الموجودة في الكتالوج.
 * العميل بيسأل عن صنف مش موجود → بيتسجل هنا → فريق البيع يتابع.
 * يتطلب تشغيل: supabase/customer_requests.sql
 */

export type ItemRequestStatus = 'new' | 'seen' | 'sourced' | 'rejected';

export interface ItemRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  itemName: string;
  details?: string;
  imageUrl?: string;
  status: ItemRequestStatus;
  adminNotes?: string;
  handledBy?: string;
  createdAt: string;
}

export interface NewItemRequestInput {
  customerName: string;
  customerPhone: string;
  itemName: string;
  details?: string;
  imageUrl?: string;
}

const TABLE = 'item_requests';
const BUCKET = 'item-requests';

const mapRow = (row: any): ItemRequest => ({
  id: String(row.id),
  customerName: row.customer_name || '',
  customerPhone: row.customer_phone || '',
  itemName: row.item_name || '',
  details: row.details || undefined,
  imageUrl: row.image_url || undefined,
  status: (row.status as ItemRequestStatus) || 'new',
  adminNotes: row.admin_notes || undefined,
  handledBy: row.handled_by || undefined,
  createdAt: row.created_at,
});

const translateError = (error: any): string => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  if (code === '42P01' || code === 'PGRST205' || message.includes('could not find the table')) {
    return 'خدمة طلبات الأصناف غير مفعّلة بعد. شغّل ملف supabase/customer_requests.sql في Supabase أولاً.';
  }
  if (code === '42501' || message.toLowerCase().includes('row-level security')) {
    return 'مفيش صلاحية لهذه العملية. تأكد من تسجيل الدخول كموظف.';
  }
  return message || 'تعذر تنفيذ العملية.';
};

export const itemRequestService = {
  /** رفع صورة الصنف (اختياري) وإرجاع رابطها العام */
  async uploadImage(file: File): Promise<string> {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

    if (error) {
      throw new Error(
        'تعذر رفع الصورة. تقدر تلصق رابط الصورة بدلاً منها، أو تشغّل supabase/customer_requests.sql لتفعيل التخزين.'
      );
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  /** إضافة طلب جديد (من العميل) */
  async create(input: NewItemRequestInput): Promise<string> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([
        {
          customer_name: input.customerName.trim(),
          customer_phone: input.customerPhone.replace(/[^0-9]/g, ''),
          item_name: input.itemName.trim(),
          details: input.details?.trim() || null,
          image_url: input.imageUrl?.trim() || null,
        },
      ])
      .select('id')
      .single();

    if (error) throw new Error(translateError(error));
    return data.id;
  },

  /** كل الطلبات (للموظفين فقط) */
  async getAll(): Promise<ItemRequest[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw new Error(translateError(error));
    return (data || []).map(mapRow);
  },

  /** تحديث الحالة + ملاحظات المتابعة */
  async update(
    id: string,
    updates: { status?: ItemRequestStatus; adminNotes?: string; handledBy?: string }
  ): Promise<void> {
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.adminNotes !== undefined) payload.admin_notes = updates.adminNotes;
    if (updates.handledBy !== undefined) payload.handled_by = updates.handledBy;

    const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
    if (error) throw new Error(translateError(error));
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(translateError(error));
  },
};
