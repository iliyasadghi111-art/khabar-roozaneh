-- این دستورات را در SQL Editor پروژه Supabase اجرا کنید.
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'اجتماعی',
  image_url text,
  body text not null,
  source text,
  source_url text,
  created_at timestamptz not null default now()
);
alter table public.news enable row level security;
drop policy if exists "Public can read news" on public.news;
create policy "Public can read news" on public.news for select using (true);
-- فقط کاربرانی که در جدول مدیران ثبت شده‌اند اجازه افزودن/ویرایش/حذف دارند.
create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.site_admins enable row level security;
drop policy if exists "Admins can read admin list" on public.site_admins;
create policy "Admins can read admin list" on public.site_admins for select to authenticated
using (user_id = auth.uid());
drop policy if exists "Admins can insert news" on public.news;
create policy "Admins can insert news" on public.news for insert to authenticated
with check (exists (select 1 from public.site_admins a where a.user_id = auth.uid()));
drop policy if exists "Admins can update news" on public.news;
create policy "Admins can update news" on public.news for update to authenticated
using (exists (select 1 from public.site_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.site_admins a where a.user_id = auth.uid()));
drop policy if exists "Admins can delete news" on public.news;
create policy "Admins can delete news" on public.news for delete to authenticated
using (exists (select 1 from public.site_admins a where a.user_id = auth.uid()));
-- پس از ساخت حساب مدیر در Authentication، شناسه UUID همان کاربر را اینجا وارد کنید:
-- insert into public.site_admins(user_id) values ('USER-UUID-HERE');
