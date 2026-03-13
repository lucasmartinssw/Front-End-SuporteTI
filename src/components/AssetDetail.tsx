import { useState, useEffect, useRef } from 'react';
import { exportAssetPDF } from '../pdfExport';
import { Asset } from './AssetList';
import { ativos } from '../api';
import { computeWarranty, WARRANTY_COLORS } from '../warranty';



interface AssetDetailProps {
  asset: Asset;
  technicians: { id: number; nome: string; email: string }[];
  onBack: () => void;
  onUpdated: (updated: Asset) => void;
  onDeactivated: () => void;
  onTicketSelect?: (chamadoId: number) => void;
  onShowHistory?: () => void;
}

const TIPO_ICONS: Record<string, string> = {
  computador: 'M20 4H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM4 14V8h16v6H4z',
  monitor: 'M8 21h8M12 17v4M2 3h20v14H2zM8 7h8',
  impressora: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  telefone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  servidor: 'M2 2h20v8H2zM2 14h20v8H2zM6 6h.01M6 18h.01',
  switch: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  outro: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4m0 4h.01',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  ativo:       { label: 'Ativo',        bg: '#ecfdf5', color: '#065f46', dot: '#10b981' },
  manutencao:  { label: 'Manutenção',   bg: '#fffbeb', color: '#92400e', dot: '#f59e0b' },
  reserva:     { label: 'Reserva',      bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  desativado:  { label: 'Desativado',   bg: '#f3f4f6', color: '#4b5563', dot: '#9ca3af' },
};

const TIPO_LABELS: Record<string, string> = {
  computador: 'Computador', monitor: 'Monitor', impressora: 'Impressora',
  telefone: 'Telefone', servidor: 'Servidor', switch: 'Switch', outro: 'Outro',
};

export function AssetDetail({ asset, technicians, onBack, onUpdated, onDeactivated, onTicketSelect, onShowHistory }: AssetDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // Full asset data (loaded from API to get chamados)
  const [fullAsset, setFullAsset] = useState<Asset>(asset);

  // File attachments
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assetFiles, setAssetFiles] = useState<{id:string;url:string;type:string;name:string}[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    ativos.get(asset.id).then(data => {
      setFullAsset(data as any);
      setAssetFiles((data as any).files || []);
    }).catch(() => {});
  }, [asset.id]);

  // Edit form state
  const [nome, setNome] = useState(asset.nome);
  const [tipo, setTipo] = useState(asset.tipo);
  const [numeroSerie, setNumeroSerie] = useState(asset.numero_serie || '');
  const [patrimonio, setPatrimonio] = useState(asset.patrimonio || '');
  const [localizacao, setLocalizacao] = useState(asset.localizacao || '');
  const [status, setStatus] = useState(asset.status);
  const [responsavelId, setResponsavelId] = useState<number | ''>(asset.responsavel_id || '');
  const [observacoes, setObservacoes] = useState(asset.observacoes || '');
  const [warrantyExpiresAt, setWarrantyExpiresAt] = useState(asset.warranty_expires_at || '');

  const statusCfg = STATUS_CONFIG[asset.status] || STATUS_CONFIG.ativo;
  const editStatusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.ativo;

  const handleSave = async () => {
    if (!nome.trim()) { setError('Nome é obrigatório.'); return; }
    setIsSaving(true);
    setError(null);
    try {
      await ativos.update(asset.id, { nome, tipo, numero_serie: numeroSerie || undefined, patrimonio: patrimonio || undefined, localizacao: localizacao || undefined, status, responsavel_id: responsavelId || undefined, observacoes: observacoes || undefined, warranty_expires_at: warrantyExpiresAt || undefined });
      const updatedTech = technicians.find(t => t.id === responsavelId);
      onUpdated({ ...asset, nome, tipo, numero_serie: numeroSerie || undefined, patrimonio: patrimonio || undefined, localizacao: localizacao || undefined, status, responsavel_id: responsavelId || undefined, responsavel_nome: updatedTech?.nome, responsavel_email: updatedTech?.email, observacoes: observacoes || undefined, warranty_expires_at: warrantyExpiresAt || undefined });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await ativos.deactivate(asset.id);
      onDeactivated();
    } catch (err: any) {
      setError(err.message || 'Erro ao desativar.');
      setIsDeactivating(false);
    }
  };

  const fmtDate = (s: string) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s));



  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

        .ad-wrap { animation: fadeUp 0.3s ease both; }
        .ad-back { display:flex; align-items:center; gap:6px; background:none; border:none; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:500; color:#6b7280; cursor:pointer; padding:0; margin-bottom:24px; transition:color 0.15s; }
        .ad-back:hover { color:#111827; }

        .ad-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
        .ad-title-row { display:flex; align-items:center; gap:14px; }
        .ad-icon { width:48px; height:48px; border-radius:14px; background:linear-gradient(135deg,#eef2ff,#e0e7ff); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ad-title { font-family:'Sora',sans-serif; font-size:22px; font-weight:700; color:#0f1117; letter-spacing:-0.4px; margin-bottom:4px; }
        .ad-tipo { font-size:13px; color:#9ca3af; }
        .ad-actions { display:flex; gap:10px; }

        .ad-btn { display:flex; align-items:center; gap:6px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:8px 16px; border-radius:9px; cursor:pointer; transition:all 0.18s; border:none; }
        .ad-btn-edit { background:#eef2ff; color:#4f46e5; }
        .ad-btn-edit:hover { background:#e0e7ff; }
        .ad-btn-save { background:linear-gradient(135deg,#4f46e5,#6366f1); color:#fff; box-shadow:0 3px 10px rgba(99,102,241,0.3); }
        .ad-btn-save:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(99,102,241,0.4); }
        .ad-btn-save:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
        .ad-btn-cancel { background:#f3f4f6; color:#374151; }
        .ad-btn-cancel:hover { background:#e5e7eb; }
        .ad-btn-danger { background:#fef2f2; color:#dc2626; }
        .ad-btn-danger:hover { background:#fee2e2; }

        .ad-grid { display:grid; grid-template-columns:1fr 340px; gap:20px; }
        @media (max-width:900px) { .ad-grid { grid-template-columns:1fr; } }

        .ad-card { background:#fff; border:1px solid #f0f1f5; border-radius:14px; overflow:hidden; }
        .ad-card-hdr { padding:14px 20px; border-bottom:1px solid #f7f8fc; display:flex; align-items:center; justify-content:space-between; }
        .ad-card-title { font-family:'Sora',sans-serif; font-size:13px; font-weight:600; color:#111827; }
        .ad-card-body { padding:20px; }

        .ad-field { margin-bottom:18px; }
        .ad-field:last-child { margin-bottom:0; }
        .ad-label { font-size:11.5px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.7px; margin-bottom:5px; }
        .ad-value { font-size:14px; color:#111827; font-weight:500; }
        .ad-value-empty { font-size:13.5px; color:#d1d5db; font-style:italic; }

        .ad-input { width:100%; height:40px; background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:9px; padding:0 12px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:#111827; outline:none; transition:all 0.18s; box-sizing:border-box; }
        .ad-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.1); background:#fff; }
        .ad-textarea { width:100%; min-height:80px; background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:9px; padding:10px 12px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:#111827; outline:none; transition:all 0.18s; box-sizing:border-box; resize:vertical; }
        .ad-textarea:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.1); background:#fff; }
        .ad-select { width:100%; height:40px; background:#f9fafb; border:1.5px solid #e5e7eb; border-radius:9px; padding:0 12px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:#111827; outline:none; cursor:pointer; }

        .ad-status-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; }
        .ad-status-dot { width:6px; height:6px; border-radius:50%; }

        .ad-status-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .ad-status-btn { height:38px; border-radius:9px; border:1.5px solid #e5e7eb; background:#fff; font-size:12.5px; font-weight:500; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.18s; display:flex; align-items:center; justify-content:center; gap:6px; }
        .ad-status-btn.active { border-color:transparent; }
        .ad-status-btn:hover { border-color:#6366f1; }

        .ad-ticket-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid #f7f8fc; }
        .ad-ticket-row:last-child { border-bottom:none; }
        .ad-ticket-icon { width:28px; height:28px; border-radius:8px; background:#eef2ff; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ad-ticket-title { font-size:12.5px; font-weight:500; color:#111827; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ad-ticket-meta { font-size:11px; color:#9ca3af; }
        .ad-empty-tickets { text-align:center; padding:24px; font-size:13px; color:#9ca3af; }

        .ad-error { background:#fef2f2; border:1px solid #fca5a5; border-radius:9px; padding:10px 14px; font-size:13px; color:#991b1b; margin-bottom:16px; }

        .ad-confirm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:100; }
        .ad-confirm-box { background:#fff; border-radius:16px; padding:28px; max-width:360px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,0.15); }
        .ad-confirm-title { font-family:'Sora',sans-serif; font-size:17px; font-weight:700; color:#0f1117; margin-bottom:8px; }
        .ad-confirm-sub { font-size:13.5px; color:#6b7280; margin-bottom:22px; line-height:1.5; }
        .ad-confirm-btns { display:flex; gap:10px; justify-content:flex-end; }

        .ad-qr-card { background:#fff; border:1px solid #f0f1f5; border-radius:14px; overflow:hidden; }
        .ad-qr-body { padding:16px 20px; display:flex; flex-direction:column; align-items:center; gap:12px; }
        .ad-qr-canvas-wrap { background:#f9fafb; border:1px solid #f0f1f5; border-radius:10px; padding:12px; display:flex; align-items:center; justify-content:center; }
        .ad-qr-url { font-size:11px; color:#9ca3af; text-align:center; word-break:break-all; line-height:1.5; }
        .ad-btn-qr { width:100%; display:flex; align-items:center; justify-content:center; gap:6px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:9px 16px; border-radius:9px; cursor:pointer; transition:all 0.18s; border:1.5px solid #e0e7ff; background:#eef2ff; color:#4f46e5; }
        .ad-btn-qr:hover { background:#e0e7ff; border-color:#c7d2fe; }

        /* Warranty panel */
        .ad-warranty-panel { border-radius:12px; padding:13px 16px; border:1px solid transparent; display:flex; align-items:flex-start; gap:10px; }
        .ad-warranty-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:rgba(0,0,0,0.06); }
        .ad-warranty-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
        .ad-warranty-label { font-size:13px; font-weight:600; }

        /* File attachments panel */
        .ad-file-grid { display:flex; flex-wrap:wrap; gap:8px; padding:14px 16px 0; }
        .ad-file-thumb { width:72px; height:72px; border-radius:8px; object-fit:cover; cursor:zoom-in; border:1px solid #e5e7eb; transition:transform 0.15s,box-shadow 0.15s; }
        .ad-file-thumb:hover { transform:scale(1.04); box-shadow:0 4px 14px rgba(0,0,0,0.12); }
        .ad-file-chip { display:inline-flex; align-items:center; gap:6px; background:#f3f4f6; border:1px solid #e5e7eb; border-radius:8px; padding:5px 10px; font-size:12px; color:#374151; text-decoration:none; max-width:200px; transition:all 0.15s; }
        .ad-file-chip:hover { border-color:#6366f1; background:#eef2ff; color:#4f46e5; }
        .ad-file-item { position:relative; display:inline-flex; }
        .ad-file-remove { position:absolute; top:-5px; right:-5px; width:16px; height:16px; border-radius:50%; background:#ef4444; color:#fff; border:none; font-size:9px; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.15s; }
        .ad-file-item:hover .ad-file-remove { opacity:1; }
        .ad-upload-btn { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:#6366f1; background:#eef2ff; border:1.5px dashed #c7d2fe; border-radius:8px; padding:6px 12px; cursor:pointer; transition:all 0.15s; margin:10px 16px 14px; }
        .ad-upload-btn:hover { background:#e0e7ff; border-color:#a5b4fc; }

        /* Lightbox */
        .ad-lightbox-overlay { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,0.85); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; cursor:zoom-out; animation:ad-fade-in 0.15s ease; }
        @keyframes ad-fade-in { from{opacity:0} to{opacity:1} }
        .ad-lightbox-img { max-width:90vw; max-height:88vh; border-radius:10px; box-shadow:0 24px 80px rgba(0,0,0,0.6); cursor:default; object-fit:contain; }
        .ad-lightbox-close { position:fixed; top:20px; right:24px; background:rgba(255,255,255,0.12); border:none; color:#fff; width:36px; height:36px; border-radius:50%; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
        .ad-lightbox-close:hover { background:rgba(255,255,255,0.25); }
      `}</style>

      <div className="ad-wrap">
        {/* Back button */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
          <button className="ad-back" style={{marginBottom:0}} onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Voltar para Ativos
          </button>
          <div style={{display:'flex',gap:8}}>
            {onShowHistory && (
              <button onClick={onShowHistory}
                style={{display:'inline-flex',alignItems:'center',gap:6,height:34,padding:'0 14px',background:'#f7f8fc',border:'1px solid #f0f1f5',borderRadius:9,fontSize:12.5,fontWeight:600,color:'#6b7280',cursor:'pointer',fontFamily:'DM Sans,sans-serif',transition:'all 0.18s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#eef2ff';e.currentTarget.style.color='#6366f1';e.currentTarget.style.borderColor='#c7d2fe'}}
                onMouseLeave={e=>{e.currentTarget.style.background='#f7f8fc';e.currentTarget.style.color='#6b7280';e.currentTarget.style.borderColor='#f0f1f5'}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Histórico
              </button>
            )}
            <button
              onClick={() => exportAssetPDF({...asset, chamados: (asset as any).chamados || []})}
              style={{display:'inline-flex',alignItems:'center',gap:6,height:34,padding:'0 14px',background:'#f7f8fc',border:'1px solid #f0f1f5',borderRadius:9,fontSize:12.5,fontWeight:600,color:'#6b7280',cursor:'pointer',fontFamily:'DM Sans,sans-serif',transition:'all 0.18s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#fff1f2';e.currentTarget.style.color='#dc2626';e.currentTarget.style.borderColor='#fecaca'}}
              onMouseLeave={e=>{e.currentTarget.style.background='#f7f8fc';e.currentTarget.style.color='#6b7280';e.currentTarget.style.borderColor='#f0f1f5'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="ad-header">
          <div className="ad-title-row">
            <div className="ad-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={TIPO_ICONS[asset.tipo] || TIPO_ICONS.outro}/>
              </svg>
            </div>
            <div>
              <h1 className="ad-title">{asset.nome}</h1>
              <p className="ad-tipo">{TIPO_LABELS[asset.tipo]} · ID #{asset.id}</p>
            </div>
          </div>
          <div className="ad-actions">
            {!isEditing ? (
              <>
                <button className="ad-btn ad-btn-edit" onClick={() => setIsEditing(true)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </button>
                {asset.status !== 'desativado' && (
                  <button className="ad-btn ad-btn-danger" onClick={() => setConfirmDeactivate(true)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    Desativar
                  </button>
                )}
              </>
            ) : (
              <>
                <button className="ad-btn ad-btn-cancel" onClick={() => { setIsEditing(false); setError(null); }}>Cancelar</button>
                <button className="ad-btn ad-btn-save" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </>
            )}
          </div>
        </div>

        {error && <div className="ad-error">{error}</div>}

        <div className="ad-grid">
          {/* Left — details / edit form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="ad-card">
              <div className="ad-card-hdr">
                <span className="ad-card-title">Informações do ativo</span>
                <span className="ad-status-badge" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                  <span className="ad-status-dot" style={{ background: statusCfg.dot }}/>
                  {statusCfg.label}
                </span>
              </div>
              <div className="ad-card-body">
                {!isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                    {[
                      { label: 'Nome', value: asset.nome },
                      { label: 'Tipo', value: TIPO_LABELS[asset.tipo] },
                      { label: 'Número de Série', value: asset.numero_serie },
                      { label: 'Patrimônio', value: asset.patrimonio },
                      { label: 'Localização', value: asset.localizacao },
                      { label: 'Responsável', value: fullAsset.responsavel_nome || fullAsset.responsavel_email },
                      { label: 'Garantia até', value: asset.warranty_expires_at ? new Date(asset.warranty_expires_at).toLocaleDateString('pt-BR') : null },
                    ].map(f => (
                      <div key={f.label} className="ad-field">
                        <p className="ad-label">{f.label}</p>
                        {f.value
                          ? <p className="ad-value">{f.value}</p>
                          : <p className="ad-value-empty">Não informado</p>
                        }
                      </div>
                    ))}
                    {asset.observacoes && (
                      <div className="ad-field" style={{ gridColumn: '1 / -1' }}>
                        <p className="ad-label">Observações</p>
                        <p className="ad-value">{asset.observacoes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
                    <div className="ad-field">
                      <p className="ad-label">Nome *</p>
                      <input className="ad-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do ativo"/>
                    </div>
                    <div className="ad-field">
                      <p className="ad-label">Tipo</p>
                      <select className="ad-select" value={tipo} onChange={e => setTipo(e.target.value as any)}>
                        {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="ad-field">
                      <p className="ad-label">Número de Série</p>
                      <input className="ad-input" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} placeholder="Ex: SN123456"/>
                    </div>
                    <div className="ad-field">
                      <p className="ad-label">Patrimônio</p>
                      <input className="ad-input" value={patrimonio} onChange={e => setPatrimonio(e.target.value)} placeholder="Ex: PAT-001"/>
                    </div>
                    <div className="ad-field">
                      <p className="ad-label">Localização</p>
                      <input className="ad-input" value={localizacao} onChange={e => setLocalizacao(e.target.value)} placeholder="Ex: Sala TI"/>
                    </div>
                    <div className="ad-field">
                      <p className="ad-label">Responsável</p>
                      <select className="ad-input" value={responsavelId} onChange={e => setResponsavelId(e.target.value ? Number(e.target.value) : '')}>
                        <option value="">— Sem responsável —</option>
                        {technicians.map(t => (
                          <option key={t.id} value={t.id}>{t.nome} ({t.email})</option>
                        ))}
                      </select>
                    </div>
                    <div className="ad-field">
                      <p className="ad-label">Status</p>
                      <div className="ad-status-grid">
                        {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
                          <button key={v} type="button"
                            className={`ad-status-btn ${status === v ? 'active' : ''}`}
                            style={status === v ? { background: cfg.bg, color: cfg.color, borderColor: cfg.dot } : {}}
                            onClick={() => setStatus(v as any)}>
                            <span className="ad-status-dot" style={{ background: cfg.dot }}/>
                            {cfg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="ad-field" style={{ gridColumn: '1 / -1' }}>
                      <p className="ad-label">Observações</p>
                      <textarea className="ad-textarea" value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Notas adicionais..."/>
                    </div>
                    <div className="ad-field">
                      <p className="ad-label">Garantia até</p>
                      <input
                        type="date"
                        className="ad-input"
                        value={warrantyExpiresAt}
                        onChange={e => setWarrantyExpiresAt(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Warranty warning panel — only shown when expiring or expired */}
            {(() => {
              const w = computeWarranty(asset.warranty_expires_at);
              if (w.status === 'ok' || w.status === 'none') return null;
              const c = WARRANTY_COLORS[w.status];
              return (
                <div className="ad-warranty-panel" style={{ background: c.bg, borderColor: c.border }}>
                  <div className="ad-warranty-icon" style={{ background: c.bg }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c.dot} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      {w.status === 'expired'
                        ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                        : <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
                    </svg>
                  </div>
                  <div>
                    <p className="ad-warranty-title" style={{ color: c.text }}>
                      {w.status === 'expired' ? 'Garantia vencida' : 'Garantia a vencer'}
                    </p>
                    <p className="ad-warranty-label" style={{ color: c.text }}>{w.label}</p>
                  </div>
                </div>
              );
            })()}
            {/* Meta info */}
            <div className="ad-card">
              <div className="ad-card-hdr"><span className="ad-card-title">Detalhes</span></div>
              <div className="ad-card-body" style={{ padding: '14px 20px' }}>
                <div className="ad-field">
                  <p className="ad-label">Cadastrado em</p>
                  <p className="ad-value">{fmtDate(asset.created_at)}</p>
                </div>
                <div className="ad-field">
                  <p className="ad-label">Última atualização</p>
                  <p className="ad-value">{fmtDate(asset.updated_at)}</p>
                </div>
                <div className="ad-field" style={{ marginBottom: 0 }}>
                  <p className="ad-label">Status atual</p>
                  <span className="ad-status-badge" style={{ background: statusCfg.bg, color: statusCfg.color, marginTop: 4, display: 'inline-flex' }}>
                    <span className="ad-status-dot" style={{ background: statusCfg.dot }}/>
                    {statusCfg.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Linked tickets */}
            <div className="ad-card">
              <div className="ad-card-hdr">
                <span className="ad-card-title">Chamados vinculados</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                  {fullAsset.chamados?.length || 0} total
                </span>
              </div>
              <div className="ad-card-body" style={{ padding: '8px 16px' }}>
                {!fullAsset.chamados || fullAsset.chamados.length === 0 ? (
                  <p className="ad-empty-tickets">Nenhum chamado vinculado a este ativo.</p>
                ) : (
                  fullAsset.chamados.map((c: any) => (
                    <div key={c.id} className="ad-ticket-row"
                      onClick={() => onTicketSelect && onTicketSelect(c.id)}
                      style={{ cursor: onTicketSelect ? 'pointer' : 'default' }}>
                      <div className="ad-ticket-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="ad-ticket-title">{c.titulo}</p>
                        <p className="ad-ticket-meta">{c.status} · {c.solicitante || 'N/A'}</p>
                      </div>
                      {onTicketSelect && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* File attachments card */}
            <div className="ad-card">
              <div className="ad-card-hdr">
                <span className="ad-card-title">Anexos</span>
                <span style={{fontSize:11,color:'#9ca3af'}}>{assetFiles.length} arquivo{assetFiles.length !== 1 ? 's' : ''}</span>
              </div>
              {assetFiles.length > 0 && (
                <div className="ad-file-grid">
                  {assetFiles.map(f => {
                    const isImage = f.type?.startsWith('image/');
                    return (
                      <div key={f.id} className="ad-file-item">
                        {isImage ? (
                          <img className="ad-file-thumb" src={f.url} alt={f.name} onClick={() => setLightboxUrl(f.url)} />
                        ) : (
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="ad-file-chip">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                          </a>
                        )}
                        <button className="ad-file-remove" title="Remover" onClick={async () => {
                          try { await ativos.deleteFile(asset.id, f.id); setAssetFiles(prev => prev.filter(x => x.id !== f.id)); } catch {}
                        }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
              <input ref={fileInputRef} type="file" multiple style={{display:'none'}}
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  setUploadingFiles(true);
                  try {
                    const result = await ativos.uploadFiles(asset.id, files);
                    setAssetFiles(prev => [...prev, ...result.files]);
                  } catch {} finally {
                    setUploadingFiles(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }
                }}
              />
              <button className="ad-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingFiles}>
                {uploadingFiles ? <span style={{fontSize:11}}>Enviando...</span> : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>Anexar arquivo</>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {lightboxUrl && (
        <div className="ad-lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <button className="ad-lightbox-close" onClick={() => setLightboxUrl(null)}>✕</button>
          <img className="ad-lightbox-img" src={lightboxUrl} alt="Anexo" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Deactivate confirmation modal */}
      {confirmDeactivate && (
        <div className="ad-confirm-overlay">
          <div className="ad-confirm-box">
            <p className="ad-confirm-title">Desativar ativo?</p>
            <p className="ad-confirm-sub">
              O ativo <strong>{asset.nome}</strong> será marcado como desativado. O histórico de chamados será preservado.
            </p>
            <div className="ad-confirm-btns">
              <button className="ad-btn ad-btn-cancel" onClick={() => setConfirmDeactivate(false)}>Cancelar</button>
              <button className="ad-btn ad-btn-danger" onClick={handleDeactivate} disabled={isDeactivating}>
                {isDeactivating ? 'Desativando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}