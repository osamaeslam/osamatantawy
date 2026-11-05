-- =====================================================================
--  طنطاوي جروب — P0 : تقوية الأمان (Security Hardening)
--  شغّل هذا الملف مرة واحدة من: Supabase Dashboard > SQL Editor
--  بعد تشغيل:
--    1) supabase/full_schema_and_rls.sql
--    2) supabase/admin_users_security.sql
-- =====================================================================
--  اللي بيعمله الملف:
--   * يقفل الكتابة بالـ anon key على المنتجات/الأقسام/البنرات/الإعدادات
--     (دلوقتي أي حد معاه المفتاح العام يقدر يمسح الكتالوج كله).
--   * يمنع قراءة كل طلبات العملاء من المتصفح (تسريب أسماء وتليفونات وعناوين).
--   * ينقل تسجيل دخول الإدارة لـ Supabase Auth الحقيقي (JWT موقّع)
--     بدل localStorage + كلمات مرور مكتوبة في الكود.
--   * يضيف جدول staff_members + ربط تلقائي بحساب Auth عند التسجيل.
--   * يضيف دالة track_order لتتبع الطلب برقم الموبايل بدون كشف باقي الطلبات.
--
--  آمن للتشغيل أكثر من مرة (idempotent) — كل الأوامر if not exists / or replace.
--  راجع SECURITY_SETUP.md لخطوات التشغيل بالترتيب.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- (1) جدول فريق العمل — المصدر الوحيد لصلاحيات لوحة التحكم
--     user_id = null معناها: الحساب لسه متربطش بحساب Auth (بانتظار التسجيل).
-- ---------------------------------------------------------------------
create table if not exists public.staff_members (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id) on delete set null,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'sales_rep'
              check (role in ('admin', 'sales_rep', 'delivery_rep')),
  phone       text,
  notes       text,
  is_active   boolean not null default true,
  last_login  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists staff_members_email_unique
  on public.staff_members (lower(email));
create index if not exists idx_staff_members_user
  on public.staff_members (user_id);

-- ---------------------------------------------------------------------
-- (2) دوال مساعدة (SECURITY DEFINER) لتفادي الـ recursion في الـ RLS
-- ---------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_members s
    where s.user_id = auth.uid()
      and s.is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_members s
    where s.user_id = auth.uid()
      and s.is_active = true
      and s.role = 'admin'
  );
$$;

grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- (3) سياسات جدول فريق العمل
--     * كل موظف يقرأ سطره فقط، والمدير يقرأ الكل.
--     * الإضافة/التعديل/الحذف للمدير فقط.
-- ---------------------------------------------------------------------
alter table public.staff_members enable row level security;

drop policy if exists staff_members_self_read on public.staff_members;
create policy staff_members_self_read on public.staff_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists staff_members_admin_insert on public.staff_members;
create policy staff_members_admin_insert on public.staff_members
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists staff_members_admin_update on public.staff_members;
create policy staff_members_admin_update on public.staff_members
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists staff_members_admin_delete on public.staff_members;
create policy staff_members_admin_delete on public.staff_members
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- (4) ربط تلقائي: أول ما موظف يعمل حساب Auth بنفس الإيميل المسجّل،
--     بيتربط بحسابه ويستلم صلاحيته فوراً.
-- ---------------------------------------------------------------------
create or replace function public.link_staff_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.staff_members
     set user_id    = new.id,
         updated_at = now()
   where user_id is null
     and lower(email) = lower(new.email);

  insert into public.staff_members (user_id, email, full_name, role)
  select new.id,
         lower(new.email),
         coalesce(new.raw_user_meta_data->>'full_name', ''),
         'sales_rep'
  where not exists (
    select 1 from public.staff_members s where lower(s.email) = lower(new.email)
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_link_staff on auth.users;
create trigger on_auth_user_created_link_staff
  after insert on auth.users
  for each row execute function public.link_staff_on_signup();

-- ---------------------------------------------------------------------
-- (5) تحديث "آخر دخول" — الموظف يعدّل سطره الخاص في هذا العمود فقط
-- ---------------------------------------------------------------------
create or replace function public.touch_staff_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.staff_members
     set last_login = now(),
         updated_at = now()
   where user_id = auth.uid();
end;
$$;

grant execute on function public.touch_staff_login() to authenticated;


-- ---------------------------------------------------------------------
-- (6) ربط يدوي لحساب موجود (لو الموظف سجّل قبل ما تضيف إيميله)
-- ---------------------------------------------------------------------
create or replace function public.link_staff_member(p_staff_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_uid   uuid;
begin
  if not public.is_admin() then
    raise exception 'غير مصرح: العملية للمدير العام فقط';
  end if;

  select email into v_email from public.staff_members where id = p_staff_id;
  if v_email is null then
    raise exception 'الموظف غير موجود';
  end if;

  select id into v_uid from auth.users where lower(email) = lower(v_email) limit 1;
  if v_uid is null then
    raise exception 'لا يوجد حساب مسجل بهذا البريد حتى الآن — اطلب من الموظف إنشاء حساب أولاً';
  end if;

  update public.staff_members
     set user_id = v_uid, updated_at = now()
   where id = p_staff_id;
end;
$$;

grant execute on function public.link_staff_member(uuid) to authenticated;

-- =====================================================================
-- (7) تقفيل الكتابة العامة على الكتالوج والإعدادات
--     القراءة تفضل عامة (الكتالوج للزوار)، والكتابة للموظفين فقط.
-- =====================================================================
-- --- products
drop policy if exists products_read on public.products;
create policy products_read on public.products for select using (true);

drop policy if exists products_write on public.products;
drop policy if exists "Enable insert for authenticated users only" on public.products;

drop policy if exists products_staff_insert on public.products;
create policy products_staff_insert on public.products
  for insert to authenticated with check (public.is_staff());
drop policy if exists products_staff_update on public.products;
create policy products_staff_update on public.products
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products
  for delete to authenticated using (public.is_admin());

-- --- categories
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories for select using (true);
drop policy if exists categories_write on public.categories;
drop policy if exists categories_staff_insert on public.categories;
create policy categories_staff_insert on public.categories
  for insert to authenticated with check (public.is_staff());
drop policy if exists categories_staff_update on public.categories;
create policy categories_staff_update on public.categories
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists categories_admin_delete on public.categories;
create policy categories_admin_delete on public.categories
  for delete to authenticated using (public.is_admin());

-- --- hero_banners
drop policy if exists hero_banners_read on public.hero_banners;
create policy hero_banners_read on public.hero_banners for select using (true);
drop policy if exists hero_banners_write on public.hero_banners;
drop policy if exists hero_banners_staff_insert on public.hero_banners;
create policy hero_banners_staff_insert on public.hero_banners
  for insert to authenticated with check (public.is_staff());
drop policy if exists hero_banners_staff_update on public.hero_banners;
create policy hero_banners_staff_update on public.hero_banners
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists hero_banners_admin_delete on public.hero_banners;
create policy hero_banners_admin_delete on public.hero_banners
  for delete to authenticated using (public.is_admin());

-- --- site_configs
drop policy if exists site_configs_read on public.site_configs;
create policy site_configs_read on public.site_configs for select using (true);
drop policy if exists site_configs_write on public.site_configs;
drop policy if exists site_configs_staff_insert on public.site_configs;
create policy site_configs_staff_insert on public.site_configs
  for insert to authenticated with check (public.is_staff());
drop policy if exists site_configs_staff_update on public.site_configs;
create policy site_configs_staff_update on public.site_configs
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists site_configs_admin_delete on public.site_configs;
create policy site_configs_admin_delete on public.site_configs
  for delete to authenticated using (public.is_admin());

-- =====================================================================
-- (8) الطلبات: الزائر ينشئ طلب "قيد التسعير" فقط، والقراءة للموظفين
-- =====================================================================
drop policy if exists orders_insert on public.orders;
drop policy if exists orders_public_insert on public.orders;
create policy orders_public_insert on public.orders
  for insert to anon, authenticated
  with check (
    coalesce(status, 'pending') = 'pending'
    and customer_phone is not null
    and length(btrim(customer_phone)) >= 6
  );

-- القراءة العامة القديمة كانت تكشف أسماء وتليفونات وعناوين كل العملاء
drop policy if exists orders_read on public.orders;
drop policy if exists orders_staff_read on public.orders;
create policy orders_staff_read on public.orders
  for select to authenticated using (public.is_staff());

drop policy if exists orders_update on public.orders;
drop policy if exists orders_staff_update on public.orders;
create policy orders_staff_update on public.orders
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists orders_delete on public.orders;
drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders
  for delete to authenticated using (public.is_admin());

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);

-- =====================================================================
-- (9) تتبّع الطلب للزائر بدون كشف بيانات باقي العملاء
--     يقارن آخر 10 أرقام من رقم الموبايل، ويرجّع حقول آمنة فقط.
-- =====================================================================
create or replace function public.track_order(p_phone text)
returns table (
  order_id        text,
  customer_name   text,
  product_name_ar text,
  quantity        integer,
  total_price     numeric,
  status          text,
  created_at      timestamptz,
  selected_size   text,
  delivery_address text,
  city            text
)
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '') as digits
  )
  select
    o.order_id,
    o.customer_name,
    o.product_name_ar,
    coalesce(o.quantity, 1) as quantity,
    coalesce(o.total_price, 0) as total_price,
    coalesce(o.status, 'pending') as status,
    o.created_at,
    o.selected_size,
    case when jsonb_typeof(o.items) = 'object' then o.items->>'deliveryAddress' else null end as delivery_address,
    case when jsonb_typeof(o.items) = 'object' then o.items->>'city' else null end as city
  from public.orders o, target t
  where t.digits is not null
    and length(t.digits) >= 6
    and right(regexp_replace(coalesce(o.customer_phone, ''), '[^0-9]', '', 'g'), 10)
        = right(t.digits, 10)
  order by o.created_at desc
  limit 20;
$$;

grant execute on function public.track_order(text) to anon, authenticated;

-- =====================================================================
-- (10) زوار ونقرات واتساب: الزائر يسجّل فقط، والقراءة للموظفين
-- =====================================================================
create table if not exists public.visitors (
  id           uuid primary key default gen_random_uuid(),
  page_visited text,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz not null default now()
);
alter table public.visitors enable row level security;
drop policy if exists visitors_insert on public.visitors;
drop policy if exists visitors_read on public.visitors;
drop policy if exists visitors_public_insert on public.visitors;
create policy visitors_public_insert on public.visitors
  for insert to anon, authenticated with check (true);
drop policy if exists visitors_staff_read on public.visitors;
create policy visitors_staff_read on public.visitors
  for select to authenticated using (public.is_staff());

create table if not exists public.whatsapp_clicks (
  id              uuid primary key default gen_random_uuid(),
  product_id      text,
  product_name_ar text,
  user_ip         text,
  clicked_at      timestamptz not null default now()
);
alter table public.whatsapp_clicks enable row level security;
drop policy if exists whatsapp_clicks_insert on public.whatsapp_clicks;
drop policy if exists whatsapp_clicks_read on public.whatsapp_clicks;
drop policy if exists whatsapp_clicks_public_insert on public.whatsapp_clicks;
create policy whatsapp_clicks_public_insert on public.whatsapp_clicks
  for insert to anon, authenticated with check (true);
drop policy if exists whatsapp_clicks_staff_read on public.whatsapp_clicks;
create policy whatsapp_clicks_staff_read on public.whatsapp_clicks
  for select to authenticated using (public.is_staff());

create index if not exists idx_visitors_created on public.visitors(created_at desc);
create index if not exists idx_clicks_clicked on public.whatsapp_clicks(clicked_at desc);


-- =====================================================================
-- (11) ⚠️ خطوة إلزامية: إنشاء أول حساب مدير
-- ---------------------------------------------------------------------
--  1) غيّر الإيميل تحت لإيميلك الحقيقي، وشيل علامات التعليق (--) من السطور
--  2) شغّل السطور دي
--  3) افتح الموقع على /admin واضغط "إنشاء حساب جديد" بنفس الإيميل ده
--     وكلمة مرور قوية → هيتحوّل تلقائياً لمدير عام بكل الصلاحيات.
--
--  ملاحظة: على Supabase → Authentication → Sign In / Providers → Email
--  لو خيار "Confirm email" مفعّل، هتحتاج تأكد الإيميل قبل الدخول.
-- =====================================================================
-- insert into public.staff_members (email, full_name, role, phone)
-- select lower('owner@example.com'), 'المدير العام - طنطاوي جروب', 'admin', '15218'
-- where not exists (
--   select 1 from public.staff_members where lower(email) = lower('owner@example.com')
-- );

-- =====================================================================
-- (12) تحقّق سريع بعد التشغيل
-- =====================================================================
--  المتوقع: كل الجداول عندها RLS = true
-- select tablename, rowsecurity from pg_tables
--  where schemaname in ('public') and tablename in
--        ('products','categories','hero_banners','site_configs','orders','staff_members','visitors','whatsapp_clicks');
--
--  المتوقع: مفيش أي política للـ anon على الكتابة غير insert الطلبات/الزوار/النقرات
-- select tablename, policyname, cmd, roles
--   from pg_policies
--  where schemaname = 'public'
--  order by tablename, cmd;
--
--  المتوقع: عدد المدراء
-- select count(*) from public.staff_members where role = 'admin';

-- =====================================================================
-- (13) خطوات بعد التشغيل (بالترتيب)
-- ---------------------------------------------------------------------
--  1) أنشئ حساب Auth للإدارة + سطر staff_members (خطوة 11).
--  2) من لوحة التحكم: الموظفين هيظهروا من الجدول الجديد، وأي موظف جديد
--     تضيفه بالإيميل → يعمل حساب بنفس الإيميل → يتفعّل تلقائياً.
--  3) تأكد إن الإضافة/التعديل على المنتجات والأقسام شغالة وأنت مسجل دخول.
--  4) الاختبار الأهم: من Terminal وانت مش مسجل دخول، جرّب تمسح منتج:
--     curl -X DELETE "https://<project>.supabase.co/rest/v1/products?id=eq.<id>" \
--          -H "apikey: <ANON_KEY>"
--     المتوقع: 0 صفوف متأثرة (مش مسح) — قبل التشغيل كان بيمسح فعلاً.
--
--  ⚠️ التراجع (لو احتجت ترجع للوضع القديم مؤقتاً): أعد تشغيل
--     supabase/full_schema_and_rls.sql (هيرجّع الكتابة المفتوحة).
--     مش منصوح بيه غير في حالة طوارئ.
-- =====================================================================

