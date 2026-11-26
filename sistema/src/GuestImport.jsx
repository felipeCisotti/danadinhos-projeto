import React,{useMemo,useRef,useState} from 'react';
import {parseGuestCsv,planGuestImport,MAX_CSV_BYTES} from './guest-csv';
import {csvText,dateLabel} from './domain';
import {receptionError} from './reception-data';

export default function GuestImport({party,existing,busy,disabled,onImport}){
  const [preview,setPreview]=useState(null),[error,setError]=useState(''),[reading,setReading]=useState(false),[skip,setSkip]=useState(true),[filename,setFilename]=useState('');
  const version=useRef(0),sending=useRef(false);
  const plan=useMemo(()=>planGuestImport(preview?.guests??[],existing,skip),[preview,existing,skip]);
  async function choose(event){
    const file=event.target.files[0],revision=++version.current;event.target.value='';setPreview(null);setError('');setFilename(file?.name??'');
    if(!file)return;
    if(file.size>MAX_CSV_BYTES){setError('O arquivo deve ter no máximo 2 MB.');return;}
    setReading(true);
    try{
      const bytes=await file.arrayBuffer();let text;
      try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('windows-1252').decode(bytes);}
      const parsed=parseGuestCsv(text);
      if(version.current===revision)setPreview({...parsed,guests:parsed.guests.map(g=>({...g,id:crypto.randomUUID()}))});
    }catch(e){if(version.current===revision)setError(e.message||'Não foi possível ler o arquivo.');}
    finally{if(version.current===revision)setReading(false);}
  }
  function template(){
    const url=URL.createObjectURL(new Blob([csvText(['Nome','Idade','Telefone'],[['Maria Exemplo',8,'(11) 90000-0000']])],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='modelo-convidados.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function submit(){
    if(sending.current||disabled||reading||busy||!plan.guests.length||preview?.errors.length)return;
    sending.current=true;setError('');
    try{await onImport(plan.guests);setPreview(null);setFilename('');}
    catch(e){setError(receptionError(e)+' Se a conexão caiu após o envio, tente novamente com esta mesma prévia para evitar duplicação.');}
    finally{sending.current=false;}
  }
  return <section className="panel reception-panel"><h2>Importar convidados por CSV</h2>
    <p>Destino: <strong>{party.client}</strong> · {dateLabel(party.event_date)}. Os convidados serão cadastrados sem registrar entrada.</p>
    <p>Use as colunas <strong>Nome, Idade e Telefone</strong>, em qualquer ordem. Aceita CSV com vírgula, ponto e vírgula ou tabulação, até 1.000 convidados e 2 MB. Colunas adicionais, como Entrada, serão ignoradas.</p>
    <div className="reception-actions"><button className="secondary" onClick={template}>Baixar modelo CSV</button><label>Selecionar arquivo CSV<input type="file" accept=".csv,text/csv" disabled={busy||reading||disabled} onChange={choose}/></label></div>
    {reading&&<p role="status">Lendo arquivo…</p>}{error&&<p className="reception-error" role="alert">{error}</p>}
    {preview&&<><h3>{filename}</h3><p>{preview.total} linhas · {plan.guests.length} convidados para importar · {plan.duplicates.length} duplicados ignorados · {preview.errors.length} linhas com erro.</p>
      <label className="csv-checkbox"><input type="checkbox" checked={skip} disabled={busy} onChange={e=>setSkip(e.target.checked)}/>Ignorar repetidos com mesmo nome, idade e telefone, no arquivo ou já cadastrados nesta festa.</label>
      {preview.errors.length>0&&<div className="reception-error" role="alert"><strong>Corrija o arquivo e selecione novamente. Nenhum convidado será salvo enquanto houver erros.</strong><ul>{preview.errors.slice(0,20).map(e=><li key={e.line}>Linha {e.line}: {e.message}</li>)}</ul>{preview.errors.length>20&&<p>Mostrando os primeiros 20 erros.</p>}</div>}
      {existing.length+plan.guests.length>party.guests&&<p className="reception-warning">Após importar, haverá mais convidados cadastrados que o limite de {party.guests}. O controle de entrada continua separado.</p>}
      <div className="reception-table"><table><caption>Prévia dos primeiros 20 convidados a importar</caption><thead><tr><th>Linha</th><th>Nome</th><th>Idade</th><th>Telefone</th></tr></thead><tbody>{plan.guests.slice(0,20).map(g=><tr key={g.id}><td>{g.line}</td><td>{g.name}</td><td>{g.age}</td><td>{g.phone}</td></tr>)}</tbody></table></div>
      {!plan.guests.length&&!preview.errors.length&&<p role="status">Todos os convidados já constam na lista ou estão repetidos no arquivo.</p>}
      <div className="reception-actions"><button className="action" disabled={busy||disabled||reading||!!preview.errors.length||!plan.guests.length} onClick={submit}>{busy?'Importando…':`Confirmar importação de ${plan.guests.length} convidados`}</button><button className="secondary" disabled={busy} onClick={()=>{setPreview(null);setError('');}}>Descartar prévia</button></div>
    </>}
  </section>;
}
