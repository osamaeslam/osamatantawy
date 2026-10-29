import { Product, CartItem } from '../types';

export const TANTAWY_SALES_PHONE = '201521800000'; // رقم المبيعات المعتمد
export const TANTAWY_HOTLINE = '15218';

/**
 * إنشاء رابط واتساب مباشر لطلب منتج محدد أو الاستفسار عنه
 */
export function createProductWhatsAppUrl(
  product: Product,
  quantity = 1,
  selectedVariant?: string
): string {
  const variantText = selectedVariant ? `\n🔘 الموديل / السعة: ${selectedVariant}` : '';
  const message = `السلام عليكم ورحمة الله،
أود الاستفسار وطلب معاينة منزلية لجهاز من *طنطاوي جروب للأجهزة المنزلية*:

📌 *اسم الجهاز:* ${product.nameAr}
🏷️ *الماركة:* ${product.brand || 'معتمدة'}
🔢 *كود الصنف:* #${product.id}${variantText}
📦 *الكمية المطلوبة للمعاينة:* ${quantity}
🚚 *نظام الدفع:* دفع موحد عند الاستلام بعد المعاينة والتجربة التامة
📞 *الخط الساخن:* ${TANTAWY_HOTLINE}

يرجى إفادتي بالسعر الحالي وتأكيد موعد وصول المندوب للمعاينة. شكراً لكم!`;

  return `https://wa.me/${TANTAWY_SALES_PHONE}?text=${encodeURIComponent(message)}`;
}

/**
 * إنشاء رابط واتساب مباشر لطلب سلة المعاينة بالكامل
 */
export function createCartWhatsAppUrl(
  cart: CartItem[],
  customerInfo?: { name?: string; phone?: string; address?: string }
): string {
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

  return `https://wa.me/${TANTAWY_SALES_PHONE}?text=${encodeURIComponent(message)}`;
}

/**
 * فتح الرابط في نافذة جديدة أو تطبيق واتساب
 */
export function openWhatsApp(url: string): void {
  window.open(url, '_blank');
}
