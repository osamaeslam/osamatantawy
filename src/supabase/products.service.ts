import { supabase } from './config';
import type { FirebaseProduct } from '../types/firebase';

const TABLE = 'products';

export const productService = {
  async getAll(): Promise<FirebaseProduct[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      nameAr: item.name_ar,
      nameEn: item.name_en,
      categoryAr: item.category,
      category: item.category,
      price: item.price,
      discountedPrice: item.discounted_price,
      imageUrl: item.image_url,
      itemNumber: item.item_number,
      colors: item.colors || [],
      sizes: item.sizes || [],
      inStock: item.in_stock,
      brand: item.brand,
      createdAt: item.created_at,
    }));
  },

  async getById(id: string): Promise<FirebaseProduct | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    if (!data) return null;

    return {
      id: data.id,
      nameAr: data.name_ar,
      nameEn: data.name_en,
      categoryAr: data.category,
      category: data.category,
      price: data.price,
      discountedPrice: data.discounted_price,
      imageUrl: data.image_url,
      itemNumber: data.item_number,
      colors: data.colors || [],
      sizes: data.sizes || [],
      inStock: data.in_stock,
      brand: data.brand,
      createdAt: data.created_at,
    };
  },

  async create(data: Omit<FirebaseProduct, 'id'>): Promise<string> {
  // Auto-assign category based on product nameAr keywords
  let categoryValue = data.categoryAr || data.category || 'أجهزة منزلية';
  const lowerName = data.nameAr.toLowerCase();
  if (/ثلاجة|غسالة|بوتاجاز/.test(lowerName)) categoryValue = 'أجهزة منزلية';
  else if (/شاشة|تكييف|مكنسة/.test(lowerName)) categoryValue = 'أجهزة كهربيه';

  const { error, data: upserted } = await supabase
    .from(TABLE)
    .upsert({
      name_ar: data.nameAr,
      name_en: data.nameEn,
      item_number: data.itemNumber || null,
      category: categoryValue,
      price: data.price,
      discounted_price: data.discountedPrice,
      image_url: data.imageUrl,
      colors: data.colors,
      sizes: data.sizes,
      in_stock: data.inStock,
      brand: data.brand,
    }, {
      onConflict: data.itemNumber ? 'item_number' : 'name_ar, category',
    })
    .select('id')
    .single();

    if (error) throw error;
    return upserted.id;
  },

  async batchCreate(items: Omit<FirebaseProduct, 'id'>[]): Promise<string[]> {
    if (items.length === 0) return [];

    const { error } = await supabase.from(TABLE).upsert(
      items.map((item) => ({
        item_number: item.itemNumber || null,
        name_ar: item.nameAr,
        name_en: item.nameEn,
        category: item.categoryAr,
        price: item.price,
        discounted_price: item.discountedPrice,
        image_url: item.imageUrl,
        colors: item.colors,
        sizes: item.sizes,
        in_stock: item.inStock,
        brand: item.brand,
      })),
      { onConflict: 'item_number' }
    );

    if (error) throw error;

    // Return IDs - we'll use the order as IDs since Supabase may not return them all
    return items.map((_, index) => `temp-${Date.now()}-${index}`);
  },

  async update(id: string, data: Partial<FirebaseProduct>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.itemNumber !== undefined) updateData.item_number = data.itemNumber || null;
    if (data.nameAr) updateData.name_ar = data.nameAr;
    if (data.nameEn) updateData.name_en = data.nameEn;
    if (data.categoryAr) updateData.category = data.categoryAr;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discountedPrice !== undefined) updateData.discounted_price = data.discountedPrice;
    if (data.imageUrl) updateData.image_url = data.imageUrl;
    if (data.colors) updateData.colors = data.colors;
    if (data.sizes) updateData.sizes = data.sizes;
    if (data.inStock !== undefined) updateData.in_stock = data.inStock;
    if (data.brand) updateData.brand = data.brand;

    const { error } = await supabase.from(TABLE).update(updateData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },
};