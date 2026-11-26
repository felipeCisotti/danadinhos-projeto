export function taskSummary(tasks){const done=tasks.filter(t=>t.done).length;return {done,total:tasks.length,pending:tasks.length-done};}
export function stockState(item){return !item.active?'Inativo':Number(item.balance)<=Number(item.minimum)?'Estoque baixo':'Disponível';}
export function chooseKitchenParty(parties,current,today){return parties.find(p=>p.id===current)?.id??parties.find(p=>p.event_date>=today&&p.status==='aprovado')?.id??parties.find(p=>p.status!=='cancelado')?.id??parties[0]?.id??'';}
