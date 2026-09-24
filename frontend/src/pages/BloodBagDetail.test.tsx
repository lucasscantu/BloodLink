import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BloodBagDetail from "./BloodBagDetail";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

let mockUser: { role: string } | null = { role: "HEMOCENTRO" };
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

function baseBag(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "bag-1",
    codigo: "O--2026-00001",
    tipoSanguineo: "O_NEG",
    dataColeta: "2026-01-01T00:00:00.000Z",
    dataValidade: "2026-02-12T00:00:00.000Z",
    status: "COLETADA",
    instituicaoAtual: { name: "Hemocentro Central" },
    localizacaoAtual: "Câmara 01",
    temperaturaAtual: null,
    qrCode: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderPage(bag: ReturnType<typeof baseBag>) {
  (api.get as any).mockImplementation((url: string) => {
    if (url.endsWith("/history")) return Promise.resolve({ data: [] });
    return Promise.resolve({ data: bag });
  });

  return render(
    <MemoryRouter initialEntries={["/blood-bags/O--2026-00001"]}>
      <Routes>
        <Route path="/blood-bags/:id" element={<BloodBagDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { role: "HEMOCENTRO" };
});

describe("BloodBagDetail — visibilidade dos botões de ação", () => {
  it("mostra Aprovar/Reprovar para HEMOCENTRO quando a bolsa está COLETADA (status real logo após o cadastro)", async () => {
    renderPage(baseBag({ status: "COLETADA" }));

    expect(await screen.findByRole("button", { name: "Aprovar bolsa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reprovar" })).toBeInTheDocument();
  });

  it("também mostra Aprovar/Reprovar quando a bolsa está EM_TESTE", async () => {
    renderPage(baseBag({ status: "EM_TESTE" }));
    expect(await screen.findByRole("button", { name: "Aprovar bolsa" })).toBeInTheDocument();
  });

  it("não mostra Aprovar/Reprovar para uma bolsa já DISPONIVEL", async () => {
    renderPage(baseBag({ status: "DISPONIVEL" }));
    await screen.findByText("Bolsa O--2026-00001");
    expect(screen.queryByRole("button", { name: "Aprovar bolsa" })).not.toBeInTheDocument();
  });

  it("mostra Registrar utilização/Descartar para HOSPITAL quando a bolsa está DISPONIVEL", async () => {
    mockUser = { role: "HOSPITAL" };
    renderPage(baseBag({ status: "DISPONIVEL" }));

    expect(await screen.findByRole("button", { name: "Registrar utilização" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descartar" })).toBeInTheDocument();
  });

  it("não mostra nenhum botão de ação para uma bolsa já UTILIZADA", async () => {
    mockUser = { role: "HOSPITAL" };
    renderPage(baseBag({ status: "UTILIZADA" }));

    await screen.findByText("Bolsa O--2026-00001");
    expect(screen.queryByRole("button", { name: "Registrar utilização" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprovar bolsa" })).not.toBeInTheDocument();
  });

  it("clicar em Aprovar bolsa chama o endpoint correto e recarrega a bolsa", async () => {
    (api.post as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderPage(baseBag({ status: "COLETADA" }));

    await user.click(await screen.findByRole("button", { name: "Aprovar bolsa" }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/blood-bags/bag-1/approve", undefined));
  });
});
