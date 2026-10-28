import { supabase } from './config';
import type { FirebaseOrder } from '../types/firebase';

const TABLE = 'orders';

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
    }));
  },

  async getByPhone(phone: string): Promise<FirebaseOrder[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('customer_phone', phone)
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
    }));
  },

  async create(data: Omit<FirebaseOrder, 'id'>): Promise<string> {
    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert([
        {
          order_id: data.orderId,
          customer_phone: data.customerPhone,
          customer_name: data.customerName,
          product_id: data.productId,
          product_name_ar: data.productNameAr,
          selected_color: data.selectedColor,
          selected_size: data.selectedSize,
          quantity: data.quantity,
          total_price: data.totalPrice,
          status: data.status,
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    return inserted.id;
  },

  async updateStatus(id: string, status: FirebaseOrder['status']): Promise<void> {
    const { error } = await supabase.from(TABLE).update({ status }).eq('id', id);
    if (error) throw error;
  },
};