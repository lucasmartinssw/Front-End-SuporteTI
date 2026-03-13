import { useState, useRef } from 'react';
import { Asset } from './AssetList';

interface AssetFormProps {
  onSubmit: (data: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'chamados' | 'responsavel_nome' | 'responsavel_email'>, files: File[]) => void;
  onCancel: () => void;
  initial?: Partial<Asset>;
  technicians?: { id: number; nome: string; email: string }[];
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');

  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .af-wrap { max-width: 680px; animation: fadeUp 0.3s ease both; }
  .af-heading { margin-bottom: 24px; }
  .af-title { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; color: #0f1117; letter-spacing: -0.4px; margin-bottom: 4px; }
  .af-sub { font-size: 13.5px; color: #9ca3af; }

  .af-card { background: #fff; border: 1px solid #f0f1f5; border-radius: 16px; padding: 32px; }

  .af-field { margin-bottom: 20px; }
  .af-label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 7px; }
  .af-label span { color: #6366f1; margin-left: 2px; }

  .af-input, .af-select, .af-textarea {
    width: 100%; padding: 10px 13px; border: 1.5px solid #e5e7eb; border-radius: 10px;
    font-size: 14px; font-family: 'DM Sans', sans-serif; color: #111827; background: #fafbfc;
    outline: none; transition: all 0.2s; box-sizing: border-box;
  }
  .af-input::placeholder, .af-textarea::placeholder { color: #c4c9d4; }
  .af-input.error, .af-select.error { border-color: #fca5a5; background: #fff5f5; }
  .af-input.error:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
  .af-error-msg { font-size: 11.5px; color: #ef4444; margin-top: 5px; display: flex; align-items: center; gap: 4px; }
  .af-input:focus, .af-select:focus, .af-textarea:focus {
    border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .af-textarea { resize: vertical; min-height: 90px; line-height: 1.6; }
  .af-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; cursor: pointer;
  }

  .af-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  /* Tipo selector */
  .af-tipo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .af-tipo-btn {
    display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 8px;
    border: 1.5px solid #e5e7eb; border-radius: 10px; background: #fafbfc; cursor: pointer;
    font-size: 11.5px; font-weight: 500; font-family: 'DM Sans', sans-serif; color: #6b7280;
    transition: all 0.18s;
  }
  .af-tipo-btn:hover { border-color: #c7d2fe; color: #4f46e5; }
  .af-tipo-btn.active { background: #eef2ff; border-color: #6366f1; color: #4f46e5; }

  /* Status selector */
  .af-status-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .af-status-btn {
    height: 38px; border-radius: 9px; border: 1.5px solid #e5e7eb; background: #fafbfc;
    font-size: 12px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 5px; color: #6b7280;
  }
  .af-status-btn .dot { width: 6px; height: 6px; border-radius: 50%; }
  .af-status-btn.st-disponivel.active { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; }
  .af-status-btn.st-em_uso.active { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
  .af-status-btn.st-manutencao.active { background: #fff7ed; border-color: #fdba74; color: #9a3412; }
  .af-status-btn.st-emprestado.active { background: #f5f3ff; border-color: #c4b5fd; color: #6d28d9; }
  .af-status-btn.st-desativado.active { background: #f3f4f6; border-color: #d1d5db; color: #4b5563; }

  .af-actions { display: flex; gap: 10px; margin-top: 8px; }

  /* File staging */
  .af-file-zone { border: 2px dashed #e0e7ff; border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: all 0.18s; text-align: center; }
  .af-file-zone:hover { border-color: #a5b4fc; background: #f5f3ff; }
  .af-file-zone-label { font-size: 13px; color: #6366f1; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .af-file-zone-sub { font-size: 11.5px; color: #9ca3af; margin-top: 3px; }
  .af-file-preview { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .af-file-chip { display: inline-flex; align-items: center; gap: 6px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 5px 8px; font-size: 12px; color: #374151; max-width: 180px; }
  .af-file-thumb { width: 28px; height: 28px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }
  .af-file-chip-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .af-file-remove { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 12px; padding: 0 0 0 2px; flex-shrink: 0; line-height: 1; }
  .af-file-remove:hover { color: #ef4444; }

  .af-submit {
    flex: 1; height: 44px; background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff;
    border: none; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(99,102,241,0.3);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .af-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }

  .af-cancel {
    height: 44px; padding: 0 20px; background: none; border: 1.5px solid #e5e7eb; border-radius: 10px;
    font-size: 14px; font-weight: 500; font-family: 'DM Sans', sans-serif; color: #6b7280; cursor: pointer; transition: all 0.18s;
  }
  .af-cancel:hover { border-color: #d1d5db; color: #374151; background: #f9fafb; }

  .af-section-title { font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f0f1f5; }

  @media (max-width: 600px) {
    .af-row { grid-template-columns: 1fr; }
    .af-tipo-grid { grid-template-columns: repeat(4, 1fr); }
    .af-card { padding: 20px; }
  }
`;

const TIPOS = [
  { value: 'computador', label: 'Computador', iconPath: 'M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16' },
  { value: 'monitor', label: 'Monitor', iconPath: 'M20 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM8 21h8m-4-4v4' },
  { value: 'impressora', label: 'Impressora', iconPath: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z' },
  { value: 'telefone', label: 'Telefone', iconPath: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z' },
  { value: 'servidor', label: 'Servidor', iconPath: 'M2 9h20v6H2zM2 3h20v6H2zM2 15h20v6H2zM6 6h.01M6 12h.01M6 18h.01' },
  { value: 'switch', label: 'Switch', iconPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { value: 'outro', label: 'Outro', iconPath: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6v4m0 4h.01' },
] as const;

const STATUS_OPTIONS = [
  { value: 'disponivel', label: 'Disponível', cls: 'st-disponivel', dotColor: '#10b981' },
  { value: 'em_uso', label: 'Em Uso', cls: 'st-em_uso', dotColor: '#3b82f6' },
  { value: 'manutencao', label: 'Manutenção', cls: 'st-manutencao', dotColor: '#f97316' },
  { value: 'emprestado', label: 'Emprestado', cls: 'st-emprestado', dotColor: '#8b5cf6' },
  { value: 'desativado', label: 'Desativado', cls: 'st-desativado', dotColor: '#9ca3af' },
] as const;

export function AssetForm({ onSubmit, onCancel, initial, technicians = [] }: AssetFormProps) {
  const [nome, setNome] = useState(initial?.nome || '');
  const [tipo, setTipo] = useState<Asset['tipo']>(initial?.tipo || 'computador');
  const [numeroSerie, setNumeroSerie] = useState(initial?.numero_serie || '');
  const [patrimonio, setPatrimonio] = useState(initial?.patrimonio || '');
  const [localizacao, setLocalizacao] = useState(initial?.localizacao || '');
  const [status, setStatus] = useState<Asset['status']>(initial?.status || 'disponivel');
  const [responsavelId, setResponsavelId] = useState<number | ''>(initial?.responsavel_id || '');
  const [observacoes, setObservacoes] = useState(initial?.observacoes || '');
  const [warrantyExpiresAt, setWarrantyExpiresAt] = useState(initial?.warranty_expires_at || '');

  const [errors, setErrors] = useState<Record<string,string>>({});
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string,string> = {};
    if (!nome.trim()) errs.nome = 'Nome do ativo é obrigatório.';
    else if (nome.trim().length < 3) errs.nome = 'Mínimo de 3 caracteres.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit(
      { nome: nome.trim(), tipo, numero_serie: numeroSerie || undefined, patrimonio: patrimonio || undefined, localizacao: localizacao || undefined, status, responsavel_id: responsavelId || undefined, observacoes: observacoes || undefined, warranty_expires_at: warrantyExpiresAt || undefined },
      stagedFiles
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="af-wrap">
        <div className="af-heading">
          <h1 className="af-title">{initial ? 'Editar Ativo' : 'Cadastrar Ativo'}</h1>
          <p className="af-sub">Preencha os dados do equipamento para registro no inventário de TI</p>
        </div>

        <div className="af-card">
          <form onSubmit={handleSubmit}>
            <p className="af-section-title">Identificação</p>

            <div className="af-field">
              <label className="af-label">Nome do Equipamento <span>*</span></label>
              <input className={`af-input${errors.nome ? ' error' : ''}`} value={nome} onChange={e => { setNome(e.target.value); if(errors.nome) setErrors(p=>({...p,nome:''})); }} placeholder="Ex: Notebook Dell Latitude 5520" />
              {errors.nome && <p className="af-error-msg"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{errors.nome}</p>}
            </div>

            <div className="af-field">
              <label className="af-label">Tipo <span>*</span></label>
              <div className="af-tipo-grid">
                {TIPOS.map(t => (
                  <button key={t.value} type="button" className={`af-tipo-btn ${tipo === t.value ? 'active' : ''}`} onClick={() => setTipo(t.value)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={t.iconPath}/></svg>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="af-row af-field">
              <div>
                <label className="af-label">Número de Série</label>
                <input className="af-input" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} placeholder="Ex: SN-2024-001" />
              </div>
              <div>
                <label className="af-label">Patrimônio</label>
                <input className="af-input" value={patrimonio} onChange={e => setPatrimonio(e.target.value)} placeholder="Ex: PAT-001" />
              </div>
            </div>

            <div className="af-field">
              <label className="af-label">Localização</label>
              <input className="af-input" value={localizacao} onChange={e => setLocalizacao(e.target.value)} placeholder="Ex: Sala TI, Recepção, Rack Principal..." />
            </div>

            <div className="af-field">
              <label className="af-label">Responsável</label>
              <select className="af-select" value={responsavelId} onChange={e => setResponsavelId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">— Sem responsável —</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.nome} ({t.email})</option>
                ))}
              </select>
            </div>

            <p className="af-section-title" style={{ marginTop: 8 }}>Status</p>

            <div className="af-field">
              <div className="af-status-grid">
                {STATUS_OPTIONS.map(s => (
                  <button key={s.value} type="button" className={`af-status-btn ${s.cls} ${status === s.value ? 'active' : ''}`} onClick={() => setStatus(s.value)}>
                    <span className="dot" style={{ background: s.dotColor }} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="af-field">
              <label className="af-label">Observações</label>
              <textarea className="af-textarea" value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Informações adicionais, histórico de compra, configurações especiais..." />
            </div>

            <div className="af-field">
              <label className="af-label">Garantia até</label>
              <input
                type="date"
                className="af-input"
                value={warrantyExpiresAt}
                onChange={e => setWarrantyExpiresAt(e.target.value)}
              />
            </div>

            <div className="af-field">
              <label className="af-label">Fotos / Anexos</label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{display:'none'}}
                onChange={e => {
                  const picked = Array.from(e.target.files || []);
                  setStagedFiles(prev => [...prev, ...picked]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              />
              <div className="af-file-zone" onClick={() => fileInputRef.current?.click()}>
                <p className="af-file-zone-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  Clique para anexar arquivos
                </p>
                <p className="af-file-zone-sub">Imagens, PDFs, documentos — qualquer tipo</p>
              </div>
              {stagedFiles.length > 0 && (
                <div className="af-file-preview">
                  {stagedFiles.map((f, i) => {
                    const isImage = f.type.startsWith('image/');
                    return (
                      <div key={i} className="af-file-chip">
                        {isImage
                          ? <img className="af-file-thumb" src={URL.createObjectURL(f)} alt={f.name} />
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        }
                        <span className="af-file-chip-name">{f.name}</span>
                        <button type="button" className="af-file-remove" onClick={e => { e.stopPropagation(); setStagedFiles(prev => prev.filter((_,j) => j !== i)); }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="af-actions">
              <button type="button" className="af-cancel" onClick={onCancel}>Cancelar</button>
              <button type="submit" className="af-submit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {initial ? 'Salvar Alterações' : 'Cadastrar Ativo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}