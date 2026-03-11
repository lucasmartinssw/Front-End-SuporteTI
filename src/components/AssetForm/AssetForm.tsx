import { useState } from 'react';
import { Asset } from '../AssetList/AssetList';
import './AssetForm.css';

interface AssetFormProps {
  onSubmit: (data: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'chamados' | 'responsavel_nome' | 'responsavel_email'>) => void;
  onCancel: () => void;
  initial?: Partial<Asset>;
}



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
  { value: 'ativo', label: 'Ativo', cls: 'st-ativo', dotColor: '#10b981' },
  { value: 'manutencao', label: 'Manutenção', cls: 'st-manutencao', dotColor: '#f97316' },
  { value: 'reserva', label: 'Reserva', cls: 'st-reserva', dotColor: '#3b82f6' },
  { value: 'desativado', label: 'Desativado', cls: 'st-desativado', dotColor: '#9ca3af' },
] as const;

export function AssetForm({ onSubmit, onCancel, initial }: AssetFormProps) {
  const [nome, setNome] = useState(initial?.nome || '');
  const [tipo, setTipo] = useState<Asset['tipo']>(initial?.tipo || 'computador');
  const [numeroSerie, setNumeroSerie] = useState(initial?.numero_serie || '');
  const [patrimonio, setPatrimonio] = useState(initial?.patrimonio || '');
  const [localizacao, setLocalizacao] = useState(initial?.localizacao || '');
  const [status, setStatus] = useState<Asset['status']>(initial?.status || 'ativo');
  const [observacoes, setObservacoes] = useState(initial?.observacoes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    onSubmit({ nome: nome.trim(), tipo, numero_serie: numeroSerie || undefined, patrimonio: patrimonio || undefined, localizacao: localizacao || undefined, status, observacoes: observacoes || undefined });
  };

  return (
    <>
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
              <input className="af-input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Notebook Dell Latitude 5520" required />
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