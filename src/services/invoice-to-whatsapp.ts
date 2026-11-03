import { getStoredWhatsAppNumber, normalizeWhatsAppNumber } from './whatsapp-order';

export interface OrderItemInvoice {
  nameAr: string;
  itemNumber?: string;
  unifiedCode?: string;
  size?: string;
  color?: string;
  brand?: string;
  quantity: number;
  image?: string;
  unitPrice?: number;
  decision?: 'pending' | 'accepted' | 'rejected';
}

export interface OrderInvoiceData {
  orderId: string;
  customerName: string;
  phonePrimary: string;
  phoneSecondary?: string;
  deliveryAddress: string;
  city?: string;
  landmark?: string;            // علامة مميزة لمكان التوصيل
  deliveryTimeWindow?: string;   // مدة التوصيل من - إلى
  notes?: string;
  items: OrderItemInvoice[];
  totalPrice?: number;
  createdAt: string;
  status?: string;
}

/**
 * صياغة رسالة واتساب رسمية واحترافية لكارت الفاتورة
 * يرسلها العميل لموظف المبيعات ليرد بالأسعار وقيمة الفاتورة وموعد وصول الشحنة
 */
export const generateInvoiceMessage = (order: OrderInvoiceData): string => {
  const itemsText = order.items
    .map((item, i) => {
      const specs = [item.size, item.color].filter(Boolean).join(' - ');
      const specsText = specs ? ` [${specs}]` : '';
      const priceText = item.unitPrice !== undefined ? `\n   سعر الوحدة: ${item.unitPrice} جنيه` : '';
      return `${i + 1}. *${item.nameAr}*${specsText}\n   الكمية المطلوبة: ${item.quantity} قطع${priceText}`;
    })
    .join('\n\n');

  const secondaryPhoneText = order.phoneSecondary ? `\n📞 *رقم الموبايل الإضافي:* ${order.phoneSecondary}` : '';
  const landmarkText = order.landmark ? `\n🏛️ *علامة مميزة للعنوان:* ${order.landmark}` : '';
  const windowText = order.deliveryTimeWindow ? `\n⏱️ *مدة وميعاد التوصيل المفضل:* ${order.deliveryTimeWindow}` : '';
  const notesText = order.notes ? `\n📝 *ملاحظات العميل:* ${order.notes}` : '';

  return `*📋 كارت فاتورة طلب جديد - طنطاوي جروب للأجهزة المنزلية والكهربية*
━━━━━━━━━━━━━━━━━━━━━
🔢 *رقم كارت الطلب:* #${order.orderId}
📅 *تاريخ الطلب:* ${order.createdAt}

👤 *بيانات العميل المستلم:*
• الاسم: *${order.customerName}*
• رقم الموبايل الأساسي: *${order.phonePrimary}*${secondaryPhoneText}
• عنوان التوصيل: *${order.city ? `${order.city} - ` : ''}${order.deliveryAddress}*${landmarkText}${windowText}${notesText}

🛍️ *الأصناف المطلوبة في الأوردر:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━━
⚠️ *ملاحظة هامة لموظف المبيعات والتوزيع:*
برجاء الإفادة بأسعار الأصناف المعتمدة وإجمالي قيمة الفاتورة وتأكيد ميعاد خروج الشحنة مع المندوب.
📞 الخط الساخن: 15218`;
};

export const generateQuoteMessage = (order: OrderInvoiceData): string => {
  const itemsText = order.items
    .map((item, index) => {
      const lineTotal = (item.unitPrice || 0) * item.quantity;
      return `${index + 1}. ${item.nameAr}\n   الكمية: ${item.quantity} × ${item.unitPrice || 0} جنيه = ${lineTotal} جنيه`;
    })
    .join('\n\n');

  return `السلام عليكم أ/ ${order.customerName}،\nعرض السعر لطلب رقم #${order.orderId}:\n\n${itemsText}\n\nإجمالي الطلب: ${order.totalPrice || 0} جنيه\nمدة التوصيل: ${order.deliveryTimeWindow || 'يتم التأكيد عند اعتماد الطلب'}\n\nبرجاء تأكيد الأصناف المطلوبة أو إرسال التعديلات.\nطنطاوي جروب`;
};

/**
 * إرسال الفاتورة مباشرة لواتساب المبيعات المعتمد
 */
export const sendInvoiceToWhatsApp = (
  order: OrderInvoiceData,
  customSalesPhone?: string
): void => {
  const phone = normalizeWhatsAppNumber(customSalesPhone || getStoredWhatsAppNumber());
  const message = generateInvoiceMessage(order);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const sendQuoteToCustomerWhatsApp = (order: OrderInvoiceData): void => {
  const phone = normalizeWhatsAppNumber(order.phonePrimary);
  const message = generateQuoteMessage(order);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
};