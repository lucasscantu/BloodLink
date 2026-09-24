import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge, MetricCard, BLOOD_TYPE_LABELS, PageHeader } from "./UI";

describe("BLOOD_TYPE_LABELS", () => {
  it("converte os códigos internos para os rótulos exibidos ao usuário", () => {
    expect(BLOOD_TYPE_LABELS("O_NEG")).toBe("O-");
    expect(BLOOD_TYPE_LABELS("AB_POS")).toBe("AB+");
    expect(BLOOD_TYPE_LABELS("A_POS")).toBe("A+");
  });

  it("retorna o próprio valor quando o tipo não é reconhecido", () => {
    expect(BLOOD_TYPE_LABELS("XYZ")).toBe("XYZ");
  });
});

describe("StatusBadge", () => {
  it("renderiza o status substituindo underscores por espaços", () => {
    render(<StatusBadge status="EM_TRANSPORTE" />);
    expect(screen.getByText("EM TRANSPORTE")).toBeInTheDocument();
  });

  it("aplica uma cor conhecida para status mapeados (ex.: DISPONIVEL)", () => {
    render(<StatusBadge status="DISPONIVEL" />);
    const badge = screen.getByText("DISPONIVEL");
    expect(badge.className).toContain("emerald");
  });

  it("usa uma cor neutra padrão para status não mapeados", () => {
    render(<StatusBadge status="STATUS_DESCONHECIDO" />);
    const badge = screen.getByText("STATUS DESCONHECIDO");
    expect(badge.className).toContain("slate");
  });
});

describe("MetricCard", () => {
  it("exibe o rótulo e o valor da métrica", () => {
    render(<MetricCard label="Bolsas disponíveis" value={42} />);
    expect(screen.getByText("Bolsas disponíveis")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});

describe("PageHeader", () => {
  it("renderiza título, subtítulo e a ação opcional", () => {
    render(<PageHeader title="Demandas" subtitle="14 demanda(s)" action={<button>Nova demanda</button>} />);
    expect(screen.getByText("Demandas")).toBeInTheDocument();
    expect(screen.getByText("14 demanda(s)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nova demanda" })).toBeInTheDocument();
  });
});
