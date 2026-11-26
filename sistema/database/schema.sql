create table public.parties (
 id uuid primary key default gen_random_uuid(), client text not null check(length(trim(client))>0),
 phone text not null, event_date date not null, event_time time not null,
 guests integer not null check(guests>0), amount numeric(12,2) not null check(amount>=0),
 menu text not null default '', decoration text not null default '',
 status text not null default 'orcamento' check(status in ('orcamento','aguardando','aprovado','cancelado')),
 notes text not null default '', created_at timestamptz not null default now()
);
create index parties_date_idx on public.parties(event_date);
create table public.employees (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0),
 job text not null, phone text not null, admission_date date not null,
 kind text not null check(kind in ('fixo','temporario')), active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.assignments (
 id uuid primary key default gen_random_uuid(), party_id uuid not null references public.parties(id),
 employee_id uuid not null references public.employees(id), job text not null,
 fee numeric(12,2) not null check(fee>=0),
 status text not null default 'escalado' check(status in ('escalado','trabalhou','cancelado')),
 created_at timestamptz not null default now(), unique(party_id,employee_id)
);
create index assignments_employee_idx on public.assignments(employee_id);
create table public.entries (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('receber','pagar')),
 description text not null, category text not null default 'Outros',
 amount numeric(12,2) not null check(amount>=0), due_date date not null,
 party_id uuid references public.parties(id), employee_id uuid references public.employees(id),
 assignment_id uuid unique references public.assignments(id),
 source text not null default 'manual' check(source in ('manual','festa','diaria')),
 canceled boolean not null default false, created_at timestamptz not null default now(),
 check(source <> 'festa' or (party_id is not null and kind='receber')),
 check(source <> 'diaria' or (assignment_id is not null and kind='pagar'))
);
create unique index entries_party_contract_idx on public.entries(party_id) where source='festa';
create index entries_due_idx on public.entries(due_date);
create index entries_party_idx on public.entries(party_id);
create index entries_employee_idx on public.entries(employee_id);
create table public.payments (
 id uuid primary key default gen_random_uuid(), entry_id uuid not null references public.entries(id),
 amount numeric(12,2) not null check(amount>0), payment_date date not null,
 method text not null default 'Pix', notes text not null default '',
 voided boolean not null default false, created_at timestamptz not null default now()
);
create index payments_entry_idx on public.payments(entry_id);
create index payments_date_idx on public.payments(payment_date);
create table public.stock_items (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0),
 category text not null check(category in ('Alimentos','Bebidas','Limpeza')),
 unit text not null default 'un', minimum numeric(12,3) not null default 0 check(minimum>=0),
 active boolean not null default true, created_at timestamptz not null default now()
);
create table public.stock_movements (
 id uuid primary key default gen_random_uuid(), item_id uuid not null references public.stock_items(id),
 quantity numeric(12,3) not null check(quantity<>0), reason text not null,
 party_id uuid references public.parties(id), movement_date date not null default current_date,
 created_at timestamptz not null default now()
);
create index stock_movements_item_idx on public.stock_movements(item_id);
create index stock_movements_party_idx on public.stock_movements(party_id);

do $$
declare t text;
begin
 foreach t in array array['parties','employees','assignments','entries','payments','stock_items','stock_movements'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select, insert, update on public.%I to authenticated',t);
 execute format('create policy gestora_only on public.%I for all to authenticated using ((select auth.jwt()->''app_metadata''->>''role'') = ''gestora'') with check ((select auth.jwt()->''app_metadata''->>''role'') = ''gestora'')',t);
 end loop;
end $$;
revoke update on public.stock_movements from authenticated;

create function public.guard_payment() returns trigger language plpgsql security invoker set search_path='' as $$
declare bill public.entries; paid numeric;
begin
 if TG_OP='UPDATE' and (new.entry_id<>old.entry_id or new.amount<>old.amount or new.payment_date<>old.payment_date or new.voided=false) then
 raise exception 'Pagamentos só podem ser estornados; registre um novo para corrigir.'; end if;
 select * into bill from public.entries where id=new.entry_id for update;
 if not found then raise exception 'Conta não encontrada.'; end if;
 select coalesce(sum(amount),0) into paid from public.payments where entry_id=new.entry_id and not voided and id<>new.id;
 if not new.voided and bill.canceled then raise exception 'A conta está cancelada ou ainda não foi aprovada.'; end if;
 if not new.voided and paid+new.amount>bill.amount then raise exception 'O pagamento excede o saldo pendente.'; end if;
 return new;
end $$;
create trigger payment_guard before insert or update on public.payments for each row execute function public.guard_payment();

create function public.guard_entry() returns trigger language plpgsql security invoker set search_path='' as $$
declare paid numeric;
begin
 if TG_OP='UPDATE' then
 select coalesce(sum(amount),0) into paid from public.payments where entry_id=old.id and not voided;
 if new.amount<paid then raise exception 'O valor não pode ser menor que os pagamentos registrados. Estorne primeiro.'; end if;
 if new.kind<>old.kind or new.source<>old.source or new.party_id is distinct from old.party_id or new.assignment_id is distinct from old.assignment_id or new.employee_id is distinct from old.employee_id then
 raise exception 'Os vínculos de uma conta não podem ser alterados.'; end if;
 end if;
 if pg_trigger_depth()<2 and (new.source<>'manual' or (TG_OP='UPDATE' and old.source<>'manual')) then
 raise exception 'Edite esta conta pela festa ou escala de origem.'; end if;
 return new;
end $$;
create trigger entry_guard before insert or update on public.entries for each row execute function public.guard_entry();

create function public.sync_party_entry() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.entries(kind,description,category,amount,due_date,party_id,source,canceled)
 values('receber','Festa · '||new.client,'Contrato de festa',new.amount,new.event_date,new.id,'festa',new.status<>'aprovado')
 on conflict (party_id) where source='festa' do update set description=excluded.description,amount=excluded.amount,due_date=excluded.due_date,canceled=excluded.canceled;
 return new;
end $$;
create trigger party_entry after insert or update on public.parties for each row execute function public.sync_party_entry();

create function public.sync_assignment_entry() returns trigger language plpgsql security invoker set search_path='' as $$
declare event public.parties; person public.employees;
begin
 if TG_OP='UPDATE' and (new.party_id<>old.party_id or new.employee_id<>old.employee_id) then raise exception 'Os vínculos da escala não podem ser alterados.'; end if;
 select * into event from public.parties where id=new.party_id;
 select * into person from public.employees where id=new.employee_id;
 if event.id is null or person.id is null then raise exception 'Festa ou funcionário não encontrado.'; end if;
 if TG_OP='INSERT' and (not person.active or event.status='cancelado') then raise exception 'Selecione funcionário ativo e festa não cancelada.'; end if;
 insert into public.entries(kind,description,category,amount,due_date,party_id,employee_id,assignment_id,source,canceled)
 values('pagar','Diária · '||person.name,'Equipe',new.fee,event.event_date,new.party_id,new.employee_id,new.id,'diaria',new.status='cancelado')
 on conflict (assignment_id) do update set amount=excluded.amount,canceled=excluded.canceled;
 return new;
end $$;
create trigger assignment_entry after insert or update on public.assignments for each row execute function public.sync_assignment_entry();

create function public.guard_stock_movement() returns trigger language plpgsql security invoker set search_path='' as $$
declare balance numeric; enabled boolean;
begin
 select active into enabled from public.stock_items where id=new.item_id for update;
 if not found or not enabled then raise exception 'Item não encontrado ou inativo.'; end if;
 select coalesce(sum(quantity),0) into balance from public.stock_movements where item_id=new.item_id;
 if balance+new.quantity<0 then raise exception 'Estoque insuficiente para esta saída.'; end if;
 return new;
end $$;
create trigger stock_movement_guard before insert on public.stock_movements for each row execute function public.guard_stock_movement();
revoke execute on function public.guard_payment(),public.guard_entry(),public.sync_party_entry(),public.sync_assignment_entry(),public.guard_stock_movement() from public,anon,authenticated;
