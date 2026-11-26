import test from 'node:test';
import assert from 'node:assert/strict';
import { balanceFor, paidFor, stockBalance, metrics, calendarDays, csvText } from '../src/domain.js';
test('pagamentos parciais e estornos calculam saldo sem erro de centavos',()=>{
 const entry={id:'a',amount:100.30};
 const payments=[{entry_id:'a',amount:30.10},{entry_id:'a',amount:20.20},{entry_id:'a',amount:50,voided:true},{entry_id:'b',amount:20}];
 assert.equal(paidFor(entry,payments),50.30);assert.equal(balanceFor(entry,payments),50);
});
test('relatórios separam data de festa e data de caixa, cancelamentos e estornos',()=>{
 const data={parties:[{id:'p',event_date:'2026-11-20',event_time:'18:00',status:'aprovado',amount:500},{event_date:'2026-11-30',status:'cancelado',amount:900}],entries:[{id:'a',kind:'receber',amount:500},{id:'b',kind:'pagar',amount:100},{id:'c',kind:'receber',amount:900,canceled:true}],payments:[{entry_id:'a',amount:200,payment_date:'2026-10-10'},{entry_id:'b',amount:25,payment_date:'2026-11-01'},{entry_id:'a',amount:100,payment_date:'2026-11-02',voided:true}]};
 const r=metrics(data,'2026-11','2026-11-12');assert.equal(r.contracted,500);assert.equal(r.received,0);assert.equal(r.spent,25);assert.equal(r.receivable,300);assert.equal(r.payable,75);assert.equal(r.future.length,1);
});
test('estoque soma entradas e saídas com três casas decimais',()=>assert.equal(stockBalance({id:'x'},[{item_id:'x',quantity:.3},{item_id:'x',quantity:-.1}]),.2));
test('calendário lida com ano bissexto e início no domingo',()=>{assert.equal(calendarDays('2024-02').filter(Boolean).length,29);assert.equal(calendarDays('2026-11')[0],'2026-11-01');});
test('CSV escapa aspas e neutraliza fórmulas',()=>{const csv=csvText(['Nome'],[['=1+1'],['A"B']]);assert.ok(csv.includes("'="));assert.ok(csv.includes('A""B'));});
