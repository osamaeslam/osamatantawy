import { supabase } from './config';
import type { FirebaseOrder } from '../types/firebase';

/**
 * خدمة الطلبات الوحيدة في المشروع.
 * (كان فيه نسخة تانية src/supabase/order.service.ts بتكتب أعمدة غير موجودة
 *  في الجدول مثل customer_address / product_name / whatsapp_sent وبالتالي
 *  كانت بتفشل في حفظ الطلبات — اتشالت واتوحدت هنا.)
 */
const TABLE = 'orders';

/** يحوّل أي رقم مكتوب بأي شكل إلى أرقام فقط */
export const normalizePhone = (phone: string): string =>
  (phone || '').replace(/[^0-9]/g, '');


export const orderService = {
  async getAll(): Promise<FirebaseOrder[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
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
      items: item.items,
    }));
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
    return (data || []).map((item) => ({
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
      items: item.items,
    }));
  },

  async create(data: Omit<FirebaseOrder, 'id'> & { items?: any }): Promise<string> {
    // نبني حزمة items بشكل موحّد: العنوان والصورة بيتخزنوا جوه items
    // لأن الجدول مفيهوش أعمدة مخصصة ليهم.
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
    const summaryAr = invoice.items
      .map((i) => `${i.nameAr} (عدد ${i.quantity})`)
      .slice(0, 3)
      .join('، ') + (invoice.items.length > 3 ? ` و${invoice.items.length - 3} أصناف أخرى` : '');

    const totalQty = invoice.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    const fullItemsPayload = {
      phonePrimary: invoice.phonePrimary,
      phoneSecondary: invoice.phoneSecondary || '',
      contactPreference: invoice.contactPreference || 'whatsapp',
      city: invoice.city || '',
      deliveryAddress: invoice.deliveryAddress,
      landmark: invoice.landmark || '',
      deliveryTimeWindow: invoice.deliveryTimeWindow || '',
      notes: invoice.notes || '',
      orderedItems: invoice.items,
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

  async updateStatus(id: string, status: FirebaseOrder['status']): Promise<void> {
    const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
    if (error) throw error;
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
    }
  ): Promise<void> {
    const updatePayload: Record<string, any> = {};
    if (updates.totalPrice !== undefined) updatePayload.total_price = updates.totalPrice;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.items !== undefined) updatePayload.items = updates.items;
    if (updates.quantity !== undefined) updatePayload.quantity = updates.quantity;
    if (updates.productNameAr !== undefined) updatePayload.product_name_ar = updates.productNameAr;

    const { error } = await supabase.from(TABLE).update(updatePayload).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * تتبّع طلب العميل برقم الموبايل — للاستخدام من صفحة الزائر.
   *
   * بعد تشغيل security_hardening.sql بقى قراءة جدول الطلبات مقصور على الموظفين
   * (لأنه فيه أسماء وتليفونات وعناوين كل العملاء)، والتتبّع بيمر عبر دالة
   * track_order اللي بترجّع صفوف الطلبات المطابقة لصاحب الرقم فقط.
   *
   * ولو الملف لسه ما اشتغلش، بنرجع للطريقة القديمة تلقائياً.
   */
  async trackOrderByPhone(phone: string): Promise<FirebaseOrder[]> {
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 6) return [];

    const { data, error } = await supabase.rpc('track_order', { p_phone: cleanPhone });

    if (error) {
      // الدالة لسه غير موجودة (ملف التقوية ما اشتغلش) → الطريقة القديمة
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
    }));
  },
};