-- =====================================================================
--  طنطاوي جروب — طلبات الأصناف غير الموجودة في الكتالوج
--  شغّل هذا الملف من: Supabase Dashboard > SQL Editor
--  (بعد security_hardening.sql)
-- =====================================================================
--  الفكرة: العميل بيدور على صنف مش موجود في الكتالوج فيبعتهولنا بالاسم
--  وصورة اختيارية → بيتسجل هنا → فريق البيع يشوفه ويحاول يوفره.
--  ده أهم مصدر لمعرفة الأصناف اللي السوق بيطلبها.
-- =====================================================================

create extension if not exists pgcrypto;

create table if not exists public.item_requests (
  id             uuid primary key default gen_random_uuid(),
  customer_name  text not null,
  customer_phone text not null,
  item_name      text not null,
  details        text,
  image_url      text,
  status         text not null default 'new'
                 check (status in ('new', 'seen', 'sourced', 'rejected')),
  admin_notes    text,
  handled_by     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_item_requests_created on public.item_requests(created_at desc);
create index if not exists idx_item_requests_status on public.item_requests(status);
create index if not exists idx_item_requests_phone on public.item_requests(customer_phone);

-- ---------------------------------------------------------------------
-- الحماية: الزائر يضيف طلب فقط بحالة "جديد"، والقراءة والمتابعة للموظفين
-- ---------------------------------------------------------------------
alter table public.item_requests enable row level security;

drop policy if exists item_requests_public_insert on public.item_requests;
create policy item_requests_public_insert on public.item_requests
  for insert to anon, authenticated
  with check (
    status = 'new'
    and length(btrim(customer_phone)) >= 6
    and length(btrim(item_name)) >= 2
  );

drop policy if exists item_requests_staff_read on public.item_requests;
create policy item_requests_staff_read on public.item_requests
  for select to authenticated using (public.is_staff());

drop policy if exists item_requests_staff_update on public.item_requests;
create policy item_requests_staff_update on public.item_requests
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists item_requests_admin_delete on public.item_requests;
create policy item_requests_admin_delete on public.item_requests
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- تخزين صور الأصناف المطلوبة (اختياري لكن مفيد جداً)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('item-requests', 'item-requests', true)
on conflict (id) do nothing;

drop policy if exists item_requests_images_public_read on storage.objects;
create policy item_requests_images_public_read on storage.objects
  for select to public
  using (bucket_id = 'item-requests');

drop policy if exists item_requests_images_public_upload on storage.objects;
create policy item_requests_images_public_upload on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'item-requests');

-- =====================================================================
--  بعد التشغيل: افتح الموقع → زر خدمة العملاء → «بندور على صنف مش موجود»
--  وارسل طلب تجريبي، وتأكد من ظهوره في: لوحة التحكم → طلبات أصناف.
-- =====================================================================
