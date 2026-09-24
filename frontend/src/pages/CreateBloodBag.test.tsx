import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateBloodBag from "./CreateBloodBag";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

let mockUser: { institution: { id: string; name: string } | null } | null = null;
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const institutions = [
  { id: "inst-hemo", name: "Hemocentro Central" },
  { id: "inst-hosp-a", name: "Hospital São Lucas" },
];

function renderPage() {
  (api.get as any).mockResolvedValue({ data: institutions });
  return render(
    <MemoryRouter>
      <CreateBloodBag />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CreateBloodBag — campo de instituição responsável", () => {
  it("mostra o seletor de instituição, populado a partir da API", async () => {
    mockUser = { institution: null };
    renderPage();

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/institutions"));
    expect(await screen.findByRole("option", { name: "Hemocentro Central" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Hospital São Lucas" })).toBeInTheDocument();
  });

  it("pré-seleciona a instituição do usuário logado (HEMOCENTRO/HOSPITAL)", async () => {
    mockUser = { institution: { id: "inst-hemo", name: "Hemocentro Central" } };
    renderPage();

    await screen.findByRole("option", { name: "Hemocentro Central" });
    expect(screen.getByLabelText("Instituição responsável")).toHaveValue("inst-hemo");
  });

  it("para um ADMIN (sem instituição), exige a seleção explícita antes de enviar", async () => {
    mockUser = { institution: null };
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("option", { name: "Hemocentro Central" });
    await user.click(screen.getByRole("button", { name: "Cadastrar bolsa" }));

    expect(screen.getByText("Selecione a instituição responsável pela coleta.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("envia instituicaoId no corpo da requisição ao cadastrar", async () => {
    mockUser = { institution: { id: "inst-hemo", name: "Hemocentro Central" } };
    (api.post as any).mockResolvedValue({ data: { codigo: "O--2026-00001" } });
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole("option", { name: "Hemocentro Central" });
    await user.click(screen.getByRole("button", { name: "Cadastrar bolsa" }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/blood-bags",
        expect.objectContaining({ instituicaoId: "inst-hemo" })
      )
    );
  });
});
