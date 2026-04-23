-- membar: business contact manager schema
-- Run this in Supabase SQL editor

create extension if not exists "pgcrypto";

-- persons
create table if not exists persons (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  title text,
  company text,
  location text,
  education text,
  relationship text,
  birth_year integer,
  family jsonb not null default '{"spouse": false, "children": 0}'::jsonb,
  interests text[] not null default '{}',
  business text[] not null default '{}',
  tags text[] not null default '{}',
  todos jsonb not null default '[]'::jsonb,
  meetings jsonb not null default '[]'::jsonb,
  i_said text[] not null default '{}',
  notes text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  last_updated_at timestamptz not null default now()
);

create index if not exists persons_user_idx on persons(user_id);
create index if not exists persons_user_updated_idx on persons(user_id, last_updated_at desc);
create index if not exists persons_user_name_idx on persons(user_id, name);
create index if not exists persons_tags_gin on persons using gin(tags);
create index if not exists persons_interests_gin on persons using gin(interests);
create index if not exists persons_business_gin on persons using gin(business);

-- history
create table if not exists history (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references persons(id) on delete cascade,
  raw_input text not null,
  parsed_changes jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists history_person_created_idx on history(person_id, created_at desc);

-- NOTE: RLS is intentionally disabled for MVP. Enable and add policies before production.
-- alter table persons enable row level security;
-- alter table history enable row level security;
