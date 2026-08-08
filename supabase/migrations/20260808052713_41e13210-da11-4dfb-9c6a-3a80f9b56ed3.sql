
create type public.app_role as enum ('admin','presenter','player');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by authenticated" on public.profiles for select to authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "roles readable by authenticated" on public.user_roles for select to authenticated using (true);
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.presenter_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.presenter_invites to authenticated;
grant all on public.presenter_invites to service_role;
alter table public.presenter_invites enable row level security;
create policy "invites readable by staff" on public.presenter_invites for select to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'presenter') or email = (select u.email from auth.users u where u.id = auth.uid()));
create policy "admins manage invites" on public.presenter_invites for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,'player'),'@',1)))
  on conflict (id) do update set email = excluded.email;

  insert into public.user_roles (user_id, role) values (new.id, 'player')
  on conflict (user_id, role) do nothing;

  if new.email_confirmed_at is not null and lower(new.email) = 'mishraishani9@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;

  if new.email_confirmed_at is not null and exists (
    select 1 from public.presenter_invites i where lower(i.email) = lower(new.email) and i.status in ('pending','approved')
  ) then
    insert into public.user_roles (user_id, role) values (new.id, 'presenter')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.handle_new_user();
