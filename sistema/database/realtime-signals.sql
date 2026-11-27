-- Apply after realtime.sql. Only these three signals are replicated, never business rows.
create table public.staff_refresh_signals(area text primary key, revision bigint not null default 0);
insert into public.staff_refresh_signals(area) values ('gestora'),('recepcao'),('cozinha');
alter table public.staff_refresh_signals enable row level security;
revoke all on public.staff_refresh_signals from anon, authenticated;
grant select on public.staff_refresh_signals to authenticated;
create policy staff_read_signal on public.staff_refresh_signals for select to authenticated using (
  area = (select auth.jwt()->'app_metadata'->>'role') or (select auth.jwt()->'app_metadata'->>'role')='gestora'
);
alter publication supabase_realtime add table public.staff_refresh_signals;
drop policy staff_receive_refresh on realtime.messages;
create or replace function public.notify_staff_refresh() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.staff_refresh_signals set revision=revision+1 where area=any(tg_argv);
  return null;
end $$;
