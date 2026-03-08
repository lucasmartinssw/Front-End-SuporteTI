import { useState } from 'react';

// Interfaces mantidas idênticas
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
  attachments?: Array<{ id: string; url: string; name: string; type: string }>;
  comments: Array<{
    id: string;
    author: string;
    authorEmail?: string;
    content: string;
    timestamp: Date;
    isInternal: boolean;
    attachments?: Array<{ id: string; url: string; name: string; type: string }>;
  }>;
}

interface TicketFormProps {
  onSubmit: (ticket: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'comments'> & { files?: FileList }) => void;
  userEmail: string;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&display=swap');

  .tf-container {
    display: flex;
    justify-content: center;
    padding: 40px 20px;
    background-color: #f8fafc;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
  }

  .tf-wrap {
    width: 100%;
    max-width: 700px;
    animation: tf-fadeUp 0.4s ease-out;
  }

  @keyframes tf-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tf-header { margin-bottom: 32px; text-align: left; }
  
  .tf-title {
    font-family: 'Sora', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
    letter-spacing: -0.02em;
  }

  .tf-sub { color: #64748b; font-size: 15px; margin: 0; }

  .tf-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  }

  .tf-group { margin-bottom: 24px; }
  
  .tf-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 8px;
  }

  .tf-label span { color: #ef4444; margin-left: 4px; }

  .tf-input, .tf-select, .tf-textarea {
    width: 100%;
    padding: 12px 16px;
    background: #fdfdfd;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 15px;
    color: #1e293b;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .tf-input:focus, .tf-select:focus, .tf-textarea:focus {
    outline: none;
    border-color: #6366f1;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }

  .tf-textarea { min-height: 120px; resize: vertical; line-height: 1.6; }

  .tf-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  /* Priority Selector Modificado */
  .tf-priority-nav {
    display: flex;
    background: #f1f5f9;
    padding: 4px;
    border-radius: 10px;
    gap: 4px;
  }

  .tf-priority-opt {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: #64748b;
  }

  .tf-priority-opt.active.low { background: #fff; color: #16a34a; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .tf-priority-opt.active.medium { background: #fff; color: #d97706; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .tf-priority-opt.active.high { background: #fff; color: #ea580c; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .tf-priority-opt.active.urgent { background: #fff; color: #dc2626; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

  /* Dropzone Estilizada */
  .tf-dropzone {
    border: 2px dashed #cbd5e1;
    border-radius: 14px;
    padding: 24px;
    text-align: center;
    background: #f8fafc;
    transition: all 0.2s;
    cursor: pointer;
    position: relative;
  }

  .tf-dropzone:hover, .tf-dropzone.dragover {
    border-color: #6366f1;
    background: #f5f3ff;
  }

  .tf-drop-icon { color: #94a3b8; margin-bottom: 8px; }

  .tf-file-badge {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    border-radius: 8px;
    margin-top: 8px;
    font-size: 13px;
  }

  .tf-btn-submit {
    width: 100%;
    padding: 14px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }

  .tf-btn-submit:hover:not(:disabled) { background: #4f46e5; transform: translateY(-1px); }
  .tf-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 640px) {
    .tf-grid-2 { grid-template-columns: 1fr; }
    .tf-card { padding: 24px; }
  }

  @keyframes tf-spin { to { transform: rotate(360deg); } }
  .tf-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: tf-spin 0.8s linear infinite;
  }
`;

const categories = ['Solicitar Ativo', 'Hardware', 'Software', 'Conexão com Internet', 'Acessos', 'Sistemas', 'Segurança', 'Impressora', 'Telefone/Celular', 'Outros'];
const assetOptions = ['Notebook', 'Monitor', 'Teclado', 'Mouse', 'Cadeira Ergonômica', 'Headset', 'Celular Corporativo', 'Outro'];

export function TicketForm({ onSubmit, userEmail }: TicketFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState('');
  const [asset, setAsset] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`O arquivo ${file.name} excede 10MB.`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category || (category === 'Solicitar Ativo' && !asset)) return;

    setIsSubmitting(true);
    const dataTransfer = new DataTransfer();
    files.forEach(f => dataTransfer.items.add(f));

    const finalDescription = category === 'Solicitar Ativo' 
      ? `[Ativo Solicitado: ${asset}]\n\n${description.trim()}`
      : description.trim();

    try {
      await onSubmit({
        title: title.trim(),
        description: finalDescription,
        priority,
        category,
        submittedBy: userEmail,
        files: dataTransfer.files
      });
      // Reset
      setTitle(''); setDescription(''); setCategory(''); setAsset(''); setFiles([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tf-container">
      <style>{styles}</style>
      <div className="tf-wrap">
        <header className="tf-header">
          <h1 className="tf-title">Novo Chamado</h1>
          <p className="tf-sub">Suporte técnico e solicitações de TI</p>
        </header>

        <div className="tf-card">
          <form onSubmit={handleSubmit}>
            <div className="tf-group">
              <label className="tf-label">O que está acontecendo? <span>*</span></label>
              <input 
                className="tf-input" 
                placeholder="Ex: Minha impressora não está ligando"
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
              />
            </div>

            <div className="tf-grid-2 tf-group">
              <div>
                <label className="tf-label">Categoria <span>*</span></label>
                <select 
                  className="tf-select" 
                  value={category} 
                  onChange={e => {
                    setCategory(e.target.value);
                    if (e.target.value !== 'Solicitar Ativo') setAsset('');
                  }}
                  required
                >
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="tf-label">Prioridade <span>*</span></label>
                <div className="tf-priority-nav">
                  {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`tf-priority-opt ${p} ${priority === p ? 'active' : ''}`}
                      onClick={() => setPriority(p)}
                    >
                      {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : p === 'high' ? 'Alta' : 'Urgente'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {category === 'Solicitar Ativo' && (
              <div className="tf-group" style={{ animation: 'tf-fadeUp 0.3s ease' }}>
                <label className="tf-label">Qual equipamento você precisa? <span>*</span></label>
                <select className="tf-select" value={asset} onChange={e => setAsset(e.target.value)} required>
                  <option value="">Selecione o ativo...</option>
                  {assetOptions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}

            <div className="tf-group">
              <label className="tf-label">Mais detalhes <span>*</span></label>
              <textarea 
                className="tf-textarea" 
                placeholder="Forneça o máximo de informações possível..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="tf-group">
              <label className="tf-label">Anexos</label>
              <div 
                className={`tf-dropzone ${isDragOver ? 'dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files); }}
              >
                <svg className="tf-drop-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div style={{fontSize: '14px', fontWeight: 500, color: '#475569'}}>Arraste ou clique para anexar</div>
                <div style={{fontSize: '12px', color: '#94a3b8', marginTop: '4px'}}>PNG, JPG ou PDF até 10MB</div>
                <input 
                  type="file" 
                  multiple 
                  style={{position:'absolute', inset:0, opacity:0, cursor:'pointer'}} 
                  onChange={e => handleFileSelect(e.target.files)}
                />
              </div>

              {files.map((file, i) => (
                <div key={i} className="tf-file-badge">
                  <span style={{fontWeight: 500, color: '#334155'}}>{file.name} <small style={{color:'#94a3b8', marginLeft: 8}}>{formatFileSize(file.size)}</small></span>
                  <button 
                    type="button" 
                    onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                    style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding: '4px'}}
                  >✕</button>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              className="tf-btn-submit" 
              disabled={isSubmitting || !title.trim() || !description.trim() || !category || (category === 'Solicitar Ativo' && !asset)}
            >
              {isSubmitting ? <div className="tf-spinner" /> : 'Criar Chamado'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}