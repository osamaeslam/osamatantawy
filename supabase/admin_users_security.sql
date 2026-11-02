-- =====================================================================
--  تأمين حساب الإدارة (Supabase / PostgreSQL)
--  شغّل هذا الملف مرة واحدة من: Supabase Dashboard > SQL Editor
-- =====================================================================
--  بعد تشغيله:
--   * كلمات المرور تتخزن مشفّرة (bcrypt) وليست نصاً صريحاً
--   * لا يمكن لأي زائر قراءة جدول admin_users مباشرة من المتصفح
--   * تسجيل الدخول يمر عبر دالة آمنة verify_admin_login فقط
-- =====================================================================

-- 1) تفعيل التشفير
create extension if not exists pgcrypto;

-- 2) تحويل أي كلمة مرور مخزّنة نصاً إلى هاش bcrypt
update public.admin_users
set password_hash = crypt(password_hash, gen_salt('bf'))
where password_hash is not null
  and password_hash not like '$2%';

-- 3) إغلاق القراءة المباشرة للجدول من المتصفح
alter table public.admin_users enable row level security;

drop policy if exists "public read admin_users" on public.admin_users;
drop policy if exists "anon read admin_users" on public.admin_users;
drop policy if exists "Enable read access for all users" on public.admin_users;

-- 4) دالة تحقق آمنة (SECURITY DEFINER) بديلاً عن قراءة الجدول
create or replace function public.verify_admin_login(p_username text, p_password text)
returns table (id text, username text, full_name text, role text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select a.id::text, a.username, a.full_name, a.role
  from public.admin_users a
  where lower(a.username) = lower(p_username)
    and a.is_active = true
    and a.password_hash = crypt(p_password, a.password_hash)
  limit 1;
end;
$$;

-- 5) السماح باستدعاء الدالة فقط (بدون صلاحية قراءة الجدول)
grant execute on function public.verify_admin_login(text, text) to anon, authenticated;
