# معمار بوت الواتساب — طنطاوي جروب

هذا الملف يوضح التصميم الكامل (Architecture) לבوت الواتساب المرتبط بموقع طنطاوي جروب، مع استخدام Firebase كقاعدة بيانات مؤقتة وعملية.

## المكونات الأساسية

```
[الزبون] ← WhatsApp → [WhatsApp Business API] ← Webhook → [البوت] ↔ [Firebase Firestore]
```

### 1. Firebase Firestore (قاعدة البيانات)
تحتوي على مجموعتين أساسيتين:

- **`products`**: المنتجات (الاسم، السعر، الصور، الألوان، المقاسات، المخزون).
- **`orders`**: الطلبات (رقم الطلب، رقم التليفون، المنتج المختار، اللون، المقاس، الكمية، الحالة، التاريخ).

### 2. البوت (WhatsApp Bot)
يُنفذ عبر `src/services/whatsapp-bot.ts` ويدير حالات المحادثة:

| الحالة | ما يحدث |
|--------|---------|
| `welcome` | رسالة الترحيب הראשي |
| `menu` | عرض القائمة الرئيسية (منتجات، تتبع طلب، خدمة العملاء) |
| `selecting_product` | عرض قائمة المنتجات واختيار رقم واحد |
| `selecting_color` | اختيار اللون من الألوان المتاحة للمنتج |
| `selecting_size` | اختيار المقاس من المقاسات المتاحة |
| `confirming` | عرض ملخص الطلب والتأكيد أو الإلغاء |
| `completed` | إرسال رقم الطلب وتفاصيله للزبون |

### 3. 웹 هوك الاستقبال
مسار Express في `src/server/whatsapp-webhook.ts` يستقبل الرسائل الواردة من مزود واتساب (Meta API أو Twilio أو مزود مصري) ويمررها للبوت.

### 4. واجهة الموقع
عنصر `WhatsAppChatWidget` يوفر نافذة دردشة عائمة في واجهة الموقع للتجربة السريعة (في مرحلة التطوير).

---

## خطوات التشغيل (تطبيق عملي)

### المرحلة الأولى: إعداد Firebase (تُؤجل للنهاية حسب الطلب)
1. أنشئ مشروعاً في [Firebase Console](https://console.firebase.google.com).
2. सकら Firestore Database في وضع الاختبار (test mode).
3. انسخ إعدادات المشروع (`apiKey`, `authDomain`, إلخ) وضعها في `/workspace/src/firebase/config.ts` بدلاً من القيم الوهمية الحالية.
4. ثبت حزمة Firebase:
   ```bash
   bun add firebase
   ```

### المرحلة الثانية: ربط المنتجات بالبيانات الحقيقية
بدلاً من القائمة الوهمية `MOCK_PRODUCTS` في ملف الويب هوك، استدعِ `productService.getAll()` لجلب المنتجات من Firebase فور تفعيل إعدادات المشروع.

### المرحلة الثالثة: ربط واتساب Biz API
1. सकら حساب في [Meta WhatsApp Business API](https://developers.facebook.com/docs/whatsapp) أو استخدم مزوداً مثل **Twilio** أو مزود مصري محلي.
2. أضف رابط الويب هوك في لوحة تحكم مزود الخدمة ليشير إلى:
   ```
   https://domein-website.com/webhook/whatsapp
   ```
3. نفّذ دالة `sendWhatsAppMessage` في الويب هوك لإرسال الردود للزبون.

### المرحلة الرابعة: اختبار طلب تجريبي
1. افتح الموقع وتأكد من ظهور زر الواتساب العائم.
2. أرسل رسالة تجريبية للرقم المرتبط بالبوت.
3. تأكد من ظهور الطلب في مجموعة `orders` في Firebase Console.

---

## ملخص الملفات المنشأة

| المسار | الغرض |
|--------|-------|
| `src/types/firebase.ts` | أنواع بيانات TypeScript للمنتجات والطلبات وحالات البوت |
| `src/firebase/config.ts` | إعدادات Firebase (قم بتعديلها في النهاية) |
| `src/firebase/products.service.ts` | عمليات CRUD على مجموعة المنتجات |
| `src/firebase/orders.service.ts` | عمليات CRUD على مجموعة الطلبات |
| `src/hooks/useFirebaseProducts.ts` | هوك React لجلب المنتجات من Firebase |
| `src/hooks/useFirebaseOrders.ts` | هوك React لإدارة الطلبات |
| `src/services/whatsapp-bot.ts` | منطق المحادثة الكامل للبوت |
| `src/server/whatsapp-webhook.ts` | مسار ويب هوك Express لاستقبال رسائل واتساب |
| `src/components/WhatsAppChatWidget.tsx` | واجهة دردشة عائمة في واجهة المستخدم |

---

## ملاحظات هامة

- **لا يُشغل الكود الحالي في الإنتاج حتى تضع مفاتيح Firebase الحقيقية وتفعل 웹 هوك واتساب.**
- الأسعار والخصومات في القائمة الوهمية قابلة للتعديل من Firebase console لاحقاً دون لمسة كود.
- الدفع في هذه المرحلة يكون "عند الاستلام" (Cash on Delivery) حسب متطلبات المشروع.
