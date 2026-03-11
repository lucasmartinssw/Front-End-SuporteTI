import { useState, useEffect } from 'react';
import { auditoria as auditoriaApi, AuditoriaEntry } from '../api';

interface AuditLogProps {
  type: 'chamado' | 'ativo';
  id: number;
  titulo: string;
  onBack: () => void;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap');

  .al-root { animation: fadeUp 0.3s ease both; font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .al-back {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 500; color: #6b7280;
    background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 20px;
    transition: color 0.18s;
  }
  .al-back:hover { color: #111827; }

  .al-header { margin-bottom: 28px; }
  .al-header h1 {
    font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700;
    color: #111827; margin: 0 0 4px;
  }
  .al-header p { font-size: 13.5px; color: #6b7280; margin: 0; }

  .al-card {
    background: #fff; border: 1px solid #f0f1f5; border-radius: 14px;
    padding: 0; overflow: hidden;
  }

  .al-card-hdr {
    padding: 16px 24px; border-bottom: 1px solid #f7f8fc;
    display: flex; align-items: center; justify-content: space-between;
  }
  .al-card-hdr-title {
    font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600; color: #111827;
  }
  .al-count {
    font-size: 11.5px; color: #9ca3af; font-weight: 600;
    background: #f7f8fc; padding: 2px 8px; border-radius: 20px;
  }

  .al-timeline { padding: 8px 0; }

  .al-entry {
    display: flex; gap: 16px; padding: 14px 24px;
    border-bottom: 1px solid #f7f8fc; position: relative;
  }
  .al-entry:last-child { border-bottom: none; }

  .al-icon-wrap {
    width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; margin-top: 1px;
  }

  .al-body { flex: 1; min-width: 0; }
  .al-action {
    font-size: 13.5px; font-weight: 600; color: #111827; margin-bottom: 2px;
  }
  .al-detail {
    font-size: 12.5px; color: #6b7280; margin-bottom: 4px; line-height: 1.5;
  }
  .al-meta {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .al-actor {
    font-size: 11.5px; color: #9ca3af;
    display: flex; align-items: center; gap: 4px;
  }
  .al-time {
    font-size: 11.5px; color: #c4c9d4;
  }
  .al-cargo-pill {
    font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.4px;
  }

  .al-empty {
    text-align: center; padding: 48px 24px;
    font-size: 13px; color: #9ca3af;
  }
  .al-empty-icon {
    width: 48px; height: 48px; background: #f7f8fc; border-radius: 14px;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;
  }
  .al-loading {
    text-align: center; padding: 48px 24px; font-size: 13px; color: #9ca3af;
  }
`;

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  criado:              { label: 'Criado',               color: '#6366f1', bg: '#eef2ff', icon: 'M12 5v14M5 12h14' },
  status_alterado:     { label: 'Status alterado',      color: '#10b981', bg: '#ecfdf5', icon: 'M20 6L9 17l-5-5' },
  prioridade_alterada: { label: 'Prioridade alterada',  color: '#f59e0b', bg: '#fffbeb', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  tecnico_adicionado:  { label: 'Técnico adicionado',   color: '#6366f1', bg: '#eef2ff', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6' },
  tecnico_removido:    { label: 'Técnico removido',     color: '#ef4444', bg: '#fef2f2', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8h6' },
  mensagem_apagada:    { label: 'Mensagem apagada',     color: '#ef4444', bg: '#fef2f2', icon: 'M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2' },
  ativo_vinculado:     { label: 'Ativo vinculado',      color: '#0891b2', bg: '#ecfeff', icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
  ativo_desvinculado:  { label: 'Ativo desvinculado',   color: '#6b7280', bg: '#f3f4f6', icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
  campo_alterado:      { label: 'Campo alterado',       color: '#8b5cf6', bg: '#f5f3ff', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' },
  desativado:          { label: 'Desativado',           color: '#6b7280', bg: '#f3f4f6', icon: 'M18 6L6 18M6 6l12 12' },
};

const CARGO_COLORS: Record<string, { bg: string; color: string }> = {
  admin:   { bg: '#fef3c7', color: '#92400e' },
  tecnico: { bg: '#e0e7ff', color: '#3730a3' },
  usuario: { bg: '#f3f4f6', color: '#374151' },
};

export function AuditLog({ type, id, titulo, onBack }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditoriaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = type === 'chamado'
          ? await auditoriaApi.getChamado(id)
          : await auditoriaApi.getAtivo(id);
        setEntries(data.reverse()); // newest first
      } catch (e: any) {
        setError('Erro ao carregar histórico.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [type, id]);

  const fmtDate = (s: string) =>
    new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(s));

  return (
    <>
      <style>{styles}</style>
      <div className="al-root">
        <button className="al-back" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </button>

        <div className="al-header">
          <h1>Histórico de alterações</h1>
          <p>{type === 'chamado' ? 'Chamado' : 'Ativo'}: <strong>{titulo}</strong></p>
        </div>

        <div className="al-card">
          <div className="al-card-hdr">
            <span className="al-card-hdr-title">Linha do tempo</span>
            {!loading && <span className="al-count">{entries.length} {entries.length === 1 ? 'evento' : 'eventos'}</span>}
          </div>

          {loading ? (
            <div className="al-loading">Carregando histórico...</div>
          ) : error ? (
            <div className="al-empty">{error}</div>
          ) : entries.length === 0 ? (
            <div className="al-empty">
              <div className="al-empty-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              Nenhuma alteração registrada ainda.
            </div>
          ) : (
            <div className="al-timeline">
              {entries.map(entry => {
                const cfg = ACTION_CONFIG[entry.acao] || ACTION_CONFIG.campo_alterado;
                const cargo = CARGO_COLORS[entry.user_cargo] || CARGO_COLORS.usuario;
                return (
                  <div key={entry.id} className="al-entry">
                    <div className="al-icon-wrap" style={{ background: cfg.bg }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={cfg.icon}/>
                      </svg>
                    </div>
                    <div className="al-body">
                      <p className="al-action" style={{ color: cfg.color }}>{cfg.label}</p>
                      <p className="al-detail">{entry.detalhe}</p>
                      <div className="al-meta">
                        <span className="al-actor">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          {entry.user_nome || entry.user_email}
                        </span>
                        <span className="al-cargo-pill" style={{ background: cargo.bg, color: cargo.color }}>
                          {entry.user_cargo}
                        </span>
                        <span className="al-time">{fmtDate(entry.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}