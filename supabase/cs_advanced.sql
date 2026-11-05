-- =====================================================================
--  طنطاوي جروب — CRM بسيط + تعيين مندوب + مرتجعات وشكاوى
--  شغّل هذا الملف من: Supabase Dashboard > SQL Editor
--  (بعد security_hardening.sql)
-- =====================================================================
--  الملف آمن للتشغيل أكثر من مرة (idempotent).
--  الأقسام:
--    (A) جدول العملاء customers  → ملاحظات لكل رقم + VIP
--    (B) أعمدة تعيين المندوب على الطلبات
--    (C) جدول المرتجعات والشكاوى order_issues
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
-- (A) العملاء — المفتاح: رقم الموبايل (أرقام فقط)
--     ⚠️ جدول customers موجود بالفعل في قاعدة البيانات ببنية أقدم
--     (phone, name, address, created_at) — فبنضيف الأعمدة الناقصة فقط.
--     عدد الطلبات وقيمة المبيعات بتتحسب من جدول الطلبات نفسه،
--     فالجدول ده للبيانات اللي مش موجودة في الطلب: ملاحظات / VIP / آخر تواصل.
-- =====================================================================
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  phone           text not null,
  name            text,
  notes           text,
  is_vip          boolean not null default false,
  last_contact_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- إضافة الأعمدة الناقصة لو الجدول كان موجود بصيغة أقدم (آمن - يتجاهل الموجود)
alter table public.customers add column if not exists name text;
alter table public.customers add column if not exists notes text;
alter table public.customers add column if not exists is_vip boolean default false;
alter table public.customers add column if not exists last_contact_at timestamptz;
alter table public.customers add column if not exists created_at timestamptz default now();
alter table public.customers add column if not exists updated_at timestamptz default now();

-- لو فيه تكرار في الأرقام القديمة، منقدرش نعمل unique index — بنتخطاه بهدوء
do $$
begin
  create unique index if not exists customers_phone_unique on public.customers(phone);
exception when others then
  raise notice 'تخطي إنشاء فهرس unique على customers.phone (يوجد تكرار في الأرقام)';
end;
$$;

create index if not exists idx_customers_last_contact on public.customers(last_contact_at desc);


alter table public.customers enable row level security;

drop policy if exists customers_staff_read on public.customers;
create policy customers_staff_read on public.customers
  for select to authenticated using (public.is_staff());

drop policy if exists customers_staff_insert on public.customers;
create policy customers_staff_insert on public.customers
  for insert to authenticated with check (public.is_staff());

drop policy if exists customers_staff_update on public.customers;
create policy customers_staff_update on public.customers
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists customers_admin_delete on public.customers;
create policy customers_admin_delete on public.customers
  for delete to authenticated using (public.is_admin());

-- =====================================================================
-- (B) تعيين الطلب لمندوب/مسؤول متابعة
-- =====================================================================
alter table public.orders add column if not exists assigned_to text;
alter table public.orders add column if not exists assigned_at timestamptz;
alter table public.orders add column if not exists follow_up_note text;

create index if not exists idx_orders_assigned on public.orders(assigned_to);

-- =====================================================================
-- (C) المرتجعات والشكاوى
--     type: مرتجع / شكوى / تالف
--     status: مفتوح / جاري المعالجة / تم الحل / مرفوض
-- =====================================================================
create table if not exists public.order_issues (
  id             uuid primary key default gen_random_uuid(),
  order_id       text not null,
  customer_name  text,
  customer_phone text not null,
  type           text not null default 'complaint'
                 check (type in ('return', 'complaint', 'damage')),
  reason         text,
  status         text not null default 'open'
                 check (status in ('open', 'in_progress', 'resolved', 'rejected')),
  resolution     text,
  amount         numeric not null default 0,
  created_by     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  resolved_at    timestamptz
);

create index if not exists idx_order_issues_status on public.order_issues(status);
create index if not exists idx_order_issues_created on public.order_issues(created_at desc);
create index if not exists idx_order_issues_phone on public.order_issues(customer_phone);

alter table public.order_issues enable row level security;

drop policy if exists order_issues_staff_read on public.order_issues;
create policy order_issues_staff_read on public.order_issues
  for select to authenticated using (public.is_staff());

drop policy if exists order_issues_staff_insert on public.order_issues;
create policy order_issues_staff_insert on public.order_issues
  for insert to authenticated with check (public.is_staff());

drop policy if exists order_issues_staff_update on public.order_issues;
create policy order_issues_staff_update on public.order_issues
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists order_issues_admin_delete on public.order_issues;
create policy order_issues_admin_delete on public.order_issues
  for delete to authenticated using (public.is_admin());

-- =====================================================================
--  تحقّق سريع:
--  select count(*) from public.customers;
--  select count(*) from public.order_issues;
--  select column_name from information_schema.columns
--   where table_name = 'orders' and column_name in ('assigned_to','assigned_at');
-- =====================================================================
