import { useState } from 'react';
import { Ticket } from './TicketForm';

interface TicketDetailProps {
  ticket: Ticket;
  userRole: 'client' | 'it-executive';
  userEmail: string;
  onBack: () => void;
  onAddComment: (ticketId: string, comment: string, isInternal: boolean) => void;
  onStatusUpdate: (ticketId: string, status: Ticket['status']) => void;
  technicians: { id: number; nome: string; email: string }[];
  onAddTecnico: (ticketId: string, userId: number) => void;
  onRemoveTecnico: (ticketId: string, userId: number) => void;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');

  .td-root { animation: fadeUp 0.3s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* Back button */
  .td-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-bottom: 20px;
    transition: color 0.18s;
  }

  .td-back:hover { color: #111827; }

  /* Page header */
  .td-header { margin-bottom: 28px; }

  .td-badges { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
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

  .td-title {
    font-family: 'Sora', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #0f1117;
    letter-spacing: -0.4px;
    line-height: 1.25;
  }

  /* Layout */
  .td-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }

  /* Cards */
  .td-card {
    background: #fff;
    border: 1px solid #f0f1f5;
    border-radius: 14px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .td-card-header {
    padding: 16px 22px;
    border-bottom: 1px solid #f7f8fc;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .td-card-title {
    font-family: 'Sora', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }

  .td-card-body { padding: 22px; }

  .td-desc { font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap; }

  /* Comments */
  .td-comment-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }

  .td-comment {
    display: flex;
    gap: 12px;
    animation: fadeUp 0.25s ease both;
  }

  .td-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
    color: #fff;
  }

  .td-avatar-me { background: linear-gradient(135deg, #6366f1, #818cf8); }
  .td-avatar-other { background: linear-gradient(135deg, #0ea5e9, #38bdf8); }

  .td-comment-bubble {
    flex: 1;
    background: #f9fafb;
    border: 1px solid #f0f1f5;
    border-radius: 12px;
    padding: 12px 14px;
  }

  .td-comment-bubble.internal {
    background: #fefce8;
    border-color: #fef08a;
  }

  .td-comment-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .td-comment-author { font-size: 13px; font-weight: 600; color: #111827; }
  .td-comment-time { font-size: 11.5px; color: #9ca3af; margin-left: auto; }

  .td-internal-tag {
    font-size: 10px;
    font-weight: 600;
    background: #fef9c3;
    border: 1px solid #fde68a;
    color: #713f12;
    padding: 1px 7px;
    border-radius: 10px;
    letter-spacing: 0.3px;
  }

  .td-comment-text { font-size: 13.5px; color: #374151; line-height: 1.6; }

  .td-empty-comments { text-align: center; padding: 24px 0; font-size: 13px; color: #9ca3af; }

  /* Comment input */
  .td-comment-form { border-top: 1px solid #f0f1f5; padding-top: 18px; }

  .td-comment-textarea {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    font-size: 13.5px;
    font-family: 'DM Sans', sans-serif;
    color: #111827;
    background: #fafbfc;
    outline: none;
    transition: all 0.2s;
    resize: none;
    min-height: 88px;
    line-height: 1.6;
    box-sizing: border-box;
  }

  .td-comment-textarea::placeholder { color: #c4c9d4; }
  .td-comment-textarea:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }

  .td-comment-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    gap: 12px;
  }

  .td-internal-toggle {
    display: flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    font-size: 12.5px;
    color: #6b7280;
    user-select: none;
  }

  .td-internal-toggle input { accent-color: #6366f1; }

  .td-btn-send {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    border: none;
    padding: 9px 18px;
    border-radius: 9px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 3px 10px rgba(99,102,241,0.25);
    white-space: nowrap;
  }

  .td-btn-send:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(99,102,241,0.35); }
  .td-btn-send:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

  /* Sidebar */
  .td-sidebar {}

  .td-info-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #f7f8fc;
  }

  .td-info-row:last-child { border-bottom: none; }

  .td-info-icon { color: #c4c9d4; margin-top: 1px; flex-shrink: 0; }
  .td-info-label { font-size: 11.5px; color: #9ca3af; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
  .td-info-value { font-size: 13.5px; color: #111827; font-weight: 500; }

  /* IT actions */
  .td-action-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.5px; }

  .td-select {
    width: 100%;
    height: 38px;
    padding: 0 32px 0 12px;
    border: 1.5px solid #e5e7eb;
    border-radius: 9px;
    font-size: 13.5px;
    font-family: 'DM Sans', sans-serif;
    color: #374151;
    background: #fafbfc;
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    transition: all 0.2s;
    margin-bottom: 14px;
  }

  .td-select:focus { border-color: #6366f1; background-color: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }

  /* Urgent help card */
  .td-urgent-card {
    background: #f0f4ff;
    border: 1px solid #c7d2fe;
    border-radius: 12px;
    padding: 16px;
  }

  .td-urgent-title { font-size: 13px; font-weight: 600; color: #3730a3; margin-bottom: 5px; }
  .td-urgent-text { font-size: 12.5px; color: #4338ca; line-height: 1.5; }
  .td-urgent-link { color: #4f46e5; font-weight: 600; text-decoration: none; }

  @media (max-width: 860px) {
    .td-layout { grid-template-columns: 1fr; }
    .td-sidebar { order: -1; }
  }
`;

export function TicketDetail({ ticket, userRole, userEmail, technicians, onBack, onAddComment, onStatusUpdate, onAddTecnico, onRemoveTecnico }: TicketDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const formatDate = (d: Date) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);

  const getStatusClass = (s: string) => ({ open: 'badge-open', 'in-progress': 'badge-in-progress', resolved: 'badge-resolved', closed: 'badge-closed' }[s] || 'badge-closed');
  const getStatusLabel = (s: string) => ({ open: 'Aberto', 'in-progress': 'Em Progresso', resolved: 'Resolvido', closed: 'Fechado' }[s] || s);
  const getPriorityClass = (p: string) => ({ urgent: 'badge-urgent', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[p] || '');
  const getPriorityLabel = (p: string) => ({ urgent: 'Urgente', high: 'Alto', medium: 'Médio', low: 'Baixo' }[p] || p);

  const getInitials = (email: string) => email.split('@')[0].slice(0, 2).toUpperCase();

  const visibleComments = ticket.comments.filter(c => userRole === 'it-executive' || !c.isInternal);

  const handleSend = () => {
    if (!newComment.trim()) return;
    onAddComment(ticket.id, newComment.trim(), isInternal);
    setNewComment('');
    setIsInternal(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="td-root">
        <button className="td-back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar aos chamados
        </button>

        <div className="td-header">
          <div className="td-badges">
            <span className={`badge ${getStatusClass(ticket.status)}`}>
              <span className="badge-dot" /> {getStatusLabel(ticket.status)}
            </span>
            <span className={`badge ${getPriorityClass(ticket.priority)}`}>{getPriorityLabel(ticket.priority)}</span>
            <span style={{fontSize:'12px', color:'#9ca3af', marginLeft:'4px'}}># {ticket.id}</span>
          </div>
          <h1 className="td-title">{ticket.title}</h1>
        </div>

        <div className="td-layout">
          {/* Main content */}
          <div>
            <div className="td-card">
              <div className="td-card-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span className="td-card-title">Descrição</span>
              </div>
              <div className="td-card-body">
                <p className="td-desc">{ticket.description}</p>
              </div>
            </div>

            <div className="td-card">
              <div className="td-card-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="td-card-title">Comentários</span>
                <span style={{marginLeft:'auto', fontSize:'12px', color:'#9ca3af'}}>{visibleComments.length}</span>
              </div>
              <div className="td-card-body">
                {visibleComments.length === 0 ? (
                  <p className="td-empty-comments">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                ) : (
                  <div className="td-comment-list">
                    {visibleComments.map(comment => {
                      const isMe = comment.author === userEmail;
                      return (
                        <div key={comment.id} className="td-comment">
                          <div className={`td-avatar ${isMe ? 'td-avatar-me' : 'td-avatar-other'}`}>
                            {getInitials(comment.author)}
                          </div>
                          <div className={`td-comment-bubble ${comment.isInternal ? 'internal' : ''}`}>
                            <div className="td-comment-top">
                              <span className="td-comment-author">{isMe ? 'Você' : comment.author.split('@')[0]}</span>
                              {comment.isInternal && userRole === 'it-executive' && <span className="td-internal-tag">Interno</span>}
                              <span className="td-comment-time">{formatDate(comment.timestamp)}</span>
                            </div>
                            <p className="td-comment-text">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="td-comment-form">
                  <textarea
                    className="td-comment-textarea"
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    rows={3}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
                  />
                  <div className="td-comment-actions">
                    {userRole === 'it-executive' ? (
                      <label className="td-internal-toggle">
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                        Comentário interno (só visível para o TI)
                      </label>
                    ) : <div />}
                    <button className="td-btn-send" onClick={handleSend} disabled={!newComment.trim()}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      Comentar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="td-sidebar">
            <div className="td-card" style={{marginBottom:'16px'}}>
              <div className="td-card-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span className="td-card-title">Informações</span>
              </div>
              <div className="td-card-body" style={{padding:'16px 20px'}}>
                <div className="td-info-row">
                  <svg className="td-info-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <div><p className="td-info-label">Enviado por</p><p className="td-info-value">{ticket.submittedBy.split('@')[0]}</p></div>
                </div>
                <div className="td-info-row">
                  <svg className="td-info-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  <div><p className="td-info-label">Categoria</p><p className="td-info-value">{ticket.category}</p></div>
                </div>
                <div className="td-info-row">
                  <svg className="td-info-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <div><p className="td-info-label">Criado em</p><p className="td-info-value">{formatDate(ticket.createdAt)}</p></div>
                </div>
                <div className="td-info-row">
                  <svg className="td-info-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div><p className="td-info-label">Atualizado em</p><p className="td-info-value">{formatDate(ticket.updatedAt)}</p></div>
                </div>
                {ticket.tecnicos && ticket.tecnicos.length > 0 && (
                  <div className="td-info-row">
                    <svg className="td-info-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <div>
                      <p className="td-info-label">Técnicos</p>
                      <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>
                        {(ticket.tecnicos || []).map((tc: any) => (
                          <span key={tc.id} style={{display:'inline-flex',alignItems:'center',gap:4,background:'#eef2ff',color:'#4f46e5',borderRadius:20,padding:'3px 8px',fontSize:11.5,fontWeight:600}}>
                            {tc.nome}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {ticket.assetId && (
                  <div className="td-info-row" style={{marginTop:4}}>
                    <svg className="td-info-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <div>
                      <p className="td-info-label">Equipamento</p>
                      <p className="td-info-value" style={{color:'#0891b2', fontWeight:600}}>{ticket.assetNome || `Ativo #${ticket.assetId}`}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {userRole === 'it-executive' && (
              <div className="td-card" style={{marginBottom:'16px'}}>
                <div className="td-card-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <span className="td-card-title">Ações</span>
                </div>
                <div className="td-card-body" style={{padding:'16px 20px'}}>
                  <p className="td-action-label">Status</p>
                  <select className="td-select" value={ticket.status} onChange={e => onStatusUpdate(ticket.id, e.target.value as Ticket['status'])}>
                    <option value="open">Aberto</option>
                    <option value="in-progress">Em Progresso</option>
                    <option value="resolved">Resolvido</option>
                    <option value="closed">Fechado</option>
                  </select>
                  {true && (
                    <>
                      <p className="td-action-label">Técnicos</p>
                      {(ticket.tecnicos || []).map((tc: any) => (
                        <div key={tc.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#eef2ff',borderRadius:8,padding:'5px 10px',marginBottom:4}}>
                          <span style={{fontSize:12.5,fontWeight:600,color:'#4f46e5'}}>{tc.nome}</span>
                          <button onClick={() => onRemoveTecnico(ticket.id, tc.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:14,padding:0,lineHeight:1}}>✕</button>
                        </div>
                      ))}
                      <select
                        className="td-select"
                        value=""
                        onChange={e => { if (e.target.value) onAddTecnico(ticket.id, Number(e.target.value)); }}
                      >
                        <option value="">+ Adicionar técnico</option>
                        {technicians.filter(t => !(ticket.tecnicos || []).find((tc: any) => tc.id === t.id)).map(t => (
                          <option key={t.id} value={String(t.id)}>{t.nome}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>
            )}

            {userRole === 'client' && (
              <>
                <div className="td-card" style={{marginBottom:'16px'}}>
                  <div className="td-card-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    <span className="td-card-title">Meu chamado</span>
                  </div>
                  <div className="td-card-body" style={{padding:'16px 20px'}}>
                    {ticket.status !== 'closed' ? (
                      <>
                        <p style={{fontSize:12.5,color:'#6b7280',marginBottom:10,lineHeight:1.5}}>Problema resolvido? Feche o chamado para informar a equipe de TI.</p>
                        <button
                          onClick={() => onStatusUpdate(ticket.id, 'resolved')}
                          style={{width:'100%',height:38,background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Fechar chamado
                        </button>
                      </>
                    ) : (
                      <>
                        <p style={{fontSize:12.5,color:'#6b7280',marginBottom:10,lineHeight:1.5}}>Problema voltou? Reabra o chamado para notificar a equipe.</p>
                        <button
                          onClick={() => onStatusUpdate(ticket.id, 'open')}
                          style={{width:'100%',height:38,background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.1"/></svg>
                          Reabrir chamado
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="td-urgent-card">
                  <p className="td-urgent-title">🔴 Precisa de ajuda urgente?</p>
                  <p className="td-urgent-text">Entre em contato diretamente com o TI: <a className="td-urgent-link" href="mailto:suporteTi@email.com.br">suporteTi@email.com.br</a></p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}