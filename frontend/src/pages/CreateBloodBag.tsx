import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Institution } from "../types";
import { PageHeader, Card, BLOOD_TYPE_LABELS } from "../components/UI";

const TYPES = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"];

export default function CreateBloodBag() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [tipoSanguineo, setTipoSanguineo] = useState("O_NEG");
  // Pré-seleciona a instituição do usuário logado (caso HEMOCENTRO/HOSPITAL);
  // um ADMIN, que não pertence a nenhuma instituição, precisa escolher.
  const [instituicaoId, setInstituicaoId] = useState(user?.institution?.id ?? "");
  const [localizacaoAtual, setLocalizacaoAtual] = useState("Câmara frigorífica 01");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/institutions").then((res) => setInstitutions(res.data));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!instituicaoId) {
      setError("Selecione a instituição responsável pela coleta.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/blood-bags", { tipoSanguineo, localizacaoAtual, instituicaoId });
      navigate(`/blood-bags/${data.codigo}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Não foi possível cadastrar a bolsa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Cadastrar bolsa" subtitle="Registra a coleta e cria o primeiro evento na blockchain" />
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="bag-instituicao" className="text-xs font-medium text-slate-600">Instituição responsável</label>
            <select
              id="bag-instituicao"
              value={instituicaoId}
              onChange={(e) => setInstituicaoId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bag-tipo" className="text-xs font-medium text-slate-600">Tipo sanguíneo</label>
            <select id="bag-tipo" value={tipoSanguineo} onChange={(e) => setTipoSanguineo(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {TYPES.map((t) => <option key={t} value={t}>{BLOOD_TYPE_LABELS(t)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="bag-localizacao" className="text-xs font-medium text-slate-600">Localização inicial</label>
            <input
              id="bag-localizacao"
              value={localizacaoAtual}
              onChange={(e) => setLocalizacaoAtual(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {loading ? "Registrando na blockchain..." : "Cadastrar bolsa"}
          </button>
        </form>
      </Card>
    </div>
  );
}
