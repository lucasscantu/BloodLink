import { useEffect, useState } from "react";
import { api } from "../services/api";
import { PageHeader, Card } from "../components/UI";

interface Tx {
  id: string;
  txHash: string;
  blockNumber: number | null;
  contractMethod: string;
  payloadHash: string;
  network: string;
  status: string;
  createdAt: string;
  events: { id: string; tipoEvento: string; bloodBag: { codigo: string }; instituicao: { name: string } }[];
}

export default function Blockchain() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [network, setNetwork] = useState<{ network: string; implementation: string } | null>(null);

  useEffect(() => {
    api.get("/blockchain/transactions").then((res) => setTxs(res.data));
    api.get("/blockchain/network").then((res) => setNetwork(res.data));
  }, []);

  return (
    <div>
      <PageHeader
        title="Blockchain"
        subtitle={network ? `Rede: ${network.network} • Implementação: ${network.implementation}` : "Carregando rede..."}
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tx Hash</th>
              <th className="px-4 py-3">Bloco</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Bolsa / Evento</th>
              <th className="px-4 py-3">Instituição</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => (
              <tr key={tx.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{tx.txHash.slice(0, 14)}...</td>
                <td className="px-4 py-3">{tx.blockNumber ?? "—"}</td>
                <td className="px-4 py-3">{tx.contractMethod}</td>
                <td className="px-4 py-3">
                  {tx.events[0]?.bloodBag?.codigo} — {tx.events[0]?.tipoEvento.replaceAll("_", " ")}
                </td>
                <td className="px-4 py-3">{tx.events[0]?.instituicao?.name}</td>
                <td className="px-4 py-3 text-emerald-600 font-medium">✓ {tx.status}</td>
                <td className="px-4 py-3">{new Date(tx.createdAt).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {txs.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Nenhuma transação registrada ainda.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
