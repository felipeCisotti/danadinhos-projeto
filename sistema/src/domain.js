export const statuses = { orcamento: 'Orçamento enviado', aguardando: 'Aguardando aprovação', aprovado: 'Aprovado', cancelado: 'Cancelado' };
const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const money = value => moneyFormatter.format(Number(value || 0));
export const dateLabel = value => value ? value.slice(0, 10).split('-').reverse().join('/') : '—';
export const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const cents = value => Math.round(Number(value || 0) * 100);
export const sumMoney = (rows, field = 'amount') => rows.reduce((total, row) => total + cents(row[field]), 0) / 100;
export function paidFor(entry, payments) { return sumMoney(payments.filter(p => p.entry_id === entry.id && !p.voided)); }
export function balanceFor(entry, payments) { return Math.max(0, (cents(entry.amount) - cents(paidFor(entry, payments))) / 100); }
export function stockBalance(item, movements) { return movements.filter(m => m.item_id === item.id).reduce((s, m) => s + Math.round(Number(m.quantity) * 1000), 0) / 1000; }
export function metrics(data, month, currentDay = today()) {
  const parties = data.parties.filter(p => p.event_date.startsWith(month));
  const approved = parties.filter(p => p.status === 'aprovado');
  const active = data.entries.filter(e => !e.canceled);
  const payments = data.payments.filter(p => !p.voided && p.payment_date.startsWith(month));
  const entriesById = new Map(data.entries.map(e => [e.id,e]));
  const paidByEntry = new Map();
  for (const payment of data.payments) {
    if (!payment.voided) paidByEntry.set(payment.entry_id,(paidByEntry.get(payment.entry_id) || 0)+cents(payment.amount));
  }
  const pending = e => Math.max(0,cents(e.amount)-(paidByEntry.get(e.id) || 0));
  const kind = p => entriesById.get(p.entry_id)?.kind;
  return {
    parties, approved, contracted: sumMoney(approved),
    received: sumMoney(payments.filter(p => kind(p) === 'receber')),
    spent: sumMoney(payments.filter(p => kind(p) === 'pagar')),
    receivable: active.filter(e => e.kind === 'receber').reduce((s,e) => s + pending(e),0)/100,
    payable: active.filter(e => e.kind === 'pagar').reduce((s,e) => s + pending(e),0)/100,
    future: data.parties.filter(p => p.status !== 'cancelado' && p.event_date >= currentDay).sort((a,b) => (a.event_date+a.event_time).localeCompare(b.event_date+b.event_time)),
  };
}
export function calendarDays(month) {
  const [y,m] = month.split('-').map(Number);
  return [...Array(new Date(y,m-1,1).getDay()).fill(null), ...Array.from({length:new Date(y,m,0).getDate()},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`)];
}
export function csvText(headers, rows) {
  const quote = value => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"','""') + '"';
  return '\uFEFF' + [headers,...rows].map(row => row.map(quote).join(';')).join('\r\n');
}
