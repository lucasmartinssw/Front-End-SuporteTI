import { useState, useEffect, useRef } from 'react';
import { Ticket } from '../TicketForm/TicketForm';
import './TicketDetail.css';

interface TicketDetailProps {
  ticket: Ticket;
  userRole: 'client' | 'it-executive';
  userEmail: string;
  onBack: () => void;
  onAddComment: (ticketId: string, comment: string, isInternal: boolean, files?: File[]) => void | Promise<void>;
  onRefreshComments: (ticketId: string) => void;
  onStatusUpdate: (ticketId: string, status: Ticket['status']) => void;
  technicians: { id: number; nome: string; email: string }[];
  onAddTecnico: (ticketId: string, userId: number) => void;
  onRemoveTecnico: (ticketId: string, userId: number) => void;
}

export function TicketDetail({ ticket, userRole, userEmail, technicians, onBack, onAddComment, onRefreshComments, onStatusUpdate, onAddTecnico, onRemoveTecnico }: TicketDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const prevCommentCount = useRef(ticket.comments.length);

  // Polling: refresh comments every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onRefreshComments(ticket.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [ticket.id, onRefreshComments]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (ticket.comments.length > prevCommentCount.current) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCommentCount.current = ticket.comments.length;
  }, [ticket.comments.length]);

  const formatDate = (d: Date) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);

  const getStatusClass = (s: string) => ({ open: 'badge-open', 'in-progress': 'badge-in-progress', resolved: 'badge-resolved', closed: 'badge-closed' }[s] || 'badge-closed');
  const getStatusLabel = (s: string) => ({ open: 'Aberto', 'in-progress': 'Em Progresso', resolved: 'Resolvido', closed: 'Fechado' }[s] || s);
  const getPriorityClass = (p: string) => ({ urgent: 'badge-urgent', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[p] || '');
  const getPriorityLabel = (p: string) => ({ urgent: 'Urgente', high: 'Alto', medium: 'Médio', low: 'Baixo' }[p] || p);

  const getInitials = (email: string) => email.split('@')[0].slice(0, 2).toUpperCase();

  const visibleComments = ticket.comments.filter(c => userRole === 'it-executive' || !c.isInternal);

  const handleSend = async () => {
    if ((!newComment.trim() && attachedFiles.length === 0) || isSending) return;
    setIsSending(true);
    try {
      await onAddComment(ticket.id, newComment.trim(), isInternal, attachedFiles.length > 0 ? attachedFiles : undefined);
      setNewComment('');
      setIsInternal(false);
      setAttachedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
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
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="td-attachments">
                    {ticket.attachments.map(att => {
                      const isImage = att.type?.startsWith('image/');
                      return isImage ? (
                        <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer">
                          <img className="td-attach-img" src={att.url} alt={att.name} />
                        </a>
                      ) : (
                        <a key={att.id} className="td-attach-item" href={att.url} target="_blank" rel="noopener noreferrer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                          <span className="td-attach-name">{att.name}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
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
                    {visibleComments.map((comment, _idx) => {
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
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="td-msg-attachments">
                                {comment.attachments.map(att => {
                                  const isImage = att.type?.startsWith('image/');
                                  return isImage ? (
                                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer">
                                      <img className="td-msg-attach-img" src={att.url} alt={att.name} />
                                    </a>
                                  ) : (
                                    <a key={att.id} className="td-msg-attach-file" href={att.url} target="_blank" rel="noopener noreferrer">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                      <span>{att.name}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={commentsEndRef} />
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
                  {attachedFiles.length > 0 && (
                    <div className="td-file-preview">
                      {attachedFiles.map((file, idx) => {
                        const isImage = file.type.startsWith('image/');
                        return (
                          <div key={idx} className="td-file-chip">
                            {isImage ? (
                              <img className="td-file-chip-thumb" src={URL.createObjectURL(file)} alt={file.name} />
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            )}
                            <span className="td-file-chip-name">{file.name}</span>
                            <button className="td-file-chip-remove" onClick={() => removeFile(idx)}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="td-comment-actions">
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      {userRole === 'it-executive' && (
                        <label className="td-internal-toggle">
                          <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                          Interno
                        </label>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{display:'none'}}
                        onChange={handleFileSelect}
                      />
                      <button
                        type="button"
                        className="td-upload-btn"
                        title="Anexar arquivo"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                      </button>
                    </div>
                    <button className="td-btn-send" onClick={handleSend} disabled={isSending || (!newComment.trim() && attachedFiles.length === 0)}>
                      {isSending ? (
                        <><span className="td-spinner" /> Enviando...</>
                      ) : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Comentar</>
                      )}
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