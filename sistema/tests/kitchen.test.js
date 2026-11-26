import test from 'node:test';
import assert from 'node:assert/strict';
import {taskSummary,stockState,chooseKitchenParty} from '../src/kitchen-domain.js';
test('checklist conta pendentes e concluídas sem misturar festas',()=>{
 assert.deepEqual(taskSummary([{done:false},{done:true}]),{total:2,done:1,pending:1});
 assert.deepEqual(taskSummary([]),{total:0,done:0,pending:0});
});
test('estoque distingue mínimo, disponível e inativo com saldo',()=>{
 assert.equal(stockState({active:true,balance:'2.5',minimum:'2.5'}),'Estoque baixo');
 assert.equal(stockState({active:true,balance:'3',minimum:'2.5'}),'Disponível');
 assert.equal(stockState({active:false,balance:10,minimum:0}),'Inativo');
});
test('cozinha mantém seleção e prioriza próxima festa aprovada',()=>{
 const parties=[{id:'old',event_date:'2026-11-01',status:'aprovado'},{id:'quote',event_date:'2026-11-19',status:'orcamento'},{id:'next',event_date:'2026-11-20',status:'aprovado'}];
 assert.equal(chooseKitchenParty(parties,'','2026-11-19'),'next');
 assert.equal(chooseKitchenParty(parties,'old','2026-11-19'),'old');
 assert.equal(chooseKitchenParty([],'','2026-11-19'),'');
});
