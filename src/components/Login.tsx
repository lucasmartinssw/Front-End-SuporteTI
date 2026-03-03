import { useState } from "react";
import { Ticket as TicketIcon } from "lucide-react";

//  URL base do seu back-end
const API_URL = "http://127.0.0.1:8000";

interface LoginProps {
  onLogin: (email: string, role: string, name: string) => void;
}

type UserRole = "usuario" | "tecnico";

export function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Apenas para registro
  const [role, setRole] = useState<UserRole>("usuario");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegistering) {
        // --- LÓGICA DE REGISTRO ---
        const response = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            user_type: role // Mapeando para o campo 'cargo' do back
          }),
        });

        if (!response.ok) throw new Error("Erro ao cadastrar usuário");
        
        // Realiza login automático após registro bem-sucedido
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginResponse.json();
        if (!loginResponse.ok) throw new Error(loginData.detail || "Erro ao fazer login");

        localStorage.setItem("token", loginData.token);
        // Mapeia o tipo de usuário retornado pelo backend
        const backendRole = loginData.user_type || role;
        const mappedRole = backendRole === 'tecnico' ? 'it-executive' : 'client';
        onLogin(email, mappedRole, name);
      } else {
        // --- LÓGICA DE LOGIN ---
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.detail || "Erro no login");

        // Salva o token no localStorage para persistência
        localStorage.setItem("token", data.token);
        // Mapeia o tipo de usuário retornado pelo backend
        const backendRole = data.user_type || "usuario";
        const mappedRole = backendRole === 'tecnico' ? 'it-executive' : 'client';
        // Extrai o nome da resposta ou usa o e-mail como fallback
        const userName = data.name || email.split('@')[0];
        onLogin(email, mappedRole, userName);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header igual ao App */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center gap-2">
              <TicketIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Suporte TI</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Container principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Título e descrição */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isRegistering ? "Criar Conta" : "Acesso ao Sistema"}
            </h2>
            <p className="text-gray-600 text-sm">
              {isRegistering ? "Preencha os dados abaixo para se registrar" : "Entre com suas credenciais"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Digite seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 bg-gray-50 border border-gray-200 text-gray-900 rounded-md px-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                placeholder="seu.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 bg-gray-50 border border-gray-200 text-gray-900 rounded-md px-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 bg-gray-50 border border-gray-200 text-gray-900 rounded-md px-3 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {/* Seletor de Cargo (visível apenas no registro) */}
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Usuário</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("usuario")}
                    className={`h-10 rounded-md border font-medium transition-all ${
                      role === 'usuario'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Usuário
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("tecnico")}
                    className={`h-10 rounded-md border font-medium transition-all ${
                      role === 'tecnico'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Analista TI
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? "Processando..." : isRegistering ? "Cadastrar" : "Entrar"}
            </button>
          </form>

          {/* Link para trocar entre login e registro */}
          <div className="mt-6 text-center border-t border-gray-200 pt-6">
            <p className="text-gray-600 text-sm mb-2">
              {isRegistering ? "Já tem uma conta?" : "Não tem conta?"}
            </p>
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              {isRegistering ? "Faça login aqui" : "Cadastre-se aqui"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}