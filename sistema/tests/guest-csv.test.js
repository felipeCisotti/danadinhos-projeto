import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGuestCsv,planGuestImport} from '../src/guest-csv.js';
test('CSV brasileiro aceita BOM, CRLF, coluna extra e mantém telefone como texto',()=>{
 const result=parseGuestCsv('\uFEFFNome;Idade;Telefone;Entrada\r\nJoão;0;0011999999999;Já entrou\r\n');
 assert.deepEqual(result.guests,[{name:'João',age:0,phone:'0011999999999',line:2}]);assert.equal(result.errors.length,0);
});
test('CSV aceita campos com separadores, aspas escapadas e quebra de linha',()=>{
 const result=parseGuestCsv('Telefone,Nome,Idade\n"(11) 90000-0000","Ana, ""Bia""\nSilva",8');
 assert.equal(result.guests[0].name,'Ana, "Bia"\nSilva');assert.equal(result.guests[0].age,8);
});
test('idade vazia/fracionada/negativa, telefone ausente e colunas inconsistentes geram erros',()=>{
 const result=parseGuestCsv('Nome;Idade;Telefone\nAna;;123\nBia;1.5;123\nCaio;-1;123\nDuda;121;123\nEva;8;\nFê;2;123;extra\nGil;3;123');
 assert.deepEqual(result.errors.map(e=>e.line),[2,3,4,5,6,7]);assert.equal(result.guests.length,1);
});
test('rejeita arquivo vazio, cabeçalho ambíguo, aspas abertas e excesso de linhas',()=>{
 for(const content of ['', 'Nome;Idade;Telefone', 'Nome;Idade;Telefone;Nome\nAna;2;123;Ana', 'Nome;Idade;Telefone\n"Ana;2;123'])assert.throws(()=>parseGuestCsv(content));
 assert.throws(()=>parseGuestCsv('Nome;Idade;Telefone\n'+Array(1001).fill('Ana;2;123').join('\n')),/1?000/);
});
test('duplicados normalizam acentos e telefone e preservam homônimos com dados diferentes',()=>{
 const rows=parseGuestCsv('Nome;Idade;Telefone\nJOÃO;8;(11) 9999\nJoão;8;119999\nJoão;9;119999').guests;
 assert.equal(planGuestImport(rows,[]).guests.length,2);
 assert.equal(planGuestImport(rows,[{name:'joao',age:8,phone:'119999'}]).guests.length,1);
 assert.equal(planGuestImport(rows,[],false).guests.length,3);
});
test('tabulação e cabeçalhos em ordem diferente são aceitos',()=>{
 const result=parseGuestCsv('Celular\tIDADE\tNome\n0123\t12\tAna\n\n');
 assert.equal(result.guests[0].phone,'0123');assert.equal(result.total,1);
});
