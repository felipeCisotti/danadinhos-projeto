export const MAX_CSV_BYTES=2*1024*1024;
export const MAX_CSV_GUESTS=1000;
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();

function readRows(text,delimiter){
  const rows=[];let cells=[],value='',quoted=false,closed=false,line=1,start=1;
  const cell=()=>{cells.push(value);value='';closed=false;};
  const row=()=>{cell();if(cells.some(v=>v.trim()))rows.push({cells,line:start});cells=[];start=line+1;};
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(quoted){
      if(char==='"'){if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}
      else{value+=char;if(char==='\n')line++;}
    }else if(char==='"'&&!value&&!closed)quoted=true;
    else if(char===delimiter)cell();
    else if(char==='\n'||char==='\r'){
      if(char==='\r'&&text[i+1]==='\n')i++;
      row();line++;
    }else if(closed){if(!/\s/.test(char))throw new Error(`Linha ${line}: conteúdo inesperado após as aspas.`);}
    else if(char==='"')throw new Error(`Linha ${line}: aspas inválidas. Coloque o campo inteiro entre aspas.`);
    else value+=char;
  }
  if(quoted)throw new Error(`Linha ${start}: campo com aspas não fechadas.`);
  row();return rows;
}

export function parseGuestCsv(source){
  const text=source.replace(/^\uFEFF/,'');
  if(!text.trim())throw new Error('O arquivo está vazio.');
  const aliases={nome:'name',name:'name',idade:'age',age:'age',telefone:'phone',phone:'phone',celular:'phone'};
  let parsed;
  // Recognize the header, rather than counting separators inside quoted cells.
  for(const separator of [';',',','\t']){
    try{const candidate=readRows(text,separator);const headers=candidate[0]?.cells.map(v=>aliases[normalize(v)]);
      if(['name','age','phone'].every(key=>headers?.includes(key))){parsed={rows:candidate,headers};break;}
    }catch(e){if(separator===';'&&text.split(/\r?\n/,1)[0].includes(';'))throw e;if(separator===','&&text.split(/\r?\n/,1)[0].includes(','))throw e;}
  }
  if(!parsed)throw new Error('Cabeçalho obrigatório: Nome, Idade e Telefone. Use vírgula, ponto e vírgula ou tabulação como separador.');
  const {rows,headers}=parsed;
  if(['name','age','phone'].some(key=>headers.filter(h=>h===key).length!==1))throw new Error('As colunas Nome, Idade e Telefone devem aparecer uma única vez.');
  if(rows.length===1)throw new Error('O arquivo contém apenas o cabeçalho. Adicione os convidados.');
  if(rows.length-1>MAX_CSV_GUESTS)throw new Error(`Importe no máximo ${MAX_CSV_GUESTS} convidados por arquivo.`);
  const errors=[],guests=[];
  for(const row of rows.slice(1)){
    const get=key=>(row.cells[headers.indexOf(key)]??'').trim();
    const name=get('name'),rawAge=get('age'),phone=get('phone');
    const issues=[];
    if(row.cells.length!==headers.length)issues.push('quantidade de colunas diferente do cabeçalho');
    if(!name||name.length>200)issues.push('nome obrigatório, com até 200 caracteres');
    if(!/^\d{1,3}$/.test(rawAge)||Number(rawAge)>120)issues.push('idade inteira de 0 a 120 anos');
    if(!phone||phone.length>40)issues.push('telefone obrigatório, com até 40 caracteres');
    if(issues.length)errors.push({line:row.line,message:issues.join('; ')});
    else guests.push({name,age:Number(rawAge),phone,line:row.line});
  }
  return {guests,errors,total:rows.length-1};
}

export const guestKey=g=>JSON.stringify([normalize(g.name).replace(/\s+/g,' '),Number(g.age),g.phone.replace(/[^\d]/g,'')||normalize(g.phone)]);
export function planGuestImport(rows,existing,skipDuplicates=true){
  const seen=new Set(existing.map(guestKey)),guests=[],duplicates=[];
  for(const row of rows){const key=guestKey(row);if(skipDuplicates&&seen.has(key))duplicates.push(row);else{guests.push(row);seen.add(key);}}
  return {guests,duplicates};
}
