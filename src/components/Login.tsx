import { useState } from "react";

//  URL base do seu back-end
const API_URL = "http://127.0.0.1:8000";

interface LoginProps {
  onLogin: (email: string, role: string, token: string) => void;
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
        
        alert("Conta criada com sucesso! Agora faça login.");
        setIsRegistering(false);
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
        // Mapeia o tipo de usuário para o formato esperado
        const mappedRole = role === 'tecnico' ? 'it-executive' : 'client';
        onLogin(email, mappedRole, data.token);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-[440px] backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-8 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isRegistering ? "Criar Conta" : "TechSupport"}
          </h1>
          <p className="text-gray-400 text-sm">
            {isRegistering ? "Preencha os dados abaixo" : "Entre no seu painel de suporte"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <input
              type="text"
              placeholder="Nome Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/20 text-white rounded-xl px-4 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          )}

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 bg-white/5 border border-white/20 text-white rounded-xl px-4 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 bg-white/5 border border-white/20 text-white rounded-xl px-4 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />

          {/* Seletor de Cargo (Apenas visível no Registro para definir o tipo) */}
          <div className="grid grid-cols-2 gap-2 py-2">
            <button
              type="button"
              onClick={() => setRole("usuario")}
              className={`p-2 rounded-lg border ${role === 'usuario' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
            >
              Usuário
            </button>
            <button
              type="button"
              onClick={() => setRole("tecnico")}
              className={`p-2 rounded-lg border ${role === 'tecnico' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}
            >
              Analista TI
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {isLoading ? "Processando..." : isRegistering ? "Cadastrar" : "Entrar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-blue-400 hover:underline"
          >
            {isRegistering ? "Já tem uma conta? Faça login" : "Não tem conta? Cadastre-se"}
          </button>
        </div>
      </div>
    </div>
  );
}