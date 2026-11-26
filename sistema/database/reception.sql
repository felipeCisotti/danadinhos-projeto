begin;
create table public.party_guests (
 id uuid primary key default gen_random_uuid(),
 party_id uuid not null references public.parties(id),
 name text not null check(length(trim(name)) between 1 and 200),
 age integer not null check(age between 0 and 120),
 phone text not null check(length(trim(phone)) between 1 and 40),
 checked_in_at timestamptz,
 created_at timestamptz not null default now()
);
create index party_guests_party_idx on public.party_guests(party_id,id);
create table public.party_menu_forms (
 party_id uuid primary key references public.parties(id),
 savory text not null default '' check(length(savory)<=4000),
 sweets text not null default '' check(length(sweets)<=4000),
 drinks text not null default '' check(length(drinks)<=4000),
 cake text not null default '' check(length(cake)<=4000),
 restrictions text not null default '' check(length(restrictions)<=4000),
 notes text not null default '' check(length(notes)<=4000),
 updated_at timestamptz not null default now()
);
alter table public.party_guests enable row level security;
alter table public.party_menu_forms enable row level security;
revoke all on public.party_guests,public.party_menu_forms from anon,authenticated;
grant select,insert,update on public.party_guests,public.party_menu_forms to authenticated;
create policy reception_guests on public.party_guests for all to authenticated
 using ((select auth.jwt()->'app_metadata'->>'role') in ('gestora','recepcao'))
 with check ((select auth.jwt()->'app_metadata'->>'role') in ('gestora','recepcao'));
create policy reception_menu on public.party_menu_forms for all to authenticated
 using ((select auth.jwt()->'app_metadata'->>'role') in ('gestora','recepcao'))
 with check ((select auth.jwt()->'app_metadata'->>'role') in ('gestora','recepcao'));

create schema if not exists private;
-- Explicitly limited projection: reception cannot read financial/private party columns.
create function private.reception_parties() returns table(
 id uuid,client text,event_date date,event_time time,guests integer,menu text,status text
) language sql stable security definer set search_path='' as $$
 select p.id,p.client,p.event_date,p.event_time,p.guests,p.menu,p.status
 from public.parties p
 where (select auth.uid()) is not null and (select auth.jwt()->'app_metadata'->>'role') in ('gestora','recepcao');
$$;
revoke all on function private.reception_parties() from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.reception_parties() to authenticated;
create function public.reception_parties() returns table(
 id uuid,client text,event_date date,event_time time,guests integer,menu text,status text
) language sql stable security invoker set search_path='' as $$
 select * from private.reception_parties();
$$;
revoke all on function public.reception_parties() from public,anon,authenticated;
grant execute on function public.reception_parties() to authenticated;

-- Private trigger must inspect parties without granting reception access to that table.
create schema if not exists private;
create function private.guard_reception_record() returns trigger
language plpgsql security definer set search_path='' as $$
declare event_status text;
begin
 if coalesce(auth.jwt()->'app_metadata'->>'role','') not in ('gestora','recepcao') then
   raise exception 'Acesso não permitido.';
 end if;
 if TG_OP='UPDATE' and new.party_id<>old.party_id then
   raise exception 'O vínculo com a festa não pode ser alterado.';
 end if;
 select status into event_status from public.parties where id=new.party_id;
 if not found then raise exception 'Festa não encontrada.'; end if;
 if event_status='cancelado' then raise exception 'Esta festa está cancelada. Os registros são somente para consulta.'; end if;
 if TG_TABLE_NAME='party_guests' then
   if TG_OP='UPDATE' then
     if new.id<>old.id or new.created_at<>old.created_at then raise exception 'Identificação do convidado não pode ser alterada.'; end if;
     if old.checked_in_at is not null and new.checked_in_at is distinct from old.checked_in_at then
       raise exception 'A entrada já foi registrada. Não há registro de saída.';
     end if;
   end if;
   if new.checked_in_at is not null and (TG_OP='INSERT' or old.checked_in_at is null) then
     if event_status<>'aprovado' then raise exception 'A entrada só pode ser registrada em festa aprovada.'; end if;
     new.checked_in_at:=statement_timestamp();
   end if;
 else
   new.updated_at:=statement_timestamp();
 end if;
 return new;
end $$;
revoke all on function private.guard_reception_record() from public,anon,authenticated;
create trigger reception_guest_guard before insert or update on public.party_guests
 for each row execute function private.guard_reception_record();
create trigger reception_menu_guard before insert or update on public.party_menu_forms
 for each row execute function private.guard_reception_record();
commit;
