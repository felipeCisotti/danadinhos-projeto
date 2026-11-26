import test from 'node:test';
import assert from 'node:assert/strict';
import { getRole } from '../src/roles.js';

test('cada perfil recebe a mensagem correspondente', () => {
  for (const [role, name] of [['gestora', 'gestora'], ['cozinha', 'cozinha'], ['recepcao', 'recepção']]) {
    assert.equal(getRole({ app_metadata: { role } }).message, `Você está na conta da ${name}`);
  }
});
test('dados editáveis pelo usuário não concedem perfil', () => {
  assert.equal(getRole({ user_metadata: { role: 'gestora' } }), null);
  assert.equal(getRole({ app_metadata: { role: 'cozinha' }, user_metadata: { role: 'gestora' } }).label, 'Cozinha');
});
test('sem sessão ou perfil desconhecido não libera uma área', () => {
  for (const user of [null, {}, { app_metadata: { role: 'admin' } }, { app_metadata: { role: '__proto__' } }, { app_metadata: { role: 'constructor' } }]) {
    assert.equal(getRole(user), null);
  }
});
