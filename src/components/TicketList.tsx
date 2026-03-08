import { useState } from 'react';
import { Ticket } from './TicketForm';

interface TicketListProps {
  tickets: Ticket[];
  userRole: 'client' | 'it-executive';
  userEmail: string;
  onTicketSelect: (ticket: Ticket) => void;
  onStatusUpdate: (ticketId: string, status: Ticket['status']) => void;
  onAssignTicket: (ticketId: string, assignee: string) => void;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@700&display=swap');

  .tl-page { 
    font-family: 'Inter', sans-serif;
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    animation: tl-fadeUp 0.4s ease-out;
  }

  @keyframes tl-fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tl-header { margin-bottom: 32px; }
  
  .tl-title {
    font-family: 'Sora', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 6px 0;
  }

  .tl-sub { color: #64748b; font-size: 15px; margin: 0; }

  /* Filtros Modernos */
  .tl-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .tl-search-container {
    position: relative;
    flex: 1;
    min-width: 280px;
  }

  .tl-search-input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    transition: all 0.2s;
  }

  .tl-search-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .tl-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
  }

  .tl-filter-select {
    padding: 10px 32px 10px 12px;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    color: #475569;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  /* Listagem */
  .tl-list { display: flex; flex-direction: column; gap: 12px; }

  .tl-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 20px;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
  }

  .tl-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  .tl-card-main { min-width: 0; }

  .tl-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .tl-ticket-title {
    font-weight: 600;
    font-size: 16px;
    color: #1e293b;
    margin-right: 4px;
  }

  .tl-ticket-desc {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 12px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Badges */
  .badge {
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .b-status-open { background: #fef3c7; color: #92400e; }
  .b-status-in-progress { background: #dbeafe; color: #1e40af; }
  .b-status-resolved { background: #dcfce7; color: #166534; }
  .b-status-closed { background: #f1f5f9; color: #475569; }

  .b-priority-urgent { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
  .b-priority-high { color: #ea580c; }
  .b-priority-medium { color: #d97706; }
  .b-priority-low { color: #64748b; }

  .tl-card-footer {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #94a3b8;
  }

  .tl-footer-item { display: flex; align-items: center; gap: 5px; }

  /* IT Actions */
  .tl-it-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 20px;
    border-left: 1px solid #f1f5f9;
  }

  .tl-it-select {
    padding: 6px 24px 6px 8px;
    font-size: 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background-color: #f8fafc;
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .tl-card { grid-template-columns: 1fr; }
    .tl-it-actions { border-left: none; padding-left: 0; flex-direction: row; }
  }
`;

export function TicketList({ tickets, userRole, userEmail, onTicketSelect, onStatusUpdate, onAssignTicket }: TicketListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const itExecutives = ['john.doe@company.com', 'jane.smith@company.com', 'mike.wilson@company.com'];

  const filteredTickets = tickets.filter(ticket => {
    const matchesUser = userRole === 'client' 
      ? (ticket.submittedBy || '').toLowerCase() === userEmail.toLowerCase()
      : true;
    
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesUser && matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  };

  const statusMap = {
    open: { label: 'Aberto', class: 'b-status-open' },
    'in-progress': { label: 'Em Atendimento', class: 'b-status-in-progress' },
    resolved: { label: 'Resolvido', class: 'b-status-resolved' },
    closed: { label: 'Fechado', class: 'b-status-closed' }
  };

  const priorityMap = {
    urgent: { label: 'Urgente', class: 'b-priority-urgent' },
    high: { label: 'Alta', class: 'b-priority-high' },
    medium: { label: 'Média', class: 'b-priority-medium' },
    low: { label: 'Baixa', class: 'b-priority-low' }
  };

  return (
    <div className="tl-page">
      <style>{styles}</style>
      
      <header className="tl-header">
        <h1 className="tl-title">Central de Chamados</h1>
        <p className="tl-sub">
          {userRole === 'it-executive' ? 'Gerenciamento global de tickets' : 'Acompanhe suas solicitações'}
        </p>
      </header>

      <div className="tl-controls">
        <div className="tl-search-container">
          <svg className="tl-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            className="tl-search-input" 
            placeholder="Pesquisar por título ou descrição..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select className="tl-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Todos os Status</option>
          <option value="open">Abertos</option>
          <option value="in-progress">Em Atendimento</option>
          <option value="resolved">Resolvidos</option>
          <option value="closed">Fechados</option>
        </select>

        <select className="tl-filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="all">Todas Prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
      </div>

      <div className="tl-list">
        {filteredTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b' }}>Nenhum chamado encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket.id} className="tl-card" onClick={() => onTicketSelect(ticket)}>
              <div className="tl-card-main">
                <div className="tl-card-header">
                  <span className="tl-ticket-title">{ticket.title}</span>
                  <span className={`badge ${statusMap[ticket.status].class}`}>
                    {statusMap[ticket.status].label}
                  </span>
                  <span className={`badge ${priorityMap[ticket.priority].class}`}>
                    {priorityMap[ticket.priority].label}
                  </span>
                </div>
                
                <p className="tl-ticket-desc">{ticket.description}</p>
                
                <div className="tl-card-footer">
                  <div className="tl-footer-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {formatDate(ticket.createdAt)}
                  </div>
                  <div className="tl-footer-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {ticket.comments.length}
                  </div>
                  <div className="tl-footer-item">
                    <span style={{ color: ticket.assignedTo ? '#6366f1' : '#94a3b8' }}>
                      ● {ticket.assignedTo ? `Resp: ${ticket.assignedTo.split('@')[0]}` : 'Sem responsável'}
                    </span>
                  </div>
                </div>
              </div>

              {userRole === 'it-executive' && (
                <div className="tl-it-actions" onClick={e => e.stopPropagation()}>
                  <select 
                    className="tl-it-select" 
                    value={ticket.status} 
                    onChange={e => onStatusUpdate(ticket.id, e.target.value as Ticket['status'])}
                  >
                    <option value="open">Aberto</option>
                    <option value="in-progress">Em Atendimento</option>
                    <option value="resolved">Resolvido</option>
                    <option value="closed">Fechado</option>
                  </select>

                  <select 
                    className="tl-it-select"
                    value={ticket.assignedTo || ""}
                    onChange={e => onAssignTicket(ticket.id, e.target.value)}
                  >
                    <option value="">Atribuir a...</option>
                    {itExecutives.map(exec => (
                      <option key={exec} value={exec}>{exec.split('@')[0]}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 