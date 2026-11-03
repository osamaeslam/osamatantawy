import { Product } from '../types';
import { getSafeImageSrc } from '../utils/imageHelper';
import { normalizeImageUrl } from '../services/image-url';

export function mapSupabaseToProduct(item: any, index = 0): Product {
  const safeImage = getSafeImageSrc(normalizeImageUrl(item.image_url || item.imageUrl));
  const name = item.name_ar || item.nameAr || item.name_en || item.nameEn || `منتج طنطاوي #${index + 1}`;
  const category = item.category || item.categoryAr || 'أجهزة منزلية';
  
  const rawSizes = Array.isArray(item.sizes) ? item.sizes : [];
  const cleanSizes = rawSizes.filter((s: string) => s && s !== '(blank)' && s.trim() !== '');

  const rawColors = Array.isArray(item.colors) ? item.colors : [];
  const cleanColors = rawColors.filter((c: string) => c && c !== '(blank)' && c.trim() !== '');

  return {
    id: String(item.id || `sp-${index}`),
    name: name,
    nameAr: name,
    category: category === 'أجهزة كهربيه' ? 'Electrical Appliances' : 'Home Appliances',
    categoryAr: category,
    summary: `${category} - كود: TG-${String(item.id).slice(0, 6)}`,
    summaryAr: `${category} - كود: TG-${String(item.id).slice(0, 6)}`,
    description: item.description_ar || item.description || `منتج أصلي معتمد من طنطاوي جروب للأجهزة المنزلية والكهربية.`,
    descriptionAr: item.description_ar || item.description || `منتج أصلي معتمد من طنطاوي جروب للأجهزة المنزلية والكهربية.`,
    actualprice: Number(item.price) || 0,
    discountpercent: item.discounted_price && item.price ? Math.max(0, Math.round(((item.price - item.discounted_price) / item.price) * 100)) : 0,
    overallrating: 4.8,
    previewimage: safeImage,
    previewimages: Array.isArray(item.preview_images) && item.preview_images.length > 0 
      ? item.preview_images.map((img: string) => getSafeImageSrc(normalizeImageUrl(img)))
      : [safeImage],
    reviews: [],
    quantities: ['1', '2', '3', '5'],
    sizevariants: cleanSizes.length > 0 ? cleanSizes : ['قياسي'],
    size: cleanSizes[0] || 'قياسي',
    color: cleanColors[0] || 'أصلي',
    isDeal: Boolean(item.discounted_price && item.discounted_price > 0),
    inStock: item.in_stock !== false,
    brand: item.brand || 'طنطاوي جروب',
    itemNumber: `ITM-${String(item.id).slice(0, 8)}`,
    unifiedCode: `TG-${String(item.id).slice(0, 6)}`,
    itemGroup: category,
    familyName: category,
    imageLink: safeImage,
    sector: category
  };
}
