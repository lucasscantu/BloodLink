import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { BloodBag } from "../types";
import { PageHeader, StatusBadge, BLOOD_TYPE_LABELS, Card } from "../components/UI";

export default function BloodBags() {
  const [bags, setBags] = useState<BloodBag[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get("/blood-bags", { params: { status: statusFilter || undefined, tipoSanguineo: typeFilter || undefined } })
      .then((res) => setBags(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter, typeFilter]);

  return (
    <div>
      <PageHeader
        title="Bolsas de sangue"
        subtitle={`${bags.length} bolsa(s) encontrada(s)`}
        action={
          <div className="flex gap-2">
            <Link to="/scan" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              📷 Escanear QR Code
            </Link>
            <Link to="/blood-bags/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              + Cadastrar bolsa
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todos os status</option>
          {["COLETADA", "EM_TESTE", "APROVADA", "REPROVADA", "ARMAZENADA", "EM_TRANSPORTE", "DISPONIVEL", "RESERVADA", "UTILIZADA", "DESCARTADA", "EXPIRADA"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todos os tipos</option>
          {["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"].map((t) => (
            <option key={t} value={t}>{BLOOD_TYPE_LABELS(t)}</option>
          ))}
        </select>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Instituição atual</th>
              <th className="px-4 py-3">Validade</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Carregando...</td></tr>
            )}
            {!loading && bags.map((bag) => (
              <tr key={bag.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/blood-bags/${bag.codigo}`} className="font-medium text-brand-600 hover:underline">
                    {bag.codigo}
                  </Link>
                </td>
                <td className="px-4 py-3">{BLOOD_TYPE_LABELS(bag.tipoSanguineo)}</td>
                <td className="px-4 py-3"><StatusBadge status={bag.status} /></td>
                <td className="px-4 py-3">{bag.instituicaoAtual?.name}</td>
                <td className="px-4 py-3">{new Date(bag.dataValidade).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
            {!loading && bags.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Nenhuma bolsa encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
