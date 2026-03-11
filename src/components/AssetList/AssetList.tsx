import { useState } from 'react';
import './AssetList.css';

export interface Asset {
  id: number;
  nome: string;
  tipo: 'computador' | 'monitor' | 'impressora' | 'telefone' | 'servidor' | 'switch' | 'outro';
  numero_serie?: string;
  patrimonio?: string;
  localizacao?: string;
  status: 'ativo' | 'manutencao' | 'reserva' | 'desativado';
  responsavel_id?: number;
  responsavel_nome?: string;
  responsavel_email?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  chamados?: any[];
}

interface AssetListProps {
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  onNewAsset: () => void;
}

const TIPO_LABELS: Record<string, string> = {
  computador: 'Computador', monitor: 'Monitor', impressora: 'Impressora',
  telefone: 'Telefone', servidor: 'Servidor', switch: 'Switch', outro: 'Outro',
};

const TIPO_ICONS: Record<string, string> = {
  computador: 'M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16',
  monitor: 'M20 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM8 21h8m-4-4v4',
  impressora: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  telefone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  servidor: 'M2 9h20v6H2zM2 3h20v6H2zM2 15h20v6H2zM6 6h.01M6 12h.01M6 18h.01',
  switch: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  outro: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6v4m0 4h.01',
};

// Mock data — replace with real API call
const MOCK_ASSETS: Asset[] = [
  { id: 1, nome: 'Notebook Dell Latitude', tipo: 'computador', numero_serie: 'SN-2024-001', patrimonio: 'PAT-001', localizacao: 'Sala TI', status: 'ativo', responsavel_nome: 'João Silva', created_at: '2024-01-10T08:00:00', updated_at: '2024-01-15T10:00:00', chamados: [{}] },
  { id: 2, nome: 'Monitor LG 24"', tipo: 'monitor', numero_serie: 'SN-2024-002', patrimonio: 'PAT-002', localizacao: 'RH', status: 'ativo', responsavel_nome: 'Maria Santos', created_at: '2024-01-10T08:00:00', updated_at: '2024-01-10T08:00:00', chamados: [] },
  { id: 3, nome: 'Impressora HP LaserJet', tipo: 'impressora', numero_serie: 'SN-2023-015', patrimonio: 'PAT-015', localizacao: 'Recepção', status: 'manutencao', responsavel_nome: 'João Silva', created_at: '2023-06-01T08:00:00', updated_at: '2024-01-14T09:00:00', chamados: [{}, {}] },
  { id: 4, nome: 'Switch Cisco 24p', tipo: 'switch', numero_serie: 'SN-2022-003', patrimonio: 'PAT-003', localizacao: 'Rack Principal', status: 'ativo', responsavel_nome: 'Carlos Tech', created_at: '2022-03-15T08:00:00', updated_at: '2022-03-15T08:00:00', chamados: [] },
  { id: 5, nome: 'Servidor Dell PowerEdge', tipo: 'servidor', numero_serie: 'SN-2021-001', patrimonio: 'PAT-004', localizacao: 'Sala Servidores', status: 'ativo', responsavel_nome: 'Carlos Tech', created_at: '2021-01-20T08:00:00', updated_at: '2024-01-01T08:00:00', chamados: [{}, {}, {}] },
];

export function AssetList({ assets, onSelectAsset, onNewAsset }: AssetListProps) {
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.nome.toLowerCase().includes(search.toLowerCase()) ||
      (a.numero_serie || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.patrimonio || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.localizacao || '').toLowerCase().includes(search.toLowerCase());
    const matchTipo = !filterTipo || a.tipo === filterTipo;
    const matchStatus = !filterStatus || a.status === filterStatus;
    return matchSearch && matchTipo && matchStatus;
  });

  const stats = {
    total: assets.length,
    ativos: assets.filter(a => a.status === 'ativo').length,
    manutencao: assets.filter(a => a.status === 'manutencao').length,
    desativados: assets.filter(a => a.status === 'desativado').length,
  };

  const statusClass = (s: string) => ({ ativo: 's-ativo', manutencao: 's-manutencao', reserva: 's-reserva', desativado: 's-desativado' }[s] || '');
  const statusLabel = (s: string) => ({ ativo: 'Ativo', manutencao: 'Manutenção', reserva: 'Reserva', desativado: 'Desativado' }[s] || s);

  return (
    <>
      <div className="al-wrap">
        <div className="al-header">
          <div>
            <h1 className="al-title">Gestão de Ativos</h1>
            <p className="al-sub">Inventário de equipamentos de TI — rastreabilidade completa</p>
          </div>
          <button className="al-btn-primary" onClick={onNewAsset}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Ativo
          </button>
        </div>

        {/* Stats */}
        <div className="al-stats">
          {[
            { label: 'Total', value: stats.total, bg: '#eef2ff', color: '#6366f1', iconPath: 'M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8' },
            { label: 'Ativos', value: stats.ativos, bg: '#ecfdf5', color: '#10b981', iconPath: 'M20 6L9 17l-5-5' },
            { label: 'Em Manutenção', value: stats.manutencao, bg: '#fff7ed', color: '#f97316', iconPath: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' },
            { label: 'Desativados', value: stats.desativados, bg: '#f3f4f6', color: '#9ca3af', iconPath: 'M18 6L6 18M6 6l12 12' },
          ].map(s => (
            <div key={s.label} className="al-stat">
              <div className="al-stat-icon" style={{ background: s.bg }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.iconPath}/></svg>
              </div>
              <div>
                <p className="al-stat-label">{s.label}</p>
                <p className="al-stat-value">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="al-filters">
          <input className="al-search" placeholder="Buscar por nome, série, patrimônio, localização..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="al-filter-select" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="al-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="manutencao">Manutenção</option>
            <option value="reserva">Reserva</option>
            <option value="desativado">Desativado</option>
          </select>
        </div>

        {/* Table */}
        <div className="al-table-wrap">
          {filtered.length === 0 ? (
            <div className="al-empty">
              <div className="al-empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <p className="al-empty-title">Nenhum ativo encontrado</p>
              <p className="al-empty-sub">Tente ajustar os filtros ou cadastre um novo ativo.</p>
            </div>
          ) : (
            <table className="al-table">
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Tipo</th>
                  <th>Localização</th>
                  <th>Status</th>
                  <th>Responsável</th>
                  <th>Chamados</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(asset => (
                  <tr key={asset.id} onClick={() => onSelectAsset(asset)}>
                    <td>
                      <div style={{ fontWeight: 500, color: '#111827', marginBottom: 2 }}>{asset.nome}</div>
                      {asset.patrimonio && <div style={{ fontSize: 11.5, color: '#9ca3af' }}>Patrimônio: {asset.patrimonio}</div>}
                      {asset.numero_serie && <div style={{ fontSize: 11.5, color: '#9ca3af' }}>Série: {asset.numero_serie}</div>}
                    </td>
                    <td>
                      <span className="al-tipo-badge">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={TIPO_ICONS[asset.tipo]}/></svg>
                        {TIPO_LABELS[asset.tipo]}
                      </span>
                    </td>
                    <td style={{ color: asset.localizacao ? '#374151' : '#c4c9d4' }}>{asset.localizacao || '—'}</td>
                    <td>
                      <span className={`al-status-badge ${statusClass(asset.status)}`}>
                        <span className="dot"/>{statusLabel(asset.status)}
                      </span>
                    </td>
                    <td style={{ color: asset.responsavel_nome ? '#374151' : '#c4c9d4' }}>{asset.responsavel_nome || '—'}</td>
                    <td>
                      <span className="al-ticket-count">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        {asset.chamados?.length ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}