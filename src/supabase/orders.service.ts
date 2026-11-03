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
      items: item.items,
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
      items: item.items,
    }));
  },

  async create(data: Omit<FirebaseOrder, 'id'> & { items?: any }): Promise<string> {
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
          total_price: data.totalPrice || 0,
          status: data.status || 'pending',
          items: data.items || [],
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

  async updateQuote(
    id: string,
    items: Record<string, any>,
    totalPrice: number,
    status: FirebaseOrder['status'],
    productNameAr: string,
    quantity: number,
    deliveryTimeWindow: string
  ): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({
        items,
        total_price: totalPrice,
        status,
        product_name_ar: productNameAr,
        quantity,
        selected_size: deliveryTimeWindow,
      })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },
};