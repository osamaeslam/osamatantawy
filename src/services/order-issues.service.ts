import { supabase } from '../supabase/config';

/**
 * المرتجعات والشكاوى (Returns & Complaints).
 * يتطلب تشغيل: supabase/cs_advanced.sql
 */

export type IssueType = 'return' | 'complaint' | 'damage';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';

export interface OrderIssue {
  id: string;
  orderId: string;
  customerName?: string;
  customerPhone: string;
  type: IssueType;
  reason?: string;
  status: IssueStatus;
  resolution?: string;
  amount: number;
  createdBy?: string;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface NewIssueInput {
  orderId: string;
  customerName?: string;
  customerPhone: string;
  type: IssueType;
  reason?: string;
  amount?: number;
  createdBy?: string;
}

const TABLE = 'order_issues';

const mapRow = (row: any): OrderIssue => ({
  id: String(row.id),
  orderId: row.order_id || '',
  customerName: row.customer_name || undefined,
  customerPhone: row.customer_phone || '',
  type: (row.type as IssueType) || 'complaint',
  reason: row.reason || undefined,
  status: (row.status as IssueStatus) || 'open',
  resolution: row.resolution || undefined,
  amount: Number(row.amount) || 0,
  createdBy: row.created_by || undefined,
  createdAt: row.created_at,
  resolvedAt: row.resolved_at || null,
});

const translateError = (error: any): string => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  if (code === '42P01' || code === 'PGRST205' || message.includes('could not find the table')) {
    return 'جدول المرتجعات غير مفعّل بعد. شغّل supabase/cs_advanced.sql في Supabase أولاً.';
  }
  if (code === '42501' || message.toLowerCase().includes('row-level security')) {
    return 'مفيش صلاحية لهذه العملية. تأكد من تسجيل الدخول كموظف.';
  }
  return message || 'تعذر تنفيذ العملية.';
};

export const orderIssuesService = {
  async getAll(): Promise<OrderIssue[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw new Error(translateError(error));
    return (data || []).map(mapRow);
  },

  async create(input: NewIssueInput): Promise<OrderIssue> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([
        {
          order_id: input.orderId.trim(),
          customer_name: input.customerName?.trim() || null,
          customer_phone: input.customerPhone.replace(/[^0-9]/g, ''),
          type: input.type,
          reason: input.reason?.trim() || null,
          amount: input.amount || 0,
          created_by: input.createdBy?.trim() || null,
        },
      ])
      .select('*')
      .single();

    if (error) throw new Error(translateError(error));
    return mapRow(data);
  },

  async update(
    id: string,
    updates: { status?: IssueStatus; resolution?: string; amount?: number }
  ): Promise<void> {
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) {
      payload.status = updates.status;
      payload.resolved_at =
        updates.status === 'resolved' || updates.status === 'rejected'
          ? new Date().toISOString()
          : null;
    }
    if (updates.resolution !== undefined) payload.resolution = updates.resolution;
    if (updates.amount !== undefined) payload.amount = updates.amount;

    const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
    if (error) throw new Error(translateError(error));
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new Error(translateError(error));
  },
};
