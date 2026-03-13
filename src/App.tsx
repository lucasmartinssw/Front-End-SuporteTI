import { useState, useEffect } from 'react';
import iconImg from './assets/Icon test blue simple.png';
import { exportDashboardPDF } from './pdfExport';
import { chamados as chamadosApi, ativos as ativosApi, users as usersApi, notificacoes as notificacoesApi, setToken, STATUS_MAP, PRIORITY_MAP, STATUS_ID_MAP, PRIORITY_ID_MAP, Notificacao } from './api';
import { computeSLA } from './sla';
import { computeWarranty } from './warranty';
import { AssetList, Asset } from './components/AssetList';
import { AssetForm } from './components/AssetForm';
import { AssetDetail } from './components/AssetDetail';
import { AuditLog } from './components/AuditLog';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { TicketForm, Ticket } from './components/TicketForm';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { toast } from 'sonner';
import { Login } from './components/Login';
import { UserProfile } from './components/UserProfile';
import { UserSearch } from './components/UserSearch';
import { UserManagement } from './components/UserManagement';



const STATUS_COLORS: Record<string, string> = {
  'Aberto': '#f59e0b', 'Em Progresso': '#3b82f6', 'Resolvido': '#10b981', 'Fechado': '#e5e7eb',
};
const PRIORITY_COLORS: Record<string, string> = {
  'Urgente': '#ef4444', 'Alto': '#f97316', 'Médio': '#f59e0b', 'Baixo': '#22c55e',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f1117', borderRadius: 8, padding: '7px 11px', border: '1px solid #1f2937' }}>
      <p style={{ fontSize: 10.5, color: '#6b7280', marginBottom: 3 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: 12.5, fontWeight: 600, color: p.color || '#fff' }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const appStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #f7f8fc; color: #111827; -webkit-font-smoothing: antialiased; }

  .app-header {
    background: rgba(255,255,255,0.9); backdrop-filter: blur(12px);
    border-bottom: 1px solid #f0f1f5; position: sticky; top: 0; z-index: 50;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .app-header-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; height: 60px; display: flex; align-items: center; justify-content: space-between; }
  .header-left { display: flex; align-items: center; gap: 32px; }
  .logo { display: flex; align-items: center; gap: 9px; }
  .logo-icon { width: 36px; height: 36px; border-radius: 9px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .logo-text { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 600; color: #0f1117; letter-spacing: -0.3px; }
  .app-nav { display: flex; align-items: center; gap: 2px; }
  .nav-btn { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; color: #6b7280; background: none; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: all 0.18s; }
  .nav-btn:hover { color: #111827; background: #f3f4f6; }
  .nav-btn.active { color: #4f46e5; background: #eef2ff; font-weight: 600; }
  .header-right { display: flex; align-items: center; gap: 12px; }
  .welcome-badge { font-size: 13px; color: #9ca3af; transition: color 0.15s; }
  .welcome-badge:hover { color: #4f46e5; }
  .welcome-badge:hover strong { color: #4f46e5; }
  .welcome-badge strong { color: #374151; font-weight: 600; }

  /* Role badge in header */
  .role-pill {
    font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
    letter-spacing: 0.3px; text-transform: uppercase;
  }
  .role-pill.client { background: #eff6ff; color: #1d4ed8; }
  .role-pill.tech { background: #f0fdf4; color: #166534; }

  .btn-ghost { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #6b7280; background: none; border: 1.5px solid #e5e7eb; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: all 0.18s; }
  .btn-ghost:hover { color: #374151; border-color: #d1d5db; background: #f9fafb; }
  .app-main { max-width: 1200px; margin: 0 auto; padding: 36px 32px; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  .dash-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; animation: fadeUp 0.35s ease both; }
  .dash-title { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 700; color: #0f1117; letter-spacing: -0.4px; margin-bottom: 4px; }
  .dash-sub { font-size: 14px; color: #9ca3af; }

  .btn-primary { display: flex; align-items: center; gap: 7px; font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600; color: #fff; background: linear-gradient(135deg, #4f46e5, #6366f1); border: none; padding: 9px 18px; border-radius: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 3px 10px rgba(99,102,241,0.3); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(99,102,241,0.4); }

  /* Stat cards */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
  .stat-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
  .stat-card { background: #fff; border-radius: 14px; padding: 22px 24px; border: 1px solid #f0f1f5; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; animation: fadeUp 0.35s ease both; }
  .stat-card:nth-child(1) { animation-delay: 0.05s; }
  .stat-card:nth-child(2) { animation-delay: 0.1s; }
  .stat-card:nth-child(3) { animation-delay: 0.15s; }
  .stat-card:nth-child(4) { animation-delay: 0.2s; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
  .stat-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; border-radius: 14px 0 0 14px; }
  .stat-card.total::before { background: #6366f1; }
  .stat-card.open::before { background: #f59e0b; }
  .stat-card.inprogress::before { background: #3b82f6; }
  .stat-card.resolved::before { background: #10b981; }
  .stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
  .stat-card.total .stat-icon { background: #eef2ff; }
  .stat-card.open .stat-icon { background: #fffbeb; }
  .stat-card.inprogress .stat-icon { background: #eff6ff; }
  .stat-card.resolved .stat-icon { background: #ecfdf5; }
  .stat-label { font-size: 12px; font-weight: 500; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .stat-value { font-family: 'Sora', sans-serif; font-size: 30px; font-weight: 700; color: #0f1117; letter-spacing: -1px; line-height: 1; }
  .stat-trend { font-size: 11px; margin-top: 5px; font-weight: 600; }

  /* Chart cards */
  .d-card { background: #fff; border: 1px solid #f0f1f5; border-radius: 14px; overflow: hidden; animation: fadeUp 0.4s ease both; }
  .d-card-hdr { padding: 14px 18px 12px; display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid #f7f8fc; }
  .d-card-title { font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 6px; }
  .d-card-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  .d-card-body { padding: 16px 18px; }

  .donut-wrap { display: flex; align-items: center; gap: 16px; }
  .donut-legend { display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .legend-row { display: flex; align-items: center; justify-content: space-between; }
  .legend-left { display: flex; align-items: center; gap: 7px; }
  .legend-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .legend-label { font-size: 12px; color: #374151; font-weight: 500; }
  .legend-val { font-size: 12px; color: #6b7280; font-weight: 600; }

  .recent-list { display: flex; flex-direction: column; }
  .recent-item { display: flex; align-items: center; gap: 11px; padding: 9px 0; border-bottom: 1px solid #f7f8fc; cursor: pointer; transition: opacity 0.15s; }
  .recent-item:last-child { border-bottom: none; padding-bottom: 0; }
  .recent-item:hover { opacity: 0.75; }
  .recent-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .recent-body { flex: 1; min-width: 0; }
  .recent-title { font-size: 12.5px; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
  .recent-meta { font-size: 11px; color: #9ca3af; }

  /* User dashboard empty state */
  .user-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 32px; background: #fff; border: 1px solid #f0f1f5; border-radius: 14px; text-align: center; }
  .user-empty-icon { width: 56px; height: 56px; background: #eef2ff; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  .user-empty-title { font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 600; color: #111827; margin-bottom: 6px; }
  .user-empty-sub { font-size: 13.5px; color: #9ca3af; margin-bottom: 20px; }

  /* Timeline */
  .timeline { display: flex; flex-direction: column; gap: 0; }
  .tl-entry { display: flex; gap: 12px; padding: 10px 0; position: relative; }
  .tl-entry:not(:last-child)::after { content: ''; position: absolute; left: 11px; top: 34px; bottom: 0; width: 1px; background: #f0f1f5; }
  .tl-dot { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .tl-body { flex: 1; }
  .tl-title { font-size: 13px; font-weight: 500; color: #111827; margin-bottom: 2px; }
  .tl-time { font-size: 11px; color: #9ca3af; }

  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .bdot { width: 5px; height: 5px; border-radius: 50%; }
  .b-open { background: #fffbeb; color: #b45309; }
  .b-open .bdot { background: #f59e0b; }
  .b-in-progress { background: #eff6ff; color: #1d4ed8; }
  .b-in-progress .bdot { background: #3b82f6; }
  .b-resolved { background: #ecfdf5; color: #065f46; }
  .b-resolved .bdot { background: #10b981; }
  .b-closed { background: #f3f4f6; color: #4b5563; }
  .b-urgent { background: #fef2f2; color: #991b1b; }
  .b-high { background: #fff7ed; color: #9a3412; }
  .b-medium { background: #fffbeb; color: #92400e; }
  .b-low { background: #f0fdf4; color: #166534; }

  @media (max-width: 900px) {
    .stat-grid, .stat-grid-3 { grid-template-columns: repeat(2, 1fr); }
    .app-header-inner, .app-main { padding-left: 20px; padding-right: 20px; }
  }
  @media (max-width: 640px) {
    .app-header-inner { padding: 0 16px; height: 56px; }
    .app-main { padding: 16px; }
    .logo-text { display: none; }
    .app-nav { gap: 0; }
    .nav-btn { padding: 6px 10px; font-size: 12.5px; }
    .header-right { gap: 6px; }
    .user-pill { display: none; }
    .stat-grid, .stat-grid-3 { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .chart-grid { grid-template-columns: 1fr; }
    .recent-grid { grid-template-columns: 1fr; }
    .user-pill-name { max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
  @media (max-width: 400px) {
    .nav-btn { padding: 6px 8px; font-size: 12px; }
    .stat-grid, .stat-grid-3 { grid-template-columns: 1fr 1fr; }
  }
`;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('auth_token'));
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [userRole, setUserRole] = useState<'client' | 'it-executive'>(() => (localStorage.getItem('auth_role') as any) || 'client');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('auth_email') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('auth_name') || '');
  const [userAvatar, setUserAvatar] = useState<string | null>(() => localStorage.getItem('auth_avatar') || null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [profileUserId, setProfileUserId] = useState<number | undefined>(undefined);
  const [activeView, setActiveView] = useState<'dashboard' | 'tickets' | 'submit' | 'detail' | 'assets' | 'asset-form' | 'asset-detail' | 'audit-chamado' | 'audit-ativo' | 'profile' | 'users'>(() => {
    return (sessionStorage.getItem('nav_view') as any) || 'dashboard';
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<{id: number; nome: string; email: string}[]>([]);

  // Restore api.ts module token on page load (localStorage session restore)
  useEffect(() => {
    const stored = localStorage.getItem('auth_token');
    if (stored) setToken(stored);
  }, []);

  // Persist nav state to sessionStorage whenever it changes
  useEffect(() => { sessionStorage.setItem('nav_view', activeView); }, [activeView]);

  // Wrap setActiveView to also clear stale selected IDs when navigating away
  const navTo = (view: typeof activeView) => {
    if (view !== 'detail') sessionStorage.removeItem('nav_ticket_id');
    if (view !== 'asset-detail') sessionStorage.removeItem('nav_asset_id');
    setActiveView(view);
  };

  // Load tickets and assets from API when authenticated
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;
    loadData();
  }, [isAuthenticated, authToken]);

  // Listen for 401s dispatched by api.ts
  useEffect(() => {
    const onExpired = () => {
      handleSessionExpired();
    };
    window.addEventListener('session-expired', onExpired);
    return () => window.removeEventListener('session-expired', onExpired);
  }, []);

  // Poll notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifs = async () => {
      try {
        const data = await notificacoesApi.list();
        setNotificacoes(data);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSessionExpired = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_email');
    localStorage.removeItem('auth_name');
    setIsAuthenticated(false);
    setAuthToken(null);
    setToken(null);
    setTickets([]);
    setAssets([]);
    setNotificacoes([]);
    setSessionExpired(true);
  };

  const loadData = async () => {
    setIsLoadingData(true);
    setIsLoadingTickets(true);
    setIsLoadingAssets(true);
    try {
      // Load tickets
      const rawTickets = await chamadosApi.list();
      const mapped: Ticket[] = rawTickets.map((t: any) => ({
        id: String(t.id),
        title: t.titulo,
        description: t.descricao,
        priority: PRIORITY_MAP[t.prioridade_id] || 'medium',
        category: t.categoria || 'Outros',
        status: STATUS_MAP[t.status_id] || 'open',
        submittedBy: t.user_email || '',
        tecnicos: (t.tecnicos || []) as {id: number; nome: string; email: string}[],
        assetId: t.ativo_id,
        assetNome: t.ativo_nome,
        attachments: t.attachments || [],
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at ?? t.created_at),
        comments: [],
      }));
      setTickets(mapped);
      setIsLoadingTickets(false);

      // Load assets for all users (needed for ticket form dropdown)
      try {
        const rawAtivos = await ativosApi.list();
        setAssets(rawAtivos as any);
      } catch {
        // Non-critical — just leave assets empty if it fails
      }
      setIsLoadingAssets(false);

      // Load technicians list (for assignment dropdown)
      try {
        const rawTechs = await usersApi.list('tecnico');
        const rawAdmins = await usersApi.list('admin');
        const allTechs = [...rawTechs, ...rawAdmins];
        setTechnicians(allTechs.map((u: any) => ({ id: u.id, nome: u.nome, email: u.email })));
      } catch {
        // Non-critical
      }

      // Sync avatar and name from API
      try {
        const me = await usersApi.getMe();
        if (me.avatar_url) {
          setUserAvatar(me.avatar_url);
          localStorage.setItem('auth_avatar', me.avatar_url);
        }
        if (me.nome) {
          setUserName(me.nome);
          localStorage.setItem('auth_name', me.nome);
        }
      } catch {
        // Non-critical
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      if (err?.status === 401 || err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized') || err?.message?.toLowerCase().includes('token')) {
        handleSessionExpired();
      }
    } finally {
      setIsLoadingData(false);
      setIsLoadingTickets(false);
      setIsLoadingAssets(false);
    }
  };

  // After data loads, restore selected ticket/asset from sessionStorage
  useEffect(() => {
    const savedTicketId = sessionStorage.getItem('nav_ticket_id');
    const savedAssetId = sessionStorage.getItem('nav_asset_id');
    if (savedTicketId && tickets.length > 0) {
      const t = tickets.find(t => t.id === savedTicketId);
      if (t) setSelectedTicket(t);
      else { sessionStorage.removeItem('nav_ticket_id'); navTo('tickets'); }
    }
    if (savedAssetId && assets.length > 0) {
      const a = assets.find(a => String(a.id) === savedAssetId);
      if (a) setSelectedAsset(a as any);
      else { sessionStorage.removeItem('nav_asset_id'); navTo('assets'); }
    }
  }, [tickets, assets]);

  if (!isAuthenticated) {
    return <Login sessionExpired={sessionExpired} onLogin={(email, role, name, token) => {
      setSessionExpired(false);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_role', role);
      localStorage.setItem('auth_email', email);
      localStorage.setItem('auth_name', name);
      setUserEmail(email);
      setUserRole(role as any);
      setUserName(name);
      setAuthToken(token);
      setToken(token);
      setIsAuthenticated(true);
    }} />;
  }

  const handleSubmitTicket = async (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'comments'>, files?: File[]) => {
    try {
      const payload = {
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        category: ticketData.category,
      };
      if (files?.length) {
        await chamadosApi.createWithFiles(payload, files);
      } else {
        await chamadosApi.create(payload);
      }
      await loadData();
      navTo('tickets');
      toast.success('Chamado enviado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar chamado.');
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: Ticket['status']) => {
    try {
      await chamadosApi.update(Number(ticketId), { status_id: STATUS_ID_MAP[status] });
      const updated = tickets.map(t => t.id === ticketId ? { ...t, status, updatedAt: new Date() } : t);
      setTickets(updated);
      if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, status, updatedAt: new Date() } : null);
      toast.success('Status atualizado');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar status.');
    }
  };

  const handleAddTecnico = async (ticketId: string, userId: number) => {
    try {
      await chamadosApi.addTecnico(Number(ticketId), userId);
      const tech = technicians.find(t => t.id === userId);
      if (!tech) return;
      const addTech = (t: Ticket) => t.id === ticketId
        ? { ...t, tecnicos: [...(t.tecnicos || []), tech], updatedAt: new Date() } : t;
      setTickets(prev => prev.map(addTech));
      if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? addTech(prev) : null);
      toast.success(`${tech.nome} adicionado ao chamado!`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar técnico.');
    }
  };

  const handleRemoveTecnico = async (ticketId: string, userId: number) => {
    try {
      await chamadosApi.removeTecnico(Number(ticketId), userId);
      const removeTech = (t: Ticket) => t.id === ticketId
        ? { ...t, tecnicos: (t.tecnicos || []).filter((tc: any) => tc.id !== userId), updatedAt: new Date() } : t;
      setTickets(prev => prev.map(removeTech));
      if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? removeTech(prev) : null);
      toast.success('Técnico removido do chamado.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover técnico.');
    }
  };

  const handleAddComment = async (ticketId: string, comment: string, isInternal: boolean, files?: File[]) => {
    try {
      await chamadosApi.postMensagem(Number(ticketId), comment, isInternal, files);
      // Reload messages for the selected ticket
      const msgs = await chamadosApi.listMensagens(Number(ticketId));
      const mapped = msgs.map((m: any) => ({
        id: String(m.id),
        author: m.author_email || m.author_name,
        content: m.mensagem,
        timestamp: new Date(m.enviado_em),
        isInternal: m.is_internal,
        attachments: m.attachments || [],
      }));
      const updated = tickets.map(t => t.id === ticketId ? { ...t, comments: mapped, updatedAt: new Date() } : t);
      setTickets(updated);
      if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, comments: mapped, updatedAt: new Date() } : null);
      toast.success('Comentário adicionado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar comentário.');
    }
  };

  const handleRefreshComments = async (ticketId: string) => {
    try {
      const msgs = await chamadosApi.listMensagens(Number(ticketId));
      const mapped = msgs.map((m: any) => ({
        id: String(m.id),
        author: m.author_email || m.author_name,
        content: m.mensagem,
        timestamp: new Date(m.enviado_em),
        isInternal: m.is_internal,
        attachments: m.attachments || [],
      }));
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, comments: mapped } : t));
      setSelectedTicket(prev => prev?.id === ticketId ? { ...prev, comments: mapped } : prev);
    } catch {
      // Silent — polling failure should not interrupt the user
    }
  };

  const handleTicketSelect = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    sessionStorage.setItem('nav_ticket_id', ticket.id);
    navTo('detail');
    // Load messages from API
    try {
      const msgs = await chamadosApi.listMensagens(Number(ticket.id));
      const mapped = msgs.map((m: any) => ({
        id: String(m.id),
        author: m.author_email || m.author_name,
        content: m.mensagem,
        timestamp: new Date(m.enviado_em),
        isInternal: m.is_internal,
        attachments: m.attachments || [],
      }));
      setSelectedTicket(prev => prev ? { ...prev, comments: mapped } : null);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  // ── Helpers ──────────────────────────────────────────
  const statusLabel = (s: string) => ({ open: 'Aberto', 'in-progress': 'Em Progresso', resolved: 'Resolvido', closed: 'Fechado' }[s] || s);
  const statusBadgeClass = (s: string) => ({ open: 'b-open', 'in-progress': 'b-in-progress', resolved: 'b-resolved', closed: 'b-closed' }[s] || '');
  const priorityBadgeClass = (p: string) => ({ urgent: 'b-urgent', high: 'b-high', medium: 'b-medium', low: 'b-low' }[p] || '');
  const priorityLabel = (p: string) => ({ urgent: 'Urgente', high: 'Alto', medium: 'Médio', low: 'Baixo' }[p] || p);
  const statusIconBg = { open: '#fffbeb', 'in-progress': '#eff6ff', resolved: '#ecfdf5', closed: '#f3f4f6' } as Record<string, string>;
  const statusIconColor = { open: '#f59e0b', 'in-progress': '#3b82f6', resolved: '#10b981', closed: '#9ca3af' } as Record<string, string>;
  const fmtDate = (d: Date) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
  const timeAgo = (d: Date) => {
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'agora';
    if (h < 24) return `há ${h}h`;
    return `há ${Math.floor(h / 24)}d`;
  };

  // ── CLIENT dashboard — scoped to userEmail ───────────
  const myTickets = tickets.filter(t => t.submittedBy === userEmail);
  const myStats = {
    total: myTickets.length,
    open: myTickets.filter(t => t.status === 'open').length,
    inProgress: myTickets.filter(t => t.status === 'in-progress').length,
    resolved: myTickets.filter(t => t.status === 'resolved').length,
  };
  const myRecent = [...myTickets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
  const myActivity = [...myTickets]
    .filter(t => t.updatedAt.getTime() !== t.createdAt.getTime() || t.status !== 'open')
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  // ── TECH dashboard — system-wide ────────────────────
  const allStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    overdue: tickets.filter(t => {
      if (t.status !== 'open' && t.status !== 'in-progress') return false;
      return computeSLA(t.priority, t.status, t.createdAt).status === 'overdue';
    }).length,
  };

  const warrantyAlerts = assets.filter(a => {
    const w = computeWarranty(a.warranty_expires_at);
    return w.status === 'expiring' || w.status === 'expired';
  }).length;
  const statusData = [
    { name: 'Aberto', value: allStats.open, color: STATUS_COLORS['Aberto'] },
    { name: 'Em Progresso', value: allStats.inProgress, color: STATUS_COLORS['Em Progresso'] },
    { name: 'Resolvido', value: allStats.resolved, color: STATUS_COLORS['Resolvido'] },
    { name: 'Fechado', value: tickets.filter(t => t.status === 'closed').length, color: STATUS_COLORS['Fechado'] },
  ];
  const priorityData = [
    { name: 'Urgente', value: tickets.filter(t => t.priority === 'urgent').length, color: PRIORITY_COLORS['Urgente'] },
    { name: 'Alto', value: tickets.filter(t => t.priority === 'high').length, color: PRIORITY_COLORS['Alto'] },
    { name: 'Médio', value: tickets.filter(t => t.priority === 'medium').length, color: PRIORITY_COLORS['Médio'] },
    { name: 'Baixo', value: tickets.filter(t => t.priority === 'low').length, color: PRIORITY_COLORS['Baixo'] },
  ];
  const allRecent = [...tickets].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 4);

  // ── Chart data computed from real tickets ───────────────────
  const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const WEEKLY_DATA = (() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      return {
        day: DAYS_PT[d.getDay()],
        abertos:   tickets.filter(t => t.createdAt >= dayStart && t.createdAt < dayEnd).length,
        resolvidos: tickets.filter(t => t.status === 'resolved' && t.updatedAt >= dayStart && t.updatedAt < dayEnd).length,
      };
    });
  })();

  const TREND_DATA = WEEKLY_DATA.map(d => ({ day: d.day, total: d.abertos + d.resolvidos }));

  const weekTotal = TREND_DATA.reduce((s, d) => s + d.total, 0);
  const prevWeekTotal = (() => {
    const today = new Date();
    let count = 0;
    for (let i = 7; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      count += tickets.filter(t => t.createdAt >= dayStart && t.createdAt < dayEnd).length;
    }
    return count;
  })();
  const weekTrend = prevWeekTotal === 0
    ? null
    : Math.round(((weekTotal - prevWeekTotal) / prevWeekTotal) * 100);

  // ── CLIENT dashboard render ──────────────────────────
  const renderClientDashboard = () => (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Meu Painel</h1>
          <p className="dash-sub">Acompanhe seus chamados enviados à equipe de TI</p>
        </div>
        <button className="btn-primary" onClick={() => navTo('submit')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Chamado
        </button>
      </div>

      {/* My stats — 3 cards (no "total" feels redundant for a single user) */}
      <div className="stat-grid-3">
        {[
          { cls: 'open', label: 'Abertos', value: myStats.open, color: '#f59e0b', sub: 'Aguardando atendimento', iconPath: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2' },
          { cls: 'inprogress', label: 'Em Progresso', value: myStats.inProgress, color: '#3b82f6', sub: 'Sendo atendidos agora', iconPath: 'M23 6L13.5 15.5 8.5 10.5 1 18M17 6h6v6' },
          { cls: 'resolved', label: 'Resolvidos', value: myStats.resolved, color: '#10b981', sub: 'Concluídos com sucesso', iconPath: 'M20 6L9 17l-5-5' },
        ].map(s => (
          <div key={s.cls} className={`stat-card ${s.cls}`}>
            <div className="stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.iconPath}/></svg>
            </div>
            <p className="stat-label">{s.label}</p>
            <p className="stat-value">{s.value}</p>
            <p className="stat-trend" style={{ color: '#9ca3af' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* My tickets list or empty state */}
      {myTickets.length === 0 ? (
        <div className="user-empty">
          <div className="user-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <p className="user-empty-title">Nenhum chamado enviado ainda</p>
          <p className="user-empty-sub">Abra seu primeiro chamado e nossa equipe entrará em contato.</p>
          <button className="btn-primary" onClick={() => navTo('submit')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Abrir primeiro chamado
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
          {/* My recent tickets */}
          <div className="d-card">
            <div className="d-card-hdr">
              <div className="d-card-title">Meus chamados recentes</div>
              <button onClick={() => navTo('tickets')} style={{ fontSize: 11.5, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>Ver todos →</button>
            </div>
            <div className="d-card-body" style={{ padding: '10px 18px' }}>
              <div className="recent-list">
                {myRecent.map(t => (
                  <div key={t.id} className="recent-item" onClick={() => handleTicketSelect(t)}>
                    <div className="recent-icon" style={{ background: statusIconBg[t.status] }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusIconColor[t.status]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div className="recent-body">
                      <p className="recent-title">{t.title}</p>
                      <p className="recent-meta">{fmtDate(t.createdAt)}</p>
                    </div>
                    <span className={`badge ${statusBadgeClass(t.status)}`}>
                      <span className="bdot" />{statusLabel(t.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity timeline - chamados with recent updates */}
          <div className="d-card">
            <div className="d-card-hdr">
              <div className="d-card-title">Atividade recente</div>
            </div>
            <div className="d-card-body">
              {myActivity.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>Nenhuma atualização ainda.</p>
              ) : (
                <div className="timeline">
                  {myActivity.map(t => (
                    <div key={t.id} className="tl-entry" onClick={() => handleTicketSelect(t)} style={{ cursor: 'pointer' }}>
                      <div className="tl-dot" style={{ background: statusIconBg[t.status] }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={statusIconColor[t.status]} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                      </div>
                      <div className="tl-body">
                        <p className="tl-title">{t.title}</p>
                        <p className="tl-time">{statusLabel(t.status)} · atualizado {timeAgo(t.updatedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── TECH dashboard render ────────────────────────────
  const renderTechDashboard = () => {
    // Build category data for PDF
    const catMap: Record<string, number> = {};
    tickets.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + 1; });
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const dashboardPDFStats = {
      total: allStats.total,
      open: allStats.open,
      inProgress: allStats.inProgress,
      resolved: allStats.resolved,
      closed: tickets.filter(t => t.status === 'closed').length,
      assets: {
        total: assets.length,
        ativo: assets.filter(a => a.status === 'ativo').length,
        manutencao: assets.filter(a => a.status === 'manutencao').length,
        desativado: assets.filter(a => a.status === 'desativado').length,
      },
      weekData: WEEKLY_DATA,
      topCategories,
      generatedBy: userName || userEmail,
    };

    return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">Visão geral do sistema — todos os chamados</p>
        </div>
        <button
          onClick={() => exportDashboardPDF(dashboardPDFStats)}
          style={{display:'inline-flex',alignItems:'center',gap:7,height:38,padding:'0 18px',background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 2px 8px rgba(99,102,241,0.25)',flexShrink:0}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          Exportar Relatório PDF
        </button>
      </div>

      {/* System-wide stat cards */}
      <div className="stat-grid" style={{gridTemplateColumns:'repeat(6,1fr)'}}>
        {[
          { cls: 'total', label: 'Total', value: allStats.total, color: '#6366f1', trend: '+12% este mês', trendColor: '#10b981', iconPath: 'M2 7h20v14H2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
          { cls: 'open', label: 'Abertos', value: allStats.open, color: '#f59e0b', trend: `${allStats.open} aguardando`, trendColor: '#f59e0b', iconPath: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2' },
          { cls: 'inprogress', label: 'Em Progresso', value: allStats.inProgress, color: '#3b82f6', trend: 'Em atendimento', trendColor: '#3b82f6', iconPath: 'M23 6L13.5 15.5 8.5 10.5 1 18M17 6h6v6' },
          { cls: 'resolved', label: 'Resolvidos', value: allStats.resolved, color: '#10b981', trend: '+5 esta semana', trendColor: '#10b981', iconPath: 'M20 6L9 17l-5-5' },
          { cls: 'overdue-sla', label: 'SLA Vencido', value: allStats.overdue, color: '#ef4444', trend: allStats.overdue > 0 ? 'Requer atenção' : 'Tudo no prazo', trendColor: allStats.overdue > 0 ? '#ef4444' : '#10b981', iconPath: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01' },
          { cls: 'warranty-alert', label: 'Garantias', value: warrantyAlerts, color: '#f97316', trend: warrantyAlerts > 0 ? 'Vencidas/a vencer' : 'Tudo em dia', trendColor: warrantyAlerts > 0 ? '#f97316' : '#10b981', iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
        ].map(s => (
          <div key={s.cls} className={`stat-card ${s.cls}`} style={s.cls === 'overdue-sla' ? {'--card-accent':'#ef4444'} as any : {}}>
            <div className="stat-icon" style={s.cls === 'overdue-sla' ? {background: allStats.overdue > 0 ? '#fef2f2' : '#ecfdf5'} : s.cls === 'warranty-alert' ? {background: warrantyAlerts > 0 ? '#fff7ed' : '#ecfdf5'} : {}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.iconPath}/></svg>
            </div>
            <p className="stat-label">{s.label}</p>
            <p className="stat-value" style={
              (s.cls === 'overdue-sla' && allStats.overdue > 0) ? {color:'#ef4444'} :
              (s.cls === 'warranty-alert' && warrantyAlerts > 0) ? {color:'#f97316'} : {}
            }>{s.value}</p>
            <p className="stat-trend" style={{ color: s.trendColor }}>{s.trend}</p>
          </div>
        ))}
      </div>

      {/* Row 1: Bar chart + Status donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="d-card">
          <div className="d-card-hdr">
            <div>
              <div className="d-card-title">Chamados por dia</div>
              <p className="d-card-sub">Abertos vs resolvidos esta semana</p>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#6b7280', alignSelf: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#6366f1', display: 'inline-block' }}/> Abertos</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981', display: 'inline-block' }}/> Resolvidos</span>
            </div>
          </div>
          <div className="d-card-body" style={{ paddingTop: 10 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={WEEKLY_DATA} barSize={10} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f5" vertical={false}/>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={20}/>
                <Tooltip content={<CustomTooltip/>} cursor={{ fill: 'rgba(99,102,241,0.04)' }}/>
                <Bar dataKey="abertos" fill="#6366f1" radius={[4,4,0,0]} name="Abertos"/>
                <Bar dataKey="resolvidos" fill="#10b981" radius={[4,4,0,0]} name="Resolvidos"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="d-card">
          <div className="d-card-hdr">
            <div>
              <div className="d-card-title">Por status</div>
              <p className="d-card-sub">{allStats.total} chamados no total</p>
            </div>
          </div>
          <div className="d-card-body">
            <div className="donut-wrap">
              <PieChart width={100} height={100}>
                <Pie data={statusData} cx={45} cy={45} innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                  {statusData.map((_, i) => <Cell key={i} fill={statusData[i].color}/>)}
                </Pie>
              </PieChart>
              <div className="donut-legend">
                {statusData.map(d => (
                  <div key={d.name} className="legend-row">
                    <div className="legend-left"><div className="legend-dot" style={{ background: d.color }}/><span className="legend-label">{d.name}</span></div>
                    <span className="legend-val">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Trend + Priority + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 18 }}>
        <div className="d-card">
          <div className="d-card-hdr">
            <div>
              <div className="d-card-title">Tendência semanal</div>
              <p className="d-card-sub">Total de chamados por dia</p>
            </div>
          </div>
          <div className="d-card-body" style={{ paddingTop: 8 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: '#0f1117', letterSpacing: '-0.5px' }}>{weekTotal}</span>
              {weekTrend !== null && (
                <span style={{ fontSize: 12, color: weekTrend >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, marginLeft: 8 }}>
                  {weekTrend >= 0 ? '↑' : '↓'} {Math.abs(weekTrend)}% vs semana passada
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={TREND_DATA}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>} cursor={false}/>
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Total"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="d-card">
          <div className="d-card-hdr">
            <div>
              <div className="d-card-title">Por prioridade</div>
              <p className="d-card-sub">Distribuição atual</p>
            </div>
          </div>
          <div className="d-card-body">
            <div className="donut-wrap">
              <PieChart width={100} height={100}>
                <Pie data={priorityData} cx={45} cy={45} innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                  {priorityData.map((_, i) => <Cell key={i} fill={priorityData[i].color}/>)}
                </Pie>
              </PieChart>
              <div className="donut-legend">
                {priorityData.map(d => (
                  <div key={d.name} className="legend-row">
                    <div className="legend-left"><div className="legend-dot" style={{ background: d.color }}/><span className="legend-label">{d.name}</span></div>
                    <span className="legend-val">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="d-card">
          <div className="d-card-hdr">
            <div className="d-card-title">Chamados recentes</div>
            <button onClick={() => navTo('tickets')} style={{ fontSize: 11.5, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>Ver todos →</button>
          </div>
          <div className="d-card-body" style={{ padding: '10px 18px' }}>
            <div className="recent-list">
              {allRecent.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>Nenhum chamado ainda.</p>
              ) : allRecent.map(t => (
                <div key={t.id} className="recent-item" onClick={() => handleTicketSelect(t)}>
                  <div className="recent-icon" style={{ background: statusIconBg[t.status] }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusIconColor[t.status]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="recent-body">
                    <p className="recent-title">{t.title}</p>
                    <p className="recent-meta">{t.submittedBy.split('@')[0]} · {timeAgo(t.updatedAt)}</p>
                  </div>
                  <span className={`badge ${priorityBadgeClass(t.priority)}`}>{priorityLabel(t.priority)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <>
      <style>{appStyles}</style>
      <div>
        <header className="app-header">
          <div className="app-header-inner">
            <div className="header-left">
              <div className="logo">
                <div className="logo-icon">
                  <img src={iconImg} alt="Suporte TI" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                </div>
                <span className="logo-text">Suporte TI</span>
              </div>
              <nav className="app-nav">
                <button className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => navTo('dashboard')}>Dashboard</button>
                <button className={`nav-btn ${activeView === 'tickets' || activeView === 'detail' ? 'active' : ''}`} onClick={() => navTo('tickets')}>
                  {userRole === 'client' ? 'Meus Chamados' : 'Todos os Chamados'}
                </button>
                {userRole === 'client' && (
                  <button className={`nav-btn ${activeView === 'submit' ? 'active' : ''}`} onClick={() => navTo('submit')}>Enviar Chamado</button>
                )}
                {userRole === 'it-executive' && (
                  <>
                    <button className={`nav-btn ${activeView === 'assets' || activeView === 'asset-form' || activeView === 'asset-detail' ? 'active' : ''}`} onClick={() => navTo('assets')}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:5,verticalAlign:'middle'}}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      Ativos
                    </button>
                    <button className={`nav-btn ${activeView === 'users' ? 'active' : ''}`} onClick={() => navTo('users')}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:5,verticalAlign:'middle'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Usuários
                    </button>
                  </>
                )}
              </nav>
            </div>
            <div className="header-right">
              {/* Bell icon */}
              <div style={{position:'relative'}}>
                <button
                  onClick={() => setShowNotifs(v => !v)}
                  style={{position:'relative',background:'none',border:'1.5px solid #e5e7eb',borderRadius:9,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#6b7280',transition:'all 0.18s'}}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {notificacoes.length > 0 && (
                    <span style={{position:'absolute',top:-4,right:-4,background:'#ef4444',color:'#fff',borderRadius:20,fontSize:9,fontWeight:700,minWidth:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px'}}>
                      {notificacoes.length > 9 ? '9+' : notificacoes.length}
                    </span>
                  )}
                </button>
                {showNotifs && (
                  <div style={{position:'absolute',right:0,top:44,width:320,background:'#fff',border:'1px solid #f0f1f5',borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,0.12)',zIndex:200,overflow:'hidden'}}>
                    <div style={{padding:'12px 16px',borderBottom:'1px solid #f7f8fc',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontFamily:'Sora,sans-serif',fontSize:13,fontWeight:600,color:'#111827'}}>Notificações</span>
                      {notificacoes.length > 0 && (
                        <button onClick={async () => { await notificacoesApi.dismissAll(); setNotificacoes([]); setShowNotifs(false); }} style={{fontSize:11.5,color:'#6366f1',background:'none',border:'none',cursor:'pointer',fontWeight:600,fontFamily:'DM Sans,sans-serif'}}>
                          Dispensar todas
                        </button>
                      )}
                    </div>
                    <div style={{maxHeight:320,overflowY:'auto'}}>
                      {notificacoes.length === 0 ? (
                        <p style={{textAlign:'center',padding:'24px 16px',fontSize:13,color:'#9ca3af'}}>Nenhuma notificação</p>
                      ) : notificacoes.map(n => (
                        <div key={n.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 16px',borderBottom:'1px solid #f7f8fc',cursor:'pointer'}}
                          onClick={async () => {
                            const t = tickets.find(t => String(t.id) === String(n.chamado_id));
                            if (t) {
                              handleTicketSelect(t);
                            } else {
                              // Ticket not in current list — reload data then navigate
                              await loadData();
                              navTo('tickets');
                            }
                            setShowNotifs(false);
                          }}>
                          <div style={{width:28,height:28,borderRadius:8,background: n.tipo==='ticket_created'?'#eef2ff':n.tipo==='status_change'?'#ecfdf5':'#fffbeb',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={n.tipo==='ticket_created'?'#6366f1':n.tipo==='status_change'?'#10b981':'#f59e0b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              {n.tipo==='status_change' ? <path d="M20 6L9 17l-5-5"/> : n.tipo==='ticket_created' ? <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> : <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}
                            </svg>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:12.5,fontWeight:500,color:'#111827',marginBottom:2,lineHeight:1.4}}>{n.mensagem}</p>
                            <p style={{fontSize:11,color:'#9ca3af'}}>{new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(n.created_at))}</p>
                          </div>
                          <button onClick={async e => { e.stopPropagation(); await notificacoesApi.dismiss(n.id); setNotificacoes(prev => prev.filter(x => x.id !== n.id)); }} style={{background:'none',border:'none',cursor:'pointer',color:'#d1d5db',fontSize:14,padding:0,flexShrink:0,lineHeight:1}}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className={`role-pill ${userRole === 'client' ? 'client' : 'tech'}`}>
                {userRole === 'client' ? 'Usuário' : 'Analista TI'}
              </span>
              <span className="welcome-badge" onClick={() => navTo('profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} title="Ver perfil">
                <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: userAvatar ? 'none' : 'linear-gradient(135deg, #4f46e5, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #e5e7eb' }}>
                  {userAvatar
                    ? <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'Sora, sans-serif' }}>{userName.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <strong>{userName}</strong>
              </span>
              <button onClick={() => setShowUserSearch(true)} className="btn-ghost" style={{ fontSize: 13, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }} title="Buscar usuários">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
              <button className="btn-ghost" onClick={() => { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_role'); localStorage.removeItem('auth_email'); localStorage.removeItem('auth_name'); sessionStorage.removeItem('nav_view'); sessionStorage.removeItem('nav_ticket_id'); sessionStorage.removeItem('nav_asset_id'); setIsAuthenticated(false); setAuthToken(null); setToken(null); setTickets([]); setAssets([]); setNotificacoes([]); setShowNotifs(false); navTo('dashboard'); }}>Sair</button>
            </div>
          </div>
        </header>

        <main className="app-main">
          {activeView === 'dashboard' && (userRole === 'client' ? renderClientDashboard() : renderTechDashboard())}
          {activeView === 'tickets' && (
            <TicketList tickets={tickets} userRole={userRole} userEmail={userEmail} isLoading={isLoadingTickets} technicians={technicians} onTicketSelect={handleTicketSelect} onStatusUpdate={handleStatusUpdate} onAddTecnico={handleAddTecnico} onRemoveTecnico={handleRemoveTecnico} />
          )}
          {activeView === 'submit' && userRole === 'client' && (
            <TicketForm onSubmit={handleSubmitTicket} userEmail={userEmail} assets={assets.map(a => ({ id: a.id, nome: a.nome, tipo: a.tipo, localizacao: a.localizacao }))} />
          )}
          {activeView === 'detail' && selectedTicket && (
            <TicketDetail
              ticket={selectedTicket}
              userRole={userRole}
              userEmail={userEmail}
              userAvatar={userAvatar}
              technicians={technicians}
              assets={assets}
              onBack={() => navTo('tickets')}
              onAddComment={handleAddComment}
              onRefreshComments={handleRefreshComments}
              onStatusUpdate={handleStatusUpdate}
              onAddTecnico={handleAddTecnico}
              onRemoveTecnico={handleRemoveTecnico}
              onAssetLinked={async (assetId) => {
                try {
                  const updated = await ativosApi.get(assetId);
                  setAssets(prev => prev.map(a => a.id === assetId ? { ...a, chamados: (updated as any).chamados } : a));
                } catch {}
              }}
              onAssetUnlinked={(assetId) => {
                setAssets(prev => prev.map(a => a.id === assetId
                  ? { ...a, chamados: (a.chamados || []).filter((c: any) => String(c.id) !== String(selectedTicket?.id)) }
                  : a));
              }}
              onShowHistory={() => navTo('audit-chamado')}
            />
          )}
          {activeView === 'assets' && userRole === 'it-executive' && (
            <AssetList
              assets={assets}
              isLoading={isLoadingAssets}
              onSelectAsset={(asset) => { setSelectedAsset(asset); sessionStorage.setItem('nav_asset_id', String(asset.id)); navTo('asset-detail'); }}
              onNewAsset={() => navTo('asset-form')}
            />
          )}
          {activeView === 'asset-form' && userRole === 'it-executive' && (
            <AssetForm
              onSubmit={async (data, files) => {
                try {
                  const result = await ativosApi.create(data as any);
                  if (files.length > 0 && result.id) {
                    try { await ativosApi.uploadFiles(result.id, files); } catch {}
                  }
                  const refreshed = await ativosApi.list();
                  setAssets(refreshed as any);
                  navTo('assets');
                  toast.success('Ativo cadastrado com sucesso!');
                } catch (err: any) {
                  toast.error(err.message || 'Erro ao cadastrar ativo.');
                }
              }}
              onCancel={() => navTo('assets')}
            />
          )}
          {activeView === 'asset-detail' && selectedAsset && userRole === 'it-executive' && (
            <AssetDetail
              asset={selectedAsset}
              technicians={technicians}
              onBack={() => navTo('assets')}
              onUpdated={(updated) => {
                setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
                setSelectedAsset(updated);
              }}
              onDeactivated={() => {
                setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, status: 'desativado' } : a));
                navTo('assets');
                toast.success('Ativo desativado.');
              }}
              onTicketSelect={(chamadoId) => {
                const t = tickets.find(t => Number(t.id) === chamadoId);
                if (t) { handleTicketSelect(t); }
              }}
              onShowHistory={() => navTo('audit-ativo')}
            />
          )}
          {activeView === 'users' && userRole === 'it-executive' && (
            <UserManagement onBack={() => navTo('dashboard')} />
          )}
          {activeView === 'audit-chamado' && selectedTicket && (
            <AuditLog
              type="chamado"
              id={Number(selectedTicket.id)}
              titulo={selectedTicket.title}
              onBack={() => navTo('detail')}
            />
          )}
          {activeView === 'audit-ativo' && selectedAsset && (
            <AuditLog
              type="ativo"
              id={selectedAsset.id}
              titulo={selectedAsset.nome}
              onBack={() => navTo('asset-detail')}
            />
          )}
          {activeView === 'profile' && (
            <UserProfile
              onBack={() => { setProfileUserId(undefined); navTo('dashboard'); }}
              readOnly={profileUserId !== undefined}
              profileUserId={profileUserId}
              onTicketSelect={(id) => {
                const ticket = tickets.find(t => String(t.id) === id);
                if (ticket) handleTicketSelect(ticket);
                else navTo('tickets');
              }}
              onNameChange={(name) => {
                setUserName(name);
                localStorage.setItem('auth_name', name);
              }}
              onAvatarChange={(url) => {
                setUserAvatar(url);
                localStorage.setItem('auth_avatar', url);
              }}
            />
          )}
          {showUserSearch && (
            <UserSearch
              onClose={() => setShowUserSearch(false)}
              onUserSelect={(userId) => {
                setShowUserSearch(false);
                setProfileUserId(userId);
                navTo('profile');
              }}
            />
          )}
        </main>
      </div>
    </>
  );
}