-- 편성 보호 트리거는 사이트(API)로 들어온 요청에만 적용합니다.
-- 대시보드에서 계정을 지울 때(발표자 → NULL)처럼 서버 내부 작업까지 막지 않도록.
create or replace function public.guard_episode_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') and not public.is_admin() and (
    new.season_id is distinct from old.season_id or new.number is distinct from old.number or
    new.date is distinct from old.date or new.time is distinct from old.time or
    new.presenter_id is distinct from old.presenter_id
  ) then
    raise exception '편성 변경은 관리자만 할 수 있어요' using errcode = '42501';
  end if;
  return new;
end $$;
