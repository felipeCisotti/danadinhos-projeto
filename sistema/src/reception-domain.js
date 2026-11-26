export function attendance(guests, limit) {
  const arrived=guests.filter(g=>g.checked_in_at).length;
  return { registered:guests.length, arrived, remaining:Math.max(0,limit-arrived), full:arrived>=limit, excess:Math.max(0,arrived-limit) };
}
export const menuFields=[['savory','Salgados e pratos'],['sweets','Doces'],['drinks','Bebidas'],['cake','Bolo e sobremesas'],['restrictions','Alergias e restrições alimentares'],['notes','Observações e quantidades']];
export const emptyMenu=Object.fromEntries(menuFields.map(([key])=>[key,'']));
export const entryTime=value=>value?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'Não entrou';
