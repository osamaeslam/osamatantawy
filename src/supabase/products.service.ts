import { supabase } from './config';
import type { FirebaseProduct } from '../types/firebase';
import type { Product } from '../types';
import { mapSupabaseToProduct } from './product-mapper';

const TABLE = 'products';
export const SLIM_PRODUCT_COLUMNS =
  'id,name_ar,name_en,category,price,discounted_price,image_url,colors,sizes,in_stock,brand,item_number,import_key';
export const AUDIT_PRODUCT_COLUMNS =
  'id,name_ar,category,price,image_url,brand,item_number,import_key';

const mapRowToFirebaseProduct = (item: any): FirebaseProduct => ({
  id: item.id,
  nameAr: item.name_ar,
  nameEn: item.name_en,
  categoryAr: item.category,
  category: item.category,
  price: item.price,
  discountedPrice: item.discounted_price,
  imageUrl: item.image_url,
  itemNumber: item.item_number,
  importKey: item.import_key,
  colors: item.colors || [],
  sizes: item.sizes || [],
  inStock: item.in_stock,
  brand: item.brand,
  createdAt: item.created_at,
});

const sanitizeSearchForPostgrest = (q: string): string =>
  q.trim().replace(/[%_,()]/g, ' ').replace(/\s+/g, ' ').trim();

export interface PagedProductsParams {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string | null;
  inStockOnly?: boolean;
}

export const productService = {
  async getTotalCount(): Promise<number> {
    const { count, error } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  /**
   * جلب المنتجات على صفحات صغيرة مع بحث وفلاتر من Supabase مباشرة (Server-Side Search & Pagination)
   * مثالي لكتالوجات 5,000 - 10,000 منتج لضمان فتح التطبيق في لحظة على الموبايل
   */
  async getPaged(params: PagedProductsParams = {}): Promise<{
    items: FirebaseProduct[];
    totalCount: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(250, Math.max(1, params.pageSize || 24));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let req = supabase
      .from(TABLE)
      .select(SLIM_PRODUCT_COLUMNS, { count: 'exact' })
      .order('id', { ascending: false });

    if (params.category && params.category !== 'all' && params.category !== 'الكل') {
      req = req.eq('category', params.category);
    }

    if (params.inStockOnly) {
      req = req.eq('in_stock', true);
    }

    const cleanQ = params.query ? sanitizeSearchForPostgrest(params.query) : '';
    if (cleanQ) {
      const pattern = `%${cleanQ}%`;
      req = req.or(
        `name_ar.ilike.${pattern},name_en.ilike.${pattern},brand.ilike.${pattern},category.ilike.${pattern},item_number.ilike.${pattern},import_key.ilike.${pattern}`
      );
    }

    const { data, count, error } = await req.range(from, to);
    if (error) throw error;

    return {
      items: (data || []).map(mapRowToFirebaseProduct),
      totalCount: count ?? (data?.length || 0),
      page,
      pageSize,
    };
  },

  /**
   * نفس الاستعلام الموزّع على الخادم مع تحويل النتيجة مباشرة لنموذج Product الخاص بالمتجر
   */
  async getMappedPaged(params: PagedProductsParams = {}): Promise<{
    products: Product[];
    totalCount: number;
    page: number;
    pageSize: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(250, Math.max(1, params.pageSize || 24));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let req = supabase
      .from(TABLE)
      .select(SLIM_PRODUCT_COLUMNS, { count: 'exact' })
      .order('id', { ascending: false });

    if (params.category && params.category !== 'all' && params.category !== 'الكل') {
      req = req.eq('category', params.category);
    }

    if (params.inStockOnly) {
      req = req.eq('in_stock', true);
    }

    const cleanQ = params.query ? sanitizeSearchForPostgrest(params.query) : '';
    if (cleanQ) {
      const pattern = `%${cleanQ}%`;
      req = req.or(
        `name_ar.ilike.${pattern},name_en.ilike.${pattern},brand.ilike.${pattern},category.ilike.${pattern},item_number.ilike.${pattern},import_key.ilike.${pattern}`
      );
    }

    const { data, count, error } = await req.range(from, to);
    if (error) throw error;

    return {
      products: (data || []).map((row, idx) => mapSupabaseToProduct(row, from + idx)),
      totalCount: count ?? (data?.length || 0),
      page,
      pageSize,
    };
  },

  async getMappedDeals(limit = 24): Promise<Product[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SLIM_PRODUCT_COLUMNS)
      .gt('discounted_price', 0)
      .order('id', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((row, idx) => mapSupabaseToProduct(row, idx));
  },

  async getMappedByBrand(brand: string, limit = 60): Promise<Product[]> {
    const cleanBrand = sanitizeSearchForPostgrest(brand);
    if (!cleanBrand) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select(SLIM_PRODUCT_COLUMNS)
      .ilike('brand', `%${cleanBrand}%`)
      .order('id', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((row, idx) => mapSupabaseToProduct(row, idx));
  },

  /**
   * جلب حقول الفحص المختصرة فقط لمدقق جودة الكتالوج (توفير كبير لاستهلاك Egress)
   */
  async getAuditSnapshot(): Promise<FirebaseProduct[]> {
    const data: any[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data: page, error } = await supabase
        .from(TABLE)
        .select(AUDIT_PRODUCT_COLUMNS)
        .order('id', { ascending: false })
        .range(offset, offset + 999);
      if (error) throw error;
      data.push(...(page || []));
      if (!page || page.length < 1000) break;
    }

    return data.map(mapRowToFirebaseProduct);
  },

  async getAll(): Promise<FirebaseProduct[]> {
    const data: any[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data: page, error } = await supabase
        .from(TABLE)
        .select(SLIM_PRODUCT_COLUMNS)
        .order('id', { ascending: false })
        .range(offset, offset + 999);
      if (error) throw error;
      data.push(...(page || []));
      if (!page || page.length < 1000) break;
    }

    return data.map(mapRowToFirebaseProduct);
  },

  async getById(id: string): Promise<FirebaseProduct | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(SLIM_PRODUCT_COLUMNS)
      .eq('id', id)
      .single();

    if (error) return null;
    if (!data) return null;

    return mapRowToFirebaseProduct(data);
  },

  async create(data: Omit<FirebaseProduct, 'id'>): Promise<string> {
    let categoryValue = data.categoryAr || data.category || 'أجهزة منزلية';
    const lowerName = data.nameAr.toLowerCase();
    if (/ثلاجة|غسالة|بوتاجاز/.test(lowerName)) categoryValue = 'أجهزة منزلية';
    else if (/شاشة|تكييف|مكنسة/.test(lowerName)) categoryValue = 'أجهزة كهربيه';

    const { error, data: upserted } = await supabase
      .from(TABLE)
      .upsert(
        {
          name_ar: data.nameAr,
          name_en: data.nameEn,
          item_number: data.itemNumber || null,
          import_key: data.importKey || null,
          category: categoryValue,
          price: data.price,
          discounted_price: data.discountedPrice,
          image_url: data.imageUrl,
          colors: data.colors,
          sizes: data.sizes,
          in_stock: data.inStock,
          brand: data.brand,
        },
        {
          onConflict: data.importKey ? 'import_key' : 'name_ar, category',
        }
      )
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
        import_key: item.importKey || null,
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
      { onConflict: 'import_key' }
    );

    if (error) throw error;

    return items.map((_, index) => `temp-${Date.now()}-${index}`);
  },

  async update(id: string, data: Partial<FirebaseProduct>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.itemNumber !== undefined) updateData.item_number = data.itemNumber || null;
    if (data.importKey !== undefined) updateData.import_key = data.importKey || null;
    if (data.nameAr !== undefined) updateData.name_ar = data.nameAr;
    if (data.nameEn !== undefined) updateData.name_en = data.nameEn;
    if (data.categoryAr !== undefined) updateData.category = data.categoryAr;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discountedPrice !== undefined) updateData.discounted_price = data.discountedPrice;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.colors !== undefined) updateData.colors = data.colors;
    if (data.sizes !== undefined) updateData.sizes = data.sizes;
    if (data.inStock !== undefined) updateData.in_stock = data.inStock;
    if (data.brand !== undefined) updateData.brand = data.brand;

    const { error } = await supabase.from(TABLE).update(updateData).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },
};