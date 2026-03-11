import { useState } from 'react';
import { Asset } from '../AssetList/AssetList';
import { ativos } from '../../api';
import './AssetDetail.css';

interface AssetDetailProps {
  asset: Asset;
  onBack: () => void;
  onUpdated: (updated: Asset) => void;
  onDeactivated: () => void;
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

export function AssetDetail({ asset, onBack, onUpdated, onDeactivated }: AssetDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // Edit form state
  const [nome, setNome] = useState(asset.nome);
  const [tipo, setTipo] = useState(asset.tipo);
  const [numeroSerie, setNumeroSerie] = useState(asset.numero_serie || '');
  const [patrimonio, setPatrimonio] = useState(asset.patrimonio || '');
  const [localizacao, setLocalizacao] = useState(asset.localizacao || '');
  const [status, setStatus] = useState(asset.status);
  const [observacoes, setObservacoes] = useState(asset.observacoes || '');

  const statusCfg = STATUS_CONFIG[asset.status] || STATUS_CONFIG.ativo;
  const editStatusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.ativo;

  const handleSave = async () => {
    if (!nome.trim()) { setError('Nome é obrigatório.'); return; }
    setIsSaving(true);
    setError(null);
    try {
      await ativos.update(asset.id, { nome, tipo, numero_serie: numeroSerie || undefined, patrimonio: patrimonio || undefined, localizacao: localizacao || undefined, status, observacoes: observacoes || undefined });
      onUpdated({ ...asset, nome, tipo, numero_serie: numeroSerie || undefined, patrimonio: patrimonio || undefined, localizacao: localizacao || undefined, status, observacoes: observacoes || undefined });
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
      <div className="ad-wrap">
        {/* Back button */}
        <button className="ad-back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar para Ativos
        </button>

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
                      { label: 'Responsável', value: asset.responsavel_nome || asset.responsavel_email },
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  {asset.chamados?.length || 0} total
                </span>
              </div>
              <div className="ad-card-body" style={{ padding: '8px 16px' }}>
                {!asset.chamados || asset.chamados.length === 0 ? (
                  <p className="ad-empty-tickets">Nenhum chamado vinculado a este ativo.</p>
                ) : (
                  asset.chamados.map((c: any) => (
                    <div key={c.id} className="ad-ticket-row">
                      <div className="ad-ticket-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="ad-ticket-title">{c.titulo}</p>
                        <p className="ad-ticket-meta">{c.status} · {c.solicitante || 'N/A'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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