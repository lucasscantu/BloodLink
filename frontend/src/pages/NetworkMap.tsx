import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Institution } from "../types";
import { PageHeader, Card } from "../components/UI";

export default function NetworkMap() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    api.get("/institutions").then((res) => setInstitutions(res.data));
  }, []);

  const lats = institutions.map((i) => i.latitude);
  const lngs = institutions.map((i) => i.longitude);
  const minLat = Math.min(...lats, -1), maxLat = Math.max(...lats, 1);
  const minLng = Math.min(...lngs, -1), maxLng = Math.max(...lngs, 1);

  function project(inst: Institution) {
    const x = ((inst.longitude - minLng) / (maxLng - minLng || 1)) * 90 + 5;
    const y = (1 - (inst.latitude - minLat) / (maxLat - minLat || 1)) * 80 + 10;
    return { x, y };
  }

  return (
    <div>
      <PageHeader title="Mapa da rede" subtitle="Posições aproximadas das instituições participantes (protótipo)" />
      <Card>
        <div className="relative h-[420px] w-full overflow-hidden rounded-xl bg-slate-100">
          {institutions.map((inst) => {
            const { x, y } = project(inst);
            const color = inst.type === "HEMOCENTRO" ? "bg-brand-600" : "bg-emerald-600";
            return (
              <div key={inst.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${x}%`, top: `${y}%` }}>
                <div className={`mx-auto h-4 w-4 rounded-full border-2 border-white shadow ${color}`} />
                <p className="mt-1 whitespace-nowrap text-xs font-medium text-slate-700">{inst.name}</p>
                <p className="text-[10px] text-slate-400">{inst.city}/{inst.state}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-brand-600" /> Hemocentro</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald-600" /> Hospital</span>
        </div>
      </Card>
    </div>
  );
}
