import { useState } from 'react';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  submittedBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: Date;
    isInternal: boolean;
  }>;
}

interface TicketFormProps {
  onSubmit: (ticket: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
  userEmail: string;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');

  .tf-wrap {
    max-width: 640px;
    animation: fadeUp 0.3s ease both;
  }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .tf-heading { margin-bottom: 28px; }

  .tf-title {
    font-family: 'Sora', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #0f1117;
    letter-spacing: -0.4px;
    margin-bottom: 4px;
  }

  .tf-sub { font-size: 13.5px; color: #9ca3af; }

  .tf-card {
    background: #fff;
    border: 1px solid #f0f1f5;
    border-radius: 16px;
    padding: 32px;
  }

  .tf-field { margin-bottom: 22px; }

  .tf-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
    letter-spacing: 0.1px;
  }

  .tf-label span { color: #6366f1; margin-left: 2px; }

  .tf-input, .tf-select, .tf-textarea {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #111827;
    background: #fafbfc;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .tf-input::placeholder, .tf-textarea::placeholder { color: #c4c9d4; }

  .tf-input:focus, .tf-select:focus, .tf-textarea:focus {
    border-color: #6366f1;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }

  .tf-textarea { resize: vertical; min-height: 130px; line-height: 1.6; }

  .tf-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
    cursor: pointer;
  }

  .tf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  /* Priority selector */
  .tf-priority-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }

  .tf-priority-btn {
    height: 40px;
    border-radius: 9px;
    border: 1.5px solid #e5e7eb;
    background: #fafbfc;
    font-size: 12.5px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.18s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #6b7280;
  }

  .tf-priority-btn:hover { border-color: #c7d2fe; }

  .tf-priority-btn.p-low.active { background: #f0fdf4; border-color: #86efac; color: #166534; }
  .tf-priority-btn.p-medium.active { background: #fffbeb; border-color: #fcd34d; color: #92400e; }
  .tf-priority-btn.p-high.active { background: #fff7ed; border-color: #fdba74; color: #9a3412; }
  .tf-priority-btn.p-urgent.active { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }

  .tf-priority-dot { width: 7px; height: 7px; border-radius: 50%; }
  .p-low .tf-priority-dot { background: #22c55e; }
  .p-medium .tf-priority-dot { background: #f59e0b; }
  .p-high .tf-priority-dot { background: #f97316; }
  .p-urgent .tf-priority-dot { background: #ef4444; }

  /* Info box */
  .tf-info {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    background: #f0f4ff;
    border: 1px solid #c7d2fe;
    border-radius: 10px;
    margin-bottom: 22px;
  }

  .tf-info p { font-size: 13px; color: #3730a3; line-height: 1.5; }

  /* Submit */
  .tf-submit {
    width: 100%;
    height: 46px;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.2px;
    box-shadow: 0 4px 14px rgba(99,102,241,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .tf-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
  .tf-submit:active { transform: translateY(0); }

  @media (max-width: 600px) {
    .tf-row { grid-template-columns: 1fr; }
    .tf-priority-grid { grid-template-columns: repeat(2, 1fr); }
    .tf-card { padding: 20px; }
  }
`;

const categories = ['Hardware', 'Software', 'Conexão com Internet', 'Acessos', 'Sistemas', 'Segurança', 'Impressora', 'Telefone/Celular', 'Outros'];

export function TicketForm({ onSubmit, userEmail }: TicketFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) return;
    onSubmit({ title: title.trim(), description: description.trim(), priority, category, submittedBy: userEmail });
    setTitle(''); setDescription(''); setPriority('medium'); setCategory('');
  };

  const priorities = [
    { value: 'low', label: 'Baixo', cls: 'p-low' },
    { value: 'medium', label: 'Médio', cls: 'p-medium' },
    { value: 'high', label: 'Alto', cls: 'p-high' },
    { value: 'urgent', label: 'Urgente', cls: 'p-urgent' },
  ] as const;

  return (
    <>
      <style>{styles}</style>
      <div className="tf-wrap">
        <div className="tf-heading">
          <h1 className="tf-title">Novo Chamado</h1>
          <p className="tf-sub">Preencha os dados abaixo para abrir um chamado com a equipe de TI</p>
        </div>

        <div className="tf-card">
          <form onSubmit={handleSubmit}>
            <div className="tf-field">
              <label className="tf-label">Breve Descrição <span>*</span></label>
              <input className="tf-input" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Descreva brevemente o problema ou solicitação" required />
            </div>

            <div className="tf-row tf-field">
              <div>
                <label className="tf-label">Categoria <span>*</span></label>
                <select className="tf-select" value={category} onChange={e => setCategory(e.target.value)} required>
                  <option value="">Selecione a categoria</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="tf-label">Prioridade <span>*</span></label>
                <div className="tf-priority-grid">
                  {priorities.map(p => (
                    <button key={p.value} type="button" className={`tf-priority-btn ${p.cls} ${priority === p.value ? 'active' : ''}`} onClick={() => setPriority(p.value)}>
                      <span className="tf-priority-dot" />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="tf-field">
              <label className="tf-label">Descrição detalhada <span>*</span></label>
              <textarea className="tf-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva detalhadamente o que está ocorrendo, incluindo mensagens de erro, quando começou e qualquer informação relevante..." required />
            </div>

            <div className="tf-info">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0, marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <p>Quanto mais detalhes você fornecer, mais rápido nossa equipe poderá resolver seu chamado.</p>
            </div>

            <button type="submit" className="tf-submit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Enviar Chamado
            </button>
          </form>
        </div>
      </div>
    </>
  );
}