import test from 'node:test';
import assert from 'node:assert/strict';
import {attendance,entryTime,emptyMenu,menuFields} from '../src/reception-domain.js';
test('limite considera entradas, não quantidade de cadastrados',()=>{
  assert.deepEqual(attendance([{checked_in_at:'2026-11-12T18:00:00Z'},{checked_in_at:null},{checked_in_at:null}],2),{registered:3,arrived:1,remaining:1,full:false,excess:0});
});
test('aviso aparece no limite e informa excedentes sem saldo negativo',()=>{
  assert.equal(attendance([{checked_in_at:'now'}],1).full,true);
  const result=attendance([{checked_in_at:'now'},{checked_in_at:'now'}],1);
  assert.equal(result.excess,1);assert.equal(result.remaining,0);
});
test('ficha em branco contém todos os campos e entrada usa horário brasileiro',()=>{
  assert.equal(menuFields.length,6);
  assert.ok(Object.values(emptyMenu).every(v=>v===''));
  assert.match(entryTime('2026-11-12T18:00:00Z'),/15:00/);
  assert.equal(entryTime(null),'Não entrou');
});
