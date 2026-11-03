import { supabase } from './config';
import type { CategoryItem } from '../types';

const TABLE = 'categories';

export interface CategoryRecord extends CategoryItem {
  id?: number;
  sortOrder?: number;
  isActive?: boolean;
}

/** تحويل صف قاعدة البيانات إلى شكل التطبيق */
function mapRow(row: any): CategoryRecord {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar,
    icon: row.icon || 'Package',
    image: row.image_url || undefined,
    descriptionAr: row.description_ar || '',
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
    subcategoriesAr: Array.isArray(row.subcategories_ar) ? row.subcategories_ar : [],
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active ?? true,
  };
}

/**
 * خدمة الأقسام - إدارة كاملة (CRUD) عبر Supabase
 */
export const categoryService = {
  /** جلب كل الأقسام النشطة مرتبة */
  async getAll(): Promise<CategoryRecord[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapRow);
  },

  /** إضافة قسم جديد */
  async create(item: CategoryItem): Promise<number> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([
        {
          name: item.name,
          name_ar: item.nameAr,
          icon: item.icon,
          image_url: item.image || null,
          description_ar: item.descriptionAr,
          subcategories: item.subcategories,
          subcategories_ar: item.subcategoriesAr,
          sort_order: 999,
          is_active: true,
        },
      ])
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  /** تحديث قسم موجود */
  async update(id: number, item: Partial<CategoryItem>): Promise<void> {
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (item.name !== undefined) payload.name = item.name;
    if (item.nameAr !== undefined) payload.name_ar = item.nameAr;
    if (item.icon !== undefined) payload.icon = item.icon;
    if (item.image !== undefined) payload.image_url = item.image;
    if (item.descriptionAr !== undefined) payload.description_ar = item.descriptionAr;
    if (item.subcategories !== undefined) payload.subcategories = item.subcategories;
    if (item.subcategoriesAr !== undefined) payload.subcategories_ar = item.subcategoriesAr;

    const { error } = await supabase.from(TABLE).update(payload).eq('id', id);
    if (error) throw error;
  },

  /** حذف قسم */
  async delete(id: number): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },

  /** إعادة ترتيب الأقسام بالترتيب المعطى (مصفوفة IDs) */
  async reorder(orderedIds: number[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from(TABLE).update({ sort_order: index }).eq('id', id)
      )
    );
  },
};
