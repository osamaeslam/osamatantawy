import { getStoredWhatsAppNumber, normalizeWhatsAppNumber } from './whatsapp-order';

export interface OrderItemInvoice {
  id?: string;
  nameAr: string;
  itemNumber?: string;
  unifiedCode?: string;
  size?: string;
  color?: string;
  brand?: string;
  quantity: number;
  unitPrice?: number;         // سعر الوحدة بالجنيه المصري (يدخله الموظف)
  totalItemPrice?: number;    // إجمالي الصنف = unitPrice * quantity
  image?: string;
}

export interface OrderInvoiceData {
  orderId: string;
  customerName: string;
  phonePrimary: string;
  phoneSecondary?: string;
  contactPreference?: 'whatsapp' | 'call' | 'both'; // طريقة التواصل المفضلة
  deliveryAddress: string;
  city?: string;
  landmark?: string;            // علامة مميزة لمكان التوصيل
  deliveryTimeWindow?: string;   // مدة وميعاد التوصيل المفضل من - إلى
  notes?: string;
  items: OrderItemInvoice[];
  itemsSubtotal?: number;       // مجموع أسعار الأصناف
  deliveryFee?: number;         // مصاريف الشحن
  discount?: number;            // الخصم المعتمد
  totalPrice?: number;          // الإجمالي النهائي للفاتورة
  createdAt: string;
  status?: string;
}

/**
 * رسالة الواتساب الأولى: رسالة ذكية ومختصرة واحدة فقط بدون رص نصوص طويل
 * ترسل لإدارة المبيعات برقم الطلب وبيانات العميل وعدد الأصناف لسرعة المعالجة
 */
export const generateCustomerOrderRequestMessage = (order: OrderInvoiceData): string => {
  const totalQty = order.items.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);
  
  const contactText = order.contactPreference === 'whatsapp' 
    ? '🟢 واتساب فقط' 
    : order.contactPreference === 'call' 
    ? '📞 اتصال هاتفي' 
    : '📱 واتساب أو اتصال';

  const secondaryPhoneText = order.phoneSecondary ? `\n📞 *موبايل إضافي:* ${order.phoneSecondary}` : '';
  const landmarkText = order.landmark ? `\n🏛️ *علامة مميزة:* ${order.landmark}` : '';
  const windowText = order.deliveryTimeWindow ? `\n⏱️ *موعد التوصيل:* ${order.deliveryTimeWindow}` : '';
  const notesText = order.notes ? `\n📝 *ملاحظات:* ${order.notes}` : '';

  // ملخص سريع للأصناف بالكود فقط دون سرد نصوص مكررة
  const itemsSummary = order.items
    .map((item, i) => {
      const code = item.unifiedCode || item.itemNumber ? ` [كود: ${item.unifiedCode || item.itemNumber}]` : '';
      return `• ${item.nameAr}${code} × (عدد ${item.quantity})`;
    })
    .join('\n');

  return `*🛒 طلب شراء جديد - دريم طنطاوي جروب للأجهزة*
━━━━━━━━━━━━━━━━━━━━━
🔢 *رقم الطلب:* #${order.orderId}
📅 *التاريخ:* ${order.createdAt}

👤 *بيانات العميل والتوصيل:*
• الاسم: *${order.customerName}*
• الموبايل: *${order.phonePrimary}* (${contactText})${secondaryPhoneText}
• العنوان: *${order.city ? `${order.city} - ` : ''}${order.deliveryAddress}*${landmarkText}${windowText}${notesText}

📦 *الأصناف المطلوبة (${order.items.length} صنف / ${totalQty} قطعة):*
${itemsSummary}
━━━━━━━━━━━━━━━━━━━━━
⚠️ *ملاحظة للمبيعات:* برجاء تسجيل الأسعار على كارت الفاتورة وإرسالها للعميل للتأكيد.
📞 الخط الساخن: 15218`;
};

/**
 * رسالة كارت الفاتورة النهائي المعتمد:
 * يرسلها الموظف إلى واتساب العميل بضغطة زر واحدة بعد كتابة الأسعار
 */
export const generateFinalCustomerInvoiceMessage = (order: OrderInvoiceData): string => {
  const itemsText = order.items
    .map((item, i) => {
      const code = item.unifiedCode || item.itemNumber ? ` (كود: ${item.unifiedCode || item.itemNumber})` : '';
      const unit = item.unitPrice && item.unitPrice > 0 ? `${item.unitPrice.toLocaleString('ar-EG')} ج.م` : 'قيد التقدير';
      const total = item.unitPrice && item.unitPrice > 0 
        ? `${((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString('ar-EG')} ج.م` 
        : '-';
      return `${i + 1}. *${item.nameAr}*${code}\n   الكمية: ${item.quantity} | سعر الوحدة: ${unit} | الإجمالي: ${total}`;
    })
    .join('\n\n');

  const subtotal = order.itemsSubtotal || order.items.reduce((acc, curr) => acc + ((curr.unitPrice || 0) * (curr.quantity || 1)), 0);
  const delivery = order.deliveryFee || 0;
  const discount = order.discount || 0;
  const grandTotal = order.totalPrice || (subtotal + delivery - discount);

  return `*🧾 كارت الفاتورة المعتمد - طنطاوي جروب للأجهزة المنزلية والكهربية*
━━━━━━━━━━━━━━━━━━━━━
🔢 *رقم الفاتورة:* #${order.orderId}
📅 *التاريخ:* ${order.createdAt}

👤 *السيد/ة:* *${order.customerName}*
📍 *عنوان التوصيل:* *${order.city ? `${order.city} - ` : ''}${order.deliveryAddress}*
${order.landmark ? `🏛️ *علامة مميزة:* ${order.landmark}\n` : ''}${order.deliveryTimeWindow ? `⏱️ *مدة التوصيل:* ${order.deliveryTimeWindow}\n` : ''}
📋 *تفاصيل الأصناف والأسعار المعتمدة:*
${itemsText}
━━━━━━━━━━━━━━━━━━━━━
💵 *إجمالي قيمة الأصناف:* ${subtotal.toLocaleString('ar-EG')} ج.م
🚚 *مصاريف الشحن والتوصيل:* ${delivery > 0 ? `${delivery.toLocaleString('ar-EG')} ج.م` : 'شحن مجاني 🎁'}
${discount > 0 ? `🏷️ *خصم خاص:* ${discount.toLocaleString('ar-EG')} ج.م\n` : ''}💰 *المبلغ النهائي المطلوب عند الاستلام:* ${grandTotal.toLocaleString('ar-EG')} ج.م
━━━━━━━━━━━━━━━━━━━━━
🛡️ *شروط وضمانات الاستلام:*
• دفع عند الاستلام بعد الفحص والمعاينة الشاملة للأجهزة.
• ضمان طنطاوي جروب الرسمي وضمان الوكيل المعتمد لجميع المحافظات.
• الخط الساخن المباشر لخدمة العملاء: 15218

💬 *برجاء الرد بكلمة (موافق) على هذه الرسالة لتأكيد تجهيز الأوردر وخروج الشحنة فوراً.*`;
};

/**
 * متوافق مع الاستدعاءات القديمة لإنشاء الرسالة
 */
export const generateInvoiceMessage = generateCustomerOrderRequestMessage;

/**
 * إرسال إشعار الطلب الجديد لواتساب المبيعات
 */
export const sendInvoiceToWhatsApp = (
  order: OrderInvoiceData,
  customSalesPhone?: string
): void => {
  const phone = normalizeWhatsAppNumber(customSalesPhone || getStoredWhatsAppNumber());
  const message = generateCustomerOrderRequestMessage(order);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

/**
 * إرسال الفاتورة النهائية مباشرة إلى رقم هاتف العميل نفسه على الواتساب
 */
export const sendFinalInvoiceToCustomerWhatsApp = (
  order: OrderInvoiceData
): void => {
  const customerPhone = normalizeWhatsAppNumber(order.phonePrimary);
  const message = generateFinalCustomerInvoiceMessage(order);
  const url = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};