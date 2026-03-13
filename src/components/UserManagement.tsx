import { useState, useEffect } from 'react';
import { users as usersApi } from '../api';

interface User {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  avatar_url: string | null;
  ativo?: boolean;
}

interface Props {
  onBack: () => void;
}

const CARGO_LABEL: Record<string, string> = {
  admin: 'Administrador',
  tecnico: 'Técnico TI',
  usuario: 'Usuário',
};
const CARGO_COLOR: Record<string, string> = {
  admin: '#4f46e5',
  tecnico: '#4f46e5',
  usuario: '#059669',
};

const CSS = `
  .um-wrap { max-width: 860px; margin: 0 auto; padding: 28px 24px; font-family: 'DM Sans', sans-serif; }
  .um-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .um-title { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; color: #0f1117; margin: 0 0 3px; }
  .um-sub { font-size: 13px; color: #9ca3af; margin: 0; }
  .um-search-bar { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
  .um-search-input { flex: 1; min-width: 200px; height: 40px; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 0 14px 0 38px; font-size: 13.5px; color: #111827; font-family: 'DM Sans', sans-serif; outline: none; background: #fff; }
  .um-search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
  .um-search-wrap { position: relative; flex: 1; min-width: 200px; }
  .um-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
  .um-select { height: 40px; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 0 12px; font-size: 13px; color: #374151; font-family: 'DM Sans', sans-serif; outline: none; background: #fff; cursor: pointer; }
  .um-select:focus { border-color: #6366f1; }
  .um-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .um-th { padding: 11px 16px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; background: #f9fafb; border-bottom: 1px solid #f0f1f5; text-align: left; }
  .um-tr { border-bottom: 1px solid #f7f8fc; transition: background 0.1s; }
  .um-tr:last-child { border-bottom: none; }
  .um-tr:hover { background: #fafbff; }
  .um-td { padding: 13px 16px; font-size: 13.5px; color: #374151; vertical-align: middle; }
  .um-avatar { width: 34px; height: 34px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 2px solid #f0f1f5; }
  .um-cargo-pill { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; display: inline-block; }
  .um-action-btn { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 7px; color: #9ca3af; transition: all 0.15s; }
  .um-action-btn:hover { background: #f3f4f6; color: #374151; }
  .um-action-btn.danger:hover { background: #fef2f2; color: #ef4444; }
  .um-empty { text-align: center; padding: 50px 0; color: #9ca3af; font-size: 14px; }

  /* Modal */
  .um-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(2px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
  .um-modal { background: #fff; border-radius: 18px; padding: 28px; width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); font-family: 'DM Sans', sans-serif; }
  .um-modal-title { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; color: #0f1117; margin: 0 0 20px; }
  .um-field { margin-bottom: 16px; }
  .um-label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.04em; }
  .um-input { width: 100%; height: 40px; border: 1.5px solid #e5e7eb; border-radius: 9px; padding: 0 12px; font-size: 13.5px; color: #111827; font-family: 'DM Sans', sans-serif; outline: none; box-sizing: border-box; }
  .um-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
  .um-modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }
  .um-btn-ghost { height: 38px; padding: 0 16px; border: 1.5px solid #e5e7eb; border-radius: 9px; background: #fff; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .um-btn-ghost:hover { background: #f9fafb; }
  .um-btn-primary { height: 38px; padding: 0 20px; border: none; border-radius: 9px; background: linear-gradient(135deg, #6366f1, #4f46e5); font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .um-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .um-btn-danger { height: 38px; padding: 0 20px; border: none; border-radius: 9px; background: #ef4444; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .um-error { font-size: 12px; color: #ef4444; margin-top: 5px; }
  .um-inactive { opacity: 0.45; }
`;

type ModalMode = 'edit' | 'reset-password' | 'deactivate' | null;

export function UserManagement({ onBack }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cargoFilter, setCargoFilter] = useState('all');
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCargo, setFormCargo] = useState('usuario');
  const [formPassword, setFormPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await (usersApi as any).list(undefined, true);
      setUsers(data as User[]);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const openEdit = (u: User) => {
    setFormNome(u.nome); setFormEmail(u.email); setFormCargo(u.cargo); setFormPassword(''); setFormError('');
    setSelectedUser(u);
    setModal('edit');
  };

  const openResetPassword = (u: User) => {
    setFormPassword(''); setFormError('');
    setSelectedUser(u);
    setModal('reset-password');
  };

  const openDeactivate = (u: User) => {
    setSelectedUser(u);
    setModal('deactivate');
  };

  const closeModal = () => { setModal(null); setSelectedUser(null); setFormError(''); };

  const handleEdit = async () => {
    if (!formNome.trim()) return setFormError('Nome é obrigatório.');
    if (!selectedUser) return;
    setSaving(true); setFormError('');
    try {
      await (usersApi as any).updateUser(selectedUser.id, { nome: formNome.trim(), cargo: formCargo });
      closeModal();
      loadUsers();
    } catch (e: any) {
      setFormError(e?.message || 'Erro ao atualizar usuário.');
    } finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!formPassword || formPassword.length < 6) return setFormError('Senha deve ter pelo menos 6 caracteres.');
    if (!selectedUser) return;
    setSaving(true); setFormError('');
    try {
      await (usersApi as any).resetPassword(selectedUser.id, formPassword);
      closeModal();
    } catch (e: any) {
      setFormError(e?.message || 'Erro ao redefinir senha.');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await (usersApi as any).deactivateUser(selectedUser.id);
      closeModal();
      loadUsers();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchCargo = cargoFilter === 'all' || u.cargo === cargoFilter || (cargoFilter === 'tecnico' && u.cargo === 'admin');
    return matchSearch && matchCargo;
  });

  const initials = (nome: string) => nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <style>{CSS}</style>
      <div className="um-wrap">
        <div className="um-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, padding: 0, fontFamily: 'DM Sans, sans-serif' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                Voltar
              </button>
            </div>
            <h1 className="um-title">Gerenciar Usuários</h1>
            <p className="um-sub">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
          </div>

        </div>

        {/* Filters */}
        <div className="um-search-bar">
          <div className="um-search-wrap">
            <svg className="um-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="um-search-input" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="um-select" value={cargoFilter} onChange={e => setCargoFilter(e.target.value)}>
            <option value="all">Todos os cargos</option>
            <option value="tecnico">Técnico TI</option>
            <option value="usuario">Usuário</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="um-empty">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="um-empty">
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            {search || cargoFilter !== 'all' ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado ainda.'}
          </div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-th">Usuário</th>
                <th className="um-th">Email</th>
                <th className="um-th">Cargo</th>
                <th className="um-th" style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const color = CARGO_COLOR[u.cargo] || '#6b7280';
                const inactive = u.ativo === false;
                return (
                  <tr key={u.id} className={`um-tr${inactive ? ' um-inactive' : ''}`}>
                    <td className="um-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="um-avatar" style={{ background: u.avatar_url ? 'none' : `linear-gradient(135deg, ${color}cc, ${color})` }}>
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt={u.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'Sora, sans-serif' }}>{initials(u.nome)}</span>
                          }
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: 13.5 }}>{u.nome}</div>
                          {inactive && <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Desativado</div>}
                        </div>
                      </div>
                    </td>
                    <td className="um-td" style={{ color: '#6b7280', fontSize: 13 }}>{u.email}</td>
                    <td className="um-td">
                      <span className="um-cargo-pill" style={{ background: `${color}15`, color }}>
                        {CARGO_LABEL[u.cargo] || u.cargo}
                      </span>
                    </td>
                    <td className="um-td" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        {/* Edit */}
                        <button className="um-action-btn" onClick={() => openEdit(u)} title="Editar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {/* Reset password */}
                        <button className="um-action-btn" onClick={() => openResetPassword(u)} title="Redefinir senha">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </button>
                        {/* Deactivate */}
                        {!inactive && (
                          <button className="um-action-btn danger" onClick={() => openDeactivate(u)} title="Desativar usuário">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

            {/* ── Edit Modal ────────────────────────────────── */}
      {modal === 'edit' && selectedUser && (
        <div className="um-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="um-modal">
            <h2 className="um-modal-title">Editar usuário</h2>
            <div className="um-field">
              <label className="um-label">Nome completo</label>
              <input className="um-input" value={formNome} onChange={e => setFormNome(e.target.value)} />
            </div>
            <div className="um-field">
              <label className="um-label">Email</label>
              <input className="um-input" value={formEmail} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>O email não pode ser alterado.</p>
            </div>
            <div className="um-field">
              <label className="um-label">Cargo</label>
              <select className="um-input" value={formCargo} onChange={e => setFormCargo(e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="usuario">Usuário</option>
                <option value="tecnico">Técnico TI</option>
              </select>
            </div>
            {formError && <p className="um-error">{formError}</p>}
            <div className="um-modal-footer">
              <button className="um-btn-ghost" onClick={closeModal}>Cancelar</button>
              <button className="um-btn-primary" onClick={handleEdit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ──────────────────────── */}
      {modal === 'reset-password' && selectedUser && (
        <div className="um-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="um-modal">
            <h2 className="um-modal-title">Redefinir senha</h2>
            <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 18 }}>Definir nova senha para <strong style={{ color: '#111827' }}>{selectedUser.nome}</strong>.</p>
            <div className="um-field">
              <label className="um-label">Nova senha</label>
              <input className="um-input" type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            {formError && <p className="um-error">{formError}</p>}
            <div className="um-modal-footer">
              <button className="um-btn-ghost" onClick={closeModal}>Cancelar</button>
              <button className="um-btn-primary" onClick={handleResetPassword} disabled={saving}>{saving ? 'Salvando...' : 'Redefinir'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate Modal ─────────────────────────── */}
      {modal === 'deactivate' && selectedUser && (
        <div className="um-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="um-modal">
            <h2 className="um-modal-title">Desativar usuário</h2>
            <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
              Tem certeza que deseja desativar <strong style={{ color: '#111827' }}>{selectedUser.nome}</strong>?
              O usuário não conseguirá mais fazer login.
            </p>
            <div className="um-modal-footer">
              <button className="um-btn-ghost" onClick={closeModal}>Cancelar</button>
              <button className="um-btn-danger" onClick={handleDeactivate} disabled={saving}>{saving ? 'Desativando...' : 'Desativar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}