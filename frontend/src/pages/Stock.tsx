import { useEffect, useState } from "react";
import { api } from "../services/api";
import { PageHeader, Card, BLOOD_TYPE_LABELS } from "../components/UI";

interface StockItem { tipoSanguineo: string; label: string; quantidade: number }

export default function Stock() {
  const [stock, setStock] = useState<StockItem[]>([]);

  useEffect(() => {
    api.get("/dashboard").then((res) => setStock(res.data.estoquePorTipo));
  }, []);

  const max = Math.max(1, ...stock.map((s) => s.quantidade));

  return (
    <div>
      <PageHeader title="Estoque" subtitle="Bolsas disponíveis por tipo sanguíneo (toda a rede)" />
      <Card>
        <div className="space-y-3">
          {stock.map((item) => (
            <div key={item.tipoSanguineo} className="flex items-center gap-3">
              <span className="w-10 text-sm font-semibold text-slate-700">{BLOOD_TYPE_LABELS(item.tipoSanguineo)}</span>
              <div className="h-4 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-4 rounded-full bg-brand-500"
                  style={{ width: `${(item.quantidade / max) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm text-slate-500">{item.quantidade}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
