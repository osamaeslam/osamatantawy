import { Product, CartItem } from '../types';

export const TANTAWY_DEFAULT_SALES_PHONE = '201521800000'; // رقم المبيعات الافتراضي
export const TANTAWY_SALES_PHONE = TANTAWY_DEFAULT_SALES_PHONE;
export const TANTAWY_HOTLINE = '15218';

/**
 * تنظيف وتطبيع رقم الواتساب ليتوافق تماماً مع صيغة wa.me العالمية
 * يدعم الأرقام المصرية (010, 011, 012, 015) ويحولها تلقائياً لكود الدولة 20
 */
export function normalizeWhatsAppNumber(phone?: string | null): string {
  if (!phone) return TANTAWY_DEFAULT_SALES_PHONE;

  // إزالة المسافات والرموز والأقواس و +
  let cleaned = phone.replace(/[^0-9]/g, '');

  if (!cleaned) return TANTAWY_DEFAULT_SALES_PHONE;

  // إزالة 00 في بداية الكود الدولي إذا وجدت
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // إذا كان الرقم مصري يبدأ بـ 01 (مثل 01012345678 أو 011 أو 012 أو 015) وطوله 11 رقم
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '2' + cleaned; // يصبح 201012345678
  }

  // إذا كان الرقم 10 أرقام ويبدأ بـ 1 (بدون 0 الأول)
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    cleaned = '20' + cleaned;
  }

  return cleaned;
}

/**
 * استرجاع رقم الواتساب المحفوظ من إعدادات الإدارة مباشرة
 */
export function getStoredWhatsAppNumber(): string {
  try {
    const directPhone = localStorage.getItem('tantawy_whatsapp_number');
    if (directPhone) return normalizeWhatsAppNumber(directPhone);

    const configStr = localStorage.getItem('tantawy_homepage_config');
    if (configStr) {
      const parsed = JSON.parse(configStr);
      if (parsed.whatsappNumber) {
        return normalizeWhatsAppNumber(parsed.whatsappNumber);
      }
    }
  } catch (e) {
    console.warn('Error reading stored whatsapp number:', e);
  }
  return TANTAWY_DEFAULT_SALES_PHONE;
}

/**
 * إنشاء رابط واتساب مباشر لطلب منتج محدد أو الاستفسار عنه
 */
export function createProductWhatsAppUrl(
  product: Product,
  quantity = 1,
  selectedVariant?: string,
  customPhone?: string
): string {
  const targetPhone = normalizeWhatsAppNumber(customPhone || getStoredWhatsAppNumber());
  const variantText = selectedVariant ? `\n🔘 الموديل / السعة: ${selectedVariant}` : '';
  const itemCodeText = product.unifiedCode || product.itemNumber || `#${product.id}`;

  const message = `السلام عليكم ورحمة الله،
أود الاستفسار وطلب معاينة منزلية لجهاز من *طنطاوي جروب للأجهزة المنزلية*:

📌 *اسم الجهاز:* ${product.nameAr}
🏷️ *القسم / العائلة:* ${product.familyName || product.sector || product.categoryAr}
🔢 *كود الصنف:* ${itemCodeText}${variantText}
📦 *الكمية المطلوبة للمعاينة:* ${quantity}
🚚 *نظام الدفع:* دفع موحد عند الاستلام بعد المعاينة والتجربة التامة
📞 *الخط الساخن:* ${TANTAWY_HOTLINE}

يرجى إفادتي بالسعر وتأكيد موعد وصول المندوب للمعاينة. شكراً لكم!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * إنشاء رابط واتساب مباشر لطلب سلة المعاينة بالكامل
 */
export function createCartWhatsAppUrl(
  cart: CartItem[],
  customerInfo?: { name?: string; phone?: string; address?: string },
  customPhone?: string
): string {
  const targetPhone = normalizeWhatsAppNumber(customPhone || getStoredWhatsAppNumber());
  const itemsList = cart
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.product.nameAr} (${item.product.brand || 'ماركة أصلية'}) - العدد: ${item.quantity}${
          item.selectedSize ? ` [${item.selectedSize}]` : ''
        }`
    )
    .join('\n');

  const customerText = customerInfo?.name
    ? `\n\n👤 *بيانات العميل:*
الاسم: ${customerInfo.name}
الهاتف: ${customerInfo.phone || 'غير مسجل'}
العنوان: ${customerInfo.address || 'غير مسجل'}`
    : '';

  const message = `السلام عليكم ورحمة الله،
أود إرسال طلب معاينة منزلية مجانية لقائمة الأجهزة التالية من *طنطاوي جروب*:

📋 *الأصناف المطلوبة:*
${itemsList}${customerText}

💳 *الدفع:* دفع موحد عند الاستلام بعد المعاينة والفحص الكامل
📞 *الخط الساخن:* ${TANTAWY_HOTLINE}

يرجى التواصل لتأكيد الطلب وموعد زيارة المندوب. شكراً جزيلاً!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * فتح الرابط في نافذة جديدة أو تطبيق واتساب
 */
export function openWhatsApp(url: string): void {
  window.open(url, '_blank');
}
