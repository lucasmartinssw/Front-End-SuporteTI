import { useState, useEffect } from 'react';
import { Ticket } from './TicketForm';
import { computeSLA, SLA_COLORS, SLAInfo } from '../sla';

interface TicketListProps {
  tickets: Ticket[];
  userRole: 'client' | 'it-executive';
  userEmail: string;
  isLoading?: boolean;
  technicians: { id: number; nome: string; email: string }[];
  onTicketSelect: (ticket: Ticket) => void;
  onStatusUpdate: (ticketId: string, status: Ticket['status']) => void;
  onAddTecnico: (ticketId: string, userId: number) => void;
  onRemoveTecnico: (ticketId: string, userId: number) => void;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');

  .tl-page { animation: fadeUp 0.3s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .tl-page-title {
    font-family: 'Sora', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #0f1117;
    letter-spacing: -0.4px;
    margin-bottom: 4px;
  }

  .tl-page-sub { font-size: 13.5px; color: #9ca3af; margin-bottom: 24px; }

  .tl-filters {
    background: #fff;
    border: 1px solid #f0f1f5;
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .tl-search-wrap {
    position: relative;
    flex: 1;
    min-width: 200px;
  }

  .tl-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #c4c9d4;
    pointer-events: none;
  }

  .tl-search {
    width: 100%;
    height: 38px;
    padding: 0 12px 0 36px;
    border: 1.5px solid #e5e7eb;
    border-radius: 9px;
    font-size: 13.5px;
    font-family: 'DM Sans', sans-serif;
    color: #111827;
    background: #f9fafb;
    outline: none;
    transition: all 0.2s;
  }

  .tl-search::placeholder { color: #c4c9d4; }
  .tl-search:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }

  .tl-select {
    height: 38px;
    padding: 0 32px 0 12px;
    border: 1.5px solid #e5e7eb;
    border-radius: 9px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    color: #374151;
    background: #f9fafb;
    outline: none;
    transition: all 0.2s;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  .tl-select:focus { border-color: #6366f1; background-color: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
  .tl-sort-btn {
    display: inline-flex; align-items: center; gap: 5px;
    height: 36px; padding: 0 12px;
    border: 1.5px solid #e5e7eb; border-radius: 9px;
    background: #fff; font-size: 12.5px; font-weight: 600; color: #6b7280;
    cursor: pointer; white-space: nowrap; transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
  }
  .tl-sort-btn:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
  .tl-sort-btn.active { border-color: #6366f1; color: #6366f1; background: #eef2ff; }

  .tl-count {
    margin-left: auto;
    font-size: 12.5px;
    color: #9ca3af;
    white-space: nowrap;
    font-weight: 500;
  }

  /* Empty state */
  .tl-empty {
    background: #fff;
    border: 1px solid #f0f1f5;
    border-radius: 14px;
    padding: 64px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .tl-empty-icon {
    width: 56px;
    height: 56px;
    background: #f3f4f6;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .tl-empty-title {
    font-family: 'Sora', sans-serif;
    font-size: 17px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 6px;
  }

  .tl-empty-sub { font-size: 13.5px; color: #9ca3af; }
  .tl-empty-action { margin-top: 16px; display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg,#6366f1,#4f46e5); color: #fff; border: none; border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans',sans-serif; }

  /* Export button */
  .tl-export-btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; background: #fff; border: 1px solid #f0f1f5; border-radius: 9px; font-size: 12.5px; font-weight: 600; color: #6b7280; cursor: pointer; font-family: 'DM Sans',sans-serif; transition: all 0.18s; white-space: nowrap; }
  .tl-export-btn:hover { background: #f7f8fc; color: #111827; }
  .tl-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
  .tl-toolbar-left { display: flex; align-items: center; gap: 8px; }

  /* Pagination */
  .tl-pagination { display: flex; align-items: center; justify-content: space-between; padding: 16px 0 0; flex-wrap: wrap; gap: 10px; }
  .tl-pagination-info { font-size: 12.5px; color: #9ca3af; }
  .tl-pagination-btns { display: flex; align-items: center; gap: 4px; }
  .tl-page-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #f0f1f5; background: #fff; font-size: 13px; font-weight: 500; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; font-family: 'DM Sans',sans-serif; }
  .tl-page-btn:hover:not(:disabled) { background: #f7f8fc; color: #111827; }
  .tl-page-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; font-weight: 700; }
  .tl-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Mobile */
  @media (max-width: 640px) {
    .tl-page { padding: 16px; }
    .tl-page-title { font-size: 20px; }
    .tl-filters { flex-direction: column; gap: 8px; }
    .tl-search-wrap { width: 100%; }
    .tl-select { width: 100%; }
    .tl-item { flex-direction: column; gap: 10px; }
    .tl-item-top { flex-wrap: wrap; gap: 6px; }
    .tl-actions { flex-direction: row; flex-wrap: wrap; }
    .tl-toolbar { flex-direction: column; align-items: flex-start; }
    .tl-pagination { flex-direction: column; align-items: flex-start; }
  }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .sk-row { background:#fff; border:1px solid #f0f1f5; border-radius:12px; padding:18px 20px; margin-bottom:10px; }
  .sk-line { border-radius:6px; background:linear-gradient(90deg,#f0f1f5 25%,#e8eaf0 50%,#f0f1f5 75%); background-size:400px 100%; animation:shimmer 1.4s infinite; }

  /* Ticket rows */
  .tl-list { display: flex; flex-direction: column; gap: 10px; }

  .tl-item {
    background: #fff;
    border: 1px solid #f0f1f5;
    border-radius: 14px;
    padding: 20px 22px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    position: relative;
    overflow: hidden;
  }

  .tl-item::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    border-radius: 14px 0 0 14px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .tl-item:hover {
    border-color: #e5e7eb;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }

  .tl-item:hover::before { opacity: 1; }

  .tl-item.status-open::before { background: #f59e0b; }
  .tl-item.status-in-progress::before { background: #3b82f6; }
  .tl-item.status-resolved::before { background: #10b981; }
  .tl-item.status-closed::before { background: #9ca3af; }

  .tl-item-body { flex: 1; min-width: 0; }

  .tl-item-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .tl-item-title {
    font-family: 'Sora', sans-serif;
    font-size: 14.5px;
    font-weight: 600;
    color: #111827;
    letter-spacing: -0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 480px;
  }

  .tl-desc {
    font-size: 13px;
    color: #9ca3af;
    margin-bottom: 14px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tl-meta {
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
  }

  .tl-meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #9ca3af;
  }

  /* Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.1px;
    white-space: nowrap;
  }

  .badge-dot { width: 5px; height: 5px; border-radius: 50%; }

  .badge-open { background: #fffbeb; color: #b45309; }
  .badge-open .badge-dot { background: #f59e0b; }
  .badge-in-progress { background: #eff6ff; color: #1d4ed8; }
  .badge-in-progress .badge-dot { background: #3b82f6; }
  .badge-resolved { background: #ecfdf5; color: #065f46; }
  .badge-resolved .badge-dot { background: #10b981; }
  .badge-closed { background: #f3f4f6; color: #4b5563; }
  .badge-closed .badge-dot { background: #9ca3af; }

  .badge-urgent { background: #fef2f2; color: #991b1b; }
  .badge-high { background: #fff7ed; color: #9a3412; }
  .badge-medium { background: #fffbeb; color: #92400e; }
  .badge-low { background: #f0fdf4; color: #166534; }

  /* IT actions */
  .tl-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }

  .tl-action-select {
    height: 34px;
    padding: 0 28px 0 10px;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    font-size: 12.5px;
    font-family: 'DM Sans', sans-serif;
    color: #374151;
    background: #f9fafb;
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    transition: all 0.2s;
  }

  .tl-action-select:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }

  /* SLA chip */
  .sla-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid transparent;
    font-family: 'DM Sans', sans-serif;
  }
`;

/** Ticks every minute so SLA countdowns stay live */
function useTick(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Small inline SLA chip shown in ticket rows */
function SLAChip({ sla }: { sla: SLAInfo }) {
  if (!sla.isActive) return null;
  const c = SLA_COLORS[sla.status];
  return (
    <span
      className="sla-chip"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
      title={`SLA: ${sla.label} (limite ${sla.limitH}h)`}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {sla.status === 'overdue'
          ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
          : <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
      </svg>
      {sla.label}
    </span>
  );
}

export function TicketList({ tickets, userRole, userEmail, isLoading = false, technicians, onTicketSelect, onStatusUpdate, onAddTecnico, onRemoveTecnico }: TicketListProps) {
  const now = useTick();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const filteredTickets = tickets.filter(ticket => {
    if (userRole === 'client' && ticket.submittedBy !== userEmail) return false;
    if (searchTerm && !ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) && !ticket.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    if (dateFrom) { const from = new Date(dateFrom); from.setHours(0,0,0,0); if (ticket.createdAt < from) return false; }
    if (dateTo) { const to = new Date(dateTo); to.setHours(23,59,59,999); if (ticket.createdAt > to) return false; }
    return true;
  }).sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? -diff : diff;
  });

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTickets = filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const exportCSV = () => {
    const header = ['ID', 'Título', 'Status', 'Prioridade', 'Categoria', 'Criado por', 'Data'];
    const rows = filteredTickets.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.category,
      t.submittedBy,
      new Intl.DateTimeFormat('pt-BR').format(t.createdAt),
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'chamados.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);

  const getStatusClass = (s: string) => ({ open: 'badge-open', 'in-progress': 'badge-in-progress', resolved: 'badge-resolved', closed: 'badge-closed' }[s] || 'badge-closed');
  const getStatusLabel = (s: string) => ({ open: 'Aberto', 'in-progress': 'Em Progresso', resolved: 'Resolvido', closed: 'Fechado' }[s] || s);
  const getPriorityClass = (p: string) => ({ urgent: 'badge-urgent', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[p] || '');
  const getPriorityLabel = (p: string) => ({ urgent: 'Urgente', high: 'Alto', medium: 'Médio', low: 'Baixo' }[p] || p);

  return (
    <>
      <style>{styles}</style>
      <div className="tl-page">
        <h1 className="tl-page-title">Chamados</h1>
        <p className="tl-page-sub">{userRole === 'client' ? 'Seus chamados enviados à equipe de TI' : 'Todos os chamados do sistema'}</p>

        <div className="tl-filters">
          <div className="tl-search-wrap">
            <svg className="tl-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="tl-search" type="text" placeholder="Pesquisar chamados..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <select className="tl-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Todos os status</option>
            <option value="open">Aberto</option>
            <option value="in-progress">Em Progresso</option>
            <option value="resolved">Resolvido</option>
            <option value="closed">Fechado</option>
          </select>
          <select className="tl-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="all">Todas prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alto</option>
            <option value="medium">Médio</option>
            <option value="low">Baixo</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            title="De"
            style={{ height: 38, border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '0 10px', fontSize: 13, color: dateFrom ? '#111827' : '#9ca3af', fontFamily: 'DM Sans, sans-serif', background: '#fff', cursor: 'pointer', outline: 'none' }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            title="Até"
            style={{ height: 38, border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '0 10px', fontSize: 13, color: dateTo ? '#111827' : '#9ca3af', fontFamily: 'DM Sans, sans-serif', background: '#fff', cursor: 'pointer', outline: 'none' }}
          />
          <button
            className={`tl-sort-btn${sortOrder === 'oldest' ? ' active' : ''}`}
            onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
            title={sortOrder === 'newest' ? 'Mais recentes primeiro — clique para inverter' : 'Mais antigos primeiro — clique para inverter'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {sortOrder === 'newest'
                ? <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
                : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>}
            </svg>
            {sortOrder === 'newest' ? 'Mais recentes' : 'Mais antigos'}
          </button>
        </div>

        <div className="tl-toolbar">
          <div className="tl-toolbar-left">
            <span className="tl-count">{filteredTickets.length} chamado{filteredTickets.length !== 1 ? 's' : ''}</span>
          </div>
          <button className="tl-export-btn" onClick={exportCSV} title="Exportar lista para CSV">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar CSV
          </button>
        </div>


        {isLoading ? (
          <div>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="sk-row">
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                  <div className="sk-line" style={{height:14,width:'45%'}} />
                  <div className="sk-line" style={{height:14,width:'12%'}} />
                </div>
                <div className="sk-line" style={{height:11,width:'70%',marginBottom:8}} />
                <div style={{display:'flex',gap:8}}>
                  <div className="sk-line" style={{height:11,width:'10%'}} />
                  <div className="sk-line" style={{height:11,width:'8%'}} />
                  <div className="sk-line" style={{height:11,width:'15%'}} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="tl-empty">
            <div className="tl-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            </div>
            <p className="tl-empty-title">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || dateFrom || dateTo
                ? 'Nenhum resultado encontrado'
                : userRole === 'client' ? 'Você ainda não tem chamados' : 'Nenhum chamado no sistema'}
            </p>
            <p className="tl-empty-sub">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || dateFrom || dateTo
                ? 'Tente ajustar os filtros ou limpar a pesquisa.'
                : userRole === 'client' ? 'Clique em "Enviar Chamado" para abrir seu primeiro chamado.' : 'Os chamados aparecerão aqui assim que forem criados.'}
            </p>
          </div>
        ) : (
          <div className="tl-list">
            {pagedTickets.map(ticket => (
              <div key={ticket.id} className={`tl-item status-${ticket.status}`} onClick={() => onTicketSelect(ticket)}>
                <div className="tl-item-body">
                  <div className="tl-item-top">
                    <span className="tl-item-title">{ticket.title}</span>
                    <span className={`badge ${getStatusClass(ticket.status)}`}>
                      <span className="badge-dot" />
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span className={`badge ${getPriorityClass(ticket.priority)}`}>{getPriorityLabel(ticket.priority)}</span>
                    <SLAChip sla={computeSLA(ticket.priority, ticket.status, ticket.createdAt, now)} />
                  </div>
                  <p className="tl-desc">{ticket.description}</p>
                  <div className="tl-meta">
                    <span className="tl-meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {userRole === 'it-executive' ? ticket.submittedBy.split('@')[0] : 'Você'}
                    </span>
                    <span className="tl-meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {formatDate(ticket.createdAt)}
                    </span>
                    {ticket.tecnicos && ticket.tecnicos.length > 0 && (
                      <span className="tl-meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span style={{color:'#6366f1'}}>{ticket.tecnicos.map((t: any) => t.nome).join(', ')}</span>
                      </span>
                    )}
                    <span className="tl-meta-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {ticket.comments.length} comentário{ticket.comments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {userRole === 'it-executive' && (
                  <div className="tl-actions" onClick={e => e.stopPropagation()}>
                    <select className="tl-action-select" value={ticket.status} onChange={e => onStatusUpdate(ticket.id, e.target.value as Ticket['status'])}>
                      <option value="open">Aberto</option>
                      <option value="in-progress">Em Progresso</option>
                      <option value="resolved">Resolvido</option>
                      <option value="closed">Fechado</option>
                    </select>
                    {(ticket.tecnicos || []).map((tc: any) => (
                      <span key={tc.id} style={{display:'inline-flex',alignItems:'center',gap:4,background:'#eef2ff',color:'#4f46e5',borderRadius:20,padding:'3px 8px',fontSize:11.5,fontWeight:600,whiteSpace:'nowrap'}}>
                        {tc.nome}
                        <button onClick={() => onRemoveTecnico(ticket.id, tc.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#6366f1',padding:0,lineHeight:1,fontSize:13,marginLeft:2}}>✕</button>
                      </span>
                    ))}
                    <select
                      className="tl-action-select"
                      value=""
                      onChange={e => { if (e.target.value) onAddTecnico(ticket.id, Number(e.target.value)); }}
                    >
                      <option value="">+ Técnico</option>
                      {technicians.filter(t => !(ticket.tecnicos || []).find((tc: any) => tc.id === t.id)).map(t => (
                        <option key={t.id} value={String(t.id)}>{t.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="tl-pagination">
            <span className="tl-pagination-info">
              Mostrando {Math.min((safePage - 1) * PAGE_SIZE + 1, filteredTickets.length)}–{Math.min(safePage * PAGE_SIZE, filteredTickets.length)} de {filteredTickets.length}
            </span>
            <div className="tl-pagination-btns">
              <button className="tl-page-btn" disabled={safePage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {Array.from({length: totalPages}, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number|string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx-1] as number) > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => (
                  typeof p === 'string'
                    ? <span key={`e${i}`} style={{padding:'0 4px',color:'#9ca3af',fontSize:13}}>…</span>
                    : <button key={p} className={`tl-page-btn${safePage === p ? ' active' : ''}`} onClick={() => setCurrentPage(p as number)}>{p}</button>
                ))
              }
              <button className="tl-page-btn" disabled={safePage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}