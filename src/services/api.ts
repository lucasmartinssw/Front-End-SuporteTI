const API_URL = "http://127.0.0.1:8000";

export interface CreateChamadoPayload {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  files?: FileList;
}

export interface ChamadoResponse {
  message: string;
  id: string;
}

export interface Mensagem {
  id: string;
  chamado_id: string;
  user_id?: string;
  author_email?: string;
  mensagem: string;
  enviado_em: string;
  is_internal?: boolean;
  attachments?: Array<{
    id: string;
    url: string;
    name: string;
    type: string;
  }>;
}

export interface PostMensagemResponse {
  message: string;
  mensagem_id: string;
  files_uploaded: number;
}

/**
 * Create chamado via API with optional file attachments
 */
export async function createChamado(payload: CreateChamadoPayload): Promise<ChamadoResponse> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Token de autenticação não encontrado");
  }

  // Temporário: Se for token mock (desenvolvimento), retornar resposta simulada
  if (token === "mock-token-dev") {
    console.log("Modo desenvolvimento: Simulando criação de chamado");
    return { message: "Chamado criado com sucesso (simulado)", id: Date.now().toString() };
  }

  // Use FormData for multipart upload (supports files)
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('priority', payload.priority);
  formData.append('category', payload.category);

  // Add files if provided
  if (payload.files && payload.files.length > 0) {
    Array.from(payload.files).forEach((file, index) => {
      formData.append('files', file);
    });
  }

  const response = await fetch(`${API_URL}/chamados`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      // Don't set Content-Type for FormData - browser sets it automatically with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
      `Erro ao criar chamado: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * List all chamados
 */
export async function listChamados() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Token de autenticação não encontrado");
  }

  // Temporário: Se for token mock (desenvolvimento), retornar dados simulados
  if (token === "mock-token-dev") {
    console.log("Modo desenvolvimento: Retornando chamados simulados");
    return [
      {
        id: 1,
        titulo: "Chamado simulado 1",
        descricao: "Descrição simulada",
        prioridade_id: 2,
        status_id: 1,
        categoria: "Hardware",
        user_email: "user@company.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: []
      },
      {
        id: 2,
        titulo: "Chamado simulado 2",
        descricao: "Outra descrição simulada",
        prioridade_id: 3,
        status_id: 2,
        categoria: "Software",
        user_email: "user2@company.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: []
      }
    ];
  }

  const response = await fetch(`${API_URL}/chamados`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
      `Erro ao listar chamados: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get single chamado by ID
 */
export async function getChamado(id: string) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Token de autenticação não encontrado");
  }

  // Temporário: Se for token mock (desenvolvimento), retornar dado simulado
  if (token === "mock-token-dev") {
    console.log("Modo desenvolvimento: Retornando chamado simulado");
    return {
      id: parseInt(id),
      titulo: "Chamado simulado",
      descricao: "Descrição detalhada do chamado simulado",
      prioridade_id: 2,
      status_id: 1,
      categoria: "Hardware",
      user_email: "user@company.com",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: []
    };
  }

  const response = await fetch(`${API_URL}/chamados/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
      `Erro ao obter chamado: ${response.statusText}`
    );
  }

  return response.json();
}

/**************************************************
 * List mensagens for a chamado
 **************************************************/
export async function listMensagens(chamadoId: string): Promise<Mensagem[]> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token de autenticação não encontrado");

  // Temporário: Se for token mock (desenvolvimento), retornar mensagens simuladas
  if (token === "mock-token-dev") {
    console.log("Modo desenvolvimento: Retornando mensagens simuladas");
    return [
      {
        id: "1",
        chamado_id: chamadoId,
        author_email: "user@company.com",
        mensagem: "Mensagem de exemplo",
        enviado_em: new Date().toISOString(),
        is_internal: false,
        attachments: []
      }
    ];
  }

  const response = await fetch(`${API_URL}/chamados/${chamadoId}/mensagens`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ao listar mensagens: ${response.statusText}`);
  }

  return response.json();
}

/**************************************************
 * Post mensagem with optional attachments
 **************************************************/
export async function postMensagem(
  chamadoId: string,
  mensagem: string,
  isInternal: boolean,
  files?: File[]
): Promise<PostMensagemResponse> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token de autenticação não encontrado");

  // Temporário: Se for token mock (desenvolvimento), simular post
  if (token === "mock-token-dev") {
    console.log("Modo desenvolvimento: Simulando post de mensagem");
    return { message: "Mensagem enviada com sucesso (simulado)", mensagem_id: Date.now().toString(), files_uploaded: files ? files.length : 0 };
  }

  const formData = new FormData();
  formData.append('mensagem', mensagem);
  formData.append('is_internal', isInternal ? 'true' : 'false');
  if (files && files.length > 0) {
    files.forEach(file => formData.append('files', file));
  }

  const response = await fetch(`${API_URL}/chamados/${chamadoId}/mensagens`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ao enviar mensagem: ${response.statusText}`);
  }

  return response.json();
}
