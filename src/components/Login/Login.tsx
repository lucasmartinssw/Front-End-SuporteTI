import { useState } from "react";
import { auth, setToken } from "../../api";
import './Login.css';

interface LoginProps {
  onLogin: (email: string, role: string, name: string, token: string) => void;
}

type UserRole = "usuario" | "tecnico";

export function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("usuario");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        await auth.register({ name, email, password, user_type: role });
        const loginData = await auth.login(email, password);
        setToken(loginData.token);
        const mappedRole =
          loginData.user_type === "tecnico" || loginData.user_type === "admin"
            ? "it-executive"
            : "client";
        onLogin(loginData.email, mappedRole, loginData.name || name, loginData.token);
      } else {
        const data = await auth.login(email, password);
        setToken(data.token);
        const mappedRole =
          data.user_type === "tecnico" || data.user_type === "admin"
            ? "it-executive"
            : "client";
        const userName = data.name || email.split("@")[0];
        onLogin(data.email, mappedRole, userName, data.token);
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="login-root">
        {/* Left decorative panel */}
        <div className="login-left">
          <div className="left-blob blob-1" />
          <div className="left-blob blob-2" />
          <div className="left-blob blob-3" />

          <div className="left-brand">
            <div className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <span className="brand-name">Suporte TI</span>
          </div>

          <div className="left-content">
            <div className="left-tagline">
              Suporte técnico<br /><span>centralizado</span><br />e rastreável.
            </div>
            <p className="left-sub">
              Gerencie chamados, ativos e indicadores de TI em um único lugar — com total visibilidade e controle.
            </p>
          </div>

          <div className="left-stats">
            <div className="stat-card">
              <div className="stat-number">98%</div>
              <div className="stat-label">Taxa de resolução</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">&lt; 2h</div>
              <div className="stat-label">Tempo médio</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">5 Pilares</div>
              <div className="stat-label">de gestão TI</div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-right">
          <div className="login-card">
            {/* Mobile brand */}
            <div className="mobile-brand">
              <div className="mobile-brand-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <span className="mobile-brand-name">Suporte TI</span>
            </div>

            <div className="card-title">
              {isRegistering ? "Criar conta" : "Bem-vindo de volta"}
            </div>
            <div className="card-subtitle">
              {isRegistering
                ? "Preencha os dados abaixo para se registrar"
                : "Entre com suas credenciais para continuar"}
            </div>

            {error && (
              <div className="error-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {isRegistering && (
                <div className="field">
                  <label>Nome Completo</label>
                  <input type="text" placeholder="Digite seu nome" value={name}
                    onChange={(e) => setName(e.target.value)} required />
                </div>
              )}

              <div className="field">
                <label>E-mail</label>
                <input type="email" placeholder="seu.email@empresa.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="field">
                <label>Senha</label>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required />
              </div>

              {isRegistering && (
                <div className="field">
                  <label>Tipo de Usuário</label>
                  <div className="role-grid">
                    <button type="button" className={`role-btn ${role === "usuario" ? "active" : ""}`}
                      onClick={() => setRole("usuario")}>
                      <div className="role-dot" />
                      Usuário
                    </button>
                    <button type="button" className={`role-btn ${role === "tecnico" ? "active" : ""}`}
                      onClick={() => setRole("tecnico")}>
                      <div className="role-dot" />
                      Analista TI
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <><div className="spinner" /> Processando...</>
                ) : isRegistering ? "Criar conta" : "Entrar"}
              </button>
            </form>

            <div className="toggle-row">
              <p>{isRegistering ? "Já tem uma conta?" : "Não tem uma conta?"}</p>
              <button className="toggle-btn"
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}>
                {isRegistering ? "Faça login aqui" : "Cadastre-se gratuitamente"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}