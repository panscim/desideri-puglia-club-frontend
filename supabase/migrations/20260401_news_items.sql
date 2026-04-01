create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  image_url text,
  category text not null default 'Novita',
  published_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_items enable row level security;

drop policy if exists news_items_public_read on public.news_items;
create policy news_items_public_read on public.news_items
for select using (is_published = true);

drop trigger if exists trg_news_items_updated_at on public.news_items;
create trigger trg_news_items_updated_at
before update on public.news_items
for each row execute function public.set_updated_at();
