import { useState } from 'react';
import { Ticket } from '../TicketForm/TicketForm';
import './TicketList.css';

interface TicketListProps {
  tickets: Ticket[];
  userRole: 'client' | 'it-executive';
  userEmail: string;
  technicians: { id: number; nome: string; email: string }[];
  onTicketSelect: (ticket: Ticket) => void;
  onStatusUpdate: (ticketId: string, status: Ticket['status']) => void;
  onAddTecnico: (ticketId: string, userId: number) => void;
  onRemoveTecnico: (ticketId: string, userId: number) => void;
}

export function TicketList({ tickets, userRole, userEmail, technicians, onTicketSelect, onStatusUpdate, onAddTecnico, onRemoveTecnico }: TicketListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredTickets = tickets.filter(ticket => {
    if (userRole === 'client' && ticket.submittedBy !== userEmail) return false;
    if (searchTerm && !ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) && !ticket.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    return true;
  });

  const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);

  const getStatusClass = (s: string) => ({ open: 'badge-open', 'in-progress': 'badge-in-progress', resolved: 'badge-resolved', closed: 'badge-closed' }[s] || 'badge-closed');
  const getStatusLabel = (s: string) => ({ open: 'Aberto', 'in-progress': 'Em Progresso', resolved: 'Resolvido', closed: 'Fechado' }[s] || s);
  const getPriorityClass = (p: string) => ({ urgent: 'badge-urgent', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[p] || '');
  const getPriorityLabel = (p: string) => ({ urgent: 'Urgente', high: 'Alto', medium: 'Médio', low: 'Baixo' }[p] || p);

  return (
    <>
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
          <span className="tl-count">{filteredTickets.length} chamado{filteredTickets.length !== 1 ? 's' : ''}</span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="tl-empty">
            <div className="tl-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="tl-empty-title">Nenhum chamado encontrado</p>
            <p className="tl-empty-sub">{userRole === 'client' ? 'Você ainda não enviou nenhum chamado.' : 'Nenhum chamado corresponde aos filtros aplicados.'}</p>
          </div>
        ) : (
          <div className="tl-list">
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className={`tl-item status-${ticket.status}`} onClick={() => onTicketSelect(ticket)}>
                <div className="tl-item-body">
                  <div className="tl-item-top">
                    <span className="tl-item-title">{ticket.title}</span>
                    <span className={`badge ${getStatusClass(ticket.status)}`}>
                      <span className="badge-dot" />
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span className={`badge ${getPriorityClass(ticket.priority)}`}>{getPriorityLabel(ticket.priority)}</span>
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
      </div>
    </>
  );
}