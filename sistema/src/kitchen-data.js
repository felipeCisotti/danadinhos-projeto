import {supabase} from './supabase';
import {allRows} from './reception-data';
export async function loadKitchen(){
 const [parties,stock]=await Promise.all([
  allRows(()=>supabase.rpc('kitchen_parties').select('*').order('event_date').order('event_time').order('id')),
  allRows(()=>supabase.rpc('kitchen_stock').select('*').order('name').order('id'))
 ]);return {parties,stock};
}
export async function loadKitchenParty(id){
 const [tasks,quantities,menu]=await Promise.all([
  allRows(()=>supabase.from('kitchen_tasks').select('*').eq('party_id',id).order('created_at').order('id')),
  allRows(()=>supabase.from('kitchen_quantities').select('*').eq('party_id',id).order('category').order('name').order('id')),
  supabase.from('party_menu_forms').select('*').eq('party_id',id).maybeSingle()
 ]);if(menu.error)throw menu.error;return {tasks,quantities,menu:menu.data};
}
export async function saveKitchen(table,partyId,values,id){
 if(!['kitchen_tasks','kitchen_quantities'].includes(table))throw new Error('Invalid table');
 const query=id?supabase.from(table).update(values).eq('id',id).eq('party_id',partyId):supabase.from(table).insert({...values,party_id:partyId});
 const {error}=await query.select('id').single();if(error)throw error;
}
export async function deleteKitchen(table,partyId,id){
 if(!['kitchen_tasks','kitchen_quantities'].includes(table))throw new Error('Invalid table');
 const {error}=await supabase.from(table).delete().eq('id',id).eq('party_id',partyId).select('id').single();if(error)throw error;
}
