create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  slug text not null unique,
  content jsonb,
  excerpt text,
  cover_url text,
  category text,
  tags text[],
  published boolean not null default false,
  reading_time int
);

alter table public.posts
  add column if not exists author_id uuid references auth.users(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists title text,
  add column if not exists slug text,
  add column if not exists content jsonb,
  add column if not exists excerpt text,
  add column if not exists cover_url text,
  add column if not exists category text,
  add column if not exists tags text[],
  add column if not exists published boolean not null default false,
  add column if not exists reading_time int;

alter table public.posts
  alter column author_id set default auth.uid();

update public.posts
set author_id = auth.uid()
where author_id is null
  and auth.uid() is not null;

do $$
begin
  begin
    alter table public.posts alter column author_id set not null;
  exception
    when others then
      -- If null author rows remain for historical data, keep table usable.
      null;
  end;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posts_slug_key'
  ) then
    alter table public.posts add constraint posts_slug_key unique (slug);
  end if;
end $$;

alter table public.posts enable row level security;

drop policy if exists "Public read published posts" on public.posts;
create policy "Public read published posts"
on public.posts
for select
using (published = true);

drop policy if exists "Admin full access by email" on public.posts;
drop policy if exists "Authenticated write posts" on public.posts;
create policy "Authenticated write posts"
on public.posts
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public media read" on storage.objects;
create policy "Public media read"
on storage.objects
for select
using (bucket_id = 'media');

drop policy if exists "Admin media insert" on storage.objects;
drop policy if exists "Authenticated media insert" on storage.objects;
create policy "Authenticated media insert"
on storage.objects
for insert
with check (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
);

drop policy if exists "Admin media update" on storage.objects;
drop policy if exists "Authenticated media update" on storage.objects;
create policy "Authenticated media update"
on storage.objects
for update
using (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
)
with check (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
);

drop policy if exists "Admin media delete" on storage.objects;
drop policy if exists "Authenticated media delete" on storage.objects;
create policy "Authenticated media delete"
on storage.objects
for delete
using (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
);
