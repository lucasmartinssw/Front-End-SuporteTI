import { useState, useEffect } from 'react';
import { chamados as chamadosApi, ativos as ativosApi, setToken, STATUS_MAP, PRIORITY_MAP, STATUS_ID_MAP, PRIORITY_ID_MAP } from './api';
import { AssetList, Asset } from './components/AssetList';
import { AssetForm } from './components/AssetForm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { TicketForm, Ticket } from './components/TicketForm';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { toast } from 'sonner';
import { Login } from './components/Login';

// ── Static weekly chart data (replace with real API data as needed) ──
const WEEKLY_DATA = [
  { day: 'Seg', abertos: 3, resolvidos: 2 },
  { day: 'Ter', abertos: 5, resolvidos: 4 },
  { day: 'Qua', abertos: 2, resolvidos: 5 },
  { day: 'Qui', abertos: 7, resolvidos: 3 },
  { day: 'Sex', abertos: 4, resolvidos: 6 },
  { day: 'Sáb', abertos: 1, resolvidos: 2 },
  { day: 'Dom', abertos: 2, resolvidos: 1 },
];

const TREND_DATA = [
  { day: 'Seg', total: 5 }, { day: 'Ter', total: 9 }, { day: 'Qua', total: 7 },
  { day: 'Qui', total: 10 }, { day: 'Sex', total: 8 }, { day: 'Sáb', total: 3 }, { day: 'Dom', total: 4 },
];

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
  .logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #3b82f6); border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .logo-text { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 600; color: #0f1117; letter-spacing: -0.3px; }
  .app-nav { display: flex; align-items: center; gap: 2px; }
  .nav-btn { font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500; color: #6b7280; background: none; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: all 0.18s; }
  .nav-btn:hover { color: #111827; background: #f3f4f6; }
  .nav-btn.active { color: #4f46e5; background: #eef2ff; font-weight: 600; }
  .header-right { display: flex; align-items: center; gap: 12px; }
  .welcome-badge { font-size: 13px; color: #9ca3af; }
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
`;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [userRole, setUserRole] = useState<'client' | 'it-executive'>('client');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'tickets' | 'submit' | 'detail' | 'assets' | 'asset-form' | 'asset-detail'>('dashboard');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Load tickets and assets from API when authenticated
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;
    loadData();
  }, [isAuthenticated, authToken]);

  const loadData = async () => {
    setIsLoadingData(true);
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
        assignedTo: t.assignedTo,
        assetId: t.ativo_id,
        assetNome: t.ativo_nome,
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at),
        comments: [],
      }));
      setTickets(mapped);

      // Load assets for all users (needed for ticket form dropdown)
      try {
        const rawAtivos = await ativosApi.list();
        setAssets(rawAtivos as any);
      } catch {
        // Non-critical — just leave assets empty if it fails
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={(email, role, name, token) => {
      setUserEmail(email);
      setUserRole(role as any);
      setUserName(name);
      setAuthToken(token);
      setToken(token);
      setIsAuthenticated(true);
    }} />;
  }

  const handleSubmitTicket = async (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    try {
      await chamadosApi.create({
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        category: ticketData.category,
      });
      await loadData();
      setActiveView('tickets');
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

  const handleAssignTicket = (ticketId: string, assignee: string) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, assignedTo: assignee, updatedAt: new Date() } : t);
    setTickets(updated);
    if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, assignedTo: assignee, updatedAt: new Date() } : null);
    toast.success('Chamado designado');
  };

  const handleAddComment = async (ticketId: string, comment: string, isInternal: boolean) => {
    try {
      await chamadosApi.postMensagem(Number(ticketId), comment, isInternal);
      // Reload messages for the selected ticket
      const msgs = await chamadosApi.listMensagens(Number(ticketId));
      const mapped = msgs.map((m: any) => ({
        id: String(m.id),
        author: m.author_email || m.author_name,
        content: m.mensagem,
        timestamp: new Date(m.enviado_em),
        isInternal: m.is_internal,
      }));
      const updated = tickets.map(t => t.id === ticketId ? { ...t, comments: mapped, updatedAt: new Date() } : t);
      setTickets(updated);
      if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, comments: mapped, updatedAt: new Date() } : null);
      toast.success('Comentário adicionado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar comentário.');
    }
  };

  const handleTicketSelect = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setActiveView('detail');
    // Load messages from API
    try {
      const msgs = await chamadosApi.listMensagens(Number(ticket.id));
      const mapped = msgs.map((m: any) => ({
        id: String(m.id),
        author: m.author_email || m.author_name,
        content: m.mensagem,
        timestamp: new Date(m.enviado_em),
        isInternal: m.is_internal,
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
  const myRecent = [...myTickets].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5);

  // ── TECH dashboard — system-wide ────────────────────
  const allStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };
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

  // ── CLIENT dashboard render ──────────────────────────
  const renderClientDashboard = () => (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Meu Painel</h1>
          <p className="dash-sub">Acompanhe seus chamados enviados à equipe de TI</p>
        </div>
        <button className="btn-primary" onClick={() => setActiveView('submit')}>
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
          <button className="btn-primary" onClick={() => setActiveView('submit')}>
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
              <button onClick={() => setActiveView('tickets')} style={{ fontSize: 11.5, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>Ver todos →</button>
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

          {/* Activity timeline */}
          <div className="d-card">
            <div className="d-card-hdr">
              <div className="d-card-title">Atividade recente</div>
            </div>
            <div className="d-card-body">
              {myRecent.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>Sem atividade ainda.</p>
              ) : (
                <div className="timeline">
                  {myRecent.map(t => (
                    <div key={t.id} className="tl-entry" onClick={() => handleTicketSelect(t)} style={{ cursor: 'pointer' }}>
                      <div className="tl-dot" style={{ background: statusIconBg[t.status] }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={statusIconColor[t.status]} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                      </div>
                      <div className="tl-body">
                        <p className="tl-title">{t.title}</p>
                        <p className="tl-time">{statusLabel(t.status)} · {timeAgo(t.updatedAt)}</p>
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
  const renderTechDashboard = () => (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">Visão geral do sistema — todos os chamados</p>
        </div>
      </div>

      {/* System-wide stat cards */}
      <div className="stat-grid">
        {[
          { cls: 'total', label: 'Total', value: allStats.total, color: '#6366f1', trend: '+12% este mês', trendColor: '#10b981', iconPath: 'M2 7h20v14H2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
          { cls: 'open', label: 'Abertos', value: allStats.open, color: '#f59e0b', trend: `${allStats.open} aguardando`, trendColor: '#f59e0b', iconPath: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2' },
          { cls: 'inprogress', label: 'Em Progresso', value: allStats.inProgress, color: '#3b82f6', trend: 'Em atendimento', trendColor: '#3b82f6', iconPath: 'M23 6L13.5 15.5 8.5 10.5 1 18M17 6h6v6' },
          { cls: 'resolved', label: 'Resolvidos', value: allStats.resolved, color: '#10b981', trend: '+5 esta semana', trendColor: '#10b981', iconPath: 'M20 6L9 17l-5-5' },
        ].map(s => (
          <div key={s.cls} className={`stat-card ${s.cls}`}>
            <div className="stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.iconPath}/></svg>
            </div>
            <p className="stat-label">{s.label}</p>
            <p className="stat-value">{s.value}</p>
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
              <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: '#0f1117', letterSpacing: '-0.5px' }}>46</span>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginLeft: 8 }}>↑ 18% vs semana passada</span>
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
            <button onClick={() => setActiveView('tickets')} style={{ fontSize: 11.5, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>Ver todos →</button>
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

  return (
    <>
      <style>{appStyles}</style>
      <div>
        <header className="app-header">
          <div className="app-header-inner">
            <div className="header-left">
              <div className="logo">
                <div className="logo-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                </div>
                <span className="logo-text">Suporte TI</span>
              </div>
              <nav className="app-nav">
                <button className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>Dashboard</button>
                <button className={`nav-btn ${activeView === 'tickets' || activeView === 'detail' ? 'active' : ''}`} onClick={() => setActiveView('tickets')}>
                  {userRole === 'client' ? 'Meus Chamados' : 'Todos os Chamados'}
                </button>
                {userRole === 'client' && (
                  <button className={`nav-btn ${activeView === 'submit' ? 'active' : ''}`} onClick={() => setActiveView('submit')}>Enviar Chamado</button>
                )}
                {userRole === 'it-executive' && (
                  <button className={`nav-btn ${activeView === 'assets' || activeView === 'asset-form' || activeView === 'asset-detail' ? 'active' : ''}`} onClick={() => setActiveView('assets')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',marginRight:5,verticalAlign:'middle'}}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    Ativos
                  </button>
                )}
              </nav>
            </div>
            <div className="header-right">
              <span className={`role-pill ${userRole === 'client' ? 'client' : 'tech'}`}>
                {userRole === 'client' ? 'Usuário' : 'Analista TI'}
              </span>
              <span className="welcome-badge">Bem-vindo, <strong>{userName}</strong></span>
              <button className="btn-ghost" onClick={() => { setIsAuthenticated(false); setAuthToken(null); setToken(null); setTickets([]); setAssets([]); }}>Sair</button>
            </div>
          </div>
        </header>

        <main className="app-main">
          {activeView === 'dashboard' && (userRole === 'client' ? renderClientDashboard() : renderTechDashboard())}
          {activeView === 'tickets' && (
            <TicketList tickets={tickets} userRole={userRole} userEmail={userEmail} onTicketSelect={handleTicketSelect} onStatusUpdate={handleStatusUpdate} onAssignTicket={handleAssignTicket} />
          )}
          {activeView === 'submit' && userRole === 'client' && (
            <TicketForm onSubmit={handleSubmitTicket} userEmail={userEmail} assets={assets.map(a => ({ id: a.id, nome: a.nome, tipo: a.tipo, localizacao: a.localizacao }))} />
          )}
          {activeView === 'detail' && selectedTicket && (
            <TicketDetail ticket={selectedTicket} userRole={userRole} userEmail={userEmail} onBack={() => setActiveView('tickets')} onAddComment={handleAddComment} onStatusUpdate={handleStatusUpdate} onAssignTicket={handleAssignTicket} />
          )}
          {activeView === 'assets' && userRole === 'it-executive' && (
            <AssetList
              assets={assets}
              onSelectAsset={(asset) => { setSelectedAsset(asset); setActiveView('asset-detail'); }}
              onNewAsset={() => setActiveView('asset-form')}
            />
          )}
          {activeView === 'asset-form' && userRole === 'it-executive' && (
            <AssetForm
              onSubmit={async (data) => {
                try {
                  await ativosApi.create(data as any);
                  const refreshed = await ativosApi.list();
                  setAssets(refreshed as any);
                  setActiveView('assets');
                  toast.success('Ativo cadastrado com sucesso!');
                } catch (err: any) {
                  toast.error(err.message || 'Erro ao cadastrar ativo.');
                }
              }}
              onCancel={() => setActiveView('assets')}
            />
          )}
          {activeView === 'asset-detail' && selectedAsset && userRole === 'it-executive' && (
            <AssetList
              assets={assets}
              onSelectAsset={(asset) => { setSelectedAsset(asset); }}
              onNewAsset={() => setActiveView('asset-form')}
            />
          )}
        </main>
      </div>
    </>
  );
}