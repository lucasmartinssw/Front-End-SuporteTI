import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

interface LoginProps {
  onLogin: (email: string, role: string, name: string) => void;
}

type UserRole = "usuario" | "tecnico";

export function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("usuario");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isRegistering) {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, user_type: role }),
        });
        if (!response.ok) throw new Error("Erro ao cadastrar usuário");
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginResponse.json();
        if (!loginResponse.ok) throw new Error(loginData.detail || "Erro ao fazer login");
        localStorage.setItem("token", loginData.token);
        const mappedRole = (loginData.user_type || role) === 'tecnico' ? 'it-executive' : 'client';
        onLogin(email, mappedRole, name);
      } else {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Erro no login");
        localStorage.setItem("token", data.token);
        const mappedRole = (data.user_type || "usuario") === 'tecnico' ? 'it-executive' : 'client';
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          background: #f7f8fc;
        }

        /* Left Panel */
        .login-panel {
          width: 420px;
          min-height: 100vh;
          background: #0f1117;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }

        .login-panel::before {
          content: '';
          position: absolute;
          top: -120px;
          left: -80px;
          width: 360px;
          height: 360px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .login-panel::after {
          content: '';
          position: absolute;
          bottom: -80px;
          right: -60px;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .panel-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          z-index: 1;
        }

        .panel-logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .panel-logo-text {
          font-family: 'Sora', sans-serif;
          font-size: 17px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.3px;
        }

        .panel-content {
          position: relative;
          z-index: 1;
        }

        .panel-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #6366f1;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.2);
          padding: 4px 10px;
          border-radius: 20px;
          margin-bottom: 20px;
        }

        .panel-headline {
          font-family: 'Sora', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -0.5px;
          margin-bottom: 16px;
        }

        .panel-headline span {
          background: linear-gradient(135deg, #818cf8, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .panel-sub {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }

        .panel-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 32px;
        }

        .panel-feature {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          flex-shrink: 0;
        }

        .feature-text {
          font-size: 13px;
          color: #9ca3af;
        }

        .panel-footer {
          position: relative;
          z-index: 1;
          font-size: 12px;
          color: #374151;
        }

        /* Right Panel - Form */
        .form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .form-card {
          width: 100%;
          max-width: 420px;
          animation: fadeUp 0.4s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-title {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #0f1117;
          letter-spacing: -0.4px;
          margin-bottom: 6px;
        }

        .form-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 36px;
        }

        .field-group {
          margin-bottom: 18px;
        }

        .field-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 7px;
          letter-spacing: 0.1px;
        }

        .field-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #111827;
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          box-sizing: border-box;
        }

        .field-input::placeholder {
          color: #c4c9d4;
        }

        .field-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .role-btn {
          height: 42px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .role-btn:hover {
          border-color: #c7d2fe;
          color: #6366f1;
        }

        .role-btn.active {
          background: linear-gradient(135deg, #6366f1, #818cf8);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 2px 8px rgba(99,102,241,0.3);
        }

        .submit-btn {
          width: 100%;
          height: 46px;
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.2s;
          letter-spacing: 0.2px;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.45);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0 20px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #f3f4f6;
        }

        .divider-text {
          font-size: 12px;
          color: #d1d5db;
        }

        .toggle-text {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
        }

        .toggle-link {
          color: #6366f1;
          font-weight: 500;
          cursor: pointer;
          background: none;
          border: none;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          transition: color 0.2s;
          padding: 0;
        }

        .toggle-link:hover {
          color: #4f46e5;
        }

        @media (max-width: 768px) {
          .login-panel { display: none; }
        }
      `}</style>

      <div className="login-root">
        {/* Left branding panel */}
        <div className="login-panel">
          <div className="panel-logo">
            <div className="panel-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <span className="panel-logo-text">Suporte TI</span>
          </div>

          <div className="panel-content">
            <div className="panel-tag">Central de Atendimento</div>
            <h2 className="panel-headline">Resolva chamados com <span>mais agilidade</span></h2>
            <p className="panel-sub">Plataforma de suporte técnico para conectar usuários e a equipe de TI de forma eficiente.</p>
            <div className="panel-features">
              {["Abertura rápida de chamados", "Acompanhamento em tempo real", "Histórico completo de atendimentos", "Comunicação direta com o TI"].map(f => (
                <div key={f} className="panel-feature">
                  <div className="feature-dot" />
                  <span className="feature-text">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-footer">© 2025 Suporte TI</div>
        </div>

        {/* Right form side */}
        <div className="form-side">
          <div className="form-card">
            <h1 className="form-title">{isRegistering ? "Criar conta" : "Bem-vindo de volta"}</h1>
            <p className="form-subtitle">{isRegistering ? "Preencha os dados abaixo para se registrar" : "Entre com suas credenciais para acessar o sistema"}</p>

            <form onSubmit={handleSubmit}>
              {isRegistering && (
                <div className="field-group">
                  <label className="field-label">Nome completo</label>
                  <input className="field-input" type="text" placeholder="Digite seu nome" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              )}

              <div className="field-group">
                <label className="field-label">E-mail</label>
                <input className="field-input" type="email" placeholder="seu.email@empresa.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="field-group">
                <label className="field-label">Senha</label>
                <input className="field-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              {isRegistering && (
                <div className="field-group">
                  <label className="field-label">Tipo de usuário</label>
                  <div className="role-grid">
                    <button type="button" className={`role-btn ${role === 'usuario' ? 'active' : ''}`} onClick={() => setRole('usuario')}>Usuário</button>
                    <button type="button" className={`role-btn ${role === 'tecnico' ? 'active' : ''}`} onClick={() => setRole('tecnico')}>Analista TI</button>
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "Processando..." : isRegistering ? "Criar conta" : "Entrar"}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">ou</span>
              <div className="divider-line" />
            </div>

            <div className="toggle-text">
              {isRegistering ? "Já tem uma conta? " : "Não tem conta? "}
              <button className="toggle-link" onClick={() => setIsRegistering(!isRegistering)}>
                {isRegistering ? "Faça login" : "Cadastre-se aqui"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}