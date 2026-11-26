create or replace function public.sync_party_entry() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.entries(kind,description,category,amount,due_date,party_id,source,canceled)
 values('receber','Festa · '||new.client,'Contrato de festa',new.amount,new.event_date,new.id,'festa',new.status<>'aprovado')
 on conflict (party_id) where source='festa' do update set description=excluded.description,amount=excluded.amount,due_date=excluded.due_date,canceled=excluded.canceled;
 if TG_OP='UPDATE' and new.event_date<>old.event_date then
 update public.entries set due_date=new.event_date where party_id=new.id and source='diaria';
 end if;
 return new;
end $$;
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
