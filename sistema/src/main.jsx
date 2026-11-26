import React, { Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './supabase';
import { getRole } from './roles';
import AppBoundary from './AppBoundary';
import './styles.css';
const Manager = lazy(() => import('./Manager'));
const Reception = lazy(() => import('./Reception'));
const Kitchen = lazy(() => import('./Kitchen'));

function App() {
  const [user, setUser] = useState(null);
  const [reception,setReception]=useState(false);
  const [kitchen,setKitchen]=useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let revision = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      revision++;
      if (active) { setUser(session?.user ?? null); setLoading(false); }
    });
    const initialRevision = revision;
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active || revision !== initialRevision) return;
      setUser(authError ? null : data.user);
      setLoading(false);
    }).catch(() => {
      if (active && revision === initialRevision) { setError('Não foi possível verificar sua sessão. Tente novamente.'); setLoading(false); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function signIn(event) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError(authError.code === 'invalid_credentials' ? 'E-mail ou senha incorretos. Confira os dados e tente novamente.' : authError.code === 'email_not_confirmed' ? 'Confirme seu e-mail antes de entrar.' : 'Não foi possível entrar. Verifique sua conexão e tente novamente.');
      } else { setPassword(''); }
    } catch { setError('Não foi possível conectar. Tente novamente em instantes.'); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true); setError('');
    try {
      const { error: authError } = await supabase.auth.signOut({ scope: 'local' });
      if (authError) throw authError;
      setUser(null); setPassword('');setReception(false);setKitchen(false);
    } catch { setError('Não foi possível sair. Tente novamente.'); }
    finally { setBusy(false); }
  }

  const role = getRole(user);
  if (!loading && (user?.app_metadata?.role === 'cozinha' || (user?.app_metadata?.role === 'gestora' && kitchen))) return <Suspense fallback={<div role="status">Carregando cozinha…</div>}><Kitchen user={user} onSignOut={signOut} signingOut={busy} authError={error} onBack={user.app_metadata.role==='gestora'?()=>setKitchen(false):undefined}/></Suspense>;
  if (!loading && (user?.app_metadata?.role === 'recepcao' || (user?.app_metadata?.role === 'gestora' && reception))) return <Suspense fallback={<div role="status">Carregando recepção…</div>}><Reception user={user} onSignOut={signOut} signingOut={busy} authError={error} onBack={user.app_metadata.role==='gestora'?()=>setReception(false):undefined}/></Suspense>;
  if (!loading && user?.app_metadata?.role === 'gestora') return <Suspense fallback={<div className="card" role="status">Carregando seu espaço…</div>}><Manager onKitchen={()=>setKitchen(true)} onReception={()=>setReception(true)} user={user} onSignOut={signOut} signingOut={busy} authError={error}/></Suspense>;
  return <div className="app">
    <header><a className="brand" href="/admin/" aria-label="Danadinhos — início"><span className="brand-icon">d<span>✦</span></span><span>danadinhos<small>SISTEMA DA EQUIPE</small></span></a><span className="header-note"><i/> Ambiente da equipe</span></header>
    <main>
      <section className="welcome"><span className="eyebrow">BEM-VINDOS AO DANADINHOS</span><h1>Cada pessoa.<br/>Seu espaço.<br/><span>Uma só equipe.</span></h1><p>Um lugar para conectar quem cuida de cada detalhe do nosso dia.</p><div className="team-illustration" aria-hidden="true"><div className="orbit"/><div className="figure figure-one">✦</div><div className="figure figure-two">♨</div><div className="figure figure-three">☀</div><span className="spark spark-one">✳</span><span className="spark spark-two">✦</span></div><div className="team-labels"><span>Gestora</span><span>Cozinha</span><span>Recepção</span></div></section>
      <section className="access" aria-label="Acesso ao sistema">
        {loading ? <div className="card" role="status"><span className="eyebrow">SÓ UM INSTANTE</span><h2>Preparando seu espaço…</h2></div> : user ? <div className="card account"><div className="section-icon">{role?.symbol ?? '!'}</div><span className="eyebrow">{role ? 'ACESSO REALIZADO' : 'ACESSO PENDENTE'}</span><h2>{role?.message ?? 'Sua conta ainda não tem um perfil'}</h2><p>{role ? 'Que bom ter você por aqui.' : 'Peça à responsável pelo sistema para vincular seu acesso à gestora, cozinha ou recepção.'}</p><div className="identity"><span className="avatar">{role?.label.charAt(0) ?? '?'}</span><div><strong>{role?.label ?? 'Sem perfil'}</strong><span>{user.email}</span></div></div>{error && <p className="alert" role="alert">{error}</p>}<button className="primary" onClick={signOut} disabled={busy}>{busy ? 'Saindo…' : 'Sair da conta'}<span aria-hidden="true">↗</span></button></div> : <div className="card"><div className="section-icon">↗</div><span className="eyebrow">SEU ESPAÇO DE TRABALHO</span><h2>Vamos começar?</h2><p>Entre com seu e-mail e senha para acessar sua conta.</p><form onSubmit={signIn}><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="username" placeholder="seu@email.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy}/><label htmlFor="password">Senha</label><div className="password-field"><input id="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" required value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/><button type="button" className="reveal" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Mostrar'}</button></div>{error && <p className="alert" role="alert">{error}</p>}{!supabase && <p className="alert config" role="status">A conexão com o Supabase ainda está sendo configurada. O login ficará disponível assim que ela for concluída.</p>}<button className="primary" disabled={busy || !supabase} type="submit">{busy ? 'Entrando…' : 'Entrar na minha conta'}<span aria-hidden="true">→</span></button></form><div className="help">Precisa de acesso?<br/><strong>Fale com a responsável pelo sistema.</strong></div></div>}
        <p className="access-note"><span aria-hidden="true">◇</span> Seu acesso é exclusivo para o seu perfil.</p>
      </section>
    </main><footer><span>Danadinhos · Feito para a nossa equipe</span><span>Com cuidado, em cada detalhe.</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><AppBoundary><App/></AppBoundary></React.StrictMode>);

