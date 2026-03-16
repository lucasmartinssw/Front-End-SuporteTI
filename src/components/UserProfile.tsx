import { useState, useEffect, useRef } from 'react';
import { users as usersApi } from '../api';

interface ProfileChamado {
  id: number;
  titulo: string;
  created_at: string;
  updated_at: string;
  status: string;
  prioridade: string;
}

interface ProfileComentario {
  id: number;
  mensagem: string;
  enviado_em: string;
  chamado_id: number;
  chamado_titulo: string;
}

interface ProfileAtivo {
  id: number;
  nome: string;
  tipo: string;
  numero_serie: string;
  patrimonio: string;
  localizacao: string;
  status: string;
}

interface ProfileData {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  bio: string | null;
  avatar_url: string | null;
  chamados: ProfileChamado[];
  comentarios: ProfileComentario[];
  ativos: ProfileAtivo[];
}

interface Props {
  onBack: () => void;
  onTicketSelect?: (id: string) => void;
  onNameChange?: (name: string) => void;
  onAvatarChange?: (url: string) => void;
  readOnly?: boolean;
  profileUserId?: number;
}

const TAB_LABELS = ['Chamados', 'Comentários', 'Ativos'];

const STATUS_COLORS: Record<string, string> = {
  'Aberto': '#f59e0b',
  'Em Atendimento': '#3b82f6',
  'Concluído': '#10b981',
  'Fechado': '#9ca3af',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Urgente': '#ef4444',
  'Alta': '#f97316',
  'Média': '#f59e0b',
  'Baixa': '#22c55e',
};

export function UserProfile({ onBack, onTicketSelect, onNameChange, onAvatarChange, readOnly = false, profileUserId }: Props) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = profileUserId
        ? await (usersApi as any).getUserProfile(profileUserId)
        : await usersApi.getMe();
      setProfile(data);
      setEditNome(data.nome);
      setEditBio(data.bio || '');
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await usersApi.updateMe({ nome: editNome, bio: editBio });
      setProfile(prev => prev ? { ...prev, nome: editNome, bio: editBio } : null);
      onNameChange?.(editNome);
      setEditing(false);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const result = await usersApi.uploadAvatar(file);
      setProfile(prev => prev ? { ...prev, avatar_url: result.avatar_url } : null);
      onAvatarChange?.(result.avatar_url);
    } catch (err) {
      console.error('Erro ao enviar avatar:', err);
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      await usersApi.removeAvatar();
      setProfile(prev => prev ? { ...prev, avatar_url: null } : null);
      onAvatarChange?.('');
    } catch (err) {
      console.error('Erro ao remover avatar:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const cargoLabel = (cargo: string) => ({
    admin: 'Analista TI',
    tecnico: 'Técnico TI',
    usuario: 'Usuário',
  }[cargo] || cargo);

  const cargoColor = (cargo: string) => ({
    admin: '#4f46e5',
    tecnico: '#4f46e5',
    usuario: '#059669',
  }[cargo] || '#6b7280');

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ color: '#9ca3af', fontSize: 14 }}>Carregando perfil...</div>
    </div>
  );

  if (!profile) return null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontWeight: 500, marginBottom: 24, padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Voltar
      </button>

      {/* Profile card */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f0f1f5', overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        {/* Header banner */}
        <div style={{ height: 90, background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)' }} />

        <div style={{ padding: '0 28px 28px' }}>
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44, marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              {/* Avatar */}
              <div
                onClick={() => !readOnly && !avatarUploading && fileRef.current?.click()}
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  border: '4px solid #fff',
                  background: profile.avatar_url ? 'none' : 'linear-gradient(135deg, #4f46e5, #818cf8)',
                  overflow: 'hidden', cursor: 'pointer', position: 'relative',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title={readOnly ? undefined : "Clique para trocar foto"}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 32, fontWeight: 700, color: '#fff', fontFamily: 'Sora, sans-serif' }}>
                    {profile.nome.charAt(0).toUpperCase()}
                  </span>
                )}
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: avatarUploading ? 1 : 0, transition: 'opacity 0.2s',
                  borderRadius: '50%',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => !avatarUploading && (e.currentTarget.style.opacity = '0')}
                >
                  {avatarUploading
                    ? <div style={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  }
                </div>
              </div>
              {!readOnly && <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />}
              {!readOnly && profile?.avatar_url && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  title="Remover foto"
                  style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, color: '#ef4444', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, padding: 0, opacity: avatarUploading ? 0.5 : 1 }}
                >
                  Remover foto
                </button>
              )}
            </div>

            {/* Edit / Save buttons */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 52 }}>
              {!readOnly && (editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="btn-ghost" style={{ fontSize: 13, padding: '7px 14px' }}>Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: '7px 16px' }}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-ghost" style={{ fontSize: 13, padding: '7px 14px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar perfil
                </button>
              ))}
            </div>
          </div>

          {/* Name + role */}
          {!readOnly && editing ? (
            <input
              value={editNome}
              onChange={e => setEditNome(e.target.value)}
              style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, color: '#0f1117', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', width: '100%', maxWidth: 320, marginBottom: 4, outline: 'none' }}
            />
          ) : (
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 22, fontWeight: 700, color: '#0f1117', margin: '0 0 4px' }}>{profile.nome}</h2>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{profile.email}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: `${cargoColor(profile.cargo)}18`, color: cargoColor(profile.cargo) }}>
              {cargoLabel(profile.cargo)}
            </span>
          </div>

          {/* Bio */}
          {!readOnly && editing ? (
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="Escreva uma breve descrição sobre você..."
              maxLength={500}
              rows={3}
              style={{ width: '100%', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          ) : (
            <p style={{ fontSize: 14, color: profile.bio ? '#374151' : '#9ca3af', margin: 0, lineHeight: 1.6, fontStyle: profile.bio ? 'normal' : 'italic' }}>
              {profile.bio || (readOnly ? 'Sem descrição.' : 'Nenhuma descrição adicionada. Clique em "Editar perfil" para adicionar.')}
            </p>
          )}

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 28, marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f1f5' }}>
            {[
              { label: 'Chamados', value: profile.chamados.length },
              { label: 'Comentários', value: profile.comentarios.length },
              { label: 'Ativos', value: profile.ativos.length },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Sora, sans-serif', color: '#0f1117' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f0f1f5', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f1f5' }}>
          {TAB_LABELS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                flex: 1, padding: '14px 20px', fontSize: 13.5, fontWeight: activeTab === i ? 600 : 500,
                color: activeTab === i ? '#4f46e5' : '#6b7280',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === i ? '2.5px solid #4f46e5' : '2.5px solid transparent',
                transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {tab}
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, background: activeTab === i ? '#eef2ff' : '#f3f4f6', color: activeTab === i ? '#4f46e5' : '#9ca3af', padding: '1px 7px', borderRadius: 10 }}>
                {i === 0 ? profile.chamados.length : i === 1 ? profile.comentarios.length : profile.ativos.length}
              </span>
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {/* Chamados tab */}
          {activeTab === 0 && (
            profile.chamados.length === 0
              ? <EmptyState icon="🎫" text="Nenhum chamado encontrado" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {profile.chamados.map(c => (
                    <div
                      key={c.id}
                      onClick={() => onTicketSelect?.(String(c.id))}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, border: '1px solid #f0f1f5', cursor: onTicketSelect ? 'pointer' : 'default', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{c.titulo}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {c.prioridade && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: `${PRIORITY_COLORS[c.prioridade] || '#9ca3af'}18`, color: PRIORITY_COLORS[c.prioridade] || '#9ca3af' }}>
                            {c.prioridade}
                          </span>
                        )}
                        {c.status && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: `${STATUS_COLORS[c.status] || '#9ca3af'}18`, color: STATUS_COLORS[c.status] || '#9ca3af' }}>
                            {c.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {/* Comentários tab */}
          {activeTab === 1 && (
            profile.comentarios.length === 0
              ? <EmptyState icon="💬" text="Nenhum comentário encontrado" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {profile.comentarios.map(c => (
                    <div
                      key={c.id}
                      onClick={() => onTicketSelect?.(String(c.chamado_id))}
                      style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid #f0f1f5', cursor: onTicketSelect ? 'pointer' : 'default', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#4f46e5' }}>#{c.chamado_id} — {c.chamado_titulo}</span>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(c.enviado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <p style={{ fontSize: 13.5, color: '#374151', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.mensagem}
                      </p>
                    </div>
                  ))}
                </div>
          )}

          {/* Ativos tab */}
          {activeTab === 2 && (
            profile.ativos.length === 0
              ? <EmptyState icon="🖥️" text="Nenhum ativo atribuído" />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {profile.ativos.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, border: '1px solid #f0f1f5' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{a.nome}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{a.tipo}{a.localizacao ? ` · ${a.localizacao}` : ''}{a.patrimonio ? ` · ${a.patrimonio}` : ''}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: a.status === 'ativo' ? '#d1fae5' : '#f3f4f6', color: a.status === 'ativo' ? '#059669' : '#6b7280' }}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  );
}