-- =====================================================================
--  طنطاوي جروب - إنشاء الجداول + البيانات الافتراضية
--
--  ⚠️ مهم: بعد تشغيل هذا الملف شغّل ملف
--     supabase/security_hardening.sql
--  لأنه بيقفل الكتابة العامة (anon) على الكتالوج والطلبات، وينقل
--  دخول الإدارة لـ Supabase Auth. راجع SECURITY_SETUP.md.
-- =====================================================================
--  طنطاوي جروب - إنشاء الجداول + الأمان (RLS) + البيانات الافتراضية
--  شغّل هذا الملف كاملاً مرة واحدة من: Supabase Dashboard > SQL Editor
--  متوافق مع ملف admin_users_security.sql الموجود لديك.
-- =====================================================================

-- ---------------------------------------------------------------------
-- (0) أساسيات: امتدادات مطلوبة
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- (1) جدول إعدادات الموقع (site_configs) : مفتاح/قيمة
--     يُستخدم لتخزين: رقم واتساب، الخط الساخن، نص الإعلان، إلخ
-- ---------------------------------------------------------------------
create table if not exists public.site_configs (
  id          bigserial primary key,
  key         text not null unique,
  value       text,
  json_value  jsonb,
  updated_at  timestamptz default now(),
  created_at  timestamptz default now()
);
create index if not exists idx_site_configs_key on public.site_configs(key);

-- ---------------------------------------------------------------------
-- (2) جدول بنرات السلايدر (hero_banners)
-- ---------------------------------------------------------------------
create table if not exists public.hero_banners (
  id           bigserial primary key,
  title        text not null,
  subtitle     text,
  badge        text,
  button_text  text,
  category     text,
  link_category text,
  bg_gradient  text,
  image_url    text,
  sort_order   integer default 0,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists idx_hero_banners_sort on public.hero_banners(sort_order);

-- ---------------------------------------------------------------------
-- (3) جدول الأقسام (categories) : قابلة للإضافة/التعديل/الحذف من الأدمن
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id               bigserial primary key,
  name             text not null,
  name_ar          text not null,
  icon             text default 'Package',
  image_url        text,
  description_ar   text,
  subcategories    jsonb default '[]'::jsonb,
  subcategories_ar jsonb default '[]'::jsonb,
  sort_order       integer default 0,
  is_active        boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists idx_categories_sort on public.categories(sort_order);

-- ---------------------------------------------------------------------
-- (4) جدول المنتجات (products) : إن لم يكن موجوداً
--     (إذا كان موجوداً بالفعل سيتم فقط إضافة الأعمدة الناقصة)
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id               bigserial primary key,
  name_ar          text not null,
  name_en          text,
  category         text,
  price            numeric default 0,
  discounted_price numeric default 0,
  image_url        text,
  colors           jsonb default '[]'::jsonb,
  sizes            jsonb default '[]'::jsonb,
  in_stock         boolean default true,
  brand            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
-- إضافة أعمدة ناقصة لو الجدول موجود بصيغة أقدم (آمن - يتجاهل الموجود)
alter table public.products add column if not exists name_en text;
alter table public.products add column if not exists discounted_price numeric default 0;
alter table public.products add column if not exists colors jsonb default '[]'::jsonb;
alter table public.products add column if not exists sizes jsonb default '[]'::jsonb;
alter table public.products add column if not exists in_stock boolean default true;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists item_number text;
alter table public.products add column if not exists import_key text;
alter table public.products add column if not exists updated_at timestamptz default now();
drop index if exists public.products_item_number_unique;
create unique index if not exists products_import_key_unique
  on public.products (import_key);

-- ---------------------------------------------------------------------
-- (5) جدول الطلبات (orders) : إن لم يكن موجوداً
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id               bigserial primary key,
  order_id         text,
  customer_name    text,
  customer_phone   text,
  product_name_ar  text,
  product_id       text,
  selected_color   text,
  selected_size    text,
  quantity         integer default 1,
  total_price      numeric default 0,
  status           text default 'pending',
  items            jsonb default '[]'::jsonb,
  created_at       timestamptz default now()
);
alter table public.orders add column if not exists items jsonb default '[]'::jsonb;
create index if not exists idx_orders_phone on public.orders(customer_phone);

-- =====================================================================
-- (6) تفعيل الخصوصية (Row Level Security) على كل الجداول
-- =====================================================================
alter table public.site_configs  enable row level security;
alter table public.hero_banners  enable row level security;
alter table public.categories    enable row level security;
alter table public.products      enable row level security;
alter table public.orders        enable row level security;

-- ---------------------------------------------------------------------
-- (7) السياسات (Policies)
--  * القراءة (SELECT): مسموحة للجميع (anon) → الكتالوج والإعدادات عامة للزوار.
--  * الكتابة (INSERT/UPDATE/DELETE): مسموحة للدور authenticated.
--     الأدمن يكتب عبر جلسة آمنة. في حال استخدام anon مباشرة،
--     راجع "ملاحظة الأمان" أسفل الملف.
-- ---------------------------------------------------------------------

-- site_configs
drop policy if exists site_configs_read on public.site_configs;
create policy site_configs_read on public.site_configs
  for select using (true);
drop policy if exists site_configs_write on public.site_configs;
create policy site_configs_write on public.site_configs
  for all to anon, authenticated using (true) with check (true);

-- hero_banners
drop policy if exists hero_banners_read on public.hero_banners;
create policy hero_banners_read on public.hero_banners
  for select using (true);
drop policy if exists hero_banners_write on public.hero_banners;
create policy hero_banners_write on public.hero_banners
  for all to anon, authenticated using (true) with check (true);

-- categories
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories
  for select using (true);
drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories
  for all to anon, authenticated using (true) with check (true);

-- products
drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select using (true);
drop policy if exists products_write on public.products;
create policy products_write on public.products
  for all to anon, authenticated using (true) with check (true);

-- orders : الزائر يقدر ينشئ طلب (insert) ويقرأ بالهاتف؛ الأدمن يعدّل
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders
  for insert to anon, authenticated with check (true);
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders
  for select using (true);
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders
  for update to anon, authenticated using (true) with check (true);


-- =====================================================================
-- (8) البيانات الافتراضية (Seed) — تُضاف فقط إذا الجداول فاضية
-- =====================================================================

-- الأقسام الافتراضية
insert into public.categories (name, name_ar, icon, description_ar, subcategories, subcategories_ar, sort_order)
select 'Home Appliances', 'أجهزة منزلية', 'Refrigerator',
  'ثلاجات، غسالات ملابس وأطباق، بوتاجازات، ديب فريزر، ميكروويف، وقلايات هوائية',
  '["ثلاجات","غسالات ملابس","غسالات أطباق","بوتاجازات","ديب فريزر","ميكروويف وأفران","قلايات هوائية"]'::jsonb,
  '["ثلاجات","غسالات ملابس","غسالات أطباق","بوتاجازات","ديب فريزر","ميكروويف وأفران","قلايات هوائية"]'::jsonb,
  1
where not exists (select 1 from public.categories);

insert into public.categories (name, name_ar, icon, description_ar, subcategories, subcategories_ar, sort_order)
select 'Electrical Appliances', 'أجهزة كهربيه', 'Tv',
  'شاشات وتلفزيونات، تكييفات هواء، مكانس كهربائية، محضرات طعام، ومراوح',
  '["شاشات","تكييفات","مكانس","محضرات طعام وخلاطات","مكاوي بخار","مراوح ودَفايات"]'::jsonb,
  '["شاشات","تكييفات","مكانس","محضرات طعام وخلاطات","مكاوي بخار","مراوح ودَفايات"]'::jsonb,
  2
where (select count(*) from public.categories) < 2;

-- إعدادات الموقع الافتراضية
insert into public.site_configs (key, value)
select 'hotline', '15218'
where not exists (select 1 from public.site_configs where key = 'hotline');

insert into public.site_configs (key, value)
select 'whatsapp_sales_number', '201521800000'
where not exists (select 1 from public.site_configs where key = 'whatsapp_sales_number');

insert into public.site_configs (key, value)
select 'announcement_text', 'طنطاوي جروب: أجهزة منزلية وكهربية بأعلى ضمان في مصر • شحن لجميع المحافظات • دفع عند الاستلام بعد الفحص'
where not exists (select 1 from public.site_configs where key = 'announcement_text');

-- بنرات افتراضية (فقط إذا لا يوجد أي بنر)
insert into public.hero_banners (title, subtitle, badge, button_text, category, link_category, bg_gradient, image_url, sort_order, is_active)
select 'أجهزة منزلية كبرى بضمان الوكيل',
  'أحدث موديلات الثلاجات والغسالات والبوتاجازات من شارب وإل جي وبيكو وتوشيبا مع فحص الأجهزة واستلام كارت الفاتورة الرسمي',
  'ضمان الوكيل المعتمد', 'تصفح الأجهزة المنزلية', 'أجهزة منزلية', 'أجهزة منزلية',
  'from-blue-950 via-blue-900 to-indigo-900',
  'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=1600&auto=format&fit=crop&q=80',
  1, true
where not exists (select 1 from public.hero_banners);

-- =====================================================================
-- (9) ملاحظة الأمان (اقرأها جيداً)
-- ---------------------------------------------------------------------
--  * القراءة عامة (كل الزوار) وهذا مطلوب للكتالوج.
--  * الكتابة مسموحة حالياً للـ anon لأن لوحة الأدمن تستخدم المفتاح العام
--    (anon) مع نظام تسجيل دخول داخلي (verify_admin_login).
--  * هذا يعني أن أي شخص يملك المفتاح العام يمكنه نظرياً الكتابة عبر الـ API
--    دون المرور بواجهة الأدمن. للحماية القصوى لديك خياران:
--
--    الخيار (أ) - الأسهل والأكثر أماناً:
--      فعّل Supabase Auth (تسجيل دخول بالبريد/كلمة المرور) للأدمن،
--      ثم اجعل سياسات الكتابة  for all to authenticated  فقط،
--      واحذف anon من سياسات الكتابة.
--
--    الخيار (ب):
--      نقل عمليات الكتابة إلى Edge Function/سيرفر يملك service_role key
--      (لا يُكشف في المتصفح) مع التحقق من جلسة الأدمن.
--
--  الملف الحالي يعطي: خصوصية قراءة + تفعيل RLS + منع الوصول لبيانات الأدمن
--  (admin_users محمي عبر ملف admin_users_security.sql).
-- =====================================================================

-- =====================================================================
-- انتهى. بعد التشغيل:
--  1) روح لـ Authentication > Policies وتأكد أن الجداول ظاهرة.
--  2) جرّب من لوحة الأدمن: إضافة منتج/قسم/بنر (يجب أن تُحفظ وتظهر فوراً).
-- =====================================================================

create index if not exists idx_orders_created on public.orders(created_at);
