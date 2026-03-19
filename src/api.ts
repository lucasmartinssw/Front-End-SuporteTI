// ─────────────────────────────────────────────────────────────
//  api.ts  —  Central API client
//  Place in: Front-End-SuporteTI/src/api.ts
// ─────────────────────────────────────────────────────────────

const BASE_URL = 'http://127.0.0.1:8000';

// ── Token helpers ─────────────────────────────────────────────
// The token is stored in memory via the setter below.
// App.tsx calls setToken() after login and passes it down.
// We keep a module-level variable so api functions don't need
// it passed as a parameter every time.

let _token: string | null = null;

export function setToken(token: string | null) {
  _token = token;
}

export function getToken(): string | null {
  return _token;
}

// ── Base fetch wrapper ────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Attach JWT token if available — fall back to localStorage on page refresh
  const token = _token || localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type to JSON if we're not sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = `Erro ${response.status}`;
    let rawBody = '';
    try {
      rawBody = await response.text();
      const err = JSON.parse(rawBody);
      detail = err.detail || detail;
    } catch {}
    // Session expired — broadcast event so App.tsx can handle logout
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    const err = new Error(detail) as any;
    err.status = response.status;
    throw err;
  }

  // 204 No Content — return empty object
  if (response.status === 204) return {} as T;

  return response.json();
}

// ─────────────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  token_type: string;
  name: string;
  user_type: 'admin' | 'tecnico' | 'usuario';
  email: string;
  message: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  user_type: string;
}

export const auth = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: RegisterPayload) =>
    request<{ message: string; user_id: number }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─────────────────────────────────────────────────────────────
//  CHAMADOS (Tickets)
// ─────────────────────────────────────────────────────────────

export interface ChamadoFromAPI {
  id: number;
  titulo: string;
  descricao: string;
  status_id: number;
  prioridade_id: number;
  categoria_id: number;
  categoria: string;
  user_id: number;
  user_email: string;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

export interface MensagemFromAPI {
  id: number;
  chamado_id: number;
  user_id: number;
  author_name: string;
  author_email: string;
  mensagem: string;
  enviado_em: string;
  is_internal: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
}

export interface CreateChamadoPayload {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
}

export const chamados = {
  // List all (tech sees all, user sees own)
  list: () =>
    request<ChamadoFromAPI[]>('/chamados'),

  // Get single ticket with attachments
  get: (id: number) =>
    request<ChamadoFromAPI>(`/chamados/${id}`),

  // Create ticket (JSON, no file upload)
  create: (payload: CreateChamadoPayload) =>
    request<{ message: string; id: number }>('/chamados/json', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Create ticket with optional file attachments (FormData)
  createWithFiles: (payload: CreateChamadoPayload, files?: File[]) => {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description);
    form.append('priority', payload.priority);
    form.append('category', payload.category);
    if (files?.length) {
      files.forEach(f => form.append('files', f));
    }
    return request<{ message: string; id: number }>('/chamados', {
      method: 'POST',
      body: form,
    });
  },

  // Update status or priority (tech/admin only)
  update: (id: number, data: { status_id?: number; prioridade_id?: number; assigned_to?: number | null }) =>
    request<{ message: string }>(`/chamados/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Assign / remove technicians
  deleteMensagem: (chamadoId: number, mensagemId: number) =>
    request<{ message: string }>(`/chamados/${chamadoId}/mensagens/${mensagemId}`, { method: 'DELETE' }),
  addTecnico: (chamadoId: number, userId: number) =>
    request<{ message: string }>(`/chamados/${chamadoId}/tecnicos/${userId}`, { method: 'POST' }),

  removeTecnico: (chamadoId: number, userId: number) =>
    request<{ message: string }>(`/chamados/${chamadoId}/tecnicos/${userId}`, { method: 'DELETE' }),

  // List messages for a ticket
  listMensagens: (id: number) =>
    request<MensagemFromAPI[]>(`/chamados/${id}/mensagens`),

  // Post a message (with optional files via FormData)
  postMensagem: (
    chamadoId: number,
    mensagem: string,
    isInternal: boolean,
    files?: File[]
  ) => {
    const form = new FormData();
    form.append('mensagem', mensagem || '');
    form.append('is_internal', String(isInternal));
    if (files?.length) {
      files.forEach(f => form.append('files', f));
    }
    return request<{ message: string; mensagem_id: number }>(
      `/chamados/${chamadoId}/mensagens`,
      { method: 'POST', body: form }
    );
  },
};

// ─────────────────────────────────────────────────────────────
//  ATIVOS (Assets)
// ─────────────────────────────────────────────────────────────

export interface AtivoFromAPI {
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
  chamados?: ChamadoFromAPI[];
}

export interface CreateAtivoPayload {
  nome: string;
  tipo: AtivoFromAPI['tipo'];
  numero_serie?: string;
  patrimonio?: string;
  localizacao?: string;
  status?: AtivoFromAPI['status'];
  responsavel_id?: number;
  observacoes?: string;
}

export const ativos = {
  list: (filters?: { tipo?: string; status?: string; localizacao?: string }) => {
    const params = new URLSearchParams();
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.localizacao) params.append('localizacao', filters.localizacao);
    const qs = params.toString();
    return request<AtivoFromAPI[]>(`/ativos${qs ? `?${qs}` : ''}`);
  },

  get: (id: number) =>
    request<AtivoFromAPI>(`/ativos/${id}`),

  create: (payload: CreateAtivoPayload) =>
    request<{ message: string; id: number }>('/ativos', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, data: Partial<CreateAtivoPayload>) =>
    request<{ message: string }>(`/ativos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deactivate: (id: number) =>
    request<{ message: string }>(`/ativos/${id}`, { method: 'DELETE' }),

  linkChamado: (ativoId: number, chamadoId: number) =>
    request<{ message: string }>(`/ativos/${ativoId}/chamados/${chamadoId}`, {
      method: 'POST',
    }),

  unlinkChamado: (ativoId: number, chamadoId: number) =>
    request<{ message: string }>(`/ativos/${ativoId}/chamados/${chamadoId}`, {
      method: 'DELETE',
    }),

  uploadFiles: (ativoId: number, files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return request<{ message: string; files: { id: string; url: string; type: string; name: string }[] }>(
      `/ativos/${ativoId}/files`,
      { method: 'POST', body: form }
    );
  },

  deleteFile: (ativoId: number, fileId: string) =>
    request<{ message: string }>(`/ativos/${ativoId}/files/${fileId}`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────────────────────
//  USERS
// ─────────────────────────────────────────────────────────────

export interface UserFromAPI {
  id: number;
  nome: string;
  email: string;
  cargo: 'admin' | 'tecnico' | 'usuario';
}

export interface Notificacao {
  id: number;
  user_id: number;
  tipo: 'status_change' | 'new_message' | 'ticket_created';
  chamado_id: number;
  chamado_titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export interface AuditoriaEntry {
  id: number;
  acao: string;
  detalhe: string;
  created_at: string;
  user_nome: string;
  user_email: string;
  user_cargo: string;
}

export const auditoria = {
  getChamado: (chamadoId: number) =>
    request<AuditoriaEntry[]>(`/auditoria/chamados/${chamadoId}`),
  getAtivo: (ativoId: number) =>
    request<AuditoriaEntry[]>(`/auditoria/ativos/${ativoId}`),
};

export const notificacoes = {
  list: () => request<Notificacao[]>('/notificacoes'),
  dismiss: (id: number) => request<{ message: string }>(`/notificacoes/${id}/lida`, { method: 'PATCH' }),
  dismissAll: () => request<{ message: string }>('/notificacoes/lida-todas', { method: 'PATCH' }),
};

export const users = {
  list: (cargo?: string, includeInactive?: boolean) => {
    const params = new URLSearchParams();
    if (cargo) params.append('cargo', cargo);
    if (includeInactive) params.append('include_inactive', 'true');
    const qs = params.toString();
    return request<UserFromAPI[]>(qs ? `/users?${qs}` : '/users');
  },
  getMe: () => request<any>('/users/me'),
  getUserProfile: (id: number) => request<any>(`/users/${id}/profile`),
  updateMe: (data: { nome?: string; bio?: string }) => request<{ message: string }>('/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateUser: (id: number, data: { nome?: string; cargo?: string }) =>
    request<{ message: string }>(`/users/${id}/admin`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  resetPassword: (id: number, nova_senha: string) =>
    request<{ message: string }>(`/users/${id}/reset-password`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nova_senha }) }),
  reactivateUser: (id: number) =>
    request<{ message: string }>(`/users/${id}/reactivate`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }),
  deactivateUser: (id: number) =>
    request<{ message: string }>(`/users/${id}/deactivate`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }),
  removeAvatar: () => request<{ message: string }>('/users/me/avatar', { method: 'DELETE' }),
  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    const token = localStorage.getItem('auth_token');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE_URL}/users/me/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

// ─────────────────────────────────────────────────────────────
//  STATUS / PRIORITY MAPS
//  These translate between DB integer IDs and frontend strings
// ─────────────────────────────────────────────────────────────

export const STATUS_MAP: Record<number, string> = {
  1: 'open',
  2: 'in-progress',
  3: 'resolved',
  4: 'closed',
};

export const STATUS_ID_MAP: Record<string, number> = {
  'open': 1,
  'in-progress': 2,
  'resolved': 3,
  'closed': 4,
};

export const PRIORITY_MAP: Record<number, string> = {
  1: 'low',
  2: 'medium',
  3: 'high',
  4: 'urgent',
};

export const PRIORITY_ID_MAP: Record<string, number> = {
  'low': 1,
  'medium': 2,
  'high': 3,
  'urgent': 4,
};