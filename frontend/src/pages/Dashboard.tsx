import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { api } from "../services/api";
import { DashboardSummary } from "../types";
import { MetricCard, PageHeader, Card } from "../components/UI";

const PIE_COLORS = ["#3b5fe0", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    api.get("/dashboard").then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-sm text-slate-500">Carregando dashboard...</p>;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral da rede BloodLink" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Bolsas disponíveis" value={data.cards.disponiveis} accent="text-emerald-600" />
        <MetricCard label="Em transporte" value={data.cards.emTransporte} accent="text-indigo-600" />
        <MetricCard label="Utilizadas" value={data.cards.utilizadas} />
        <MetricCard label="Expiradas" value={data.cards.expiradas} accent="text-red-600" />
        <MetricCard label="Demandas abertas" value={data.cards.demandasAbertas} accent="text-amber-600" />
        <MetricCard label="Demandas urgentes" value={data.cards.demandasUrgentes} accent="text-red-600" />
        <MetricCard label="Transferências em andamento" value={data.cards.transferenciasAndamento} />
        <MetricCard label="Alertas de temperatura" value={data.cards.alertasTemperatura} accent="text-red-600" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Estoque por tipo sanguíneo (disponível)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.estoquePorTipo}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#3b5fe0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Demandas por status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.demandasPorStatus}
                dataKey="quantidade"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(entry) => `${entry.status}: ${entry.quantidade}`}
              >
                {data.demandasPorStatus.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Movimentações por tipo de evento</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.movimentacoes} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} fontSize={12} />
              <YAxis dataKey="tipo" type="category" fontSize={11} width={160} />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
