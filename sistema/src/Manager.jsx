import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { emptyData, loadData, saveRecord, deleteRecord, errorMessage } from './manager-data';
import { statuses, money, dateLabel, today, sumMoney, paidFor, balanceFor, stockBalance, metrics, calendarDays, csvText } from './domain';
import './manager.css';

const sections = [['overview', 'Dashboard', '🏠'], ['parties', 'Eventos', '🎉'], ['calendar', 'Calendário', '📅'], ['stock', 'Estoque', '📦'], ['finance', 'Financeiro', '💰'], ['employees', 'Funcionários', '👥'], ['reports', 'Relatórios', '📊']];

function Toast({ message, onClose }) {
  const DURATION = 5000;
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    startRef.current = performance.now();
    function tick(now) {
      const elapsed = now - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct > 0) rafRef.current = requestAnimationFrame(tick);
      else { setVisible(false); setTimeout(onClose, 350); }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onClose]);

  function dismiss() { setVisible(false); setTimeout(onClose, 350); }

  return (
    <div className={`toast ${visible ? 'toast-in' : 'toast-out'}`} role="status" aria-live="polite">
      <div className="toast-icon">🎉</div>
      <div className="toast-body">
        <span className="toast-title">Tudo certo!</span>
        <span className="toast-msg">{message}</span>
      </div>
      <button className="toast-close" onClick={dismiss} aria-label="Fechar">×</button>
      <div className="toast-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
function MonthPicker({ month, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [yStr, mStr] = month.split('-');
  const year = Number(yStr);
  const monthIdx = Number(mStr) - 1;

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const fullMonths = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function selectMonth(idx) {
    const formatted = `${year}-${String(idx + 1).padStart(2, '0')}`;
    onChange(formatted);
    setOpen(false);
  }

  function changeYear(delta) {
    const nextYear = year + delta;
    const formatted = `${nextYear}-${String(monthIdx + 1).padStart(2, '0')}`;
    onChange(formatted);
  }

  return (
    <div className="month-picker-container" ref={ref}>
      <button
        type="button"
        className="month-picker-btn"
        onClick={() => setOpen(!open)}
        aria-label="Selecionar mês de referência"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{fullMonths[monthIdx]} de {year}</span>
        <span className="month-picker-chevron">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="month-picker-dropdown">
          <div className="month-picker-header">
            <button type="button" className="icon-btn-minimal" onClick={() => changeYear(-1)}>‹</button>
            <strong>{year}</strong>
            <button type="button" className="icon-btn-minimal" onClick={() => changeYear(1)}>›</button>
          </div>
          <div className="month-picker-grid">
            {months.map((m, idx) => (
              <button
                key={m}
                type="button"
                className={`month-cell ${idx === monthIdx ? 'active' : ''}`}
                onClick={() => selectMonth(idx)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const statusOptions = Object.entries(statuses);
const option = (id, label) => [id, label];
const field = (name, label, type = 'text', extra = {}) => ({ name, label, type, ...extra });
const select = (name, label, options, extra = {}) => field(name, label, 'select', { options, ...extra });
const currency = (name, label, extra = {}) => field(name, label, 'number', { min: 0, step: '.01', ...extra });

function Table({ headers, rows, empty = 'Nenhum registro por aqui ainda.' }) {
  const [page, setPage] = useState(0);
  const count = Math.max(1, Math.ceil(rows.length / 25));
  const current = Math.min(page, count - 1);
  const firstKey = rows[0]?.key;
  useEffect(() => setPage(0), [firstKey, rows.length]);
  return rows.length ? <div className="table-scroll"><table><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.slice(current * 25, current * 25 + 25).map((row, i) => <tr key={row.key ?? i}>{row.cells.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table>{count > 1 && <nav className="pagination" aria-label="Paginação da tabela"><button className="secondary" disabled={current === 0} onClick={() => setPage(current - 1)}>Anterior</button><span>Página {current + 1} de {count} · {rows.length} registros</span><button className="secondary" disabled={current === count - 1} onClick={() => setPage(current + 1)}>Próxima</button></nav>}</div> : <div className="empty"><span>◇</span><h3>{empty}</h3><p>Os registros aparecerão aqui assim que forem cadastrados.</p></div>;
}
function Badge({ status }) { return <span className={`badge ${status}`}>{statuses[status] ?? status}</span>; }
const cardIconThemes = [
  {
    theme: 'pink',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <circle cx="8" cy="14" r="1" fill="currentColor" />
        <circle cx="12" cy="14" r="1" fill="currentColor" />
        <circle cx="16" cy="14" r="1" fill="currentColor" />
        <circle cx="8" cy="18" r="1" fill="currentColor" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
        <circle cx="16" cy="18" r="1" fill="currentColor" />
      </svg>
    )
  },
  {
    theme: 'yellow',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    theme: 'blue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )
  },
  {
    theme: 'green',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  }
];

function Stats({ items }) {
  return (
    <div className="stats">
      {items.map(([label, value, note], i) => {
        const itemTheme = cardIconThemes[i % cardIconThemes.length];
        return (
          <article key={label} className={`stat-card stat-${itemTheme.theme}`}>
            <div className="stat-header">
              <span className="stat-icon-wrapper">{itemTheme.icon}</span>
            </div>
            <strong>{value}</strong>
            <span className="stat-label">{label}</span>
            {note && <small>{note}</small>}
          </article>
        );
      })}
    </div>
  );
}
function Dialog({ title, children, onClose, busy = false }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="manager-dialog" aria-labelledby="dialog-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}><div className="dialog-heading"><div><span className="eyebrow">DANADINHOS · GESTÃO</span><h2 id="dialog-title">{title}</h2></div><button className="icon-button" onClick={onClose} disabled={busy} aria-label="Fechar">×</button></div>{children}</dialog>;
}
function FieldError({ msg }) {
  if (!msg) return null;
  return <span className="field-error" role="alert">{msg}</span>;
}

function RecordForm({ config, onSave, onClose }) {
  const [values, setValues] = useState(config.values ?? {});
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  function validateField(f, val) {
    const v = val !== undefined ? val : values[f.name];
    if (f.required === false || f.nullable) return '';
    if (f.boolean) return '';
    if (f.type === 'number') {
      const n = Number(v === '' || v === null || v === undefined ? 0 : v);
      if (f.min !== undefined && n < Number(f.min)) return `Valor mínimo: ${f.min}`;
      if (f.max !== undefined && n > Number(f.max)) return `Valor máximo: ${f.max}`;
      if (f.min !== undefined && f.min > 0 && n <= 0) return 'Informe um valor maior que zero';
      if (f.required !== false && (v === '' || v === null || v === undefined)) return 'Informe um valor numérico válido';
      return '';
    }
    if (f.type === 'select') {
      return !String(v ?? '').trim() ? 'Selecione uma opção' : '';
    }
    if (f.type === 'tel') {
      if (!String(v ?? '').trim()) return 'Informe o telefone de contato';
      const digits = String(v).replace(/\D/g, '');
      if (digits.length < 8) return 'Telefone incompleto (mínimo 8 dígitos)';
      return '';
    }
    if (f.type === 'date') {
      if (!String(v ?? '').trim()) return 'Selecione uma data válida';
      return '';
    }
    if (!String(v ?? '').trim()) return 'Este campo é obrigatório';
    return '';
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const allTouched = Object.fromEntries(config.fields.map(f => [f.name, true]));
    setTouched(allTouched);

    const errs = {};
    for (const f of config.fields) {
      const err = validateField(f, values[f.name]);
      if (err) errs[f.name] = err;
    }
    if (Object.keys(errs).length > 0) return;

    setBusy(true); setServerError('');
    try {
      const result = { ...values };
      for (const f of config.fields) {
        if (f.type === 'number') result[f.name] = Number(result[f.name] || 0);
        else if (f.nullable && !result[f.name]) result[f.name] = null;
        else if (f.boolean) result[f.name] = result[f.name] === true || result[f.name] === 'true';
        else if (typeof result[f.name] === 'string') result[f.name] = result[f.name].trim();
      }
      await onSave(result); onClose();
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function blur(name) { setTouched(t => ({ ...t, [name]: true })); }
  function change(name, val) { setValues(v => ({ ...v, [name]: val })); }

  return <Dialog title={config.title} onClose={onClose} busy={busy}><form className="record-form" onSubmit={submit} noValidate>{config.note && <p className="info-note">{config.note}</p>}{serverError && <p className="alert" role="alert">{serverError}</p>}<div className="field-grid">{config.fields.map(f => {
    const err = touched[f.name] ? validateField(f, values[f.name]) : '';
    const id = `field-${f.name}`;
    const isReq = f.required !== false;
    return <label className={`${f.type === 'textarea' ? 'wide' : ''} ${err ? 'field-invalid' : ''}`} key={f.name} htmlFor={id}>{f.label}{isReq ? ' *' : ''}{f.type === 'select' ? <select id={id} value={String(values[f.name] ?? '')} disabled={busy || f.disabled} onChange={e => change(f.name, e.target.value)} onBlur={() => blur(f.name)}><option value="">Selecione</option>{f.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : f.type === 'textarea' ? <textarea id={id} rows="3" value={values[f.name] ?? ''} disabled={busy} placeholder={f.placeholder} onChange={e => change(f.name, e.target.value)} onBlur={() => blur(f.name)} /> : <input id={id} type={f.type} value={values[f.name] ?? ''} min={f.min} max={f.max} step={f.step} placeholder={f.placeholder} maxLength={f.type === 'text' ? 500 : undefined} disabled={busy || f.disabled} onChange={e => change(f.name, e.target.value)} onBlur={() => blur(f.name)} />}<FieldError msg={err} /></label>;
  })}</div><div className="form-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>Cancelar</button><button className="action" disabled={busy} type="submit">{busy ? 'Salvando…' : 'Salvar registro'}</button></div></form></Dialog>;
}

export default function Manager({ user, onSignOut, signingOut, authError, onReception, onKitchen }) {
  const [section, setSection] = useState('overview');
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [month, setMonth] = useState(today().slice(0, 7));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [financeFilter, setFinanceFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [acting, setActing] = useState(false);
  const [deletion, setDeletion] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [reverting, setReverting] = useState(null);
  const mutation = useRef(false);
  const request = useRef(0);

  function notify(msg) {
    setToastKey(k => k + 1);
    setNotice(msg);
  }
  async function refresh() {
    const version = ++request.current; setLoading(true); setError('');
    try { const next = await loadData(); if (version === request.current) setData(next); }
    catch (e) { if (version === request.current) setError(errorMessage(e)); }
    finally { if (version === request.current) setLoading(false); }
  }
  useEffect(() => { refresh(); return () => { request.current++; }; }, []);
  const stats = useMemo(() => metrics(data, month), [data, month]);
  const low = data.stock_items.filter(i => i.active && stockBalance(i, data.stock_movements) <= Number(i.minimum));
  const partyName = id => data.parties.find(p => p.id === id)?.client ?? 'Sem festa';
  const employeeName = id => data.employees.find(p => p.id === id)?.name ?? '—';
  const partyOptions = data.parties.filter(p => p.status !== 'cancelado').sort((a, b) => b.event_date.localeCompare(a.event_date)).map(p => option(p.id, `${dateLabel(p.event_date)} · ${p.client}`));
  const employeeOptions = data.employees.filter(p => p.active).map(p => option(p.id, `${p.name} · ${p.kind === 'fixo' ? 'Fixo' : 'Temporário'}`));
  const changeSection = key => { setSection(key); setSearch(''); setStatus(''); setDetail(null); };
  const openForm = (table, title, fields, values, id, note) => { setDetail(null); setModal({ table, title, fields, values, id, note }); };
  async function save(values) {
    const row = await saveRecord(modal.table, values, modal.id);
    notify('Registro salvo com sucesso.');
    if (['parties', 'assignments'].includes(modal.table)) await refresh();
    else setData(previous => ({ ...previous, [modal.table]: modal.id ? previous[modal.table].map(r => r.id === row.id ? row : r) : [...previous[modal.table], row] }));
  }
  function askDelete(table, row, label) {
    setDetail(null); setDeleteError(''); setDeletion({ table, id: row.id, label });
  }
  async function remove() {
    if (mutation.current) return;
    mutation.current = true; setActing(true); setDeleteError('');
    try {
      await deleteRecord(deletion.table, deletion.id);
      setDeletion(null); notify('Registro excluído com sucesso.'); await refresh();
    } catch (e) { setDeleteError(errorMessage(e)); }
    finally { mutation.current = false; setActing(false); }
  }
  const deleteButton = (table, row, label) => <button className="row-button danger" disabled={acting || loading} onClick={() => askDelete(table, row, label)}>Excluir</button>;
  async function change(table, id, values) {
    if (acting) return; setActing(true); setError('');
    try { const row = await saveRecord(table, values, id); setData(previous => ({ ...previous, [table]: previous[table].map(r => r.id === id ? row : r) })); notify('Registro atualizado.'); }
    catch (e) { setError(errorMessage(e)); } finally { setActing(false); }
  }
  function editParty(p = {}) {
    openForm('parties', p.id ? 'Editar festa' : 'Nova festa', [
      field('client', 'Cliente', 'text', { placeholder: 'Ex: Aniversário da Laura' }), field('phone', 'Telefone', 'tel', { placeholder: '(00) 00000-0000' }), field('event_date', 'Data da festa', 'date'), field('event_time', 'Horário', 'time'),
      field('guests', 'Número de convidados', 'number', { min: 1, step: 1, placeholder: 'Ex: 50' }), currency('amount', 'Valor contratado (R$)', { placeholder: '0.00' }), select('status', 'Status', statusOptions),
      field('menu', 'Cardápio', 'textarea', { required: false, placeholder: 'Itens do cardápio, restrições...' }), field('decoration', 'Decoração', 'textarea', { required: false, placeholder: 'Tema, cores, itens especiais...' }), field('notes', 'Observações', 'textarea', { required: false, placeholder: 'Detalhes adicionais...' })
    ], { client: p.client ?? '', phone: p.phone ?? '', event_date: p.event_date ?? today(), event_time: p.event_time?.slice(0, 5) ?? '18:00', guests: p.guests ?? 50, amount: p.amount ?? 0, status: p.status ?? 'orcamento', menu: p.menu ?? '', decoration: p.decoration ?? '', notes: p.notes ?? '' }, p.id, 'Ao aprovar, o valor contratado entra automaticamente nas contas a receber. Orçamentos e festas canceladas não geram saldo pendente.');
  }
  function editEmployee(p = {}) {
    openForm('employees', p.id ? 'Editar funcionário' : 'Novo funcionário', [
      field('name', 'Nome', 'text', { placeholder: 'Nome completo' }), field('job', 'Função', 'text', { placeholder: 'Ex: Recreador(a), Garçom, Cozinheiro(a)' }), field('phone', 'Telefone', 'tel', { placeholder: '(00) 00000-0000' }), field('admission_date', 'Data de admissão', 'date'), select('kind', 'Vínculo', [['fixo', 'Fixo'], ['temporario', 'Temporário / freelancer']]), select('active', 'Situação', [['true', 'Ativo'], ['false', 'Inativo']], { boolean: true })
    ], { name: p.name ?? '', job: p.job ?? '', phone: p.phone ?? '', admission_date: p.admission_date ?? today(), kind: p.kind ?? 'temporario', active: p.active ?? true }, p.id, 'Funcionários inativos permanecem no histórico das festas.');
  }
  function editAssignment(a = {}, partyId) {
    const parties = partyOptions.some(([id]) => id === a.party_id) ? partyOptions : [...partyOptions, ...(a.party_id ? [[a.party_id, partyName(a.party_id)]] : [])];
    const employees = employeeOptions.some(([id]) => id === a.employee_id) ? employeeOptions : [...employeeOptions, ...(a.employee_id ? [[a.employee_id, employeeName(a.employee_id)]] : [])];
    openForm('assignments', a.id ? 'Editar escala' : 'Escalar funcionário', [
      select('party_id', 'Festa', parties, { disabled: !!a.id }), select('employee_id', 'Funcionário', employees, { disabled: !!a.id }), field('job', 'Função nesta festa', 'text', { placeholder: 'Ex: Recreação infantil' }), currency('fee', 'Diária / evento (R$)', { placeholder: '0.00' }), select('status', 'Participação', [['escalado', 'Escalado'], ['trabalhou', 'Trabalhou'], ['cancelado', 'Cancelado']])
    ], { party_id: a.party_id ?? partyId ?? '', employee_id: a.employee_id ?? '', job: a.job ?? '', fee: a.fee ?? 0, status: a.status ?? 'escalado' }, a.id, 'A diária é criada automaticamente no financeiro. Marque “Trabalhou” após o evento para manter o histórico. Cancelar a festa não cancela automaticamente os compromissos com a equipe.');
  }
  function editItem(i = {}) {
    openForm('stock_items', i.id ? 'Editar item' : 'Novo item de estoque', [
      field('name', 'Nome do item', 'text', { placeholder: 'Ex: Balões sortidos, Guardanapos...' }), select('category', 'Categoria', [['Alimentos', 'Alimentos'], ['Bebidas', 'Bebidas'], ['Limpeza', 'Materiais de limpeza']]), field('unit', 'Unidade (un, kg, L…)', 'text', { placeholder: 'un, kg, pct, L' }), field('minimum', 'Estoque mínimo', 'number', { min: 0, step: '.001', placeholder: '0' }), select('active', 'Situação', [['true', 'Ativo'], ['false', 'Inativo']], { boolean: true })
    ], { name: i.name ?? '', category: i.category ?? 'Alimentos', unit: i.unit ?? 'un', minimum: i.minimum ?? 0, active: i.active ?? true }, i.id, 'O saldo é calculado pelas entradas e saídas. Após cadastrar, registre uma entrada com o saldo inicial.');
  }
  function movement(i, out = false) {
    openForm('stock_movements', `${out ? 'Saída' : 'Entrada'} · ${i.name}`, [field('quantity', `Quantidade (${i.unit})`, 'number', { min: .001, step: '.001', placeholder: '0', ...(out ? { max: stockBalance(i, data.stock_movements) } : {}) }), field('movement_date', 'Data', 'date'), field('reason', 'Motivo', 'text', { placeholder: 'Ex: Festa da Laura, Compra fornecedor...' }), select('party_id', 'Festa (opcional)', partyOptions, { required: false, nullable: true })], { item_id: i.id, quantity: '', movement_date: today(), reason: '', party_id: null }, null, 'Movimentações ficam no histórico. Para corrigir, registre uma movimentação de sentido contrário.');
    setModal(m => ({ ...m, out }));
  }
  function editEntry(e = {}) {
    openForm('entries', e.id ? 'Editar conta' : 'Nova conta', [
      select('kind', 'Tipo', [['receber', 'Conta a receber'], ['pagar', 'Conta a pagar']], { disabled: !!e.id }), field('description', 'Descrição', 'text', { placeholder: 'Ex: Fornecedor de doces, Sinal contrato...' }), field('category', 'Categoria', 'text', { placeholder: 'Ex: Alimentação, Decoração, Pessoal...' }), currency('amount', 'Valor (R$)', { min: .01, placeholder: '0.00' }), field('due_date', 'Vencimento', 'date'), select('party_id', 'Festa (opcional)', partyOptions, { required: false, nullable: true, disabled: !!e.id }), select('employee_id', 'Funcionário (opcional)', employeeOptions, { required: false, nullable: true, disabled: !!e.id }), select('canceled', 'Situação', [['false', 'Ativa'], ['true', 'Cancelada']], { boolean: true })
    ], { kind: e.kind ?? 'pagar', description: e.description ?? '', category: e.category ?? 'Outros', amount: e.amount ?? '', due_date: e.due_date ?? today(), party_id: e.party_id ?? null, employee_id: e.employee_id ?? null, canceled: e.canceled ?? false }, e.id, 'Contratos e diárias já geram contas automaticamente. Use esta opção para outros gastos, salários, receitas ou ajustes.');
  }
  function payment(e) {
    openForm('payments', e.kind === 'receber' ? 'Registrar recebimento' : 'Registrar pagamento', [
      currency('amount', 'Valor (R$)', { min: .01, max: balanceFor(e, data.payments), placeholder: '0.00' }), field('payment_date', 'Data do pagamento', 'date'), select('method', 'Forma de pagamento', [['Pix', 'Pix'], ['Dinheiro', 'Dinheiro'], ['Cartão', 'Cartão'], ['Transferência', 'Transferência'], ['Outro', 'Outro']]), field('notes', 'Observações', 'textarea', { required: false, placeholder: 'Comprovante, detalhes adicionais...' })
    ], { entry_id: e.id, amount: balanceFor(e, data.payments), payment_date: today(), method: 'Pix', notes: '' }, null, `${e.description} · Saldo: ${money(balanceFor(e, data.payments))}. Você pode registrar pagamentos parciais.`);
  }
  function download(headers, rows, name) {
    const url = URL.createObjectURL(new Blob([csvText(headers, rows)], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = `danadinhos-${name}-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  function partyRows(parties) { return parties.map(p => ({ key: p.id, cells: [<button className="text-button" onClick={() => setDetail({ type: 'party', id: p.id })}>{p.client}</button>, <><strong>{dateLabel(p.event_date)}</strong><small>{p.event_time.slice(0, 5)}</small></>, `${p.guests} pessoas`, money(p.amount), <Badge status={p.status} />, <div className="row-actions"><button className="row-button" onClick={() => editParty(p)}>Editar</button>{deleteButton('parties', p, p.client)}</div>] })); }
  function assignmentTable(assignments) { return <Table headers={['Festa', 'Funcionário', 'Função', 'Diária', 'Situação', 'Ação']} rows={assignments.map(a => ({ key: a.id, cells: [<>{partyName(a.party_id)}<small>{dateLabel(data.parties.find(p => p.id === a.party_id)?.event_date)}</small></>, employeeName(a.employee_id), a.job, money(a.fee), a.status, <div className="row-actions"><button className="row-button" onClick={() => editAssignment(a)}>Editar</button>{deleteButton('assignments', a, 'Escala de ' + employeeName(a.employee_id))}</div>] }))} empty="Nenhum funcionário escalado." />; }
  function entryRows(entries) { return entries.map(e => ({ key: e.id, cells: [<button className="text-button" onClick={() => setDetail({ type: 'entry', id: e.id })}>{e.description}<small>{e.category} · {e.kind === 'receber' ? 'A receber' : 'A pagar'}</small></button>, dateLabel(e.due_date), money(e.amount), money(paidFor(e, data.payments)), money(balanceFor(e, data.payments)), <span className={`badge ${e.canceled ? 'cancelado' : balanceFor(e, data.payments) === 0 ? 'aprovado' : e.due_date < today() ? 'late' : 'aguardando'}`}>{e.canceled ? 'Inativa' : balanceFor(e, data.payments) === 0 ? 'Quitada' : e.due_date < today() ? 'Vencida' : 'Pendente'}</span>, <button className="row-button" disabled={e.canceled || balanceFor(e, data.payments) === 0} onClick={() => payment(e)}>{e.kind === 'receber' ? 'Receber' : 'Pagar'}</button>] })); }
  const financeHeaders = ['Descrição', 'Vencimento', 'Valor', 'Pago', 'Saldo', 'Situação', 'Ação'];
  const filteredParties = data.parties.filter(p => p.client.toLowerCase().includes(search.toLowerCase()) && (!status || p.status === status)).sort((a, b) => b.event_date.localeCompare(a.event_date));
  const currentDetail = detail && data[detail.type === 'party' ? 'parties' : detail.type === 'employee' ? 'employees' : detail.type === 'stock' ? 'stock_items' : 'entries'].find(x => x.id === detail.id);

  return <div className="manager"><aside className="sidebar"><a href="/admin/" className="manager-brand"><img src="/admin/logo-danadinhos.png" alt="Danadinhos" className="sidebar-logo" /></a><p className="sidebar-label">Menu</p><nav aria-label="Módulos da gestora">{sections.map(([key, label, icon]) => <button key={key} className={section === key ? 'selected' : ''} aria-current={section === key ? 'page' : undefined} onClick={() => changeSection(key)}><span aria-hidden="true">{icon}</span>{label}{key === 'stock' && low.length > 0 ? <b>{low.length}</b> : null}</button>)}</nav>
      <p className="sidebar-label extra-access-label" id="extra-access-label">Outros Acessos</p>
      <nav className="extra-access-nav" aria-labelledby="extra-access-label"><button onClick={onKitchen}><span aria-hidden="true">♨</span>Cozinha</button><button onClick={onReception}><span aria-hidden="true">☀</span>Recepção</button></nav><div className="sidebar-bottom"><div className="profile-dot">G</div><div><strong>Gestora</strong><small>{user.email}</small></div><button title="Sair da conta" aria-label="Sair da conta" disabled={signingOut} onClick={onSignOut}>↪</button></div><div className="sidebar-blobs"><img src="/admin/sidebar-blobs.png" alt="" aria-hidden="true" /></div></aside>
    <div className="workspace"><header className="workspace-header"><span>Danadinhos <span className="slash">/</span> {sections.find(s => s[0] === section)[1]}</span><div className="header-right-group">{['overview', 'calendar', 'reports', 'finance'].includes(section) && <MonthPicker month={month} onChange={setMonth} />}<span className="workspace-date">{dateLabel(today())} <i /> Área da gestora</span></div></header>
      <main className="workspace-main"><div className="page-heading"><div><span className="eyebrow">CUIDADO EM CADA DETALHE</span><h1>{section === 'overview' ? 'Tudo pronto para celebrar.' : sections.find(s => s[0] === section)[1]}</h1><p>{({ overview: 'Acompanhe as festas, a equipe e os próximos passos.', parties: 'Do primeiro orçamento ao grande dia.', calendar: 'Sua programação, um mês de cada vez.', stock: 'Tudo o que precisa estar pronto para a próxima festa.', finance: 'Entradas, saídas e compromissos em um só lugar.', employees: 'As pessoas que fazem cada festa acontecer.', reports: 'Números claros para acompanhar o seu negócio.' })[section]}</p></div><div className="heading-actions"><button className="secondary" onClick={refresh} disabled={loading}>↻ Atualizar</button>{section === 'parties' || section === 'overview' ? <button className="action" onClick={() => editParty()}>+ Nova festa</button> : section === 'employees' ? <button className="action" onClick={() => editEmployee()}>+ Funcionário</button> : section === 'stock' ? <button className="action" onClick={() => editItem()}>+ Novo item</button> : section === 'finance' ? <button className="action" onClick={() => editEntry()}>+ Nova conta</button> : null}</div></div>
        {(error || authError) && <p className="alert" role="alert">{error || authError}</p>}
        {notice && <Toast key={toastKey} message={notice} onClose={() => setNotice('')} />}
        {loading ? <div className="loading" role="status">Carregando os registros…</div> : error ? <div className="empty"><h3>Não foi possível carregar os dados.</h3><button className="action" onClick={refresh}>Tentar novamente</button></div> : <>
          {section === 'overview' && <><Stats items={[['Festas no mês', stats.parties.filter(p => p.status !== 'cancelado').length, 'Orçamentos e aprovadas'], ['Contratado no mês', money(stats.contracted), 'Festas aprovadas por data do evento'], ['Recebido no mês', money(stats.received), 'Por data de pagamento'], ['Saldo a receber', money(stats.receivable), 'Todos os meses']]} />{low.length > 0 && <button className="stock-warning" onClick={() => changeSection('stock')}>⚑ {low.length} {low.length === 1 ? 'item precisa' : 'itens precisam'} de reposição. <strong>Ver estoque →</strong></button>}<section className="panel"><div className="panel-title"><div><h2>Próximas festas</h2><p>Uma visão do que vem pela frente.</p></div><button className="text-button" onClick={() => changeSection('calendar')}>Abrir calendário →</button></div><Table headers={['Cliente', 'Data e horário', 'Convidados', 'Valor', 'Status', 'Ação']} rows={partyRows(stats.future.slice(0, 6))} empty="Sua próxima festa começa aqui." /></section><div className="overview-grid"><section className="panel summary-panel"><h2>Compromissos financeiros</h2><div><span>A pagar</span><strong>{money(stats.payable)}</strong></div><div><span>Gastos pagos no mês</span><strong>{money(stats.spent)}</strong></div><button className="text-button" onClick={() => changeSection('finance')}>Acompanhar financeiro →</button></section><section className="panel summary-panel"><h2>Sua equipe</h2><div><span>Funcionários ativos</span><strong>{data.employees.filter(e => e.active).length}</strong></div><div><span>Participações registradas</span><strong>{data.assignments.filter(a => a.status === 'trabalhou').length}</strong></div><button className="text-button" onClick={() => changeSection('employees')}>Organizar a equipe →</button></section></div></>}
          {section === 'parties' && <section className="panel"><div className="toolbar"><input aria-label="Buscar cliente" placeholder="Buscar por cliente…" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Filtrar status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option>{statusOptions.map(([k, v]) => <option value={k} key={k}>{v}</option>)}</select><span>{filteredParties.length} festas</span></div><Table headers={['Cliente', 'Data e horário', 'Convidados', 'Valor', 'Status', 'Ação']} rows={partyRows(filteredParties)} /></section>}
          {section === 'calendar' && <section className="panel calendar-panel"><div className="calendar-week">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <span key={d}>{d}</span>)}</div><div className="calendar-grid">{calendarDays(month).map((day, i) => <div key={day ?? `blank${i}`} className={`calendar-day ${day === today() ? 'today' : ''} ${!day ? 'blank' : ''}`}><span>{day ? Number(day.slice(-2)) : ''}</span>{data.parties.filter(p => p.event_date === day).sort((a, b) => a.event_time.localeCompare(b.event_time)).map(p => <button className={`calendar-event ${p.status}`} onClick={() => setDetail({ type: 'party', id: p.id })} key={p.id}><b>{p.event_time.slice(0, 5)}</b> {p.client}<small>{statuses[p.status]}</small></button>)}</div>)}</div><div className="calendar-legend">{statusOptions.map(([key]) => <Badge key={key} status={key} />)}</div></section>}
          {section === 'stock' && <><Stats items={[['Itens ativos', data.stock_items.filter(i => i.active).length], ['Estoque baixo', low.length, 'Saldo igual ou abaixo do mínimo'], ['Movimentações', data.stock_movements.length]]} /><section className="panel"><div className="toolbar"><input aria-label="Buscar item" placeholder="Buscar item…" value={search} onChange={e => setSearch(e.target.value)} /></div><Table headers={['Item', 'Categoria', 'Saldo', 'Mínimo', 'Situação', 'Movimentar', 'Ação']} rows={data.stock_items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map(i => { const balance = stockBalance(i, data.stock_movements); return { key: i.id, cells: [<button className="text-button" onClick={() => setDetail({ type: 'stock', id: i.id })}>{i.name}</button>, i.category, `${balance} ${i.unit}`, `${i.minimum} ${i.unit}`, <span className={`badge ${!i.active ? 'cancelado' : balance <= Number(i.minimum) ? 'late' : 'aprovado'}`}>{!i.active ? 'Inativo' : balance <= Number(i.minimum) ? 'Estoque baixo' : 'Em dia'}</span>, <div className="row-actions"><button className="row-button" disabled={!i.active} onClick={() => movement(i)}>+ Entrada</button><button className="row-button" disabled={!i.active || balance <= 0} onClick={() => movement(i, true)}>− Saída</button></div>, <div className="row-actions"><button className="row-button" onClick={() => editItem(i)}>Editar</button>{deleteButton('stock_items', i, i.name)}</div>] }; })} /></section></>}
          {section === 'finance' && <><Stats items={[['A receber', money(stats.receivable), 'Saldo de contas ativas'], ['A pagar', money(stats.payable), 'Saldo de contas ativas'], ['Recebido no mês', money(stats.received), dateLabel(`${month}-01`).slice(3)], ['Pago no mês', money(stats.spent), dateLabel(`${month}-01`).slice(3)]]} /><section className="panel"><div className="toolbar"><input aria-label="Buscar conta" placeholder="Buscar descrição…" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Filtrar contas" value={financeFilter} onChange={e => setFinanceFilter(e.target.value)}><option value="">Todas as contas</option><option value="receber">A receber</option><option value="pagar">A pagar</option><option value="pendente">Pendentes</option><option value="vencida">Vencidas</option><option value="quitada">Quitadas</option><option value="inativa">Inativas / orçamentos</option></select></div><Table headers={financeHeaders} rows={entryRows(data.entries.filter(e => e.description.toLowerCase().includes(search.toLowerCase()) && (!financeFilter || ['receber', 'pagar'].includes(financeFilter) && e.kind === financeFilter && !e.canceled || financeFilter === 'pendente' && !e.canceled && balanceFor(e, data.payments) > 0 || financeFilter === 'vencida' && !e.canceled && balanceFor(e, data.payments) > 0 && e.due_date < today() || financeFilter === 'quitada' && !e.canceled && balanceFor(e, data.payments) === 0 || financeFilter === 'inativa' && e.canceled)).sort((a, b) => a.due_date.localeCompare(b.due_date)))} /></section></>}
          {section === 'employees' && <><section className="panel"><div className="toolbar"><input aria-label="Buscar funcionário" placeholder="Buscar funcionário…" value={search} onChange={e => setSearch(e.target.value)} /><button className="secondary" onClick={() => editAssignment()} disabled={!partyOptions.length || !employeeOptions.length}>+ Escalar para festa</button></div><Table headers={['Nome', 'Função', 'Vínculo', 'Telefone', 'Admissão', 'Pago / pendente', 'Ação']} rows={data.employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).map(e => { const entries = data.entries.filter(b => b.employee_id === e.id && b.kind === 'pagar'); return { key: e.id, cells: [<button className="text-button" onClick={() => setDetail({ type: 'employee', id: e.id })}>{e.name}<small>{e.active ? 'Ativo' : 'Inativo'}</small></button>, e.job, e.kind === 'fixo' ? 'Fixo' : 'Temporário / freelancer', e.phone, dateLabel(e.admission_date), <>{money(entries.reduce((s, b) => s + paidFor(b, data.payments), 0))}<small>Pendente: {money(entries.filter(b => !b.canceled).reduce((s, b) => s + balanceFor(b, data.payments), 0))}</small></>, <div className="row-actions"><button className="row-button" onClick={() => editEmployee(e)}>Editar</button>{deleteButton('employees', e, e.name)}</div>] }; })} /></section><section className="panel"><div className="panel-title"><div><h2>Escalas e histórico por festa</h2><p>Funções, diárias e participações da equipe.</p></div></div>{assignmentTable(data.assignments)}</section></>}
          {section === 'reports' && <><Stats items={[['Faturamento contratado', money(stats.contracted), 'Aprovadas pela data da festa'], ['Recebimentos', money(stats.received), 'Pagamentos recebidos no mês'], ['Gastos pagos', money(stats.spent), 'Saídas pagas no mês'], ['Resultado de caixa', money(stats.received - stats.spent), 'Recebimentos menos gastos pagos']]} /><section className="panel"><div className="panel-title"><div><h2>Festas do mês</h2><p>{stats.parties.length} cadastradas · {stats.approved.length} aprovadas · {stats.parties.filter(p => p.status === 'cancelado').length} canceladas</p></div><button className="secondary" onClick={() => download(['Cliente', 'Data', 'Status', 'Valor'], stats.parties.map(p => [p.client, p.event_date, statuses[p.status], p.amount]), 'festas')}>Exportar CSV</button></div><Table headers={['Cliente', 'Data e horário', 'Convidados', 'Valor', 'Status', 'Ação']} rows={partyRows(stats.parties)} /></section><section className="panel"><div className="panel-title"><div><h2>Festas futuras</h2><p>A partir de hoje, incluindo orçamentos. Canceladas excluídas.</p></div><button className="secondary" onClick={() => download(['Cliente', 'Data', 'Horário', 'Status', 'Valor'], stats.future.map(p => [p.client, p.event_date, p.event_time, statuses[p.status], p.amount]), 'futuras')}>Exportar CSV</button></div><Table headers={['Cliente', 'Data e horário', 'Convidados', 'Valor', 'Status', 'Ação']} rows={partyRows(stats.future)} /></section><section className="panel"><div className="panel-title"><div><h2>Gastos e recebimentos do mês</h2><p>Pagamentos efetivos, pela data de pagamento. Estornos excluídos.</p></div><button className="secondary" onClick={() => download(['Data', 'Descrição', 'Tipo', 'Valor', 'Forma'], data.payments.filter(p => !p.voided && p.payment_date.startsWith(month)).map(p => { const e = data.entries.find(e => e.id === p.entry_id); return [p.payment_date, e?.description, e?.kind, p.amount, p.method]; }), 'movimentacoes-financeiras')}>Exportar CSV</button></div><Table headers={['Data', 'Descrição', 'Tipo', 'Valor', 'Forma']} rows={data.payments.filter(p => !p.voided && p.payment_date.startsWith(month)).map(p => { const e = data.entries.find(e => e.id === p.entry_id); return { key: p.id, cells: [dateLabel(p.payment_date), e?.description, e?.kind === 'pagar' ? 'Saída' : 'Entrada', money(p.amount), p.method] }; })} /></section><section className="panel"><div className="panel-title"><div><h2>Pagamentos pendentes</h2><p>Todos os meses · contas ativas com saldo.</p></div><button className="secondary" onClick={() => download(['Descrição', 'Tipo', 'Vencimento', 'Saldo'], data.entries.filter(e => !e.canceled && balanceFor(e, data.payments) > 0).map(e => [e.description, e.kind, e.due_date, balanceFor(e, data.payments)]), 'pendencias')}>Exportar CSV</button></div><Table headers={financeHeaders} rows={entryRows(data.entries.filter(e => !e.canceled && balanceFor(e, data.payments) > 0))} /></section></>}
        </>}
        <footer className="workspace-footer">Danadinhos · Sistema de controle de festas <span>Dados salvos no Supabase</span></footer>
      </main></div>
    {deletion && <Dialog title="Excluir registro?" busy={acting} onClose={() => setDeletion(null)}><p>Deseja excluir <strong>{deletion.label}</strong>? Esta ação não pode ser desfeita.</p><p className="info-note">{deletion.table === 'stock_movements' ? 'O saldo do estoque será recalculado. A exclusão será bloqueada se deixar o saldo negativo.' : deletion.table === 'stock_items' ? 'Itens com movimentações não podem ser excluídos. Você pode inativá-los em Editar.' : deletion.table === 'employees' ? 'Funcionários com escalas ou contas vinculadas não podem ser excluídos. Você pode inativá-los em Editar.' : deletion.table === 'entries' ? 'Contas com pagamentos, inclusive estornados, permanecem no histórico.' : 'A conta automática sem pagamentos também será excluída. Outros vínculos impedem a exclusão; nesse caso, use o cancelamento para preservar o histórico.'}</p>{deleteError && <p className="alert" role="alert">{deleteError}</p>}<div className="form-actions"><button className="secondary" disabled={acting} onClick={() => setDeletion(null)}>Voltar</button><button className="action danger" disabled={acting} onClick={remove}>{acting ? 'Excluindo…' : 'Excluir definitivamente'}</button></div></Dialog>}
    {modal && <RecordForm key={`${modal.table}-${modal.id ?? 'new'}`} config={modal} onClose={() => setModal(null)} onSave={v => save(modal.out ? { ...v, quantity: -v.quantity } : v)} />}
    {currentDetail && <Dialog title={currentDetail.client ?? currentDetail.name ?? currentDetail.description} onClose={() => setDetail(null)} busy={acting}>
      {detail.type === 'party' && <><div className="detail-grid"><div><small>Data e horário</small>{dateLabel(currentDetail.event_date)} · {currentDetail.event_time.slice(0, 5)}</div><div><small>Status</small><Badge status={currentDetail.status} /></div><div><small>Telefone</small>{currentDetail.phone}</div><div><small>Convidados</small>{currentDetail.guests}</div><div><small>Valor contratado</small>{money(currentDetail.amount)}</div><div><small>Cardápio</small>{currentDetail.menu || 'Não informado'}</div><div><small>Decoração</small>{currentDetail.decoration || 'Não informada'}</div><div><small>Observações</small>{currentDetail.notes || '—'}</div></div><div className="row-actions"><button className="secondary" onClick={() => editParty(currentDetail)}>Editar festa</button><button className="action" disabled={currentDetail.status === 'cancelado' || !employeeOptions.length} onClick={() => editAssignment({}, currentDetail.id)}>+ Escalar funcionário</button></div><h3>Equipe da festa</h3>{assignmentTable(data.assignments.filter(a => a.party_id === currentDetail.id))}<h3>Financeiro da festa</h3><p className="info-note">Gastos previstos: {money(sumMoney(data.entries.filter(e => e.party_id === currentDetail.id && e.kind === 'pagar' && !e.canceled)))} · Gastos pagos: {money(data.entries.filter(e => e.party_id === currentDetail.id && e.kind === 'pagar').reduce((s, e) => s + paidFor(e, data.payments), 0))}</p><Table headers={financeHeaders} rows={entryRows(data.entries.filter(e => e.party_id === currentDetail.id))} /></>}
      {detail.type === 'employee' && <><div className="detail-grid"><div><small>Função</small>{currentDetail.job}</div><div><small>Telefone</small>{currentDetail.phone}</div><div><small>Vínculo</small>{currentDetail.kind === 'fixo' ? 'Fixo' : 'Temporário / freelancer'}</div><div><small>Admissão</small>{dateLabel(currentDetail.admission_date)}</div></div><h3>Histórico e próximas escalas</h3>{assignmentTable(data.assignments.filter(a => a.employee_id === currentDetail.id))}<h3>Diárias e pagamentos</h3><Table headers={financeHeaders} rows={entryRows(data.entries.filter(e => e.employee_id === currentDetail.id))} /></>}
      {detail.type === 'stock' && <><p className="info-note">Saldo: {stockBalance(currentDetail, data.stock_movements)} {currentDetail.unit} · Mínimo: {currentDetail.minimum} {currentDetail.unit}</p><Table headers={['Data', 'Quantidade', 'Motivo', 'Festa', 'Ação']} rows={data.stock_movements.filter(m => m.item_id === currentDetail.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(m => ({ key: m.id, cells: [dateLabel(m.movement_date), `${Number(m.quantity) > 0 ? '+' : ''}${m.quantity} ${currentDetail.unit}`, m.reason, m.party_id ? partyName(m.party_id) : '—', deleteButton('stock_movements', m, `${m.reason} · ${m.quantity} ${currentDetail.unit}`)] }))} /></>}
      {detail.type === 'entry' && <><Stats items={[['Valor', money(currentDetail.amount)], ['Pago', money(paidFor(currentDetail, data.payments))], ['Saldo', money(balanceFor(currentDetail, data.payments))]]} /><p className="info-note">Vencimento: {dateLabel(currentDetail.due_date)} · {currentDetail.canceled ? 'Conta inativa' : 'Conta ativa'}. {currentDetail.source === 'manual' ? 'Conta manual.' : 'Valor e situação vinculados à festa ou escala de origem.'}</p><div className="row-actions">{currentDetail.source === 'manual' && <><button className="secondary" onClick={() => editEntry(currentDetail)}>Editar conta</button>{deleteButton('entries', currentDetail, currentDetail.description)}</>}<button className="action" disabled={currentDetail.canceled || balanceFor(currentDetail, data.payments) <= 0} onClick={() => payment(currentDetail)}>Registrar {currentDetail.kind === 'receber' ? 'recebimento' : 'pagamento'}</button></div><h3>Histórico de pagamentos</h3><Table headers={['Data', 'Valor', 'Forma', 'Observações', 'Situação', 'Ação']} rows={data.payments.filter(p => p.entry_id === currentDetail.id).map(p => ({ key: p.id, cells: [dateLabel(p.payment_date), money(p.amount), p.method, p.notes || '—', p.voided ? 'Estornado' : 'Confirmado', <button className="row-button danger" disabled={p.voided || acting} onClick={() => setReverting(p.id)}>Estornar</button>] }))} /></>}
    </Dialog>}
    {reverting && <Dialog title="Estornar pagamento?" busy={acting} onClose={() => setReverting(null)}>
      <p>Deseja confirmar o estorno deste pagamento? Ele permanecerá no histórico como estornado e o saldo da conta voltará a ficar em aberto.</p>
      <div className="form-actions">
        <button className="secondary" disabled={acting} onClick={() => setReverting(null)}>Cancelar</button>
        <button className="action danger" disabled={acting} onClick={async () => {
          setActing(true);
          try {
            await saveRecord('payments', { voided: true }, reverting);
            setData(prev => ({ ...prev, payments: prev.payments.map(p => p.id === reverting ? { ...p, voided: true } : p) }));
            notify('Pagamento estornado com sucesso.');
            setReverting(null);
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setActing(false);
          }
        }}>{acting ? 'Estornando…' : 'Confirmar estorno'}</button>
      </div>
    </Dialog>}
  </div>;
}

