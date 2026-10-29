export interface OrderItemInvoice {
  nameAr: string;
  quantity: number;
  image?: string;
}

export interface OrderInvoiceData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItemInvoice[];
  totalPrice: number;
  createdAt?: string;
}

export const generateInvoiceMessage = (order: OrderInvoiceData): string => {
  const itemsText = order.items
    .map(
      (item, i) =>
        `${i + 1}. ${item.nameAr} - الكمية: ${item.quantity}`
    )
    .join('\n');

  return `🧾 فاتورة طلب جديد - طنطاوي جروب

📋 رقم الطلب: ${order.orderId}
👤 العميل: ${order.customerName}
📞 التليفون: ${order.customerPhone}
📍 العنوان: ${order.customerAddress || 'غير محدد'}
📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}

🛍️ الأصناف:
${itemsText}

💰 الإجمالي: ${order.totalPrice} جنيه
💳 الدفع: عند الاستلام (بعد المعاينة)
⚠️ السعر خاضع للتعديل حسب الكمية (جملة / قطاعي)

للاستفسار والتأكيد: الخط الساخن 15218`;
};

export const sendInvoiceToWhatsApp = (
  order: OrderInvoiceData,
  salesPhone: string = '201521800000' // رقم المبيعات الحالي - قابل للتغيير لاحقًا
): void => {
  const message = generateInvoiceMessage(order);
  const url = `https://wa.me/${salesPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};