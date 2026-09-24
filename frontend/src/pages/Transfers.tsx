import { useEffect, useState } from "react";
import { api } from "../services/api";
import { BloodTransfer } from "../types";
import { PageHeader, Card, StatusBadge } from "../components/UI";

export default function Transfers() {
  const [transfers, setTransfers] = useState<BloodTransfer[]>([]);

  function load() {
    api.get("/transfers").then((res) => setTransfers(res.data));
  }
  useEffect(load, []);

  async function receive(id: string) {
    await api.post(`/transfers/${id}/receive`);
    load();
  }

  return (
    <div>
      <PageHeader title="Transferências" subtitle={`${transfers.length} transferência(s) na rede`} />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Bolsa</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{t.bloodBag?.codigo}</td>
                <td className="px-4 py-3">{t.sourceInstitution?.name}</td>
                <td className="px-4 py-3">{t.destinationInstitution?.name}</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3">
                  {t.status === "EM_TRANSPORTE" && (
                    <button onClick={() => receive(t.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      Confirmar recebimento
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {transfers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Nenhuma transferência encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
