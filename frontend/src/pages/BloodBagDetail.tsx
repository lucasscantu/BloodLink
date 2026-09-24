import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../services/api";
import { BloodBag, BloodBagEvent } from "../types";
import { useAuth } from "../hooks/useAuth";
import { Card, PageHeader, StatusBadge, BLOOD_TYPE_LABELS } from "../components/UI";

interface VerifyResult {
  eventId: string;
  integro: boolean;
  txHash: string | null;
}

export default function BloodBagDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [bag, setBag] = useState<BloodBag | null>(null);
  const [history, setHistory] = useState<BloodBagEvent[]>([]);
  const [verification, setVerification] = useState<VerifyResult[] | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    api.get(`/blood-bags/${id}`).then((res) => setBag(res.data));
    api.get(`/blood-bags/${id}/history`).then((res) => setHistory(res.data));
    setVerification(null);
  }

  useEffect(load, [id]);

  async function verify() {
    setVerifying(true);
    try {
      const { data } = await api.get(`/blood-bags/${id}/verify`);
      setVerification(data);
    } finally {
      setVerifying(false);
    }
  }

  async function runAction(action: "approve" | "use" | "reject" | "discard", motivo?: string) {
    setActionError(null);
    try {
      await api.post(`/blood-bags/${bag!.id}/${action}`, motivo ? { motivo } : undefined);
      load();
    } catch (err: any) {
      setActionError(err.response?.data?.error ?? "Não foi possível executar a ação.");
    }
  }

  function runActionWithReason(action: "reject" | "discard", promptLabel: string) {
    const motivo = window.prompt(promptLabel);
    if (motivo === null) return; // usuário cancelou o prompt
    if (!motivo.trim()) {
      setActionError("Informe um motivo para continuar.");
      return;
    }
    runAction(action, motivo.trim());
  }

  if (!bag) return <p className="text-sm text-slate-500">Carregando...</p>;

  const allIntegro = verification?.every((v) => v.integro);

  return (
    <div>
      <PageHeader title={`Bolsa ${bag.codigo}`} subtitle={`${BLOOD_TYPE_LABELS(bag.tipoSanguineo)} • ${bag.instituicaoAtual?.name}`} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Dados da bolsa</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Tipo sanguíneo</dt><dd className="font-medium">{BLOOD_TYPE_LABELS(bag.tipoSanguineo)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={bag.status} /></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Instituição atual</dt><dd className="font-medium">{bag.instituicaoAtual?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Localização</dt><dd className="font-medium">{bag.localizacaoAtual}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Coleta</dt><dd>{new Date(bag.dataColeta).toLocaleString("pt-BR")}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Validade</dt><dd>{new Date(bag.dataValidade).toLocaleDateString("pt-BR")}</dd></div>
            {bag.temperaturaAtual != null && (
              <div className="flex justify-between"><dt className="text-slate-500">Temperatura atual</dt><dd>{bag.temperaturaAtual} °C</dd></div>
            )}
          </dl>

          {(user?.role === "HEMOCENTRO" || user?.role === "ADMIN") &&
            (bag.status === "COLETADA" || bag.status === "EM_TESTE") && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => runAction("approve")} className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  Aprovar bolsa
                </button>
                <button
                  onClick={() => runActionWithReason("reject", "Motivo da reprovação:")}
                  className="flex-1 rounded-lg border border-red-200 bg-white py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Reprovar
                </button>
              </div>
            )}
          {(user?.role === "HOSPITAL" || user?.role === "ADMIN") && bag.status === "DISPONIVEL" && (
            <div className="mt-4 flex gap-2">
              <button onClick={() => runAction("use")} className="flex-1 rounded-lg bg-slate-700 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Registrar utilização
              </button>
              <button
                onClick={() => runActionWithReason("discard", "Motivo do descarte:")}
                className="flex-1 rounded-lg border border-red-200 bg-white py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Descartar
              </button>
            </div>
          )}
          {actionError && <p className="mt-2 text-xs text-red-600">{actionError}</p>}
        </Card>

        <Card className="flex flex-col items-center justify-center">
          <h2 className="mb-3 self-start text-sm font-semibold text-slate-700">QR Code da bolsa</h2>
          <QRCodeSVG value={`${window.location.origin}/blood-bags/${bag.codigo}`} size={160} />
          <p className="mt-2 text-xs text-slate-400">/blood-bags/{bag.codigo}</p>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Integridade blockchain</h2>
          <p className="mb-3 text-xs text-slate-500">
            Recalcula o hash de cada evento e compara com o registro imutável na blockchain.
          </p>
          <button onClick={verify} disabled={verifying} className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {verifying ? "Verificando..." : "VERIFICAR INTEGRIDADE"}
          </button>

          {verification && (
            <p className={`mt-3 text-center text-sm font-semibold ${allIntegro ? "text-emerald-600" : "text-red-600"}`}>
              {allIntegro ? "✓ Registro íntegro" : "⚠ Registro divergente"}
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Histórico da bolsa</h2>
        <ol className="relative border-l border-slate-200 pl-4">
          {history.map((event) => {
            const check = verification?.find((v) => v.eventId === event.id);
            return (
              <li key={event.id} className="mb-5 last:mb-0">
                <div className="absolute -ml-[21px] mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                <p className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleString("pt-BR")}</p>
                <p className="text-sm font-medium text-slate-800">{event.tipoEvento.replaceAll("_", " ")}</p>
                <p className="text-sm text-slate-600">{event.descricao}</p>
                <p className="text-xs text-slate-400">{event.instituicao?.name} {event.usuario ? `• ${event.usuario.name}` : ""}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  hash: {event.hash.slice(0, 16)}... {event.blockchainTx && `• tx: ${event.blockchainTx.txHash.slice(0, 12)}...`}
                </p>
                {check && (
                  <p className={`text-xs font-semibold ${check.integro ? "text-emerald-600" : "text-red-600"}`}>
                    {check.integro ? "✓ íntegro" : "⚠ divergente"}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
