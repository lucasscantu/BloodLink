import { ReactNode } from "react";

const STATUS_COLORS: Record<string, string> = {
  COLETADA: "bg-slate-100 text-slate-700",
  EM_TESTE: "bg-amber-100 text-amber-700",
  APROVADA: "bg-emerald-100 text-emerald-700",
  REPROVADA: "bg-red-100 text-red-700",
  ARMAZENADA: "bg-sky-100 text-sky-700",
  EM_TRANSPORTE: "bg-indigo-100 text-indigo-700",
  RECEBIDA: "bg-teal-100 text-teal-700",
  DISPONIVEL: "bg-emerald-100 text-emerald-700",
  RESERVADA: "bg-amber-100 text-amber-700",
  UTILIZADA: "bg-slate-200 text-slate-600",
  DESCARTADA: "bg-red-100 text-red-700",
  EXPIRADA: "bg-red-100 text-red-700",
  ABERTA: "bg-amber-100 text-amber-700",
  EM_ANALISE: "bg-sky-100 text-sky-700",
  ATENDIDA: "bg-emerald-100 text-emerald-700",
  PARCIALMENTE_ATENDIDA: "bg-indigo-100 text-indigo-700",
  CANCELADA: "bg-red-100 text-red-700",
  OFERTADA: "bg-amber-100 text-amber-700",
  ACEITA: "bg-sky-100 text-sky-700",
  RECUSADA: "bg-red-100 text-red-700",
  BAIXA: "bg-slate-100 text-slate-600",
  MEDIA: "bg-amber-100 text-amber-700",
  ALTA: "bg-orange-100 text-orange-700",
  CRITICA: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700";
  return <span className={`badge ${color}`}>{status.replaceAll("_", " ")}</span>;
}

export function BLOOD_TYPE_LABELS(type: string) {
  const map: Record<string, string> = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
    O_POS: "O+",
    O_NEG: "O-",
  };
  return map[type] ?? type;
}

export function MetricCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ?? "text-slate-800"}`}>{value}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}
