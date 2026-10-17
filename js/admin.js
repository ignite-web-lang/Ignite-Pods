create or replace function public.eh_admin()
returns boolean
language sql
security definer
set search_path = public
as 'select coalesce(lower(auth.jwt() ->> ''email'') = ''adegamalibu905@gmail.com'', false)';