import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import { Institution } from "../types";
import { PageHeader, Card, StatusBadge } from "../components/UI";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  institution: Institution | null;
}

const ROLES = ["ADMIN", "HEMOCENTRO", "HOSPITAL", "AUDITOR"];

export default function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("HOSPITAL");
  const [institutionId, setInstitutionId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get("/users").then((res) => setUsers(res.data));
    api.get("/institutions").then((res) => setInstitutions(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/users", { name, email, password, role, institutionId: institutionId || undefined });
      setShowForm(false);
      setName(""); setEmail(""); setPassword("");
      load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Não foi possível criar o usuário.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle={`${users.length} usuário(s) cadastrado(s)`}
        action={
          <button onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            {showForm ? "Cancelar" : "+ Novo usuário"}
          </button>
        }
      />

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
            <input aria-label="Nome" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input aria-label="E-mail" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input aria-label="Senha" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select aria-label="Perfil" value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select aria-label="Instituição" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Sem instituição</option>
              {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <button className="rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 md:col-span-5">Criar usuário</button>
            {error && <p className="text-sm text-red-600 md:col-span-5">{error}</p>}
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Instituição</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                <td className="px-4 py-3">{u.institution?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
