import { Product } from '../types';
import { getSafeImageSrc } from '../utils/imageHelper';
import { normalizeImageUrl } from '../services/image-url';

// Intelligent subcategory deducer based on product title & appliances keywords
export function deduceSubcategory(nameAr: string, category: string): { itemGroup: string; familyName: string } {
  const n = (nameAr || '').toLowerCase();
  
  if (category === 'أجهزة كهربيه' || category === 'Electrical Appliances') {
    if (n.includes('هاند بلندر') || n.includes('بلندر')) return { itemGroup: 'هاند بلندر ومحضرات', familyName: 'هاند بلندر' };
    if (n.includes('مكوا') || n.includes('مكواه')) return { itemGroup: 'مكاوي بخار', familyName: 'مكاوي بخار' };
    if (n.includes('محضر طعام') || n.includes('محضرات')) return { itemGroup: 'محضرات طعام', familyName: 'محضرات طعام' };
    if (n.includes('عجان')) return { itemGroup: 'عجانات', familyName: 'عجانات' };
    if (n.includes('مضرب')) return { itemGroup: 'مضارب بيض وكبات', familyName: 'مضارب بيض' };
    if (n.includes('كبه') || n.includes('كبة') || n.includes('مفرم')) return { itemGroup: 'كبات ومفارم لحوم', familyName: 'كبات ومفارم' };
    if (n.includes('غلاي') || n.includes('غلايه') || n.includes('براد كهرب')) return { itemGroup: 'غلايات مياه', familyName: 'غلايات مياه' };
    if (n.includes('قلاي') || n.includes('ايرفراير')) return { itemGroup: 'قلايات هوائية', familyName: 'قلايات هوائية' };
    if (n.includes('عصار') || n.includes('عصاره')) return { itemGroup: 'عصارات فواكه', familyName: 'عصارات' };
    if (n.includes('فرن')) return { itemGroup: 'أفران كهربائية', familyName: 'أفران' };
    if (n.includes('ميكروويف') || n.includes('مايكروويف')) return { itemGroup: 'ميكروويف وأفران', familyName: 'ميكروويف' };
    if (n.includes('قهوة') || n.includes('اسبريسو') || n.includes('مطحنة قهوة')) return { itemGroup: 'صانعات قهوة ومطاحن', familyName: 'صانعات قهوة' };
    if (n.includes('خلاط')) return { itemGroup: 'خلاطات وعجانات', familyName: 'خلاطات' };
    if (n.includes('مروح') || n.includes('مروحة')) return { itemGroup: 'مراوح سقف واستاند', familyName: 'مراوح' };
    if (n.includes('دفاية') || n.includes('دفايه')) return { itemGroup: 'دفايات', familyName: 'دفايات' };
    if (n.includes('ميزان')) return { itemGroup: 'موازين إلكترونية', familyName: 'موازين إلكترونية' };
    if (n.includes('توستر') || n.includes('ساندوتش') || n.includes('جريل')) return { itemGroup: 'توستر وساندوتش ميكر', familyName: 'توستر' };
    if (n.includes('شاش') || n.includes('تلفزيون')) return { itemGroup: 'شاشات وتلفزيونات', familyName: 'شاشات وتلفزيونات' };
    if (n.includes('تكييف')) return { itemGroup: 'تكييفات هواء', familyName: 'تكييفات' };
    if (n.includes('مكنس') || n.includes('مكنسة')) return { itemGroup: 'مكانس كهربائية', familyName: 'مكانس' };
    if (n.includes('استشوار') || n.includes('حلاقة') || n.includes('عناية')) return { itemGroup: 'أجهزة عناية شخصية واستشوار', familyName: 'عناية شخصية' };
    return { itemGroup: 'أجهزة كهربية متنوعة', familyName: 'أجهزة كهربية' };
  }

  // Home appliances & tableware categories
  if (n.includes('حلة') || n.includes('حلل') || n.includes('طقم حلة')) return { itemGroup: 'أطقم حلل وأواني طهي', familyName: 'أطقم طهي' };
  if (n.includes('مقلا') || n.includes('مقلاية') || n.includes('طاسة') || n.includes('ووك') || n.includes('جريل')) return { itemGroup: 'مقالي وصواني طهي', familyName: 'مقالي' };
  if (n.includes('صني') || n.includes('صنية') || n.includes('صينية')) return { itemGroup: 'صواني تقديم وطهي', familyName: 'صواني' };
  if (n.includes('مج') || n.includes('شوب') || n.includes('كوب')) return { itemGroup: 'مجات وكاسات وشوب', familyName: 'مجات وكاسات' };
  if (n.includes('فنجان') || n.includes('فناجين')) return { itemGroup: 'فناجين شاي وقهوة', familyName: 'فناجين' };
  if (n.includes('معلق') || n.includes('معلقة') || n.includes('شوكة') || n.includes('سكين') || n.includes('سكينة')) return { itemGroup: 'أطقم ملاعق وسكاكين', familyName: 'ملاعق وسكاكين' };
  if (n.includes('توزيع') || n.includes('سيليكون')) return { itemGroup: 'أطقم توزيع وسيليكون', familyName: 'أطقم توزيع' };
  if (n.includes('توابل') || n.includes('بهارات')) return { itemGroup: 'أطقم توابل ومطبخ', familyName: 'أطقم توابل' };
  if (n.includes('بولة') || n.includes('بولات')) return { itemGroup: 'بولات تقديم وأيس كريم', familyName: 'بولات' };
  if (n.includes('بمبونير') || n.includes('بمبونيرة')) return { itemGroup: 'بمبونيرات وتحف', familyName: 'بمبونيرات' };
  if (n.includes('شيا') || n.includes('شيالة')) return { itemGroup: 'شيالات كحك وتسالي', familyName: 'شيالات' };
  if (n.includes('براد') || n.includes('ترمس') || n.includes('كنك')) return { itemGroup: 'برادات وترامس وكنك', familyName: 'برادات وترامس' };
  if (n.includes('حافظ') || n.includes('حوافظ') || n.includes('علب')) return { itemGroup: 'حوافظ وعلب طعام', familyName: 'حوافظ طعام' };
  if (n.includes('ميلامين') || n.includes('صيني') || n.includes('اركوبال')) return { itemGroup: 'أطقم سفرة وميلامين', familyName: 'أطقم سفرة' };
  if (n.includes('قالب') || n.includes('كيك') || n.includes('صواني فرن')) return { itemGroup: 'قوالب كيك ومستلزمات فرن', familyName: 'قوالب كيك' };
  if (n.includes('ثلاج') || n.includes('ثلاجة')) return { itemGroup: 'ثلاجات', familyName: 'ثلاجات' };
  if (n.includes('ديب فريزر') || n.includes('فريزر')) return { itemGroup: 'ديب فريزر', familyName: 'ديب فريزر' };
  if (n.includes('غسال') || n.includes('غسالة')) return { itemGroup: 'غسالات ملابس وأطباق', familyName: 'غسالات' };
  if (n.includes('بوتاجاز') || n.includes('مسطح') || n.includes('فرن بلت')) return { itemGroup: 'بوتاجازات ومسطحات بلت إن', familyName: 'بوتاجازات' };

  return { itemGroup: 'أدوات منزلية ومطبخ', familyName: 'أدوات منزلية' };
}

export function mapSupabaseToProduct(item: any, index = 0): Product {
  const safeImage = getSafeImageSrc(normalizeImageUrl(item.image_url || item.imageUrl));
  const name = item.name_ar || item.nameAr || item.name_en || item.nameEn || `منتج طنطاوي #${index + 1}`;
  const category = item.category || item.categoryAr || 'أجهزة منزلية';
  
  const rawSizes = Array.isArray(item.sizes) ? item.sizes : [];
  const cleanSizes = rawSizes.filter((s: string) => s && s !== '(blank)' && s.trim() !== '');

  const rawColors = Array.isArray(item.colors) ? item.colors : [];
  const cleanColors = rawColors.filter((c: string) => c && c !== '(blank)' && c.trim() !== '');

  // Subcategory resolution
  const explicitGroup = (item.item_group || item.itemGroup || '').trim();
  const explicitFamily = (item.family_name || item.familyName || '').trim();
  
  const deduced = (!explicitGroup || explicitGroup === category || explicitGroup === 'عام')
    ? deduceSubcategory(name, category)
    : { itemGroup: explicitGroup, familyName: explicitFamily || explicitGroup };

  return {
    id: String(item.id || `sp-${index}`),
    name: name,
    nameAr: name,
    category: category === 'أجهزة كهربيه' ? 'Electrical Appliances' : 'Home Appliances',
    categoryAr: category,
    summary: `${deduced.itemGroup} - كود: TG-${String(item.id).slice(0, 6)}`,
    summaryAr: `${deduced.itemGroup} - كود: TG-${String(item.id).slice(0, 6)}`,
    description: item.description_ar || item.description || `منتج أصلي معتمد من طنطاوي جروب للأجهزة المنزلية والكهربية. القسم: ${deduced.itemGroup}.`,
    descriptionAr: item.description_ar || item.description || `منتج أصلي معتمد من طنطاوي جروب للأجهزة المنزلية والكهربية. القسم: ${deduced.itemGroup}.`,
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
    itemNumber: item.item_number || `ITM-${String(item.id).slice(0, 8)}`,
    importKey: item.import_key || undefined,
    unifiedCode: `TG-${String(item.id).slice(0, 6)}`,
    itemGroup: deduced.itemGroup,
    familyName: deduced.familyName,
    imageLink: safeImage,
    sector: category
  };
}
