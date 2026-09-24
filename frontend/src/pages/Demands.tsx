import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { BloodDemand, Institution } from "../types";
import { useAuth } from "../hooks/useAuth";
import { PageHeader, Card, StatusBadge, BLOOD_TYPE_LABELS } from "../components/UI";

const TYPES = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"];
const URGENCIAS = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];

export default function Demands() {
  const { user } = useAuth();
  const [demands, setDemands] = useState<BloodDemand[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [hospitalId, setHospitalId] = useState(user?.institution?.id ?? "");
  const [tipoSanguineo, setTipoSanguineo] = useState("O_NEG");
  const [quantidade, setQuantidade] = useState(5);
  const [urgencia, setUrgencia] = useState("ALTA");
  const [motivo, setMotivo] = useState("Reposição de estoque");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get("/demands").then((res) => setDemands(res.data));
    api.get("/institutions").then((res) => setInstitutions(res.data));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hospitalId) {
      setError("Selecione o hospital solicitante.");
      return;
    }

    try {
      await api.post("/demands", { hospitalId, tipoSanguineo, quantidade, urgencia, motivo });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Não foi possível criar a demanda.");
    }
  }

  const canCreate = user?.role === "HOSPITAL" || user?.role === "ADMIN";

  return (
    <div>
      <PageHeader
        title="Demandas de sangue"
        subtitle={`${demands.length} demanda(s)`}
        action={canCreate ? (
          <button onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            {showForm ? "Cancelar" : "+ Nova demanda"}
          </button>
        ) : undefined}
      />

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
            <div>
              <label htmlFor="demand-hospital" className="text-xs font-medium text-slate-600">Hospital solicitante</label>
              <select id="demand-hospital" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="demand-tipo" className="text-xs font-medium text-slate-600">Tipo sanguíneo</label>
              <select id="demand-tipo" value={tipoSanguineo} onChange={(e) => setTipoSanguineo(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {TYPES.map((t) => <option key={t} value={t}>{BLOOD_TYPE_LABELS(t)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="demand-quantidade" className="text-xs font-medium text-slate-600">Quantidade</label>
              <input id="demand-quantidade" type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="demand-urgencia" className="text-xs font-medium text-slate-600">Urgência</label>
              <select id="demand-urgencia" value={urgencia} onChange={(e) => setUrgencia(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {URGENCIAS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="demand-motivo" className="text-xs font-medium text-slate-600">Motivo</label>
              <input id="demand-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button className="rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 md:col-span-5">Criar demanda</button>
            {error && <p className="text-sm text-red-600 md:col-span-5">{error}</p>}
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Hospital</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Quantidade</th>
              <th className="px-4 py-3">Urgência</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {demands.map((d) => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/demands/${d.id}`} className="font-medium text-brand-600 hover:underline">{d.hospital?.name}</Link>
                </td>
                <td className="px-4 py-3">{BLOOD_TYPE_LABELS(d.tipoSanguineo)}</td>
                <td className="px-4 py-3">{d.quantidadeAtendida}/{d.quantidade}</td>
                <td className="px-4 py-3"><StatusBadge status={d.urgencia} /></td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
              </tr>
            ))}
            {demands.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Nenhuma demanda encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
