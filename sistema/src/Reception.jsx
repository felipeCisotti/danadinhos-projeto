import {useLiveRefresh} from './useLiveRefresh';
import AreaLayout from './AreaLayout';
import React,{useEffect,useRef,useState} from 'react';
import {loadReceptionParties,loadReceptionParty,saveGuest,checkInGuest,saveMenu,importGuests,receptionError} from './reception-data';
import {attendance,menuFields,emptyMenu,entryTime} from './reception-domain';
import {dateLabel,statuses,today,csvText} from './domain';
import './reception.css';
import GuestImport from './GuestImport';

function GuestForm({guest,onSave,onCancel,busy}) {
  const [values,setValues]=useState({name:guest?.name??'',age:guest?.age??'',phone:guest?.phone??''});
  return <form className="reception-form" onSubmit={e=>{e.preventDefault();onSave({...values,name:values.name.trim(),phone:values.phone.trim(),age:Number(values.age)},guest?.id);}}>
    <h3>{guest?'Editar convidado':'Cadastrar convidado'}</h3>
    <div className="reception-fields"><label>Nome da pessoa / criança<input required maxLength={200} value={values.name} onChange={e=>setValues({...values,name:e.target.value})}/></label><label>Idade em anos<input type="number" min="0" max="120" step="1" required value={values.age} onChange={e=>setValues({...values,age:e.target.value})}/></label><label>Telefone de contato / responsável<input type="tel" required maxLength={40} value={values.phone} onChange={e=>setValues({...values,phone:e.target.value})}/></label></div>
    <div className="reception-actions"><button className="action" disabled={busy} type="submit">{busy?'Salvando…':'Salvar convidado'}</button><button className="secondary" type="button" disabled={busy} onClick={onCancel}>Cancelar</button></div>
  </form>;
}

export default function Reception({user,onSignOut,signingOut,authError,onBack}) {
  const [parties,setParties]=useState([]),[partyId,setPartyId]=useState('');
  const [guests,setGuests]=useState([]),[menu,setMenu]=useState(emptyMenu),[savedMenu,setSavedMenu]=useState(emptyMenu);
  const [loading,setLoading]=useState(true),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[tab,setTab]=useState('guests');
  const [search,setSearch]=useState(''),[filter,setFilter]=useState(''),[page,setPage]=useState(0),[form,setForm]=useState(null);
  const [printType,setPrintType]=useState('guests');
  const request=useRef(0),lock=useRef(false),printRef=useRef(null),dirtyRef=useRef(false),refreshing=useRef(false);
  const party=parties.find(p=>p.id===partyId),counts=attendance(guests,party?.guests??1);
  const readonly=party?.status==='cancelado';
  const dirty=menuFields.some(([key])=>menu[key]!==savedMenu[key]);
  dirtyRef.current=dirty;

  async function refresh(id=partyId,initial=false,background=false) {
    const version=++request.current;refreshing.current=true;if(!background)setLoading(true);setError('');
    try {
      const next=await loadReceptionParties();
      const selected=next.some(p=>p.id===id)?id:(next.find(p=>p.event_date===today()&&p.status==='aprovado')??next.filter(p=>p.event_date>=today()&&p.status==='aprovado').sort((a,b)=>a.event_date.localeCompare(b.event_date))[0]??next[0])?.id??'';
      const details=selected?await loadReceptionParty(selected):{guests:[],menu:null};
      if(version!==request.current)return;
      setParties(next);setPartyId(selected);setGuests(details.guests);
      if(initial||selected!==id||!dirtyRef.current){const values={...emptyMenu,...details.menu};setMenu(values);setSavedMenu(values);}
      setReady(true);
    }catch(e){if(version===request.current){setError(receptionError(e));setReady(false);}}
    finally{if(version===request.current){refreshing.current=false;setLoading(false);}}
  }
  useEffect(()=>{refresh('',true);return()=>{request.current++;};},[]);
  useLiveRefresh('recepcao',()=>refresh(partyId,false,true),()=>lock.current||refreshing.current);
  useEffect(()=>{
    if(!dirty)return;
    const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);
    return()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  async function switchParty(id){
    if(dirty&&!window.confirm('Descartar as alterações não salvas da ficha de cardápio?'))return;
    setForm(null);setSearch('');setPage(0);setNotice('');await refresh(id,true);
  }
  async function mutate(action,message){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{await action();setNotice(message);await refresh(partyId);}
    catch(e){setError(receptionError(e));}
    finally{lock.current=false;setBusy(false);}
  }
  function print(type){
    setPrintType(type);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{printRef.current?.scrollIntoView({block:'start'});window.print();}));
  }
  function exportGuests(){
    const url=URL.createObjectURL(new Blob([csvText(['Nome','Idade','Telefone','Entrada'],guests.map(g=>[g.name,g.age,g.phone,entryTime(g.checked_in_at)]))],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`convidados-${party.event_date}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const filtered=guests.filter(g=>g.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))&&(!filter||(filter==='entered'?!!g.checked_in_at:!g.checked_in_at)));
  const pages=Math.max(1,Math.ceil(filtered.length/25)),currentPage=Math.min(page,pages-1);
  const allowed=ready&&!loading&&!busy;
  const leave=callback=>()=>{if(!dirty||window.confirm('Descartar alterações não salvas?'))callback();};
  return <><AreaLayout area="recepcao" tab={tab} onTab={setTab} user={user} onBack={onBack&&leave(onBack)} onSignOut={leave(onSignOut)} onRefresh={()=>refresh(partyId)} busy={busy} loading={loading} signingOut={signingOut}>
        <section className="panel reception-panel"><div className="reception-toolbar"><label className="party-picker">Festa<select value={partyId} disabled={loading||busy} onChange={e=>switchParty(e.target.value)}><option value="">Selecione uma festa</option>{parties.map(p=><option key={p.id} value={p.id}>{dateLabel(p.event_date)} · {p.client} · {statuses[p.status]}</option>)}</select></label></div>{party&&<p>{dateLabel(party.event_date)} às {party.event_time.slice(0,5)} · {statuses[party.status]} · Limite: <strong>{party.guests} convidados</strong></p>}<small>Os dados da festa são definidos pela gestora e estão disponíveis aqui somente para consulta.</small></section>
        {(error||authError)&&<p className="reception-error" role="alert">{error||authError}</p>}{notice&&<p className="reception-notice" role="status">{notice}</p>}{loading&&<p role="status">Atualizando a recepção…</p>}
        {!loading&&!party&&<section className="panel reception-panel"><h2>Nenhuma festa disponível</h2><p>A gestora precisa cadastrar uma festa para iniciar o atendimento.</p></section>}
        {party&&ready&&<>
          <div className="reception-stats"><article className="stat-card stat-pink"><strong>{counts.registered}</strong>Cadastrados</article><article className="stat-card stat-yellow"><strong>{counts.arrived}</strong>Entradas registradas</article><article className="stat-card stat-blue"><strong>{counts.remaining}</strong>Até o limite</article></div>
          {counts.full&&<p className="reception-warning" role="alert">{counts.excess?`Limite ultrapassado em ${counts.excess} convidado(s).`:'Limite de convidados atingido.'} Avise a gestora antes de receber mais convidados.</p>}
          {readonly&&<p className="reception-warning">Festa cancelada: apenas consulta e impressão.</p>}
          {tab==='guests'&&<section className="panel reception-panel"><div className="reception-toolbar"><h2>Convidados e entradas</h2><button className="action" disabled={!allowed||readonly} onClick={()=>setForm({guest:null})}>+ Cadastrar convidado</button></div>
            {form&&<GuestForm key={form.guest?.id??'new'} guest={form.guest} busy={busy||loading} onCancel={()=>setForm(null)} onSave={(values,id)=>mutate(async()=>{await saveGuest(partyId,values,id);setForm(null);},'Convidado salvo.')}/>}
            <div className="reception-toolbar"><input aria-label="Buscar convidado" placeholder="Buscar pelo nome…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/><select aria-label="Filtrar entradas" value={filter} onChange={e=>{setFilter(e.target.value);setPage(0);}}><option value="">Todos os convidados</option><option value="entered">Já entraram</option><option value="waiting">Aguardando entrada</option></select></div>
            <div className="reception-table"><table><thead><tr>{['Nome','Idade','Telefone','Entrada','Ações'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{filtered.slice(currentPage*25,currentPage*25+25).map(g=><tr key={g.id}><td>{g.name}</td><td>{g.age}</td><td>{g.phone}</td><td>{entryTime(g.checked_in_at)}</td><td><div className="reception-actions"><button className="secondary" disabled={!allowed||readonly} onClick={()=>setForm({guest:g})}>Editar</button><button className="action" disabled={!allowed||party.status!=='aprovado'||!!g.checked_in_at} onClick={()=>{if(counts.full&&!window.confirm('O limite foi atingido. Registrar mais esta entrada e avisar a gestora?'))return;mutate(()=>checkInGuest(partyId,g.id),'Entrada registrada.');}}>{g.checked_in_at?'Já entrou':'Registrar entrada'}</button></div></td></tr>)}</tbody></table></div>{!filtered.length&&<p>Nenhum convidado encontrado.</p>}
            <div className="reception-pagination"><button className="secondary" disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Anterior</button><span>{filtered.length} convidados · Página {currentPage+1} de {pages}</span><button className="secondary" disabled={currentPage+1>=pages} onClick={()=>setPage(currentPage+1)}>Próxima</button></div><small>A entrada é registrada uma única vez. Não há registro de saída. A lista é atualizada em tempo real.</small>
          </section>}
          {tab==='import'&&<GuestImport key={partyId} party={party} existing={guests} busy={busy} disabled={!allowed||readonly} onImport={async rows=>{
            if(lock.current)throw new Error('Operação em andamento');
            lock.current=true;setBusy(true);setError('');
            try{await importGuests(partyId,rows);setNotice('Importação concluída. Os convidados estão aguardando entrada.');await refresh(partyId);}
            finally{lock.current=false;setBusy(false);}
          }}/>}
          {tab==='documents'&&<section className="panel reception-panel"><h2>Lista de convidados</h2><p>A lista inclui todos os convidados desta festa, com nome, idade, telefone e registro de entrada, independentemente dos filtros.</p><div className="reception-actions"><button className="action" disabled={!allowed} onClick={()=>print('guests')}>Imprimir / salvar PDF</button><button className="secondary" disabled={!allowed} onClick={exportGuests}>Baixar CSV</button></div></section>}
          {tab==='menu'&&<section className="panel reception-panel"><h2>Escolhas de cardápio do cliente</h2><p>Preencha com o cliente ou imprima a ficha em branco. A ficha salva pode ser impressa para uso na cozinha.</p>{party.menu&&<p className="reception-reference"><strong>Referência cadastrada pela gestora</strong><br/>{party.menu}</p>}<form onSubmit={e=>{e.preventDefault();mutate(async()=>{const values=Object.fromEntries(menuFields.map(([key])=>[key,menu[key].trim()]));const saved=await saveMenu(partyId,values);setMenu(saved);setSavedMenu(saved);},'Ficha de cardápio salva.');}}><div className="reception-menu-fields">{menuFields.map(([key,label])=><label key={key}>{label}<textarea rows={3} maxLength={4000} disabled={readonly||busy} value={menu[key]} onChange={e=>setMenu({...menu,[key]:e.target.value})}/></label>)}</div><div className="reception-actions"><button className="action" disabled={!allowed||readonly} type="submit">Salvar ficha</button><button className="secondary" disabled={!allowed||dirty} type="button" onClick={()=>print('menu')}>Imprimir ficha salva / cozinha</button><button className="secondary" disabled={!allowed} type="button" onClick={()=>print('blank')}>Imprimir ficha em branco</button></div>{dirty&&<p role="status">Há alterações não salvas. Salve antes de imprimir a ficha preenchida.</p>}</form></section>}
        </>}
    </AreaLayout>
    {party&&<section className="reception-print" ref={printRef}><h1>Danadinhos · {printType==='guests'?'Lista de convidados':'Ficha de escolha de cardápio'}</h1><p><strong>Cliente:</strong> {party.client}<br/><strong>Festa:</strong> {dateLabel(party.event_date)} às {party.event_time.slice(0,5)}<br/><strong>Limite contratado:</strong> {party.guests} convidados</p>
      {printType==='guests'?<><p>Cadastrados: {counts.registered} · Entradas: {counts.arrived}</p><table><thead><tr><th>Nome</th><th>Idade</th><th>Telefone</th><th>Entrada</th></tr></thead><tbody>{guests.map(g=><tr key={g.id}><td>{g.name}</td><td>{g.age}</td><td>{g.phone}</td><td>{entryTime(g.checked_in_at)}</td></tr>)}</tbody></table></>:<>{party.menu&&<p className="print-text"><strong>Referência da festa:</strong> {party.menu}</p>}{menuFields.map(([key,label])=><div className="print-field" key={key}><h2>{label}</h2><p>{printType==='blank'?'':savedMenu[key]}</p></div>)}<p className="print-signature">Confirmação do cliente: __________________________________ Data: ____/____/______</p></>}
    </section>}
  </>;
}
