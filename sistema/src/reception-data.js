import { supabase } from './supabase';
export async function allRows(query) {
  const rows=[];
  for(let from=0;;from+=1000){
    const {data,error}=await query().range(from,from+999);
    if(error)throw error;
    rows.push(...data);
    if(data.length<1000)return rows;
  }
}
export const loadReceptionParties=()=>allRows(()=>supabase.rpc('reception_parties').select('*').order('event_date',{ascending:false}).order('id'));
export async function loadReceptionParty(id) {
  const [guests,menu]=await Promise.all([
    allRows(()=>supabase.from('party_guests').select('*').eq('party_id',id).order('name').order('id')),
    supabase.from('party_menu_forms').select('*').eq('party_id',id).maybeSingle()
  ]);
  if(menu.error)throw menu.error;
  return {guests,menu:menu.data};
}
export async function saveGuest(partyId,values,id) {
  const query=id?supabase.from('party_guests').update(values).eq('id',id).eq('party_id',partyId):supabase.from('party_guests').insert({...values,party_id:partyId});
  const {data,error}=await query.select().single();if(error)throw error;return data;
}
export async function checkInGuest(partyId,id) {
  const {error}=await supabase.from('party_guests').update({checked_in_at:new Date().toISOString()}).eq('party_id',partyId).eq('id',id).is('checked_in_at',null).select('id').single();
  if(error)throw error;
}
export async function importGuests(partyId,guests) {
  if(!partyId||!guests.length||guests.length>1000)throw new Error('Invalid import');
  // One transaction; stable UUIDs make retrying the same preview safe after a lost response.
  const rows=guests.map(({id,name,age,phone})=>({id,party_id:partyId,name,age,phone}));
  const {error}=await supabase.from('party_guests').upsert(rows,{onConflict:'id',ignoreDuplicates:true});
  if(error)throw error;
}
export async function saveMenu(partyId,values) {
  const {data,error}=await supabase.from('party_menu_forms').upsert({...values,party_id:partyId}).select().single();
  if(error)throw error;return data;
}
export function receptionError(e){
  if(e?.code==='P0001')return e.message;
  if(e?.code==='PGRST116')return 'Registro indisponível ou entrada já registrada em outro atendimento. Atualize a lista.';
  if(e?.code==='42501')return 'Seu perfil não tem permissão para esta operação.';
  return 'Não foi possível concluir. Verifique a conexão e tente novamente.';
}
