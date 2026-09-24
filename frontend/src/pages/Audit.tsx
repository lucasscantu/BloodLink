import { useEffect, useState } from "react";
import { api } from "../services/api";
import { PageHeader, Card } from "../components/UI";

interface AuditEvent {
  id: string;
  bagId: string;
  bloodBag: { codigo: string };
  tipoEvento: string;
  instituicao: { name: string };
  usuario: { name: string } | null;
  timestamp: string;
  hash: string;
  blockchainTx: { txHash: string } | null;
}

export default function Audit() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [verifyResult, setVerifyResult] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get("/audit").then((res) => setEvents(res.data));
  }, []);

  async function verify(eventId: string) {
    const { data } = await api.get(`/blockchain/verify/${eventId}`);
    setVerifyResult((prev) => ({ ...prev, [eventId]: data.integro }));
  }

  return (
    <div>
      <PageHeader title="Auditoria blockchain" subtitle="Todos os eventos registrados na rede, do mais recente ao mais antigo" />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">TX</th>
              <th className="px-4 py-3">Bolsa</th>
              <th className="px-4 py-3">Evento</th>
              <th className="px-4 py-3">Instituição</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Hash</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{e.blockchainTx?.txHash.slice(0, 10) ?? "—"}...</td>
                <td className="px-4 py-3">{e.bloodBag?.codigo}</td>
                <td className="px-4 py-3">{e.tipoEvento.replaceAll("_", " ")}</td>
                <td className="px-4 py-3">{e.instituicao?.name}</td>
                <td className="px-4 py-3">{e.usuario?.name ?? "sistema"}</td>
                <td className="px-4 py-3">{new Date(e.timestamp).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.hash.slice(0, 10)}...</td>
                <td className="px-4 py-3">
                  {verifyResult[e.id] === undefined ? (
                    <button onClick={() => verify(e.id)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                      Verificar
                    </button>
                  ) : (
                    <span className={verifyResult[e.id] ? "text-emerald-600" : "text-red-600"}>
                      {verifyResult[e.id] ? "✓ Íntegro" : "⚠ Divergente"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
