# 🔐 خطوات تأمين النظام (P0) — لازم تتنفذ مرة واحدة

هذا الملف يشرح التنفيذ المرتبط بـ `supabase/security_hardening.sql`.
المشروع كان بيسمح لأي زائر يكتب/يمسح المنتجات، ويدخل لوحة الإدارة من
localStorage بدون كلمة مرور. التعديلات دي تقفل الثغرتين.

---

## 1) شغّل ملف الـ SQL

Supabase Dashboard → **SQL Editor** → افتح `supabase/security_hardening.sql` → **Run**.

الملف آمن للتشغيل أكثر من مرة. اللي بيعمله:

| قبل | بعد |
|---|---|
| أي حد معاه الـ anon key يقدر يمسح المنتجات والأقسام والبنرات | الكتابة للموظفين المسجلين فقط (`authenticated` + `is_staff()`) |
| الزائر يقرأ **كل** طلبات العملاء (أسماء/تليفونات/عناوين) | القراءة للموظفين فقط، والتتبّع عبر `track_order(phone)` |
| الزائر يعدّل أي طلب (يغيّر حالته أو سعره) | الزائر ينشئ طلب `pending` فقط |
| دخول الإدارة من localStorage (بدون تحقق) | Supabase Auth (JWT موقّع) + جدول `staff_members` |

---

## 2) أنشئ أول حساب مدير عام

### أ) سجّل الإيميل كمدير في قاعدة البيانات
في SQL Editor، غيّر الإيميل ده لإيميلك وشغّله (السطور موجودة كمان آخر ملف الـ SQL، خطوة 11):

```sql
insert into public.staff_members (email, full_name, role, phone)
select lower('owner@example.com'), 'المدير العام - طنطاوي جروب', 'admin', '15218'
where not exists (
  select 1 from public.staff_members where lower(email) = lower('owner@example.com')
);
```

### ب) أنشئ حساب الدخول من الموقع
1. افتح `https://<موقعك>/admin`
2. اضغط **«موظف جديد؟ إنشاء حساب بالبريد الإلكتروني»**
3. استخدم **نفس الإيميل** + كلمة مرور قوية (6 أحرف على الأقل)
4. الـ trigger بيربط الحساب تلقائياً بسطر `staff_members` → تدخل كمدير عام

> لو ظهرت رسالة "راجع بريدك لتفعيل الحساب": عندك **Confirm email** مفعّل في
> Supabase → Authentication → Providers → Email. أقفله لو مش عايز خطوة التأكيد.

---

## 3) أضف بقية الموظفين

من لوحة التحكم → تبويب **«فريق العمل وحسابات الموظفين»**:

1. **+ إضافة موظف جديد** → الاسم + البريد الإلكتروني + الدور (مبيعات / شحن / مدير).
2. الموظف يفتح `/admin` ويعمل **إنشاء حساب** بنفس البريد → يتفعّل دوره تلقائياً.
3. لو الموظف كان عمل حسابه **قبل** إضافته: اضغط زر **«ربط الحساب»** جنبه.

**مفيش كلمات مرور في الكود ولا في لوحة التحكم** — كل موظف بيعمل كلمة مروره بنفسه، والإدارة بتحدد الصلاحية فقط.

---

## 4) تحقق إن التقفيل شغال

من Terminal (وانت **مش** مسجل دخول):

```bash
# المتوقع: 0 صفوف متأثرة — يعني الطلب اتمنع
curl -s -X DELETE "https://nxlbmrdpbwlsvkgmfaxw.supabase.co/rest/v1/products?id=eq.1" \
  -H "apikey: <ANON_KEY>" -i | head -5

# المتوقع: [] — يعني القراءة العامة للطلبات اتقفلت
curl -s "https://nxlbmrdpbwlsvkgmfaxw.supabase.co/rest/v1/orders?select=*&limit=1" \
  -H "apikey: <ANON_KEY>"

# المتوقع: صفوف الطلبات الخاصة بالرقم ده فقط
curl -s -X POST "https://nxlbmrdpbwlsvkgmfaxw.supabase.co/rest/v1/rpc/track_order" \
  -H "apikey: <ANON_KEY>" -H "Content-Type: application/json" \
  -d '{"p_phone":"01012345678"}'
```

ومن لوحة التحكم (مسجل دخول): أضف/عدّل منتج + غيّر حالة طلب → لازم يتحفظ عادي.

---

## 5) الملفات اللي اتغيرت في التعديل ده

| الملف | التغيير |
|---|---|
| `supabase/security_hardening.sql` | **جديد** — كل السياسات والدوال و`staff_members` |
| `src/services/staff.service.ts` | إعادة كتابة كاملة: Supabase Auth بدل localStorage، بدون أي باسورد في الكود |
| `src/components/AdminDashboard.tsx` | دخول بالبريد + تسجيل حساب، استرجاع الجلسة، إزالة لوحة الباسوردات التجريبية |
| `src/components/StaffManagementTab.tsx` | إدارة موظفين من قاعدة البيانات + زر ربط الحساب |
| `src/supabase/orders.service.ts` | الخدمة الوحيدة للطلبات + `trackOrderByPhone` + إصلاح أسماء الأعمدة |
| `src/supabase/order.service.ts` | 🗑️ **محذوف** (كان بيكتب أعمدة غير موجودة) |
| `src/supabase/admin-auth.service.ts` | 🗑️ **محذوف** (التحقق بقى عبر Supabase Auth) |
| `src/components/CustomerOrderForm.tsx` | يستخدم الخدمة الموحّدة ويحفظ العنوان |
| `src/components/OrderTrackingModal.tsx` | تتبّع عبر `track_order` الآمنة |
| `src/hooks/useDashboardStats.ts` | تحميل الإحصائيات بعد تسجيل الدخول فقط |
| `metadata.json` / `manifest.json` / `robots.txt` | توحيد البراند وحذف ملفات SEO قديمة بدومين خطأ |

---

## 7) ملفات SQL إضافية

| الملف | الغرض | مطلوب لتشغيل |
|---|---|---|
| `supabase/security_hardening.sql` | تقفيل الكتابة العامة + Supabase Auth + `staff_members` | إلزامي |
| `supabase/customer_requests.sql` | جدول «طلبات أصناف غير موجودة» + تخزين الصور | اختياري — بدونه الزر بيرجّع رسالة واضحة |
| `supabase/cs_metrics.sql` | عمود `responded_at` + ترايجر (متوسط زمن أول رد) | اختياري — بدونه المتوسط بيظهر «—» |
| `supabase/cs_advanced.sql` | CRM (ملاحظات العملاء) + تعيين مندوب + المرتجعات والشكاوى | اختياري — بدونه الملاحظات والتعيين والمرتجعات مش هتتحفظ |

بدون تشغيل الملفات الاختيارية، باقي الموقع بيفضل شغال عادي، وكل ميزة بترجّع
رسالة عربية واضحة بتقول أي ملف محتاج يتشغّل.

---

## 8) التراجع (طوارئ فقط)

إعادة تشغيل `supabase/full_schema_and_rls.sql` بترجّع سياسات الكتابة المفتوحة القديمة.
ده **مش منصوح بيه** إلا لو حصل عطل كامل في لوحة التحكم أثناء موسم بيع.
