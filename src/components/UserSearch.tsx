import { useState, useEffect, useRef } from 'react';
import { users as usersApi } from '../api';

interface UserEntry {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  avatar_url: string | null;
}

interface Props {
  onClose: () => void;
  onUserSelect: (userId: number) => void;
}

const CARGO_LABEL: Record<string, string> = {
  admin: 'Analista TI',
  tecnico: 'Técnico TI',
  usuario: 'Usuário',
};

const CARGO_COLOR: Record<string, string> = {
  admin: '#4f46e5',
  tecnico: '#4f46e5',
  usuario: '#059669',
};


export function UserSearch({ onClose, onUserSelect }: Props) {
  const [allUsers, setAllUsers] = useState<UserEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await usersApi.list();
      setAllUsers(data as UserEntry[]);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: UserEntry) => {
    onUserSelect(user.id);
  };

  const filtered = allUsers.filter(u => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (CARGO_LABEL[u.cargo] || '').toLowerCase().includes(q);
  });

  const grouped = {
    admin: filtered.filter(u => u.cargo === 'admin'),
    tecnico: filtered.filter(u => u.cargo === 'tecnico'),
    usuario: filtered.filter(u => u.cargo === 'usuario'),
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '100%', maxWidth: 520, maxHeight: '82vh',
    background: '#fff', borderRadius: 20, zIndex: 1001,
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'DM Sans, sans-serif', overflow: 'hidden',
  };

  // ── Search list ────────────────────────────────────────────
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000, backdropFilter: 'blur(2px)' }} />
      <div style={modalStyle}>
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #f0f1f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f7f8fc', borderRadius: 12, padding: '10px 14px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nome, email ou cargo..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#111827', fontFamily: 'DM Sans, sans-serif' }}
              onKeyDown={e => e.key === 'Escape' && onClose()}
            />
            {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, lineHeight: 1 }}>✕</button>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length} usuário{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}>Fechar</button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>Nenhum usuário encontrado
            </div>
          ) : (
            (['admin', 'tecnico', 'usuario'] as const).map(cargo => {
              const group = grouped[cargo];
              if (group.length === 0) return null;
              return (
                <div key={cargo}>
                  <div style={{ padding: '8px 20px 4px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {CARGO_LABEL[cargo]} ({group.length})
                  </div>
                  {group.map(user => <UserRow key={user.id} user={user} query={query} onClick={() => handleUserClick(user)} />)}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

function UserRow({ user, query, onClick }: { user: UserEntry; query: string; onClick: () => void }) {
  const initials = user.nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const color = CARGO_COLOR[user.cargo] || '#6b7280';

  const highlight = (text: string) => {
    if (!query.trim()) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return <>{text.slice(0, idx)}<mark style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 3, padding: '0 1px' }}>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>;
  };

  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 20px', cursor: 'pointer', transition: 'background 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', border: '2px solid #f0f1f5', background: user.avatar_url ? 'none' : `linear-gradient(135deg, ${color}cc, ${color})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {user.avatar_url
          ? <img src={user.avatar_url} alt={user.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Sora, sans-serif' }}>{initials}</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{highlight(user.nome)}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{highlight(user.email)}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0, background: `${color}15`, color }}>{CARGO_LABEL[user.cargo] || user.cargo}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  );
}

const TABS = ['Chamados', 'Comentários', 'Ativos'];