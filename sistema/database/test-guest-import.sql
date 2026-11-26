begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"gestora"}}',true);
do $$
declare event_id uuid; guest_a uuid:=gen_random_uuid(); guest_b uuid:=gen_random_uuid(); blocked boolean;
begin
 insert into public.parties(client,phone,event_date,event_time,guests,amount,status)
 values('QA CSV rollback','0',current_date,'18:00',1,0,'aprovado') returning id into event_id;
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"recepcao"}}',true);
 insert into public.party_guests(id,party_id,name,age,phone) values
 (guest_a,event_id,'QA A',8,'00123'),(guest_b,event_id,'QA B',9,'00456') on conflict(id) do nothing;
 insert into public.party_guests(id,party_id,name,age,phone) values
 (guest_a,event_id,'QA A',8,'00123'),(guest_b,event_id,'QA B',9,'00456') on conflict(id) do nothing;
 if (select count(*) from public.party_guests where party_id=event_id)<>2 then raise exception 'FAIL: retry duplicated'; end if;
 if exists(select 1 from public.party_guests where party_id=event_id and checked_in_at is not null) then raise exception 'FAIL: import checked guests in'; end if;
 blocked:=false;
 begin
 insert into public.party_guests(party_id,name,age,phone) values
 (event_id,'QA valid',8,'123'),(event_id,'QA invalid',-1,'123');
 exception when check_violation then blocked:=true; end;
 if not blocked or (select count(*) from public.party_guests where party_id=event_id)<>2 then raise exception 'FAIL: partial import'; end if;
end $$;
select 'PASS: bulk CSV insert, atomic failure and idempotent retry' as result;
rollback;
