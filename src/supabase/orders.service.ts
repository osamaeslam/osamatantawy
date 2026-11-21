import { supabase } from './config';
import type { FirebaseOrder, OrderStatusEvent } from '../types/firebase';

/**
 * خدمة الطلبات الوحيدة في المشروع.
 */
const TABLE = 'orders';

/** يحوّل أي رقم مكتوب بأي شكل إلى أرقام فقط */
export const normalizePhone = (phone: string): string =>
  (phone || '').replace(/[^0-9]/g, '');

const buildInitialHistory = (
  status: FirebaseOrder['status'],
  note?: string,
  actor?: string
): OrderStatusEvent[] => [
  {
    status,
    timestamp: new Date().toISOString(),
    note: note || 'تم تسجيل الطلب واستلامه بالنظام',
    actor: actor || 'النظام',
  },
];

const appendStatusHistory = (
  existingItems: any,
  newStatus: FirebaseOrder['status'],
  note?: string,
  actor?: string
): any => {
  const baseObj =
    existingItems && typeof existingItems === 'object' && !Array.isArray(existingItems)
      ? { ...existingItems }
      : {};
  const prevHistory: OrderStatusEvent[] = Array.isArray(baseObj.statusHistory)
    ? [...baseObj.statusHistory]
    : [];

  const last = prevHistory[prevHistory.length - 1];
  if (!last || last.status !== newStatus) {
    prevHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || undefined,
      actor: actor || undefined,
    });
  }
  baseObj.statusHistory = prevHistory;
  return baseObj;
};

export const mapRowToOrder = (item: any): FirebaseOrder => {
  const rawItems = item.items || {};
  const history: OrderStatusEvent[] = Array.isArray(rawItems.statusHistory)
    ? rawItems.statusHistory
    : [
        {
          status: (item.status || 'pending') as FirebaseOrder['status'],
          timestamp: item.created_at || new Date().toISOString(),
          note: 'تسجيل الطلب',
        },
      ];

  return {
    id: item.id,
    orderId: item.order_id,
    customerPhone: item.customer_phone,
    customerName: item.customer_name,
    productId: item.product_id,
    productNameAr: item.product_name_ar,
    selectedColor: item.selected_color,
    selectedSize: item.selected_size,
    quantity: item.quantity,
    totalPrice: item.total_price,
    status: item.status as FirebaseOrder['status'],
    createdAt: item.created_at,
    respondedAt: item.responded_at || null,
    assignedTo: item.assigned_to || null,
    assignedAt: item.assigned_at || null,
    followUpNote: item.follow_up_note || null,
    items: item.items,
    statusHistory: history,
    orderSource: rawItems.orderSource || 'web',
  };
};

export const orderService = {
  async getAll(): Promise<FirebaseOrder[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapRowToOrder);
  },

  async getByPhone(phone: string): Promise<FirebaseOrder[]> {
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) return [];

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .ilike('customer_phone', `%${cleanPhone}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRowToOrder);
  },

  async create(data: Omit<FirebaseOrder, 'id'> & { items?: any }): Promise<string> {
    const rawItems: any = data.items;
    const itemsPayload: any =
      rawItems && typeof rawItems === 'object' && !Array.isArray(rawItems) ? { ...rawItems } : {};

    if (!Array.isArray(itemsPayload.orderedItems) || itemsPayload.orderedItems.length === 0) {
      itemsPayload.orderedItems = [
        {
          nameAr: data.productNameAr,
          quantity: data.quantity || 1,
          image: data.imageUrl || '',
          color: data.selectedColor || undefined,
          size: data.selectedSize || undefined,
        },
      ];
    }
    if (data.customerAddress) itemsPayload.deliveryAddress = data.customerAddress;
    if (data.imageUrl) itemsPayload.image = data.imageUrl;
    if (!Array.isArray(itemsPayload.statusHistory)) {
      itemsPayload.statusHistory = buildInitialHistory(data.status || 'pending');
    }

    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert([
        {
          order_id: data.orderId,
          customer_phone: data.customerPhone,
          customer_name: data.customerName,
          product_id: data.productId || null,
          product_name_ar: data.productNameAr,
          selected_color: data.selectedColor || null,
          selected_size: data.selectedSize || null,
          quantity: data.quantity || 1,
          total_price: data.totalPrice || 0,
          status: data.status || 'pending',
          items: itemsPayload,
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    return inserted.id;
  },

  async saveInvoiceOrder(invoice: {
    orderId: string;
    customerName: string;
    phonePrimary: string;
    phoneSecondary?: string;
    contactPreference?: 'whatsapp' | 'call' | 'both';
    deliveryAddress: string;
    city?: string;
    landmark?: string;
    deliveryTimeWindow?: string;
    notes?: string;
    items: any[];
    totalPrice?: number;
  }): Promise<string> {
    const summaryAr =
      invoice.items
        .map((i) => `${i.nameAr} (عدد ${i.quantity})`)
        .slice(0, 3)
        .join('، ') + (invoice.items.length > 3 ? ` و${invoice.items.length - 3} أصناف أخرى` : '');

    const totalQty = invoice.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    const fullItemsPayload = {
      orderSource: 'web',
      phonePrimary: invoice.phonePrimary,
      phoneSecondary: invoice.phoneSecondary || '',
      contactPreference: invoice.contactPreference || 'whatsapp',
      city: invoice.city || '',
      deliveryAddress: invoice.deliveryAddress,
      landmark: invoice.landmark || '',
      deliveryTimeWindow: invoice.deliveryTimeWindow || '',
      notes: invoice.notes || '',
      orderedItems: invoice.items,
      statusHistory: buildInitialHistory('pending', 'تم تقديم الطلب من المتجر الإلكتروني'),
    };

    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert([
        {
          order_id: invoice.orderId,
          customer_name: invoice.customerName,
          customer_phone: invoice.phonePrimary,
          product_name_ar: summaryAr || 'طلب شراء أجهزة من طنطاوي جروب',
          quantity: totalQty,
          total_price: invoice.totalPrice || 0,
          status: 'pending',
          selected_size: invoice.deliveryTimeWindow || null,
          items: fullItemsPayload,
        },
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving invoice to Supabase:', error);
      throw error;
    }
    return inserted.id;
  },

  /**
   * تسجيل طلب تليفوني مباشر من لوحة التحكم (الخط الساخن 15218 / واتساب مباشر)
   */
  async createPhoneOrder(params: {
    orderId: string;
    customerName: string;
    phonePrimary: string;
    phoneSecondary?: string;
    orderSource: 'phone_15218' | 'whatsapp_direct';
    deliveryAddress: string;
    city?: string;
    landmark?: string;
    deliveryTimeWindow?: string;
    notes?: string;
    items: any[];
    deliveryFee?: number;
    discount?: number;
    totalPrice: number;
    status: FirebaseOrder['status'];
    assignedTo?: string | null;
    createdBy?: string;
  }): Promise<FirebaseOrder> {
    const summaryAr =
      params.items
        .map((i) => `${i.nameAr} (عدد ${i.quantity})`)
        .slice(0, 3)
        .join('، ') + (params.items.length > 3 ? ` و${params.items.length - 3} أصناف أخرى` : '');

    const totalQty = params.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const itemsSubtotal = params.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      0
    );

    const nowIso = new Date().toISOString();
    const history: OrderStatusEvent[] = [
      {
        status: params.status,
        timestamp: nowIso,
        note:
          params.orderSource === 'phone_15218'
            ? 'تسجيل طلب تليفوني عبر الخط الساخن 15218'
            : 'تسجيل طلب مباشر من محادثة واتساب',
        actor: params.createdBy || params.assignedTo || 'موظف المبيعات',
      },
    ];

    const fullItemsPayload = {
      orderSource: params.orderSource,
      phonePrimary: params.phonePrimary,
      phoneSecondary: params.phoneSecondary || '',
      contactPreference: params.orderSource === 'phone_15218' ? 'call' : 'whatsapp',
      city: params.city || '',
      deliveryAddress: params.deliveryAddress,
      landmark: params.landmark || '',
      deliveryTimeWindow: params.deliveryTimeWindow || 'من يومين إلى 7 أيام عمل',
      notes: params.notes || '',
      itemsSubtotal,
      deliveryFee: Number(params.deliveryFee) || 0,
      discount: Number(params.discount) || 0,
      totalPrice: params.totalPrice,
      orderedItems: params.items,
      statusHistory: history,
    };

    const insertRow: Record<string, any> = {
      order_id: params.orderId,
      customer_name: params.customerName,
      customer_phone: params.phonePrimary,
      product_name_ar: summaryAr || 'طلب تليفوني - طنطاوي جروب',
      quantity: totalQty,
      total_price: params.totalPrice,
      status: params.status,
      selected_size: params.deliveryTimeWindow || null,
      items: fullItemsPayload,
    };

    if (params.assignedTo) {
      insertRow.assigned_to = params.assignedTo;
      insertRow.assigned_at = nowIso;
    }
    if (params.status !== 'pending') {
      insertRow.responded_at = nowIso;
    }

    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert([insertRow])
      .select('*')
      .single();

    if (error) {
      // Fallback in case optional columns (responded_at / assigned_to) aren't added yet
      if (String(error.message || '').includes('assigned_') || String(error.message || '').includes('responded_at')) {
        delete insertRow.assigned_to;
        delete insertRow.assigned_at;
        delete insertRow.responded_at;
        const retry = await supabase.from(TABLE).insert([insertRow]).select('*').single();
        if (retry.error) throw retry.error;
        return mapRowToOrder(retry.data);
      }
      throw error;
    }

    return mapRowToOrder(inserted);
  },

  async updateStatus(
    id: string,
    status: FirebaseOrder['status'],
    note?: string,
    actor?: string
  ): Promise<void> {
    const { data: currentRow } = await supabase
      .from(TABLE)
      .select('items, responded_at')
      .eq('id', id)
      .maybeSingle();

    const updatedItems = appendStatusHistory(currentRow?.items, status, note, actor);
    const updatePayload: Record<string, any> = {
      status,
      items: updatedItems,
    };

    if (status !== 'pending' && !currentRow?.responded_at) {
      updatePayload.responded_at = new Date().toISOString();
    }

    const { error } = await supabase.from(TABLE).update(updatePayload).eq('id', id);
    if (error) {
      if (String(error.message || '').includes('responded_at')) {
        delete updatePayload.responded_at;
        const retry = await supabase.from(TABLE).update(updatePayload).eq('id', id);
        if (retry.error) throw retry.error;
        return;
      }
      throw error;
    }
  },

  async updateTotalPrice(id: string, totalPrice: number): Promise<void> {
    const { error } = await supabase.from(TABLE).update({ total_price: totalPrice }).eq('id', id);
    if (error) throw error;
  },

  async updateOrderFull(
    id: string,
    updates: {
      totalPrice?: number;
      status?: FirebaseOrder['status'];
      items?: any;
      quantity?: number;
      productNameAr?: string;
      assignedTo?: string | null;
      actor?: string;
    }
  ): Promise<void> {
    const updatePayload: Record<string, any> = {};
    if (updates.totalPrice !== undefined) updatePayload.total_price = updates.totalPrice;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.quantity !== undefined) updatePayload.quantity = updates.quantity;
    if (updates.productNameAr !== undefined) updatePayload.product_name_ar = updates.productNameAr;
    if (updates.assignedTo !== undefined) {
      updatePayload.assigned_to = updates.assignedTo;
      updatePayload.assigned_at = updates.assignedTo ? new Date().toISOString() : null;
    }

    if (updates.items !== undefined) {
      updatePayload.items = updates.status
        ? appendStatusHistory(updates.items, updates.status, undefined, updates.actor)
        : updates.items;
    }

    if (updates.status && updates.status !== 'pending') {
      const { data: currentRow } = await supabase
        .from(TABLE)
        .select('responded_at')
        .eq('id', id)
        .maybeSingle();
      if (!currentRow?.responded_at) {
        updatePayload.responded_at = new Date().toISOString();
      }
    }

    const { error } = await supabase.from(TABLE).update(updatePayload).eq('id', id);
    if (error) {
      if (String(error.message || '').includes('responded_at')) {
        delete updatePayload.responded_at;
        const retry = await supabase.from(TABLE).update(updatePayload).eq('id', id);
        if (retry.error) throw retry.error;
        return;
      }
      throw error;
    }
  },

  /** تعيين الطلب لموظف/مندوب للمتابعة */
  async assignTo(id: string, staffName: string | null): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({
        assigned_to: staffName,
        assigned_at: staffName ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) {
      const message = String(error.message || '');
      if (
        message.includes('assigned_to') ||
        message.includes('assigned_at') ||
        error.code === 'PGRST204' ||
        error.code === '42703'
      ) {
        throw new Error('حقل تعيين المسؤول غير مفعّل. شغّل supabase/cs_advanced.sql في Supabase أولاً.');
      }
      throw error;
    }
  },

  async getRecent(limit = 5): Promise<FirebaseOrder[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(mapRowToOrder);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * تتبّع طلب العميل برقم الموبايل — للاستخدام من صفحة الزائر.
   */
  async trackOrderByPhone(phone: string): Promise<FirebaseOrder[]> {
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 6) return [];

    const { data, error } = await supabase.rpc('track_order', { p_phone: cleanPhone });

    if (error) {
      return orderService.getByPhone(cleanPhone);
    }

    return (data || []).map((row: any) => ({
      id: row.order_id,
      orderId: row.order_id,
      customerName: row.customer_name,
      customerPhone: cleanPhone,
      productId: '',
      productNameAr: row.product_name_ar,
      selectedColor: '',
      selectedSize: row.selected_size || '',
      quantity: row.quantity || 1,
      totalPrice: row.total_price || 0,
      status: row.status as FirebaseOrder['status'],
      createdAt: row.created_at,
      customerAddress: row.delivery_address || row.city || undefined,
      items: row.items || undefined,
      statusHistory: Array.isArray(row.items?.statusHistory) ? row.items.statusHistory : undefined,
    }));
  },
};