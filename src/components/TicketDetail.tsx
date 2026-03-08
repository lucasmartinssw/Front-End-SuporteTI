import { useState } from 'react';
import { Ticket } from './TicketForm';

interface TicketDetailProps {
  ticket: Ticket;
  userRole: 'client' | 'it-executive';
  userEmail: string;
  onBack: () => void;
  onAddComment: (ticketId: string, comment: string, isInternal: boolean, files?: File[]) => void;
  onStatusUpdate: (ticketId: string, status: Ticket['status']) => void;
  onAssignTicket: (ticketId: string, assignee: string) => void;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&display=swap');

  .td-root { 
    animation: fadeIn 0.4s ease-out; 
    font-family: 'Inter', sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    color: #1e293b;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  /* Navigation */
  .td-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    transition: all 0.2s;
  }
  .td-back:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }

  /* Header Section */
  .td-header { margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; }
  .td-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
  .td-title {
    font-family: 'Sora', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin: 8px 0;
  }

  /* Badges Modernizados */
  .badge {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .badge-open { background: #fef3c7; color: #92400e; }
  .badge-in-progress { background: #dbeafe; color: #1e40af; }
  .badge-resolved { background: #dcfce7; color: #166534; }
  .badge-urgent { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

  /* Layout */
  .td-grid { display: grid; grid-template-columns: 1fr 340px; gap: 32px; }

  /* Cards Modernos */
  .td-section { margin-bottom: 32px; }
  .td-section-label { 
    font-size: 13px; 
    font-weight: 700; 
    color: #64748b; 
    text-transform: uppercase; 
    letter-spacing: 0.05em;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .td-content-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .td-description-text {
    font-size: 15px;
    line-height: 1.6;
    color: #334155;
    white-space: pre-wrap;
  }

  /* Timeline de Comentários */
  .td-thread { position: relative; padding-left: 20px; }
  .td-thread::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 0;
    width: 2px;
    background: #f1f5f9;
  }

  .td-comment-item { margin-bottom: 24px; position: relative; }
  .td-comment-item::before {
    content: '';
    position: absolute;
    left: -24px;
    top: 12px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #cbd5e1;
    border: 2px solid #fff;
  }

  .td-comment-bubble {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
  }
  .td-comment-bubble.internal { background: #fffbeb; border-color: #fef3c7; }

  .td-comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
  .td-author-name { fontWeight: 600; color: #1e293b; }
  .td-date { color: #94a3b8; font-size: 12px; }

  /* Input de Comentário Profissional */
  .td-composer {
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 16px;
    transition: border-color 0.2s;
  }
  .td-composer:focus-within { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
  
  .td-textarea {
    width: 100%;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: 14px;
    resize: none;
    color: #1e293b;
    min-height: 100px;
  }

  /* Sidebar Actions */
  .td-sidebar-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
  }

  .td-info-group { margin-bottom: 20px; }
  .td-info-key { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
  .td-info-val { font-size: 14px; color: #1e293b; font-weight: 500; }

  .td-select-custom {
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: white;
    font-size: 14px;
    margin-top: 8px;
    cursor: pointer;
  }

  .btn-submit {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s;
  }
  .btn-submit:hover { background: #4338ca; }
  .btn-submit:disabled { background: #94a3b8; }
`;

export function TicketDetail({ ticket, userRole, userEmail, onBack, onAddComment, onStatusUpdate, onAssignTicket }: TicketDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const formatDate = (d: Date) => new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  }).format(d);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setIsSending(true);
    await onAddComment(ticket.id, newComment.trim(), isInternal);
    setNewComment('');
    setIsSending(false);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="td-root">
        <button className="td-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Painel de Chamados
        </button>

        <header className="td-header">
          <div className="td-title-row">
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`badge badge-${ticket.status}`}>{ticket.status}</span>
                <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
                <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>#{ticket.id}</span>
              </div>
              <h1 className="td-title">{ticket.title}</h1>
            </div>
            {userRole === 'it-executive' && (
               <div style={{ textAlign: 'right' }}>
                  <p className="td-info-key">Status do Chamado</p>
                  <select 
                    className="td-select-custom" 
                    value={ticket.status} 
                    onChange={e => onStatusUpdate(ticket.id, e.target.value as any)}
                  >
                    <option value="open">Aberto</option>
                    <option value="in-progress">Em Atendimento</option>
                    <option value="resolved">Resolvido</option>
                    <option value="closed">Concluído</option>
                  </select>
               </div>
            )}
          </div>
        </header>

        <div className="td-grid">
          {/* Main Content */}
          <main>
            <section className="td-section">
              <label className="td-section-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Detalhes da Solicitação
              </label>
              <div className="td-content-card">
                <p className="td-description-text">{ticket.description}</p>
              </div>
            </section>

            <section className="td-section">
              <label className="td-section-label">Atividade e Comentários</label>
              <div className="td-thread">
                {ticket.comments.map((c, idx) => (
                  <div key={idx} className="td-comment-item">
                    <div className={`td-comment-bubble ${c.isInternal ? 'internal' : ''}`}>
                      <div className="td-comment-meta">
                        <span className="td-author-name">{c.author.split('@')[0]}</span>
                        <span className="td-date">{formatDate(c.timestamp)}</span>
                        {c.isInternal && <span className="badge" style={{fontSize: '9px', background: '#fef3c7'}}>Privado</span>}
                      </div>
                      <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="td-composer" style={{ marginTop: '24px' }}>
                <textarea 
                  className="td-textarea" 
                  placeholder="Digite sua mensagem aqui..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {userRole === 'it-executive' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                        Nota interna
                      </label>
                    )}
                  </div>
                  <button className="btn-submit" onClick={handleSend} disabled={isSending || !newComment.trim()}>
                    {isSending ? 'Enviando...' : 'Enviar Resposta'}
                  </button>
                </div>
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside>
            <div className="td-sidebar-box">
              <div className="td-info-group">
                <p className="td-info-key">Solicitante</p>
                <p className="td-info-val">{ticket.submittedBy}</p>
              </div>
              <div className="td-info-group">
                <p className="td-info-key">Departamento / Categoria</p>
                <p className="td-info-val">{ticket.category}</p>
              </div>
              <div className="td-info-group">
                <p className="td-info-key">Data de Abertura</p>
                <p className="td-info-val">{formatDate(ticket.createdAt)}</p>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />
              <div className="td-info-group">
                <p className="td-info-key">Responsável TI</p>
                {ticket.assignedTo ? (
                   <p className="td-info-val" style={{ color: '#4f46e5' }}>● {ticket.assignedTo.split('@')[0]}</p>
                ) : (
                   <p className="td-info-val" style={{ color: '#94a3b8', fontStyle: 'italic' }}>Aguardando atribuição</p>
                )}
              </div>
            </div>

            {userRole === 'client' && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                <p style={{ fontSize: '13px', color: '#1e40af', fontWeight: 600, marginBottom: '4px' }}>Precisa de ajuda urgente?</p>
                <p style={{ fontSize: '12px', color: '#60a5fa' }}>Ligue para o ramal 4002 ou envie e-mail para suporte@empresa.com</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}