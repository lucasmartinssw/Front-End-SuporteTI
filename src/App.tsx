import { useState, useEffect } from 'react';
import { TicketForm, Ticket } from './components/TicketForm';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { 
  Ticket as TicketIcon,
  Clock,
  CheckCircle,
  TrendingUp,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { Login } from './components/Login';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'client' | 'it-executive'>('client');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'tickets' | 'submit' | 'detail'>('dashboard');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Carregar e persistir tickets no localStorage
  useEffect(() => {
    // Tentar carregar do localStorage
    const storedTickets = localStorage.getItem('tickets');
    
    if (storedTickets) {
      try {
        const parsed = JSON.parse(storedTickets);
        // Converter strings de data de volta para Date
        const ticketsWithDates = parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          comments: t.comments.map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp)
          }))
        }));
        setTickets(ticketsWithDates);
      } catch (error) {
        console.error('Erro ao carregar tickets:', error);
        loadMockTickets();
      }
    } else {
      loadMockTickets();
    }
  }, []);

  // Função para carregar tickets mock iniciais
  const loadMockTickets = () => {
    const mockTickets: Ticket[] = [
      {
        id: '1',
        title: 'Computer won\'t start after Windows update',
        description: 'After the latest Windows update last night, my computer shows a blue screen on startup...',
        priority: 'high',
        category: 'Hardware Issues',
        status: 'open',
        submittedBy: 'user@company.com',
        assignedTo: 'john.doe@company.com',
        createdAt: new Date('2024-01-15T09:30:00'),
        updatedAt: new Date('2024-01-15T10:15:00'),
        comments: []
      },
      {
        id: '2',
        title: 'Unable to access shared network drive',
        description: 'I can\'t access the \\\\server\\shared folder...',
        priority: 'medium',
        category: 'Network Connectivity',
        status: 'in-progress',
        submittedBy: 'alice.johnson@company.com',
        assignedTo: 'jane.smith@company.com',
        createdAt: new Date('2024-01-14T14:20:00'),
        updatedAt: new Date('2024-01-15T08:45:00'),
        comments: []
      }
    ];
    setTickets(mockTickets);
    localStorage.setItem('tickets', JSON.stringify(mockTickets));
  };

  // 🚀 Se não estiver logado, mostra tela de login
  if (!isAuthenticated) {
    return (
      <Login
        onLogin={(email, role, name) => {
          setUserEmail(email);
          setUserRole(role);
          setUserName(name);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // Funções de manipulação de tickets
  const handleSubmitTicket = (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    const newTicket: Ticket = {
      ...ticketData,
      id: Date.now().toString(),
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: []
    };
    const updatedTickets = [newTicket, ...tickets];
    setTickets(updatedTickets);
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    setActiveView('tickets');
    toast.success('Chamado enviado com sucesso!');
  };

  const handleStatusUpdate = (ticketId: string, status: Ticket['status']) => {
    const updatedTickets = tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status, updatedAt: new Date() }
        : ticket
    );
    setTickets(updatedTickets);
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status, updatedAt: new Date() } : null);
    }
    toast.success(`Status do chamado atualizado para ${status.replace('-', ' ')}`);
  };

  const handleAssignTicket = (ticketId: string, assignee: string) => {
    const updatedTickets = tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, assignedTo: assignee, updatedAt: new Date() }
        : ticket
    );
    setTickets(updatedTickets);
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, assignedTo: assignee, updatedAt: new Date() } : null);
    }
    toast.success(`Chamado designado para ${assignee.split('@')[0]}`);
  };

  const handleAddComment = (ticketId: string, comment: string, isInternal: boolean) => {
    const newComment = {
      id: Date.now().toString(),
      author: userEmail,
      content: comment,
      timestamp: new Date(),
      isInternal
    };
    const updatedTickets = tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, comments: [...ticket.comments, newComment], updatedAt: new Date() }
        : ticket
    );
    setTickets(updatedTickets);
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, comments: [...prev.comments, newComment], updatedAt: new Date() } : null);
    }
    toast.success('Comentário adicionado com sucesso!');
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setActiveView('detail');
  };

  // Dashboard stats
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    myTickets: userRole === 'client' 
      ? tickets.filter(t => t.submittedBy === userEmail).length 
      : tickets.filter(t => t.assignedTo === userEmail).length
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {userRole === 'client'
              ? 'Enviado e direcionado para a equipe de TI'
              : 'Suas solicitações atribuídas e status geral'}
          </p>
        </div>
        {userRole === 'client' && (
          <button 
            onClick={() => setActiveView('submit')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            Novo Chamado
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center p-6">
            <TicketIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center p-6">
            <Clock className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Aberto</p>
              <p className="text-2xl font-semibold">{stats.open}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center p-6">
            <TrendingUp className="h-6 w-6 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Em progresso</p>
              <p className="text-2xl font-semibold">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center p-6">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Resolvido</p>
              <p className="text-2xl font-semibold">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Função para estilizar botões baseado na view ativa
  const getButtonStyle = (isActive: boolean) => 
    isActive 
      ? "bg-blue-600 text-white px-4 py-2 rounded-md font-medium"
      : "text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium transition-colors duration-200";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TicketIcon className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Suporte TI</h1>
              </div>
              <nav className="hidden md:flex items-center gap-6">
                <button 
                  className={getButtonStyle(activeView === 'dashboard')}
                  onClick={() => setActiveView('dashboard')}
                >
                  Dashboard
                </button>
                <button 
                  className={getButtonStyle(activeView === 'tickets')}
                  onClick={() => setActiveView('tickets')}
                >
                  Todos Chamados
                </button>
                {userRole === 'client' && (
                  <button 
                    className={getButtonStyle(activeView === 'submit')}
                    onClick={() => setActiveView('submit')}
                  >
                    Enviar Chamado
                  </button>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">Bem-vindo, <strong>{userName}</strong></span>
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'tickets' && (
          <TicketList
            tickets={tickets}
            userRole={userRole}
            userEmail={userEmail}
            onTicketSelect={handleTicketSelect}
            onStatusUpdate={handleStatusUpdate}
            onAssignTicket={handleAssignTicket}
          />
        )}
        {activeView === 'submit' && userRole === 'client' && (
          <TicketForm onSubmit={handleSubmitTicket} userEmail={userEmail} />
        )}
        {activeView === 'detail' && selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            userRole={userRole}
            userEmail={userEmail}
            onBack={() => setActiveView('tickets')}
            onAddComment={handleAddComment}
            onStatusUpdate={handleStatusUpdate}
            onAssignTicket={handleAssignTicket}
          />
        )}
      </main>
    </div>
  );
}