import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { PageHeader, Card } from "../components/UI";

interface Reading {
  id: string;
  bagId: string;
  bloodBag: { codigo: string; instituicaoAtual: { name: string } };
  valor: number;
  timestamp: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Reading[]>([]);

  useEffect(() => {
    api.get("/temperature/alerts").then((res) => setAlerts(res.data));
  }, []);

  return (
    <div>
      <PageHeader title="Alertas de temperatura" subtitle={`${alerts.length} leitura(s) fora da faixa segura (2°C – 6°C)`} />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Bolsa</th>
              <th className="px-4 py-3">Instituição</th>
              <th className="px-4 py-3">Temperatura</th>
              <th className="px-4 py-3">Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/blood-bags/${a.bloodBag.codigo}`} className="font-medium text-brand-600 hover:underline">
                    {a.bloodBag.codigo}
                  </Link>
                </td>
                <td className="px-4 py-3">{a.bloodBag.instituicaoAtual?.name}</td>
                <td className="px-4 py-3 font-semibold text-red-600">{a.valor} °C ⚠</td>
                <td className="px-4 py-3">{new Date(a.timestamp).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Nenhum alerta registrado.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
