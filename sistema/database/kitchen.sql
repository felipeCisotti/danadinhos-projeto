begin;
create table public.kitchen_quantities (
 id uuid primary key default gen_random_uuid(), party_id uuid not null references public.parties(id),
 name text not null check(length(trim(name)) between 1 and 200),
 category text not null check(category in ('Alimentos','Bebidas')),
 quantity numeric(12,3) not null check(quantity>0),
 unit text not null check(length(trim(unit)) between 1 and 30)
);
create index kitchen_quantities_party_idx on public.kitchen_quantities(party_id,id);
create table public.kitchen_tasks (
 id uuid primary key default gen_random_uuid(), party_id uuid not null references public.parties(id),
 title text not null check(length(trim(title)) between 1 and 300),
 responsible text not null check(length(trim(responsible)) between 1 and 200),
 done boolean not null default false, completed_at timestamptz,
 created_at timestamptz not null default now()
);
create index kitchen_tasks_party_idx on public.kitchen_tasks(party_id,id);
alter table public.kitchen_quantities enable row level security;
alter table public.kitchen_tasks enable row level security;
revoke all on public.kitchen_quantities,public.kitchen_tasks from anon,authenticated;
grant select,insert,update,delete on public.kitchen_quantities,public.kitchen_tasks to authenticated;
create policy quantities_read on public.kitchen_quantities for select to authenticated using ((select auth.jwt()->'app_metadata'->>'role') in ('gestora','cozinha'));
create policy quantities_manage on public.kitchen_quantities for all to authenticated using ((select auth.jwt()->'app_metadata'->>'role')='gestora') with check ((select auth.jwt()->'app_metadata'->>'role')='gestora');
create policy kitchen_tasks_manage on public.kitchen_tasks for all to authenticated using ((select auth.jwt()->'app_metadata'->>'role') in ('gestora','cozinha')) with check ((select auth.jwt()->'app_metadata'->>'role') in ('gestora','cozinha'));
create policy kitchen_menu_read on public.party_menu_forms for select to authenticated using ((select auth.jwt()->'app_metadata'->>'role')='cozinha');

create function private.kitchen_parties() returns table(id uuid,client text,event_date date,event_time time,guests integer,menu text,status text)
language sql stable security definer set search_path='' as $$
 select p.id,p.client,p.event_date,p.event_time,p.guests,p.menu,p.status from public.parties p
 where (select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') in ('gestora','cozinha');
$$;
create function public.kitchen_parties() returns table(id uuid,client text,event_date date,event_time time,guests integer,menu text,status text)
language sql stable security invoker set search_path='' as $$ select * from private.kitchen_parties(); $$;
create function private.kitchen_stock() returns table(id uuid,name text,category text,unit text,minimum numeric,active boolean,balance numeric)
language sql stable security definer set search_path='' as $$
 select i.id,i.name,i.category,i.unit,i.minimum,i.active,coalesce(sum(m.quantity),0)
 from public.stock_items i left join public.stock_movements m on m.item_id=i.id
 where (select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') in ('gestora','cozinha')
 group by i.id;
$$;
create function public.kitchen_stock() returns table(id uuid,name text,category text,unit text,minimum numeric,active boolean,balance numeric)
language sql stable security invoker set search_path='' as $$ select * from private.kitchen_stock(); $$;
revoke all on function private.kitchen_parties(),public.kitchen_parties(),private.kitchen_stock(),public.kitchen_stock() from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.kitchen_parties(),public.kitchen_parties(),private.kitchen_stock(),public.kitchen_stock() to authenticated;

create function private.guard_kitchen_record() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid; event_status text;
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'role','') not in ('gestora','cozinha') then raise exception 'Acesso não permitido.'; end if;
 if TG_TABLE_NAME='kitchen_quantities' and auth.jwt()->'app_metadata'->>'role'<>'gestora' then raise exception 'Somente a gestora pode definir as quantidades.'; end if;
 if TG_OP='DELETE' then target:=old.party_id; else target:=new.party_id; end if;
 select status into event_status from public.parties where id=target;
 if not found then raise exception 'Festa não encontrada.'; end if;
 if event_status='cancelado' then raise exception 'Festa cancelada: somente consulta.'; end if;
 if TG_OP='DELETE' then return old; end if;
 if TG_OP='UPDATE' and (new.party_id<>old.party_id or new.id<>old.id) then raise exception 'O vínculo com a festa não pode ser alterado.'; end if;
 if TG_TABLE_NAME='kitchen_tasks' then
   if TG_OP='UPDATE' and new.done=old.done then new.completed_at:=old.completed_at;
   elsif new.done then new.completed_at:=statement_timestamp();
   else new.completed_at:=null; end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_kitchen_record() from public,anon,authenticated;
create trigger kitchen_tasks_guard before insert or update or delete on public.kitchen_tasks for each row execute function private.guard_kitchen_record();
create trigger kitchen_quantities_guard before insert or update or delete on public.kitchen_quantities for each row execute function private.guard_kitchen_record();
commit;
