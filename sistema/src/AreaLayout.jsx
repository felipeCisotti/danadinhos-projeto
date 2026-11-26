import React from 'react';
import {dateLabel,today} from './domain';
import './manager.css';

const areas = {
  recepcao: {name:'Recepção', profile:'Recepcionista', modules:[['guests','Convidados e entradas','☀','Cadastre os convidados e acompanhe quem já chegou.'],['import','Importar CSV','⇧','Importe a lista de convidados da festa.'],['documents','Lista de convidados','☷','Consulte, imprima ou baixe a lista da festa.'],['menu','Ficha de cardápio','▤','Registre as escolhas do cliente para a cozinha.']]},
  cozinha: {name:'Cozinha', profile:'Cozinha', modules:[['party','Festas e cardápios','♨','Consulte o cardápio e as quantidades de cada festa.'],['tasks','Checklist de tarefas','✓','Organize o preparo e acompanhe os responsáveis.'],['stock','Estoque completo','▦','Consulte os saldos de alimentos, bebidas e materiais.']]}
};

export default function AreaLayout({area,tab,onTab,user,onBack,onSignOut,onRefresh,busy,loading,signingOut,children}) {
  const {name,profile,modules}=areas[area];
  const [,title,,description]=modules.find(([key])=>key===tab);
  const account=onBack?'Gestora':profile;
  return <div className="manager reception-screen">
    <aside className="sidebar"><div className="manager-brand"><img className="sidebar-logo" src="/admin/logo-danadinhos.png" alt="Danadinhos"/></div>
      <p className="sidebar-label">Menu</p><nav aria-label={`Módulos da ${name.toLowerCase()}`}>
        {modules.map(([key,label,icon])=><button key={key} disabled={busy} className={key===tab?'selected':''} aria-current={key===tab?'page':undefined} onClick={()=>onTab(key)}><span aria-hidden="true">{icon}</span>{label}</button>)}
        {onBack&&<button disabled={busy} onClick={onBack}><span aria-hidden="true">←</span>Voltar à gestão</button>}
      </nav><div className="sidebar-bottom"><div className="profile-dot">{account[0]}</div><div><strong>{account}</strong><small>{user.email}</small></div><button title="Sair da conta" aria-label="Sair da conta" disabled={busy||signingOut} onClick={onSignOut}>↪</button></div>
      <div className="sidebar-blobs"><img src="/admin/sidebar-blobs.png" alt=""/></div></aside>
    <div className="workspace"><header className="workspace-header"><span>Danadinhos <span className="slash">/</span> {title}</span><span className="workspace-date">{dateLabel(today())} <i/> {name}</span></header>
      <main className="workspace-main"><div className="page-heading"><div><span className="eyebrow">{`SISTEMA DE ${name.toUpperCase()}`}</span><h1>{title}</h1><p>{description}</p></div><div className="heading-actions"><button className="secondary" disabled={busy||loading} onClick={onRefresh}>↻ Atualizar</button></div></div><div className={'reception '+area}>{children}</div></main></div>
  </div>;
}


