import { useState, useRef } from 'react';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  submittedBy: string;
  tecnicos?: { id: number; nome: string; email: string }[];
  assetId?: number;
  assetNome?: string;
  attachments?: Array<{ id: string; url: string; name: string; type: string }>;
  createdAt: Date;
  updatedAt: Date;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: Date;
    isInternal: boolean;
    attachments?: Array<{ id: string; url: string; name: string; type: string }>;
  }>;
  assets?: Array<{ id: number; nome: string; tipo: string; localizacao?: string }>;
}

interface AssetOption { id: number; nome: string; tipo: string; localizacao?: string; }

interface TicketFormProps {
  onSubmit: (ticket: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'comments'>, files?: File[]) => void;
  userEmail: string;
  assets?: AssetOption[];
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
  .tf-input.error, .tf-select.error, .tf-textarea.error { border-color: #fca5a5; background: #fff5f5; }
  .tf-input.error:focus, .tf-select.error:focus, .tf-textarea.error:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
  .tf-error-msg { font-size: 11.5px; color: #ef4444; margin-top: 5px; display: flex; align-items: center; gap: 4px; }

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


  /* Asset selector */
  .tf-asset-select-wrap { position: relative; }
  .tf-asset-search {
    width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px;
    font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; background: #fafbfc;
    outline: none; transition: all 0.2s; box-sizing: border-box;
  }
  .tf-asset-search::placeholder { color: #c4c9d4; }
  .tf-asset-search:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .tf-asset-dropdown {
    position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff;
    border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    z-index: 20; max-height: 200px; overflow-y: auto;
  }
  .tf-asset-option {
    padding: 9px 14px; cursor: pointer; transition: background 0.15s;
    display: flex; align-items: center; justify-content: space-between;
  }
  .tf-asset-option:hover { background: #f7f8fc; }
  .tf-asset-option-name { font-size: 13.5px; font-weight: 500; color: #111827; }
  .tf-asset-option-meta { font-size: 11.5px; color: #9ca3af; }
  .tf-asset-selected {
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    background: #eef2ff; border: 1.5px solid #c7d2fe; border-radius: 10px;
    font-size: 13px; font-weight: 500; color: #4f46e5;
  }
  .tf-asset-clear { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; margin-left: auto; }
  .tf-asset-clear:hover { color: #374151; }
  .tf-asset-none { padding: 10px 14px; font-size: 13px; color: #9ca3af; text-align: center; }

  /* File upload */
  .tf-upload-area {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    border: 1.5px dashed #d1d5db;
    border-radius: 10px;
    background: #fafbfc;
    cursor: pointer;
    transition: all 0.18s;
  }
  .tf-upload-area:hover { border-color: #6366f1; background: #eef2ff; }
  .tf-upload-area svg { flex-shrink: 0; }
  .tf-upload-text { font-size: 13px; color: #6b7280; }
  .tf-upload-text strong { color: #4f46e5; font-weight: 600; }
  .tf-file-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .tf-file-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 12px;
    color: #374151;
    font-weight: 500;
    max-width: 220px;
  }
  .tf-file-chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tf-file-chip-remove {
    background: none; border: none; cursor: pointer;
    color: #9ca3af; font-size: 14px; padding: 0; line-height: 1;
    transition: color 0.15s;
  }
  .tf-file-chip-remove:hover { color: #ef4444; }
  .tf-file-chip-thumb {
    width: 28px; height: 28px; border-radius: 4px;
    object-fit: cover; flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .tf-row { grid-template-columns: 1fr; }
    .tf-priority-grid { grid-template-columns: repeat(2, 1fr); }
    .tf-card { padding: 20px; }
  }
`;

const categories = ['Hardware', 'Software', 'Conexão com Internet', 'Acessos', 'Sistemas', 'Segurança', 'Impressora', 'Telefone/Celular', 'Outros'];

export function TicketForm({ onSubmit, userEmail, assets = [] }: TicketFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState('');
  const [assetId, setAssetId] = useState<number | undefined>(undefined);
  const [assetNome, setAssetNome] = useState('');
  const [assetSearch, setAssetSearch] = useState('');
  const [assetDropdown, setAssetDropdown] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string,string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string,string> = {};
    if (!title.trim()) errs.title = 'Breve descrição é obrigatória.';
    else if (title.trim().length < 5) errs.title = 'Mínimo de 5 caracteres.';
    if (!category) errs.category = 'Selecione uma categoria.';
    if (!description.trim()) errs.description = 'Descrição detalhada é obrigatória.';
    else if (description.trim().length < 10) errs.description = 'Mínimo de 10 caracteres.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit({ title: title.trim(), description: description.trim(), priority, category, submittedBy: userEmail, assetId, assetNome: assetNome || undefined }, files.length > 0 ? files : undefined);
    setTitle(''); setDescription(''); setPriority('medium'); setCategory(''); setAssetId(undefined); setAssetNome(''); setAssetSearch(''); setFiles([]); setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              <input className={`tf-input${errors.title ? ' error' : ''}`} type="text" value={title} onChange={e => { setTitle(e.target.value); if(errors.title) setErrors(p=>({...p,title:''})); }} placeholder="Descreva brevemente o problema ou solicitação" />
              {errors.title && <p className="tf-error-msg"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{errors.title}</p>}
            </div>

            <div className="tf-row tf-field">
              <div>
                <label className="tf-label">Categoria <span>*</span></label>
                <select className={`tf-select${errors.category ? ' error' : ''}`} value={category} onChange={e => { setCategory(e.target.value); if(errors.category) setErrors(p=>({...p,category:''})); }}>
                  <option value="">Selecione a categoria</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="tf-error-msg"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{errors.category}</p>}
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
              <textarea className={`tf-textarea${errors.description ? ' error' : ''}`} value={description} onChange={e => { setDescription(e.target.value); if(errors.description) setErrors(p=>({...p,description:''})); }} placeholder="Descreva detalhadamente o que está ocorrendo, incluindo mensagens de erro, quando começou e qualquer informação relevante..." />
              {errors.description && <p className="tf-error-msg"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{errors.description}</p>}
            </div>

            {/* Asset selector */}
            <div className="tf-field">
              <label className="tf-label">Equipamento relacionado</label>
              <div className="tf-asset-select-wrap">
                {assetId ? (
                  <div className="tf-asset-selected">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    {assetNome}
                    <button type="button" className="tf-asset-clear" onClick={() => { setAssetId(undefined); setAssetNome(''); setAssetSearch(''); }}>×</button>
                  </div>
                ) : (
                  <>
                    <input
                      className="tf-asset-search"
                      placeholder="Buscar equipamento (opcional)..."
                      value={assetSearch}
                      onChange={e => { setAssetSearch(e.target.value); setAssetDropdown(true); }}
                      onFocus={() => setAssetDropdown(true)}
                      onBlur={() => setTimeout(() => setAssetDropdown(false), 50)}
                    />
                    {assetDropdown && (
                      <div className="tf-asset-dropdown">
                        {assets.filter(a => !assetSearch || a.nome.toLowerCase().includes(assetSearch.toLowerCase())).length === 0 ? (
                          <div className="tf-asset-none">Nenhum equipamento encontrado</div>
                        ) : assets.filter(a => !assetSearch || a.nome.toLowerCase().includes(assetSearch.toLowerCase())).map(a => (
                          <div key={a.id} className="tf-asset-option" onMouseDown={() => { setAssetId(a.id); setAssetNome(a.nome); setAssetDropdown(false); setAssetSearch(''); }}>
                            <div>
                              <div className="tf-asset-option-name">{a.nome}</div>
                              <div className="tf-asset-option-meta">{a.tipo}{a.localizacao ? ` · ${a.localizacao}` : ''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* File upload */}
            <div className="tf-field">
              <label className="tf-label">Anexos</label>
              <input id="tf-file-input" ref={fileInputRef} type="file" multiple style={{display:'none'}} onChange={handleFileSelect} />
              <label htmlFor="tf-file-input" className="tf-upload-area" style={{cursor:'pointer'}} onMouseDown={() => setAssetDropdown(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                <span className="tf-upload-text"><strong>Clique para anexar</strong> ou arraste arquivos aqui</span>
              </label>
              {files.length > 0 && (
                <div className="tf-file-list">
                  {files.map((file, idx) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                      <div key={idx} className="tf-file-chip">
                        {isImage ? (
                          <img className="tf-file-chip-thumb" src={URL.createObjectURL(file)} alt={file.name} />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        )}
                        <span className="tf-file-chip-name">{file.name}</span>
                        <button type="button" className="tf-file-chip-remove" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
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