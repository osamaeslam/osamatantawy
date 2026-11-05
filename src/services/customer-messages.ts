import type { FirebaseOrder } from '../types/firebase';
import { normalizeWhatsAppNumber, TANTAWY_HOTLINE } from './whatsapp-order';

/**
 * قوالب رسائل خدمة العملاء (واتساب).
 *
 * الهدف: الموظف يبعت للعميل رسالة واضحة واحترافية بضغطة واحدة،
 * بدل ما يكتب كل مرة من الصفر. مفيش أي API — الرابط بيفتح واتساب
 * على رقم العميل والرسالة جاهزة (الموظف بيراجع ويبعت).
 */

export const STORE_NAME = 'دريم طنطاوي جروب';
export const STORE_TAGLINE = 'للأجهزة المنزلية والكهربية والأدوات المنزلية';

export interface OrderMessageContext {
  orderId: string;
  customerName: string;
  status?: string;
  totalPrice?: number;
  itemsText?: string;
  itemsCount?: number;
  deliveryWindow?: string;
  city?: string;
  address?: string;
  hotline: string;
}

const formatMoney = (value?: number): string | null =>
  value && Number(value) > 0 ? `${Number(value).toLocaleString('ar-EG')} ج.م` : null;

/** يبني سياق الرسالة من سطر الطلب في قاعدة البيانات */
export const buildOrderMessageContext = (
  order: FirebaseOrder,
  hotline: string = TANTAWY_HOTLINE
): OrderMessageContext => {
  const payload: any = (order as any).items || {};
  const rawItems: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.orderedItems)
    ? payload.orderedItems
    : [];

  const items = rawItems.length
    ? rawItems
    : [{ nameAr: order.productNameAr, quantity: order.quantity || 1 }];

  const itemsText = items
    .slice(0, 6)
    .map((item) => `• ${item.nameAr} — عدد ${item.quantity || 1}`)
    .join('\n');

  const itemsCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  return {
    orderId: order.orderId,
    customerName: (order.customerName || '').trim() || 'عميلنا العزيز',
    status: order.status,
    totalPrice: Number(order.totalPrice) || 0,
    itemsText,
    itemsCount,
    deliveryWindow: payload.deliveryTimeWindow || order.selectedSize || undefined,
    city: payload.city || undefined,
    address: payload.deliveryAddress || (order as any).customerAddress || undefined,
    hotline,
  };
};

export interface MessageTemplate {
  id: string;
  label: string;
  emoji: string;
  /** الحالات المناسبة للقالب — تُستخدم لاقتراح القالب تلقائياً */
  statuses?: string[];
  build: (ctx: OrderMessageContext) => string;
}

const greeting = (ctx: OrderMessageContext) =>
  `السلام عليكم ورحمة الله 🌿\nأ/ة ${ctx.customerName}، مع حضرتك فريق ${STORE_NAME}.`;

const footer = (ctx: OrderMessageContext) =>
  `━━━━━━━━━━━━━━━━━━━\n${STORE_NAME} — ${STORE_TAGLINE}\n📞 الخط الساخن: ${ctx.hotline}`;

export const ORDER_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'received',
    label: 'تأكيد استلام الطلب',
    emoji: '📥',
    statuses: ['pending'],
    build: (ctx) =>
      `${greeting(ctx)}\n\nوصلنا طلبكم رقم *#${ctx.orderId}* وجاري مراجعته وتسعيره الآن.\n\n*الأصناف:*\n${ctx.itemsText}\n\nهنبعتلك السعر النهائي وموعد التوصيل في أقرب وقت. شكراً لثقتك 🙏`,
  },
  {
    id: 'priced',
    label: 'إرسال السعر النهائي',
    emoji: '💵',
    statuses: ['priced'],
    build: (ctx) => {
      const total = formatMoney(ctx.totalPrice);
      return `${greeting(ctx)}\n\nتم تسعير طلبكم رقم *#${ctx.orderId}* ✅\n\n*الأصناف:*\n${ctx.itemsText}\n${
        total ? `\n*المبلغ الإجمالي:* ${total}\n` : ''
      }\n*طريقة الدفع:* عند الاستلام بعد الفحص والمعاينة.\n\nمن فضلك رد بـ *موافق* لتأكيد تجهيز الطلب، أو كلمنا لو محتاج تعديل في الكميات.`;
    },
  },
  {
    id: 'confirmed',
    label: 'تأكيد الطلب وتجهيزه',
    emoji: '✅',
    statuses: ['confirmed'],
    build: (ctx) => {
      const total = formatMoney(ctx.totalPrice);
      return `${greeting(ctx)}\n\nتم تأكيد طلبكم رقم *#${ctx.orderId}* وجاري تجهيزه 📦\n${
        total ? `*المبلغ:* ${total}\n` : ''
      }\nهيتواصل معاك المندوب قبل الخروج للتسليم.`;
    },
  },
  {
    id: 'dispatched',
    label: 'خروج الشحنة للتوصيل',
    emoji: '🚚',
    statuses: ['dispatched'],
    build: (ctx) =>
      `${greeting(ctx)}\n\nطلبكم رقم *#${ctx.orderId}* خرج للتوصيل النهارده 🚚\n${
        ctx.deliveryWindow ? `*الموعد المتوقع:* ${ctx.deliveryWindow}\n` : ''
      }${
        ctx.city || ctx.address
          ? `*العنوان:* ${[ctx.city, ctx.address].filter(Boolean).join(' - ')}\n`
          : ''
      }\nبرجاء التأكد من إن رقم الموبايل مفتوح، والأوردر هيتم فحصه قبل الاستلام.`,
  },
  {
    id: 'delivered',
    label: 'شكر بعد التسليم',
    emoji: '🎉',
    statuses: ['delivered'],
    build: (ctx) =>
      `${greeting(ctx)}\n\nسعدنا بخدمتك 🙏 وبنتمنى إن الأوردر رقم *#${ctx.orderId}* يكون عجبك.\n\nلو محتاج أي كمية تانية أو استفسار عن أصناف جديدة، احنا تحت أمرك في أي وقت.\nوممكن ترشحلنا أصناف تحب تكون موجودة عندنا — ده بيساعدنا نخدمك أحسن.`,
  },
  {
    id: 'out_of_stock',
    label: 'اعتذار: صنف غير متوفر',
    emoji: '⚠️',
    build: (ctx) =>
      `${greeting(ctx)}\n\nبخصوص طلبكم رقم *#${ctx.orderId}*، للأسف صنف من الأصناف المطلوبة غير متوفر حالياً في المخزن.\n\nعايزين نعرف رأيك:\n1️⃣ نأجل الطلب لحد ما يتوفر ونبلغك.\n2️⃣ نستبدله بصنف بديل مناسب (نبعتهولك صور وأسعار).\n3️⃣ نلغي الطلب ونرتجع الفرق لو حصل أي دفع.\n\nمنتظر ردك عشان نكمل 🌿\n\n${footer(ctx)}`,
  },
  {
    id: 'follow_up',
    label: 'متابعة: لم يتم الرد',
    emoji: '🔔',
    statuses: ['priced', 'pending'],
    build: (ctx) =>
      `${greeting(ctx)}\n\nحاولنا التواصل معاك بخصوص طلبكم رقم *#${ctx.orderId}* ومقدرناش نوصلك.\n\n*الأصناف:*\n${ctx.itemsText}\n\nلو الطلب لسه مطلوب، رد علينا بكلمة *مهتم* وهنكمّل على طول.\nولو مش مناسب دلوقتي، مفيش أي مشكلة — قولنا ونشيله من قايمة المتابعة.`,
  },
];

/** القالب المقترح تلقائياً حسب حالة الطلب */
export const suggestTemplateForStatus = (status?: string): MessageTemplate => {
  const match = ORDER_MESSAGE_TEMPLATES.find((t) => t.statuses?.includes(String(status)));
  return match || ORDER_MESSAGE_TEMPLATES[0];
};

/** رابط واتساب للعميل مع الرسالة جاهزة */
export const buildCustomerWhatsAppUrl = (phone: string, message: string): string =>
  `https://wa.me/${normalizeWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;

/** فتح واتساب على رقم العميل برسالة القالب */
export const sendTemplateToCustomer = (
  phone: string,
  template: MessageTemplate,
  ctx: OrderMessageContext
): void => {
  window.open(buildCustomerWhatsAppUrl(phone, template.build(ctx)), '_blank', 'noopener');
};

