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
