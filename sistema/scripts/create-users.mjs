import { createClient } from '@supabase/supabase-js';

const env = process.env;
if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
  throw new Error('Preencha SUPABASE_URL e SUPABASE_SECRET_KEY no arquivo local .env.admin.');
}
const accounts = ['gestora', 'cozinha', 'recepcao'].map(role => ({
  role,
  email: env[`${role.toUpperCase()}_EMAIL`]?.trim(),
  password: env[`${role.toUpperCase()}_PASSWORD`],
}));
for (const { role, email, password } of accounts) {
  if (!email || !password || password.length < 12) throw new Error(`Preencha o e-mail e uma senha de pelo menos 12 caracteres para ${role}.`);
}
if (new Set(accounts.map(a => a.email.toLowerCase())).size !== 3) throw new Error('Use três e-mails diferentes.');
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
for (const { role, email, password } of accounts) {
  const { error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true, app_metadata: { role },
  });
  if (error) {
    console.error(`Não foi possível criar o acesso ${role}: ${error.code ?? 'erro de cadastro'}. Contas existentes não são alteradas.`);
    process.exitCode = 1;
  } else console.log(`Acesso ${role} criado.`);
}
