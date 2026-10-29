import { supabase } from './config';
import type { FirebaseOrder } from '../types/firebase';

const TABLE = 'orders';

export const orderService = {
  /** حفظ طلب جديد */
  async create(data: Omit<FirebaseOrder, 'id'>): Promise<string> {
    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert([{
        order_id: data.orderId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_address: data.customerAddress || null,
        product_name: data.productNameAr,
        product_image: data.imageUrl || null,
        quantity: data.quantity || 1,
        total_price: data.totalPrice || 0,
        status: data.status || 'pending',
        whatsapp_sent: data.whatsappSent || false,
      }])
      .select('id')
      .single();

    if (error) throw error;
    return inserted.id;
  },

  /** جلب جميع الطلبات */
  async getAll(): Promise<FirebaseOrder[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      customerPhone: row.customer_phone,
      customerName: row.customer_name,
      productId: row.product_id || '',
      productNameAr: row.product_name,
      selectedColor: row.selected_color || '',
      selectedSize: row.selected_size || '',
      quantity: row.quantity || 1,
      totalPrice: row.total_price || 0,
      status: row.status as FirebaseOrder['status'],
      createdAt: row.created_at,
    }));
  },

  /** تحديث حالة الطلب */
  async updateStatus(id: string, status: FirebaseOrder['status']): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  /** البحث عن طلبات العميل برقم التليفون */
  async getByPhone(phone: string): Promise<FirebaseOrder[]> {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .ilike('customer_phone', `%${cleanPhone}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching orders by phone:', error);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      customerPhone: row.customer_phone,
      customerName: row.customer_name,
      productId: row.product_id || '',
      productNameAr: row.product_name,
      selectedColor: row.selected_color || '',
      selectedSize: row.selected_size || '',
      quantity: row.quantity || 1,
      totalPrice: row.total_price || 0,
      status: row.status as FirebaseOrder['status'],
      createdAt: row.created_at,
    }));
  },
};