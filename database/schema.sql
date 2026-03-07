create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  image_url text,
  platform text not null check (platform in ('linkedin', 'twitter')),
  day_of_week integer not null check (day_of_week between 0 and 6),
  post_time time not null,
  repeat_weekly boolean not null default true,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  last_published_at timestamptz
);

create index if not exists idx_posts_schedule on public.posts (published, day_of_week, post_time);