-- =====================================================================
--  طنطاوي جروب — مؤشرات خدمة العملاء
--  شغّل هذا الملف من: Supabase Dashboard > SQL Editor
--  (بعد security_hardening.sql)
-- =====================================================================
--  بيضيف عمود responded_at على الطلبات = أول لحظة اتغيّرت فيها حالة الطلب
--  من "pending" لأي حالة تانية (يعني أول متابعة فعلية من الفريق).
--  منه بنحسب: متوسط زمن أول رد + الطلبات اللي عدّى عليها 24 ساعة بدون متابعة.
--
--  ملاحظة: الطلبات القديمة (اللي اتغيرت قبل تشغيل الملف) هتفضل responded_at = null
--  ومش هتدخل في حساب المتوسط — منعاً لأرقام مضللة.
-- =====================================================================

alter table public.orders add column if not exists responded_at timestamptz;

create index if not exists idx_orders_responded on public.orders(responded_at);

create or replace function public.set_orders_responded_at()
returns trigger
language plpgsql
as $$
begin
  if new.responded_at is null
     and coalesce(new.status, 'pending') <> 'pending' then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_responded_at on public.orders;
create trigger trg_orders_responded_at
  before insert or update on public.orders
  for each row execute function public.set_orders_responded_at();

-- =====================================================================
--  تحقّق:
--  select status, count(*), count(responded_at) as with_response
--    from public.orders group by status;
-- =====================================================================
