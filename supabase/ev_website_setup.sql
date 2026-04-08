-- Enable UUID extension
create extension if not exists pgcrypto;

-- Posts table
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

alter table public.posts enable row level security;

-- Posts RLS - anyone can read published
drop policy if exists "Anyone can read published posts" on public.posts;
create policy "Anyone can read published posts"
on public.posts
for select
to anon, authenticated
using (published = true);

-- Posts RLS - authenticated can write
drop policy if exists "Authenticated write posts" on public.posts;
create policy "Authenticated write posts"
on public.posts
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Updated_at trigger
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

-- Storage bucket for media
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public media read" on storage.objects;
create policy "Public media read"
on storage.objects
for select
using (bucket_id = 'media');

drop policy if exists "Authenticated media insert" on storage.objects;
create policy "Authenticated media insert"
on storage.objects
for insert
with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "Authenticated media update" on storage.objects;
create policy "Authenticated media update"
on storage.objects
for update
using (bucket_id = 'media' and auth.role() = 'authenticated')
with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "Authenticated media delete" on storage.objects;
create policy "Authenticated media delete"
on storage.objects
for delete
using (bucket_id = 'media' and auth.role() = 'authenticated');

-- Newsletter subscribers table
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  full_name text,
  source text,
  opted_in boolean not null default true
);

alter table public.newsletter_subscribers enable row level security;

-- Allow anyone to insert
drop policy if exists "Allow public insert" on public.newsletter_subscribers;
create policy "Allow public insert"
on public.newsletter_subscribers
for insert
to anon, authenticated
with check (true);

-- Allow anyone to update
drop policy if exists "Public update own subscriber row" on public.newsletter_subscribers;
create policy "Allow public update"
on public.newsletter_subscribers
for update
to anon, authenticated
using (true)
with check (true);

-- Allow anyone to read
drop policy if exists "Public read subscribers" on public.newsletter_subscribers;
drop policy if exists "Authenticated read subscribers" on public.newsletter_subscribers;
create policy "Allow public read"
on public.newsletter_subscribers
for select
to anon, authenticated
using (true);

-- Contact submissions table
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  intent text
);

alter table public.contact_submissions enable row level security;

-- Allow anyone to insert
drop policy if exists "Allow public insert contact" on public.contact_submissions;
create policy "Allow public insert contact"
on public.contact_submissions
for insert
to anon, authenticated
with check (true);

-- Allow authenticated to read
drop policy if exists "Authenticated read contact" on public.contact_submissions;
create policy "Authenticated read contact"
on public.contact_submissions
for select
using (auth.role() = 'authenticated');

-- Newsletter updated_at trigger
drop trigger if exists trg_newsletter_subscribers_updated_at on public.newsletter_subscribers;
create trigger trg_newsletter_subscribers_updated_at
before update on public.newsletter_subscribers
for each row
execute function public.set_updated_at();