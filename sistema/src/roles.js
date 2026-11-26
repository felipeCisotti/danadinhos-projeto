export const roles = Object.freeze({
  gestora: { label: 'Gestora', message: 'Você está na conta da gestora', symbol: '✦' },
  cozinha: { label: 'Cozinha', message: 'Você está na conta da cozinha', symbol: '♨' },
  recepcao: { label: 'Recepção', message: 'Você está na conta da recepção', symbol: '☀' },
});

// app_metadata só pode ser alterado por um administrador no Supabase.
export function getRole(user) {
  const role = user?.app_metadata?.role;
  return Object.hasOwn(roles, role) ? roles[role] : null;
}
