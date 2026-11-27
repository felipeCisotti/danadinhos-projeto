-- Run after schema.sql, reception.sql and kitchen.sql.
create policy staff_receive_refresh on realtime.messages for select to authenticated
using (extension = 'broadcast' and (
  ((select realtime.topic()) = 'staff:gestora' and (select auth.jwt()->'app_metadata'->>'role') = 'gestora')
  or ((select realtime.topic()) = 'staff:recepcao' and (select auth.jwt()->'app_metadata'->>'role') in ('recepcao','gestora'))
  or ((select realtime.topic()) = 'staff:cozinha' and (select auth.jwt()->'app_metadata'->>'role') in ('cozinha','gestora'))
));

create function public.notify_staff_refresh() returns trigger
language plpgsql security definer set search_path = '' as $$
declare area text;
begin
  foreach area in array tg_argv loop
    perform realtime.send('{}'::jsonb, 'refresh', 'staff:' || area, true);
  end loop;
  return null;
end $$;
revoke all on function public.notify_staff_refresh() from public, anon, authenticated;

do $$
declare item record;
begin
  for item in select * from (values
    ('parties', array['gestora','recepcao','cozinha']),
    ('employees', array['gestora']), ('assignments', array['gestora']),
    ('entries', array['gestora']), ('payments', array['gestora']),
    ('stock_items', array['gestora','cozinha']), ('stock_movements', array['gestora','cozinha']),
    ('party_guests', array['recepcao']), ('party_menu_forms', array['recepcao','cozinha']),
    ('kitchen_quantities', array['cozinha']), ('kitchen_tasks', array['cozinha'])
  ) as sources(tbl,areas) loop
    execute format('create trigger staff_refresh after insert or update or delete on public.%I for each statement execute function public.notify_staff_refresh(%s)',
      item.tbl, (select string_agg(quote_literal(x), ',') from unnest(item.areas) x));
  end loop;
end $$;
