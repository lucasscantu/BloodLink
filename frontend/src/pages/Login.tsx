import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("hospitalA@bloodlink.com");
  const [password, setPassword] = useState("senha123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-brand-700">BloodLink</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          Rastreabilidade de bolsas de sangue com blockchain — protótipo acadêmico.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label htmlFor="login-email" className="text-xs font-medium text-slate-600">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-xs font-medium text-slate-600">Senha</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p className="mb-1 font-semibold text-slate-600">Usuários de demonstração (senha: senha123)</p>
          <p>admin@bloodlink.com — ADMIN</p>
          <p>hemocentro@bloodlink.com — HEMOCENTRO</p>
          <p>hospitalA@bloodlink.com — HOSPITAL</p>
          <p>hospitalB@bloodlink.com — HOSPITAL</p>
          <p>auditor@bloodlink.com — AUDITOR</p>
        </div>
      </div>
    </div>
  );
}
