import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { BloodDemand, BloodBag } from "../types";
import { useAuth } from "../hooks/useAuth";
import { PageHeader, Card, StatusBadge, BLOOD_TYPE_LABELS } from "../components/UI";

export default function DemandDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [demand, setDemand] = useState<BloodDemand | null>(null);
  const [availableBags, setAvailableBags] = useState<Record<string, BloodBag[]>>({});
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get(`/demands/${id}`).then((res) => setDemand(res.data));
  }

  useEffect(load, [id]);

  async function loadBagsFor(institutionId: string, tipoSanguineo: string) {
    const { data } = await api.get("/blood-bags", { params: { instituicaoId: institutionId, status: "DISPONIVEL", tipoSanguineo } });
    setAvailableBags((prev) => ({ ...prev, [institutionId]: data }));
  }

  async function offer(bagId: string) {
    setError(null);
    try {
      await api.post(`/demands/${id}/offer`, { bagId });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Não foi possível oferecer a bolsa.");
    }
  }

  async function accept(transferId: string) {
    setError(null);
    try {
      await api.post(`/demands/${id}/accept`, { transferId });
      load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Não foi possível aceitar a oferta.");
    }
  }

  async function receive(transferId: string) {
    setError(null);
    try {
      await api.post(`/transfers/${transferId}/receive`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Não foi possível confirmar o recebimento.");
    }
  }

  if (!demand) return <p className="text-sm text-slate-500">Carregando...</p>;

  const isOwnerHospital = user?.institution?.id === demand.hospital.id;

  return (
    <div>
      <PageHeader
        title={`Demanda — ${demand.hospital.name}`}
        subtitle={`${BLOOD_TYPE_LABELS(demand.tipoSanguineo)} • ${demand.quantidade} bolsa(s) • ${demand.motivo}`}
      />

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Resumo</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={demand.status} /></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Urgência</dt><dd><StatusBadge status={demand.urgencia} /></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Atendido</dt><dd className="font-medium">{demand.quantidadeAtendida} de {demand.quantidade}</dd></div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Fornecedores compatíveis</h2>
          {demand.fornecedoresCompativeis?.length ? (
            <ul className="space-y-3">
              {demand.fornecedoresCompativeis.map((f) => (
                <li key={f.institution.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{f.institution.name}</p>
                      <p className="text-xs text-slate-500">{f.tipoSanguineo} disponível: {f.disponivel}</p>
                    </div>
                    <button
                      onClick={() => loadBagsFor(f.institution.id, demand.tipoSanguineo)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Ver bolsas
                    </button>
                  </div>
                  {availableBags[f.institution.id] && (
                    <ul className="mt-2 space-y-1">
                      {availableBags[f.institution.id].map((bag) => (
                        <li key={bag.id} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs">
                          <span>{bag.codigo}</span>
                          <button onClick={() => offer(bag.id)} className="font-semibold text-brand-600 hover:underline">
                            Oferecer
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Nenhum fornecedor com estoque compatível no momento.</p>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Transferências desta demanda</h2>
        {demand.transfers.length === 0 && <p className="text-sm text-slate-400">Nenhuma oferta registrada ainda.</p>}
        <ul className="space-y-2">
          {demand.transfers.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">{t.bloodBag.codigo} — {t.sourceInstitution.name} → {t.destinationInstitution.name}</p>
                <StatusBadge status={t.status} />
              </div>
              <div className="flex gap-2">
                {isOwnerHospital && t.status === "OFERTADA" && (
                  <button onClick={() => accept(t.id)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                    Aceitar
                  </button>
                )}
                {isOwnerHospital && t.status === "EM_TRANSPORTE" && (
                  <button onClick={() => receive(t.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                    Confirmar recebimento
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
