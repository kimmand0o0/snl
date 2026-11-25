-- SNL 스키마. 읽기는 누구나, 쓰기는 RLS 로 본인/발표자/관리자만.

create extension if not exists pgcrypto;

-- ───────── 출연진 ─────────
create table public.members (
  id uuid primary key references auth.users on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,29}$'),
  name text not null check (length(name) between 1 and 40),
  role text not null default '',
  tagline text,
  avatar_url text,
  accent text not null default '#ffc531' check (accent ~ '^#[0-9a-fA-F]{6}$'),
  stack text[] not null default '{}',
  github text,
  blog text,
  links jsonb not null default '[]',
  bio text not null default '',
  card_html text check (length(card_html) <= 100000),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.members where id = auth.uid()), false)
$$;

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where id = auth.uid())
$$;

alter table public.members enable row level security;
create policy "members: read" on public.members for select using (true);
create policy "members: update self or admin" on public.members for update
  using (id = auth.uid() or public.is_admin());
create policy "members: delete by admin" on public.members for delete using (public.is_admin());
-- is_admin 은 API 로 못 바꾸게. 관리자 지정은 set_admin() 으로만.
revoke update on public.members from authenticated, anon;
grant update (slug, name, role, tagline, avatar_url, accent, stack, github, blog, links, bio, card_html)
  on public.members to authenticated;

-- ───────── 초대 코드 ─────────
create table public.settings (
  id boolean primary key default true check (id),
  invite_code text not null default encode(gen_random_bytes(6), 'hex')
);
insert into public.settings default values;
alter table public.settings enable row level security;
create policy "settings: admin" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- 초대 코드로 가입. 관리자가 아직 없으면 첫 가입자가 관리자가 됩니다.
create or replace function public.join_snl(code text, p_slug text, p_name text, p_avatar text default null, p_github text default null)
returns public.members
language plpgsql security definer set search_path = public as $$
declare
  m public.members;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요해요' using errcode = '28000';
  end if;
  if not exists (select 1 from settings where invite_code = trim(code)) then
    raise exception '초대 코드가 맞지 않아요' using errcode = '22023';
  end if;
  insert into members (id, slug, name, avatar_url, github, is_admin)
  values (auth.uid(), lower(trim(p_slug)), trim(p_name), p_avatar, p_github,
          not exists (select 1 from members where is_admin))
  returning * into m;
  return m;
end $$;
revoke execute on function public.join_snl from anon;

create or replace function public.set_admin(target uuid, value boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception '관리자만 할 수 있어요' using errcode = '42501';
  end if;
  if target = auth.uid() and not value then
    raise exception '본인의 관리자 권한은 해제할 수 없어요' using errcode = '22023';
  end if;
  update members set is_admin = value where id = target;
end $$;

-- ───────── 기수 ─────────
create table public.seasons (
  id bigint generated always as identity primary key,
  number int not null unique check (number > 0),
  title text not null,
  theme text,
  start_date date not null,
  end_date date,
  time text not null default '20:00' check (time ~ '^\d{2}:\d{2}$'),
  place text not null default '온라인'
);
alter table public.seasons enable row level security;
create policy "seasons: read" on public.seasons for select using (true);
create policy "seasons: admin" on public.seasons for all using (public.is_admin()) with check (public.is_admin());

-- 기수 출연진. position 순서가 발표 로테이션 순서.
create table public.season_cast (
  season_id bigint not null references public.seasons on delete cascade,
  member_id uuid not null references public.members on delete cascade,
  position int not null default 0,
  primary key (season_id, member_id)
);
alter table public.season_cast enable row level security;
create policy "cast: read" on public.season_cast for select using (true);
create policy "cast: admin" on public.season_cast for all using (public.is_admin()) with check (public.is_admin());

-- ───────── 회차 ─────────
create table public.episodes (
  id bigint generated always as identity primary key,
  season_id bigint not null references public.seasons on delete cascade,
  number int not null check (number > 0),
  date date not null,
  time text check (time ~ '^\d{2}:\d{2}$'),
  presenter_id uuid references public.members on delete set null,
  title text not null default '제목 미정',
  summary text,
  tags text[] not null default '{}',
  status text not null default 'scheduled' check (status in ('scheduled', 'done', 'skipped')),
  notes text not null default '',
  unique (season_id, number)
);
alter table public.episodes enable row level security;
create policy "episodes: read" on public.episodes for select using (true);
create policy "episodes: admin" on public.episodes for all using (public.is_admin()) with check (public.is_admin());
create policy "episodes: presenter edits own" on public.episodes for update
  using (presenter_id = auth.uid()) with check (presenter_id = auth.uid());

-- 발표자는 내용만 고칠 수 있고, 편성(기수·회차·날짜·발표자)은 관리자만.
create or replace function public.guard_episode_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and (
    new.season_id is distinct from old.season_id or new.number is distinct from old.number or
    new.date is distinct from old.date or new.time is distinct from old.time or
    new.presenter_id is distinct from old.presenter_id
  ) then
    raise exception '편성 변경은 관리자만 할 수 있어요' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger episodes_guard before update on public.episodes
  for each row execute function public.guard_episode_update();

-- ───────── 발표 자료 ─────────
create table public.materials (
  id bigint generated always as identity primary key,
  episode_id bigint not null references public.episodes on delete cascade,
  url text not null,
  type text check (type in ('slides', 'pdf', 'video', 'repo', 'doc', 'design', 'image', 'post', 'link')),
  label text,
  file_path text,
  created_by uuid references public.members on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create or replace function public.can_edit_episode(ep bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (select 1 from episodes where id = ep and presenter_id = auth.uid())
$$;
alter table public.materials enable row level security;
create policy "materials: read" on public.materials for select using (true);
create policy "materials: add" on public.materials for insert
  with check (public.can_edit_episode(episode_id) and created_by = auth.uid());
create policy "materials: remove" on public.materials for delete
  using (public.can_edit_episode(episode_id) or created_by = auth.uid());

-- ───────── 블로그 ─────────
create table public.posts (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  author_id uuid not null references public.members on delete cascade default auth.uid(),
  title text not null,
  description text,
  body text not null default '',
  tags text[] not null default '{}',
  episode_id bigint references public.episodes on delete set null,
  draft boolean not null default false,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.posts enable row level security;
create policy "posts: read" on public.posts for select
  using (not draft or author_id = auth.uid() or public.is_admin());
create policy "posts: write own" on public.posts for insert
  with check (author_id = auth.uid() and public.is_member());
create policy "posts: edit own" on public.posts for update
  using (author_id = auth.uid() or public.is_admin());
create policy "posts: delete own" on public.posts for delete
  using (author_id = auth.uid() or public.is_admin());

-- ───────── 파일 저장소 ─────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('materials', 'materials', true, 52428800)
on conflict (id) do nothing;

-- 경로: <episode_id>/<파일명>. 그 회차를 고칠 수 있는 사람만 올릴 수 있어요.
create policy "materials files: upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'materials'
    and (storage.foldername(name))[1] ~ '^\d+$'
    and public.can_edit_episode(((storage.foldername(name))[1])::bigint)
  );
create policy "materials files: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'materials' and (owner = auth.uid() or public.is_admin()));
