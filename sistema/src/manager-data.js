import { supabase } from './supabase';
export const tables = ['parties','employees','assignments','entries','payments','stock_items','stock_movements'];
export const emptyData = Object.fromEntries(tables.map(t => [t, []]));
export async function loadData() {
  const results = await Promise.all(tables.map(async table => {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(table).select('*').order('id').range(from,from+999);
      if (error) throw error;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    return [table, rows];
  }));
  return Object.fromEntries(results);
}
export async function saveRecord(table, values, id) {
  const query = id ? supabase.from(table).update(values).eq('id', id) : supabase.from(table).insert(values);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}
export async function deleteRecord(table, id) {
  if (!tables.includes(table) || table === 'payments' || !id) throw new Error('Invalid deletion');
  const { error } = await supabase.from(table).delete().eq('id', id).select('id').single();
  if (error) throw error;
}
export function errorMessage(error) {
  if (error?.code === '23503') return 'Este registro possui vínculos ou histórico. Remova os vínculos sem histórico primeiro, ou use Editar para cancelar/inativar o cadastro. Pagamentos, inclusive estornados, são preservados.';
  if (error?.code === 'PGRST116') return 'O registro não está mais disponível ou sua conta não tem permissão. Atualize a lista.';
  if (error?.code === '23505') return 'Este funcionário já está escalado nesta festa. Edite a escala existente.';
  if (error?.code === '42501') return 'Sua conta não tem permissão. Entre novamente com o acesso da gestora.';
  if (error?.code === 'P0001') return error.message;
  return 'Não foi possível concluir. Confira sua conexão e tente novamente.';
}
