import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import { Institution } from "../types";
import { PageHeader, Card } from "../components/UI";

export default function Institutions() {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("HOSPITAL");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get("/institutions").then((res) => setInstitutions(res.data));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("Latitude e longitude precisam ser números válidos.");
      return;
    }

    try {
      await api.post("/institutions", { name, type, city, state, latitude: lat, longitude: lng });
      setShowForm(false);
      setName(""); setCity(""); setState(""); setLatitude(""); setLongitude("");
      load();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Não foi possível cadastrar a instituição.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Instituições"
        subtitle={`${institutions.length} instituição(ões) na rede`}
        action={
          user?.role === "ADMIN" ? (
            <button onClick={() => setShowForm((v) => !v)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              {showForm ? "Cancelar" : "+ Nova instituição"}
            </button>
          ) : undefined
        }
      />

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
            <input aria-label="Nome" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select aria-label="Tipo" value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="HOSPITAL">HOSPITAL</option>
              <option value="HEMOCENTRO">HEMOCENTRO</option>
            </select>
            <input aria-label="Cidade" placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input aria-label="Estado" placeholder="Estado (UF)" value={state} onChange={(e) => setState(e.target.value)} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input aria-label="Latitude" placeholder="Latitude (ex.: -28.263)" value={latitude} onChange={(e) => setLatitude(e.target.value)} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input aria-label="Longitude" placeholder="Longitude (ex.: -52.406)" value={longitude} onChange={(e) => setLongitude(e.target.value)} required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button className="rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 md:col-span-3">Criar instituição</button>
            {error && <p className="text-sm text-red-600 md:col-span-3">{error}</p>}
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {institutions.map((inst) => (
          <Card key={inst.id}>
            <p className="text-xs font-semibold uppercase text-brand-600">{inst.type}</p>
            <p className="mt-1 text-base font-bold text-slate-800">{inst.name}</p>
            <p className="text-sm text-slate-500">{inst.city} — {inst.state}</p>
            <div className="mt-3 flex gap-4 text-sm text-slate-600">
              <span>{inst._count?.bloodBags ?? 0} bolsas</span>
              <span>{inst._count?.demands ?? 0} demandas</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
