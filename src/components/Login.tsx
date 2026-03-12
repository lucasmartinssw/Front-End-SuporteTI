import { useState } from "react";
import { auth, setToken } from "../api";

interface LoginProps {
  onLogin: (email: string, role: string, name: string, token: string) => void;
  sessionExpired?: boolean;
}

type UserRole = "usuario" | "tecnico";

export function Login({ onLogin, sessionExpired = false }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("usuario");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ferrs: Record<string,string> = {};
    if (isRegistering && !name.trim()) ferrs.name = 'Nome é obrigatório.';
    if (!email.trim()) ferrs.email = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ferrs.email = 'E-mail inválido.';
    if (!password) ferrs.password = 'Senha é obrigatória.';
    else if (isRegistering && password.length < 6) ferrs.password = 'Mínimo de 6 caracteres.';
    setFieldErrors(ferrs);
    if (Object.keys(ferrs).length > 0) return;
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #f7f8fc;
          overflow: hidden;
        }

        /* ── Left panel ── */
        .login-left {
          display: none;
          width: 45%;
          background: linear-gradient(145deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
          position: relative;
          overflow: hidden;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
        }
        @media (min-width: 960px) { .login-left { display: flex; } }

        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(99,102,241,0.4) 0%, transparent 50%);
        }

        .left-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.25;
        }
        .blob-1 { width: 320px; height: 320px; background: #a5b4fc; top: -80px; right: -80px; }
        .blob-2 { width: 240px; height: 240px; background: #c7d2fe; bottom: 60px; left: -60px; }
        .blob-3 { width: 160px; height: 160px; background: #e0e7ff; bottom: 180px; right: 40px; }

        .left-brand {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-icon {
          width: 44px; height: 44px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px);
        }
        .brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
        }

        .left-content {
          position: relative;
          z-index: 1;
        }
        .left-tagline {
          font-family: 'Sora', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -0.5px;
          margin-bottom: 16px;
        }
        .left-tagline span { color: #c7d2fe; }
        .left-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.75);
          line-height: 1.6;
          max-width: 320px;
        }

        .left-stats {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 24px;
        }
        .stat-card {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 14px;
          padding: 16px 20px;
          backdrop-filter: blur(8px);
          flex: 1;
        }
        .stat-number {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
        }
        .stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.65);
          margin-top: 2px;
        }

        /* ── Right panel ── */
        .login-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 24px;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          animation: fadeUp 0.35s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Mobile brand */
        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 36px;
        }
        @media (min-width: 960px) { .mobile-brand { display: none; } }
        .mobile-brand-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .mobile-brand-name {
          font-family: 'Sora', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #1e1b4b;
        }

        .card-title {
          font-family: 'Sora', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #1e1b4b;
          letter-spacing: -0.4px;
          margin-bottom: 6px;
        }
        .card-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 32px;
        }

        /* Error */
        .session-banner {
          background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px;
          padding: 11px 14px; margin-bottom: 20px; font-size: 13px; color: #92400e;
          display: flex; align-items: center; gap: 8px;
        }
        .error-box {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #991b1b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .field input.error { border-color: #fca5a5 !important; background: #fff5f5 !important; }
        .field input.error:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.08) !important; }
        .field-error { font-size: 11.5px; color: #ef4444; margin-top: 5px; display: flex; align-items: center; gap: 4px; }

        /* Form */
        .field { margin-bottom: 18px; }
        .field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }
        .field input {
          width: 100%;
          height: 44px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 0 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #111827;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .field input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
          background: #fff;
        }
        .field input::placeholder { color: #9ca3af; }

        /* Role selector */
        .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .role-btn {
          height: 44px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .role-btn:hover { border-color: #6366f1; color: #6366f1; }
        .role-btn.active {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }
        .role-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.7;
        }

        /* Submit */
        .submit-btn {
          width: 100%;
          height: 46px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(99,102,241,0.4);
        }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Toggle */
        .toggle-row {
          margin-top: 28px;
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid #f0f1f5;
        }
        .toggle-row p { font-size: 13px; color: #6b7280; margin-bottom: 6px; }
        .toggle-btn {
          background: none;
          border: none;
          color: #6366f1;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }
        .toggle-btn:hover { color: #4f46e5; }
      `}</style>

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
              {sessionExpired && (
                <div className="session-banner">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Sua sessão expirou. Por favor, faça login novamente.
                </div>
              )}
              {isRegistering && (
                <div className="field">
                  <label>Nome Completo</label>
                  <input type="text" placeholder="Digite seu nome" value={name} className={fieldErrors.name ? 'error' : ''}
                    onChange={(e) => { setName(e.target.value); if(fieldErrors.name) setFieldErrors(p=>({...p,name:''})); }} />
                  {fieldErrors.name && <p className="field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.name}</p>}
                </div>
              )}

              <div className="field">
                <label>E-mail</label>
                <input type="email" placeholder="seu.email@empresa.com" value={email} className={fieldErrors.email ? 'error' : ''}
                  onChange={(e) => { setEmail(e.target.value); if(fieldErrors.email) setFieldErrors(p=>({...p,email:''})); }} />
                {fieldErrors.email && <p className="field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.email}</p>}
              </div>

              <div className="field">
                <label>Senha</label>
                <input type="password" placeholder="••••••••" value={password} className={fieldErrors.password ? 'error' : ''}
                  onChange={(e) => { setPassword(e.target.value); if(fieldErrors.password) setFieldErrors(p=>({...p,password:''})); }} />
                {fieldErrors.password && <p className="field-error"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.password}</p>}
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