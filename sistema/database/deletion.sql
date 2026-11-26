-- Execute after schema.sql and reschedule.sql. Existing records are not changed.
begin;
create or replace function public.guard_delete() returns trigger
language plpgsql security invoker set search_path='' as $$
declare balance numeric;
begin
 if TG_TABLE_NAME='parties' then
   delete from public.entries where party_id=old.id and source='festa';
 elsif TG_TABLE_NAME='assignments' then
   delete from public.entries where assignment_id=old.id and source='diaria';
 elsif TG_TABLE_NAME='entries' then
   if old.source<>'manual' and pg_trigger_depth()<2 then
     raise exception 'Exclua esta conta pela festa ou escala de origem.';
   end if;
 elsif TG_TABLE_NAME='stock_movements' then
   perform 1 from public.stock_items where id=old.item_id for update;
   select coalesce(sum(quantity),0) into balance from public.stock_movements where item_id=old.item_id;
   if balance-old.quantity<0 then
     raise exception 'Esta exclusão deixaria o estoque negativo. Corrija as saídas vinculadas primeiro.';
   end if;
 end if;
 return old;
end $$;
revoke all on function public.guard_delete() from public,anon,authenticated;
do $$
declare t text;
begin
 foreach t in array array['parties','employees','assignments','entries','stock_items','stock_movements'] loop
   execute format('grant delete on public.%I to authenticated',t);
 end loop;
 foreach t in array array['parties','assignments','entries','stock_movements'] loop
   execute format('drop trigger if exists deletion_guard on public.%I',t);
   execute format('create trigger deletion_guard before delete on public.%I for each row execute function public.guard_delete()',t);
 end loop;
end $$;
commit;
